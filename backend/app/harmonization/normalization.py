"""
FireDNA Sensor Normalization
Normalizes physical measurements (FRP, detection counts) across sensors
without asserting uncalibrated equivalence.
"""

from typing import List
import numpy as np


class SensorNormalizer:
    """Normalizes detection counts and radiative energy."""

    @staticmethod
    def normalize_frp_log(frp_values: List[float]) -> List[float]:
        """
        Log-transforms FRP values (log1p to safely handle 0) and min-max scales to [0, 1].
        """
        if not frp_values:
            return []

        arr = np.array([max(f, 0.0) if f is not None else 0.0 for f in frp_values], dtype=float)
        log_arr = np.log1p(arr)
        min_v = float(np.min(log_arr))
        max_v = float(np.max(log_arr))

        if math_close(max_v, min_v):
            return [0.0] * len(frp_values)

        scaled = (log_arr - min_v) / (max_v - min_v)
        return [round(float(v), 4) for v in scaled]

    @staticmethod
    def normalize_count_p95(counts: List[int]) -> List[float]:
        """
        Normalizes detection counts relative to the 95th percentile to avoid outlier distortion.
        Clipped to [0, 1].
        """
        if not counts:
            return []

        arr = np.array([max(c, 0) for c in counts], dtype=float)
        if np.max(arr) == 0:
            return [0.0] * len(counts)

        p95 = float(np.percentile(arr, 95))
        if p95 <= 0.0:
            p95 = float(np.max(arr))

        scaled = np.clip(arr / p95, 0.0, 1.0)
        return [round(float(v), 4) for v in scaled]


def math_close(a: float, b: float, tol: float = 1e-9) -> bool:
    return abs(a - b) < tol

