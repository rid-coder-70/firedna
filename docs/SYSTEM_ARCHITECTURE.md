# FireDNA — System Architecture
## NASA Space Apps Challenge 2026

**Version:** 1.0.0  
**Date:** November 10, 2026

---

## 1. Architecture Overview

FireDNA is a **modular monolith**: one FastAPI backend contains separate API, service, ingestion, harmonization, and analytics modules. SQLite is the local-development default; Docker Compose uses PostgreSQL/PostGIS. The frontend is a Next.js application.

### Design Principles
1. **Separation of concerns** — ingestion, processing, harmonization, and API layers are independent Python modules.
2. **Scientific transparency** — raw satellite data is never discarded; all derived metrics store methodology version and parameters.
3. **Explicit demo mode** — synthetic data is visibly labeled when no FIRMS key is configured or a demo run is requested.
4. **Portable development** — the same SQLAlchemy models support local SQLite and the Compose PostgreSQL database.
5. **Progressive enhancement** — the frontend works with partial data; empty states are handled gracefully.

---

## 2. High-Level System Architecture

```mermaid
flowchart TD
    FIRMS["NASA FIRMS<br/>(MODIS and VIIRS NRT)"] -->|HTTP CSV| Ingestion["IngestionService<br/>FIRMSClient"]
    Demo["DemoDataGenerator<br/>(optional synthetic source)"] -->|CSV in demo mode| Ingestion
    Ingestion --> Clean["Parse, validate,<br/>normalize, deduplicate"]
    Clean --> RawDB[("SQLAlchemy database<br/>satellite_observations")]
    RawDB -->|explicit processing run| Harmonize["HarmonizationService<br/>grid assignment and daily grouping"]
    Harmonize --> HAI["ActivityIndexEngine<br/>experimental HAI"]
    HAI --> DerivedDB[("harmonized_observations")]
    DerivedDB --> Analytics["HistoricalAnalyticsEngine"]
    DerivedDB --> Anomalies["AnomalyDetector<br/>prototype baselines and scores"]
    Anomalies --> AnomalyDB[("historical_baselines<br/>activity_anomalies")]
    RawDB --> API["FastAPI REST API<br/>/api/v1"]
    DerivedDB --> API
    AnomalyDB --> API
    API -->|JSON and GeoJSON| Frontend["Next.js frontend"]
    Frontend --> Browser["User browser"]
    style FIRMS fill:#1a3a5c,color:#fff
    style RawDB fill:#2D8A64,color:#fff
    style DerivedDB fill:#2D8A64,color:#fff
    style AnomalyDB fill:#2D8A64,color:#fff
    style API fill:#FF9F43,color:#000
    style Frontend fill:#67B7E1,color:#000
```

---

## 3. Component Architecture

### 3.1 Backend Component Diagram

```mermaid
flowchart LR
    subgraph Backend["FastAPI backend"]
        subgraph Routes["API routes: /api/v1"]
            IngestionAPI["ingestion.py"]
            HotspotsAPI["hotspots.py"]
            HarmonizationAPI["harmonization.py"]
            AnalyticsAPI["analytics.py"]
            AnomaliesAPI["anomalies.py"]
            ExportsAPI["exports.py"]
        end
        subgraph Services["Orchestration services"]
            IngestionService["ingestion_service.py"]
            HarmonizationService["harmonization_service.py"]
        end
        subgraph Ingestion["Ingestion modules"]
            FIRMSClient["firms_client.py"]
            DemoGenerator["demo_generator.py"]
            Cleaner["data_cleaner.py"]
            Validator["data_validator.py"]
            Deduplicator["deduplicator.py"]
        end
        subgraph Harmonization["Harmonization modules"]
            Spatial["spatial.py"]
            Temporal["temporal.py"]
            Normalization["normalization.py"]
            ActivityIndex["activity_index.py"]
            Agreement["validation.py"]
        end
        subgraph Analytics["Analytics modules"]
            Historical["historical.py"]
            AnomalyDetection["anomaly_detection.py"]
        end
        subgraph Core["Core and persistence"]
            Config["core/config.py"]
            Database["core/database.py"]
            Models["models/models.py"]
            Schemas["schemas/schemas.py"]
        end
    end
    IngestionAPI --> IngestionService
    HarmonizationAPI --> HarmonizationService
    AnalyticsAPI --> Historical
    AnomaliesAPI --> AnomalyDetection
    IngestionService --> Ingestion
    HarmonizationService --> Harmonization
    IngestionService --> Database
    HarmonizationService --> Database
    Historical --> Database
    AnomalyDetection --> Database
    Routes --> Schemas
    Services --> Models
    Database --> Models
```

### 3.2 Frontend Component Diagram

