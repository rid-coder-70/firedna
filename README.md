# FireDNA — Multi-Satellite Active Fire Harmonization & Analytics

**Understand Fire. Connect Data. Protect Our Planet.**

FireDNA is a full-stack scientific web application built for the **NASA Space Apps Challenge 2026** (*MODIS and VIIRS Hot Spots*). It ingests **100% official NASA & NOAA satellite telemetry** across **South Asia** (`5°N–40°N, 54°E–102°E`), preserves full sensor provenance, harmonizes detections onto a standardized **0.1° (~11 km)** spatial grid and **24-hour UTC** temporal window, and presents comparative analytics, interactive geospatial layers, and statistical anomaly detection with **zero synthetic data**.

- **Primary Monitoring Region:** South Asia (`5°N–40°N, 54°E–102°E`, architecture supports any global bounding box).
- **Verified Live Database Snapshot:** `54,070` real satellite detections (`7,532` MODIS + `24,795` VIIRS NOAA-20 + `21,743` VIIRS NOAA-21), `19,903` harmonized `0.1°` cells, `19,903` Z-score anomaly evaluations, `447` NASA EONET v3 wildfire events, and **`0` synthetic/demo records**.
- **NASA Open Data Integrations:** NASA Earthdata FIRMS (Public 7-Day CSVs + NRT/SP Area API), NASA EONET v3 (`eonet.gsfc.nasa.gov`), NASA Open Data Portal (`data.nasa.gov`), NASA API Portal (`api.nasa.gov`), and NASA JPL (`jpl.nasa.gov`).

---

## 1. The Scientific Problem

NASA's **MODIS** (aboard Terra and Aqua, ~1 km spatial resolution) and **VIIRS** (aboard Suomi-NPP, NOAA-20, and NOAA-21, 375 m spatial resolution) observe the same regional fire events with vastly different optical footprints:

- A 375 m VIIRS pixel covers roughly **7× less ground area** than a 1 km MODIS pixel, allowing VIIRS to detect smaller and cooler fires (~5 MW threshold vs. ~50 MW for MODIS).
- Consequently, VIIRS routinely reports **4× to 6× more hotspots** than MODIS over the exact same burning area.
- Treating raw hotspot counts as directly interchangeable leads students, journalists, and policy makers to mistakenly conclude that fire activity has spiked when comparing VIIRS data to historical MODIS baselines.
- Satellite observations are also affected by **cloud obscuration** (monsoon clouds block infrared radiance) and **polar-orbit overpass timing** (ephemeral fires between passes go unrecorded).

---

## 2. The FireDNA Solution

FireDNA never deletes or merges raw satellite records. Instead, it implements a 4-tier scientific architecture:

1. **Sensor Provenance Preservation:** Stores raw MODIS and VIIRS records separately with acquisition timestamps, Fire Radiative Power (FRP), brightness temperature, confidence levels, and satellite platforms (`Terra`, `Aqua`, `Suomi-NPP`, `NOAA-20`, `NOAA-21`).
2. **Official NASA FIRMS Ingestion (Key-Free Public Feeds + Area API):**
   - Uses official NASA FIRMS South Asia public 7-day CSV endpoints and verified local NASA FIRMS South Asia CSV archives (`docs/datas/*.csv`), or routes to FIRMS Area API (`_NRT` + `_SP`) automatically when `FIRMS_MAP_KEY` is provided.
3. **NASA EONET v3 Macro-Event Cross-Validation:** Connects directly to NASA's public Earth Observatory Natural Event Tracker (`https://eonet.gsfc.nasa.gov/api/v3`) with **zero API key required**, tracking `447` South Asia wildfire events.
4. **Spatial & Temporal Harmonization:** Projects detections onto a common **0.1° (~11 km) latitude/longitude grid** aggregated by **24-hour UTC windows**.
5. **Harmonized Activity Index (HAI):** Computes an interpretable prototype composite score:
   $$\text{HAI} = 0.40 \cdot S_{\text{count}} + 0.45 \cdot S_{\text{FRP}} + 0.15 \cdot S_{\text{confidence}}$$
   where $S_{\text{count}}$ is 95th-percentile normalized detection density, $S_{\text{FRP}}$ is log-scaled maximum Fire Radiative Power ($\ln(1 + \text{FRP}_{\max})$) to avoid double-counting co-detected fires, and $S_{\text{confidence}}$ is mean normalized sensor confidence.
