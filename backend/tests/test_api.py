"""
API Integration & Contract Tests
Uses httpx.ASGITransport for clean, non-blocking asynchronous endpoint testing.
"""

import unittest
import asyncio
from datetime import date
import httpx
from app.main import app
from app.core.database import init_db, SessionLocal
from app.models.models import SatelliteObservation


class TestAPIEndpoints(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        db = SessionLocal()
        try:
            if db.query(SatelliteObservation).count() == 0:
                db.add(SatelliteObservation(
                    instrument="VIIRS",
                    satellite_platform="Suomi-NPP",
                    source_product="VIIRS_SNPP_NRT",
                    latitude=23.75,
                    longitude=90.38,
                    acq_date=date.today(),
                    acq_time="07:30:00",
                    brightness=320.0,
                    frp=15.5,
                    confidence_category="nominal",
                    is_demo_data=True
                ))
                db.commit()
        finally:
            db.close()

    def _run_async(self, coro):
        return asyncio.run(coro)

    def test_health_endpoint(self):
        async def _test():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.get("/health")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertEqual(data["status"], "healthy")
                self.assertIn("version", data)
        self._run_async(_test())

    def test_info_endpoint(self):
        async def _test():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.get("/info")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertEqual(data["name"], "FireDNA API")
                self.assertIn("MODIS_NRT", data["supported_products"])
        self._run_async(_test())

    def test_hotspots_endpoint(self):
        async def _test():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.get("/api/v1/hotspots")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertEqual(data["status"], "success")
                self.assertIn("hotspots", data["data"])
        self._run_async(_test())

    def test_hotspots_geojson_endpoint(self):
        async def _test():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.get("/api/v1/hotspots/geojson")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertEqual(data["type"], "FeatureCollection")
                self.assertIn("features", data)
        self._run_async(_test())

    def test_harmonization_methodology_endpoint(self):
        async def _test():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.get("/api/v1/harmonization/methodology")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertIn("hai_formula", data["data"])
                self.assertIn("weights", data["data"])
        self._run_async(_test())

    def test_csv_export_endpoint(self):
        async def _test():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.get("/api/v1/export/hotspots.csv")
                self.assertEqual(res.status_code, 200)
                self.assertIn("text/csv", res.headers.get("content-type", ""))
                self.assertIn("latitude", res.text)
                self.assertIn("NASA FIRMS", res.text)
        self._run_async(_test())


if __name__ == "__main__":
    unittest.main()
