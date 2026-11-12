# FireDNA — Multi-Satellite Active Fire Harmonization & Analytics

**Understand Fire. Connect Data. Protect Our Planet.**

FireDNA is a full-stack scientific web application built for the **NASA Space Apps Challenge 2026** (*MODIS and VIIRS Hot Spots*). It ingests active-fire observations from NASA FIRMS across the **MODIS** and **VIIRS** satellite instruments, preserves full sensor provenance, harmonizes detections onto a standardized **0.1° (~11 km)** spatial grid and **24-hour UTC** temporal window, and presents comparative analytics, interactive maps, and statistical anomaly detection.

- **Primary Demonstration Region:** Bangladesh and South Asia (with architecture supporting any global bounding box).
- **Primary Data Source:** [NASA FIRMS (Fire Information for Resource Management System)](https://firms.modaps.eosdis.nasa.gov/)

---

## 1. The Scientific Problem

NASA's **MODIS** (aboard Terra and Aqua, ~1 km spatial resolution) and **VIIRS** (aboard Suomi-NPP, NOAA-20, and NOAA-21, 375 m spatial resolution) observe the same regional fire events with vastly different optical footprints:

- A 375 m VIIRS pixel covers roughly **7× less ground area** than a 1 km MODIS pixel, allowing VIIRS to detect smaller and cooler fires (~5 MW threshold vs. ~50 MW for MODIS).
- Consequently, VIIRS routinely reports **4× to 6× more hotspots** than MODIS over the exact same burning area.
- Treating raw hotspot counts as directly interchangeable leads students, journalists, and policy makers to mistakenly conclude that fire activity has spiked when comparing VIIRS data to historical MODIS baselines.

## 2. The FireDNA Solution

FireDNA never deletes or merges raw satellite records. Instead, it:

1. **Preserves Sensor Provenance:** Stores raw MODIS and VIIRS records separately with full acquisition timestamps, Fire Radiative Power (FRP), brightness temperature, and confidence categories.
2. **Spatial & Temporal Harmonization:** Projects detections onto a common **0.1° (~11 km) latitude/longitude grid** aggregated by **24-hour UTC windows**.
3. **Harmonized Activity Index (HAI):** Computes an interpretable prototype composite score:
   $$\text{HAI} = 0.40 \cdot S_{\text{count}} + 0.45 \cdot S_{\text{FRP}} + 0.15 \cdot S_{\text{confidence}}$$
   where $S_{\text{count}}$ is 95th-percentile normalized detection density, $S_{\text{FRP}}$ is log-scaled maximum Fire Radiative Power ($\ln(1 + \text{FRP}_{\max})$) to avoid double-counting co-detected fires, and $S_{\text{confidence}}$ is mean normalized sensor confidence.
4. **Statistical Anomaly Detection:** Evaluates grid cells against historical monthly baselines ($\mu \pm \sigma$) using Z-scores and historical percentiles.

---

## 3. UI/UX & Responsive Design System (60 / 30 / 10 Rule)

FireDNA features a minimal editorial interface engineered for both **mobile viewports** and **laptop/desktop screens**:

| Weight | Palette Role | Hex Tokens | Application |
|---|---|---|---|
| **60% Dominant** | Warm Cream & Ivory | `#F7F6EF`, `#FCFBF7`, `#E2DEC9` | Primary page canvas, cards, map overlays, and distraction-free reading surfaces |
| **30% Structural** | Deep Space Navy | `#10243A`, `#1E3A5F`, `#4A607A` | Typography, navigation active states, architectural mission cards, and footer |
| **10% Accent** | Fire Orange & Crimson | `#FF6B2B`, `#FF9F43`, `#E85D5D` | Active fire hotspots, primary CTAs, live telemetry indicators, and peak anomalies |

### Application Routes

| Route | Module | Key Capabilities |
|---|---|---|
| `/` | **Overview Dashboard** | Regional KPIs, optical physics comparison panel, live NASA FIRMS sync button, and educational cards |
| `/map` | **Interactive Fire Map** | Key-free OpenStreetMap GIS viewport, collapsible layer controls (`MODIS ~1 km`, `VIIRS 375 m`, `0.1° HAI Grid`), and one-click CSV/GeoJSON export |
| `/compare` | **Sensor Comparison Lab** | Synchronized 3-column inspection of MODIS vs. VIIRS vs. FireDNA Harmonized Grid with Recharts timeline |
| `/calendar` | **Fire Activity Calendar** | 365-day seasonal burning heatmap highlighting South Asian Pre-Monsoon (`MAM`) and Post-Harvest (`SON`) peaks |
| `/analytics` | **Activity Analytics** | Daily detection trends, monthly climatological distributions, and seasonal breakdowns |
| `/anomalies` | **Anomaly Explorer** | Z-score statistical outlier rankings with scientific integrity disclaimers |
| `/sources` | **Data Sources** | Official NASA EOSDIS product specifications (`MODIS_NRT`, `VIIRS_SNPP_NRT`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA21_NRT`) and provenance |
| `/about` | **About FireDNA** | Mission architecture, 4-stage processing pipeline, and interactive student/researcher FAQ |

---

## 4. Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Leaflet (with OpenStreetMap tiles), Recharts, Lucide Icons.
- **Backend:** Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, HTTPX.
- **Database:** SQLite (zero-config local development default with automatic startup seeding) and PostgreSQL + PostGIS (via Docker Compose).
- **Deployment:** Vercel-ready frontend build (`frontend/`) and Dockerized FastAPI backend (`backend/`).

---

## 5. Quick Start (Local Development)

### Step 1 — Run the FastAPI Backend

Open a terminal in the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Configure environment variables (optional—if `.env` is already present or `FIRMS_MAP_KEY` is omitted, FireDNA automatically falls back to calibrated demonstration data and auto-seeds on startup):

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **API Base URL:** `http://127.0.0.1:8000/api/v1`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/health`

### Step 2 — Run the Next.js Frontend

Open a second terminal in the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

> **Note:** Even if the backend server is not running, the frontend includes a resilient fallback layer (`src/lib/api.ts`) so every page, chart, and map loads immediately without crashing.

---

## 6. Deploying to Vercel

The frontend is pre-configured and verified for zero-error deployment on **Vercel**:

1. Push this repository to GitHub / GitLab / Bitbucket.
2. Import the project into [Vercel](https://vercel.com/new).
3. Set the **Root Directory** to `frontend`.
4. (Optional) Add the environment variable `NEXT_PUBLIC_API_URL` pointing to your hosted FastAPI backend URL (e.g., `https://your-firedna-api.onrender.com/api/v1`).
5. Click **Deploy**.

To verify the production build locally before deploying:

```powershell
cd frontend
npm run build
npm start
```

---

## 7. Running Backend Tests

```powershell
cd backend
python tests/run_tests.py
```

All 24 unit and integration checks (covering CSV cleaning, coordinate validation, deduplication, 0.1° spatial gridding, HAI calculation, Z-score anomaly detection, and FastAPI routes) run in-memory and pass at 100%.

---

## 8. System Design & Scientific Documentation

Detailed architectural and scientific specifications are located in the [`/docs`](docs/) directory:

| Document | Description |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Product Requirements Document, target users, and functional scope |
| [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | End-to-end architecture, data flow, caching, and deployment diagrams |
| [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | Normalized relational & PostGIS schema, indexes, and SQL DDL migrations |
| [docs/API_DESIGN.md](docs/API_DESIGN.md) | REST API `/api/v1` specifications, query parameters, and response schemas |
| [docs/DATA_PIPELINE.md](docs/DATA_PIPELINE.md) | NASA FIRMS ingestion, cleaning, validation, and deduplication pipeline |
| [docs/HARMONIZATION_METHODOLOGY.md](docs/HARMONIZATION_METHODOLOGY.md) | Mathematical formulation of 0.1° gridding, HAI weights, and Z-score anomalies |
| [docs/UI_UX_DESIGN.md](docs/UI_UX_DESIGN.md) | 60/30/10 minimal design system, responsive layout, and page specifications |
| [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) | Phase-by-phase implementation milestones and verification checklist |

---

## 9. Scientific Disclaimer & Attribution

- **NASA FIRMS Attribution:** We acknowledge the use of data and/or imagery from NASA's Fire Information for Resource Management System (FIRMS) (`https://firms.modaps.eosdis.nasa.gov/`), part of NASA's Earth Observing System Data and Information System (EOSDIS).
- **Experimental Prototype Notice:** The Harmonized Activity Index (HAI) and statistical anomaly Z-scores are experimental prototype metrics developed by the FireDNA team for the NASA Space Apps Challenge 2026. They are not official NASA-validated products and should not be used for emergency wildfire life-safety decisions without ground-truth verification.
