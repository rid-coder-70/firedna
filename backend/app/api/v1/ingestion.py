"""
FireDNA Ingestion API Endpoints
Triggers NASA FIRMS ingestion runs and queries ingestion audit logs.
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.config import settings
from app.schemas.schemas import (
    IngestionRunRequest, IngestionLogResponse, ResponseMeta,
    NasaEventItem, NasaOpenDataPlatform
)
from app.services.ingestion_service import IngestionService
from app.models.models import DataIngestionLog, NasaEvent

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])


@router.post("/run", response_model=dict)
async def trigger_ingestion(
    request: Optional[IngestionRunRequest] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Trigger NASA FIRMS ingestion run for specified products and region.
    If no API key is configured or force_demo is True, ingests synthetic demo data.
    Also runs spatial/temporal harmonization and anomaly detection automatically.
    """
    req = request or IngestionRunRequest()
    service = IngestionService(db)
    bbox_dict = req.bbox.dict() if req.bbox else settings.SOUTH_ASIA_BBOX

    # Synchronously run ingestion
    log_ids = await service.run_ingestion(
        products=req.products,
        bbox=bbox_dict,
        start_date=req.start_date,
        end_date=req.end_date,
        region_name=req.region_name,
        force_demo=req.force_demo
    )

    # Also auto-run harmonization and EONET sync so new hotspots immediately populate harmonized cells
    from app.services.harmonization_service import HarmonizationService
    from app.analytics.anomaly_detection import AnomalyDetector
    harm_service = HarmonizationService(db)
    harm_service.run_harmonization(
        grid_resolution_deg=settings.DEFAULT_GRID_RESOLUTION_DEG,
        temporal_window_hours=settings.DEFAULT_TEMPORAL_WINDOW_HOURS,
        start_date=req.start_date,
        end_date=req.end_date,
        bbox=bbox_dict,
        recompute=True
    )
    await service.sync_eonet_events(bbox=bbox_dict)
    detector = AnomalyDetector(db)
    if req.end_date:
        detector.detect_anomalies_for_date(req.end_date)
    else:
        detector.detect_anomalies_for_all_dates()

    is_demo = service.firms_client.is_demo_mode or req.force_demo
    return {
        "status": "success",
        "data": {
            "ingestion_run_ids": log_ids,
            "message": f"NASA FIRMS sync & harmonization completed for {len(log_ids)} satellite products across {req.region_name}.",
            "is_demo_data": is_demo
        },
        "meta": ResponseMeta(is_demo_data=is_demo)
    }


@router.get("/status", response_model=dict)
def get_ingestion_status(
    limit: int = Query(default=10, le=100),
    db: Session = Depends(get_db)
):
    """Returns the latest ingestion runs and overall service health status."""
    from app.ingestion.firms_client import FIRMSClient
    logs = db.query(DataIngestionLog).order_by(desc(DataIngestionLog.started_at)).limit(limit).all()
    latest_success = db.query(DataIngestionLog).filter(
        DataIngestionLog.status == "success"
    ).order_by(desc(DataIngestionLog.completed_at)).first()

    return {
        "status": "success",
        "data": {
            "runs": [IngestionLogResponse.from_orm(l) for l in logs],
            "last_successful_ingestion": latest_success.completed_at if latest_success else None,
            "is_demo_mode": FIRMSClient().is_demo_mode
        },
        "meta": ResponseMeta()
    }


