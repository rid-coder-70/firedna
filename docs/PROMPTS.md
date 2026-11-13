# FireDNA — Prompt Engineering & Tooling Log

This document records **which prompt** and **which specific tools, AI agents, NASA data platforms, and software libraries** were used for every part of **FireDNA** (*NASA Space Apps Challenge 2026: MODIS and VIIRS Hot Spots*).

---

## Prompt & Tooling Matrix by System Part

| Part | System Module | AI & Engineering Tools Used | NASA APIs, Data & Libraries Used |
|---|---|---|---|
| **Part 1** | Architecture & Scientific PRD | Google Antigravity IDE + `doc-writer` parallel subagents (PRD, API, DB, System Architecture) | FastAPI, Pydantic v2, SQLAlchemy 2.0, PostgreSQL/PostGIS & SQLite schema specs |
| **Part 2** | Official NASA Data & Zero-Synthetic Ingestion | Python 3.11+, `sqlite3` CLI inspection, `unittest`, FastAPI lifespan seeding | NASA FIRMS South Asia 7d CSVs (`MODIS_C6_1`, `J1_VIIRS_C2`, `J2_VIIRS_C2`), NASA FIRMS Area API, NASA EONET v3 REST API (`HTTPX`), Python `csv.DictReader` |
| **Part 3** | `0.1°` Spatial Harmonization & HAI Engine | Python batch processor, `tests/run_tests.py`, Recharts | Equal-interval `0.1°` grid mapper, P95 normalization, Log-FRP (`math.log1p`), SQLAlchemy bulk batching |
| **Part 4** | Historical Baseline & Z-Score Anomalies | Python `NumPy`, `sqlite3` parameter optimization, FastAPI `/anomalies` router | Monthly regional baseline engine ($\mu \pm \sigma$), `math.erf` percentile calculation |
| **Part 5** | 60/30/10 Editorial UI & `Space Grotesk` Font | Next.js 14 App Router, Tailwind CSS v3, Google Fonts | `next/font/google` (`Space_Grotesk`, `JetBrains_Mono`), Lucide React Icons |
| **Part 6** | South Asia Fire Map & 4-Layer Distinct Palette | Leaflet GIS, Python `zlib`/`struct` PNG pixel hex extractor | OpenStreetMap Standard Raster Tiles, Leaflet `circleMarker` & `rectangle`, GeoJSON API |
| **Part 7** | Mobile Burger Menu & Smooth Animations | React 18 Client/Server component composition, `tsc --noEmit` | `framer-motion` (`motion`, `AnimatePresence`, `layoutId`, `whileInView`) |
| **Part 8** | Production Build & 100% Free Cloud Deployment | `next build`, `uvicorn`, `curl.exe` endpoint verifier | Vercel (`frontend/vercel.json`), Render Free Blueprint (`render.yaml`), FastAPI CORS middleware |

---

## Part 1 — Project Initialization, PRD & 4-Tier Scientific Architecture

**Target Files:** [`docs/PRD.md`](PRD.md), [`docs/SYSTEM_ARCHITECTURE.md`](SYSTEM_ARCHITECTURE.md), [`docs/DATABASE_DESIGN.md`](DATABASE_DESIGN.md), [`docs/API_DESIGN.md`](API_DESIGN.md)

### Tools, APIs & Frameworks Used for This Part
- **AI Agent Workflow:** Google Antigravity IDE + 4 specialized `doc-writer` subagents running in parallel for PRD, API Design, Database Design, and System Architecture.
- **Specification & Schema Stack:** FastAPI OpenAPI `/api/v1` specification, SQLAlchemy 2.0 ORM definitions, SQLite + PostGIS spatial indexing design.

### Prompt Used:
> Build the full-stack architecture and technical documentation for **FireDNA**, a NASA Space Apps Challenge 2026 web application addressing the *MODIS and VIIRS Hot Spots* challenge. Explain clearly why MODIS (~1 km) and VIIRS (375 m) raw hotspot counts differ by 4× to 6× over the same fire event, preserve full sensor provenance without overwriting raw rows, design normalized database tables (`satellite_observations`, `harmonized_observations`, `historical_baselines`, `activity_anomalies`, `nasa_events`, `data_ingestion_logs`, `processing_runs`), and document `/api/v1` FastAPI endpoints.

