"""
FireDNA Backend Test Suite Runner
Runs all unit and integration tests across:
1. Ingestion Subsystem (client, parser, cleaner, validator, deduplicator, demo generator)
2. Harmonization Subsystem (spatial gridding, normalization, HAI activity index, validation)
3. Analytics & Anomaly Detection (time series, baselines, Z-scores, percentiles)
4. API Handlers & Export Engines (hotspots, GeoJSON, CSV generation)
"""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import init_db, SessionLocal
from app.models.models import SatelliteObservation, HarmonizedObservation
from app.ingestion.demo_generator import DemoDataGenerator
from app.ingestion.data_cleaner import DataCleaner
from app.ingestion.data_validator import DataValidator
from app.ingestion.deduplicator import Deduplicator
from app.harmonization.spatial import SpatialGridManager
from app.harmonization.normalization import SensorNormalizer
from app.harmonization.activity_index import ActivityIndexEngine
from app.harmonization.validation import HarmonizationValidator
from app.analytics.historical import HistoricalAnalyticsEngine
from app.analytics.anomaly_detection import AnomalyDetector
from app.api.v1.hotspots import get_hotspots, get_hotspot_summary, get_hotspots_geojson
from app.api.v1.exports import export_hotspots_csv, export_hotspots_geojson, export_analytics_csv
from app.api.v1.harmonization import get_methodology_documentation


