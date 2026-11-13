"""
FireDNA Harmonization API Endpoints
Triggers grid aggregation, fetches multi-sensor comparisons, and explains scientific methodology.
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.core.database import get_db
from app.core.config import settings
from app.models.models import HarmonizedObservation
from app.schemas.schemas import (
    HarmonizationRunRequest, HarmonizedCellItem, ResponseMeta, SensorComparisonData
)
from app.services.harmonization_service import HarmonizationService
from app.harmonization.validation import HarmonizationValidator

router = APIRouter(prefix="/harmonization", tags=["Harmonization"])


@router.post("/run", response_model=dict)
def trigger_harmonization(
    request: HarmonizationRunRequest,
    db: Session = Depends(get_db)
):
    """
    Triggers spatial gridding and Harmonized Activity Index (HAI) computation.
    """
    service = HarmonizationService(db)
    bbox_dict = request.bbox.dict() if request.bbox else None

    run_id = service.run_harmonization(
        grid_resolution_deg=request.grid_resolution_deg,
        temporal_window_hours=request.temporal_window_hours,
        start_date=request.start_date,
        end_date=request.end_date,
        bbox=bbox_dict,
        recompute=request.recompute
    )

    return {
        "status": "success",
        "data": {
            "processing_run_id": run_id,
            "message": "Spatial and temporal harmonization completed successfully."
        },
        "meta": ResponseMeta()
    }


@router.get("/results", response_model=dict)
def get_harmonized_results(
    bbox: Optional[str] = Query(default=None, description="min_lat,min_lon,max_lat,max_lon"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=250, le=500),
    db: Session = Depends(get_db)
):
    """List harmonized grid cells with HAI scores and component breakdowns."""
    query = db.query(HarmonizedObservation)

    if bbox and isinstance(bbox, str):
        try:
            parts = [float(p.strip()) for p in bbox.split(",")]
            if len(parts) == 4:
                min_lat, min_lon, max_lat, max_lon = parts
                query = query.filter(
                    HarmonizedObservation.centroid_lat >= min_lat,
                    HarmonizedObservation.centroid_lat <= max_lat,
                    HarmonizedObservation.centroid_lon >= min_lon,
                    HarmonizedObservation.centroid_lon <= max_lon
                )
        except ValueError:
            pass

    if start_date:
        query = query.filter(HarmonizedObservation.obs_date >= start_date)
    if end_date:
        query = query.filter(HarmonizedObservation.obs_date <= end_date)

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(desc(HarmonizedObservation.obs_date), desc(HarmonizedObservation.hai_score)).offset(offset).limit(page_size).all()

    has_demo = any(i.is_demo_data for i in items) if items else False

    return {
        "status": "success",
        "data": {
            "harmonized_cells": [HarmonizedCellItem.from_orm(i) for i in items]
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


@router.get("/compare", response_model=dict)
def compare_sensors(
    grid_cell_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns side-by-side comparison of MODIS vs VIIRS vs Harmonized metrics.
    If no grid_cell_id is provided, returns data for the highest-activity cell.
    """
    if grid_cell_id:
        cells = db.query(HarmonizedObservation).filter(
            HarmonizedObservation.grid_cell_id == grid_cell_id
        ).order_by(HarmonizedObservation.obs_date).all()
    else:
        # Find multi-day cell with both MODIS and VIIRS detections and highest combined activity
        best_cell = (
            db.query(HarmonizedObservation.grid_cell_id)
            .group_by(HarmonizedObservation.grid_cell_id)
            .having(
                func.sum(HarmonizedObservation.modis_count) > 0,
                func.sum(HarmonizedObservation.total_viirs_count) > 0
            )
            .order_by(
                desc(func.count(HarmonizedObservation.id)),
                desc(func.sum(HarmonizedObservation.total_detections_all))
            )
            .first()
        )

        if best_cell:
            grid_cell_id = best_cell[0]
        else:
            top_cell = db.query(HarmonizedObservation).order_by(
                desc(HarmonizedObservation.hai_score)
            ).first()
            if not top_cell:
                return {
                    "status": "success",
                    "data": None,
                    "message": "No harmonized cells available yet. Run ingestion and harmonization first.",
                    "meta": ResponseMeta()
                }
            grid_cell_id = top_cell.grid_cell_id

        cells = db.query(HarmonizedObservation).filter(
            HarmonizedObservation.grid_cell_id == grid_cell_id
        ).order_by(HarmonizedObservation.obs_date).all()

    if not cells:
        raise HTTPException(status_code=404, detail=f"Grid cell {grid_cell_id} not found")

    dates = [str(c.obs_date) for c in cells]
    m_counts = [c.modis_count for c in cells]
    m_frps = [c.total_frp_modis for c in cells]
    v_counts = [c.total_viirs_count for c in cells]
    v_frps = [c.total_frp_viirs for c in cells]
    hai_scores = [c.hai_score for c in cells]

    target = cells[0]
    comparison = SensorComparisonData(
        grid_cell_id=grid_cell_id,
        centroid_lat=target.centroid_lat,
        centroid_lon=target.centroid_lon,
        dates=dates,
        modis={
            "daily_counts": m_counts,
            "daily_frp": m_frps,
            "platform": "Terra & Aqua",
            "spatial_resolution": "~1 km at nadir",
            "total_period_detections": sum(m_counts),
            "detection_threshold": "FRP > ~50 MW"
        },
        viirs={
            "daily_counts": v_counts,
            "daily_frp": v_frps,
            "platforms": ["Suomi-NPP", "NOAA-20", "NOAA-21"],
            "spatial_resolution": "375 m constant swath",
            "total_period_detections": sum(v_counts),
            "detection_threshold": "FRP > ~5 MW"
        },
        harmonized={
            "hai_scores": hai_scores,
            "grid_resolution_deg": target.grid_resolution_deg,
            "temporal_window_hours": target.temporal_window_hours,
            "methodology_version": settings.METHODOLOGY_VERSION,
            "is_experimental": True,
            "educational_note": (
                "Notice that VIIRS detects several times more hotspots than MODIS for the same cell "
                "because its 375m pixels are much smaller. FireDNA harmonizes both into a unified 0.1° grid."
            )
        }
    )

    return {
        "status": "success",
        "data": comparison.dict(),
        "meta": ResponseMeta(is_demo_data=target.is_demo_data)
    }


