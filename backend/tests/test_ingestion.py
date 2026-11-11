"""
Unit Tests for Data Ingestion Subsystem
"""

import unittest
from datetime import date
from app.ingestion.demo_generator import DemoDataGenerator
from app.ingestion.data_cleaner import DataCleaner
from app.ingestion.data_validator import DataValidator
from app.ingestion.deduplicator import Deduplicator


class TestIngestionSubsystem(unittest.TestCase):

    def test_demo_generator_modis(self):
        csv_text = DemoDataGenerator.generate_firms_csv(
            product="MODIS_NRT",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 2),
            num_records_per_day=5
        )
        self.assertIn("latitude,longitude,brightness", csv_text)
        self.assertIn("MODIS", csv_text)

    def test_demo_generator_viirs(self):
        csv_text = DemoDataGenerator.generate_firms_csv(
            product="VIIRS_SNPP_NRT",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 2),
            num_records_per_day=5
        )
        self.assertIn("bright_ti4", csv_text)
        self.assertIn("VIIRS", csv_text)

    def test_cleaner_and_validator(self):
        csv_sample = (
            "latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight\n"
            "23.50,90.20,325.4,1.2,1.1,2026-11-05,0430,T,MODIS,nominal,6.1NRT,290.0,15.2,D\n"
            "999.0,90.20,325.4,1.2,1.1,2026-11-05,0430,T,MODIS,nominal,6.1NRT,290.0,15.2,D\n"  # Invalid lat
        )
        records = DataCleaner.parse_csv(csv_sample, "MODIS_NRT")
        self.assertEqual(len(records), 2)

        valid = DataValidator.validate_and_normalize(records)
        # Invalid coordinate (lat 999.0) must be discarded
        self.assertEqual(len(valid), 1)
        self.assertEqual(valid[0]["latitude"], 23.50)
        self.assertEqual(valid[0]["confidence_category"], "nominal")
        self.assertEqual(valid[0]["confidence_normalized"], 0.66)

    def test_confidence_normalization(self):
        # VIIRS numeric confidence
        norm_v, cat_v = DataValidator.normalize_confidence("85", "VIIRS")
        self.assertEqual(norm_v, 0.85)
        self.assertEqual(cat_v, "high")

        # MODIS categorical confidence
        norm_m, cat_m = DataValidator.normalize_confidence("low", "MODIS")
        self.assertEqual(norm_m, 0.33)
        self.assertEqual(cat_m, "low")


if __name__ == "__main__":
    unittest.main()

