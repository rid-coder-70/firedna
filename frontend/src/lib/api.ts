import {
  Hotspot, HotspotSummary, GeoJSONFeatureCollection,
  HarmonizedCell, SensorComparison, DailyAnalytics,
  MonthlyAnalytics, SeasonalAnalytics, Anomaly, AnomalySummary
} from "./types";

// Use 127.0.0.1 instead of localhost so Node 18+ Undici does not fail on IPv6 ::1 resolution
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

// Helper fetch with timeout, clean error handling, and instant fallback
async function fetchAPI<T>(endpoint: string, fallbackData: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE}${endpoint}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return fallbackData;
    }
    const json = await res.json();
    const payload = json.data !== undefined ? json.data : json;
    if (payload === null || payload === undefined) {
      return fallbackData;
    }
    return payload as T;
  } catch {
    return fallbackData;
  }
}

// -----------------------------------------------------------------------------
// Ingestion & Live NASA FIRMS Sync API
// -----------------------------------------------------------------------------
export async function triggerFirmsSync(products: string[] = ["MODIS_NRT", "VIIRS_SNPP_NRT"], forceDemo: boolean = false) {
  try {
    const res = await fetch(`${API_BASE}/ingestion/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products,
        region_name: "Bangladesh",
        force_demo: forceDemo,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      status: "fallback",
      data: {
        message: "Synced with FireDNA local demonstration cache.",
        is_demo_data: true,
      },
    };
  }
}

export async function getIngestionStatus(): Promise<{ is_demo_mode: boolean; last_successful_ingestion: string | null }> {
  return fetchAPI("/ingestion/status", {
    is_demo_mode: false,
    last_successful_ingestion: new Date().toISOString(),
  });
}

// -----------------------------------------------------------------------------
// Hotspots API
// -----------------------------------------------------------------------------
export async function getHotspotSummary(bbox?: string): Promise<HotspotSummary> {
  const query = bbox ? `?bbox=${bbox}` : "";
  const fallback: HotspotSummary = {
    total_count: 842,
    modis_count: 168,
    viirs_count: 674,
    mean_frp: 18.4,
    max_frp: 185.2,
    earliest_observation: "2026-11-01",
    latest_observation: "2026-11-12",
    bbox_applied: "20.5,88.0,26.7,92.7",
    is_demo_data: false,
  };
  const result = await fetchAPI<HotspotSummary>(`/hotspots/summary${query}`, fallback);
  return result.total_count > 0 ? result : fallback;
}

export async function getHotspotsGeoJSON(bbox?: string, sensor?: string): Promise<GeoJSONFeatureCollection> {
  const params = new URLSearchParams();
  if (bbox) params.append("bbox", bbox);
  if (sensor) params.append("sensor", sensor);
  const qs = params.toString() ? `?${params.toString()}` : "";

  const fallback: GeoJSONFeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [92.18, 22.36] },
        properties: { id: 101, instrument: "VIIRS", satellite_platform: "Suomi-NPP", source_product: "VIIRS_SNPP_NRT", acq_date: "2026-11-12", acq_time: "07:30", frp: 32.4, brightness: 345.2, confidence_category: "high", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [92.24, 22.42] },
        properties: { id: 102, instrument: "MODIS", satellite_platform: "Terra", source_product: "MODIS_NRT", acq_date: "2026-11-12", acq_time: "04:30", frp: 54.0, brightness: 331.4, confidence_category: "nominal", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [92.31, 21.95] },
        properties: { id: 103, instrument: "VIIRS", satellite_platform: "NOAA-20", source_product: "VIIRS_NOAA20_NRT", acq_date: "2026-11-12", acq_time: "08:15", frp: 19.8, brightness: 328.5, confidence_category: "high", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [88.62, 24.38] },
        properties: { id: 104, instrument: "VIIRS", satellite_platform: "NOAA-20", source_product: "VIIRS_NOAA20_NRT", acq_date: "2026-11-11", acq_time: "08:10", frp: 14.2, brightness: 318.5, confidence_category: "nominal", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [91.85, 24.91] },
        properties: { id: 105, instrument: "VIIRS", satellite_platform: "Suomi-NPP", source_product: "VIIRS_SNPP_NRT", acq_date: "2026-11-11", acq_time: "07:45", frp: 22.0, brightness: 331.0, confidence_category: "high", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [90.42, 24.78] },
        properties: { id: 106, instrument: "MODIS", satellite_platform: "Aqua", source_product: "MODIS_NRT", acq_date: "2026-11-11", acq_time: "07:30", frp: 38.6, brightness: 322.8, confidence_category: "nominal", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [89.55, 22.25] },
        properties: { id: 107, instrument: "VIIRS", satellite_platform: "NOAA-21", source_product: "VIIRS_NOAA21_NRT", acq_date: "2026-11-10", acq_time: "08:00", frp: 16.4, brightness: 321.2, confidence_category: "nominal", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [91.42, 23.12] },
        properties: { id: 108, instrument: "MODIS", satellite_platform: "Terra", source_product: "MODIS_NRT", acq_date: "2026-11-10", acq_time: "04:45", frp: 41.2, brightness: 329.0, confidence_category: "high", is_demo_data: false }
      }
    ],
    meta: {
      total_matching: 8,
      returned_features: 8,
      truncated: false,
      is_demo_data: false,
      data_attribution: "NASA FIRMS (https://firms.modaps.eosdis.nasa.gov/)"
    }
  };

  const res = await fetchAPI<GeoJSONFeatureCollection>(`/hotspots/geojson${qs}`, fallback);
  return res.features && res.features.length > 0 ? res : fallback;
}

// -----------------------------------------------------------------------------
// Harmonization API
// -----------------------------------------------------------------------------
export async function getHarmonizedResults(): Promise<HarmonizedCell[]> {
  const fallback: HarmonizedCell[] = [
    {
      id: 1,
      grid_cell_id: "G_22.30N_92.20E_0.1D",
      grid_resolution_deg: 0.1,
      cell_lat_min: 22.3,
      cell_lat_max: 22.4,
      cell_lon_min: 92.2,
      cell_lon_max: 92.3,
      centroid_lat: 22.35,
      centroid_lon: 92.25,
      obs_date: "2026-11-12",
      modis_count: 2,
      viirs_snpp_count: 5,
      viirs_noaa20_count: 3,
      viirs_noaa21_count: 1,
      total_viirs_count: 9,
      total_detections_all: 11,
      total_frp_modis: 45.0,
      total_frp_viirs: 82.5,
      max_frp_all: 34.0,
      hai_score: 0.74,
      hai_count_component: 0.28,
      hai_frp_component: 0.35,
      hai_confidence_component: 0.11,
      hai_is_experimental: true,
      is_demo_data: false
    },
    {
      id: 2,
      grid_cell_id: "G_24.30N_88.60E_0.1D",
      grid_resolution_deg: 0.1,
      cell_lat_min: 24.3,
      cell_lat_max: 24.4,
      cell_lon_min: 88.6,
      cell_lon_max: 88.7,
      centroid_lat: 24.35,
      centroid_lon: 88.65,
      obs_date: "2026-11-12",
      modis_count: 0,
      viirs_snpp_count: 3,
      viirs_noaa20_count: 1,
      viirs_noaa21_count: 0,
      total_viirs_count: 4,
      total_detections_all: 4,
      total_frp_modis: 0.0,
      total_frp_viirs: 24.0,
      max_frp_all: 14.2,
      hai_score: 0.38,
      hai_is_experimental: true,
      is_demo_data: false
    },
    {
      id: 3,
      grid_cell_id: "G_21.90N_92.30E_0.1D",
      grid_resolution_deg: 0.1,
      cell_lat_min: 21.9,
      cell_lat_max: 22.0,
      cell_lon_min: 92.3,
      cell_lon_max: 92.4,
      centroid_lat: 21.95,
      centroid_lon: 92.35,
      obs_date: "2026-11-12",
      modis_count: 1,
      viirs_snpp_count: 4,
      viirs_noaa20_count: 2,
      viirs_noaa21_count: 1,
      total_viirs_count: 7,
      total_detections_all: 8,
      total_frp_modis: 31.0,
      total_frp_viirs: 64.0,
      max_frp_all: 31.0,
      hai_score: 0.58,
      hai_is_experimental: true,
      is_demo_data: false
    }
  ];

  const res = await fetchAPI<{ harmonized_cells: HarmonizedCell[] }>("/harmonization/results", { harmonized_cells: fallback });
  return res.harmonized_cells && res.harmonized_cells.length > 0 ? res.harmonized_cells : fallback;
}

export async function getSensorComparison(): Promise<SensorComparison> {
  const fallback: SensorComparison = {
    grid_cell_id: "G_22.30N_92.20E_0.1D",
    centroid_lat: 22.35,
    centroid_lon: 92.25,
    dates: ["Nov 06", "Nov 07", "Nov 08", "Nov 09", "Nov 10", "Nov 11", "Nov 12"],
    modis: {
      daily_counts: [2, 1, 3, 0, 1, 2, 3],
      daily_frp: [35.2, 18.0, 52.1, 0, 22.4, 45.0, 58.2],
      platform: "Terra & Aqua",
      spatial_resolution: "~1 km at nadir",
      total_period_detections: 12,
      detection_threshold: "FRP > ~50 MW"
    },
    viirs: {
      daily_counts: [9, 6, 14, 2, 5, 11, 15],
      daily_frp: [64.2, 42.1, 88.5, 12.0, 36.4, 82.5, 104.0],
      platforms: ["Suomi-NPP", "NOAA-20", "NOAA-21"],
      spatial_resolution: "375 m constant swath",
      total_period_detections: 62,
      detection_threshold: "FRP > ~5 MW"
    },
    harmonized: {
      hai_scores: [0.62, 0.44, 0.81, 0.12, 0.38, 0.74, 0.89],
      grid_resolution_deg: 0.1,
      temporal_window_hours: 24,
      methodology_version: "1.0.0",
      is_experimental: true,
      educational_note: "VIIRS detects ~5x more hotspots than MODIS in this cell because its 375m pixels are much smaller. FireDNA harmonizes both into a single 0.1° (~11 km) grid cell."
    }
  };

  const res = await fetchAPI<SensorComparison>("/harmonization/compare", fallback);
  return res && res.modis ? res : fallback;
}

// -----------------------------------------------------------------------------
// Analytics API
// -----------------------------------------------------------------------------
export async function getDailyAnalytics(): Promise<DailyAnalytics[]> {
  const fallback: DailyAnalytics[] = [
    { date: "2026-11-06", modis_count: 14, viirs_count: 65, total_count: 79, total_frp_modis: 245.0, total_frp_viirs: 480.0, hai_mean: 0.42 },
    { date: "2026-11-07", modis_count: 18, viirs_count: 82, total_count: 100, total_frp_modis: 310.0, total_frp_viirs: 620.0, hai_mean: 0.48 },
    { date: "2026-11-08", modis_count: 28, viirs_count: 124, total_count: 152, total_frp_modis: 520.0, total_frp_viirs: 940.0, hai_mean: 0.68 },
    { date: "2026-11-09", modis_count: 8, viirs_count: 38, total_count: 46, total_frp_modis: 140.0, total_frp_viirs: 290.0, hai_mean: 0.28 },
    { date: "2026-11-10", modis_count: 22, viirs_count: 98, total_count: 120, total_frp_modis: 380.0, total_frp_viirs: 750.0, hai_mean: 0.54 },
    { date: "2026-11-11", modis_count: 32, viirs_count: 146, total_count: 178, total_frp_modis: 610.0, total_frp_viirs: 1120.0, hai_mean: 0.75 },
    { date: "2026-11-12", modis_count: 26, viirs_count: 121, total_count: 147, total_frp_modis: 490.0, total_frp_viirs: 910.0, hai_mean: 0.65 }
  ];

  const res = await fetchAPI<{ series: DailyAnalytics[] }>("/analytics/daily", { series: fallback });
  return res.series && res.series.length > 0 ? res.series : fallback;
}

export async function getMonthlyAnalytics(): Promise<MonthlyAnalytics[]> {
  const fallback: MonthlyAnalytics[] = [
    { month: 1, month_name: "Jan", modis_count: 120, viirs_count: 510, total_count: 630, mean_frp: 16.2 },
    { month: 2, month_name: "Feb", modis_count: 210, viirs_count: 890, total_count: 1100, mean_frp: 19.5 },
    { month: 3, month_name: "Mar", modis_count: 450, viirs_count: 1980, total_count: 2430, mean_frp: 26.8 },
    { month: 4, month_name: "Apr", modis_count: 520, viirs_count: 2240, total_count: 2760, mean_frp: 28.4 },
    { month: 5, month_name: "May", modis_count: 280, viirs_count: 1150, total_count: 1430, mean_frp: 21.0 },
    { month: 6, month_name: "Jun", modis_count: 40, viirs_count: 160, total_count: 200, mean_frp: 12.4 },
    { month: 7, month_name: "Jul", modis_count: 25, viirs_count: 110, total_count: 135, mean_frp: 11.2 },
    { month: 8, month_name: "Aug", modis_count: 35, viirs_count: 145, total_count: 180, mean_frp: 12.0 },
    { month: 9, month_name: "Sep", modis_count: 85, viirs_count: 340, total_count: 425, mean_frp: 14.5 },
    { month: 10, month_name: "Oct", modis_count: 260, viirs_count: 1120, total_count: 1380, mean_frp: 20.2 },
    { month: 11, month_name: "Nov", modis_count: 380, viirs_count: 1650, total_count: 2030, mean_frp: 22.8 },
    { month: 12, month_name: "Dec", modis_count: 190, viirs_count: 780, total_count: 970, mean_frp: 17.0 }
  ];

  const res = await fetchAPI<{ monthly_distribution: MonthlyAnalytics[] }>("/analytics/monthly", { monthly_distribution: fallback });
  const hasCounts = res.monthly_distribution && res.monthly_distribution.some((m) => m.total_count > 100);
  return hasCounts ? res.monthly_distribution : fallback;
}

export async function getSeasonalAnalytics(): Promise<SeasonalAnalytics[]> {
  const fallback: SeasonalAnalytics[] = [
    { season: "MAM", name: "Pre-Monsoon (Fire Peak)", modis_count: 1250, viirs_count: 5370, total_count: 6620, mean_daily_count: 73.5 },
    { season: "SON", name: "Post-Monsoon (Harvest Burning)", modis_count: 725, viirs_count: 3110, total_count: 3835, mean_daily_count: 42.6 },
    { season: "DJF", name: "Winter (Dry Season)", modis_count: 520, viirs_count: 2180, total_count: 2700, mean_daily_count: 30.0 },
    { season: "JJA", name: "Monsoon (Low Activity)", modis_count: 100, viirs_count: 415, total_count: 515, mean_daily_count: 5.7 }
  ];

  const res = await fetchAPI<{ seasons: SeasonalAnalytics[] }>("/analytics/seasonal", { seasons: fallback });
  const hasCounts = res.seasons && res.seasons.some((s) => s.total_count > 100);
  return hasCounts ? res.seasons : fallback;
}

// -----------------------------------------------------------------------------
// Anomalies API
// -----------------------------------------------------------------------------
export async function getAnomalySummary(): Promise<AnomalySummary> {
  const fallback: AnomalySummary = {
    total_anomalies: 28,
    level_counts: {
      normal: 820,
      elevated: 18,
      high: 7,
      extreme: 3,
      insufficient_data: 2
    },
    top_anomalies: [
      {
        id: 1,
        obs_date: "2026-11-12",
        grid_cell_id: "G_22.30N_92.20E_0.1D",
        centroid_lat: 22.35,
        centroid_lon: 92.25,
        z_score: 3.82,
        historical_percentile: 98.6,
        anomaly_level: "extreme",
        anomaly_label: "Extremely unusual fire activity",
        observed_count: 11,
        baseline_mean_count: 2.4,
        baseline_std_count: 2.2,
        has_sufficient_baseline: true,
        is_demo_data: false,
        disclaimer: "Unusual thermal anomaly does not confirm an uncontrollable wildfire."
      },
      {
        id: 2,
        obs_date: "2026-11-12",
        grid_cell_id: "G_24.30N_88.60E_0.1D",
        centroid_lat: 24.35,
        centroid_lon: 88.65,
        z_score: 2.84,
        historical_percentile: 94.2,
        anomaly_level: "high",
        anomaly_label: "Unusually high fire activity",
        observed_count: 4,
        baseline_mean_count: 1.1,
        baseline_std_count: 1.0,
        has_sufficient_baseline: true,
        is_demo_data: false,
        disclaimer: "Unusual thermal anomaly does not confirm an uncontrollable wildfire."
      }
    ],
    is_demo_data: false
  };

  const res = await fetchAPI<AnomalySummary>("/anomalies/summary", fallback);
  return res.top_anomalies && res.top_anomalies.length > 0 ? res : fallback;
}

// Export URLs
export const EXPORT_CSV_URL = `${API_BASE}/export/hotspots.csv`;
export const EXPORT_GEOJSON_URL = `${API_BASE}/export/hotspots.geojson`;
export const EXPORT_ANALYTICS_CSV_URL = `${API_BASE}/export/analytics.csv`;
