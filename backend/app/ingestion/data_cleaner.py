"""
FireDNA Data Cleaner & Standardizer
Parses raw NASA FIRMS CSV output into normalized records with preserved metadata.
"""

import io
import json
import logging
from typing import List, Dict, Any
from datetime import datetime, date, time
import pandas as pd

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


class DataCleaner:
    """Parses and standardizes NASA FIRMS CSV records."""

    @staticmethod
    def parse_csv(csv_text: str, product: str) -> List[Dict[str, Any]]:
        """
        Parses raw FIRMS CSV text into a list of standardized observation dicts.
        """
        if not csv_text or not csv_text.strip():
            logger.info("Empty CSV text received for product=%s", product)
            return []

        # Read CSV with pandas, treating all columns initially as string to avoid parse crashes
        try:
            df = pd.read_csv(io.StringIO(csv_text), dtype=str)
        except Exception as exc:
            logger.error("Failed to parse CSV with pandas: %s", str(exc))
            return []

        if df.empty:
            return []

        # Strip whitespace from column names
        df.columns = [c.strip().lower() for c in df.columns]

        # Filter out non-fire detections for VIIRS if 'type' column is present
        # FIRMS VIIRS type: 0 = presumed vegetation fire, 1 = active volcano, 2 = other static land source, 3 = offshore
        if "type" in df.columns:
            df = df[df["type"] == "0"]

        records: List[Dict[str, Any]] = []
        is_modis = "MODIS" in product.upper()
        instrument = "MODIS" if is_modis else "VIIRS"

        for _, row in df.iterrows():
            try:
                # Raw metadata backup
                raw_meta = row.to_dict()

                # Coordinates
                lat = float(row.get("latitude", 0.0))
                lon = float(row.get("longitude", 0.0))

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
                platform = SATELLITE_NAME_MAP.get(raw_sat, raw_sat or ("Terra" if is_modis else "Suomi-NPP"))

                # Brightness / Temperatures
                # MODIS uses 'brightness', VIIRS uses 'bright_ti4'
                brightness = None
                for b_col in ["brightness", "bright_ti4"]:
                    if b_col in row and pd.notna(row[b_col]) and row[b_col] != "":
                        brightness = float(row[b_col])
                        break

                bright_t31 = None
                for t_col in ["bright_t31", "bright_ti5"]:
                    if t_col in row and pd.notna(row[t_col]) and row[t_col] != "":
                        bright_t31 = float(row[t_col])
                        break

                # Fire Radiative Power (MW)
                frp = None
                if "frp" in row and pd.notna(row["frp"]) and row["frp"] != "":
                    frp = float(row["frp"])

                # Confidence (raw string)
                conf_raw = str(row.get("confidence", "")).strip().lower()

                # Day / Night
                daynight = str(row.get("daynight", "")).strip().upper()
                if daynight not in ("D", "N"):
                    daynight = "D"

                # Spatial scan/track
                scan = float(row["scan"]) if "scan" in row and pd.notna(row["scan"]) else None
                track = float(row["track"]) if "track" in row and pd.notna(row["track"]) else None
                version = str(row.get("version", "NRT")).strip()

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
                    "raw_metadata": raw_meta
                }
                records.append(record)

            except Exception as row_exc:
                logger.debug("Skipping malformed CSV row: %s", str(row_exc))
                continue

        return records

