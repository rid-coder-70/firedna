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

    # NASA FIRMS API (Earthdata / LANCE). Empty key activates Demo Mode.
    # Free key: https://firms.modaps.eosdis.nasa.gov/api/map_key/
    FIRMS_MAP_KEY: str = Field(default="", description="NASA FIRMS MAP_KEY. If empty, Demo Mode is activated.")
    FIRMS_API_ROOT: str = "https://firms.modaps.eosdis.nasa.gov"
    FIRMS_BASE_URL: str = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
    FIRMS_TIMEOUT_SECONDS: int = 30
    FIRMS_MAX_RETRIES: int = 3
    # FIRMS Area API accepts DAY_RANGE 1..5 per request; longer ranges are chunked.
    FIRMS_MAX_DAY_RANGE: int = 5
    # Hard cap on total days per ingestion run to respect FIRMS transaction limits.
    FIRMS_MAX_TOTAL_DAYS: int = 120
    # Kept for backward compatibility with older configuration files.
    FIRMS_MAX_DATE_RANGE_DAYS: int = 5

    # NASA FIRMS Near-Real-Time (NRT) products
    SUPPORTED_PRODUCTS: List[str] = [
        "MODIS_NRT",
        "VIIRS_SNPP_NRT",
        "VIIRS_NOAA20_NRT",
        "VIIRS_NOAA21_NRT"
    ]
    # NASA FIRMS Standard Processing (SP) archive products (science-quality, delayed)
    ARCHIVE_PRODUCTS: List[str] = [
        "MODIS_SP",
        "VIIRS_SNPP_SP",
        "VIIRS_NOAA20_SP",
        "VIIRS_NOAA21_SP"
    ]
    # NRT -> SP product mapping used when a requested date range predates NRT coverage
    NRT_TO_SP: dict = {
        "MODIS_NRT": "MODIS_SP",
        "VIIRS_SNPP_NRT": "VIIRS_SNPP_SP",
        "VIIRS_NOAA20_NRT": "VIIRS_NOAA20_SP",
        "VIIRS_NOAA21_NRT": "VIIRS_NOAA21_SP"
    }

    # Official NASA FIRMS public 7-day South Asia CSV feeds (no API key required)
    PUBLIC_FIRMS_SOUTH_ASIA_URLS: dict = {
        "MODIS_NRT": "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_South_Asia_7d.csv",
        "VIIRS_SNPP_NRT": "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_South_Asia_7d.csv",
        "VIIRS_NOAA20_NRT": "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_Asia_7d.csv",
        "VIIRS_NOAA21_NRT": "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-21-viirs-c2/csv/J2_VIIRS_C2_South_Asia_7d.csv",
    }

    # Bundled official NASA FIRMS South Asia 7-day CSV datasets in docs/datas/
    LOCAL_FIRMS_CSV_FILES: dict = {
        "MODIS_NRT": "docs/datas/MODIS_C6_1_South_Asia_7d.csv",
        "MODIS_SP": "docs/datas/MODIS_C6_1_South_Asia_7d.csv",
        "VIIRS_NOAA20_NRT": "docs/datas/J1_VIIRS_C2_South_Asia_7d.csv",
        "VIIRS_NOAA20_SP": "docs/datas/J1_VIIRS_C2_South_Asia_7d.csv",
        "VIIRS_NOAA21_NRT": "docs/datas/J2_VIIRS_C2_South_Asia_7d.csv",
        "VIIRS_NOAA21_SP": "docs/datas/J2_VIIRS_C2_South_Asia_7d.csv",
        "VIIRS_SNPP_NRT": "docs/datas/J1_VIIRS_C2_South_Asia_7d.csv",
        "VIIRS_SNPP_SP": "docs/datas/J1_VIIRS_C2_South_Asia_7d.csv",
    }

    # NASA EONET v3 (Earth Observatory Natural Event Tracker) — no API key required
    EONET_BASE_URL: str = "https://eonet.gsfc.nasa.gov/api/v3"
    EONET_TIMEOUT_SECONDS: int = 20
    EONET_DEFAULT_LOOKBACK_DAYS: int = 365

    # Optional api.nasa.gov key (free). Not required by FIRMS or EONET; stored for future APIs.
    NASA_API_KEY: str = Field(default="", description="Optional api.nasa.gov key (DEMO_KEY works for light use).")

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
        "min_lon": 54.0,
        "max_lat": 40.0,
        "max_lon": 102.0,
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