---

## Part 2 — Official NASA Open Data & Zero-Synthetic Ingestion Pipeline

**Target Files:** [`backend/app/core/config.py`](../backend/app/core/config.py), [`backend/app/ingestion/firms_client.py`](../backend/app/ingestion/firms_client.py), [`backend/app/ingestion/eonet_client.py`](../backend/app/ingestion/eonet_client.py), [`backend/app/ingestion/data_cleaner.py`](../backend/app/ingestion/data_cleaner.py), [`backend/app/services/ingestion_service.py`](../backend/app/services/ingestion_service.py)

### Tools, APIs & Frameworks Used for This Part
- **Official NASA Data Sources & APIs:**
  - **NASA FIRMS South Asia 7-Day Datasets (`docs/datas/*.csv`):** `MODIS_C6_1_South_Asia_7d.csv` (`6,156` rows), `J1_VIIRS_C2_South_Asia_7d.csv` (`19,926` rows), `J2_VIIRS_C2_South_Asia_7d.csv` (`18,878` rows).
  - **NASA FIRMS Public Feeds & Area API:** `firms.modaps.eosdis.nasa.gov` (key-free 7d public CSVs + NRT/SP Area API with 5-day auto-chunking).
  - **NASA EONET v3 API:** `https://eonet.gsfc.nasa.gov/api/v3` (key-free wildfire event tracker, `447` South Asia wildfire events synced).
  - **NASA Open Data Directories:** `data.nasa.gov`, `api.nasa.gov`, `jpl.nasa.gov`.
- **Backend Libraries & Verification Tools:** Python 3.11 stdlib `csv.DictReader` (high-speed streaming parser replacing slow row-by-row DataFrame iteration), `HTTPX` async REST client, SQLAlchemy 2.0 batched inserts, `sqlite3` CLI row verification (`54,070` total observations, `0` `is_demo_data=True` rows), `python -m unittest tests.test_ingestion`.

### Prompt Used:
> Connect FireDNA strictly to official NASA open data platforms (`firms.modaps.eosdis.nasa.gov`, `eonet.gsfc.nasa.gov/api/v3`, `data.nasa.gov`, `api.nasa.gov`, `jpl.nasa.gov`) with zero synthetic data in production. Verify and ingest the 3 official NASA FIRMS South Asia 7-day CSV datasets (`MODIS_C6_1_South_Asia_7d.csv`, `J1_VIIRS_C2_South_Asia_7d.csv`, `J2_VIIRS_C2_South_Asia_7d.csv`), support live Area API multi-chunking when `FIRMS_MAP_KEY` is configured as well as key-free NASA FIRMS public feeds and NASA EONET v3 events, purge all `is_demo_data=True` rows, and remove any synthetic UI generators (including the 365-day calendar generator and static mock arrays).

---

## Part 3 — `0.1°` Spatial Harmonization & Harmonized Activity Index (HAI)

**Target Files:** [`backend/app/harmonization/spatial.py`](../backend/app/harmonization/spatial.py), [`backend/app/harmonization/activity_index.py`](../backend/app/harmonization/activity_index.py), [`backend/app/services/harmonization_service.py`](../backend/app/services/harmonization_service.py), [`frontend/src/app/compare/page.tsx`](../frontend/src/app/compare/page.tsx)

### Tools, APIs & Frameworks Used for This Part
- **Geospatial & Math Tools:** Custom `0.1°` equal-interval latitude/longitude gridding engine (`SpatialGridManager`), P95 detection density normalization, logarithmic FRP scaling (`ActivityIndexEngine`).
- **Database & Visualization Tools:** SQLAlchemy 2.0 5,000-row chunked commits (`19,903` harmonized cell-days), `Recharts` responsive time-series bar/line charts in `/compare` (`G_23.70N_86.40E_0.1D`), `tests/run_tests.py` (`24/24` passing tests).

