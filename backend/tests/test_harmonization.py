"""
Unit Tests for Harmonization Subsystem
"""

import unittest
from app.harmonization.spatial import SpatialGridManager
from app.harmonization.normalization import SensorNormalizer
from app.harmonization.activity_index import ActivityIndexEngine
from app.harmonization.validation import HarmonizationValidator


class TestHarmonizationSubsystem(unittest.TestCase):

    def test_spatial_grid_assignment(self):
        mgr = SpatialGridManager(resolution_deg=0.1)
        # Coordinate in Dhaka: 23.8103, 90.4125
        info = mgr.assign_to_grid(23.8103, 90.4125)

        self.assertEqual(info["cell_lat_min"], 23.8)
        self.assertEqual(info["cell_lat_max"], 23.9)
        self.assertEqual(info["cell_lon_min"], 90.4)
        self.assertEqual(info["cell_lon_max"], 90.5)
        self.assertEqual(info["grid_cell_id"], "G_23.80N_90.40E_0.1D")
        self.assertEqual(info["centroid_lat"], 23.85)
        self.assertEqual(info["centroid_lon"], 90.45)

    def test_frp_log_normalization(self):
        frps = [0.0, 10.0, 50.0, 200.0]
        norm = SensorNormalizer.normalize_frp_log(frps)

        self.assertEqual(len(norm), 4)
        self.assertEqual(norm[0], 0.0)
        self.assertEqual(norm[-1], 1.0)
        self.assertTrue(all(0.0 <= v <= 1.0 for v in norm))

    def test_count_p95_normalization(self):
        counts = [1, 2, 5, 10, 50]
        norm = SensorNormalizer.normalize_count_p95(counts)

        self.assertEqual(len(norm), 5)
        self.assertTrue(all(0.0 <= v <= 1.0 for v in norm))

    def test_activity_index_calculation(self):
        engine = ActivityIndexEngine()
        cells = [
            {
                "grid_cell_id": "G_23.80N_90.40E_0.1D",
                "total_detections_all": 10,
                "modis_count": 2,
                "total_viirs_count": 8,
                "total_frp_modis": 45.0,
                "total_frp_viirs": 65.0,
                "mean_confidence_modis": 0.8,
                "mean_confidence_viirs": 0.75
            },
            {
                "grid_cell_id": "G_24.00N_91.00E_0.1D",
                "total_detections_all": 1,
                "modis_count": 0,
                "total_viirs_count": 1,
                "total_frp_modis": 0.0,
                "total_frp_viirs": 8.0,
                "mean_confidence_modis": None,
                "mean_confidence_viirs": 0.60
            }
        ]

        results = engine.calculate_hai_batch(cells)
        self.assertEqual(len(results), 2)
        for r in results:
            self.assertIn("hai_score", r)
            self.assertIn("hai_frp_component", r)
            self.assertIn("hai_count_component", r)
            self.assertTrue(r["hai_is_experimental"])
            self.assertTrue(0.0 <= r["hai_score"] <= 1.0)

    def test_validation_agreement(self):
        cells = [
            {"modis_count": 2, "total_viirs_count": 5, "total_frp_modis": 20.0, "total_frp_viirs": 35.0},
            {"modis_count": 0, "total_viirs_count": 3, "total_frp_modis": 0.0, "total_frp_viirs": 15.0},
            {"modis_count": 1, "total_viirs_count": 0, "total_frp_modis": 12.0, "total_frp_viirs": 0.0}
        ]
        res = HarmonizationValidator.evaluate_agreement(cells)

        self.assertEqual(res["spatial_agreement"]["cells_both_sensors"], 1)
        self.assertEqual(res["spatial_agreement"]["cells_viirs_only"], 1)
        self.assertEqual(res["spatial_agreement"]["cells_modis_only"], 1)
        self.assertAlmostEqual(res["spatial_agreement"]["overlap_fraction"], 1/3, places=2)


if __name__ == "__main__":
    unittest.main()

