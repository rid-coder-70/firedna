
# FireDNA — Database Design
## NASA Space Apps Challenge 2026

**Version:** 1.0.0  
**Date:** November 10, 2026

---

## 1. Overview

FireDNA uses **PostgreSQL 15** with the **PostGIS 3.4** extension for all data storage. The schema is designed around three concerns:

1. **Raw data preservation** — raw satellite observations are stored without modification from NASA FIRMS.
2. **Derived data isolation** — harmonized observations and analytics are separate tables with provenance links.
3. **Spatial efficiency** — PostGIS geometry columns with GIST indexes enable fast geographic queries.

---

## 2. Schema Design Principles

- All primary keys use `BIGSERIAL` (auto-increment 64-bit) for observation tables and `UUID` for log/run tables.
- All timestamps are stored in UTC with `TIMESTAMPTZ`.
- Sensor metadata not fitting fixed columns is stored in `JSONB` for future extensibility.
- Raw satellite observations are **never deleted** after ingestion, only flagged.
- Duplicate detection uses a unique composite constraint rather than application-level checking alone.
- PostGIS `GEOMETRY(POINT, 4326)` is used for point observations; `GEOMETRY(POLYGON, 4326)` for grid cells.

---

## 3. Complete SQL Migration Script

```sql
-- =============================================================================
-- FireDNA Database Migration v1.0.0
-- PostgreSQL 15 + PostGIS 3.4
-- Run as: psql -U firedna -d firedna -f migration_v1.sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for text search on grid cells

-- =============================================================================
-- TABLE: data_ingestion_logs
-- Records every ingestion run from NASA FIRMS API
-- =============================================================================
CREATE TABLE IF NOT EXISTS data_ingestion_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product             VARCHAR(50) NOT NULL,            -- e.g. MODIS_NRT, VIIRS_SNPP_NRT
    region_name         VARCHAR(100),                    -- human-readable region label
    bbox_min_lat        DECIMAL(8,5),                    -- geographic bounding box
    bbox_min_lon        DECIMAL(8,5),
    bbox_max_lat        DECIMAL(8,5),
    bbox_max_lon        DECIMAL(8,5),
    date_range_start    DATE NOT NULL,
    date_range_end      DATE NOT NULL,
    status              VARCHAR(20) NOT NULL             -- 'running', 'success', 'failed', 'demo'
                        CHECK (status IN ('running','success','failed','demo')),
    records_fetched     INTEGER DEFAULT 0,
    records_inserted    INTEGER DEFAULT 0,
    records_skipped     INTEGER DEFAULT 0,               -- duplicates or invalid
    records_failed      INTEGER DEFAULT 0,
    is_demo_data        BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE if synthetic demo data
    api_response_code   INTEGER,
    error_message       TEXT,
    parameters          JSONB,                           -- full request parameters
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingestion_logs_product ON data_ingestion_logs(product);
CREATE INDEX idx_ingestion_logs_started_at ON data_ingestion_logs(started_at DESC);
CREATE INDEX idx_ingestion_logs_status ON data_ingestion_logs(status);

COMMENT ON TABLE data_ingestion_logs IS 'Audit log of all NASA FIRMS API ingestion runs';
COMMENT ON COLUMN data_ingestion_logs.is_demo_data IS 'TRUE if this run ingested synthetic demo data, not real NASA observations';

-- =============================================================================
-- TABLE: satellite_observations
-- Stores cleaned and validated NASA FIRMS satellite fire detections.
-- Raw sensor values are preserved; original metadata stored in raw_metadata JSONB.
-- =============================================================================
CREATE TABLE IF NOT EXISTS satellite_observations (
    id                      BIGSERIAL PRIMARY KEY,
    ingestion_run_id        UUID REFERENCES data_ingestion_logs(id) ON DELETE SET NULL,

    -- Sensor identification
    instrument              VARCHAR(20) NOT NULL        -- 'MODIS', 'VIIRS'
                            CHECK (instrument IN ('MODIS','VIIRS')),
    satellite_platform      VARCHAR(30) NOT NULL,       -- 'Terra', 'Aqua', 'Suomi-NPP', 'NOAA-20', 'NOAA-21'
    source_product          VARCHAR(50) NOT NULL,       -- e.g. 'MODIS_NRT', 'VIIRS_SNPP_NRT'

    -- Spatial data
    latitude                DECIMAL(8,5) NOT NULL
                            CHECK (latitude BETWEEN -90 AND 90),
    longitude               DECIMAL(8,5) NOT NULL
                            CHECK (longitude BETWEEN -180 AND 180),
    geom                    GEOMETRY(POINT, 4326),      -- PostGIS geometry for spatial queries

    -- Temporal data
    acq_date                DATE NOT NULL,
    acq_time                TIME,                       -- NULL acceptable for some products
    acq_datetime            TIMESTAMPTZ,                -- combined datetime in UTC

    -- Fire characteristics
    brightness              DECIMAL(8,2),               -- MODIS: Brightness temperature (K); VIIRS: bright_ti4 (K)
    bright_t31              DECIMAL(8,2),               -- MODIS only: Brightness temp channel 31
    frp                     DECIMAL(10,2),              -- Fire Radiative Power (MW); NULL if not available
    daynight                CHAR(1)                     -- 'D' (Day) or 'N' (Night)
                            CHECK (daynight IN ('D','N')),

    -- Confidence / quality
    confidence_raw          VARCHAR(20),                -- Raw confidence value from FIRMS
    -- MODIS: 'low', 'nominal', 'high' (categorical)
    -- VIIRS: 0–100 integer (percentage)
    confidence_normalized   DECIMAL(5,2),              -- Normalized 0.0–1.0 for comparison
    confidence_category     VARCHAR(10)                 -- 'low', 'nominal', 'high' (harmonized)
                            CHECK (confidence_category IN ('low','nominal','high')),

    -- Data quality flags
    scan                    DECIMAL(6,3),               -- MODIS: along-scan pixel size
    track                   DECIMAL(6,3),               -- MODIS: along-track pixel size
    version                 VARCHAR(20),                -- FIRMS product version
    is_demo_data            BOOLEAN NOT NULL DEFAULT FALSE,  -- synthetic data flag

    -- Raw preservation
    raw_metadata            JSONB,                      -- complete original FIRMS row as parsed

    -- Provenance
    processing_version      VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index (most critical for map queries)
CREATE INDEX idx_sat_obs_geom ON satellite_observations USING GIST(geom);

-- Time-based index for temporal queries
CREATE INDEX idx_sat_obs_acq_date ON satellite_observations(acq_date DESC);
CREATE INDEX idx_sat_obs_acq_datetime ON satellite_observations(acq_datetime DESC);

-- Sensor filtering
CREATE INDEX idx_sat_obs_instrument ON satellite_observations(instrument);
CREATE INDEX idx_sat_obs_source_product ON satellite_observations(source_product);

-- Composite index for map dashboard queries
CREATE INDEX idx_sat_obs_instrument_date ON satellite_observations(instrument, acq_date DESC);

-- Deduplication unique constraint
-- Note: acq_time can be NULL for some MODIS records; handled in application logic
CREATE UNIQUE INDEX idx_sat_obs_dedup ON satellite_observations(
    latitude, longitude, acq_date, instrument, satellite_platform
) WHERE acq_time IS NULL;

CREATE UNIQUE INDEX idx_sat_obs_dedup_with_time ON satellite_observations(
    latitude, longitude, acq_date, acq_time, instrument, satellite_platform
) WHERE acq_time IS NOT NULL;

COMMENT ON TABLE satellite_observations IS
    'Cleaned and validated NASA FIRMS active fire detections. '
    'Raw sensor values are preserved. is_demo_data=TRUE for synthetic records.';
COMMENT ON COLUMN satellite_observations.frp IS
    'Fire Radiative Power in megawatts (MW). Source: NASA FIRMS. Not interpolated or modified.';
COMMENT ON COLUMN satellite_observations.confidence_normalized IS
    'FireDNA-derived normalized confidence (0.0–1.0). MODIS: low=0.33, nominal=0.66, high=1.0. VIIRS: raw_value/100.';
COMMENT ON COLUMN satellite_observations.hai_score IS
    'Reserved column — not used in satellite_observations. See harmonized_observations.';

-- Trigger to auto-populate geom from lat/lon
CREATE OR REPLACE FUNCTION set_observation_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    NEW.acq_datetime := (NEW.acq_date::TEXT || ' ' ||
        COALESCE(TO_CHAR(NEW.acq_time, 'HH24:MI:SS'), '00:00:00') || ' UTC')::TIMESTAMPTZ;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_observation_geom
    BEFORE INSERT OR UPDATE ON satellite_observations
    FOR EACH ROW EXECUTE FUNCTION set_observation_geom();

-- =============================================================================
-- TABLE: processing_runs
-- Tracks harmonization and analytics processing runs with full parameters
-- =============================================================================
CREATE TABLE IF NOT EXISTS processing_runs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_type                VARCHAR(50) NOT NULL        -- 'harmonization', 'baseline', 'anomaly_detection'
                            CHECK (run_type IN ('harmonization','baseline','anomaly_detection')),
    status                  VARCHAR(20) NOT NULL
                            CHECK (status IN ('running','success','failed')),
    methodology_version     VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    parameters              JSONB NOT NULL,             -- full configuration used
    input_record_count      INTEGER DEFAULT 0,
    output_record_count     INTEGER DEFAULT 0,
    started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at            TIMESTAMPTZ,
    duration_seconds        DECIMAL(10,3),
    error_message           TEXT,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_processing_runs_type ON processing_runs(run_type);
CREATE INDEX idx_processing_runs_started_at ON processing_runs(started_at DESC);

COMMENT ON TABLE processing_runs IS
    'Audit log of all harmonization, baseline calculation, and anomaly detection runs. '
    'Each run stores its full parameter set for reproducibility.';

-- =============================================================================
-- TABLE: harmonized_observations
-- Grid-aggregated, sensor-normalized fire activity per spatial cell and time window.
-- These are FireDNA-derived metrics, NOT raw NASA data.
-- =============================================================================
CREATE TABLE IF NOT EXISTS harmonized_observations (
    id                      BIGSERIAL PRIMARY KEY,
    processing_run_id       UUID REFERENCES processing_runs(id) ON DELETE SET NULL,

    -- Grid cell identification
    grid_cell_id            VARCHAR(50) NOT NULL,       -- e.g. 'G_23.45N_90.12E_0.1D'
    grid_resolution_deg     DECIMAL(6,4) NOT NULL DEFAULT 0.1,
    cell_lat_min            DECIMAL(8,5) NOT NULL,
    cell_lat_max            DECIMAL(8,5) NOT NULL,
    cell_lon_min            DECIMAL(8,5) NOT NULL,
    cell_lon_max            DECIMAL(8,5) NOT NULL,
    cell_centroid           GEOMETRY(POINT, 4326),
    cell_geom               GEOMETRY(POLYGON, 4326),   -- grid cell polygon for visualization

    -- Temporal window
    obs_date                DATE NOT NULL,
    temporal_window_hours   INTEGER NOT NULL DEFAULT 24,

    -- Raw counts per sensor (preserves original detection counts)
    modis_count             INTEGER NOT NULL DEFAULT 0,
    viirs_snpp_count        INTEGER NOT NULL DEFAULT 0,
    viirs_noaa20_count      INTEGER NOT NULL DEFAULT 0,
    viirs_noaa21_count      INTEGER NOT NULL DEFAULT 0,
    total_viirs_count       INTEGER GENERATED ALWAYS AS
                            (viirs_snpp_count + viirs_noaa20_count + viirs_noaa21_count) STORED,

    -- Fire Radiative Power aggregates
    total_frp_modis         DECIMAL(12,2) DEFAULT 0,   -- sum of MODIS FRP in cell (MW)
    mean_frp_modis          DECIMAL(10,2),              -- mean MODIS FRP
    total_frp_viirs         DECIMAL(12,2) DEFAULT 0,   -- sum of VIIRS FRP in cell (MW)
    mean_frp_viirs          DECIMAL(10,2),              -- mean VIIRS FRP
    max_frp_all             DECIMAL(10,2),              -- maximum FRP across all sensors

    -- Harmonized Activity Index (HAI)
    -- IMPORTANT: This is an experimental FireDNA prototype metric.
    -- It is NOT an official NASA product or validated scientific index.
    hai_score               DECIMAL(8,4),               -- prototype activity index (0.0–1.0+)
    hai_frp_component       DECIMAL(8,4),               -- FRP contribution to HAI
    hai_count_component     DECIMAL(8,4),               -- detection count contribution to HAI
    hai_confidence_component DECIMAL(8,4),              -- confidence contribution to HAI
    hai_methodology_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    hai_is_experimental     BOOLEAN NOT NULL DEFAULT TRUE,  -- always TRUE; reminder of experimental status

    -- Confidence and coverage
    mean_confidence_modis   DECIMAL(5,2),               -- mean normalized confidence for MODIS
    mean_confidence_viirs   DECIMAL(5,2),               -- mean normalized confidence for VIIRS
    day_count               INTEGER DEFAULT 0,          -- daytime detections
    night_count             INTEGER DEFAULT 0,          -- nighttime detections
    has_modis               BOOLEAN GENERATED ALWAYS AS (modis_count > 0) STORED,
    has_viirs               BOOLEAN GENERATED ALWAYS AS
                            (viirs_snpp_count + viirs_noaa20_count + viirs_noaa21_count > 0) STORED,

    -- Processing parameters (snapshot for reproducibility)
    processing_params       JSONB,

    -- Provenance
    is_demo_data            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index
CREATE INDEX idx_harm_obs_cell_centroid ON harmonized_observations USING GIST(cell_centroid);
CREATE INDEX idx_harm_obs_cell_geom ON harmonized_observations USING GIST(cell_geom);

-- Query indexes
CREATE INDEX idx_harm_obs_date ON harmonized_observations(obs_date DESC);
CREATE INDEX idx_harm_obs_grid_cell ON harmonized_observations(grid_cell_id);
CREATE INDEX idx_harm_obs_grid_date ON harmonized_observations(grid_cell_id, obs_date DESC);

-- Deduplication
CREATE UNIQUE INDEX idx_harm_obs_dedup ON harmonized_observations(
    grid_cell_id, obs_date, temporal_window_hours, processing_run_id
);

-- Trigger to generate cell geometry
CREATE OR REPLACE FUNCTION set_harmonized_cell_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.cell_centroid := ST_SetSRID(
        ST_MakePoint(
            (NEW.cell_lon_min + NEW.cell_lon_max) / 2.0,
            (NEW.cell_lat_min + NEW.cell_lat_max) / 2.0
        ), 4326
    );
    NEW.cell_geom := ST_MakeEnvelope(
        NEW.cell_lon_min, NEW.cell_lat_min,
        NEW.cell_lon_max, NEW.cell_lat_max,
        4326
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_harmonized_cell_geom
    BEFORE INSERT OR UPDATE ON harmonized_observations
    FOR EACH ROW EXECUTE FUNCTION set_harmonized_cell_geom();

COMMENT ON TABLE harmonized_observations IS
    'FireDNA-derived harmonized fire activity per spatial grid cell and temporal window. '
    'Contains both raw sensor counts and experimental HAI scores. '
    'NOT raw NASA data — derived from satellite_observations by the harmonization engine.';
COMMENT ON COLUMN harmonized_observations.hai_score IS
    'EXPERIMENTAL — FireDNA Harmonized Activity Index prototype score. '
    'NOT an official NASA metric. NOT scientifically validated. For demonstration purposes.';

-- =============================================================================
-- TABLE: historical_baselines
-- Monthly climatological baselines per grid cell per sensor
-- =============================================================================
CREATE TABLE IF NOT EXISTS historical_baselines (
    id                      BIGSERIAL PRIMARY KEY,
    grid_cell_id            VARCHAR(50) NOT NULL,
    instrument              VARCHAR(20) NOT NULL        -- 'MODIS', 'VIIRS', 'ALL'
                            CHECK (instrument IN ('MODIS','VIIRS','ALL')),
    month_of_year           SMALLINT NOT NULL
                            CHECK (month_of_year BETWEEN 1 AND 12),

    -- Statistical baselines
    mean_count              DECIMAL(10,3),
    std_count               DECIMAL(10,3),
    median_count            DECIMAL(10,3),
    p10_count               DECIMAL(10,3),              -- 10th percentile
    p25_count               DECIMAL(10,3),
    p75_count               DECIMAL(10,3),
    p90_count               DECIMAL(10,3),              -- 90th percentile
    mean_frp                DECIMAL(12,3),
    std_frp                 DECIMAL(12,3),
    median_frp              DECIMAL(12,3),

    -- Baseline metadata
    sample_years            INTEGER NOT NULL,           -- number of years contributing to baseline
    sample_records          INTEGER NOT NULL,           -- total observations in baseline
    baseline_start_year     SMALLINT NOT NULL,
    baseline_end_year       SMALLINT NOT NULL,
    is_sufficient           BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE if sample_years >= 3
    is_demo_data            BOOLEAN NOT NULL DEFAULT FALSE,

    calculated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    methodology_version     VARCHAR(20) NOT NULL DEFAULT '1.0.0'
);

CREATE UNIQUE INDEX idx_baselines_cell_instrument_month ON historical_baselines(
    grid_cell_id, instrument, month_of_year
);
CREATE INDEX idx_baselines_grid_cell ON historical_baselines(grid_cell_id);
CREATE INDEX idx_baselines_month ON historical_baselines(month_of_year);

COMMENT ON TABLE historical_baselines IS
    'Monthly climatological fire activity baselines per grid cell. '
    'Used for anomaly detection Z-score calculation. '
    'is_sufficient=FALSE when fewer than 3 years of data exist for the cell.';

-- =============================================================================
-- TABLE: activity_anomalies
-- Identified unusual fire activity periods with statistical scores
-- =============================================================================
CREATE TABLE IF NOT EXISTS activity_anomalies (
    id                      BIGSERIAL PRIMARY KEY,
    harmonized_obs_id       BIGINT REFERENCES harmonized_observations(id) ON DELETE CASCADE,
    baseline_id             BIGINT REFERENCES historical_baselines(id) ON DELETE SET NULL,

    -- Identification
    obs_date                DATE NOT NULL,
    grid_cell_id            VARCHAR(50) NOT NULL,
    cell_location           GEOMETRY(POINT, 4326),

    -- Anomaly scores
    -- Z-score: (observed - baseline_mean) / baseline_std
    z_score                 DECIMAL(10,4),
    historical_percentile   DECIMAL(5,2),               -- 0–100

    -- Classification thresholds (FireDNA-defined, not NASA-validated)
    -- z < 1.5: 'normal'
    -- 1.5 <= z < 2.5: 'elevated'
    -- 2.5 <= z < 3.5: 'high'
    -- z >= 3.5: 'extreme'
    anomaly_level           VARCHAR(20) NOT NULL
                            CHECK (anomaly_level IN ('normal','elevated','high','extreme','insufficient_data')),
    anomaly_label           VARCHAR(100),               -- human-readable label for UI

    -- Observed vs baseline comparison
    observed_count          INTEGER,
    baseline_mean_count     DECIMAL(10,3),
    baseline_std_count      DECIMAL(10,3),
    observed_frp            DECIMAL(12,2),
    baseline_mean_frp       DECIMAL(12,3),

    -- Component breakdown (for transparency)
    component_values        JSONB,                      -- full breakdown stored for UI transparency

    -- Flags
    is_demo_data            BOOLEAN NOT NULL DEFAULT FALSE,
    has_sufficient_baseline BOOLEAN NOT NULL DEFAULT FALSE,

    detected_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_anomalies_date ON activity_anomalies(obs_date DESC);
CREATE INDEX idx_anomalies_grid_cell ON activity_anomalies(grid_cell_id);
CREATE INDEX idx_anomalies_level ON activity_anomalies(anomaly_level);
CREATE INDEX idx_anomalies_location ON activity_anomalies USING GIST(cell_location);
CREATE INDEX idx_anomalies_z_score ON activity_anomalies(z_score DESC NULLS LAST);

COMMENT ON TABLE activity_anomalies IS
    'FireDNA anomaly detection results. Z-scores and thresholds are FireDNA-defined, '
    'not official NASA thresholds. Anomaly does not confirm wildfire. '
    'is_sufficient_baseline=FALSE means anomaly score is unreliable.';
COMMENT ON COLUMN activity_anomalies.anomaly_level IS
    'EXPERIMENTAL FireDNA classification. Normal: z<1.5. Elevated: z<2.5. High: z<3.5. Extreme: z>=3.5.';

-- =============================================================================
-- VIEWS: Convenience query views
-- =============================================================================

-- Latest hotspot summary by region
CREATE OR REPLACE VIEW v_recent_hotspots AS
SELECT
    id,
    instrument,
    satellite_platform,
    source_product,
    latitude,
    longitude,
    geom,
    acq_date,
    acq_datetime,
    frp,
    confidence_category,
    daynight,
    is_demo_data,
    created_at
FROM satellite_observations
WHERE acq_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY acq_datetime DESC NULLS LAST;

COMMENT ON VIEW v_recent_hotspots IS 'Hotspot observations from the past 7 days for dashboard display';

-- Dashboard statistics
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
    COUNT(*) FILTER (WHERE is_demo_data = FALSE) AS total_real_hotspots,
    COUNT(*) FILTER (WHERE is_demo_data = TRUE) AS total_demo_hotspots,
    COUNT(*) FILTER (WHERE instrument = 'MODIS' AND is_demo_data = FALSE) AS modis_count,
    COUNT(*) FILTER (WHERE instrument = 'VIIRS' AND is_demo_data = FALSE) AS viirs_count,
    MIN(acq_date) AS earliest_observation,
    MAX(acq_date) AS latest_observation,
    MAX(created_at) AS last_ingestion
FROM satellite_observations;

COMMENT ON VIEW v_dashboard_stats IS 'Aggregate statistics for the FireDNA dashboard header';

-- =============================================================================
-- INDEXES for common query patterns
-- =============================================================================

-- Bangladesh region bbox query pattern:
-- WHERE ST_Within(geom, ST_MakeEnvelope(88.0, 20.5, 92.7, 26.7, 4326))
-- The GIST index on geom handles this efficiently.

-- South Asia region bbox:
-- WHERE ST_Within(geom, ST_MakeEnvelope(60.0, 5.0, 100.0, 40.0, 4326))

-- =============================================================================
-- SAMPLE DATA SEED (Demo Mode)
-- Synthetic representative data clearly labeled as demo
-- NOT real NASA observations
-- =============================================================================

-- Demo seed is handled by the Python application in demo mode.
-- The application inserts synthetic records with is_demo_data=TRUE
-- and displays a prominent "DEMO DATA" banner in the UI.

-- =============================================================================
-- GRANTS (production setup)
-- =============================================================================
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO firedna_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO firedna_app;

-- =============================================================================
-- Migration complete
-- =============================================================================
SELECT
    'FireDNA database migration v1.0.0 complete' AS status,
    NOW() AS completed_at,
    PostGIS_Version() AS postgis_version;
```

