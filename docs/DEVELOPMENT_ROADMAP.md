# FireDNA — Development Roadmap & Implementation Plan
## NASA Space Apps Challenge 2026

**Version:** 1.0.0  
**Date:** November 10, 2026  
**Status:** Phase 1 Complete — Ready for Phase 2 Approval

---

## 1. Project Phase Structure

To ensure architectural rigor, scientific integrity, and hackathon delivery readiness, FireDNA is structured into five distinct phases:

```mermaid
gantt
    title FireDNA Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1: System Design
    Architecture, PRD, DB & API Design     :done, des1, 2026-11-10, 1d
    Harmonization & UI/UX Specs             :done, des2, 2026-11-10, 1d
    section Phase 2: Backend Development
    FastAPI Core & DB Models                :active, be1, 2026-11-11, 1d
    FIRMS Ingestion & Cleaning              :be2, after be1, 1d
    Harmonization & Analytics Engines       :be3, after be2, 1d
    API Endpoints & Unit Tests              :be4, after be3, 1d
    section Phase 3: Frontend Development
    Next.js Setup & Layout System           :fe1, after be4, 1d
    Interactive Fire Map (Leaflet)          :fe2, after fe1, 1d
    Sensor Comparison Lab                   :fe3, after fe2, 1d
    Analytics, Calendar & Educational Hub   :fe4, after fe3, 1d
    section Phase 4: Integration & QA
    Full Stack Wiring & Live Data Flow      :qa1, after fe4, 1d
    Edge Case Testing & Demo Mode           :qa2, after qa1, 1d
    section Phase 5: Presentation Readiness
    Demo Walkthrough & Final Documentation  :pr1, after qa2, 1d
```

---

## 2. Phase 1: System Design (Completed)

| Deliverable | File Path | Status | Verification |
|---|---|---|---|
| Product Requirements Document | `docs/PRD.md` | ✅ Completed | 35 functional & 10 non-functional requirements |
| System Architecture Design | `docs/SYSTEM_ARCHITECTURE.md` | ✅ Completed | 7 Mermaid architecture & flow diagrams |
| Database & PostGIS Design | `docs/DATABASE_DESIGN.md` | ✅ Completed | Full SQL DDL migration, indexing & schemas |
| REST API Design & Contracts | `docs/API_DESIGN.md` | ✅ Completed | 6 endpoint groups, cURL samples, error models |
| Data Pipeline Architecture | `docs/DATA_PIPELINE.md` | ✅ Completed | 13-stage ingestion & harmonization pipeline |
| Scientific Harmonization Method | `docs/HARMONIZATION_METHODOLOGY.md` | ✅ Completed | Mathematical formulation of HAI & Z-score anomalies |
| UI/UX & Educational Design | `docs/UI_UX_DESIGN.md` | ✅ Completed | 8-page architecture, palette, accessibility specs |
| Development Roadmap | `docs/DEVELOPMENT_ROADMAP.md` | ✅ Completed | Milestone tracking & validation criteria |

---

## 3. Phase 2: Backend Development Plan

### 3.1 Objectives
Build a high-performance, modular Python/FastAPI service capable of ingesting FIRMS satellite data, cleaning observations, storing them in PostgreSQL/PostGIS, running spatial/temporal harmonization, and serving them via documented REST endpoints.