```mermaid
flowchart TD
    subgraph Frontend["Next.js App Router frontend"]
        subgraph Pages["Implemented routes"]
            Dashboard["/ — Dashboard"]
            MapPage["/map — Fire Map"]
            ComparePage["/compare — Sensor Lab"]
            CalendarPage["/calendar — Fire Calendar"]
            AnalyticsPage["/analytics — Analytics"]
            AnomaliesPage["/anomalies — Anomalies"]
            SourcesPage["/sources — Data Sources"]
            AboutPage["/about — About"]
        end
        subgraph Components["Implemented shared components"]
            FireMap["FireMap.tsx (Leaflet)"]
            AnalyticsCharts["AnalyticsCharts.tsx"]
            ComparisonChart["ComparisonChart.tsx"]
            CalendarHeatmap["CalendarHeatmap.tsx"]
            EducationCard["EducationCard.tsx"]
            StatCard["StatCard.tsx"]
            Navigation["Navbar and Footer"]
            DemoBanner["DemoBanner.tsx"]
        end
        APIClient["lib/api.ts and lib/types.ts"]
    end
    Pages --> Components
    Components --> APIClient
    APIClient -->|fetch JSON and GeoJSON| Backend["FastAPI /api/v1"]
```

---

## 4. Data Flow Diagram

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js Frontend
    participant API as FastAPI /api/v1
    participant DB as PostgreSQL/PostGIS
    participant FIRMS as NASA FIRMS API

    Note over API,FIRMS: Ingestion Flow (POST /api/v1/ingestion/run)
    API->>FIRMS: Fetch product CSV (or use demo generator)
    FIRMS-->>API: CSV response
    API->>API: Parse, validate, normalize, deduplicate
    API->>DB: Save ingestion log and satellite observations

    Note over API,DB: Harmonization is a separate processing run
    User->>API: POST /api/v1/harmonization/run
    API->>DB: Read filtered satellite observations
    API->>API: Assign grid cells, group by date, calculate HAI
    API->>DB: Save harmonized observations and processing run

    Note over User,DB: Query Flow (triggered by user interaction)
    User->>FE: Open Fire Map / select filters
    FE->>API: GET /hotspots/geojson?bbox=...&sensor=MODIS
    API->>DB: Query observations by coordinates and filters
    DB-->>API: Matching observations
    API-->>FE: JSON response
    FE->>FE: Render Leaflet markers

    Note over User,DB: Comparison Flow
    User->>FE: Open Sensor Comparison Lab
    FE->>API: GET /harmonization/compare
    API->>DB: Query comparison data for a grid cell
    DB-->>API: Comparison data
    API-->>FE: JSON comparison object
    FE->>FE: Render three-panel comparison