### Prompt Used:
> Project every raw MODIS and VIIRS detection onto standardized `0.1°` (~11 km) equal-interval latitude/longitude cells grouped by 24-hour UTC windows. Compute the experimental Harmonized Activity Index (`HAI = 0.40 * S_count + 0.45 * S_FRP + 0.15 * S_confidence`), batch database commits for 45,000+ observations in SQLite-safe chunks, and automatically select an active dual-sensor South Asia cell (`G_23.70N_86.40E_0.1D`) for side-by-side MODIS vs. VIIRS vs. HAI comparison in the Sensor Lab.

---

## Part 4 — Statistical Baseline & Z-Score Anomaly Detection

**Target Files:** [`backend/app/analytics/anomaly_detection.py`](../backend/app/analytics/anomaly_detection.py), [`backend/app/api/v1/anomalies.py`](../backend/app/api/v1/anomalies.py), [`frontend/src/app/anomalies/page.tsx`](../frontend/src/app/anomalies/page.tsx)

### Tools, APIs & Frameworks Used for This Part
- **Numerical & Statistical Libraries:** Python `NumPy` (`np.mean`, `np.std`, `np.median`), Python `math.erf` normal cumulative percentile estimator.
- **Database Query Optimization:** SQLAlchemy full-month regional baseline queries eliminating SQLite's 999 bound-parameter limit (`19,903` anomaly evaluations computed across all South Asia dates).

### Prompt Used:
> Compute regional monthly fire baselines ($\mu$ and $\sigma$) directly from harmonized South Asia observations without hitting SQLite's bound-parameter limit, evaluate Z-scores across all ingested dates (`normal`, `elevated`, `high`, `extreme`, `insufficient_data`), and surface top statistical outliers with an explicit scientific integrity disclaimer explaining that elevated Z-scores do not automatically confirm dangerous ground wildfires.

---

## Part 5 — 60 / 30 / 10 Minimal Design System & `Space Grotesk` Typography

**Target Files:** [`frontend/src/app/layout.tsx`](../frontend/src/app/layout.tsx), [`frontend/src/app/globals.css`](../frontend/src/app/globals.css), [`frontend/tailwind.config.js`](../frontend/tailwind.config.js), [`frontend/src/app/about/page.tsx`](../frontend/src/app/about/page.tsx)

### Tools, APIs & Frameworks Used for This Part
- **Styling & Typography Tools:** Tailwind CSS v3 custom color tokens (`#F7F6EF`/`#FCFBF7` 60% Cream White, `#10243A` 30% Navy Blue, `#FF6B2B` 10% Fire Orange), Next.js `next/font/google` (`Space_Grotesk` + `JetBrains_Mono`), `clsx` + `tailwind-merge`, Lucide React Icons (`lucide-react`).

### Prompt Used:
> Redesign the FireDNA interface around a minimal editorial 60/30/10 palette — 60% warm Cream White (`#F7F6EF`, `#FCFBF7`), 30% Deep Space Navy (`#10243A`), and 10% Fire Orange accent (`#FF6B2B`) — without dark clutter or navbar color-rule labels. Configure `Space Grotesk` via `next/font/google` as the primary UI font alongside `JetBrains Mono` for coordinates and grid IDs, and ensure OpenStreetMap Leaflet tiles load cleanly with zero third-party API-key watermarks.

---

## Part 6 — South Asia Fire Map & 4-Layer Distinct Color Palette

**Target Files:** [`frontend/src/components/map/FireMap.tsx`](../frontend/src/components/map/FireMap.tsx), [`frontend/src/app/map/page.tsx`](../frontend/src/app/map/page.tsx), [`backend/app/api/v1/hotspots.py`](../backend/app/api/v1/hotspots.py)

### Tools, APIs & Frameworks Used for This Part
- **Mapping & Basemap Stack:** `Leaflet` (`L.map`, `L.tileLayer`, `L.circleMarker`, `L.rectangle`, `L.layerGroup`) + key-free `OpenStreetMap` tiles (`tile.openstreetmap.org`).
- **Color Sampling & API Tools:** Python `zlib` + `struct` PNG decoder to extract the exact MODIS Deep Plum hex (`#35063D`) from the user's swatch image; FastAPI balanced `/api/v1/hotspots/geojson` endpoint returning mixed MODIS + VIIRS detections sorted by recency & FRP (`max_features=2500`).

