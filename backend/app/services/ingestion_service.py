"""
FireDNA Ingestion Service
Orchestrates fetching, cleaning, validating, and saving satellite observations.
"""

import math
import time
import logging
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import DataIngestionLog, SatelliteObservation, NasaEvent
from app.ingestion.firms_client import FIRMSClient
from app.ingestion.eonet_client import EONETClient
from app.ingestion.data_cleaner import DataCleaner
from app.ingestion.data_validator import DataValidator
from app.ingestion.deduplicator import Deduplicator

logger = logging.getLogger("firedna.services.ingestion")


def _label_south_asia_region(lat: float, lon: float) -> str:
    """Derive a meaningful geographic label for a South Asia 0.5-deg fire cluster."""
    if 29.0 <= lat <= 32.5 and 73.5 <= lon <= 77.5:
        return "Punjab & Haryana Indo-Gangetic Plain"
    if 29.5 <= lat <= 33.0 and 71.0 <= lon < 73.5:
        return "Punjab Plain (Pakistan)"
    if 24.5 <= lat <= 27.5 and 75.5 <= lon <= 80.0:
        return "Chambal & Bundelkhand Basin"
    if 21.5 <= lat < 24.5 and 76.0 <= lon <= 81.5:
        return "Central India Narmada–Satpura Belt"
    if 22.5 <= lat <= 25.0 and 84.5 <= lon <= 87.5:
        return "Chota Nagpur Plateau"
    if 19.5 <= lat < 22.5 and 83.5 <= lon <= 87.0:
        return "Odisha Mahanadi Basin"
    if 20.5 <= lat <= 26.7 and 88.0 <= lon <= 92.7:
        return "Bangladesh & Chittagong Hills"
    if 19.0 <= lat <= 24.5 and 95.5 <= lon <= 102.0:
        return "Myanmar Shan Plateau"
    if 14.0 <= lat < 19.0 and 97.5 <= lon <= 102.0:
        return "Lower Mekong / Indochina Corridor"
    if 24.0 <= lat <= 29.0 and 80.0 < lon <= 84.5:
        return "Middle Ganga–Terai Belt"
    if 15.0 <= lat < 21.5 and 73.0 <= lon <= 81.0:
        return "Deccan Plateau"
    return f"South Asia Fire Complex ({lat:.1f}°N, {lon:.1f}°E)"


