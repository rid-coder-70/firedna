# FireDNA — Product Requirements Document (PRD)
## NASA Space Apps Challenge 2026 | MODIS and VIIRS Hot Spots

**Version:** 1.0.0  
**Date:** November 10, 2026  
**Status:** Approved for Development  
**Challenge:** [MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)

---

## 1. Executive Summary

FireDNA is a web-based geospatial analytics platform that ingests, harmonizes, and visualizes active-fire observations from NASA's MODIS and VIIRS satellite instruments via the FIRMS (Fire Information for Resource Management System) API. The system addresses the challenge of comparing fire detections across satellites with different spatial resolutions, overpass schedules, and detection algorithms by implementing a transparent harmonization pipeline and an experimental prototype activity index.

The primary demonstration region is Bangladesh and South Asia, while the architecture supports global coverage.

---

## 2. Problem Statement

NASA's FIRMS platform provides near-real-time fire detection data from multiple satellite instruments:

| Instrument | Satellite Platform | Spatial Resolution | Swath Width |
|---|---|---|---|
| MODIS (Moderate Resolution Imaging Spectroradiometer) | Terra & Aqua | ~1 km | 2,330 km |
| VIIRS (Visible Infrared Imaging Radiometer Suite) | Suomi-NPP | 375 m | 3,000 km |
| VIIRS | NOAA-20 (JPSS-1) | 375 m | 3,000 km |
| VIIRS | NOAA-21 (JPSS-2) | 375 m | 3,000 km |

**Core problem:** Because MODIS and VIIRS have different spatial resolutions, detection thresholds, and overpass times, raw detection counts from each sensor are not directly comparable. A researcher studying fire activity in a region will find different counts from each sensor for the same fire events. Without harmonization, naive comparison leads to misleading conclusions.

**Secondary problem:** Existing platforms (NASA Worldview, FIRMS Map) display raw satellite data but do not provide integrated multi-sensor comparison, harmonized analytics, or educational explanations suitable for students and non-specialist audiences.

---

## 3. Project Objectives

### Primary Objectives
1. Ingest near-real-time fire hotspot data from all major FIRMS products (MODIS NRT, VIIRS SNPP NRT, NOAA-20 NRT, NOAA-21 NRT).
2. Clean, validate, and standardize raw satellite observations.
3. Store raw and derived observations in a spatially-enabled PostgreSQL/PostGIS database.
4. Implement a transparent spatial and temporal harmonization engine that places MODIS and VIIRS observations on a common grid.
5. Compute an experimental prototype Harmonized Activity Index (HAI) with documented methodology.
6. Provide REST APIs for all data and analytics.
7. Build a beautiful, educational, and scientifically credible web interface.
8. Support data export (CSV, GeoJSON).

### Secondary Objectives
1. Provide anomaly detection against historical baselines.
2. Support seasonal and yearly fire activity analytics.
3. Educate students and general users about satellite fire monitoring.
4. Demonstrate scientific transparency with clearly labeled data provenance.

### Non-Objectives (Out of Scope for MVP)
- Real-time push notifications.
- Machine learning fire spread prediction.
- Air quality integration.
- Mobile native applications.
- Multi-user authentication beyond read access.
- Automated scheduled ingestion (may be added post-MVP).

---

## 4. User Personas

### Persona 1 — Curious Student (Age 12–18)
**Name:** Priya, Grade 10, Dhaka  
**Goals:** Understand how satellites detect fires; see fire data for her region; share with class.  
**Needs:** Simple language, visual explanations, mobile-friendly, educational tooltips.  
**Frustrations:** Scientific jargon, tiny text, overwhelming dashboards.

### Persona 2 — Environmental Researcher
**Name:** Dr. Rahman, Remote Sensing Specialist  
**Goals:** Compare MODIS and VIIRS fire counts, download data for GIS analysis, assess data quality.  
**Needs:** Raw data access, methodology transparency, CSV/GeoJSON export, confidence scores.  
**Frustrations:** Undocumented processing, missing provenance, opaque index calculations.

### Persona 3 — Disaster Management Officer
**Name:** Kabir, Bangladesh Forest Department  
**Goals:** Monitor current fire activity, identify unusual fire events, generate reports.  
**Needs:** Current data, regional filters, anomaly alerts, downloadable maps.  
**Frustrations:** Stale data, no regional focus, no historical context.

### Persona 4 — General Public
**Name:** Maria, Science Enthusiast  
**Goals:** Explore interactive fire map, understand what "hotspot" means, share discoveries.  
**Needs:** Engaging visuals, simple language, shareable content.  
**Frustrations:** Wall-of-text documentation, lack of interactivity.

