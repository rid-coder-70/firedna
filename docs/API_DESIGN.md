# FireDNA — API Design
## NASA Space Apps Challenge 2026

**Version:** 1.0.0  
**Base URL:** `https://firedna-api.onrender.com/api/v1`  
**Local URL:** `http://localhost:8000/api/v1`  
**Documentation:** `http://localhost:8000/docs` (Swagger UI)  
**OpenAPI Schema:** `http://localhost:8000/openapi.json`

---

## 1. API Conventions

### Request Format
- All requests use `Content-Type: application/json` unless noted.
- All timestamps are ISO 8601 UTC: `2026-11-10T22:00:00Z`.
- All dates are ISO 8601: `2026-11-10`.
- Geographic coordinates are WGS84 decimal degrees.
- Bounding box format: `min_lat,min_lon,max_lat,max_lon` (URL parameter).

### Response Format
All successful responses follow:
```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-10T22:00:00Z",
    "version": "1.0.0",
    "is_demo_data": false
  }
}
```

All error responses follow:
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "detail": "Technical detail for developers",
    "timestamp": "2026-11-10T22:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### Pagination
List endpoints support:
- `page` (integer, default: 1)
- `page_size` (integer, default: 50, max: 500)

Paginated responses include:
```json
{
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total_items": 1234,
    "total_pages": 25,
    "has_next": true,
    "has_prev": false
  }
}
```

### Common Query Parameters

| Parameter | Type | Description | Example |
|---|---|---|---|
| `bbox` | string | `min_lat,min_lon,max_lat,max_lon` | `20.5,88.0,26.7,92.7` |
| `start_date` | date | Start date (inclusive) | `2026-11-01` |
| `end_date` | date | End date (inclusive) | `2026-11-10` |
| `sensor` | string | Comma-separated sensors | `MODIS,VIIRS` |
| `product` | string | Specific FIRMS product | `VIIRS_SNPP_NRT` |
| `confidence` | string | Minimum confidence level | `nominal` |
| `page` | integer | Page number | `1` |
| `page_size` | integer | Results per page | `50` |

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async task started) |
| 400 | Bad Request — invalid parameters |
| 401 | Unauthorized — API key required |
| 404 | Not Found |
| 422 | Unprocessable Entity — validation error |
| 429 | Too Many Requests — rate limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable — FIRMS API down |

---

## 2. Endpoint Groups

---

### 2.1 Ingestion Endpoints

#### `POST /ingestion/run`
Trigger a new NASA FIRMS data ingestion run.

**Authentication:** API key header required (admin operation)  
**Request Body:**
```json
{
  "products": ["MODIS_NRT", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"],
  "bbox": {
    "min_lat": 20.5,
    "min_lon": 88.0,
    "max_lat": 26.7,
    "max_lon": 92.7
  },
  "start_date": "2026-11-01",
  "end_date": "2026-11-10",
  "region_name": "Bangladesh"
}
```
**Response (202 Accepted):**
```json
{
  "status": "success",
  "data": {
    "ingestion_run_ids": [
      "uuid-modis-run",
      "uuid-viirs-snpp-run",
      "uuid-viirs-noaa20-run"
    ],
    "message": "Ingestion started for 3 products",
    "estimated_duration_seconds": 30
  }
}
```
**Validation rules:**
- `start_date` must not be more than 365 days before today (NRT limitation).
- `end_date` must not be in the future.
- `bbox` must be valid WGS84 coordinates.
- `products` must be a subset of supported products.

---

#### `GET /ingestion/status`
Get status of recent ingestion runs.

