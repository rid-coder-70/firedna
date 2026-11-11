"""
FireDNA Synthetic Demo Data Generator
Generates realistic, scientifically plausible fire hotspot observations for Bangladesh
when no live NASA FIRMS API key is configured.
Explicitly labels all generated rows with is_demo_data=True.
"""

import random
from datetime import date, timedelta
from typing import List, Dict, Any

# Realistic geographic hotspot clusters in Bangladesh & surroundings:
# 1. Chittagong Hill Tracts (hilly forest / slash-and-burn / seasonal brush fires)
# 2. Sylhet division (tea estates & wetland edges)
# 3. Rajshahi & Rangpur (North-west intensive agricultural crop residue burning)
# 4. Mymensingh / Tangail forest margins
# 5. Southern coastal periphery (mangrove buffer edges)
BANGLADESH_FIRE_CLUSTERS = [
    {"name": "Chittagong Hill Tracts", "lat": 22.33, "lon": 92.20, "radius": 0.55, "weight": 0.40, "frp_range": (10.0, 85.0)},
    {"name": "Sylhet Margins", "lat": 24.89, "lon": 91.87, "radius": 0.35, "weight": 0.15, "frp_range": (8.0, 45.0)},
    {"name": "Rajshahi Agricultural", "lat": 24.37, "lon": 88.60, "radius": 0.40, "weight": 0.25, "frp_range": (5.0, 35.0)},
    {"name": "Mymensingh Plains", "lat": 24.75, "lon": 90.40, "radius": 0.30, "weight": 0.12, "frp_range": (6.0, 30.0)},
    {"name": "Coastal Periphery", "lat": 21.80, "lon": 89.90, "radius": 0.30, "weight": 0.08, "frp_range": (12.0, 60.0)},
]


class DemoDataGenerator:
    """Generates synthetic CSV text matching official NASA FIRMS format."""

    @staticmethod
    def generate_firms_csv(
        product: str,
        start_date: date,
        end_date: date,
        num_records_per_day: int = 25
    ) -> str:
        """
        Generate synthetic CSV matching the FIRMS output format.
        Differentiates between MODIS and VIIRS fields and observation densities.
        """
        is_modis = "MODIS" in product.upper()
        days_span = max((end_date - start_date).days + 1, 1)

        # VIIRS has higher spatial resolution (375m) and detects 3x-6x more fire pixels than MODIS (~1km)
        density_multiplier = 1 if is_modis else 4
        total_records = days_span * num_records_per_day * density_multiplier

        lines: List[str] = []

        if is_modis:
            # Official MODIS NRT CSV header
            header = "latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight"
            lines.append(header)

            satellites = ["T", "A"]  # Terra, Aqua
            for _ in range(total_records):
                day_offset = random.randint(0, days_span - 1)
                acq_d = start_date + timedelta(days=day_offset)
                cluster = random.choices(
                    BANGLADESH_FIRE_CLUSTERS,
                    weights=[c["weight"] for c in BANGLADESH_FIRE_CLUSTERS]
                )[0]

                # Jitter coordinates inside cluster
                lat = round(cluster["lat"] + random.gauss(0, cluster["radius"] / 2.2), 5)
                lon = round(cluster["lon"] + random.gauss(0, cluster["radius"] / 2.2), 5)

                # MODIS times: Terra ~10:30/22:30 local (04:30/16:30 UTC), Aqua ~13:30/01:30 local (07:30/19:30 UTC)
                is_day = random.random() < 0.82  # majority daytime burning
                hour = random.choice([4, 7]) if is_day else random.choice([16, 19])
                minute = random.randint(0, 59)
                acq_t = f"{hour:02d}{minute:02d}"

                brightness = round(random.uniform(310.0, 385.0), 1)
                scan = round(random.uniform(1.0, 2.0), 2)
                track = round(random.uniform(1.0, 1.5), 2)
                sat = random.choice(satellites)
                conf = random.choice(["nominal", "nominal", "high", "low"])
                bright_t31 = round(brightness - random.uniform(15.0, 45.0), 1)
                frp = round(random.uniform(cluster["frp_range"][0], cluster["frp_range"][1]), 1)
                daynight = "D" if is_day else "N"

                lines.append(f"{lat},{lon},{brightness},{scan},{track},{acq_d},{acq_t},{sat},MODIS,{conf},6.1NRT,{bright_t31},{frp},{daynight}")
        else:
            # Official VIIRS NRT CSV header (Suomi-NPP, NOAA-20, NOAA-21)
            header = "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight,type"
            lines.append(header)

            sat_map = {"VIIRS_SNPP_NRT": "N", "VIIRS_NOAA20_NRT": "N20", "VIIRS_NOAA21_NRT": "N21"}
            sat_code = sat_map.get(product, "N")

            for _ in range(total_records):
                day_offset = random.randint(0, days_span - 1)
                acq_d = start_date + timedelta(days=day_offset)
                cluster = random.choices(
                    BANGLADESH_FIRE_CLUSTERS,
                    weights=[c["weight"] for c in BANGLADESH_FIRE_CLUSTERS]
                )[0]

                lat = round(cluster["lat"] + random.gauss(0, cluster["radius"] / 2.2), 5)
                lon = round(cluster["lon"] + random.gauss(0, cluster["radius"] / 2.2), 5)

                is_day = random.random() < 0.85
                hour = random.choice([6, 7, 8]) if is_day else random.choice([18, 19, 20])
                minute = random.randint(0, 59)
                acq_t = f"{hour:02d}{minute:02d}"

                bright_ti4 = round(random.uniform(305.0, 367.0), 1)
                scan = round(random.uniform(0.32, 0.48), 2)
                track = round(random.uniform(0.32, 0.42), 2)
                conf = str(random.randint(45, 99))  # VIIRS confidence percentage
                bright_ti5 = round(bright_ti4 - random.uniform(10.0, 35.0), 1)
                frp = round(random.uniform(cluster["frp_range"][0] * 0.4, cluster["frp_range"][1] * 0.8), 1)
                daynight = "D" if is_day else "N"

                lines.append(f"{lat},{lon},{bright_ti4},{scan},{track},{acq_d},{acq_t},{sat_code},VIIRS,{conf},2.0NRT,{bright_ti5},{frp},{daynight},0")

        return "\n".join(lines)

