"""
FireDNA Hotspots API Endpoints
Provides filtered queries, metadata inspection, and GeoJSON streams for satellite detections.
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.core.database import get_db
from app.core.config import settings
from app.models.models import SatelliteObservation
from app.schemas.schemas import (
    HotspotItem, HotspotSummaryResponse, ResponseMeta,
    GeoJSONFeatureCollection, GeoJSONFeature
)

router = APIRouter(prefix="/hotspots", tags=["Hotspots"])


@router.get("", response_model=dict)
def get_hotspots(
    bbox: Optional[str] = Query(default=None, description="min_lat,min_lon,max_lat,max_lon"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sensor: Optional[str] = Query(default=None, description="MODIS or VIIRS"),
    product: Optional[str] = None,
    confidence: Optional[str] = Query(default=None, description="low, nominal, high"),
    daynight: Optional[str] = Query(default=None, pattern="^[DN]$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, le=500),
    db: Session = Depends(get_db)
):
    """List fire hotspot observations with spatial and temporal filters."""
    query = db.query(SatelliteObservation)

    # Coerce int page / page_size if called as raw function
    p = page if isinstance(page, int) else 1
    ps = page_size if isinstance(page_size, int) else 50

    # 1. Bounding Box Filter
    if bbox and isinstance(bbox, str):
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) == 4:
                min_lat, min_lon, max_lat, max_lon = parts
                query = query.filter(
                    SatelliteObservation.latitude >= min_lat,
                    SatelliteObservation.latitude <= max_lat,
                    SatelliteObservation.longitude >= min_lon,
                    SatelliteObservation.longitude <= max_lon
                )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid bbox format. Use min_lat,min_lon,max_lat,max_lon")

    # 2. Date Filters
    if start_date and isinstance(start_date, date):
        query = query.filter(SatelliteObservation.acq_date >= start_date)
    if end_date and isinstance(end_date, date):
        query = query.filter(SatelliteObservation.acq_date <= end_date)

    # 3. Sensor / Product Filters
    if sensor and isinstance(sensor, str):
        query = query.filter(SatelliteObservation.instrument == sensor.upper())
    if product and isinstance(product, str):
        query = query.filter(SatelliteObservation.source_product == product)

    # 4. Confidence Filter
    if confidence and isinstance(confidence, str):
        query = query.filter(SatelliteObservation.confidence_category == confidence.lower())

    # 5. Day / Night Filter
    if daynight and isinstance(daynight, str):
        query = query.filter(SatelliteObservation.daynight == daynight.upper())

    total = query.count()
    offset = (p - 1) * ps
    items = query.order_by(desc(SatelliteObservation.acq_date), desc(SatelliteObservation.acq_time)).offset(offset).limit(ps).all()

    has_demo = any(i.is_demo_data for i in items) if items else False

    return {
        "status": "success",
        "data": {
            "hotspots": [HotspotItem.from_orm(i) for i in items]
        },
        "pagination": {
            "page": p,
            "page_size": ps,
            "total_items": total,
            "total_pages": (total + ps - 1) // ps if ps else 1,
            "has_next": (offset + ps) < total,
            "has_prev": p > 1
        },
        "meta": ResponseMeta(is_demo_data=has_demo)
    }


@router.get("/summary", response_model=dict)
def get_hotspot_summary(
    bbox: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Aggregate statistics for hotspots in the selected region and date range."""
    query = db.query(SatelliteObservation)

    if bbox and isinstance(bbox, str):
        try:
            parts = [float(p.strip()) for p in bbox.split(",")]
            if len(parts) == 4:
                min_lat, min_lon, max_lat, max_lon = parts
                query = query.filter(
                    SatelliteObservation.latitude >= min_lat,
                    SatelliteObservation.latitude <= max_lat,
                    SatelliteObservation.longitude >= min_lon,
                    SatelliteObservation.longitude <= max_lon
                )
        except ValueError:
            pass

    if start_date and isinstance(start_date, date):
        query = query.filter(SatelliteObservation.acq_date >= start_date)
    if end_date and isinstance(end_date, date):
        query = query.filter(SatelliteObservation.acq_date <= end_date)

    total_count = query.count()
    modis_count = query.filter(SatelliteObservation.instrument == "MODIS").count()
    viirs_count = query.filter(SatelliteObservation.instrument == "VIIRS").count()

    frp_stats = db.query(
        func.avg(SatelliteObservation.frp),
        func.max(SatelliteObservation.frp)
    ).filter(SatelliteObservation.id.in_(query.with_entities(SatelliteObservation.id))).first()

    date_stats = db.query(
        func.min(SatelliteObservation.acq_date),
        func.max(SatelliteObservation.acq_date)
    ).filter(SatelliteObservation.id.in_(query.with_entities(SatelliteObservation.id))).first()

    demo_exists = query.filter(SatelliteObservation.is_demo_data == True).first() is not None

    summary = HotspotSummaryResponse(
        total_count=total_count,
        modis_count=modis_count,
        viirs_count=viirs_count,
        mean_frp=round(float(frp_stats[0]), 2) if frp_stats and frp_stats[0] is not None else None,
        max_frp=round(float(frp_stats[1]), 2) if frp_stats and frp_stats[1] is not None else None,
        earliest_observation=date_stats[0] if date_stats else None,
        latest_observation=date_stats[1] if date_stats else None,
        bbox_applied=bbox if isinstance(bbox, str) else None,
        is_demo_data=demo_exists
    )

    return {
        "status": "success",
        "data": summary.dict(),
        "meta": ResponseMeta(is_demo_data=demo_exists)
    }


