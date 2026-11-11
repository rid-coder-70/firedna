"""
FireDNA SQLAlchemy ORM Database Models
Maps raw satellite observations, ingestion logs, harmonized grid cells,
historical baselines, and anomaly detection results.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, BigInteger, String, Float, Boolean, Date, Time,
    DateTime, ForeignKey, Text, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


class DataIngestionLog(Base):
    __tablename__ = "data_ingestion_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product = Column(String(50), nullable=False, index=True)
    region_name = Column(String(100), nullable=True)
    bbox_min_lat = Column(Float, nullable=True)
    bbox_min_lon = Column(Float, nullable=True)
    bbox_max_lat = Column(Float, nullable=True)
    bbox_max_lon = Column(Float, nullable=True)
    date_range_start = Column(Date, nullable=False)
    date_range_end = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="running", index=True)
    records_fetched = Column(Integer, default=0)
    records_inserted = Column(Integer, default=0)
    records_skipped = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    is_demo_data = Column(Boolean, nullable=False, default=False)
    api_response_code = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    parameters = Column(JSON, nullable=True)
    started_at = Column(DateTime, nullable=False, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=utc_now)

    observations = relationship("SatelliteObservation", back_populates="ingestion_log")


class SatelliteObservation(Base):
    __tablename__ = "satellite_observations"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    ingestion_run_id = Column(String(36), ForeignKey("data_ingestion_logs.id", ondelete="SET NULL"), nullable=True)

    # Sensor metadata
    instrument = Column(String(20), nullable=False, index=True)  # 'MODIS', 'VIIRS'
    satellite_platform = Column(String(30), nullable=False)      # 'Terra', 'Aqua', 'Suomi-NPP', 'NOAA-20', 'NOAA-21'
    source_product = Column(String(50), nullable=False, index=True)

    # Spatial coordinates (WGS84)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)

    # Temporal
    acq_date = Column(Date, nullable=False, index=True)
    acq_time = Column(String(8), nullable=True)                  # 'HH:MM:SS'
    acq_datetime = Column(DateTime, nullable=True, index=True)

    # Radiative Energy & Physical properties
    brightness = Column(Float, nullable=True)                    # Brightness temperature (K)
    bright_t31 = Column(Float, nullable=True)                    # Channel 31 / I-5 brightness temp (K)
    frp = Column(Float, nullable=True)                           # Fire Radiative Power (MW)
    daynight = Column(String(1), nullable=True)                  # 'D' or 'N'

    # Quality & Confidence
    confidence_raw = Column(String(20), nullable=True)
    confidence_normalized = Column(Float, nullable=True)         # 0.0 - 1.0
    confidence_category = Column(String(10), nullable=True)      # 'low', 'nominal', 'high'

    # Satellite geometry
    scan = Column(Float, nullable=True)
    track = Column(Float, nullable=True)
    version = Column(String(20), nullable=True)

    # Provenance
    is_demo_data = Column(Boolean, nullable=False, default=False)
    raw_metadata = Column(JSON, nullable=True)
    processing_version = Column(String(20), nullable=False, default="1.0.0")
    created_at = Column(DateTime, nullable=False, default=utc_now)

    ingestion_log = relationship("DataIngestionLog", back_populates="observations")

    __table_args__ = (
        Index("idx_sat_obs_lat_lon", "latitude", "longitude"),
        Index("idx_sat_obs_inst_date", "instrument", "acq_date"),
        UniqueConstraint("latitude", "longitude", "acq_date", "acq_time", "instrument", "satellite_platform", name="uq_sat_obs_dedup"),
    )


class ProcessingRun(Base):
    __tablename__ = "processing_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_type = Column(String(50), nullable=False, index=True)  # 'harmonization', 'baseline', 'anomaly_detection'
    status = Column(String(20), nullable=False, default="running")
    methodology_version = Column(String(20), nullable=False, default="1.0.0")
    parameters = Column(JSON, nullable=False)
    input_record_count = Column(Integer, default=0)
    output_record_count = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=False, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=utc_now)

    harmonized_observations = relationship("HarmonizedObservation", back_populates="processing_run")


class HarmonizedObservation(Base):
    __tablename__ = "harmonized_observations"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    processing_run_id = Column(String(36), ForeignKey("processing_runs.id", ondelete="SET NULL"), nullable=True)

    # Grid Cell Geometry (0.1 deg standard cell)
    grid_cell_id = Column(String(50), nullable=False, index=True)
    grid_resolution_deg = Column(Float, nullable=False, default=0.1)
    cell_lat_min = Column(Float, nullable=False)
    cell_lat_max = Column(Float, nullable=False)
    cell_lon_min = Column(Float, nullable=False)
    cell_lon_max = Column(Float, nullable=False)
    centroid_lat = Column(Float, nullable=False)
    centroid_lon = Column(Float, nullable=False)

    # Temporal Window
    obs_date = Column(Date, nullable=False, index=True)
    temporal_window_hours = Column(Integer, nullable=False, default=24)

    # Raw Detection Counts per Instrument
    modis_count = Column(Integer, nullable=False, default=0)
    viirs_snpp_count = Column(Integer, nullable=False, default=0)
    viirs_noaa20_count = Column(Integer, nullable=False, default=0)
    viirs_noaa21_count = Column(Integer, nullable=False, default=0)
    total_viirs_count = Column(Integer, nullable=False, default=0)
    total_detections_all = Column(Integer, nullable=False, default=0)

    # Fire Radiative Power Aggregates
    total_frp_modis = Column(Float, default=0.0)
    mean_frp_modis = Column(Float, nullable=True)
    total_frp_viirs = Column(Float, default=0.0)
    mean_frp_viirs = Column(Float, nullable=True)
    max_frp_all = Column(Float, default=0.0)

    # Harmonized Activity Index (HAI) — Prototype Metric
    hai_score = Column(Float, nullable=True, index=True)
    hai_frp_component = Column(Float, nullable=True)
    hai_count_component = Column(Float, nullable=True)
    hai_confidence_component = Column(Float, nullable=True)
    hai_methodology_version = Column(String(20), nullable=False, default="1.0.0")
    hai_is_experimental = Column(Boolean, nullable=False, default=True)

    # Quality & Confidence
    mean_confidence_modis = Column(Float, nullable=True)
    mean_confidence_viirs = Column(Float, nullable=True)
    day_count = Column(Integer, default=0)
    night_count = Column(Integer, default=0)

    # Provenance
    processing_params = Column(JSON, nullable=True)
    is_demo_data = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=utc_now)

    processing_run = relationship("ProcessingRun", back_populates="harmonized_observations")
    anomalies = relationship("ActivityAnomaly", back_populates="harmonized_observation")

    __table_args__ = (
        Index("idx_harm_cell_date", "grid_cell_id", "obs_date"),
        UniqueConstraint("grid_cell_id", "obs_date", "temporal_window_hours", name="uq_harm_cell_date_window"),
    )


class HistoricalBaseline(Base):
    __tablename__ = "historical_baselines"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    grid_cell_id = Column(String(50), nullable=False, index=True)
    instrument = Column(String(20), nullable=False, index=True)  # 'MODIS', 'VIIRS', 'ALL'
    month_of_year = Column(Integer, nullable=False, index=True)  # 1 - 12

    mean_count = Column(Float, nullable=True)
    std_count = Column(Float, nullable=True)
    median_count = Column(Float, nullable=True)
    p10_count = Column(Float, nullable=True)
    p90_count = Column(Float, nullable=True)
    mean_frp = Column(Float, nullable=True)
    std_frp = Column(Float, nullable=True)

    sample_years = Column(Integer, nullable=False, default=1)
    sample_records = Column(Integer, nullable=False, default=0)
    baseline_start_year = Column(Integer, nullable=False)
    baseline_end_year = Column(Integer, nullable=False)
    is_sufficient = Column(Boolean, nullable=False, default=False)
    is_demo_data = Column(Boolean, nullable=False, default=False)

    calculated_at = Column(DateTime, nullable=False, default=utc_now)
    methodology_version = Column(String(20), nullable=False, default="1.0.0")

    __table_args__ = (
        UniqueConstraint("grid_cell_id", "instrument", "month_of_year", name="uq_baseline_cell_inst_month"),
    )


class ActivityAnomaly(Base):
    __tablename__ = "activity_anomalies"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    harmonized_obs_id = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("harmonized_observations.id", ondelete="CASCADE"), nullable=True)
    baseline_id = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("historical_baselines.id", ondelete="SET NULL"), nullable=True)

    obs_date = Column(Date, nullable=False, index=True)
    grid_cell_id = Column(String(50), nullable=False, index=True)
    centroid_lat = Column(Float, nullable=False)
    centroid_lon = Column(Float, nullable=False)

    z_score = Column(Float, nullable=True, index=True)
    historical_percentile = Column(Float, nullable=True)
    anomaly_level = Column(String(20), nullable=False, index=True)  # 'normal', 'elevated', 'high', 'extreme', 'insufficient_data'
    anomaly_label = Column(String(100), nullable=True)

    observed_count = Column(Integer, nullable=True)
    baseline_mean_count = Column(Float, nullable=True)
    baseline_std_count = Column(Float, nullable=True)
    observed_frp = Column(Float, nullable=True)
    baseline_mean_frp = Column(Float, nullable=True)

    component_values = Column(JSON, nullable=True)
    is_demo_data = Column(Boolean, nullable=False, default=False)
    has_sufficient_baseline = Column(Boolean, nullable=False, default=False)
    detected_at = Column(DateTime, nullable=False, default=utc_now)

    harmonized_observation = relationship("HarmonizedObservation", back_populates="anomalies")