### Prompt Used:
> Center the Interactive Satellite Fire Map on the **South Asia** regional bounding box (`5°N–40°N, 54°E–102°E`, initial view `22.0°N, 78.0°E` at zoom `5`), balance `/hotspots/geojson` features so both MODIS and VIIRS observations render simultaneously across South Asia, and distinguish all 4 map layers using high-contrast colors:
> - **MODIS (~1 km):** Deep Plum `#35063D` (border `#1A021F`)
> - **VIIRS (375 m):** Blaze Orange `#FF6B2B` (border `#9A3412`)
> - **0.1° HAI Grid:** Sky / Royal Blue / Violet (`#38BDF8` / `#3B82F6` / `#8B5CF6`)
> - **NASA Events:** Emerald Green `#10B981` (border `#064E3B`)

---

## Part 7 — Mobile-First Responsive Burger Menu & Smooth Framer Motion Animations

**Target Files:** [`frontend/src/components/layout/Navbar.tsx`](../frontend/src/components/layout/Navbar.tsx), [`frontend/src/components/ui/MotionWrapper.tsx`](../frontend/src/components/ui/MotionWrapper.tsx), [`frontend/src/components/ui/StatCard.tsx`](../frontend/src/components/ui/StatCard.tsx), [`frontend/src/components/education/EducationCard.tsx`](../frontend/src/components/education/EducationCard.tsx)

### Tools, APIs & Frameworks Used for This Part
- **Animation & UI Tools:** `framer-motion` (`motion`, `AnimatePresence`, `layoutId`, `whileInView`, `whileHover`, `whileTap`), React 18 Server/Client component wrappers preserving Next.js App Router RSC performance, Lucide `Menu`/`X` icons, Tailwind responsive breakpoints (`sm`, `md`, `lg`, `xl`).
- **Type Safety Verification:** TypeScript compiler (`npx tsc --noEmit`) catching RSC serialization and optional nullability checks cleanly before build.

### Prompt Used:
> Make the entire frontend fully responsive for phones and laptops, replace the mobile/tablet navigation with an accessible touch-friendly burger icon (`Menu` / `Close` button below `1024px`) opening a smooth drawer, and add subtle, fluid Framer Motion animations (`AnimatePresence` accordion/drawer transitions, `layoutId` active navbar pill indicator, and `FadeIn` / `StaggerContainer` scroll reveals) that remain silky-smooth across devices.

---

## Part 8 — Production Build & 100% Free Cloud Deployment (Vercel + Render)

**Target Files:** [`render.yaml`](../render.yaml), [`frontend/vercel.json`](../frontend/vercel.json), [`backend/app/main.py`](../backend/app/main.py), [`README.md`](../README.md)

### Tools, APIs & Frameworks Used for This Part
- **Cloud Hosting Platforms:** **Vercel** (Hobby Free Plan for Next.js `frontend/`) + **Render.com** (Free Python Web Service Blueprint via `render.yaml` for `backend/`).
- **Build, Serving & Verification Tools:** `next build` (11/11 App Router routes compiled), `next start`, `uvicorn app.main:app`, FastAPI `CORSMiddleware` (`allow_origin_regex=r"https://.*\.vercel\.app"`), Windows `curl.exe` HTTP 200 verification across all routes (`/health`, `/`, `/map`, `/compare`, `/calendar`, `/analytics`, `/anomalies`, `/sources`, `/about`).

### Prompt Used:
> Verify all backend unit/integration tests and TypeScript checks (`tsc --noEmit`), generate a clean zero-error `next build`, add zero-cost cloud deployment manifests (`render.yaml` for the Python FastAPI backend on Render Free Tier + `frontend/vercel.json` for Next.js on Vercel Hobby Free Plan with automatic `.vercel.app` CORS support), and document both the free deployment workflow and every prompt & tool used per part inside `docs/PROMPTS.md` and `README.md`.
