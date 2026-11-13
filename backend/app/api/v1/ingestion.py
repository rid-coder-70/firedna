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
from app.schemas.schemas import IngestionRunRequest, IngestionLogResponse, ResponseMeta
from app.services.ingestion_service import IngestionService
from app.models.models import DataIngestionLog

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
    bbox_dict = req.bbox.dict() if req.bbox else settings.BANGLADESH_BBOX

    # Synchronously run ingestion
    log_ids = await service.run_ingestion(
        products=req.products,
        bbox=bbox_dict,
        start_date=req.start_date,
        end_date=req.end_date,
        region_name=req.region_name,
        force_demo=req.force_demo
    )

    # Also auto-run harmonization so new hotspots immediately populate harmonized cells
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
    detector = AnomalyDetector(db)
    detector.detect_anomalies_for_date(req.end_date or date.today())

    return {
        "status": "success",
        "data": {
            "ingestion_run_ids": log_ids,
            "message": f"NASA FIRMS sync & harmonization completed for {len(log_ids)} satellite products.",
            "is_demo_data": service.firms_client.is_demo_mode or req.force_demo
        },
        "meta": ResponseMeta(is_demo_data=service.firms_client.is_demo_mode or req.force_demo)
    }


@router.get("/status", response_model=dict)
def get_ingestion_status(
    limit: int = Query(default=10, le=100),
    db: Session = Depends(get_db)
):
    """Returns the latest ingestion runs and overall service health status."""
    logs = db.query(DataIngestionLog).order_by(desc(DataIngestionLog.started_at)).limit(limit).all()
    latest_success = db.query(DataIngestionLog).filter(
        DataIngestionLog.status == "success"
    ).order_by(desc(DataIngestionLog.completed_at)).first()

    return {
        "status": "success",
        "data": {
            "runs": [IngestionLogResponse.from_orm(l) for l in logs],
            "last_successful_ingestion": latest_success.completed_at if latest_success else None,
            "is_demo_mode": not bool(settings.FIRMS_MAP_KEY and settings.FIRMS_MAP_KEY.strip())
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

