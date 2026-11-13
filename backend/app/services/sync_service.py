"""
FireDNA scheduled sync: ingest latest MODIS/VIIRS hotspots, harmonize, detect anomalies.
"""
import logging
from datetime import date, timedelta
from app.core.config import settings
from app.core.database import SessionLocal
from app.services.ingestion_service import IngestionService
from app.services.harmonization_service import HarmonizationService
from app.analytics.anomaly_detection import AnomalyDetector

logger = logging.getLogger("firedna.services.sync")


async def run_sync() -> list:
    end = date.today()
    start = end - timedelta(days=settings.FIRMS_SYNC_LOOKBACK_DAYS)
    db = SessionLocal()
    try:
        ids = await IngestionService(db).run_ingestion(
            products=settings.FIRMS_SYNC_PRODUCTS,
            bbox=settings.BANGLADESH_BBOX,
            start_date=start,
            end_date=end,
        )
        HarmonizationService(db).run_harmonization(
            grid_resolution_deg=settings.DEFAULT_GRID_RESOLUTION_DEG,
            temporal_window_hours=settings.DEFAULT_TEMPORAL_WINDOW_HOURS,
            start_date=start,
            end_date=end,
            bbox=settings.BANGLADESH_BBOX,
            recompute=True,
        )
        AnomalyDetector(db).detect_anomalies_for_date(end)
        logger.info("Auto-sync finished, runs=%s", ids)
        return ids
    finally:
        db.close()