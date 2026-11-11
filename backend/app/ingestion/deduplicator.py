"""
FireDNA Deduplication Engine
Filters out duplicate records within ingestion batches and against existing database records.
Preserves spatially close but distinct satellite observations.
"""

from typing import List, Dict, Any, Set, Tuple
from sqlalchemy.orm import Session
from app.models.models import SatelliteObservation


class Deduplicator:
    """Detects and removes true duplicate satellite observations."""

    @staticmethod
    def _create_key(rec: Dict[str, Any]) -> Tuple:
        return (
            round(float(rec["latitude"]), 5),
            round(float(rec["longitude"]), 5),
            str(rec["acq_date"]),
            str(rec.get("acq_time") or ""),
            str(rec["instrument"]),
            str(rec["satellite_platform"])
        )

    @classmethod
    def deduplicate(
        cls,
        records: List[Dict[str, Any]],
        db: Session,
        check_database: bool = True
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Deduplicates records within the current batch and optionally against DB.
        Returns: (unique_records, count_skipped)
        """
        if not records:
            return [], 0

        unique_in_batch: List[Dict[str, Any]] = []
        seen_keys: Set[Tuple] = set()
        skipped_count = 0

        for r in records:
            key = cls._create_key(r)
            if key in seen_keys:
                skipped_count += 1
                continue
            seen_keys.add(key)
            unique_in_batch.append(r)

        if not check_database or not unique_in_batch:
            return unique_in_batch, skipped_count

        # Check existing in DB for the date range
        dates = {r["acq_date"] for r in unique_in_batch}
        min_date, max_date = min(dates), max(dates)

        existing_obs = db.query(
            SatelliteObservation.latitude,
            SatelliteObservation.longitude,
            SatelliteObservation.acq_date,
            SatelliteObservation.acq_time,
            SatelliteObservation.instrument,
            SatelliteObservation.satellite_platform
        ).filter(
            SatelliteObservation.acq_date >= min_date,
            SatelliteObservation.acq_date <= max_date
        ).all()

        existing_keys = {
            (
                round(float(e[0]), 5),
                round(float(e[1]), 5),
                str(e[2]),
                str(e[3] or ""),
                str(e[4]),
                str(e[5])
            )
            for e in existing_obs
        }

        final_records: List[Dict[str, Any]] = []
        for r in unique_in_batch:
            key = cls._create_key(r)
            if key in existing_keys:
                skipped_count += 1
                continue
            final_records.append(r)

        return final_records, skipped_count