class IngestionService:
    """Service layer managing NASA FIRMS and NASA EONET data ingestion runs."""

    def __init__(self, db: Session):
        self.db = db
        self.firms_client = FIRMSClient()
        self.eonet_client = EONETClient()

    async def run_ingestion(
        self,
        products: Optional[List[str]] = None,
        bbox: Optional[dict] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        region_name: str = "South Asia",
        force_demo: bool = False
    ) -> List[str]:
        """
        Runs ingestion for a list of FIRMS products.
        Returns list of created DataIngestionLog IDs.
        """
        products_to_run = products or ["MODIS_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"]
        target_bbox = bbox or settings.SOUTH_ASIA_BBOX
        target_start = start_date or date.today()
        target_end = end_date or target_start
        if target_end < target_start:
            target_start, target_end = target_end, target_start

        # Plan NRT vs Standard Processing (archive) segments when MAP_KEY is configured.
        segments = []
        use_map_key = bool(self.firms_client.map_key) and not force_demo
        availability = await self.firms_client.get_data_availability() if use_map_key else []
        for prod in products_to_run:
            if use_map_key:
                segments.extend(FIRMSClient.plan_product_segments(prod, target_start, target_end, availability))
            else:
                segments.append((prod, target_start, target_end))

        log_ids: List[str] = []

        for prod, seg_start, seg_end in segments:
            start_time = time.time()
            log_entry = DataIngestionLog(
                product=prod,
                region_name=region_name,
                bbox_min_lat=target_bbox["min_lat"],
                bbox_min_lon=target_bbox["min_lon"],
                bbox_max_lat=target_bbox["max_lat"],
                bbox_max_lon=target_bbox["max_lon"],
                date_range_start=seg_start,
                date_range_end=seg_end,
                status="running",
                parameters={
                    "bbox": target_bbox,
                    "start_date": str(seg_start),
                    "end_date": str(seg_end),
                    "region": region_name,
                    "processing_level": "SP" if prod.endswith("_SP") else "NRT",
                    "source": "NASA FIRMS Official Data"
                }
            )
            self.db.add(log_entry)
            self.db.commit()
            self.db.refresh(log_entry)
            log_ids.append(log_entry.id)

            try:
                # 1. Fetch CSV
                csv_text, is_demo, status_code = await self.firms_client.fetch_area_csv(
                    product=prod,
                    bbox=target_bbox,
                    start_date=seg_start,
                    end_date=seg_end,
                    force_demo=force_demo
                )
                log_entry.api_response_code = status_code
                log_entry.is_demo_data = is_demo

                # 2. Parse & Standardize
                raw_records = DataCleaner.parse_csv(csv_text, prod)
                log_entry.records_fetched = len(raw_records)

                # 3. Validate & Normalize
                validated_records = DataValidator.validate_and_normalize(raw_records)

                # 4. Deduplicate (skip slow DB scan if table has no records for this product yet)
                has_existing_for_prod = (
                    self.db.query(SatelliteObservation.id)
                    .filter(SatelliteObservation.source_product == prod)
                    .first()
                    is not None
                )
                unique_records, skipped = Deduplicator.deduplicate(
                    validated_records,
                    self.db,
                    check_database=has_existing_for_prod
                )
                log_entry.records_skipped = skipped + (len(raw_records) - len(validated_records))

                # 5. Insert Observations in batches
                obs_objects = []
                for rec in unique_records:
                    obs = SatelliteObservation(
                        ingestion_run_id=log_entry.id,
                        instrument=rec["instrument"],
                        satellite_platform=rec["satellite_platform"],
                        source_product=rec["source_product"],
                        latitude=rec["latitude"],
                        longitude=rec["longitude"],
                        acq_date=rec["acq_date"],
                        acq_time=rec["acq_time"],
                        acq_datetime=rec["acq_datetime"],
                        brightness=rec["brightness"],
                        bright_t31=rec["bright_t31"],
                        frp=rec["frp"],
                        daynight=rec["daynight"],
                        confidence_raw=rec["confidence_raw"],
                        confidence_normalized=rec["confidence_normalized"],
                        confidence_category=rec["confidence_category"],
                        scan=rec["scan"],
                        track=rec["track"],
                        version=rec["version"],
                        is_demo_data=is_demo,
                        raw_metadata=rec["raw_metadata"]
                    )
                    obs_objects.append(obs)

                if obs_objects:
                    chunk_size = 5000
                    for idx in range(0, len(obs_objects), chunk_size):
                        self.db.add_all(obs_objects[idx:idx + chunk_size])
                        self.db.commit()

                log_entry.records_inserted = len(obs_objects)
                log_entry.status = "success"
                log_entry.completed_at = datetime.now(timezone.utc)
                self.db.commit()

                logger.info("Ingestion completed for %s: fetched=%d, inserted=%d, skipped=%d in %.2fs",
                            prod, log_entry.records_fetched, log_entry.records_inserted, log_entry.records_skipped, time.time() - start_time)

            except Exception as exc:
                self.db.rollback()
                log_entry.status = "failed"
                log_entry.error_message = str(exc)
                log_entry.completed_at = datetime.now(timezone.utc)
                self.db.commit()
                logger.error("Ingestion failed for %s: %s", prod, str(exc), exc_info=True)

        return log_ids

    async def sync_eonet_events(
        self,
        bbox: Optional[dict] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status: str = "all"
    ) -> int:
        """
        Fetch and store live NASA EONET v3 curated wildfire events AND derive
        authentic South Asia active fire complexes directly from real NASA FIRMS
        observations stored in the database (zero synthetic/hardcoded events).
        """
        target_bbox = bbox or settings.SOUTH_ASIA_BBOX
        raw_events = await self.eonet_client.fetch_wildfire_events(
            bbox=target_bbox,
            start_date=start_date,
            end_date=end_date,
            status=status
        )
        # Also query global open EONET wildfires if regional EONET feed is sparse
        if not raw_events:
            raw_events = await self.eonet_client.fetch_wildfire_events(
                bbox=None,
                start_date=start_date,
                end_date=end_date,
                status="open",
                limit=15
            )

        upserted = 0
        for ev in raw_events:
            normalized = EONETClient.normalize_event(ev)
            if not normalized:
                continue

            # Keep South Asia events if global fallback wasn't needed, or tag regional/global
            existing = self.db.query(NasaEvent).filter(NasaEvent.eonet_id == normalized["eonet_id"]).first()
            if existing:
                existing.status = normalized["status"]
                existing.last_observed = normalized["last_observed"]
                existing.latitude = normalized["latitude"]
                existing.longitude = normalized["longitude"]
                existing.magnitude_value = normalized["magnitude_value"]
            else:
                event_obj = NasaEvent(
                    eonet_id=normalized["eonet_id"],
                    title=normalized["title"],
                    category=normalized["category"],
                    status=normalized["status"],
                    closed_at=normalized["closed_at"],
                    latitude=normalized["latitude"],
                    longitude=normalized["longitude"],
                    first_observed=normalized["first_observed"],
                    last_observed=normalized["last_observed"],
                    magnitude_value=normalized["magnitude_value"],
                    magnitude_unit=normalized["magnitude_unit"],
                    source_ids=normalized["source_ids"],
                    source_url=normalized["source_url"],
                    eonet_link=normalized["eonet_link"],
                    geometry_count=normalized["geometry_count"],
                    raw_metadata=normalized["raw_metadata"]
                )
                self.db.add(event_obj)
            upserted += 1

        # Derive top real South Asia active fire complexes from official FIRMS observations
        real_obs = (
            self.db.query(
                SatelliteObservation.latitude,
                SatelliteObservation.longitude,
                SatelliteObservation.instrument,
                SatelliteObservation.frp,
                SatelliteObservation.acq_datetime
            )
            .filter(SatelliteObservation.is_demo_data == False)
            .all()
        )

        if real_obs:
            clusters: Dict[tuple, Dict[str, Any]] = defaultdict(lambda: {
                "lat_sum": 0.0,
                "lon_sum": 0.0,
                "m_count": 0,
                "v_count": 0,
                "sum_frp": 0.0,
                "max_frp": 0.0,
                "first_dt": None,
                "last_dt": None,
            })
            for lat, lon, inst, frp, acq_dt in real_obs:
                lat_bin = round(math.floor(lat / 0.5) * 0.5, 2)
                lon_bin = round(math.floor(lon / 0.5) * 0.5, 2)
                c = clusters[(lat_bin, lon_bin)]
                c["lat_sum"] += lat
                c["lon_sum"] += lon
                if inst == "MODIS":
                    c["m_count"] += 1
                else:
                    c["v_count"] += 1
                frp_v = float(frp or 0.0)
                c["sum_frp"] += frp_v
                if frp_v > c["max_frp"]:
                    c["max_frp"] = frp_v
                if acq_dt:
                    if c["first_dt"] is None or acq_dt < c["first_dt"]:
                        c["first_dt"] = acq_dt
                    if c["last_dt"] is None or acq_dt > c["last_dt"]:
                        c["last_dt"] = acq_dt

            # Pick top 10 co-detected (MODIS + VIIRS) South Asia clusters
            ranked = sorted(
                [
                    (c["m_count"] + c["v_count"], k, c)
                    for k, c in clusters.items()
                    if c["m_count"] > 0 and c["v_count"] > 0
                ],
                reverse=True
            )[:10]

            for total_cnt, (lat_bin, lon_bin), c in ranked:
                avg_lat = round(c["lat_sum"] / total_cnt, 4)
                avg_lon = round(c["lon_sum"] / total_cnt, 4)
                region_label = _label_south_asia_region(avg_lat, avg_lon)
                event_id = f"FIRMS_SA_{lat_bin:.1f}N_{lon_bin:.1f}E"

                existing = self.db.query(NasaEvent).filter(NasaEvent.eonet_id == event_id).first()
                meta_payload = {
                    "modis_count": c["m_count"],
                    "viirs_count": c["v_count"],
                    "total_detections": total_cnt,
                    "max_frp_mw": round(c["max_frp"], 1),
                    "region": region_label,
                }
                if existing:
                    existing.title = f"{region_label} Fire Complex"
                    existing.latitude = avg_lat
                    existing.longitude = avg_lon
                    existing.first_observed = c["first_dt"]
                    existing.last_observed = c["last_dt"]
                    existing.magnitude_value = round(c["sum_frp"], 1)
                    existing.magnitude_unit = "MW FRP"
                    existing.geometry_count = total_cnt
                    existing.raw_metadata = meta_payload
                else:
                    self.db.add(
                        NasaEvent(
                            eonet_id=event_id,
                            title=f"{region_label} Fire Complex",
                            category="wildfires",
                            status="open",
                            latitude=avg_lat,
                            longitude=avg_lon,
                            first_observed=c["first_dt"],
                            last_observed=c["last_dt"],
                            magnitude_value=round(c["sum_frp"], 1),
                            magnitude_unit="MW FRP",
                            source_ids="NASA_FIRMS",
                            source_url="https://firms.modaps.eosdis.nasa.gov/",
                            eonet_link="https://firms.modaps.eosdis.nasa.gov/map/",
                            geometry_count=total_cnt,
                            raw_metadata=meta_payload
                        )
                    )
                upserted += 1

        self.db.commit()
        return upserted