**Query params:** `limit` (default: 10, max: 100)  
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "runs": [
      {
        "id": "uuid-run-1",
        "product": "MODIS_NRT",
        "status": "success",
        "records_fetched": 342,
        "records_inserted": 338,
        "records_skipped": 4,
        "is_demo_data": false,
        "started_at": "2026-11-10T16:00:00Z",
        "completed_at": "2026-11-10T16:00:12Z",
        "duration_seconds": 12.3
      }
    ],
    "last_successful_ingestion": "2026-11-10T16:00:12Z",
    "is_demo_mode": false
  }
}
```

---

#### `GET /ingestion/logs`
Paginated ingestion audit log.

**Query params:** `page`, `page_size`, `status`, `product`, `start_date`, `end_date`  
**Response:** Paginated list of `data_ingestion_logs` records.

---

### 2.2 Hotspot Endpoints

#### `GET /hotspots`
List fire hotspot observations with filtering.

**Query params:** `bbox`, `start_date`, `end_date`, `sensor`, `product`, `confidence`, `daynight`, `page`, `page_size`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "hotspots": [
      {
        "id": 12345,
        "instrument": "VIIRS",
        "satellite_platform": "Suomi-NPP",
        "source_product": "VIIRS_SNPP_NRT",
        "latitude": 23.456,
        "longitude": 90.123,
        "acq_date": "2026-11-10",
        "acq_time": "06:30:00",
        "acq_datetime": "2026-11-10T06:30:00Z",
        "brightness": 328.5,
        "frp": 12.3,
        "confidence_raw": "72",
        "confidence_normalized": 0.72,
        "confidence_category": "nominal",
        "daynight": "D",
        "is_demo_data": false
      }
    ]
  },
  "pagination": { ... },
  "meta": {
    "timestamp": "2026-11-10T22:00:00Z",
    "version": "1.0.0",
    "is_demo_data": false,
    "data_attribution": "NASA FIRMS — Fire Information for Resource Management System"
  }
}
```

---

#### `GET /hotspots/{id}`
Get a single hotspot observation by ID.

**Path param:** `id` (integer)  
**Response (200):** Full observation record including `raw_metadata` JSONB.  
**Response (404):** `{ "error": { "code": "HOTSPOT_NOT_FOUND", ... } }`

---

#### `GET /hotspots/summary`
Aggregate statistics for hotspots (no individual records).

**Query params:** `bbox`, `start_date`, `end_date`, `sensor`  
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "total_count": 1234,
    "modis_count": 456,
    "viirs_count": 778,
    "mean_frp": 15.3,
    "max_frp": 234.5,
    "earliest_observation": "2026-11-01",
    "latest_observation": "2026-11-10",
    "bbox_applied": "20.5,88.0,26.7,92.7",
    "is_demo_data": false
  }
}
```

---

#### `GET /hotspots/geojson`
Return hotspots as GeoJSON FeatureCollection (for Leaflet).

**Query params:** `bbox` (REQUIRED for performance), `start_date`, `end_date`, `sensor`, `max_features` (default: 2000)

**Response (200):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [90.123, 23.456]
      },
      "properties": {
        "id": 12345,
        "instrument": "VIIRS",
        "satellite_platform": "Suomi-NPP",
        "frp": 12.3,
        "confidence_category": "nominal",
        "acq_date": "2026-11-10",
        "daynight": "D",
        "is_demo_data": false
      }
    }
  ],
  "meta": {
    "count": 1234,
    "truncated": false,
    "is_demo_data": false,
    "attribution": "NASA FIRMS — Fire Information for Resource Management System"
  }
}
```

---

### 2.3 Harmonization Endpoints

#### `POST /harmonization/run`
Trigger a harmonization processing run.

**Authentication:** API key header required  
**Request Body:**
```json
{
  "grid_resolution_deg": 0.1,
  "temporal_window_hours": 24,
  "bbox": { "min_lat": 20.5, "min_lon": 88.0, "max_lat": 26.7, "max_lon": 92.7 },
  "start_date": "2026-11-01",
  "end_date": "2026-11-10",
  "recompute": false
}
```
**Response (202):** Processing run ID and estimated duration.

---

#### `GET /harmonization/results`
Get harmonized observation records.

