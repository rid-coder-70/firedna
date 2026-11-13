"""
FireDNA Database Seeding Script
Populates the database with realistic demonstration data for Bangladesh across the last 14 days,
executes spatial and temporal harmonization, and runs anomaly detection.
All synthetic records are explicitly tagged with is_demo_data=True.
"""

import asyncio
from datetime import date, timedelta
from app.core.database import init_db, SessionLocal
from app.services.ingestion_service import IngestionService
from app.services.harmonization_service import HarmonizationService
from app.analytics.anomaly_detection import AnomalyDetector


async def seed_database():
    print("Initializing database tables...")
    init_db()
    db = SessionLocal()

    ingestion_service = IngestionService(db)
    harmonization_service = HarmonizationService(db)
    anomaly_detector = AnomalyDetector(db)

    today = date.today()
    start_date = today - timedelta(days=14)

    print(f"Seeding demo satellite data from {start_date} to {today}...")

    # Ingest MODIS and VIIRS synthetic records
    log_ids = await ingestion_service.run_ingestion(
        products=["MODIS_NRT", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"],
        start_date=start_date,
        end_date=today,
        region_name="Bangladesh",
        force_demo=True
    )
    print(f"Ingestion runs created: {len(log_ids)}")

    # Run Harmonization Engine
    print("Running Spatial & Temporal Harmonization Engine (0.1 deg cells)...")
    proc_id = harmonization_service.run_harmonization(
        grid_resolution_deg=0.1,
        temporal_window_hours=24,
        start_date=start_date,
        end_date=today,
        recompute=True
    )
    print(f"Harmonization processing run completed: {proc_id}")

    # Run Anomaly Detection for each day in range
    print("Running Anomaly Detection across time range...")
    curr = start_date
    anomalies_count = 0
    while curr <= today:
        anomalies = anomaly_detector.detect_anomalies_for_date(curr)
        anomalies_count += len(anomalies)
        curr += timedelta(days=1)

    print(f"Total anomaly evaluations recorded: {anomalies_count}")
    print("\nDatabase seeding completed successfully! Ready for frontend presentation.")
    db.close()


if __name__ == "__main__":
    asyncio.run(seed_database())

