"""
FireDNA Analytics API Endpoints
Provides time-series, monthly climatology, and seasonal burning distributions.
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.config import settings
from app.models.models import SatelliteObservation
from app.schemas.schemas import ResponseMeta
from app.analytics.historical import HistoricalAnalyticsEngine

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/daily", response_model=dict)
def get_daily_analytics(
    bbox: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Daily time series of fire counts, FRP, and mean HAI score."""
    engine = HistoricalAnalyticsEngine(db)

    bbox_dict = None
    if bbox:
        try:
            parts = [float(p.strip()) for p in bbox.split(",")]
            if len(parts) == 4:
                bbox_dict = {"min_lat": parts[0], "min_lon": parts[1], "max_lat": parts[2], "max_lon": parts[3]}
        except ValueError:
            pass

    series = engine.get_daily_series(start_date=start_date, end_date=end_date, bbox=bbox_dict)

    peak_day = max(series, key=lambda x: x["total_count"]) if series else None

    return {
        "status": "success",
        "data": {
            "series": series,
            "summary": {
                "total_days": len(series),
                "peak_day": peak_day["date"] if peak_day else None,
                "peak_detections": peak_day["total_count"] if peak_day else 0,
                "mean_daily_detections": round(sum(s["total_count"] for s in series) / len(series), 1) if series else 0
            }
        },
        "meta": ResponseMeta()
    }


@router.get("/monthly", response_model=dict)
def get_monthly_analytics(
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Monthly fire activity distribution across the year."""
    engine = HistoricalAnalyticsEngine(db)
    distribution = engine.get_monthly_distribution(year=year)

    return {
        "status": "success",
        "data": {
            "monthly_distribution": distribution
        },
        "meta": ResponseMeta()
    }


@router.get("/seasonal", response_model=dict)
def get_seasonal_analytics(db: Session = Depends(get_db)):
    """Breakdown of fire activity across seasonal climatic windows (DJF, MAM, JJA, SON)."""
    engine = HistoricalAnalyticsEngine(db)
    seasonal = engine.get_seasonal_breakdown()

    return {
        "status": "success",
        "data": {
            "seasons": seasonal,
            "fire_season_insight": (
                "In South Asia, the highest agricultural and forest burning traditionally peaks in MAM "
                "(Pre-Monsoon dry season, March to May) and post-harvest autumn residue burning (October-November)."
            )
        },
        "meta": ResponseMeta()
    }


@router.get("/yearly", response_model=dict)
def get_yearly_analytics(db: Session = Depends(get_db)):
    """Annual aggregated statistics across available observation years."""
    rows = db.query(
        func.strftime("%Y", SatelliteObservation.acq_date).label("year"),
        SatelliteObservation.instrument,
        func.count(SatelliteObservation.id).label("count"),
        func.sum(SatelliteObservation.frp).label("sum_frp")
    ).group_by("year", SatelliteObservation.instrument).order_by("year").all()

    yearly_map = {}
    for r in rows:
        yr = r[0]
        if yr not in yearly_map:
            yearly_map[yr] = {"year": yr, "modis_count": 0, "viirs_count": 0, "total_count": 0, "total_frp": 0.0}
        inst = r[1]
        cnt = r[2] or 0
        frp = float(r[3] or 0.0)

        if inst == "MODIS":
            yearly_map[yr]["modis_count"] += cnt
        else:
            yearly_map[yr]["viirs_count"] += cnt

        yearly_map[yr]["total_count"] += cnt
        yearly_map[yr]["total_frp"] = round(yearly_map[yr]["total_frp"] + frp, 2)

    return {
        "status": "success",
        "data": {
            "yearly_trend": list(yearly_map.values())
        },
        "meta": ResponseMeta()
    }

