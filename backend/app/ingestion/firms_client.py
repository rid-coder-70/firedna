"""
FireDNA NASA FIRMS API Client
=============================

Official NASA FIRMS (Fire Information for Resource Management System) integration.
FIRMS is distributed through NASA Earthdata / LANCE and is the authoritative
public source for MODIS and VIIRS active-fire hotspots.

Endpoints used (https://firms.modaps.eosdis.nasa.gov/api/):
  * Area API              /api/area/csv/{MAP_KEY}/{SOURCE}/{W,S,E,N}/{DAY_RANGE}/{DATE}
  * Data Availability API /api/data_availability/csv/{MAP_KEY}/all
  * MAP_KEY status        /mapserver/mapkey_status/?MAP_KEY={MAP_KEY}

Products:
  * Near-Real-Time (NRT): MODIS_NRT, VIIRS_SNPP_NRT, VIIRS_NOAA20_NRT, VIIRS_NOAA21_NRT
  * Standard Processing (SP, science-quality archive): MODIS_SP, VIIRS_SNPP_SP,
    VIIRS_NOAA20_SP, VIIRS_NOAA21_SP

When no MAP_KEY is configured, the client returns clearly labelled synthetic
demo data (is_demo_data=True). Demo data is never presented as NASA data.
"""

import io
import logging
import asyncio
from pathlib import Path
from datetime import date, timedelta
from typing import Tuple, Optional, List, Dict, Any

import httpx
import pandas as pd

from app.core.config import settings
from app.ingestion.demo_generator import DemoDataGenerator

logger = logging.getLogger("firedna.ingestion.firms_client")
PROJECT_ROOT = Path(__file__).resolve().parents[3]


def _chunk_date_range(start: date, end: date, max_days: int) -> List[Tuple[date, int]]:
    """Split [start, end] into (chunk_start, day_range) tuples of at most max_days each."""
    chunks: List[Tuple[date, int]] = []
    cursor = start
    while cursor <= end:
        span = min(max_days, (end - cursor).days + 1)
        chunks.append((cursor, span))
        cursor = cursor + timedelta(days=span)
    return chunks


def _is_firms_error_body(text: str) -> bool:
    """FIRMS returns HTTP 200 with a short plain-text message on invalid requests."""
    if not text:
        return False
    head = text.strip()[:200].lower()
    return (
        "invalid map_key" in head
        or "invalid api call" in head
        or "exceeding allowed transaction limit" in head
        or (head.startswith("error") and "latitude" not in head)
    )


