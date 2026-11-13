"""
FireDNA Pydantic Request & Response Schemas
Type-checked models for API endpoints under /api/v1.
"""

from typing import List, Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# Common / Meta
# -----------------------------------------------------------------------------
class ResponseMeta(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"
    is_demo_data: bool = False
    data_attribution: str = "NASA FIRMS (https://firms.modaps.eosdis.nasa.gov/)"


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool


class BoundingBoxInput(BaseModel):
    min_lat: float = Field(..., ge=-90.0, le=90.0)
    min_lon: float = Field(..., ge=-180.0, le=180.0)
    max_lat: float = Field(..., ge=-90.0, le=90.0)
    max_lon: float = Field(..., ge=-180.0, le=180.0)


# -----------------------------------------------------------------------------
# Ingestion Schemas
# -----------------------------------------------------------------------------
class IngestionRunRequest(BaseModel):
    products: List[str] = Field(default=["MODIS_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"])
    bbox: Optional[BoundingBoxInput] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    region_name: str = "South Asia"
    force_demo: bool = False


class IngestionLogResponse(BaseModel):
    id: str
    product: str
    region_name: Optional[str]
    status: str
    records_fetched: int
    records_inserted: int
    records_skipped: int
    is_demo_data: bool
    started_at: datetime
    completed_at: Optional[datetime]
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Hotspot Schemas
# -----------------------------------------------------------------------------
class HotspotItem(BaseModel):
    id: int
    instrument: str
    satellite_platform: str
    source_product: str
    latitude: float
    longitude: float
    acq_date: date
    acq_time: Optional[str]
    acq_datetime: Optional[datetime]
    brightness: Optional[float]
    bright_t31: Optional[float]
    frp: Optional[float]
    confidence_raw: Optional[str]
    confidence_normalized: Optional[float]
    confidence_category: Optional[str]
    daynight: Optional[str]
    is_demo_data: bool

    class Config:
        from_attributes = True


class HotspotSummaryResponse(BaseModel):
    total_count: int
    modis_count: int
    viirs_count: int
    mean_frp: Optional[float]
    max_frp: Optional[float]
    earliest_observation: Optional[date]
    latest_observation: Optional[date]
    bbox_applied: Optional[str]
    is_demo_data: bool


# -----------------------------------------------------------------------------
# GeoJSON Output Schemas
# -----------------------------------------------------------------------------
class GeoJSONPointGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [lon, lat]


class GeoJSONPolygonGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]  # [[[lon, lat], ...]]


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
    meta: Dict[str, Any]


# -----------------------------------------------------------------------------
# Harmonization Schemas
# -----------------------------------------------------------------------------
class HarmonizationRunRequest(BaseModel):
    grid_resolution_deg: float = 0.1
    temporal_window_hours: int = 24
    bbox: Optional[BoundingBoxInput] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    recompute: bool = False


class HarmonizedCellItem(BaseModel):
    id: int
    grid_cell_id: str
    grid_resolution_deg: float
    cell_lat_min: float
    cell_lat_max: float
    cell_lon_min: float
    cell_lon_max: float
    centroid_lat: float
    centroid_lon: float
    obs_date: date
    modis_count: int
    viirs_snpp_count: int
    viirs_noaa20_count: int
    viirs_noaa21_count: int
    total_viirs_count: int
    total_detections_all: int
    total_frp_modis: float
    total_frp_viirs: float
    max_frp_all: float
    hai_score: Optional[float]
    hai_is_experimental: bool = True
    mean_confidence_modis: Optional[float]
    mean_confidence_viirs: Optional[float]
    is_demo_data: bool

    class Config:
        from_attributes = True


class SensorComparisonData(BaseModel):
    grid_cell_id: str
    centroid_lat: float
    centroid_lon: float
    dates: List[str]
    modis: Dict[str, Any]
    viirs: Dict[str, Any]
    harmonized: Dict[str, Any]


# -----------------------------------------------------------------------------
# Analytics Schemas
# -----------------------------------------------------------------------------
class DailyAnalyticsItem(BaseModel):
    date: date
    modis_count: int
    viirs_count: int
    total_count: int
    total_frp_modis: float
    total_frp_viirs: float
    hai_mean: Optional[float]


class MonthlyAnalyticsItem(BaseModel):
    month: int
    month_name: str
    modis_count: int
    viirs_count: int
    total_count: int
    mean_frp: Optional[float]


class SeasonalAnalyticsItem(BaseModel):
    season: str  # DJF, MAM, JJA, SON
    name: str
    modis_count: int
    viirs_count: int
    total_count: int
    mean_daily_count: float


# -----------------------------------------------------------------------------
# Anomaly Schemas
# -----------------------------------------------------------------------------
class AnomalyItem(BaseModel):
    id: int
    obs_date: date
    grid_cell_id: str
    centroid_lat: float
    centroid_lon: float
    z_score: Optional[float]
    historical_percentile: Optional[float]
    anomaly_level: str
    anomaly_label: Optional[str]
    observed_count: Optional[int]
    baseline_mean_count: Optional[float]
    baseline_std_count: Optional[float]
    has_sufficient_baseline: bool
    is_demo_data: bool
    disclaimer: str = "Unusual activity does not confirm an uncontrollable wildfire. Ground truth verification required."

    class Config:
        from_attributes = True


class AnomalySummary(BaseModel):
    total_anomalies: int
    level_counts: Dict[str, int]
    top_anomalies: List[AnomalyItem]
    is_demo_data: bool


# -----------------------------------------------------------------------------
# NASA Open Data & Natural Event (EONET) Schemas
# -----------------------------------------------------------------------------
class NasaEventItem(BaseModel):
    id: int
    eonet_id: str
    title: str
    category: str = "wildfires"
    status: str
    closed_at: Optional[datetime] = None
    latitude: float
    longitude: float
    first_observed: Optional[datetime] = None
    last_observed: Optional[datetime] = None
    magnitude_value: Optional[float] = None
    magnitude_unit: Optional[str] = None
    source_ids: Optional[str] = None
    source_url: Optional[str] = None
    eonet_link: Optional[str] = None
    geometry_count: int = 1
    data_source: str = "NASA EONET v3"

    class Config:
        from_attributes = True


class NasaOpenDataPlatform(BaseModel):
    name: str
    url: str
    description: str
    api_key_required: bool
    free_registration_url: Optional[str] = None
    category: str
    role_in_firedna: str