---

## 5. Functional Requirements

### FR-01: Data Ingestion
- FR-01.1: System SHALL connect to NASA FIRMS API using a secure MAP_KEY.
- FR-01.2: System SHALL support MODIS_NRT, VIIRS_SNPP_NRT, VIIRS_NOAA20_NRT, VIIRS_NOAA21_NRT products.
- FR-01.3: System SHALL accept configurable geographic bounding boxes and date ranges.
- FR-01.4: System SHALL parse FIRMS CSV responses into structured records.
- FR-01.5: System SHALL implement retry logic with exponential backoff (3 retries, max 30s timeout).
- FR-01.6: System SHALL log every ingestion run with timestamps, record counts, and error details.
- FR-01.7: System SHALL operate in demo mode when no API key is configured, using clearly labeled synthetic data.
- FR-01.8: System SHALL detect and skip duplicate observations based on (latitude, longitude, acq_date, acq_time, instrument).

### FR-02: Data Processing
- FR-02.1: System SHALL validate coordinate ranges (latitude −90 to 90, longitude −180 to 180).
- FR-02.2: System SHALL validate acquisition timestamps and reject malformed dates.
- FR-02.3: System SHALL standardize confidence values across sensors (percentage for VIIRS, categorical for MODIS).
- FR-02.4: System SHALL preserve raw sensor metadata in JSONB fields.
- FR-02.5: System SHALL record data provenance (source product, ingestion run ID, processing version).

### FR-03: Harmonization
- FR-03.1: System SHALL generate a configurable equal-area spatial grid (default: 0.1° cells).
- FR-03.2: System SHALL aggregate MODIS and VIIRS observations into shared grid cells.
- FR-03.3: System SHALL group observations into configurable UTC temporal windows (default: 24 hours).
- FR-03.4: System SHALL compute a prototype Harmonized Activity Index (HAI) per cell-window.
- FR-03.5: System SHALL store methodology version and processing parameters with each harmonization run.
- FR-03.6: System SHALL clearly label HAI as an experimental prototype metric.

### FR-04: Analytics
- FR-04.1: System SHALL compute daily, monthly, and yearly observation counts per sensor.
- FR-04.2: System SHALL compute seasonal aggregations (DJF, MAM, JJA, SON).
- FR-04.3: System SHALL compute historical monthly baselines (mean and standard deviation).
- FR-04.4: System SHALL compute Z-scores and historical percentiles for anomaly detection.
- FR-04.5: System SHALL handle zero-variance baselines without crashing (flag as insufficient data).

### FR-05: API
- FR-05.1: System SHALL expose REST APIs under /api/v1.
- FR-05.2: System SHALL return JSON responses with consistent structure.
- FR-05.3: System SHALL support GeoJSON output for spatial data.
- FR-05.4: System SHALL implement pagination for list endpoints (page, page_size).
- FR-05.5: System SHALL document all endpoints via OpenAPI / Swagger.
- FR-05.6: System SHALL implement CORS for frontend integration.

### FR-06: Frontend
- FR-06.1: System SHALL display an interactive global fire map using React Leaflet.
- FR-06.2: System SHALL support MODIS, VIIRS, and combined layer toggling.
- FR-06.3: System SHALL display hotspot popups with full observation metadata.
- FR-06.4: System SHALL display sensor comparison panels (MODIS vs VIIRS vs Harmonized).
- FR-06.5: System SHALL display a fire activity calendar heatmap.
- FR-06.6: System SHALL display time-series charts for daily, monthly, yearly trends.
- FR-06.7: System SHALL display anomaly status with historical context.
- FR-06.8: System SHALL support CSV and GeoJSON data export.
- FR-06.9: System SHALL be responsive on desktop, tablet, and mobile.

### FR-07: Scientific Transparency
- FR-07.1: System SHALL clearly attribute all data to NASA FIRMS.
- FR-07.2: System SHALL display data acquisition and processing timestamps.
- FR-07.3: System SHALL label demo/synthetic data with visible warnings.
- FR-07.4: System SHALL document harmonization methodology in the UI.
- FR-07.5: System SHALL display known limitations and uncertainty statements.

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | Map renders within 3 seconds for regional queries (<10,000 points) |
| NFR-02 | Performance | API endpoints respond within 2 seconds for standard queries |
| NFR-03 | Scalability | Database supports up to 10 million observation records |
| NFR-04 | Reliability | Backend uptime target: 99% during hackathon demonstration |
| NFR-05 | Security | NASA API key stored in environment variables only; never exposed to frontend |
| NFR-06 | Accessibility | WCAG 2.1 AA color contrast for all primary text |
| NFR-07 | Maintainability | Modular codebase with clear separation of concerns |
| NFR-08 | Deployability | Full stack deployable via Docker Compose in one command |
| NFR-09 | Data Integrity | Duplicate prevention at ingestion time |
| NFR-10 | Scientific Honesty | No fabricated data, calibration parameters, or accuracy claims |

