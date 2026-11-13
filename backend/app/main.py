
"""
FireDNA FastAPI Application Entry Point
NASA Space Apps Challenge 2026 | MODIS and VIIRS Hot Spots
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.ingestion import router as ingestion_router
from app.api.v1.hotspots import router as hotspots_router
from app.api.v1.harmonization import router as harmonization_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.anomalies import router as anomalies_router
from app.api.v1.exports import router as exports_router


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger("firedna.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database tables and seed baseline demo data if empty."""

    logger.info("Initializing FireDNA Database...")

    init_db()

    # Auto-seed database if empty so frontend never sees empty state
    from app.core.database import SessionLocal
    from app.models.models import SatelliteObservation

    db = SessionLocal()

    try:
        if (
            db.query(SatelliteObservation).count() == 0
            and not settings.FIRMS_MAP_KEY.strip()
        ):
            logger.info(
                "Database is empty. Auto-seeding initial satellite observations & harmonized cells..."
            )

            from app.utils.seed_demo_data import seed_database

            await seed_database()

    except Exception as exc:
        logger.warning("Auto-seed check failed: %s", exc)

    finally:
        db.close()

    logger.info("Database initialized successfully.")

    sync_task = None

    if settings.FIRMS_AUTO_SYNC_MINUTES > 0:
        import asyncio
        from app.services.sync_service import run_sync

        async def _sync_loop():
            while True:
                try:
                    await run_sync()

                except Exception as exc:
                    logger.error("Auto-sync failed: %s", exc)

                await asyncio.sleep(
                    settings.FIRMS_AUTO_SYNC_MINUTES * 60
                )

        sync_task = asyncio.create_task(_sync_loop())

        logger.info(
            "FIRMS auto-sync enabled: every %d min",
            settings.FIRMS_AUTO_SYNC_MINUTES
        )

    yield

    if sync_task:
        sync_task.cancel()

    logger.info("FireDNA API shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "FireDNA — NASA FIRMS Active Fire Harmonization, Analytics, and Visualization Engine. "
        "NASA Space Apps Challenge 2026: MODIS and VIIRS Hot Spots."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API v1 Routers
app.include_router(ingestion_router, prefix=settings.API_V1_STR)
app.include_router(hotspots_router, prefix=settings.API_V1_STR)
app.include_router(harmonization_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(anomalies_router, prefix=settings.API_V1_STR)
app.include_router(exports_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    """System health check and mode indicator."""

    is_demo = not bool(
        settings.FIRMS_MAP_KEY
        and settings.FIRMS_MAP_KEY.strip()
    )

    return {
        "status": "healthy",
        "service": "FireDNA Backend API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "demo_mode": is_demo,
        "attribution": "NASA FIRMS — Fire Information for Resource Management System"
    }


@app.get("/info", tags=["Health"])
def app_info():
    """Application information, supported products, and demonstration area."""

    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "tagline": "Understand Fire. Connect Data. Protect Our Planet.",
        "primary_demonstration_area": "Bangladesh and South Asia",
        "supported_products": settings.SUPPORTED_PRODUCTS,
        "methodology": {
            "spatial_grid_deg": settings.DEFAULT_GRID_RESOLUTION_DEG,
            "temporal_window_hours": settings.DEFAULT_TEMPORAL_WINDOW_HOURS,
            "hai_weights": {
                "count": settings.HAI_COUNT_WEIGHT,
                "frp": settings.HAI_FRP_WEIGHT,
                "confidence": settings.HAI_CONFIDENCE_WEIGHT
            }
        },
        "nasa_firms_docs": "https://firms.modaps.eosdis.nasa.gov/api/",
        "open_source_challenge": "NASA Space Apps Challenge 2026"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catches unhandled errors and returns standardized JSON response."""

    logger.error(
        "Unhandled error processing %s: %s",
        request.url.path,
        str(exc),
        exc_info=True
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred during processing.",
                "detail": str(exc) if settings.DEBUG else None
            }
        }
    )
