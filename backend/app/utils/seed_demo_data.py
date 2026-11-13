"""
FireDNA Real NASA Data Seeding Script
Removes any synthetic demo records and populates the database with official
NASA FIRMS South Asia datasets (MODIS Collection 6.1, VIIRS NOAA-20 & NOAA-21),
executes spatial and temporal harmonization, syncs NASA EONET/FIRMS events,
and runs Z-score anomaly detection across all observation dates.
"""

import asyncio
from datetime import date, timedelta
from app.core.config import settings
from app.core.database import init_db, SessionLocal
from app.models.models import (
    ActivityAnomaly,
    DataIngestionLog,
    HarmonizedObservation,
    HistoricalBaseline,
    NasaEvent,
    SatelliteObservation,
)
from app.services.ingestion_service import IngestionService
from app.services.harmonization_service import HarmonizationService
from app.analytics.anomaly_detection import AnomalyDetector


async def seed_database(clear_existing: bool = True):
    print("Initializing database tables...")
    init_db()
    db = SessionLocal()

    try:
        if clear_existing:
            demo_count = db.query(SatelliteObservation).filter(SatelliteObservation.is_demo_data == True).count()
            total_count = db.query(SatelliteObservation).count()
            if demo_count > 0 or total_count == 0:
                print(f"Clearing old/synthetic records (demo_rows={demo_count}, total={total_count})...")
                db.query(ActivityAnomaly).delete()
                db.query(HistoricalBaseline).delete()
                db.query(HarmonizedObservation).delete()
                db.query(SatelliteObservation).delete()
                db.query(DataIngestionLog).delete()
                db.query(NasaEvent).delete()
                db.commit()

        ingestion_service = IngestionService(db)
        harmonization_service = HarmonizationService(db)
        anomaly_detector = AnomalyDetector(db)

        today = date.today()
        start_date = today - timedelta(days=10)

        print("Ingesting official NASA FIRMS South Asia telemetry (MODIS_NRT, VIIRS_NOAA20_NRT, VIIRS_NOAA21_NRT)...")
        log_ids = await ingestion_service.run_ingestion(
            products=["MODIS_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"],
            bbox=settings.SOUTH_ASIA_BBOX,
            start_date=start_date,
            end_date=today,
            region_name="South Asia",
            force_demo=False
        )
        print(f"Ingestion runs created: {len(log_ids)}")

        print("Running Spatial & Temporal Harmonization Engine (0.1 deg cells across South Asia)...")
        proc_id = harmonization_service.run_harmonization(
            grid_resolution_deg=settings.DEFAULT_GRID_RESOLUTION_DEG,
            temporal_window_hours=settings.DEFAULT_TEMPORAL_WINDOW_HOURS,
            start_date=None,
            end_date=None,
            recompute=True
        )
        print(f"Harmonization processing run completed: {proc_id}")

        print("Syncing NASA EONET v3 & Top South Asia Fire Complex events...")
        eonet_count = await ingestion_service.sync_eonet_events(bbox=settings.SOUTH_ASIA_BBOX)
        print(f"NASA wildfire events synchronized: {eonet_count}")

        print("Running Z-Score Anomaly Detection across all South Asia dates...")
        anomalies_count = anomaly_detector.detect_anomalies_for_all_dates()
        print(f"Total anomaly evaluations recorded: {anomalies_count}")

        obs_total = db.query(SatelliteObservation).count()
        demo_remaining = db.query(SatelliteObservation).filter(SatelliteObservation.is_demo_data == True).count()
        print(f"\nReal NASA database ready! Observations={obs_total}, Synthetic/Demo={demo_remaining}")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
