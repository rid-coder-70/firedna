# FireDNA — System Architecture
## NASA Space Apps Challenge 2026

**Version:** 1.0.0  
**Date:** November 10, 2026

---

## 1. Architecture Overview

FireDNA follows a **layered microservice-inspired monolith** architecture. For a 24-hour hackathon, a single deployable FastAPI backend with internal service separation is pragmatic and maintainable, while the modular structure allows future decomposition into microservices.

### Design Principles
1. **Separation of concerns** — ingestion, processing, harmonization, and API layers are independent Python modules.
2. **Scientific transparency** — raw satellite data is never discarded; all derived metrics store methodology version and parameters.
3. **Fail-safe operation** — demo mode activates automatically when NASA API is unavailable.
4. **Stateless API** — the FastAPI layer is stateless; all state lives in PostgreSQL/PostGIS.
5. **Progressive enhancement** — the frontend works with partial data; empty states are handled gracefully.

---

## 2. High-Level System Architecture

```mermaid
flowchart TD
    A["NASA FIRMS API\n(MODIS NRT / VIIRS NRT)"] -->|HTTP CSV| B["Data Ingestion Service\nfirms_client.py"]
    B -->|Raw CSV rows| C["Data Cleaning & Validation\ndata_cleaner.py / data_validator.py"]
    C -->|Validated records| D["Deduplication Engine\ndeduplicator.py"]
    D -->|Clean observations| E[("PostgreSQL + PostGIS\nsatellite_observations")]
    E -->|Raw observations| F["Spatial Harmonization\nspatial.py"]
    E -->|Raw observations| G["Temporal Harmonization\ntemporal.py"]
    F -->|Grid-mapped records| H["Sensor Normalization\nnormalization.py"]
    G -->|Time-windowed records| H
    H -->|Normalized values| I["Activity Index Engine\nactivity_index.py"]
    I -->|HAI values| J[("PostgreSQL\nharmonized_observations")]
    J -->|Harmonized data| K["Historical Analytics Engine\nhistorical.py"]
    J -->|Harmonized data| L["Anomaly Detection Engine\nanomaly_detection.py"]
    K -->|Baselines| M[("PostgreSQL\nhistorical_baselines")]
    L -->|Anomaly scores| N[("PostgreSQL\nactivity_anomalies")]
    E & J & M & N -->|Query| O["FastAPI REST API\n/api/v1"]
    O -->|JSON / GeoJSON| P["Next.js Web Application\nFireDNA Frontend"]
    P -->|User browser| Q["End User"]
    style A fill:#1a3a5c,color:#fff
    style E fill:#2D8A64,color:#fff
    style J fill:#2D8A64,color:#fff
    style M fill:#2D8A64,color:#fff
    style N fill:#2D8A64,color:#fff
    style O fill:#FF9F43,color:#000
    style P fill:#67B7E1,color:#000
```

---

## 3. Component Architecture

### 3.1 Backend Component Diagram

```mermaid
flowchart LR
    subgraph Backend["FastAPI Backend (Python 3.11+)"]
        subgraph API["API Layer — /api/v1"]
            I1[ingestion.py]
            I2[hotspots.py]
            I3[harmonization.py]
            I4[analytics.py]
            I5[anomalies.py]
            I6[exports.py]
        end
        subgraph Services["Service Layer"]
            S1[ingestion_service.py]
            S2[harmonization_service.py]
            S3[analytics_service.py]
            S4[anomaly_service.py]
        end
        subgraph Ingestion["Ingestion Subsystem"]
            IN1[firms_client.py]
            IN2[data_cleaner.py]
            IN3[data_validator.py]
            IN4[deduplicator.py]
        end
        subgraph Harmonization["Harmonization Subsystem"]
            H1[spatial.py]
            H2[temporal.py]
            H3[normalization.py]
            H4[activity_index.py]
            H5[validation.py]
        end
        subgraph Analytics["Analytics Subsystem"]
            AN1[historical.py]
            AN2[anomaly_detection.py]
        end
        subgraph Core["Core"]
            C1[config.py]
            C2[database.py]
            C3[models.py]
            C4[schemas.py]
        end
    end
    API --> Services
    Services --> Ingestion
    Services --> Harmonization
    Services --> Analytics
    Ingestion --> Core
    Harmonization --> Core
    Analytics --> Core
```

