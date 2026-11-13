"""
FireDNA Data Cleaner & Standardizer
Parses raw NASA FIRMS CSV output into normalized records with preserved metadata.
"""

import csv
import io
import logging
from typing import List, Dict, Any
from datetime import datetime, date, time

logger = logging.getLogger("firedna.ingestion.data_cleaner")

# Mapping satellite codes to full names
SATELLITE_NAME_MAP = {
    "T": "Terra",
    "A": "Aqua",
    "Terra": "Terra",
    "Aqua": "Aqua",
    "N": "Suomi-NPP",
    "Suomi-NPP": "Suomi-NPP",
    "N20": "NOAA-20",
    "NOAA-20": "NOAA-20",
    "N21": "NOAA-21",
    "NOAA-21": "NOAA-21",
}


def _parse_float(value: Any) -> Any:
    if value is None:
        return None
    s = str(value).strip()
    if not s or s.lower() == "nan":
        return None
    return float(s)


class DataCleaner:
    """Parses and standardizes NASA FIRMS CSV records."""

    @staticmethod
    def parse_csv(csv_text: str, product: str) -> List[Dict[str, Any]]:
        """
        Parses raw FIRMS CSV text into a list of standardized observation dicts.
        Uses csv.DictReader for fast parsing across 45k+ South Asia observations.
        """
        if not csv_text or not csv_text.strip():
            logger.info("Empty CSV text received for product=%s", product)
            return []

        try:
            reader = csv.DictReader(io.StringIO(csv_text))
            if not reader.fieldnames:
                return []
            fieldnames = [c.strip().lower() for c in reader.fieldnames]
        except Exception as exc:
            logger.error("Failed to parse CSV header: %s", str(exc))
            return []

        records: List[Dict[str, Any]] = []
        prod_upper = product.upper()
        is_modis = "MODIS" in prod_upper
        instrument = "MODIS" if is_modis else "VIIRS"
        has_type_col = "type" in fieldnames

        for raw_row in reader:
            try:
                row = {
                    k.strip().lower(): (v.strip() if isinstance(v, str) else v)
                    for k, v in raw_row.items()
                    if k is not None
                }

                # Filter out non-fire detections for VIIRS if 'type' column is present
                # 0 = presumed vegetation fire, 1 = active volcano, 2 = static land, 3 = offshore
                if has_type_col and str(row.get("type", "")).strip() not in ("", "0"):
                    continue

                lat = _parse_float(row.get("latitude"))
                lon = _parse_float(row.get("longitude"))
                if lat is None or lon is None:
                    continue

                # Acquisition Date
                date_str = str(row.get("acq_date", "")).strip()
                acq_d = datetime.strptime(date_str, "%Y-%m-%d").date()

                # Acquisition Time formatting (HHMM -> HH:MM:00)
                time_str = str(row.get("acq_time", "")).strip().zfill(4)
                if len(time_str) >= 4 and time_str.isdigit():
                    formatted_time = f"{time_str[:2]}:{time_str[2:4]}:00"
                    acq_dt = datetime.combine(acq_d, time(int(time_str[:2]), int(time_str[2:4])))
                else:
                    formatted_time = None
                    acq_dt = datetime.combine(acq_d, time(0, 0))

                # Platform mapping
                raw_sat = str(row.get("satellite", "")).strip()
                if "NOAA21" in prod_upper:
                    platform = "NOAA-21"
                elif "NOAA20" in prod_upper:
                    platform = "NOAA-20"
                elif "SNPP" in prod_upper:
                    platform = "Suomi-NPP"
                else:
                    platform = SATELLITE_NAME_MAP.get(raw_sat, raw_sat or ("Terra" if is_modis else "Suomi-NPP"))

                # Brightness / Temperatures (MODIS uses 'brightness', VIIRS uses 'bright_ti4')
                brightness = _parse_float(row.get("brightness"))
                if brightness is None:
                    brightness = _parse_float(row.get("bright_ti4"))

                bright_t31 = _parse_float(row.get("bright_t31"))
                if bright_t31 is None:
                    bright_t31 = _parse_float(row.get("bright_ti5"))

                frp = _parse_float(row.get("frp"))
                conf_raw = str(row.get("confidence", "")).strip().lower()

                daynight = str(row.get("daynight", "")).strip().upper()
                if daynight not in ("D", "N"):
                    daynight = "D"

                scan = _parse_float(row.get("scan"))
                track = _parse_float(row.get("track"))
                version = str(row.get("version") or "NRT").strip()

                record = {
                    "instrument": instrument,
                    "satellite_platform": platform,
                    "source_product": product,
                    "latitude": round(lat, 5),
                    "longitude": round(lon, 5),
                    "acq_date": acq_d,
                    "acq_time": formatted_time,
                    "acq_datetime": acq_dt,
                    "brightness": brightness,
                    "bright_t31": bright_t31,
                    "frp": frp,
                    "confidence_raw": conf_raw,
                    "daynight": daynight,
                    "scan": scan,
                    "track": track,
                    "version": version,
                    "raw_metadata": row
                }
                records.append(record)

            except Exception as row_exc:
                logger.debug("Skipping malformed CSV row: %s", str(row_exc))
                continue

        return records

