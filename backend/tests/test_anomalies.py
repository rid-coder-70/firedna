"""
Unit Tests for Anomaly Detection Subsystem
"""

import unittest
from unittest.mock import MagicMock
from app.analytics.anomaly_detection import AnomalyDetector


class TestAnomalyDetection(unittest.TestCase):

    def setUp(self):
        self.mock_db = MagicMock()
        self.detector = AnomalyDetector(self.mock_db)

    def test_z_score_classification_levels(self):
        # Normal (Z < 1.5)
        lvl, _ = self.detector.classify_z_score(0.8, has_sufficient=True)
        self.assertEqual(lvl, "normal")

        # Elevated (1.5 <= Z < 2.5)
        lvl, _ = self.detector.classify_z_score(1.8, has_sufficient=True)
        self.assertEqual(lvl, "elevated")

        # High (2.5 <= Z < 3.5)
        lvl, _ = self.detector.classify_z_score(2.9, has_sufficient=True)
        self.assertEqual(lvl, "high")

        # Extreme (Z >= 3.5)
        lvl, _ = self.detector.classify_z_score(4.2, has_sufficient=True)
        self.assertEqual(lvl, "extreme")

    def test_insufficient_baseline_safety(self):
        # When baseline is insufficient (< 3 years), do not flag as alarming
        lvl, label = self.detector.classify_z_score(4.5, has_sufficient=False)
        self.assertEqual(lvl, "insufficient_data")
        self.assertIn("Insufficient baseline", label)

    def test_none_z_score_handling(self):
        lvl, _ = self.detector.classify_z_score(None, has_sufficient=True)
        self.assertEqual(lvl, "insufficient_data")


if __name__ == "__main__":
    unittest.main()

