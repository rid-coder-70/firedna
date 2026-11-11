"""
FireDNA Historical Analytics Engine
Aggregates fire activity across daily, monthly, yearly, and seasonal periods.
"""

from typing import List, Dict, Any, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import SatelliteObservation, HarmonizedObservation

SEASONS = {
    "DJF": {"name": "Winter (Dry)", "months": [12, 1, 2]},
    "MAM": {"name": "Pre-Monsoon (Fire Peak)", "months": [3, 4, 5]},
    "JJA": {"name": "Monsoon (Low Activity)", "months": [6, 7, 8]},
    "SON": {"name": "Post-Monsoon (Harvest Burning)", "months": [9, 10, 11]},
}


class HistoricalAnalyticsEngine:
    """Computes temporal activity series and seasonal distributions."""

    def __init__(self, db: Session):
        self.db = db

    def get_daily_series(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        bbox: Optional[dict] = None
    ) -> List[Dict[str, Any]]:
        """
        Returns daily breakdown of MODIS, VIIRS, and harmonized activity.
        """
        query = self.db.query(
            HarmonizedObservation.obs_date,
            func.sum(HarmonizedObservation.modis_count).label("modis_count"),
            func.sum(HarmonizedObservation.total_viirs_count).label("viirs_count"),
            func.sum(HarmonizedObservation.total_detections_all).label("total_count"),
            func.sum(HarmonizedObservation.total_frp_modis).label("total_frp_modis"),
            func.sum(HarmonizedObservation.total_frp_viirs).label("total_frp_viirs"),
            func.avg(HarmonizedObservation.hai_score).label("hai_mean")
        ).group_by(HarmonizedObservation.obs_date).order_by(HarmonizedObservation.obs_date)

        if start_date:
            query = query.filter(HarmonizedObservation.obs_date >= start_date)
        if end_date:
            query = query.filter(HarmonizedObservation.obs_date <= end_date)
        if bbox:
            query = query.filter(
                HarmonizedObservation.centroid_lat >= bbox["min_lat"],
                HarmonizedObservation.centroid_lat <= bbox["max_lat"],
                HarmonizedObservation.centroid_lon >= bbox["min_lon"],
                HarmonizedObservation.centroid_lon <= bbox["max_lon"]
            )

        rows = query.all()
        results = []
        for r in rows:
            results.append({
                "date": str(r[0]),
                "modis_count": int(r[1] or 0),
                "viirs_count": int(r[2] or 0),
                "total_count": int(r[3] or 0),
                "total_frp_modis": round(float(r[4] or 0.0), 2),
                "total_frp_viirs": round(float(r[5] or 0.0), 2),
                "hai_mean": round(float(r[6]), 3) if r[6] is not None else None
            })
        return results

    def get_monthly_distribution(self, year: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Returns monthly counts and FRP distribution across months 1-12.
        """
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        results = []

        for m_idx in range(1, 13):
            # Using SQLite / PostgreSQL compatible date extraction
            obs_query = self.db.query(
                func.sum(SatelliteObservation.frp).label("sum_frp"),
                func.avg(SatelliteObservation.frp).label("avg_frp")
            ).filter(func.strftime("%m", SatelliteObservation.acq_date) == f"{m_idx:02d}")

            m_count = self.db.query(func.count(SatelliteObservation.id)).filter(
                SatelliteObservation.instrument == "MODIS",
                func.strftime("%m", SatelliteObservation.acq_date) == f"{m_idx:02d}"
            ).scalar() or 0

            v_count = self.db.query(func.count(SatelliteObservation.id)).filter(
                SatelliteObservation.instrument == "VIIRS",
                func.strftime("%m", SatelliteObservation.acq_date) == f"{m_idx:02d}"
            ).scalar() or 0

            frp_stats = obs_query.first()
            avg_frp = round(float(frp_stats[1]), 2) if frp_stats and frp_stats[1] is not None else None

            results.append({
                "month": m_idx,
                "month_name": month_names[m_idx - 1],
                "modis_count": m_count,
                "viirs_count": v_count,
                "total_count": m_count + v_count,
                "mean_frp": avg_frp
            })

        return results

    def get_seasonal_breakdown(self) -> List[Dict[str, Any]]:
        """
        Groups fire detections into standard climatological seasons.
        """
        results = []
        for code, info in SEASONS.items():
            month_strings = [f"{m:02d}" for m in info["months"]]

            m_count = self.db.query(func.count(SatelliteObservation.id)).filter(
                SatelliteObservation.instrument == "MODIS",
                func.strftime("%m", SatelliteObservation.acq_date).in_(month_strings)
            ).scalar() or 0

            v_count = self.db.query(func.count(SatelliteObservation.id)).filter(
                SatelliteObservation.instrument == "VIIRS",
                func.strftime("%m", SatelliteObservation.acq_date).in_(month_strings)
            ).scalar() or 0

            total_days = len(info["months"]) * 30  # approx seasonal days
            total = m_count + v_count

            results.append({
                "season": code,
                "name": info["name"],
                "modis_count": m_count,
                "viirs_count": v_count,
                "total_count": total,
                "mean_daily_count": round(total / total_days, 1)
            })

        return results

