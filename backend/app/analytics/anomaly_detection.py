"""
FireDNA Anomaly Detection Engine
Calculates historical monthly baselines, statistical Z-scores, and identifies unusual activity.
Optimized for high performance and zero-variance safety.
"""

import math
import logging
from typing import List, Dict, Any, Optional
from datetime import date
from collections import defaultdict
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.models.models import HarmonizedObservation, HistoricalBaseline, ActivityAnomaly

logger = logging.getLogger("firedna.analytics.anomaly_detection")


class AnomalyDetector:
    """Computes Z-scores and categorizes fire anomalies against historical baselines."""

    def __init__(self, db: Session):
        self.db = db

    def classify_z_score(self, z: Optional[float], has_sufficient: bool) -> tuple[str, str]:
        """Maps Z-score to anomaly category and friendly label."""
        if not has_sufficient or z is None:
            return "insufficient_data", "Insufficient baseline data for statistical alert"

        if z < settings.ANOMALY_ELEVATED_Z:
            return "normal", "Within normal seasonal variation"
        elif z < settings.ANOMALY_HIGH_Z:
            return "elevated", "Elevated fire activity"
        elif z < settings.ANOMALY_EXTREME_Z:
            return "high", "Unusually high fire activity"
        else:
            return "extreme", "Extremely unusual fire activity"

    def detect_anomalies_for_date(self, target_date: date) -> List[ActivityAnomaly]:
        """
        Runs batch anomaly detection for all harmonized cells on a specific date.
        """
        cells = self.db.query(HarmonizedObservation).filter(
            HarmonizedObservation.obs_date == target_date
        ).all()

        if not cells:
            return []

        month_idx = target_date.month

        # Pre-load existing baselines in one query
        cell_ids = [c.grid_cell_id for c in cells]
        baselines = self.db.query(HistoricalBaseline).filter(
            HistoricalBaseline.grid_cell_id.in_(cell_ids),
            HistoricalBaseline.instrument == "ALL",
            HistoricalBaseline.month_of_year == month_idx
        ).all()
        baseline_map = {b.grid_cell_id: b for b in baselines}

        # For cells missing a baseline, create an initial baseline record
        new_baselines = []
        for cell in cells:
            if cell.grid_cell_id not in baseline_map:
                b = HistoricalBaseline(
                    grid_cell_id=cell.grid_cell_id,
                    instrument="ALL",
                    month_of_year=month_idx,
                    mean_count=float(cell.total_detections_all),
                    std_count=max(float(cell.total_detections_all) * 0.35, 1.0),
                    median_count=float(cell.total_detections_all),
                    mean_frp=float(cell.max_frp_all or 0.0),
                    std_frp=max(float(cell.max_frp_all or 0.0) * 0.35, 1.0),
                    sample_years=1,
                    sample_records=1,
                    baseline_start_year=target_date.year,
                    baseline_end_year=target_date.year,
                    is_sufficient=False,
                    is_demo_data=cell.is_demo_data
                )
                new_baselines.append(b)
                baseline_map[cell.grid_cell_id] = b

        if new_baselines:
            self.db.add_all(new_baselines)
            self.db.commit()

        # Existing anomalies for this date
        existing_anomalies = {
            a.grid_cell_id: a for a in
            self.db.query(ActivityAnomaly).filter(ActivityAnomaly.obs_date == target_date).all()
        }

        anomalies_to_save = []
        for cell in cells:
            baseline = baseline_map.get(cell.grid_cell_id)
            has_sufficient = bool(baseline and baseline.is_sufficient)
            obs_count = cell.total_detections_all

            z_score = None
            percentile = None

            if baseline and baseline.std_count is not None and baseline.std_count > 0:
                mean_c = baseline.mean_count or 0.0
                std_c = baseline.std_count
                z_score = round((obs_count - mean_c) / std_c, 3)
                percentile = round(0.5 * (1.0 + math.erf(z_score / math.sqrt(2.0))) * 100.0, 1)

            level, label = self.classify_z_score(z_score, has_sufficient)

            anomaly = existing_anomalies.get(cell.grid_cell_id)
            if not anomaly:
                anomaly = ActivityAnomaly(
                    harmonized_obs_id=cell.id,
                    baseline_id=baseline.id if baseline else None,
                    obs_date=target_date,
                    grid_cell_id=cell.grid_cell_id,
                    centroid_lat=cell.centroid_lat,
                    centroid_lon=cell.centroid_lon
                )
                anomalies_to_save.append(anomaly)

            anomaly.z_score = z_score
            anomaly.historical_percentile = percentile
            anomaly.anomaly_level = level
            anomaly.anomaly_label = label
            anomaly.observed_count = obs_count
            anomaly.baseline_mean_count = baseline.mean_count if baseline else None
            anomaly.baseline_std_count = baseline.std_count if baseline else None
            anomaly.observed_frp = cell.max_frp_all
            anomaly.baseline_mean_frp = baseline.mean_frp if baseline else None
            anomaly.has_sufficient_baseline = has_sufficient
            anomaly.is_demo_data = cell.is_demo_data

        if anomalies_to_save:
            self.db.add_all(anomalies_to_save)
        self.db.commit()

        return list(existing_anomalies.values()) + anomalies_to_save
