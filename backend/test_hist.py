import os, requests
from dotenv import load_dotenv
load_dotenv()

KEY = os.environ["FIRMS_MAP_KEY"]
BBOX = "88.0,20.5,92.7,26.7"
for src in ["MODIS_SP", "VIIRS_NOAA20_SP", "VIIRS_SNPP_SP"]:
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{KEY}/{src}/{BBOX}/5/2024-11-09"
    r = requests.get(url, timeout=60)
    print(src, r.status_code, len(r.text.splitlines()) - 1, "rows")