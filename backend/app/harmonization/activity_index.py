"""
FireDNA Harmonized Activity Index (HAI) Engine
Computes an experimental multi-sensor prototype activity index.

IMPORTANT: This is an experimental index developed for demonstration and educational use.
It is NOT an officially validated NASA product or certified wildfire danger score.
"""

from typing import Dict, Any, List
from app.core.config import settings
from app.harmonization.normalization import SensorNormalizer


class ActivityIndexEngine:
    """Computes the prototype Harmonized Activity Index (HAI)."""

    def __init__(
        self,
        count_weight: float = None,
        frp_weight: float = None,
        confidence_weight: float = None
    ):
        self.w_count = count_weight if count_weight is not None else settings.HAI_COUNT_WEIGHT
        self.w_frp = frp_weight if frp_weight is not None else settings.HAI_FRP_WEIGHT
        self.w_conf = confidence_weight if confidence_weight is not None else settings.HAI_CONFIDENCE_WEIGHT

        # Ensure normalized weights sum to 1.0
        total_w = self.w_count + self.w_frp + self.w_conf
        if total_w > 0:
            self.w_count /= total_w
            self.w_frp /= total_w
            self.w_conf /= total_w

    def calculate_hai_batch(self, cell_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Calculates HAI scores for a list of aggregated grid cell records.
        """
        if not cell_records:
            return []

        # Extract vectors for batch normalization
        total_counts = [r["total_detections_all"] for r in cell_records]
        # For FRP: conservative maximum between MODIS and VIIRS total FRP
        max_frps = [max(r.get("total_frp_modis", 0.0), r.get("total_frp_viirs", 0.0)) for r in cell_records]

        norm_counts = SensorNormalizer.normalize_count_p95(total_counts)
        norm_frps = SensorNormalizer.normalize_frp_log(max_frps)

        updated_records = []
        for i, rec in enumerate(cell_records):
            s_count = norm_counts[i]
            s_frp = norm_frps[i]

            # Weighted mean confidence of observations in this cell
            conf_modis = rec.get("mean_confidence_modis") or 0.5
            conf_viirs = rec.get("mean_confidence_viirs") or 0.5
            m_cnt = rec.get("modis_count", 0)
            v_cnt = rec.get("total_viirs_count", 0)

            if m_cnt + v_cnt > 0:
                s_conf = (conf_modis * m_cnt + conf_viirs * v_cnt) / (m_cnt + v_cnt)
            else:
                s_conf = 0.5

            s_conf = round(min(max(s_conf, 0.0), 1.0), 4)

            # Composite HAI formula
            hai_val = (self.w_count * s_count) + (self.w_frp * s_frp) + (self.w_conf * s_conf)
            hai_val = round(hai_val, 4)

            rec_copy = dict(rec)
            rec_copy["hai_score"] = hai_val
            rec_copy["hai_count_component"] = round(self.w_count * s_count, 4)
            rec_copy["hai_frp_component"] = round(self.w_frp * s_frp, 4)
            rec_copy["hai_confidence_component"] = round(self.w_conf * s_conf, 4)
            rec_copy["hai_methodology_version"] = settings.METHODOLOGY_VERSION
            rec_copy["hai_is_experimental"] = True

            updated_records.append(rec_copy)

        return updated_records