### 3.2 Frontend Component Diagram

```mermaid
flowchart TD
    subgraph Frontend["Next.js App Router Frontend"]
        subgraph Pages["Pages (app/)"]
            P1["/ — Dashboard"]
            P2["/map — Fire Map"]
            P3["/compare — Sensor Comparison Lab"]
            P4["/calendar — Fire Calendar"]
            P5["/analytics — Activity Analytics"]
            P6["/anomalies — Anomaly Explorer"]
            P7["/sources — Data Sources"]
            P8["/about — About FireDNA"]
        end
        subgraph Components["Shared Components"]
            C1[FireMap.tsx]
            C2[HotspotPopup.tsx]
            C3[SensorPanel.tsx]
            C4[ActivityChart.tsx]
            C5[CalendarHeatmap.tsx]
            C6[AnomalyGauge.tsx]
            C7[EducationCard.tsx]
            C8[StatCard.tsx]
            C9[LayerControls.tsx]
            C10[DataBadge.tsx]
        end
        subgraph State["State & Data"]
            ST1[API Client — lib/api.ts]
            ST2[React Query Hooks]
            ST3[Map State — Zustand]
            ST4[Filter State]
        end
        subgraph UI["UI System"]
            UI1[shadcn/ui Components]
            UI2[Tailwind CSS]
            UI3[Framer Motion]
            UI4[Lucide Icons]
        end
    end
    Pages --> Components
    Components --> State
    Components --> UI
    State --> ST1
    ST1 -->|fetch| Backend["FastAPI Backend"]
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

    Note over API,FIRMS: Ingestion Flow (triggered by POST /ingestion/run)
    API->>FIRMS: GET /api/area/csv/{key}/{product}/{bbox}/{date}
    FIRMS-->>API: CSV response (raw observations)
    API->>API: Clean, validate, deduplicate
    API->>DB: INSERT into satellite_observations
    API->>API: Run harmonization engine
    API->>DB: INSERT into harmonized_observations
    API->>DB: UPDATE historical_baselines
    API->>DB: INSERT activity_anomalies

    Note over User,DB: Query Flow (triggered by user interaction)
    User->>FE: Open Fire Map / select filters
    FE->>API: GET /hotspots?bbox=...&date=...&sensor=MODIS
    API->>DB: SELECT with PostGIS bbox filter
    DB-->>API: GeoJSON feature collection
    API-->>FE: JSON response
    FE->>FE: Render Leaflet markers

    Note over User,DB: Comparison Flow
    User->>FE: Open Sensor Comparison Lab
    FE->>API: GET /harmonization/compare?cell_id=...
    API->>DB: SELECT harmonized + raw observations
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
    subgraph Internet["Internet"]
        U["User Browser"]
    end
    subgraph Vercel["Vercel (Frontend Hosting)"]
        FE["Next.js App\nfiredna.vercel.app"]
    end
    subgraph Render["Render.com (Backend Hosting)"]
        BE["FastAPI Backend\nfiredna-api.onrender.com"]
    end
    subgraph Render2["Render.com (Database)"]
        DB["PostgreSQL 15 + PostGIS\nManaged Instance"]
    end
    subgraph NASA["NASA External APIs"]
        FIRMS["FIRMS API\nfirms.modaps.eosdis.nasa.gov"]
    end
    U -->|HTTPS| FE
    FE -->|HTTPS API calls| BE
    BE -->|TCP 5432| DB
    BE -->|HTTPS| FIRMS
    style FE fill:#67B7E1,color:#000
    style BE fill:#FF9F43,color:#000
    style DB fill:#2D8A64,color:#fff
    style FIRMS fill:#1a3a5c,color:#fff
```

### Local Development (Docker Compose)

```mermaid
flowchart LR
    subgraph Docker["Docker Compose Network"]
        FE["Next.js\nlocalhost:3000"]
        BE["FastAPI\nlocalhost:8000"]
        DB["PostgreSQL+PostGIS\nlocalhost:5432"]
        ADM["pgAdmin\nlocalhost:5050"]
    end
    FE --> BE
    BE --> DB
    ADM --> DB
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
