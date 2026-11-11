"""
FireDNA Export API Endpoints
Provides direct CSV and GeoJSON downloads for scientific researchers and GIS tools.
Includes mandatory NASA FIRMS attribution in all exported datasets.
"""

import io
import csv
import json
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.models import SatelliteObservation
from app.analytics.historical import HistoricalAnalyticsEngine

router = APIRouter(prefix="/export", tags=["Exports"])

ATTRIBUTION_TEXT = "NASA FIRMS — Fire Information for Resource Management System (https://firms.modaps.eosdis.nasa.gov/)"


@router.get("/hotspots.csv")
def export_hotspots_csv(
    bbox: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sensor: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Download filtered hotspot observations as a CSV spreadsheet."""
    query = db.query(SatelliteObservation)

    if bbox:
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

    if start_date:
        query = query.filter(SatelliteObservation.acq_date >= start_date)
    if end_date:
        query = query.filter(SatelliteObservation.acq_date <= end_date)
    if sensor:
        query = query.filter(SatelliteObservation.instrument == sensor.upper())

    records = query.order_by(desc(SatelliteObservation.acq_date)).limit(10000).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "id", "instrument", "satellite_platform", "source_product",
        "latitude", "longitude", "acq_date", "acq_time",
        "brightness_k", "frp_mw", "confidence_category", "confidence_normalized",
        "daynight", "is_demo_data", "data_provenance_attribution"
    ])

    for r in records:
        writer.writerow([
            r.id, r.instrument, r.satellite_platform, r.source_product,
            r.latitude, r.longitude, str(r.acq_date), r.acq_time or "",
            r.brightness or "", r.frp or "", r.confidence_category or "", r.confidence_normalized or "",
            r.daynight or "", str(r.is_demo_data).lower(), ATTRIBUTION_TEXT
        ])

    csv_content = output.getvalue()
    filename = f"firedna_hotspots_{date.today().strftime('%Y%m%d')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/hotspots.geojson")
def export_hotspots_geojson(
    bbox: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Download filtered hotspot observations as an RFC 7946 GeoJSON file."""
    query = db.query(SatelliteObservation)

    if bbox:
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

    if start_date:
        query = query.filter(SatelliteObservation.acq_date >= start_date)
    if end_date:
        query = query.filter(SatelliteObservation.acq_date <= end_date)

    records = query.order_by(desc(SatelliteObservation.acq_date)).limit(5000).all()

    features = []
    for r in records:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [r.longitude, r.latitude]
            },
            "properties": {
                "id": r.id,
                "instrument": r.instrument,
                "satellite_platform": r.satellite_platform,
                "acq_date": str(r.acq_date),
                "acq_time": r.acq_time,
                "frp": r.frp,
                "confidence_category": r.confidence_category,
                "is_demo_data": r.is_demo_data,
                "attribution": ATTRIBUTION_TEXT
            }
        })

    geojson_data = {
        "type": "FeatureCollection",
        "features": features,
        "attribution": ATTRIBUTION_TEXT
    }

    content = json.dumps(geojson_data, indent=2)
    filename = f"firedna_hotspots_{date.today().strftime('%Y%m%d')}.geojson"

    return Response(
        content=content,
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/analytics.csv")
def export_analytics_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Download daily analytics trends as a CSV file."""
    engine = HistoricalAnalyticsEngine(db)
    series = engine.get_daily_series(start_date=start_date, end_date=end_date)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "date", "modis_count", "viirs_count", "total_hotspots",
        "total_frp_modis_mw", "total_frp_viirs_mw", "mean_hai_score", "attribution"
    ])

    for s in series:
        writer.writerow([
            s["date"], s["modis_count"], s["viirs_count"], s["total_count"],
            s["total_frp_modis"], s["total_frp_viirs"], s["hai_mean"] or "", ATTRIBUTION_TEXT
        ])

    csv_content = output.getvalue()
    filename = f"firedna_daily_analytics_{date.today().strftime('%Y%m%d')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
