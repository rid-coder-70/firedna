"""
FireDNA Anomalies API Endpoints
Serves statistical fire anomaly detections, Z-score rankings, and detection triggers.
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.config import settings
from app.models.models import ActivityAnomaly
from app.schemas.schemas import AnomalyItem, AnomalySummary, ResponseMeta
from app.analytics.anomaly_detection import AnomalyDetector

router = APIRouter(prefix="/anomalies", tags=["Anomalies"])


@router.get("", response_model=dict)
def get_anomalies(
    level: Optional[str] = Query(default=None, description="normal, elevated, high, extreme"),
    min_z_score: Optional[float] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, le=200),
    db: Session = Depends(get_db)
):
    """List detected statistical anomalies with historical baselines."""
    query = db.query(ActivityAnomaly)

    if level:
        query = query.filter(ActivityAnomaly.anomaly_level == level.lower())
    if min_z_score is not None:
        query = query.filter(ActivityAnomaly.z_score >= min_z_score)
    if start_date:
        query = query.filter(ActivityAnomaly.obs_date >= start_date)
    if end_date:
        query = query.filter(ActivityAnomaly.obs_date <= end_date)

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(desc(ActivityAnomaly.z_score), desc(ActivityAnomaly.obs_date)).offset(offset).limit(page_size).all()

    has_demo = any(i.is_demo_data for i in items) if items else False

    return {
        "status": "success",
        "data": {
            "anomalies": [AnomalyItem.from_orm(i) for i in items]
        },
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": (total + page_size - 1) // page_size if page_size else 1,
            "has_next": (offset + page_size) < total,
            "has_prev": page > 1
        },
        "meta": ResponseMeta(is_demo_data=has_demo)
    }


@router.get("/summary", response_model=dict)
def get_anomalies_summary(db: Session = Depends(get_db)):
    """Summary distribution of anomaly severities and top anomalous cells."""
    total = db.query(ActivityAnomaly).count()
    levels = ["normal", "elevated", "high", "extreme", "insufficient_data"]

    distribution = {}
    for lvl in levels:
        count = db.query(ActivityAnomaly).filter(ActivityAnomaly.anomaly_level == lvl).count()
        distribution[lvl] = count

    top_items = db.query(ActivityAnomaly).filter(
        ActivityAnomaly.z_score.isnot(None)
    ).order_by(desc(ActivityAnomaly.z_score)).limit(5).all()

    has_demo = db.query(ActivityAnomaly).filter(ActivityAnomaly.is_demo_data == True).first() is not None

    summary = AnomalySummary(
        total_anomalies=total,
        level_counts=distribution,
        top_anomalies=[AnomalyItem.from_orm(i) for i in top_items],
        is_demo_data=has_demo
    )

    return {
        "status": "success",
        "data": summary.dict(),
        "meta": ResponseMeta(is_demo_data=has_demo)
    }


@router.post("/detect", response_model=dict)
def trigger_anomaly_detection(
    target_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Triggers baseline computation and Z-score anomaly classification for a date."""
    detector = AnomalyDetector(db)
    calc_date = target_date or date.today()

    anomalies = detector.detect_anomalies_for_date(calc_date)

    return {
        "status": "success",
        "data": {
            "target_date": str(calc_date),
            "anomalies_evaluated": len(anomalies),
            "unusual_activity_count": sum(1 for a in anomalies if a.anomaly_level in ("elevated", "high", "extreme"))
        },
        "meta": ResponseMeta()
    }


@router.get("/{id}", response_model=dict)
def get_anomaly_by_id(id: int, db: Session = Depends(get_db)):
    """Fetch single anomaly detection record with full components."""
    item = db.query(ActivityAnomaly).filter(ActivityAnomaly.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Anomaly record not found")

    return {
        "status": "success",
        "data": AnomalyItem.from_orm(item).dict(),
        "meta": ResponseMeta(is_demo_data=item.is_demo_data)
    }