def run_full_suite():
    print("======================================================================")
    print(" FireDNA Backend Verification & Test Suite")
    print(" NASA Space Apps Challenge 2026 | MODIS and VIIRS Hot Spots")
    print("======================================================================\n")

    init_db()
    db = SessionLocal()

    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f" [PASS] {name}")
        else:
            print(f" [FAIL] {name} - {details}")

    # 1. Ingestion Subsystem Tests
    print("--- 1. Testing Ingestion Subsystem ---")
    modis_csv = DemoDataGenerator.generate_firms_csv("MODIS_NRT", date(2026, 11, 1), date(2026, 11, 2), 5)
    assert_test("Demo MODIS CSV format", "latitude,longitude,brightness" in modis_csv)

    viirs_csv = DemoDataGenerator.generate_firms_csv("VIIRS_SNPP_NRT", date(2026, 11, 1), date(2026, 11, 2), 5)
    assert_test("Demo VIIRS CSV format", "bright_ti4" in viirs_csv)

    parsed = DataCleaner.parse_csv(modis_csv, "MODIS_NRT")
    assert_test("CSV Parser produces records", len(parsed) > 0)

    validated = DataValidator.validate_and_normalize(parsed)
    assert_test("Data Validator validates coordinates", len(validated) > 0)
    assert_test("Confidence normalization", all(0.0 <= r["confidence_normalized"] <= 1.0 for r in validated))

    deduped, _ = Deduplicator.deduplicate(validated, db, check_database=False)
    assert_test("Deduplicator retains unique entries", len(deduped) > 0)

    # 2. Harmonization Subsystem Tests
    print("\n--- 2. Testing Harmonization Subsystem ---")
    grid_mgr = SpatialGridManager(resolution_deg=0.1)
    cell = grid_mgr.assign_to_grid(23.8103, 90.4125)
    assert_test("Spatial Grid Assignment", cell["grid_cell_id"] == "G_23.80N_90.40E_0.1D")
    assert_test("Cell Centroid Calculation", cell["centroid_lat"] == 23.85 and cell["centroid_lon"] == 90.45)

    norm_frp = SensorNormalizer.normalize_frp_log([0.0, 10.0, 100.0])
    assert_test("FRP Log Normalization bounds", norm_frp[0] == 0.0 and norm_frp[-1] == 1.0)

    norm_cnt = SensorNormalizer.normalize_count_p95([1, 5, 20])
    assert_test("Count P95 Normalization", all(0.0 <= c <= 1.0 for c in norm_cnt))

    hai_engine = ActivityIndexEngine()
    sample_cells = [{
        "grid_cell_id": "G_23.80N_90.40E_0.1D",
        "total_detections_all": 12,
        "modis_count": 2,
        "total_viirs_count": 10,
        "total_frp_modis": 40.0,
        "total_frp_viirs": 70.0,
        "mean_confidence_modis": 0.8,
        "mean_confidence_viirs": 0.72
    }]
    hai_res = hai_engine.calculate_hai_batch(sample_cells)
    assert_test("Harmonized Activity Index (HAI) Calculation", "hai_score" in hai_res[0] and hai_res[0]["hai_is_experimental"])
    assert_test("HAI Score Range [0, 1]", 0.0 <= hai_res[0]["hai_score"] <= 1.0)

    agreement = HarmonizationValidator.evaluate_agreement([
        {"modis_count": 1, "total_viirs_count": 2, "total_frp_modis": 15.0, "total_frp_viirs": 25.0}
    ])
    assert_test("Sensor Validation Agreement", "spatial_agreement" in agreement)

    # 3. Anomaly Detection Subsystem Tests
    print("\n--- 3. Testing Anomaly Detection Subsystem ---")
    detector = AnomalyDetector(db)
    lvl_norm, _ = detector.classify_z_score(0.5, has_sufficient=True)
    lvl_elev, _ = detector.classify_z_score(1.8, has_sufficient=True)
    lvl_high, _ = detector.classify_z_score(2.8, has_sufficient=True)
    lvl_extr, _ = detector.classify_z_score(4.0, has_sufficient=True)
    lvl_insuff, _ = detector.classify_z_score(4.0, has_sufficient=False)

    assert_test("Z-score Normal level (< 1.5)", lvl_norm == "normal")
    assert_test("Z-score Elevated level (1.5 - 2.5)", lvl_elev == "elevated")
    assert_test("Z-score High level (2.5 - 3.5)", lvl_high == "high")
    assert_test("Z-score Extreme level (>= 3.5)", lvl_extr == "extreme")
    assert_test("Insufficient baseline safety", lvl_insuff == "insufficient_data")

    # 4. API Endpoints & Export Subsystem Tests
    print("\n--- 4. Testing API Handlers & Export Subsystem ---")
    # Seed at least one record to verify data export rows
    if db.query(SatelliteObservation).count() == 0:
        sample_obs = SatelliteObservation(
            instrument="VIIRS",
            satellite_platform="Suomi-NPP",
            source_product="VIIRS_SNPP_NRT",
            latitude=23.75,
            longitude=90.38,
            acq_date=date(2026, 11, 8),
            acq_time="07:30:00",
            brightness=320.0,
            frp=15.5,
            confidence_category="nominal",
            is_demo_data=True
        )
        db.add(sample_obs)
        db.commit()

    hotspots_res = get_hotspots(bbox=None, db=db)
    assert_test("Hotspots list handler", hotspots_res["status"] == "success")

    summary_res = get_hotspot_summary(bbox=None, db=db)
    assert_test("Hotspots summary handler", summary_res["status"] == "success")

    geojson_res = get_hotspots_geojson(bbox=None, db=db)
    assert_test("GeoJSON export handler", geojson_res.type == "FeatureCollection")

    csv_res = export_hotspots_csv(db=db)
    assert_test("CSV export handler returns text/csv", csv_res.media_type == "text/csv")
    assert_test("CSV export includes NASA FIRMS attribution", b"NASA FIRMS" in csv_res.body or "NASA FIRMS" in str(csv_res.body))

    methodology = get_methodology_documentation()
    assert_test("Methodology documentation endpoint", "hai_formula" in methodology["data"])

    db.close()

    print("\n======================================================================")
    print(f" Test Results: {passed}/{total} Passed ({passed/total*100:.1f}%)")
    print("======================================================================")

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(run_full_suite())
