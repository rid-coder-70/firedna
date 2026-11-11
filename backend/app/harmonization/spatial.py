"""
FireDNA Spatial Harmonization Engine
Assigns point observations into standard equal-interval latitude-longitude grid cells.
Default resolution: 0.1 degrees (~11 km).
"""

import math
from typing import Dict, Any, Tuple


class SpatialGridManager:
    """Manages spatial grid cell definitions and point assignments."""

    def __init__(self, resolution_deg: float = 0.1):
        self.resolution = round(resolution_deg, 4)

    def get_cell_bounds(self, lat: float, lon: float) -> Tuple[float, float, float, float]:
        """
        Calculates the bounding box for the grid cell containing (lat, lon).
        Returns: (min_lat, max_lat, min_lon, max_lon)
        """
        # Floor to nearest resolution step
        lat_step = math.floor(lat / self.resolution)
        lon_step = math.floor(lon / self.resolution)

        min_lat = round(lat_step * self.resolution, 4)
        max_lat = round(min_lat + self.resolution, 4)
        min_lon = round(lon_step * self.resolution, 4)
        max_lon = round(min_lon + self.resolution, 4)

        return min_lat, max_lat, min_lon, max_lon

    def generate_cell_id(self, min_lat: float, min_lon: float) -> str:
        """
        Generates standard cell identifier string.
        Example: G_23.40N_90.10E_0.1D
        """
        lat_dir = "N" if min_lat >= 0 else "S"
        lon_dir = "E" if min_lon >= 0 else "W"
        return f"G_{abs(min_lat):.2f}{lat_dir}_{abs(min_lon):.2f}{lon_dir}_{self.resolution:.1f}D"

    def assign_to_grid(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Computes all grid cell attributes for a given coordinate pair.
        """
        min_lat, max_lat, min_lon, max_lon = self.get_cell_bounds(lat, lon)
        cell_id = self.generate_cell_id(min_lat, min_lon)
        centroid_lat = round((min_lat + max_lat) / 2.0, 4)
        centroid_lon = round((min_lon + max_lon) / 2.0, 4)

        return {
            "grid_cell_id": cell_id,
            "grid_resolution_deg": self.resolution,
            "cell_lat_min": min_lat,
            "cell_lat_max": max_lat,
            "cell_lon_min": min_lon,
            "cell_lon_max": max_lon,
            "centroid_lat": centroid_lat,
            "centroid_lon": centroid_lon
        }