---

## 4. Index Strategy

| Index | Type | Columns | Purpose |
|---|---|---|---|
| idx_sat_obs_geom | GIST | geom | Bbox spatial queries for map rendering |
| idx_sat_obs_acq_date | BTREE | acq_date DESC | Time-range filtering |
| idx_sat_obs_instrument_date | BTREE | instrument, acq_date | Sensor+date composite queries |
| idx_sat_obs_dedup | UNIQUE | lat, lon, date, instrument, platform | Duplicate prevention |
| idx_harm_obs_cell_centroid | GIST | cell_centroid | Spatial grid queries |
| idx_harm_obs_grid_date | BTREE | grid_cell_id, obs_date | Cell time-series queries |
| idx_baselines_cell_instrument_month | UNIQUE | cell, instrument, month | Baseline lookup |
| idx_anomalies_z_score | BTREE | z_score DESC | Top anomaly ranking |

---

## 5. Data Volumes (Estimated)

| Table | MVP (Bangladesh, 30 days) | Regional (South Asia, 1 year) | Global (All sensors, 5 years) |
|---|---|---|---|
| satellite_observations | ~50,000 rows | ~5M rows | ~500M rows |
| harmonized_observations | ~5,000 rows | ~500K rows | ~50M rows |
| historical_baselines | ~1,000 rows | ~100K rows | ~10M rows |
| activity_anomalies | ~500 rows | ~50K rows | ~5M rows |

For MVP scale, all tables fit comfortably in a free-tier PostgreSQL instance.

---

## 6. Data Provenance Chain

```
NASA FIRMS API
    → data_ingestion_logs (run record created)
    → satellite_observations (raw records, ingestion_run_id FK)
        → processing_runs (harmonization run record)
        → harmonized_observations (derived, processing_run_id FK)
            → historical_baselines (monthly statistics)
            → activity_anomalies (anomaly scores, baseline_id FK)
```

Every derived record links back to the processing run that created it, which stores the full parameter set. This chain allows complete reproduction of any derived metric from raw NASA data.

---

## 7. Backup and Recovery

For hackathon deployment:
- Render.com managed PostgreSQL includes daily backups.
- Local development: `pg_dump firedna > backup_$(date +%Y%m%d).sql`
- PostGIS-compatible restore: `psql firedna < backup_20261110.sql`

---

*Document version 1.0.0 — FireDNA Database Design*