**Query params:** `bbox`, `start_date`, `end_date`, `grid_resolution`, `page`, `page_size`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "harmonized": [
      {
        "id": 456,
        "grid_cell_id": "G_23.4N_90.1E_0.1D",
        "grid_resolution_deg": 0.1,
        "cell_lat_min": 23.4,
        "cell_lat_max": 23.5,
        "cell_lon_min": 90.1,
        "cell_lon_max": 90.2,
        "obs_date": "2026-11-10",
        "modis_count": 2,
        "viirs_snpp_count": 5,
        "viirs_noaa20_count": 3,
        "viirs_noaa21_count": 1,
        "total_frp_modis": 24.6,
        "total_frp_viirs": 42.1,
        "hai_score": 0.342,
        "hai_is_experimental": true,
        "mean_confidence_modis": 0.8,
        "mean_confidence_viirs": 0.72
      }
    ]
  }
}
```

---

#### `GET /harmonization/compare`
Side-by-side MODIS vs VIIRS vs Harmonized data for a grid cell.

**Query params:** `grid_cell_id` (required), `start_date`, `end_date`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "grid_cell_id": "G_23.4N_90.1E_0.1D",
    "modis": {
      "daily_counts": [2, 1, 3, 0, 2],
      "daily_frp": [24.6, 12.1, 31.0, 0, 20.5],
      "platform": "Terra + Aqua",
      "spatial_resolution_km": 1.0
    },
    "viirs": {
      "daily_counts": [9, 7, 11, 2, 8],
      "daily_frp": [42.1, 35.0, 55.3, 8.2, 38.9],
      "platforms": ["Suomi-NPP", "NOAA-20", "NOAA-21"],
      "spatial_resolution_m": 375
    },
    "harmonized": {
      "hai_scores": [0.342, 0.280, 0.411, 0.035, 0.310],
      "methodology_version": "1.0.0",
      "is_experimental": true,
      "disclaimer": "HAI is a FireDNA prototype metric, not an official NASA product."
    },
    "dates": ["2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10"]
  }
}
```

---

#### `GET /harmonization/validation`
Spatial and temporal agreement metrics between MODIS and VIIRS.

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "spatial_agreement": {
      "cells_with_both_sensors": 234,
      "cells_modis_only": 45,
      "cells_viirs_only": 123,
      "overlap_fraction": 0.56,
      "note": "Computed over harmonized grid for selected period"
    },
    "temporal_agreement": {
      "same_day_co_detection_fraction": 0.63,
      "note": "Fraction of MODIS detections with same-day VIIRS detection in same cell"
    },
    "frp_correlation": {
      "pearson_r": 0.71,
      "p_value": 0.001,
      "n_paired_cells": 234,
      "note": "Correlation between MODIS and VIIRS FRP in co-detection cells"
    },
    "disclaimer": "These are descriptive statistics on the available dataset. They do not constitute a formal sensor calibration or validation study."
  }
}
```

---

#### `GET /harmonization/methodology`
Return the full documented methodology in structured JSON.

**Response (200):** Complete methodology object with version, parameters, formulas, and disclaimers.

---

### 2.4 Analytics Endpoints

#### `GET /analytics/daily`
Daily fire activity time series.

**Query params:** `bbox`, `start_date`, `end_date`, `sensor`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "series": [
      {
        "date": "2026-11-01",
        "modis_count": 45,
        "viirs_count": 123,
        "total_frp_modis": 456.7,
        "total_frp_viirs": 789.0,
        "hai_mean": 0.23
      }
    ],
    "summary": {
      "peak_date": "2026-11-05",
      "peak_count": 234,
      "mean_daily_count": 89.4
    }
  }
}
```

---

#### `GET /analytics/monthly`
Monthly aggregated statistics.

**Query params:** `bbox`, `year`, `sensor`

---

#### `GET /analytics/yearly`
Yearly aggregated statistics.

**Query params:** `bbox`, `start_year`, `end_year`, `sensor`

---

#### `GET /analytics/seasonal`
Seasonal breakdown (DJF, MAM, JJA, SON).

**Query params:** `bbox`, `start_year`, `end_year`, `sensor`

**Response includes:** Per-season mean, std, max, min counts.

---

### 2.5 Anomaly Endpoints

#### `GET /anomalies`
List detected anomalies with filtering.

