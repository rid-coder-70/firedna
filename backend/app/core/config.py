"""
FireDNA Core Configuration
Loads environment variables and application settings using Pydantic Settings.
"""

from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    PROJECT_NAME: str = "FireDNA API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    ADMIN_KEY: str = Field(default="", description="Optional administrative API key.")

    # NASA FIRMS API (Empty activates Demo Mode)
    FIRMS_MAP_KEY: str = Field(default="", description="NASA FIRMS API Key. If empty, Demo Mode is activated.")
    FIRMS_BASE_URL: str = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
    FIRMS_TIMEOUT_SECONDS: int = 30
    FIRMS_MAX_RETRIES: int = 3
    FIRMS_MAX_DATE_RANGE_DAYS: int = 10

    # Supported NASA FIRMS Products
    SUPPORTED_PRODUCTS: List[str] = [
        "MODIS_NRT",
        "VIIRS_SNPP_NRT",
        "VIIRS_NOAA20_NRT",
        "VIIRS_NOAA21_NRT"
    ]

    # Database
    DATABASE_URL: str = "sqlite:///./firedna.db"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://firedna.vercel.app"
    ]

    # Default Bounding Boxes
    BANGLADESH_BBOX: dict = {
        "min_lat": 20.5,
        "min_lon": 88.0,
        "max_lat": 26.7,
        "max_lon": 92.7,
        "name": "Bangladesh"
    }
    SOUTH_ASIA_BBOX: dict = {
        "min_lat": 5.0,
        "min_lon": 60.0,
        "max_lat": 38.0,
        "max_lon": 100.0,
        "name": "South Asia"
    }

    # Harmonization Methodology Defaults
    METHODOLOGY_VERSION: str = "1.0.0"
    DEFAULT_GRID_RESOLUTION_DEG: float = 0.1
    DEFAULT_TEMPORAL_WINDOW_HOURS: int = 24

    # Harmonized Activity Index (HAI) Weights
    HAI_COUNT_WEIGHT: float = 0.40
    HAI_FRP_WEIGHT: float = 0.45
    HAI_CONFIDENCE_WEIGHT: float = 0.15

    # Anomaly Detection Defaults
    ANOMALY_ELEVATED_Z: float = 1.5
    ANOMALY_HIGH_Z: float = 2.5
    ANOMALY_EXTREME_Z: float = 3.5
    MIN_BASELINE_YEARS: int = 3

    # API Output Limits
    MAX_GEOJSON_FEATURES: int = 2500
    DEFAULT_PAGE_SIZE: int = 50
    MAX_PAGE_SIZE: int = 500


settings = Settings()
