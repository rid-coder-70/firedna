"""
FireDNA Data Validator
Enforces physical and geographical constraints on satellite records and normalizes confidence.
"""

import logging
from typing import List, Dict, Any, Tuple
from datetime import date

logger = logging.getLogger("firedna.ingestion.data_validator")


class DataValidator:
    """Validates observation fields and applies normalization."""

    @staticmethod
    def normalize_confidence(conf_raw: str, instrument: str) -> Tuple[float, str]:
        """
        Normalizes confidence across different sensor reporting formats.

        MODIS: categorical 'low', 'nominal', 'high'
        VIIRS: integer percentage (0-100) or 'low', 'nominal', 'high'
        """
        c_str = str(conf_raw).strip().lower()

        # If numeric (typical VIIRS)
        if c_str.isdigit():
            val = float(c_str)
            norm_val = round(min(max(val / 100.0, 0.0), 1.0), 2)
            if val < 30.0:
                cat = "low"
            elif val < 80.0:
                cat = "nominal"
            else:
                cat = "high"
            return norm_val, cat

        # Categorical (typical MODIS or fallback)
        if c_str == "high" or c_str == "h":
            return 1.0, "high"
        elif c_str in ("nominal","n", "med", "medium", "m"):
            return 0.66, "nominal"
        elif c_str in ("low", "l"):
            return 0.33, "low"

        # Default fallback if unparseable
        return 0.50, "nominal"

    @classmethod
    def validate_and_normalize(cls, raw_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Validates records against physical ranges and adds normalized confidence fields.
        Discards invalid coordinates or dates.
        """
        valid_records: List[Dict[str, Any]] = []
        today = date.today()

        for rec in raw_records:
            lat = rec.get("latitude")
            lon = rec.get("longitude")
            acq_d = rec.get("acq_date")

            # 1. Geographic Coordinate Bounds
            if lat is None or not (-90.0 <= lat <= 90.0):
                continue
            if lon is None or not (-180.0 <= lon <= 180.0):
                continue

            # 2. Date sanity check
            if not isinstance(acq_d, date) or acq_d > today:
                continue

            # 3. FRP physical check (negative values are invalid)
            frp = rec.get("frp")
            if frp is not None and frp < 0.0:
                rec["frp"] = None

            # 4. Brightness temperature physical range (Kelvin)
            brightness = rec.get("brightness")
            if brightness is not None and not (200.0 <= brightness <= 2000.0):
                rec["brightness"] = None

            # 5. Normalize confidence
            conf_norm, conf_cat = cls.normalize_confidence(
                rec.get("confidence_raw", ""),
                rec.get("instrument", "MODIS")
            )
            rec["confidence_normalized"] = conf_norm
            rec["confidence_category"] = conf_cat

            valid_records.append(rec)

        return valid_records