**Query params:** `bbox`, `start_date`, `end_date`, `min_z_score`, `level`, `page`, `page_size`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "anomalies": [
      {
        "id": 789,
        "obs_date": "2026-11-08",
        "grid_cell_id": "G_23.4N_90.1E_0.1D",
        "z_score": 3.8,
        "historical_percentile": 97.2,
        "anomaly_level": "extreme",
        "anomaly_label": "Extremely unusual fire activity",
        "observed_count": 18,
        "baseline_mean_count": 2.3,
        "baseline_std_count": 1.1,
        "has_sufficient_baseline": true,
        "disclaimer": "Unusual activity does not confirm a dangerous wildfire. Verify with ground truth sources."
      }
    ]
  }
}
```

---

#### `GET /anomalies/{id}`
Get single anomaly with full component breakdown.

---

#### `POST /anomalies/detect`
Trigger anomaly detection for a date range.

**Authentication:** API key header required  
**Request Body:** `{ "start_date": "...", "end_date": "...", "bbox": {...} }`

---

#### `GET /anomalies/summary`
Summary statistics for anomaly dashboard.

**Response (200):**
```json
{
  "data": {
    "total_anomalies_7d": 12,
    "extreme_anomalies_7d": 2,
    "top_anomaly": { ... },
    "anomaly_level_distribution": {
      "normal": 1200,
      "elevated": 45,
      "high": 12,
      "extreme": 3
    }
  }
}
```

---

### 2.6 Export Endpoints

#### `GET /export/hotspots.csv`
Download hotspot observations as CSV.

**Query params:** `bbox`, `start_date`, `end_date`, `sensor`  
**Response:** `Content-Type: text/csv; charset=utf-8`  
**Headers:** `Content-Disposition: attachment; filename="firedna_hotspots_YYYYMMDD.csv"`

**CSV Columns:**
`id, instrument, satellite_platform, source_product, latitude, longitude, acq_date, acq_time, brightness, frp, confidence_raw, confidence_category, daynight, is_demo_data, nasa_firms_attribution`

Last column always includes attribution: `"NASA FIRMS (https://firms.modaps.eosdis.nasa.gov/)"`.

---

#### `GET /export/hotspots.geojson`
Download hotspots as GeoJSON file.

**Response:** `Content-Type: application/geo+json`

---

#### `GET /export/analytics.csv`
Download daily analytics as CSV.

**Query params:** `bbox`, `start_date`, `end_date`, `sensor`

---

## 3. Health and Info Endpoints

#### `GET /health`
System health check.
```json
{ "status": "healthy", "database": "connected", "demo_mode": false, "version": "1.0.0" }
```

#### `GET /info`
Application metadata.
```json
{
  "name": "FireDNA API",
  "version": "1.0.0",
  "description": "NASA FIRMS fire hotspot analytics API",
  "firms_products_supported": ["MODIS_NRT", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"],
  "data_attribution": "NASA FIRMS — Fire Information for Resource Management System",
  "demo_mode": false
}
```

---

## 4. Example cURL Requests

```bash
# Get Bangladesh hotspots (last 7 days, all sensors)
curl "http://localhost:8000/api/v1/hotspots/geojson?bbox=20.5,88.0,26.7,92.7&start_date=2026-11-03&end_date=2026-11-10"

# Trigger ingestion for Bangladesh
curl -X POST "http://localhost:8000/api/v1/ingestion/run" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your-admin-key" \
  -d '{"products":["MODIS_NRT","VIIRS_SNPP_NRT"],"bbox":{"min_lat":20.5,"min_lon":88.0,"max_lat":26.7,"max_lon":92.7},"start_date":"2026-11-01","end_date":"2026-11-10","region_name":"Bangladesh"}'

# Get daily analytics
curl "http://localhost:8000/api/v1/analytics/daily?bbox=20.5,88.0,26.7,92.7&start_date=2026-11-01&end_date=2026-11-10"

# Get anomalies (extreme only)
curl "http://localhost:8000/api/v1/anomalies?bbox=20.5,88.0,26.7,92.7&min_z_score=3.5&level=extreme"

# Download CSV export
curl -o hotspots.csv "http://localhost:8000/api/v1/export/hotspots.csv?bbox=20.5,88.0,26.7,92.7&start_date=2026-11-01&end_date=2026-11-10"

# Check health
curl "http://localhost:8000/api/v1/health"
```

---

## 5. Rate Limiting

| Endpoint Group | Rate Limit | Window |
|---|---|---|
| Ingestion trigger | 5 requests | 1 hour |
| Hotspots GeoJSON | 60 requests | 1 minute |
| Analytics | 60 requests | 1 minute |
| Exports | 10 requests | 1 minute |
| Health check | Unlimited | — |

---

*Document version 1.0.0 — FireDNA API Design*