6. **Statistical Anomaly Detection:** Evaluates grid cells against real historical monthly baselines ($\mu \pm \sigma$) using Z-scores and historical percentiles.

---

## 3. UI/UX, Typography, Animations & Map Color System

FireDNA pairs an editorial **60 / 30 / 10 Minimal Design System** with **Space Grotesk** typography, responsive **phone burger navigation**, and smooth **Framer Motion** transitions:

| Layer / Token | Color / Style | Usage |
|---|---|---|
| **Typography** | `Space Grotesk` + `JetBrains Mono` | Primary clean geometric sans-serif font via `next/font/google` & monospaced grid coordinates |
| **Animations** | `Framer Motion` | Animated desktop nav active pill (`layoutId`), mobile burger drawer (`AnimatePresence`), smooth card reveals & hover elevation |
| **60% Dominant** | Warm Cream (`#F7F6EF`, `#FCFBF7`, `#E2DEC9`) | Page canvas, cards, mobile burger drawer, and map legend cards |
| **30% Structural** | Deep Space Navy (`#10243A`, `#4A607A`) | Navigation states, architectural specification cards, typography, and footer |
| **10% Accent** | Fire Orange (`#FF6B2B`, `#FF9F43`) | Primary CTAs, active telemetry pills, and live status indicators |

### Interactive Fire Map Distinct Layer Colors (`/map`)

| Map Layer | Fill Color | Border Color | Purpose |
|---|---|---|---|
| **MODIS (~1 km)** | `#35063D` (Deep Plum) | `#1A021F` | Coarse-resolution heritage hotspots (Terra & Aqua) |
| **VIIRS (375 m)** | `#FF6B2B` (Blaze Orange) | `#9A3412` | High-resolution active thermal hotspots (NOAA-20, NOAA-21, SNPP) |
| **0.1° HAI Grid** | `#38BDF8` / `#3B82F6` / `#8B5CF6` | `#0284C7` / `#2563EB` / `#7C3AED` | Low, Moderate, and High 0.1° Harmonized Activity Index cells |
| **NASA Events** | `#10B981` (Emerald Green) | `#064E3B` | Official NASA EONET v3 macro wildfire incidents |

### Application Routes

| Route | Module | Key Capabilities |
|---|---|---|
| `/` | **Overview Dashboard** | Regional South Asia KPIs, optical physics panel, live NASA FIRMS sync, and educational cards |
| `/map` | **Interactive Fire Map** | OpenStreetMap GIS centered on South Asia (`22.0°N, 78.0°E`), 4 distinct collapsible layer toggles, GeoJSON & CSV exports |
| `/compare` | **Sensor Comparison Lab** | Side-by-side inspection of MODIS vs. VIIRS vs. `0.1°` HAI Grid (`G_23.70N_86.40E_0.1D`) with interactive Recharts chart |
| `/calendar` | **Fire Activity Calendar** | Active daily observation cards & annual matrix driven strictly by real NASA detections |
| `/analytics` | **Activity Analytics** | Daily detection trends, monthly climatology, and South Asian seasonal breakdowns (`DJF`, `MAM`, `JJA`, `SON`) |
| `/anomalies` | **Anomaly Explorer** | Z-score statistical outlier rankings with scientific integrity disclaimers |
| `/sources` | **NASA Open Data** | Directory of 5 NASA open platforms, NRT/SP coverage table, and live EONET v3 wildfire feed |
| `/about` | **About FireDNA** | Mission architecture, 4-stage pipeline, and interactive FAQ |

---

