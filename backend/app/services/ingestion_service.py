"""
FireDNA Ingestion Service
Orchestrates fetching, cleaning, validating, and saving satellite observations.
"""

import time
import logging
from datetime import date, datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import DataIngestionLog, SatelliteObservation
from app.ingestion.firms_client import FIRMSClient
from app.ingestion.data_cleaner import DataCleaner
from app.ingestion.data_validator import DataValidator
from app.ingestion.deduplicator import Deduplicator

logger = logging.getLogger("firedna.services.ingestion")


class IngestionService:
    """Service layer managing NASA FIRMS data ingestion runs."""

    def __init__(self, db: Session):
        self.db = db
        self.firms_client = FIRMSClient()

    async def run_ingestion(
        self,
        products: Optional[List[str]] = None,
        bbox: Optional[dict] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        region_name: str = "Bangladesh",
        force_demo: bool = False
    ) -> List[str]:
        """
        Runs ingestion for a list of FIRMS products.
        Returns list of created DataIngestionLog IDs.
        """
        products_to_run = products or ["MODIS_NRT", "VIIRS_SNPP_NRT"]
        target_bbox = bbox or settings.BANGLADESH_BBOX
        target_start = start_date or date.today()
        target_end = end_date or target_start

        log_ids: List[str] = []

        for prod in products_to_run:
            start_time = time.time()
            log_entry = DataIngestionLog(
                product=prod,
                region_name=region_name,
                bbox_min_lat=target_bbox["min_lat"],
                bbox_min_lon=target_bbox["min_lon"],
                bbox_max_lat=target_bbox["max_lat"],
                bbox_max_lon=target_bbox["max_lon"],
                date_range_start=target_start,
                date_range_end=target_end,
                status="running",
                parameters={
                    "bbox": target_bbox,
                    "start_date": str(target_start),
                    "end_date": str(target_end),
                    "region": region_name
                }
            )
            self.db.add(log_entry)
            self.db.commit()
            self.db.refresh(log_entry)
            log_ids.append(log_entry.id)

            try:
                # 1. Fetch CSV
                csv_text, is_demo, status_code = await self.firms_client.fetch_area_csv(
                    product=prod,
                    bbox=target_bbox,
                    start_date=target_start,
                    end_date=target_end,
                    force_demo=force_demo
                )
                log_entry.api_response_code = status_code
                log_entry.is_demo_data = is_demo

                # 2. Parse & Standardize
                raw_records = DataCleaner.parse_csv(csv_text, prod)
                log_entry.records_fetched = len(raw_records)

                # 3. Validate & Normalize
                validated_records = DataValidator.validate_and_normalize(raw_records)

                # 4. Deduplicate
                unique_records, skipped = Deduplicator.deduplicate(
                    validated_records,
                    self.db,
                    check_database=True
                )
                log_entry.records_skipped = skipped + (len(raw_records) - len(validated_records))

                # 5. Insert Observations
                obs_objects = []
                for rec in unique_records:
                    obs = SatelliteObservation(
                        ingestion_run_id=log_entry.id,
                        instrument=rec["instrument"],
                        satellite_platform=rec["satellite_platform"],
                        source_product=rec["source_product"],
                        latitude=rec["latitude"],
                        longitude=rec["longitude"],
                        acq_date=rec["acq_date"],
                        acq_time=rec["acq_time"],
                        acq_datetime=rec["acq_datetime"],
                        brightness=rec["brightness"],
                        bright_t31=rec["bright_t31"],
                        frp=rec["frp"],
                        daynight=rec["daynight"],
                        confidence_raw=rec["confidence_raw"],
                        confidence_normalized=rec["confidence_normalized"],
                        confidence_category=rec["confidence_category"],
                        scan=rec["scan"],
                        track=rec["track"],
                        version=rec["version"],
                        is_demo_data=is_demo,
                        raw_metadata=rec["raw_metadata"]
                    )
                    obs_objects.append(obs)

                if obs_objects:
                    self.db.add_all(obs_objects)
                    self.db.commit()

                log_entry.records_inserted = len(obs_objects)
                log_entry.status = "success"
                log_entry.completed_at = datetime.now(timezone.utc)
                self.db.commit()

                logger.info("Ingestion completed for %s: fetched=%d, inserted=%d, skipped=%d in %.2fs",
                            prod, log_entry.records_fetched, log_entry.records_inserted, log_entry.records_skipped, time.time() - start_time)

            except Exception as exc:
                self.db.rollback()
                log_entry.status = "failed"
                log_entry.error_message = str(exc)
                log_entry.completed_at = datetime.now(timezone.utc)
                self.db.commit()
                logger.error("Ingestion failed for %s: %s", prod, str(exc), exc_info=True)

        return log_ids