### 3.2 Directory Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI initialization, CORS, routers
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # Pydantic Settings, environment variables
│   │   └── database.py          # SQLAlchemy async/sync engine, sessionmaker
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py            # Observation, IngestionLog, Harmonized, Baseline, Anomaly models
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── schemas.py           # Pydantic request/response validation models
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── firms_client.py      # NASA FIRMS API HTTP client with retries
│   │   ├── demo_generator.py    # Synthetic Bangladesh dataset generator
│   │   ├── data_cleaner.py      # CSV parser, field mapper, data type standardization
│   │   ├── data_validator.py    # Coordinate, FRP, date, and confidence bounds checking
│   │   └── deduplicator.py      # Composite key deduplication
│   ├── harmonization/
│   │   ├── __init__.py
│   │   ├── spatial.py           # 0.1° grid generation and point-in-polygon mapping
│   │   ├── temporal.py          # 24h UTC window grouping
│   │   ├── normalization.py     # Independent log-minmax FRP & P95 count normalization
│   │   ├── activity_index.py    # Harmonized Activity Index (HAI) computation
│   │   └── validation.py        # Sensor agreement and correlation statistics
│   ├── analytics/
│   │   ├── __init__.py
│   │   ├── historical.py        # Daily, monthly, yearly aggregations
│   │   └── anomaly_detection.py # Monthly baseline means, std dev, Z-scores, percentiles
│   └── api/
│       └── v1/
│           ├── __init__.py
│           ├── ingestion.py     # Ingestion triggers & audit logs
│           ├── hotspots.py      # Hotspot lists, summary & GeoJSON
│           ├── harmonization.py # Harmonization triggers, comparisons & validation
│           ├── analytics.py     # Daily, monthly, yearly, seasonal time series
│           ├── anomalies.py     # Anomaly queries & detection triggers
│           └── exports.py       # CSV and GeoJSON file exports
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Test database fixtures and mock FIRMS client
│   ├── test_ingestion.py        # Test parser, validator, and deduplicator
│   ├── test_harmonization.py    # Test spatial grid, normalization & HAI calculations
│   ├── test_anomalies.py        # Test Z-score and zero-variance handling
│   └── test_api.py              # Test FastAPI endpoint contracts
├── Dockerfile                   # Production Python 3.11 container
├── docker-compose.yml           # Backend + PostGIS + Frontend stack
├── requirements.txt             # Locked dependencies
└── .env.example                 # Environment configuration template
```

### 3.3 Milestones & Deliverables
1. **M2.1: Core Infrastructure & Database Models**
   - Config, database connectivity (PostgreSQL/PostGIS with SQLite in-memory fallback for local unit tests).
   - SQLAlchemy declarative models matching `DATABASE_DESIGN.md`.
2. **M2.2: NASA FIRMS Ingestion Engine**
   - HTTP client with retry logic for MODIS & VIIRS products.
   - Demo Data Generator providing synthetic Bangladesh fire events with realistic coordinates and FRP when no key is present.
   - Data cleaning, validation, and deduplication pipeline.
3. **M2.3: Harmonization & Analytics Engines**
   - Spatial gridding (0.1°) and temporal bucket assignment.
   - Normalization algorithms and composite HAI computation.
   - Statistical baselines and Z-score anomaly detection.
4. **M2.4: FastAPI REST API Endpoints**
   - Implement all 6 endpoint groups under `/api/v1`.
   - Streaming CSV and GeoJSON export responses.
   - Auto-generated Swagger documentation at `/docs`.
5. **M2.5: Backend Verification & Test Suite**
   - Comprehensive test suite covering ingestion, harmonization math, anomaly classification, and API status codes.

---

## 4. Phase 3: Frontend Development Plan

### 4.1 Objectives
Develop a modern, educational, responsive Next.js 14 web application matching the specifications in `UI_UX_DESIGN.md`.

### 4.2 Application Pages & Component Map
1. **`/` — Home Dashboard:** Real-time metrics, regional selectors, recent activity charts, quick entry cards.
2. **`/map` — Interactive Fire Map:** React Leaflet with MODIS/VIIRS layer toggling, clustering, polygon grid overlay, popup inspector.
3. **`/compare` — Sensor Comparison Lab:** 3-column synchronized comparison (MODIS vs VIIRS vs Harmonized Grid), cell inspector, agreement charts.
4. **`/calendar` — Fire Activity Calendar:** 365-day annual heatmap with historical overlay and seasonal fire indicators.
5. **`/analytics` — Activity Analytics:** Recharts time series, diurnal day/night distribution, FRP histograms.
6. **`/anomalies` — Anomaly Explorer:** Z-Score gauge, percentile breakdown, educational transparency warnings.
7. **`/sources` — Data Sources & Provenance:** NASA FIRMS attribution, data freshness monitor, live vs demo badge.
8. **`/about` — About FireDNA & Educational Hub:** Interactive FAQ, team details, satellite technology guide.

---

## 5. Phase 4: Integration & Quality Assurance

- Connect all 8 frontend pages to backend `/api/v1` REST endpoints.
- Validate error states (network failure, empty search results, invalid bounding boxes).
- Ensure demo mode is clearly labeled throughout the entire application.
- Cross-browser and mobile responsive testing.

---

## 6. Phase 5: Hackathon Presentation Readiness

### 6.1 Demonstration Workflow (Step-by-Step)
1. **Welcome to FireDNA:** Introduce the mission and regional focus on Bangladesh and South Asia.
2. **The Satellite Discrepancy:** Show raw MODIS detections vs VIIRS detections on the map to illustrate how different sensor resolutions (1km vs 375m) produce vastly different counts.
3. **The Sensor Comparison Lab:** Demonstrate the 0.1° harmonization grid and how FireDNA unifies observations into an interpretable Harmonized Activity Index (HAI).
4. **Long-Term Patterns:** Examine seasonal agricultural burning via the Fire Activity Calendar and time series charts.
5. **Anomaly Detection:** Highlight statistically significant fire spikes and explain the Z-score calculation without sensationalizing.
6. **Scientific Transparency:** Inspect the Data Sources page, showing NASA FIRMS provenance, processing parameters, and explicit prototype disclaimers.

---

## 7. Phase 1 Completion Sign-Off

All eight design documents have been authored and verified:
1. `PRD.md`
2. `SYSTEM_ARCHITECTURE.md`
3. `DATABASE_DESIGN.md`
4. `API_DESIGN.md`
5. `DATA_PIPELINE.md`
6. `HARMONIZATION_METHODOLOGY.md`
7. `UI_UX_DESIGN.md`
8. `DEVELOPMENT_ROADMAP.md`

**Status:** Ready to proceed to **Phase 2 (Backend Development)** upon user confirmation.

