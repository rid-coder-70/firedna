"""
FireDNA Harmonization Service
Aggregates satellite observations into grid cells and computes the Harmonized Activity Index.
"""

import time
import logging
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.models.models import SatelliteObservation, HarmonizedObservation, ProcessingRun
from app.harmonization.spatial import SpatialGridManager
from app.harmonization.activity_index import ActivityIndexEngine

logger = logging.getLogger("firedna.services.harmonization")


class HarmonizationService:
    """Service managing spatial and temporal harmonization workflows."""

    def __init__(self, db: Session):
        self.db = db

    def run_harmonization(
        self,
        grid_resolution_deg: float = 0.1,
        temporal_window_hours: int = 24,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        bbox: Optional[dict] = None,
        recompute: bool = False
    ) -> str:
        """
        Executes harmonization across raw observations and stores results.
        Returns the ProcessingRun ID.
        """
        start_time = time.time()
        grid_mgr = SpatialGridManager(resolution_deg=grid_resolution_deg)
        hai_engine = ActivityIndexEngine()

        # Create processing run log
        proc_run = ProcessingRun(
            run_type="harmonization",
            status="running",
            methodology_version=settings.METHODOLOGY_VERSION,
            parameters={
                "grid_resolution_deg": grid_resolution_deg,
                "temporal_window_hours": temporal_window_hours,
                "start_date": str(start_date) if start_date else None,
                "end_date": str(end_date) if end_date else None,
                "bbox": bbox
            }
        )
        self.db.add(proc_run)
        self.db.commit()
        self.db.refresh(proc_run)

        try:
            # Query observations
            query = self.db.query(SatelliteObservation)
            if start_date:
                query = query.filter(SatelliteObservation.acq_date >= start_date)
            if end_date:
                query = query.filter(SatelliteObservation.acq_date <= end_date)
            if bbox:
                query = query.filter(
                    SatelliteObservation.latitude >= bbox["min_lat"],
                    SatelliteObservation.latitude <= bbox["max_lat"],
                    SatelliteObservation.longitude >= bbox["min_lon"],
                    SatelliteObservation.longitude <= bbox["max_lon"]
                )

            observations = query.all()
            proc_run.input_record_count = len(observations)

            if not observations:
                proc_run.status = "success"
                proc_run.output_record_count = 0
                proc_run.completed_at = datetime.now(timezone.utc)
                proc_run.duration_seconds = round(time.time() - start_time, 2)
                self.db.commit()
                return proc_run.id

            # Group by (grid_cell_id, obs_date)
            grouped = defaultdict(lambda: {
                "cell_info": None,
                "obs_date": None,
                "modis_count": 0,
                "viirs_snpp_count": 0,
                "viirs_noaa20_count": 0,
                "viirs_noaa21_count": 0,
                "modis_frp_list": [],
                "viirs_frp_list": [],
                "modis_conf_list": [],
                "viirs_conf_list": [],
                "day_count": 0,
                "night_count": 0,
                "is_demo_data": False
            })

            for obs in observations:
                cell_info = grid_mgr.assign_to_grid(obs.latitude, obs.longitude)
                cell_id = cell_info["grid_cell_id"]
                key = (cell_id, obs.acq_date)

                group = grouped[key]
                if group["cell_info"] is None:
                    group["cell_info"] = cell_info
                    group["obs_date"] = obs.acq_date
                    group["is_demo_data"] = obs.is_demo_data

                is_modis = (obs.instrument == "MODIS")
                frp_val = obs.frp or 0.0
                conf_val = obs.confidence_normalized or 0.5

                if obs.daynight == "D":
                    group["day_count"] += 1
                else:
                    group["night_count"] += 1

                if is_modis:
                    group["modis_count"] += 1
                    group["modis_frp_list"].append(frp_val)
                    group["modis_conf_list"].append(conf_val)
                else:
                    # VIIRS platforms
                    plat = obs.satellite_platform
                    if "20" in plat:
                        group["viirs_noaa20_count"] += 1
                    elif "21" in plat:
                        group["viirs_noaa21_count"] += 1
                    else:
                        group["viirs_snpp_count"] += 1

                    group["viirs_frp_list"].append(frp_val)
                    group["viirs_conf_list"].append(conf_val)

            # Build intermediate cell records for HAI calculation
            cell_records = []
            for (cell_id, obs_d), data in grouped.items():
                c_info = data["cell_info"]
                v_total = data["viirs_snpp_count"] + data["viirs_noaa20_count"] + data["viirs_noaa21_count"]
                m_total = data["modis_count"]

                total_frp_m = sum(data["modis_frp_list"])
                total_frp_v = sum(data["viirs_frp_list"])
                all_frps = data["modis_frp_list"] + data["viirs_frp_list"]
                max_frp = max(all_frps) if all_frps else 0.0

                mean_frp_m = total_frp_m / len(data["modis_frp_list"]) if data["modis_frp_list"] else None
                mean_frp_v = total_frp_v / len(data["viirs_frp_list"]) if data["viirs_frp_list"] else None

                mean_conf_m = sum(data["modis_conf_list"]) / len(data["modis_conf_list"]) if data["modis_conf_list"] else None
                mean_conf_v = sum(data["viirs_conf_list"]) / len(data["viirs_conf_list"]) if data["viirs_conf_list"] else None

                cell_rec = {
                    "grid_cell_id": cell_id,
                    "grid_resolution_deg": grid_resolution_deg,
                    "cell_lat_min": c_info["cell_lat_min"],
                    "cell_lat_max": c_info["cell_lat_max"],
                    "cell_lon_min": c_info["cell_lon_min"],
                    "cell_lon_max": c_info["cell_lon_max"],
                    "centroid_lat": c_info["centroid_lat"],
                    "centroid_lon": c_info["centroid_lon"],
                    "obs_date": obs_d,
                    "temporal_window_hours": temporal_window_hours,
                    "modis_count": m_total,
                    "viirs_snpp_count": data["viirs_snpp_count"],
                    "viirs_noaa20_count": data["viirs_noaa20_count"],
                    "viirs_noaa21_count": data["viirs_noaa21_count"],
                    "total_viirs_count": v_total,
                    "total_detections_all": m_total + v_total,
                    "total_frp_modis": round(total_frp_m, 2),
                    "mean_frp_modis": round(mean_frp_m, 2) if mean_frp_m is not None else None,
                    "total_frp_viirs": round(total_frp_v, 2),
                    "mean_frp_viirs": round(mean_frp_v, 2) if mean_frp_v is not None else None,
                    "max_frp_all": round(max_frp, 2),
                    "mean_confidence_modis": round(mean_conf_m, 2) if mean_conf_m is not None else None,
                    "mean_confidence_viirs": round(mean_conf_v, 2) if mean_conf_v is not None else None,
                    "day_count": data["day_count"],
                    "night_count": data["night_count"],
                    "is_demo_data": data["is_demo_data"]
                }
                cell_records.append(cell_rec)

            # Compute HAI scores across all cells
            harmonized_records = hai_engine.calculate_hai_batch(cell_records)

            # Save to Database
            if recompute:
                # Clear existing for the date range
                del_query = self.db.query(HarmonizedObservation)
                if start_date:
                    del_query = del_query.filter(HarmonizedObservation.obs_date >= start_date)
                if end_date:
                    del_query = del_query.filter(HarmonizedObservation.obs_date <= end_date)
                del_query.delete(synchronize_session=False)
                self.db.commit()

            harm_objects = []
            for h_rec in harmonized_records:
                harm_obj = HarmonizedObservation(
                    processing_run_id=proc_run.id,
                    grid_cell_id=h_rec["grid_cell_id"],
                    grid_resolution_deg=h_rec["grid_resolution_deg"],
                    cell_lat_min=h_rec["cell_lat_min"],
                    cell_lat_max=h_rec["cell_lat_max"],
                    cell_lon_min=h_rec["cell_lon_min"],
                    cell_lon_max=h_rec["cell_lon_max"],
                    centroid_lat=h_rec["centroid_lat"],
                    centroid_lon=h_rec["centroid_lon"],
                    obs_date=h_rec["obs_date"],
                    temporal_window_hours=h_rec["temporal_window_hours"],
                    modis_count=h_rec["modis_count"],
                    viirs_snpp_count=h_rec["viirs_snpp_count"],
                    viirs_noaa20_count=h_rec["viirs_noaa20_count"],
                    viirs_noaa21_count=h_rec["viirs_noaa21_count"],
                    total_viirs_count=h_rec["total_viirs_count"],
                    total_detections_all=h_rec["total_detections_all"],
                    total_frp_modis=h_rec["total_frp_modis"],
                    mean_frp_modis=h_rec["mean_frp_modis"],
                    total_frp_viirs=h_rec["total_frp_viirs"],
                    mean_frp_viirs=h_rec["mean_frp_viirs"],
                    max_frp_all=h_rec["max_frp_all"],
                    hai_score=h_rec["hai_score"],
                    hai_count_component=h_rec["hai_count_component"],
                    hai_frp_component=h_rec["hai_frp_component"],
                    hai_confidence_component=h_rec["hai_confidence_component"],
                    hai_methodology_version=h_rec["hai_methodology_version"],
                    hai_is_experimental=True,
                    mean_confidence_modis=h_rec["mean_confidence_modis"],
                    mean_confidence_viirs=h_rec["mean_confidence_viirs"],
                    day_count=h_rec["day_count"],
                    night_count=h_rec["night_count"],
                    is_demo_data=h_rec["is_demo_data"]
                )
                harm_objects.append(harm_obj)

            if harm_objects:
                self.db.add_all(harm_objects)
                self.db.commit()

            proc_run.output_record_count = len(harm_objects)
            proc_run.status = "success"
            proc_run.completed_at = datetime.now(timezone.utc)
            proc_run.duration_seconds = round(time.time() - start_time, 2)
            self.db.commit()

            logger.info("Harmonization completed: %d observations -> %d cells in %.2fs",
                        proc_run.input_record_count, proc_run.output_record_count, proc_run.duration_seconds)

            return proc_run.id

        except Exception as exc:
            self.db.rollback()
            proc_run.status = "failed"
            proc_run.error_message = str(exc)
            proc_run.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            logger.error("Harmonization failed: %s", str(exc), exc_info=True)
            raise

