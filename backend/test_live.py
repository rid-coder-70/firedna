import os, requests, pandas as pd
from io import StringIO
from dotenv import load_dotenv
load_dotenv()

KEY = os.environ["FIRMS_MAP_KEY"]
BBOX = "88.0,20.5,92.7,26.7"
url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{KEY}/VIIRS_NOAA20_NRT/{BBOX}/3"
r = requests.get(url, timeout=60)
print(r.status_code)
df = pd.read_csv(StringIO(r.text))
print(df.shape)
print(df.head())