## 4. Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, **Space Grotesk** (`next/font/google`), **Framer Motion**, Leaflet (OpenStreetMap), Recharts, Lucide Icons.
- **Backend:** Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, HTTPX, NumPy.
- **Database:** SQLite (`backend/firedna.db`, auto-initialized with official NASA South Asia telemetry) / PostgreSQL + PostGIS (via Docker Compose).

---

## 5. Quick Start (Local Development)

### Step 1 — Run the FastAPI Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- **Backend API:** `http://127.0.0.1:8000/api/v1`
- **Health Check:** `http://127.0.0.1:8000/health`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`

### Step 2 — Run the Next.js Frontend

Open a second terminal in the repository root:

```powershell
cd frontend
npm install
npm run build
npm run start
```

Open `http://localhost:3000` in your browser (or `npm run dev` for hot-reloading development mode).

---

## 6. How to Deploy Completely for Free (Vercel + Render)

You can host **both** the Next.js frontend and the Python FastAPI backend at **$0/month** without adding a credit card.

### Part A — Deploy the FastAPI Backend for Free on Render.com

The repository already includes a ready-to-use [`render.yaml`](render.yaml) blueprint at the root!

1. Push your FireDNA repository to **GitHub**.
2. Sign in to [Render.com](https://render.com/) (free tier) using your GitHub account.
3. Click **New +** -> **Blueprint** (or **Web Service**) and select your `fire-dna` repository.
4. Render automatically reads `render.yaml` (`rootDir: backend`, `plan: free`, `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, `CORS_ORIGINS=["*"]`, health check `/health`).
   - *(Optional)* Add `FIRMS_MAP_KEY` in **Environment Variables** (free key from [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/map_key/)) if you want live 1–10 day Area API polling on top of NASA's key-free public feeds.
5. Click **Deploy Web Service** and wait ~2 minutes. Copy your live backend URL, for example:
   `https://firedna-backend.onrender.com`

> **Note on Render Free Tier:** Free Render web services spin down after 15 minutes of inactivity and take ~30–50 seconds to wake up on the first request. Our CORS config in `backend/app/main.py` automatically permits all `*.vercel.app` origins.

### Part B — Deploy the Next.js Frontend for Free on Vercel

The repository includes [`frontend/vercel.json`](frontend/vercel.json) configured for Next.js.

1. Sign in to [Vercel.com](https://vercel.com/new) (Hobby Free Plan) with GitHub and import your `fire-dna` repository.
2. In **Configure Project**:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** click **Edit** and select **`frontend`**
3. Open **Environment Variables** and add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://firedna-backend.onrender.com/api/v1` *(use your Render URL + `/api/v1`)*
4. Click **Deploy**. Vercel builds all 11 routes and publishes your live global URL (e.g. `https://firedna.vercel.app`).

### Local Production Build Verification

```powershell
cd frontend
npx tsc --noEmit
npm run build
npm run start
```

---

## 7. Running Backend & Ingestion Tests

```powershell
cd backend
python tests/run_tests.py
python -m unittest tests.test_ingestion
```

Verified passing suites:
- `tests/run_tests.py`: **24/24 Passed (100.0%)** (Ingestion CSV parsing, Coordinate validation, 0.1° gridding, HAI bounds, Z-score thresholds, GeoJSON/CSV exports)
- `tests.test_ingestion`: **6/6 Passed** (Chunking planner, NRT/SP resolution, NASA EONET event mapping)

---

## 8. Prompt & Tooling Log (`docs/PROMPTS.md`)

To keep the project reproducible for judges, teammates, and open-source contributors, every prompt and the exact tools used for each part of FireDNA are cataloged in **[`docs/PROMPTS.md`](docs/PROMPTS.md)**:

| Part | Module | Tools, APIs & Frameworks Used | Prompt Focus |
|---|---|---|---|
| **Part 1** | PRD & System Architecture | Antigravity `doc-writer` Subagents, FastAPI OpenAPI, SQLAlchemy 2.0 | Sensor discrepancy science & 4-tier database/API specs |
| **Part 2** | Official NASA Data Ingestion | NASA FIRMS South Asia CSVs, FIRMS Area API, NASA EONET v3 (`HTTPX`), Python `csv.DictReader`, `sqlite3`, `unittest` | `54,070` real rows, `447` EONET events, `0` synthetic records |
| **Part 3** | `0.1°` Harmonization & HAI | `SpatialGridManager`, P95 & Log-FRP (`ActivityIndexEngine`), `Recharts`, `run_tests.py` | `19,903` unified grid cells & `G_23.70N_86.40E_0.1D` comparison |
| **Part 4** | Z-Score Anomaly Detection | Python `NumPy`, `math.erf`, SQLite-safe monthly queries | Historical monthly baselines ($\mu \pm \sigma$) & disclaimer integrity |
| **Part 5** | 60/30/10 UI & `Space Grotesk` | Next.js 14 App Router, Tailwind CSS v3, `next/font/google` (`Space_Grotesk`, `JetBrains_Mono`), Lucide Icons | Cream/Navy/Fire editorial palette & clean geometric typography |
| **Part 6** | South Asia Map & 4-Layer Palette | `Leaflet`, `OpenStreetMap` tiles, GeoJSON API, Python PNG hex extractor | `#35063D` MODIS, `#FF6B2B` VIIRS, `#38BDF8`–`#8B5CF6` HAI Grid, `#10B981` NASA Events |
| **Part 7** | Burger Menu & Framer Motion | `framer-motion` (`AnimatePresence`, `layoutId`, `whileInView`), React 18 RSC/Client wrappers, `tsc --noEmit` | Phone/tablet burger drawer (`< 1024px`) & smooth animations |
| **Part 8** | Free Production Deployment | `next build`, `next start`, `uvicorn`, Vercel (`vercel.json`), Render (`render.yaml`), `curl.exe` | Zero-cost Vercel + Render blueprint & verified `HTTP 200` routes |

---

## 9. Scientific Documentation Directory

| Document | Description |
|---|---|
| [docs/PROMPTS.md](docs/PROMPTS.md) | **Prompt Engineering Log — exact prompts used for every part of FireDNA** |
| [docs/PRD.md](docs/PRD.md) | Product Requirements Document, target users, and functional scope |
| [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | End-to-end architecture, NASA open data integration, and deployment |
| [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | Normalized relational & PostGIS schema, indexes, and EONET models |
| [docs/API_DESIGN.md](docs/API_DESIGN.md) | REST API `/api/v1` specifications, NASA platforms, and EONET endpoints |
| [docs/DATA_PIPELINE.md](docs/DATA_PIPELINE.md) | NASA FIRMS & EONET v3 ingestion, cleaning, and multi-chunking pipeline |
| [docs/HARMONIZATION_METHODOLOGY.md](docs/HARMONIZATION_METHODOLOGY.md) | Mathematical formulation of 0.1° gridding, HAI weights, and Z-scores |
| [docs/UI_UX_DESIGN.md](docs/UI_UX_DESIGN.md) | 60/30/10 minimal design system, responsive layouts, and page blueprints |
| [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) | Implementation milestones and verification checklist |

---

## 10. Scientific Disclaimer & Attribution

- **NASA FIRMS Attribution:** We acknowledge the use of data and imagery from the Fire Information for Resource Management System (FIRMS) (`https://firms.modaps.eosdis.nasa.gov/`), part of NASA's Earth Observing System Data and Information System (EOSDIS) operated by the Goddard Space Flight Center.
- **NASA EONET Attribution:** We acknowledge the use of natural disaster metadata from the Earth Observatory Natural Event Tracker (EONET v3) (`https://eonet.gsfc.nasa.gov/`), developed by NASA Goddard Space Flight Center.
- **Experimental Prototype Notice:** The Harmonized Activity Index (HAI) and statistical anomaly Z-scores are experimental prototype metrics developed by the FireDNA team for the NASA Space Apps Challenge 2026. They are designed for comparative analysis and education, and should not be used for life-critical emergency wildfire response without localized ground verification.
