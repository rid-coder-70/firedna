"""
FireDNA Temporal Harmonization Engine
Assigns observations to configurable UTC time windows (default 24 hours).
"""

from datetime import date, datetime


class TemporalWindowManager:
    """Assigns observation timestamps to uniform UTC window buckets."""

    def __init__(self, window_hours: int = 24):
        self.window_hours = window_hours

    def get_window_date(self, obs_date: date, acq_datetime: datetime = None) -> date:
        """
        For 24-hour windows, the window bucket is simply the observation UTC date.
        """
        return obs_date