@router.get("/validation", response_model=dict)
def get_validation_metrics(db: Session = Depends(get_db)):
    """Computes spatial co-detection agreement and log-FRP correlation across all harmonized cells."""
    cells = db.query(HarmonizedObservation).all()
    cell_dicts = [
        {
            "modis_count": c.modis_count,
            "total_viirs_count": c.total_viirs_count,
            "total_frp_modis": c.total_frp_modis,
            "total_frp_viirs": c.total_frp_viirs
        }
        for c in cells
    ]

    metrics = HarmonizationValidator.evaluate_agreement(cell_dicts)
    return {
        "status": "success",
        "data": metrics,
        "meta": ResponseMeta()
    }


@router.get("/methodology", response_model=dict)
def get_methodology_documentation():
    """Returns complete scientific specification, formulas, weights, and transparency statements."""
    return {
        "status": "success",
        "data": {
            "version": settings.METHODOLOGY_VERSION,
            "grid_resolution_deg": settings.DEFAULT_GRID_RESOLUTION_DEG,
            "temporal_window_hours": settings.DEFAULT_TEMPORAL_WINDOW_HOURS,
            "hai_formula": "HAI = (w_count * S_count) + (w_frp * S_frp) + (w_conf * S_confidence)",
            "weights": {
                "count_weight": settings.HAI_COUNT_WEIGHT,
                "frp_weight": settings.HAI_FRP_WEIGHT,
                "confidence_weight": settings.HAI_CONFIDENCE_WEIGHT
            },
            "frp_combination": "max(MODIS_FRP, VIIRS_FRP) to avoid double-counting same fire event",
            "count_normalization": "Divided by 95th percentile, clipped to [0, 1]",
            "frp_normalization": "log(1 + FRP) min-max normalized",
            "anomaly_thresholds": {
                "normal": f"< {settings.ANOMALY_ELEVATED_Z}",
                "elevated": f"{settings.ANOMALY_ELEVATED_Z} - {settings.ANOMALY_HIGH_Z}",
                "high": f"{settings.ANOMALY_HIGH_Z} - {settings.ANOMALY_EXTREME_Z}",
                "extreme": f">= {settings.ANOMALY_EXTREME_Z}"
            },
            "scientific_disclaimer": (
                "The Harmonized Activity Index (HAI) is an experimental prototype metric created by FireDNA. "
                "It is not an official NASA product or certified wildfire danger score."
            )
        },
        "meta": ResponseMeta()
    }
