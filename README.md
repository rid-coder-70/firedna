# FireDNA

**Understand Fire. Connect Data. Protect Our Planet.**

FireDNA is an educational, full-stack prototype for exploring NASA FIRMS active-fire observations from the MODIS and VIIRS satellite instruments. Its primary demonstration region is Bangladesh and South Asia.

## The problem

MODIS and VIIRS can observe the same region and fire activity but report different numbers of hotspot detections. Their pixels have different sizes, their detection algorithms and sensitivity differ, and their satellites pass over at different times. A hotspot is a satellite-observed thermal anomaly, not a confirmed fire event. Comparing raw sensor counts as if they were equivalent measurements can therefore be misleading.

NASA FIRMS provides the observations, but researchers and learners also need a clear way to compare sensors, understand the limits of those comparisons, and explore activity over time and space.

## What FireDNA does

FireDNA keeps the original sensor observations and their provenance, then puts observations into shared spatial grid cells and daily time windows. It presents sensor-specific counts side by side with an experimental **Harmonized Activity Index (HAI)**, plus maps, time-series, seasonal views, anomaly summaries, and CSV/GeoJSON exports.

The application supports both live FIRMS ingestion (when a server-side `FIRMS_MAP_KEY` is configured) and explicitly labeled synthetic demo data. Demo mode makes the project usable without an API key; demo observations are not NASA observations.

### Main experiences

| Route | What you can explore |
|---|---|
| `/` | Regional overview, hotspot statistics, and entry points |
| `/map` | Interactive MODIS/VIIRS fire map and harmonized cells |
| `/compare` | Side-by-side sensor and harmonization comparison |
| `/calendar` | Daily fire activity heatmap |
| `/analytics` | Daily, monthly, and seasonal analytics |
| `/anomalies` | Unusual-activity summaries and historical context |
| `/sources` | NASA FIRMS products, attribution, and data provenance |
| `/about` | Project context and educational material |

## Scientific limitations

- HAI is a FireDNA **experimental prototype**, not an official NASA product, validated scientific index, or calibrated measurement.
- The default 0.1-degree latitude/longitude grid is a convenient comparison framework, not an equal-area grid.
- Satellite hotspot counts are observations, not counts of unique fires. Clouds, overpass timing, pixel size, and detection algorithms affect what each instrument sees.
- An anomaly is a statistical signal, not confirmation of a dangerous wildfire. Do not use the prototype for operational fire-management decisions.
- Demo data is synthetic and must not be presented as real NASA data.

See [HARMONIZATION_METHODOLOGY.md](docs/HARMONIZATION_METHODOLOGY.md) for formulas, assumptions, and limitations.

## How it works

```text
NASA FIRMS (or synthetic demo source)
    → parse, validate, and deduplicate observations
    → store sensor records with ingestion provenance
    → aggregate into grid cells and daily windows
    → calculate prototype HAI and activity summaries
    → expose data through the FastAPI API
    → explore it in the Next.js dashboard or export it
```

The backend is FastAPI with SQLAlchemy; SQLite is the local-development default, and Docker Compose provides PostgreSQL/PostGIS. The frontend is Next.js 14, React, TypeScript, Leaflet, and Recharts.

## Run locally (Windows PowerShell)

Use two terminals from the repository root.

### 1. Start the backend

```powershell
Set-Location .\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend\.env` as needed. Leave `FIRMS_MAP_KEY` empty to use synthetic demo data. Seed the local database with demo observations, harmonized results, and anomaly records:

```powershell
python -m app.utils.seed_demo_data
```

Start the API:

```powershell
python -m uvicorn app.main:app --reload
```

The API is at <http://localhost:8000>, and interactive API documentation is at <http://localhost:8000/docs>.

### 2. Start the frontend

```powershell
Set-Location .\frontend
npm ci
npm run dev
```

Open <http://localhost:3000>. By default, the frontend requests `http://localhost:8000/api/v1`. Set `NEXT_PUBLIC_API_URL` before building if the API is hosted at another URL.

## Tests and production build

```powershell
Set-Location .\backend
python tests\run_tests.py
```

```powershell
Set-Location .\frontend
npm run lint
npm run build
```

## Docker Compose

With Docker Desktop installed, set a PostgreSQL password and optionally a NASA FIRMS key before starting the stack from the repository root:

```powershell
$env:POSTGRES_PASSWORD = "choose-a-local-password"
$env:FIRMS_MAP_KEY = ""
docker compose up --build
```

Compose starts PostgreSQL/PostGIS, the API, and the frontend. Without `FIRMS_MAP_KEY`, the backend uses demo mode.

## Documentation

| Document | What it explains |
|---|---|
| [Product requirements](docs/PRD.md) | Problem statement, audiences, requirements, and project scope |
| [System architecture](docs/SYSTEM_ARCHITECTURE.md) | Application components, data flow, and deployment options |
| [Database design](docs/DATABASE_DESIGN.md) | Proposed relational/spatial schema, indexes, and provenance |
| [API design](docs/API_DESIGN.md) | API conventions, endpoint contracts, and examples |
| [Data pipeline](docs/DATA_PIPELINE.md) | FIRMS ingestion, validation, processing, and demo mode |
| [Harmonization methodology](docs/HARMONIZATION_METHODOLOGY.md) | Grid, normalization, HAI, anomaly method, and caveats |
| [UI/UX design](docs/UI_UX_DESIGN.md) | Audience, navigation, pages, and accessibility requirements |
| [Development roadmap](docs/DEVELOPMENT_ROADMAP.md) | Implemented prototype, verification, and next steps |

FireDNA is an independent educational prototype created for the NASA Space Apps Challenge. It is not an official NASA product.