---

## 7. Data Sources

| Source | Product | Description | Access |
|---|---|---|---|
| NASA FIRMS | MODIS_NRT | MODIS Terra+Aqua Collection 6.1 NRT Active Fire | FIRMS API (MAP_KEY required) |
| NASA FIRMS | VIIRS_SNPP_NRT | VIIRS Suomi-NPP 375m NRT Active Fire | FIRMS API |
| NASA FIRMS | VIIRS_NOAA20_NRT | VIIRS NOAA-20 375m NRT Active Fire | FIRMS API |
| NASA FIRMS | VIIRS_NOAA21_NRT | VIIRS NOAA-21 375m NRT Active Fire | FIRMS API |

**Attribution requirement:** All data displayed must include the following attribution:  
*"Data provided by NASA FIRMS (Fire Information for Resource Management System), operated by NASA's Earth Science Data and Information System (ESDIS) project."*

---

## 8. Constraints and Assumptions

### Constraints
- NASA FIRMS API rate limits and usage policies apply.
- Historical data availability depends on FIRMS archive access tier.
- Hackathon MVP must be completed within 24–48 hours.
- No budget for paid cloud services; deployment targets Vercel (free tier) + Render (free tier).

### Assumptions
- A valid FIRMS MAP_KEY will be obtained before the hackathon demonstration.
- PostgreSQL with PostGIS extension will be available via Docker.
- Internet connectivity is available during the demonstration.
- If historical data is insufficient for baseline, demo data will be clearly labeled.

---

## 9. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| FIRMS API key unavailable | Low | High | Demo mode with synthetic labeled data |
| API rate limit exceeded | Medium | Medium | Caching, retry backoff, request throttling |
| Insufficient historical data for anomaly detection | Medium | Medium | Label as "insufficient baseline", show available data |
| PostGIS not available in deployment | Low | High | Docker with PostGIS image; fallback to WGS84 coordinates |
| Slow API response on demo day | Low | High | Pre-fetch and cache Bangladesh region data |
| Browser performance on large datasets | Medium | Medium | Clustering, bbox queries, server-side aggregation |

---

## 10. Success Criteria

FireDNA will be considered successful when:

1. ✅ Live NASA FIRMS data is ingested and displayed on the map.
2. ✅ MODIS and VIIRS observations are shown as separate filterable layers.
3. ✅ Harmonization engine runs and produces grid-based outputs.
4. ✅ Harmonized Activity Index is computed and displayed with methodology explanation.
5. ✅ Historical analytics show time-series charts with real or demo data.
6. ✅ Anomaly detection flags unusual periods with Z-score and percentile.
7. ✅ Bangladesh region is the default view with appropriate regional context.
8. ✅ CSV and GeoJSON export works.
9. ✅ All scientific data is properly attributed and labeled.
10. ✅ Application is accessible from a public URL during the demonstration.

---

## 11. Glossary

| Term | Definition |
|---|---|
| FIRMS | Fire Information for Resource Management System — NASA's fire data distribution platform |
| MODIS | Moderate Resolution Imaging Spectroradiometer — instrument on Terra and Aqua satellites |
| VIIRS | Visible Infrared Imaging Radiometer Suite — instrument on Suomi-NPP and NOAA-20/21 |
| FRP | Fire Radiative Power — energy emitted by a fire, measured in megawatts (MW) |
| NRT | Near Real-Time — data processed and available within hours of satellite overpass |
| HAI | Harmonized Activity Index — FireDNA's experimental prototype multi-sensor activity metric |
| Hotspot | A satellite-detected thermal anomaly that may indicate a fire |
| Harmonization | The process of placing multi-sensor observations on a common spatial and temporal framework |
| PostGIS | PostgreSQL extension for geographic objects and spatial queries |
| GeoJSON | Open standard for encoding geographic data structures in JSON |
| Bbox | Bounding box — a rectangular geographic area defined by min/max lat/lon |
| Z-score | Standard deviations above or below the historical mean |
| NaN | Not a Number — represents missing or undefined numeric values |

---

*This PRD was created for the NASA Space Apps Challenge 2026. FireDNA is a prototype research tool and is not an official NASA product. All NASA data usage must comply with [NASA's data usage policies](https://www.nasa.gov/about/highlights/HP_Privacy.html).*
