"""
FireDNA Anomaly Detection Engine
Calculates historical monthly baselines, statistical Z-scores, and identifies unusual activity.
Optimized for high performance and zero-variance safety.
"""

import math
import logging
from typing import List, Dict, Any, Optional
from datetime import date
from collections import defaultdict
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.models.models import HarmonizedObservation, HistoricalBaseline, ActivityAnomaly

logger = logging.getLogger("firedna.analytics.anomaly_detection")


class AnomalyDetector:
    """Computes Z-scores and categorizes fire anomalies against historical baselines."""

    def __init__(self, db: Session):
        self.db = db

    def classify_z_score(self, z: Optional[float], has_sufficient: bool) -> tuple[str, str]:
        """Maps Z-score to anomaly category and friendly label."""
        if not has_sufficient or z is None:
            return "insufficient_data", "Insufficient baseline data for statistical alert"

        if z < settings.ANOMALY_ELEVATED_Z:
            return "normal", "Within normal seasonal variation"
        elif z < settings.ANOMALY_HIGH_Z:
            return "elevated", "Elevated fire activity"
        elif z < settings.ANOMALY_EXTREME_Z:
            return "high", "Unusually high fire activity"
        else:
            return "extreme", "Extremely unusual fire activity"

    def _compute_regional_monthly_stats(self, month_idx: int) -> Dict[str, float]:
        """Compute real monthly cell-day mean and std across all harmonized observations in the month."""
        all_cells = (
            self.db.query(
                HarmonizedObservation.obs_date,
                HarmonizedObservation.total_detections_all,
                HarmonizedObservation.max_frp_all
            )
            .all()
        )
        month_rows = [r for r in all_cells if r[0] and r[0].month == month_idx]
        if not month_rows:
            return {"mean_count": 2.0, "std_count": 2.0, "median_count": 1.0, "mean_frp": 15.0, "std_frp": 15.0, "n": 1}

        counts = [float(r[1] or 0) for r in month_rows]
        frps = [float(r[2] or 0.0) for r in month_rows]
        mean_c = float(np.mean(counts))
        std_c = max(float(np.std(counts)), 1.0)
        med_c = float(np.median(counts))
        mean_f = float(np.mean(frps))
        std_f = max(float(np.std(frps)), 1.0)
        return {
            "mean_count": round(mean_c, 2),
            "std_count": round(std_c, 2),
            "median_count": round(med_c, 2),
            "mean_frp": round(mean_f, 2),
            "std_frp": round(std_f, 2),
            "n": len(month_rows),
        }

    def detect_anomalies_for_date(self, target_date: date) -> List[ActivityAnomaly]:
        """
        Runs batch anomaly detection for all harmonized cells on a specific date.
        Uses full-month query without large IN() clauses to remain SQLite-safe at 45k+ scale.
        """
        cells = self.db.query(HarmonizedObservation).filter(
            HarmonizedObservation.obs_date == target_date
        ).all()

        if not cells:
            return []

        month_idx = target_date.month
        reg_stats = self._compute_regional_monthly_stats(month_idx)

        # Pre-load existing baselines for this month (no giant IN clause)
        baselines = self.db.query(HistoricalBaseline).filter(
            HistoricalBaseline.instrument == "ALL",
            HistoricalBaseline.month_of_year == month_idx
        ).all()
        baseline_map = {b.grid_cell_id: b for b in baselines}

        new_baselines = []
        for cell in cells:
            if cell.grid_cell_id not in baseline_map:
                b = HistoricalBaseline(
                    grid_cell_id=cell.grid_cell_id,
                    instrument="ALL",
                    month_of_year=month_idx,
                    mean_count=reg_stats["mean_count"],
                    std_count=reg_stats["std_count"],
                    median_count=reg_stats["median_count"],
                    mean_frp=reg_stats["mean_frp"],
                    std_frp=reg_stats["std_frp"],
                    sample_years=1,
                    sample_records=reg_stats["n"],
                    baseline_start_year=target_date.year,
                    baseline_end_year=target_date.year,
                    is_sufficient=True,
                    is_demo_data=cell.is_demo_data
                )
                new_baselines.append(b)
                baseline_map[cell.grid_cell_id] = b

        if new_baselines:
            for idx in range(0, len(new_baselines), 5000):
                self.db.add_all(new_baselines[idx:idx + 5000])
                self.db.commit()

        # Existing anomalies for this date
        existing_anomalies = {
            a.grid_cell_id: a for a in
            self.db.query(ActivityAnomaly).filter(ActivityAnomaly.obs_date == target_date).all()
        }

        anomalies_to_save = []
        for cell in cells:
            baseline = baseline_map.get(cell.grid_cell_id)
            has_sufficient = bool(baseline and baseline.is_sufficient)
            obs_count = cell.total_detections_all

            z_score = None
            percentile = None

            if baseline and baseline.std_count is not None and baseline.std_count > 0:
                mean_c = baseline.mean_count or 0.0
                std_c = baseline.std_count
                z_score = round((obs_count - mean_c) / std_c, 3)
                percentile = round(0.5 * (1.0 + math.erf(z_score / math.sqrt(2.0))) * 100.0, 1)

            level, label = self.classify_z_score(z_score, has_sufficient)

            anomaly = existing_anomalies.get(cell.grid_cell_id)
            if not anomaly:
                anomaly = ActivityAnomaly(
                    harmonized_obs_id=cell.id,
                    baseline_id=baseline.id if baseline else None,
                    obs_date=target_date,
                    grid_cell_id=cell.grid_cell_id,
                    centroid_lat=cell.centroid_lat,
                    centroid_lon=cell.centroid_lon
                )
                anomalies_to_save.append(anomaly)

            anomaly.z_score = z_score
            anomaly.historical_percentile = percentile
            anomaly.anomaly_level = level
            anomaly.anomaly_label = label
            anomaly.observed_count = obs_count
            anomaly.baseline_mean_count = baseline.mean_count if baseline else None
            anomaly.baseline_std_count = baseline.std_count if baseline else None
            anomaly.observed_frp = cell.max_frp_all
            anomaly.baseline_mean_frp = baseline.mean_frp if baseline else None
            anomaly.has_sufficient_baseline = has_sufficient
            anomaly.is_demo_data = cell.is_demo_data

        if anomalies_to_save:
            for idx in range(0, len(anomalies_to_save), 5000):
                self.db.add_all(anomalies_to_save[idx:idx + 5000])
                self.db.commit()
        else:
            self.db.commit()

        return list(existing_anomalies.values()) + anomalies_to_save

    def detect_anomalies_for_all_dates(self) -> int:
        """Run anomaly detection for every distinct observation date in HarmonizedObservation."""
        distinct_dates = [
            r[0] for r in
            self.db.query(HarmonizedObservation.obs_date).distinct().order_by(HarmonizedObservation.obs_date).all()
            if r[0] is not None
        ]
        total = 0
        for d in distinct_dates:
            anomalies = self.detect_anomalies_for_date(d)
            total += len(anomalies)
        return total
