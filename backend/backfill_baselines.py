"""
FireDNA: build REAL historical baselines from NASA FIRMS Standard Processing (SP) archive.
Run from the backend folder:   python backfill_baselines.py
"""
import argparse, calendar, io, sys, time
from collections import defaultdict
from datetime import date

import httpx
import numpy as np
import pandas as pd

from app.core.config import settings
from app.core.database import SessionLocal, init_db
from app.harmonization.spatial import SpatialGridManager
from app.models.models import HarmonizedObservation, HistoricalBaseline
from app.analytics.anomaly_detection import AnomalyDetector

BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
STD_FLOOR = 1.0  # avoids huge Z-scores from near-zero variance


def fetch_chunk(key, source, bbox, start, days):
    url = f"{BASE}/{key}/{source}/{bbox}/{days}/{start.isoformat()}"
    for attempt in range(1, 4):
        try:
            r = httpx.get(url, timeout=90)
            if r.status_code == 200 and "latitude" in r.text[:200]:
                return pd.read_csv(io.StringIO(r.text))
            if r.status_code == 200 and not r.text.strip():
                return pd.DataFrame()
            raise RuntimeError(f"HTTP {r.status_code}: {r.text[:120]}")
        except Exception as exc:
            print(f"   retry {attempt}/3 for {source} {start}: {exc}")
            time.sleep(2 * attempt)
    raise RuntimeError(f"Failed {source} {start}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--month", type=int, default=date.today().month)
    ap.add_argument("--years", type=int, default=5)
    ap.add_argument("--sources", nargs="+", default=["MODIS_SP", "VIIRS_NOAA20_SP"])
    args = ap.parse_args()

    key = (settings.FIRMS_MAP_KEY or "").strip()
    if not key:
        sys.exit("FIRMS_MAP_KEY missing in .env")
    b = settings.BANGLADESH_BBOX
    bbox = f"{b['min_lon']},{b['min_lat']},{b['max_lon']},{b['max_lat']}"

    this_year = date.today().year
    years = list(range(this_year - args.years, this_year))
    month = args.month
    ndays = calendar.monthrange(2023, month)[1]
    grid = SpatialGridManager(settings.DEFAULT_GRID_RESOLUTION_DEG)

    counts = defaultdict(lambda: defaultdict(int))
    frps = defaultdict(list)
    years_ok = []

    for y in years:
        got_any = False
        for src in args.sources:
            print(f"{y} {src} ...", flush=True)
            for d0 in range(1, ndays + 1, 5):
                n = min(5, ndays - d0 + 1)
                df = fetch_chunk(key, src, bbox, date(y, month, d0), n)
                if df.empty:
                    continue
                got_any = True
                if "type" in df.columns:
                    df = df[df["type"] == 0]
                for _, row in df.iterrows():
                    cell = grid.assign_to_grid(float(row["latitude"]), float(row["longitude"]))["grid_cell_id"]
                    day = int(str(row["acq_date"])[8:10])
                    counts[cell][(y, day)] += 1
                    if pd.notna(row.get("frp")):
                        frps[cell].append(float(row["frp"]))
        if got_any:
            years_ok.append(y)

    if not years_ok:
        sys.exit("No historical data downloaded.")

    n_years = len(years_ok)
    total_cell_days = n_years * ndays
    print(f"\nYears with data: {years_ok} | cells with history: {len(counts)}")

    init_db()
    db = SessionLocal()
    try:
        db.query(HistoricalBaseline).filter(
            HistoricalBaseline.instrument == "ALL",
            HistoricalBaseline.month_of_year == month,
        ).delete()
        db.commit()

        rows = []
        for cell, per_day in counts.items():
            arr = np.zeros(total_cell_days)  # zero-fire days included
            for i, v in enumerate(per_day.values()):
                arr[i] = v
            fr = frps.get(cell, [])
            rows.append(HistoricalBaseline(
                grid_cell_id=cell, instrument="ALL", month_of_year=month,
                mean_count=round(float(arr.mean()), 4),
                std_count=round(max(float(arr.std(ddof=1)), STD_FLOOR), 4),
                median_count=float(np.median(arr)),
                p10_count=float(np.percentile(arr, 10)),
                p90_count=float(np.percentile(arr, 90)),
                mean_frp=round(float(np.mean(fr)), 3) if fr else 0.0,
                std_frp=round(max(float(np.std(fr)), 1.0), 3) if fr else 1.0,
                sample_years=n_years, sample_records=int(sum(per_day.values())),
                baseline_start_year=min(years_ok), baseline_end_year=max(years_ok),
                is_sufficient=n_years >= settings.MIN_BASELINE_YEARS,
                is_demo_data=False,
            ))
        db.add_all(rows)
        db.commit()
        print(f"Saved {len(rows)} baselines.")

        dates = [r[0] for r in db.query(HarmonizedObservation.obs_date).distinct().all()]
        det = AnomalyDetector(db)
        for d in sorted(dates):
            if d.month == month:
                det.detect_anomalies_for_date(d)
                print("anomalies recomputed for", d)
    finally:
        db.close()


if __name__ == "__main__":
    main()