```

---

## 5. Database Architecture

```mermaid
erDiagram
    data_ingestion_logs ||--o{ satellite_observations : "produces"
    processing_runs ||--o{ harmonized_observations : "produces"
    satellite_observations ||--o{ harmonized_observations : "aggregated_into"
    harmonized_observations ||--o{ activity_anomalies : "analyzed_into"
    historical_baselines ||--o{ activity_anomalies : "compared_against"

    data_ingestion_logs {
        uuid id PK
        string product
        string status
        int records_fetched
        int records_inserted
        int records_skipped
        timestamp started_at
        timestamp completed_at
        jsonb parameters
        text error_message
    }

    satellite_observations {
        bigserial id PK
        uuid ingestion_run_id FK
        string instrument
        string satellite_platform
        decimal latitude
        decimal longitude
        geometry geom
        date acq_date
        time acq_time
        decimal brightness
        decimal frp
        string confidence
        string daynight
        string version
        jsonb raw_metadata
        timestamp created_at
    }

    harmonized_observations {
        bigserial id PK
        uuid processing_run_id FK
        string grid_cell_id
        geometry cell_geom
        date obs_date
        int temporal_window_hours
        decimal grid_resolution_deg
        int modis_count
        int viirs_snpp_count
        int viirs_noaa20_count
        int viirs_noaa21_count
        decimal total_frp_modis
        decimal total_frp_viirs
        decimal hai_score
        string hai_methodology_version
        jsonb processing_params
        timestamp created_at
    }

    historical_baselines {
        bigserial id PK
        string grid_cell_id
        string instrument
        int month_of_year
        decimal mean_count
        decimal std_count
        decimal mean_frp
        decimal std_frp
        int sample_years
        date baseline_start
        date baseline_end
        timestamp calculated_at
    }

    activity_anomalies {
        bigserial id PK
        bigint harmonized_obs_id FK
        bigint baseline_id FK
        date obs_date
        string grid_cell_id
        decimal z_score
        decimal percentile
        string anomaly_level
        jsonb component_values
        timestamp detected_at
    }

    processing_runs {
        uuid id PK
        string run_type
        string status
        string methodology_version
        jsonb parameters
        timestamp started_at
        timestamp completed_at
        text notes
    }
```

---

## 6. Deployment Architecture

```mermaid
flowchart TD
    User["User browser"] -->|HTTP| Frontend["Next.js frontend<br/>port 3000"]
    Frontend -->|HTTP API requests| Backend["FastAPI backend<br/>port 8000"]
    Backend -->|SQLAlchemy| Database[("SQLite by default<br/>PostgreSQL in Compose")]
    Backend -->|HTTPS when configured| FIRMS["NASA FIRMS API"]
    style Frontend fill:#67B7E1,color:#000
    style Backend fill:#FF9F43,color:#000
    style Database fill:#2D8A64,color:#fff
    style FIRMS fill:#1a3a5c,color:#fff
```

### Local Development (Docker Compose)

```mermaid
flowchart LR
    subgraph Docker["Docker Compose"]
        FE["Next.js frontend<br/>port 3000"]
        BE["FastAPI backend<br/>port 8000"]
        DB[("PostgreSQL + PostGIS<br/>port 5432")]
    end
    FE -->|API requests| BE
    BE -->|SQLAlchemy| DB
    BE -->|optional live ingestion| FIRMS["NASA FIRMS API"]
```

---

## 7. Technology Justification

| Layer | Technology | Justification |
|---|---|---|
| Frontend Framework | Next.js 14 (App Router) | SSR + SSG support; excellent developer experience; Vercel deployment |
| Language (FE) | TypeScript | Type safety reduces runtime errors; better IDE support |
| Styling | Tailwind CSS + shadcn/ui | Rapid consistent UI development; accessible components |
| Animations | Framer Motion | Smooth transitions without custom CSS complexity |
| Mapping | React Leaflet + Leaflet | Open source; excellent GeoJSON support; clustering plugins |
| Charts | Recharts | React-native; composable; responsive; well-documented |
| Backend Framework | FastAPI | Async Python; automatic OpenAPI; Pydantic validation |
| ORM | SQLAlchemy 2.0 | Industry standard; PostGIS integration via GeoAlchemy2 |
| Data Processing | Pandas + NumPy | Standard scientific Python stack; proven for CSV processing |
| Spatial Processing | GeoPandas + Shapely | Spatial operations without PostGIS dependency during processing |
| Database | PostgreSQL 15 + PostGIS | Industry-standard spatial database; excellent indexing |
| Containerization | Docker + Docker Compose | Reproducible environment; easy demonstration setup |
| Frontend Hosting | Vercel | Zero-config Next.js deployment; free tier |
| Backend Hosting | Render | Persistent services; PostgreSQL managed option; free tier |

---

## 8. Error Handling Strategy

### Backend Error Hierarchy

```
FireDNAError (base)
├── FIRMSAPIError
│   ├── FIRMSAuthError (401 — invalid key)
│   ├── FIRMSRateLimitError (429 — rate limited)
│   └── FIRMSConnectionError (timeout / connection refused)
├── DataValidationError
│   ├── CoordinateValidationError
│   ├── TimestampValidationError
│   └── NumericValidationError
├── HarmonizationError
│   ├── InsufficientDataError
│   └── GridGenerationError
└── DatabaseError
    ├── DuplicateRecordError
    └── SpatialIndexError
```

### Error Response Format
All API errors return:
```json
{
  "error": {
    "code": "FIRMS_AUTH_ERROR",
    "message": "Invalid or missing NASA FIRMS API key",
    "detail": "Configure MAP_KEY in environment variables",
    "timestamp": "2026-11-10T22:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### Frontend Error Handling
- API errors → Toast notification + error boundary fallback UI
- Map load failure → Static tile fallback + user-friendly message
- Empty data → Illustrated empty state with contextual action
- Network timeout → Retry button with backoff indicator

---

## 9. Caching Strategy

| Data Type | Cache Location | TTL | Invalidation |
|---|---|---|---|
| Hotspot GeoJSON (regional) | FastAPI in-memory (LRU) | 5 minutes | New ingestion run |
| Dashboard statistics | FastAPI in-memory | 5 minutes | New ingestion run |
| Historical baselines | PostgreSQL materialized view | 24 hours | Re-run baseline calculation |
| Harmonized grid data | PostgreSQL table | Until next processing run | Manual or scheduled |
| Frontend API responses | React Query client cache | 2 minutes | Query key invalidation |
| Map tiles | Browser + CDN | 7 days | Tile provider TTL |

---

## 10. Scalability Considerations

**Current MVP (Hackathon Scale)**
- Single FastAPI process
- PostgreSQL single instance
- In-process data processing
- Regional data only (Bangladesh + South Asia)

**Production Scale (Post-Hackathon)**
- Multiple FastAPI workers behind nginx
- PostgreSQL read replicas
- Celery + Redis for async data ingestion jobs
- Partitioned satellite_observations table by date
- PostGIS spatial indexes on geometry columns
- Global coverage with bbox-limited queries
- CDN for static assets

---

## 11. Security Considerations

| Concern | Mitigation |
|---|---|
| NASA API key exposure | Environment variable only; never in frontend code or git |
| SQL injection | SQLAlchemy ORM with parameterized queries |
| XSS | React's default JSX escaping; Content-Security-Policy header |
| CORS | Explicit allowlist of frontend origins |
| Rate limiting | Backend rate limit on ingestion trigger endpoint |
| Data integrity | Input validation via Pydantic; coordinate bounds checking |

---

*Document version 1.0.0 — FireDNA System Architecture*
