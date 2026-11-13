"""
FireDNA NASA FIRMS API Client
Fetches near-real-time active fire hotspot data for MODIS and VIIRS products.
Automatically switches to Demo Data Generator when no API key is provided.
"""

import logging
import asyncio
from datetime import date
from typing import Tuple, Optional
import httpx
from app.core.config import settings
from app.ingestion.demo_generator import DemoDataGenerator

logger = logging.getLogger("firedna.ingestion.firms_client")


class FIRMSClient:
    """HTTP Client for NASA FIRMS Area API."""

    def __init__(self, map_key: Optional[str] = None):
        self.map_key = map_key if map_key is not None else settings.FIRMS_MAP_KEY
        self.base_url = settings.FIRMS_BASE_URL
        self.timeout = settings.FIRMS_TIMEOUT_SECONDS
        self.max_retries = settings.FIRMS_MAX_RETRIES

    @property
    def is_demo_mode(self) -> bool:
        """Returns True if no valid NASA FIRMS MAP_KEY is configured."""
        return not bool(self.map_key and self.map_key.strip())

    async def fetch_area_csv(
        self,
        product: str,
        bbox: dict,
        start_date: date,
        end_date: Optional[date] = None,
        force_demo: bool = False
    ) -> Tuple[str, bool, Optional[int]]:
        """
        Fetches CSV data for a geographic area and date range.

        FIRMS Area API expects bounding box format: min_lon,min_lat,max_lon,max_lat
        and date or date range.

        Returns:
            Tuple[csv_content: str, is_demo_data: bool, status_code: Optional[int]]
        """
        if self.is_demo_mode or force_demo:
            logger.info("Using Demo Data Generator for product=%s (No FIRMS_MAP_KEY configured)", product)
            effective_end = end_date or start_date
            csv_content = DemoDataGenerator.generate_firms_csv(
                product=product,
                start_date=start_date,
                end_date=effective_end
            )
            return csv_content, True, 200

        # Construct NASA FIRMS URL
        # Format: /api/area/csv/[MAP_KEY]/[PRODUCT]/[BBOX]/[DATE_RANGE]
        # Bbox in FIRMS is: min_lon,min_lat,max_lon,max_lat
        bbox_str = f"{bbox['min_lon']},{bbox['min_lat']},{bbox['max_lon']},{bbox['max_lat']}"

        # If date range requested, FIRMS NRT accepts up to 10 days
        if end_date and end_date != start_date:
            days = min((end_date - start_date).days + 1, 5)
            date_param = str(days)
        else:
            days=1

        date_param = f"{days}/{start_date.strftime('%Y-%m-%d')}"

        url = f"{self.base_url}/{self.map_key}/{product}/{bbox_str}/{date_param}"

        # Retry logic with exponential backoff
        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                logger.info("FIRMS API request (attempt %d/%d): product=%s bbox=%s", attempt, self.max_retries, product, bbox_str)
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url)

                    if response.status_code == 200:
                        content = response.text
                        # Check if NASA returned an error text inside the 200 body
                        if "Invalid MAP_KEY" in content or "Error" in content and len(content) < 200:
                            logger.warning("NASA FIRMS returned key error: %s. Falling back to Demo Mode.", content.strip())
                            csv_content = DemoDataGenerator.generate_firms_csv(
                                product=product,
                                start_date=start_date,
                                end_date=end_date or start_date
                            )
                            return csv_content, True, 200

                        return content, False, response.status_code

                    elif response.status_code in (401, 403):
                        logger.error("NASA FIRMS Unauthorized (%d). Check FIRMS_MAP_KEY.", response.status_code)
                        raise ValueError(f"NASA FIRMS authentication failed with HTTP {response.status_code}")

                    logger.warning("FIRMS API returned status %d. Retrying...", response.status_code)

            except Exception as exc:
                last_error = exc
                logger.warning("FIRMS API network error on attempt %d: %s", attempt, str(exc))
                if attempt < self.max_retries:
                    await asyncio.sleep(2 ** attempt)

        logger.error("Failed to fetch from NASA FIRMS after %d attempts: %s", self.max_retries, str(last_error))
        raise RuntimeError(f"FIRMS API failed for {product} (last error: {last_error})")

