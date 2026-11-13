"""
FireDNA NASA EONET v3 Client
============================

NASA EONET (Earth Observatory Natural Event Tracker, https://eonet.gsfc.nasa.gov)
is a public, key-free NASA API that curates natural-event metadata (wildfires,
storms, volcanoes...) with links to authoritative sources (InciWeb, GDACS, etc.).

FireDNA uses EONET's ``wildfires`` category as **independent event-level context**
for satellite hotspots: a curated wildfire event near a cluster of FIRMS hotspots
supports interpretation; the absence of an event does NOT mean no fire occurred
(EONET coverage is sparse outside North America, Australia and Europe).
"""

import logging
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("firedna.ingestion.eonet_client")


class EONETClient:
    """Minimal async client for the EONET v3 events endpoint."""

    def __init__(self, base_url: Optional[str] = None, timeout: Optional[int] = None):
        self.base_url = (base_url or settings.EONET_BASE_URL).rstrip("/")
        self.timeout = timeout or settings.EONET_TIMEOUT_SECONDS
        self.last_error: Optional[str] = None

    @staticmethod
    def bbox_to_eonet(bbox: dict) -> str:
        """EONET bbox order: min_lon, max_lat, max_lon, min_lat (upper-left, lower-right)."""
        return f"{bbox['min_lon']},{bbox['max_lat']},{bbox['max_lon']},{bbox['min_lat']}"

    async def fetch_wildfire_events(
        self,
        bbox: Optional[dict] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status: str = "all",
        limit: int = 500,
    ) -> List[Dict[str, Any]]:
        """Fetch raw EONET wildfire events (JSON, not GeoJSON) for a region and period."""
        end = end_date or date.today()
        start = start_date or (end - timedelta(days=settings.EONET_DEFAULT_LOOKBACK_DAYS))
        params: Dict[str, Any] = {
            "category": "wildfires",
            "status": status,
            "start": start.isoformat(),
            "end": end.isoformat(),
            "limit": limit,
        }
        if bbox:
            params["bbox"] = self.bbox_to_eonet(bbox)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(f"{self.base_url}/events", params=params)
            if resp.status_code != 200:
                self.last_error = f"EONET HTTP {resp.status_code}"
                logger.warning(self.last_error)
                return []
            return resp.json().get("events", []) or []
        except Exception as exc:
            self.last_error = f"EONET unreachable: {exc.__class__.__name__}"
            logger.warning(self.last_error)
            return []

    @staticmethod
    def normalize_event(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Flatten an EONET event into a FireDNA record. Uses the most recent point
        geometry (polygon geometries are reduced to their first vertex centroid proxy).
        """
        geometries = event.get("geometry") or []
        if not geometries:
            return None

        latest = geometries[-1]
        coords = latest.get("coordinates")
        lat = lon = None
        if latest.get("type") == "Point" and isinstance(coords, list) and len(coords) >= 2:
            lon, lat = float(coords[0]), float(coords[1])
        elif latest.get("type") == "Polygon" and coords and coords[0]:
            ring = coords[0]
            lon = sum(p[0] for p in ring) / len(ring)
            lat = sum(p[1] for p in ring) / len(ring)
        if lat is None or lon is None:
            return None

        def _parse_dt(value: Optional[str]) -> Optional[datetime]:
            if not value:
                return None
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
            except ValueError:
                return None

        first_dt = _parse_dt(geometries[0].get("date"))
        last_dt = _parse_dt(latest.get("date"))
        sources = event.get("sources") or []

        return {
            "eonet_id": event.get("id"),
            "title": (event.get("title") or "Untitled wildfire event")[:300],
            "category": "wildfires",
            "status": "closed" if event.get("closed") else "open",
            "closed_at": _parse_dt(event.get("closed")),
            "latitude": round(lat, 5),
            "longitude": round(lon, 5),
            "first_observed": first_dt,
            "last_observed": last_dt,
            "magnitude_value": latest.get("magnitudeValue"),
            "magnitude_unit": latest.get("magnitudeUnit"),
            "source_ids": ",".join(s.get("id", "") for s in sources)[:200],
            "source_url": sources[0].get("url") if sources else event.get("link"),
            "eonet_link": event.get("link"),
            "geometry_count": len(geometries),
            "raw_metadata": event,
        }