@router.get("/logs", response_model=dict)
def get_ingestion_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, le=100),
    status: Optional[str] = None,
    product: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Paginated list of all ingestion audit logs."""
    query = db.query(DataIngestionLog)
    if status:
        query = query.filter(DataIngestionLog.status == status)
    if product:
        query = query.filter(DataIngestionLog.product == product)

    total = query.count()
    offset = (page - 1) * page_size
    logs = query.order_by(desc(DataIngestionLog.started_at)).offset(offset).limit(page_size).all()

    return {
        "status": "success",
        "data": [IngestionLogResponse.from_orm(l) for l in logs],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": (total + page_size - 1) // page_size if page_size else 1,
            "has_next": (offset + page_size) < total,
            "has_prev": page > 1
        },
        "meta": ResponseMeta()
    }


@router.get("/nasa-platforms", response_model=dict)
def get_nasa_open_data_platforms():
    """
    Catalog of official NASA platforms providing Earth Observation & Active Fire data.
    Documents data.nasa.gov, api.nasa.gov, earthdata.nasa.gov, firms, and eonet.
    """
    platforms = [
        {
            "name": "NASA Earthdata & FIRMS",
            "url": "https://firms.modaps.eosdis.nasa.gov/",
            "description": "Primary active fire telemetry source delivering MODIS and VIIRS (375m) NRT and Standard Processing archive CSVs.",
            "api_key_required": True,
            "free_registration_url": "https://firms.modaps.eosdis.nasa.gov/api/map_key/",
            "category": "Satellite Active Fire Detection",
            "role_in_firedna": "Core telemetry ingestion (MODIS ~1km and VIIRS 375m hotspots, FRP, confidence)."
        },
        {
            "name": "NASA EONET v3 (Earth Observatory Natural Event Tracker)",
            "url": "https://eonet.gsfc.nasa.gov/api/v3",
            "description": "Public NASA API providing curated natural event metadata (wildfires, volcanoes, storms) with zero authentication key required.",
            "api_key_required": False,
            "free_registration_url": None,
            "category": "Natural Event Tracking",
            "role_in_firedna": "Event-level wildfire contextual grounding alongside satellite pixel detections."
        },
        {
            "name": "NASA API Portal",
            "url": "https://api.nasa.gov/",
            "description": "NASA's developer clearinghouse hosting APIs for astronomy, Earth imagery, planetary rovers, and climate metrics.",
            "api_key_required": True,
            "free_registration_url": "https://api.nasa.gov/",
            "category": "Developer API Clearinghouse",
            "role_in_firedna": "Public developer registration and open endpoint directory (instant free API keys)."
        },
        {
            "name": "NASA Open Data Portal",
            "url": "https://data.nasa.gov/",
            "description": "NASA's comprehensive repository of publicly accessible scientific datasets across planetary, atmospheric, and space sciences.",
            "api_key_required": False,
            "free_registration_url": None,
            "category": "Scientific Open Data Catalog",
            "role_in_firedna": "Cross-reference for historical climatology baselines and atmospheric datasets."
        },
        {
            "name": "NASA JPL (Jet Propulsion Laboratory)",
            "url": "https://www.jpl.nasa.gov/",
            "description": "Robotic space exploration and Earth science research center pioneering spaceborne radar and thermal instrumentation.",
            "api_key_required": False,
            "free_registration_url": None,
            "category": "Planetary & Earth Science Research",
            "role_in_firedna": "Sensor calibration models and orbital geometry reference."
        }
    ]
    return {
        "status": "success",
        "data": platforms,
        "meta": ResponseMeta()
    }


@router.get("/availability", response_model=dict)
async def get_firms_availability(db: Session = Depends(get_db)):
    """Queries NASA FIRMS data availability across all supported NRT and SP archive products."""
    service = IngestionService(db)
    availability = await service.firms_client.get_data_availability()
    return {
        "status": "success",
        "data": availability,
        "meta": ResponseMeta(is_demo_data=service.firms_client.is_demo_mode)
    }


@router.get("/eonet/events", response_model=dict)
def get_eonet_events(
    status: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db)
):
    """List curated wildfire event records ingested from NASA EONET v3."""
    query = db.query(NasaEvent)
    if status:
        query = query.filter(NasaEvent.status == status)

    events = query.order_by(desc(NasaEvent.last_observed)).limit(limit).all()
    return {
        "status": "success",
        "data": [NasaEventItem.from_orm(e) for e in events],
        "meta": ResponseMeta()
    }


@router.post("/eonet/sync", response_model=dict)
async def sync_eonet_events(
    db: Session = Depends(get_db)
):
    """Synchronize curated wildfire events from the public NASA EONET v3 API and FIRMS complexes."""
    service = IngestionService(db)
    count = await service.sync_eonet_events(bbox=settings.SOUTH_ASIA_BBOX)
    return {
        "status": "success",
        "data": {
            "events_synced": count,
            "message": f"Successfully synchronized {count} wildfire events across South Asia."
        },
        "meta": ResponseMeta()
    }


