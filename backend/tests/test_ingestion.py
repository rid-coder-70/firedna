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

    def test_eonet_normalization(self):
        from app.ingestion.eonet_client import EONETClient
        raw_event = {
            "id": "EONET_9999",
            "title": "Test Wildfire Event",
            "link": "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_9999",
            "closed": None,
            "categories": [{"id": "wildfires"}],
            "sources": [{"id": "InciWeb", "url": "https://inciweb.wildfire.gov"}],
            "geometry": [
                {"date": "2026-11-01T12:00:00Z", "type": "Point", "coordinates": [-120.5, 38.2], "magnitudeValue": 1500.0, "magnitudeUnit": "acres"}
            ]
        }
        norm = EONETClient.normalize_event(raw_event)
        self.assertIsNotNone(norm)
        self.assertEqual(norm["eonet_id"], "EONET_9999")
        self.assertEqual(norm["latitude"], 38.2)
        self.assertEqual(norm["longitude"], -120.5)
        self.assertEqual(norm["status"], "open")
        self.assertEqual(norm["magnitude_value"], 1500.0)

    def test_firms_product_segments(self):
        from app.ingestion.firms_client import FIRMSClient
        from datetime import date
        availability = [
            {"data_id": "MODIS_NRT", "min_date": "2026-08-01", "max_date": "2026-11-12"},
            {"data_id": "MODIS_SP", "min_date": "2000-11-01", "max_date": "2026-07-31"}
        ]
        segments = FIRMSClient.plan_product_segments(
            "MODIS_NRT",
            date(2026, 6, 1),
            date(2026, 9, 1),
            availability
        )
        # Should split into SP archive and NRT segment
        self.assertEqual(len(segments), 2)
        self.assertEqual(segments[0][0], "MODIS_SP")
        self.assertEqual(segments[1][0], "MODIS_NRT")



if __name__ == "__main__":
    unittest.main()

