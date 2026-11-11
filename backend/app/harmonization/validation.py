"""
FireDNA Harmonization Validation Engine
Calculates spatial agreement, temporal concurrence, and correlation statistics
between MODIS and VIIRS observations.
"""

from typing import List, Dict, Any
import numpy as np


class HarmonizationValidator:
    """Computes descriptive validation metrics between sensors."""

    @staticmethod
    def evaluate_agreement(cell_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluates multi-sensor detection overlap and statistical agreement.
        """
        if not cell_records:
            return {
                "spatial_agreement": {"overlap_fraction": 0.0, "cells_both": 0, "cells_modis_only": 0, "cells_viirs_only": 0},
                "temporal_agreement": {"same_day_co_detection_fraction": 0.0},
                "frp_correlation": {"pearson_r": 0.0, "n_paired_cells": 0},
                "disclaimer": "Insufficient data to compute validation statistics."
            }

        both_count = 0
        modis_only = 0
        viirs_only = 0

        paired_modis_frp = []
        paired_viirs_frp = []

        for r in cell_records:
            has_m = (r.get("modis_count", 0) > 0)
            has_v = (r.get("total_viirs_count", 0) > 0)

            if has_m and has_v:
                both_count += 1
                m_frp = r.get("total_frp_modis", 0.0)
                v_frp = r.get("total_frp_viirs", 0.0)
                if m_frp > 0 and v_frp > 0:
                    paired_modis_frp.append(m_frp)
                    paired_viirs_frp.append(v_frp)
            elif has_m:
                modis_only += 1
            elif has_v:
                viirs_only += 1

        total_active_cells = both_count + modis_only + viirs_only
        overlap_fraction = round(both_count / total_active_cells, 3) if total_active_cells > 0 else 0.0

        # Pearson correlation on log(FRP) for co-detected cells
        pearson_r = 0.0
        if len(paired_modis_frp) >= 3:
            log_m = np.log1p(paired_modis_frp)
            log_v = np.log1p(paired_viirs_frp)
            if np.std(log_m) > 0 and np.std(log_v) > 0:
                corr_matrix = np.corrcoef(log_m, log_v)
                pearson_r = round(float(corr_matrix[0, 1]), 3)

        return {
            "spatial_agreement": {
                "total_active_cells": total_active_cells,
                "cells_both_sensors": both_count,
                "cells_modis_only": modis_only,
                "cells_viirs_only": viirs_only,
                "overlap_fraction": overlap_fraction
            },
            "temporal_agreement": {
                "same_day_co_detection_fraction": overlap_fraction
            },
            "frp_correlation": {
                "pearson_r": pearson_r,
                "n_paired_cells": len(paired_modis_frp),
                "note": "Log-FRP correlation in cells co-detected by both MODIS and VIIRS."
            },
            "disclaimer": (
                "These metrics describe observational agreement across the available dataset. "
                "They are not an official sensor calibration or NASA accuracy verification."
            )
        }