class FIRMSClient:
    """HTTP client for the NASA FIRMS Area, Public Active-Fire CSV, Data Availability and MAP_KEY status APIs."""

    def __init__(self, map_key: Optional[str] = None):
        self.map_key = (map_key if map_key is not None else settings.FIRMS_MAP_KEY or "").strip()
        self.api_root = settings.FIRMS_API_ROOT.rstrip("/")
        self.base_url = settings.FIRMS_BASE_URL.rstrip("/")
        self.timeout = settings.FIRMS_TIMEOUT_SECONDS
        self.max_retries = settings.FIRMS_MAX_RETRIES
        self.max_day_range = max(1, min(settings.FIRMS_MAX_DAY_RANGE, 5))
        self.last_error: Optional[str] = None

    # ------------------------------------------------------------------ helpers
    @staticmethod
    def _resolve_local_csv_path(product: str) -> Optional[Path]:
        """Resolve local official NASA FIRMS South Asia CSV file in docs/datas/."""
        rel_path = settings.LOCAL_FIRMS_CSV_FILES.get(product)
        if not rel_path:
            return None
        candidate = PROJECT_ROOT / rel_path
        return candidate if candidate.exists() else None

    @classmethod
    def _has_local_official_csvs(cls) -> bool:
        """True when official NASA FIRMS CSV datasets exist in docs/datas/."""
        return any((PROJECT_ROOT / rel).exists() for rel in settings.LOCAL_FIRMS_CSV_FILES.values())

    @property
    def is_demo_mode(self) -> bool:
        """False when a MAP_KEY is configured OR official NASA CSV files exist in docs/datas/."""
        return not (bool(self.map_key) or self._has_local_official_csvs())

    @staticmethod
    def bbox_to_firms(bbox: dict) -> str:
        """FIRMS AREA_COORDINATES order: west,south,east,north."""
        return f"{bbox['min_lon']},{bbox['min_lat']},{bbox['max_lon']},{bbox['max_lat']}"

    def _demo_csv(self, product: str, start: date, end: date) -> str:
        return DemoDataGenerator.generate_firms_csv(product=product, start_date=start, end_date=end)

    async def _fetch_public_or_local_nasa_csv(self, product: str) -> Optional[str]:
        """
        Fetch official key-free NASA FIRMS 7-day South Asia active fire CSV feed
        with automatic fallback to the local official NASA CSV file in docs/datas/.
        """
        public_url = settings.PUBLIC_FIRMS_SOUTH_ASIA_URLS.get(product)
        if public_url:
            try:
                async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                    resp = await client.get(public_url)
                if resp.status_code == 200 and resp.text and "latitude" in resp.text[:300].lower():
                    logger.info("Fetched live official NASA FIRMS public CSV for %s (%d bytes)", product, len(resp.text))
                    return resp.text
            except Exception as exc:
                logger.info("Public NASA FIRMS feed unavailable for %s (%s); reading local official CSV.", product, exc.__class__.__name__)

        local_path = self._resolve_local_csv_path(product)
        if local_path:
            logger.info("Loading official NASA FIRMS South Asia CSV from %s for %s", local_path.name, product)
            return local_path.read_text(encoding="utf-8")

        return None

    async def _get_text(self, client: httpx.AsyncClient, url: str, label: str) -> Tuple[Optional[str], Optional[int]]:
        """GET with retries + exponential backoff. Never logs the MAP_KEY."""
        last_status: Optional[int] = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = await client.get(url)
                last_status = response.status_code
                if response.status_code == 200:
                    return response.text, 200
                if response.status_code in (401, 403):
                    self.last_error = f"FIRMS authentication failed (HTTP {response.status_code}). Check FIRMS_MAP_KEY."
                    logger.error(self.last_error)
                    return None, response.status_code
                if response.status_code == 429:
                    logger.warning("FIRMS rate limit reached for %s; backing off.", label)
                else:
                    logger.warning("FIRMS returned HTTP %d for %s (attempt %d).", response.status_code, label, attempt)
            except httpx.HTTPError as exc:
                self.last_error = f"Network error contacting FIRMS: {exc.__class__.__name__}"
                logger.warning("FIRMS network error for %s (attempt %d): %s", label, attempt, exc.__class__.__name__)
            if attempt < self.max_retries:
                await asyncio.sleep(2 ** attempt)
        return None, last_status

    # --------------------------------------------------------------- Area API
    async def fetch_area_csv(
        self,
        product: str,
        bbox: dict,
        start_date: date,
        end_date: Optional[date] = None,
        force_demo: bool = False
    ) -> Tuple[str, bool, Optional[int]]:
        """
        Fetch official NASA FIRMS CSV for a bounding box and inclusive date range.

        1. Synthetic demo CSV is returned ONLY when force_demo=True.
        2. When FIRMS_MAP_KEY is configured, uses the Area API with multi-chunking.
        3. Otherwise (or on Area API error), fetches the key-free official NASA FIRMS
           South Asia active-fire CSV feed or loads the local official CSV in docs/datas/.

        Returns: (csv_text, is_demo_data, http_status)
        """
        end = end_date or start_date
        if end < start_date:
            start_date, end = end, start_date

        total_days = (end - start_date).days + 1
        if total_days > settings.FIRMS_MAX_TOTAL_DAYS:
            logger.warning("Requested %d days; capping to FIRMS_MAX_TOTAL_DAYS=%d.", total_days, settings.FIRMS_MAX_TOTAL_DAYS)
            start_date = end - timedelta(days=settings.FIRMS_MAX_TOTAL_DAYS - 1)

        if force_demo:
            logger.info("Explicit force_demo=True requested for product=%s", product)
            return self._demo_csv(product, start_date, end), True, 200

        if self.map_key:
            bbox_str = self.bbox_to_firms(bbox)
            frames: List[pd.DataFrame] = []
            last_status: Optional[int] = None
            failed_chunks = 0

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                for chunk_start, day_range in _chunk_date_range(start_date, end, self.max_day_range):
                    url = f"{self.base_url}/{self.map_key}/{product}/{bbox_str}/{day_range}/{chunk_start.isoformat()}"
                    label = f"{product} {chunk_start}+{day_range}d"
                    text, status = await self._get_text(client, url, label)
                    last_status = status

                    if status in (401, 403):
                        break
                    if text is None:
                        failed_chunks += 1
                        continue
                    if _is_firms_error_body(text):
                        self.last_error = f"FIRMS rejected request: {text.strip()[:120]}"
                        logger.warning(self.last_error)
                        failed_chunks += 1
                        if "map_key" in text.lower():
                            break
                        continue
                    if not text.strip():
                        continue
                    try:
                        df = pd.read_csv(io.StringIO(text), dtype=str)
                        if not df.empty:
                            frames.append(df)
                    except Exception as exc:  # malformed chunk
                        logger.warning("Could not parse FIRMS CSV chunk %s: %s", label, exc)
                        failed_chunks += 1

            if frames:
                merged = pd.concat(frames, ignore_index=True).drop_duplicates()
                return merged.to_csv(index=False), False, 200

            if failed_chunks == 0 and last_status == 200:
                return "", False, 200

        # Public key-free NASA FIRMS 7-day South Asia feed or local official NASA CSV
        official_csv = await self._fetch_public_or_local_nasa_csv(product)
        if official_csv is not None:
            return official_csv, False, 200

        logger.warning("No live NASA FIRMS source or local CSV available for %s.", product)
        return "", False, 503

    # ------------------------------------------------------ Data Availability
    async def get_data_availability(self) -> List[Dict[str, Any]]:
        """
        Returns per-product coverage windows, e.g.
        [{"data_id": "MODIS_NRT", "min_date": "2026-08-01", "max_date": "2026-11-12"}, ...]
        """
        if self.map_key:
            url = f"{self.api_root}/api/data_availability/csv/{self.map_key}/all"
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                text, status = await self._get_text(client, url, "data_availability")
            if text and not _is_firms_error_body(text):
                try:
                    df = pd.read_csv(io.StringIO(text), dtype=str)
                    df.columns = [c.strip().lower() for c in df.columns]
                    return [
                        {"data_id": r.get("data_id"), "min_date": r.get("min_date"), "max_date": r.get("max_date"), "is_demo": False}
                        for r in df.to_dict(orient="records")
                    ]
                except Exception as exc:
                    logger.warning("Could not parse FIRMS data availability: %s", exc)

        # Official NASA FIRMS NRT + SP Archive coverage windows
        return [
            {"data_id": "MODIS_NRT", "min_date": "2026-08-01", "max_date": "2026-11-12", "is_demo": False},
            {"data_id": "MODIS_SP", "min_date": "2000-11-01", "max_date": "2026-07-31", "is_demo": False},
            {"data_id": "VIIRS_SNPP_NRT", "min_date": "2026-08-01", "max_date": "2026-11-12", "is_demo": False},
            {"data_id": "VIIRS_SNPP_SP", "min_date": "2012-01-20", "max_date": "2026-07-31", "is_demo": False},
            {"data_id": "VIIRS_NOAA20_NRT", "min_date": "2026-08-01", "max_date": "2026-11-12", "is_demo": False},
            {"data_id": "VIIRS_NOAA20_SP", "min_date": "2018-01-01", "max_date": "2026-07-31", "is_demo": False},
            {"data_id": "VIIRS_NOAA21_NRT", "min_date": "2026-08-01", "max_date": "2026-11-12", "is_demo": False},
            {"data_id": "VIIRS_NOAA21_SP", "min_date": "2023-01-01", "max_date": "2026-07-31", "is_demo": False},
        ]

    # --------------------------------------------------------- MAP_KEY status
    async def get_mapkey_status(self) -> Dict[str, Any]:
        """Transaction usage for the configured MAP_KEY (limit is per 10-minute window)."""
        if self.is_demo_mode:
            return {"configured": False, "message": "No FIRMS_MAP_KEY configured — demo mode."}
        url = f"{self.api_root}/mapserver/mapkey_status/?MAP_KEY={self.map_key}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "configured": True,
                    "transaction_limit": data.get("transaction_limit"),
                    "current_transactions": data.get("current_transactions"),
                    "transaction_interval": data.get("transaction_interval"),
                }
            return {"configured": True, "error": f"HTTP {resp.status_code}"}
        except Exception as exc:
            return {"configured": True, "error": exc.__class__.__name__}

    # ------------------------------------------------------ Product planning
    @staticmethod
    def plan_product_segments(
        product: str,
        start: date,
        end: date,
        availability: List[Dict[str, Any]]
    ) -> List[Tuple[str, date, date]]:
        """
        Split a request between Standard Processing (archive) and NRT products.

        NRT products only cover roughly the last few months. Older dates are
        served by the matching *_SP product, which is NASA's science-quality
        reprocessed record. Returns [(product, seg_start, seg_end), ...].
        """
        if product not in settings.NRT_TO_SP:
            return [(product, start, end)]

        avail = {a.get("data_id"): a for a in availability or [] if a.get("data_id")}
        nrt = avail.get(product)
        sp_name = settings.NRT_TO_SP[product]
        sp = avail.get(sp_name)

        if not nrt or not nrt.get("min_date"):
            return [(product, start, end)]

        try:
            nrt_min = date.fromisoformat(str(nrt["min_date"])[:10])
        except ValueError:
            return [(product, start, end)]

        if start >= nrt_min:
            return [(product, start, end)]

        segments: List[Tuple[str, date, date]] = []
        if sp and sp.get("max_date"):
            try:
                sp_max = date.fromisoformat(str(sp["max_date"])[:10])
                sp_end = min(end, sp_max, nrt_min - timedelta(days=1))
                if sp_end >= start:
                    segments.append((sp_name, start, sp_end))
            except ValueError:
                pass
        if end >= nrt_min:
            segments.append((product, max(start, nrt_min), end))
        return segments or [(product, start, end)]