@router.get("/geojson", response_model=GeoJSONFeatureCollection)
def get_hotspots_geojson(
    bbox: Optional[str] = Query(default=None, description="min_lat,min_lon,max_lat,max_lon"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sensor: Optional[str] = None,
    confidence: Optional[str] = None,
    max_features: int = Query(default=2000, le=5000),
    db: Session = Depends(get_db)
):
    """Returns observations formatted as a GeoJSON FeatureCollection for Leaflet."""
    query = db.query(SatelliteObservation)

    mf = max_features if isinstance(max_features, int) else 2000

    if bbox and isinstance(bbox, str):
        try:
            parts = [float(p.strip()) for p in bbox.split(",")]
            if len(parts) == 4:
                min_lat, min_lon, max_lat, max_lon = parts
                query = query.filter(
                    SatelliteObservation.latitude >= min_lat,
                    SatelliteObservation.latitude <= max_lat,
                    SatelliteObservation.longitude >= min_lon,
                    SatelliteObservation.longitude <= max_lon
                )
        except ValueError:
            pass

    if start_date and isinstance(start_date, date):
        query = query.filter(SatelliteObservation.acq_date >= start_date)
    if end_date and isinstance(end_date, date):
        query = query.filter(SatelliteObservation.acq_date <= end_date)
    if sensor and isinstance(sensor, str):
        query = query.filter(SatelliteObservation.instrument == sensor.upper())
    if confidence and isinstance(confidence, str):
        query = query.filter(SatelliteObservation.confidence_category == confidence.lower())

    total_matching = query.count()
    items = query.order_by(desc(SatelliteObservation.acq_date)).limit(mf).all()

    features = []
    has_demo = False
    for item in items:
        if item.is_demo_data:
            has_demo = True

        feature = GeoJSONFeature(
            geometry={
                "type": "Point",
                "coordinates": [round(item.longitude, 5), round(item.latitude, 5)]
            },
            properties={
                "id": item.id,
                "instrument": item.instrument,
                "satellite_platform": item.satellite_platform,
                "source_product": item.source_product,
                "acq_date": str(item.acq_date),
                "acq_time": item.acq_time,
                "brightness": item.brightness,
                "frp": item.frp,
                "confidence_category": item.confidence_category,
                "confidence_normalized": item.confidence_normalized,
                "daynight": item.daynight,
                "is_demo_data": item.is_demo_data
            }
        )
        features.append(feature)

    return GeoJSONFeatureCollection(
        features=features,
        meta={
            "total_matching": total_matching,
            "returned_features": len(features),
            "truncated": total_matching > mf,
            "is_demo_data": has_demo,
            "data_attribution": "NASA FIRMS (https://firms.modaps.eosdis.nasa.gov/)"
        }
    )


@router.get("/{id}", response_model=dict)
def get_hotspot_by_id(id: int, db: Session = Depends(get_db)):
    """Fetch single hotspot observation with full raw metadata."""
    obs = db.query(SatelliteObservation).filter(SatelliteObservation.id == id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Hotspot observation not found")

    return {
        "status": "success",
        "data": {
            **HotspotItem.from_orm(obs).dict(),
            "raw_metadata": obs.raw_metadata
        },
        "meta": ResponseMeta(is_demo_data=obs.is_demo_data)
    }
