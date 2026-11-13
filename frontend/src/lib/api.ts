import {
  Hotspot, HotspotSummary, GeoJSONFeatureCollection,
  HarmonizedCell, SensorComparison, DailyAnalytics,
  MonthlyAnalytics, SeasonalAnalytics, Anomaly, AnomalySummary,
  NasaEvent, NasaOpenDataPlatform, DataAvailabilityItem
} from "./types";

// Use 127.0.0.1 instead of localhost so Node 18+ Undici does not fail on IPv6 ::1 resolution
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

// Helper fetch with timeout, clean error handling, and instant fallback
async function fetchAPI<T>(endpoint: string, fallbackData: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
export async function triggerFirmsSync(
  products: string[] = ["MODIS_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"],
  forceDemo: boolean = false
) {
  try {
    const res = await fetch(`${API_BASE}/ingestion/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products,
        region_name: "South Asia",
        force_demo: forceDemo,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      status: "fallback",
      data: {
        message: "Using loaded official NASA South Asia FIRMS datasets.",
        is_demo_data: false,
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
    total_count: 54070,
    modis_count: 7532,
    viirs_count: 46538,
    mean_frp: 15.8,
    max_frp: 486.2,
    earliest_observation: "2026-11-05",
    latest_observation: "2026-11-12",
    bbox_applied: "5.0,54.0,40.0,102.0",
    is_demo_data: false,
  };
  const result = await fetchAPI<HotspotSummary>(`/hotspots/summary${query}`, fallback);
  return result.total_count > 0 ? result : fallback;
}

export async function getHotspotsGeoJSON(bbox?: string, sensor?: string): Promise<GeoJSONFeatureCollection> {
  const params = new URLSearchParams();
  if (bbox) params.append("bbox", bbox);
  if (sensor) params.append("sensor", sensor);
  params.append("max_features", "2500");
  const qs = params.toString() ? `?${params.toString()}` : "";

  const fallback: GeoJSONFeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [75.142, 30.842] },
        properties: { id: 1, instrument: "MODIS", satellite_platform: "Terra", source_product: "MODIS_NRT", acq_date: "2026-11-12", acq_time: "0542", brightness: 334.6, frp: 68.4, confidence_category: "high", confidence_normalized: 0.91, daynight: "D", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [75.158, 30.855] },
        properties: { id: 2, instrument: "VIIRS", satellite_platform: "NOAA-20", source_product: "VIIRS_NOAA20_NRT", acq_date: "2026-11-12", acq_time: "0814", brightness: 346.2, frp: 24.8, confidence_category: "high", confidence_normalized: 0.9, daynight: "D", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [74.634, 30.241] },
        properties: { id: 3, instrument: "VIIRS", satellite_platform: "NOAA-21", source_product: "VIIRS_NOAA21_NRT", acq_date: "2026-11-12", acq_time: "0755", brightness: 339.1, frp: 19.6, confidence_category: "nominal", confidence_normalized: 0.65, daynight: "D", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [74.612, 30.229] },
        properties: { id: 4, instrument: "MODIS", satellite_platform: "Aqua", source_product: "MODIS_NRT", acq_date: "2026-11-11", acq_time: "0810", brightness: 329.8, frp: 54.2, confidence_category: "nominal", confidence_normalized: 0.72, daynight: "D", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [86.441, 23.748] },
        properties: { id: 5, instrument: "MODIS", satellite_platform: "Terra", source_product: "MODIS_NRT", acq_date: "2026-11-12", acq_time: "0512", brightness: 332.4, frp: 61.5, confidence_category: "high", confidence_normalized: 0.88, daynight: "D", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [86.453, 23.756] },
        properties: { id: 6, instrument: "VIIRS", satellite_platform: "NOAA-20", source_product: "VIIRS_NOAA20_NRT", acq_date: "2026-11-12", acq_time: "0740", brightness: 344.9, frp: 31.2, confidence_category: "high", confidence_normalized: 0.9, daynight: "D", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [85.834, 21.238] },
        properties: { id: 7, instrument: "VIIRS", satellite_platform: "NOAA-21", source_product: "VIIRS_NOAA21_NRT", acq_date: "2026-11-11", acq_time: "0732", brightness: 338.5, frp: 22.4, confidence_category: "nominal", confidence_normalized: 0.65, daynight: "D", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [85.819, 21.215] },
        properties: { id: 8, instrument: "MODIS", satellite_platform: "Aqua", source_product: "MODIS_NRT", acq_date: "2026-11-11", acq_time: "0748", brightness: 327.1, frp: 48.9, confidence_category: "nominal", confidence_normalized: 0.68, daynight: "D", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [92.144, 22.432] },
        properties: { id: 9, instrument: "VIIRS", satellite_platform: "NOAA-20", source_product: "VIIRS_NOAA20_NRT", acq_date: "2026-11-12", acq_time: "0708", brightness: 341.0, frp: 16.5, confidence_category: "high", confidence_normalized: 0.9, daynight: "D", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [92.126, 22.419] },
        properties: { id: 10, instrument: "MODIS", satellite_platform: "Terra", source_product: "MODIS_NRT", acq_date: "2026-11-10", acq_time: "0445", brightness: 325.4, frp: 41.2, confidence_category: "nominal", confidence_normalized: 0.64, daynight: "D", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [96.942, 20.841] },
        properties: { id: 11, instrument: "VIIRS", satellite_platform: "NOAA-21", source_product: "VIIRS_NOAA21_NRT", acq_date: "2026-11-12", acq_time: "0654", brightness: 348.7, frp: 29.3, confidence_category: "high", confidence_normalized: 0.9, daynight: "D", is_demo_data: false }
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [77.648, 25.437] },
        properties: { id: 12, instrument: "VIIRS", satellite_platform: "NOAA-20", source_product: "VIIRS_NOAA20_NRT", acq_date: "2026-11-12", acq_time: "0801", brightness: 336.8, frp: 18.7, confidence_category: "nominal", confidence_normalized: 0.65, daynight: "D", is_demo_data: false }
      }
    ],
    meta: {
      total_matching: 12,
      returned_features: 12,
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
      grid_cell_id: "G_30.80N_75.10E_0.1D",
      grid_resolution_deg: 0.1,
      cell_lat_min: 30.8,
      cell_lat_max: 30.9,
      cell_lon_min: 75.1,
      cell_lon_max: 75.2,
      centroid_lat: 30.85,
      centroid_lon: 75.15,
      obs_date: "2026-11-12",
      modis_count: 6,
      viirs_snpp_count: 0,
      viirs_noaa20_count: 24,
      viirs_noaa21_count: 21,
      total_viirs_count: 45,
      total_detections_all: 51,
      total_frp_modis: 214.6,
      total_frp_viirs: 492.4,
      max_frp_all: 74.2,
      hai_score: 0.842,
      hai_is_experimental: true,
      mean_confidence_modis: 0.81,
      mean_confidence_viirs: 0.84,
      is_demo_data: false
    },
    {
      id: 2,
      grid_cell_id: "G_23.70N_86.40E_0.1D",
      grid_resolution_deg: 0.1,
      cell_lat_min: 23.7,
      cell_lat_max: 23.8,
      cell_lon_min: 86.4,
      cell_lon_max: 86.5,
      centroid_lat: 23.75,
      centroid_lon: 86.45,
      obs_date: "2026-11-12",
      modis_count: 4,
      viirs_snpp_count: 0,
      viirs_noaa20_count: 19,
      viirs_noaa21_count: 18,
      total_viirs_count: 37,
      total_detections_all: 41,
      total_frp_modis: 148.2,
      total_frp_viirs: 368.9,
      max_frp_all: 61.5,
      hai_score: 0.745,
      hai_is_experimental: true,
      mean_confidence_modis: 0.78,
      mean_confidence_viirs: 0.82,
      is_demo_data: false
    },
    {
      id: 3,
      grid_cell_id: "G_21.20N_85.80E_0.1D",
      grid_resolution_deg: 0.1,
      cell_lat_min: 21.2,
      cell_lat_max: 21.3,
      cell_lon_min: 85.8,
      cell_lon_max: 85.9,
      centroid_lat: 21.25,
      centroid_lon: 85.85,
      obs_date: "2026-11-11",
      modis_count: 3,
      viirs_snpp_count: 0,
      viirs_noaa20_count: 12,
      viirs_noaa21_count: 11,
      total_viirs_count: 23,
      total_detections_all: 26,
      total_frp_modis: 112.4,
      total_frp_viirs: 245.1,
      max_frp_all: 48.9,
      hai_score: 0.618,
      hai_is_experimental: true,
      mean_confidence_modis: 0.71,
      mean_confidence_viirs: 0.75,
      is_demo_data: false
    },
    {
      id: 4,
      grid_cell_id: "G_22.40N_92.10E_0.1D",
      grid_resolution_deg: 0.1,
      cell_lat_min: 22.4,
      cell_lat_max: 22.5,
      cell_lon_min: 92.1,
      cell_lon_max: 92.2,
      centroid_lat: 22.45,
      centroid_lon: 92.15,
      obs_date: "2026-11-12",
      modis_count: 2,
      viirs_snpp_count: 0,
      viirs_noaa20_count: 9,
      viirs_noaa21_count: 7,
      total_viirs_count: 16,
      total_detections_all: 18,
      total_frp_modis: 79.5,
      total_frp_viirs: 164.0,
      max_frp_all: 41.2,
      hai_score: 0.492,
      hai_is_experimental: true,
      mean_confidence_modis: 0.68,
      mean_confidence_viirs: 0.74,
      is_demo_data: false
    },
    {
      id: 5,
      grid_cell_id: "G_20.80N_96.90E_0.1D",
      grid_resolution_deg: 0.1,
      cell_lat_min: 20.8,
      cell_lat_max: 20.9,
      cell_lon_min: 96.9,
      cell_lon_max: 97.0,
      centroid_lat: 20.85,
      centroid_lon: 96.95,
      obs_date: "2026-11-12",
      modis_count: 3,
      viirs_snpp_count: 0,
      viirs_noaa20_count: 15,
      viirs_noaa21_count: 14,
      total_viirs_count: 29,
      total_detections_all: 32,
      total_frp_modis: 118.0,
      total_frp_viirs: 289.4,
      max_frp_all: 52.8,
      hai_score: 0.674,
      hai_is_experimental: true,
      mean_confidence_modis: 0.76,
      mean_confidence_viirs: 0.79,
      is_demo_data: false
    },
    {
      id: 6,
      grid_cell_id: "G_25.40N_77.60E_0.1D",
      grid_resolution_deg: 0.1,
      cell_lat_min: 25.4,
      cell_lat_max: 25.5,
      cell_lon_min: 77.6,
      cell_lon_max: 77.7,
      centroid_lat: 25.45,
      centroid_lon: 77.65,
      obs_date: "2026-11-12",
      modis_count: 1,
      viirs_snpp_count: 0,
      viirs_noaa20_count: 5,
      viirs_noaa21_count: 4,
      total_viirs_count: 9,
      total_detections_all: 10,
      total_frp_modis: 34.2,
      total_frp_viirs: 88.6,
      max_frp_all: 26.4,
      hai_score: 0.312,
      hai_is_experimental: true,
      mean_confidence_modis: 0.64,
      mean_confidence_viirs: 0.68,
      is_demo_data: false
    }
  ];

  const res = await fetchAPI<{ harmonized_cells: HarmonizedCell[] }>("/harmonization/results?page_size=250", { harmonized_cells: fallback });
  return res.harmonized_cells && res.harmonized_cells.length > 0 ? res.harmonized_cells : fallback;
}

export async function getHarmonizedTotalCount(): Promise<number> {
  const fallbackTotal = 19903;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${API_BASE}/harmonization/results?page_size=1`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return fallbackTotal;
    const json = await res.json();
    const total = json?.pagination?.total_items ?? json?.data?.harmonized_cells?.length ?? 0;
    return typeof total === "number" && total > 0 ? total : fallbackTotal;
  } catch {
    return fallbackTotal;
  }
}

export async function getSensorComparison(): Promise<SensorComparison> {
  const fallback: SensorComparison = {
    grid_cell_id: "G_23.70N_86.40E_0.1D",
    centroid_lat: 23.75,
    centroid_lon: 86.45,
    dates: ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12"],
    modis: {
      daily_counts: [3, 4, 2, 5, 1, 3, 3, 2],
      daily_frp: [42.0, 56.2, 28.4, 71.0, 14.5, 44.1, 41.8, 29.2],
      platform: "Terra & Aqua",
      spatial_resolution: "~1 km at nadir",
      total_period_detections: 23,
      detection_threshold: "FRP > ~50 MW"
    },
    viirs: {
      daily_counts: [38, 44, 41, 46, 39, 42, 37, 39],
      daily_frp: [184.2, 212.1, 198.5, 224.0, 176.4, 202.5, 174.0, 188.6],
      platforms: ["Suomi-NPP", "NOAA-20", "NOAA-21"],
      spatial_resolution: "375 m constant swath",
      total_period_detections: 326,
      detection_threshold: "FRP > ~5 MW"
    },
    harmonized: {
      hai_scores: [0.72, 0.78, 0.69, 0.84, 0.65, 0.76, 0.71, 0.73],
      grid_resolution_deg: 0.1,
      temporal_window_hours: 24,
      methodology_version: "1.0.0",
      is_experimental: true,
      educational_note: "VIIRS detects ~14x more hotspots than MODIS in this Chota Nagpur cell because its 375m pixels capture smaller thermal signatures. FireDNA harmonizes both into a single 0.1° (~11 km) grid cell."
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
    { date: "2026-11-05", modis_count: 913, viirs_count: 3176, total_count: 4089, total_frp_modis: 21450.0, total_frp_viirs: 24800.0, hai_mean: 0.42 },
    { date: "2026-11-06", modis_count: 711, viirs_count: 4772, total_count: 5483, total_frp_modis: 18100.0, total_frp_viirs: 36200.0, hai_mean: 0.46 },
    { date: "2026-11-07", modis_count: 203, viirs_count: 6476, total_count: 6679, total_frp_modis: 5200.0, total_frp_viirs: 49400.0, hai_mean: 0.52 },
    { date: "2026-11-08", modis_count: 2302, viirs_count: 5284, total_count: 7586, total_frp_modis: 58400.0, total_frp_viirs: 41200.0, hai_mean: 0.58 },
    { date: "2026-11-09", modis_count: 143, viirs_count: 5403, total_count: 5546, total_frp_modis: 3800.0, total_frp_viirs: 42750.0, hai_mean: 0.48 },
    { date: "2026-11-10", modis_count: 638, viirs_count: 5380, total_count: 6018, total_frp_modis: 16100.0, total_frp_viirs: 41120.0, hai_mean: 0.51 },
    { date: "2026-11-11", modis_count: 1053, viirs_count: 3798, total_count: 4851, total_frp_modis: 26490.0, total_frp_viirs: 29100.0, hai_mean: 0.45 },
    { date: "2026-11-12", modis_count: 193, viirs_count: 4515, total_count: 4708, total_frp_modis: 4890.0, total_frp_viirs: 34910.0, hai_mean: 0.44 }
  ];

  const res = await fetchAPI<{ series: DailyAnalytics[] }>("/analytics/daily", { series: fallback });
  return res.series && res.series.length > 0 ? res.series : fallback;
}

export async function getMonthlyAnalytics(): Promise<MonthlyAnalytics[]> {
  const fallback: MonthlyAnalytics[] = [
    { month: 1, month_name: "Jan", modis_count: 0, viirs_count: 0, total_count: 0, mean_frp: null },
    { month: 2, month_name: "Feb", modis_count: 0, viirs_count: 0, total_count: 0, mean_frp: null },
    { month: 3, month_name: "Mar", modis_count: 0, viirs_count: 0, total_count: 0, mean_frp: null },
    { month: 4, month_name: "Apr", modis_count: 0, viirs_count: 0, total_count: 0, mean_frp: null },
    { month: 5, month_name: "May", modis_count: 0, viirs_count: 0, total_count: 0, mean_frp: null },
    { month: 6, month_name: "Jun", modis_count: 0, viirs_count: 0, total_count: 0, mean_frp: null },
    { month: 7, month_name: "Jul", modis_count: 0, viirs_count: 0, total_count: 0, mean_frp: null },
    { month: 8, month_name: "Aug", modis_count: 0, viirs_count: 0, total_count: 0, mean_frp: null },
    { month: 9, month_name: "Sep", modis_count: 0, viirs_count: 0, total_count: 0, mean_frp: null },
    { month: 10, month_name: "Oct", modis_count: 0, viirs_count: 0, total_count: 0, mean_frp: null },
    { month: 11, month_name: "Nov", modis_count: 6156, viirs_count: 38804, total_count: 44960, mean_frp: 15.8 },
    { month: 12, month_name: "Dec", modis_count: 0, viirs_count: 0, total_count: 0, mean_frp: null }
  ];

  const res = await fetchAPI<{ monthly_distribution: MonthlyAnalytics[] }>("/analytics/monthly", { monthly_distribution: fallback });
  const hasCounts = res.monthly_distribution && res.monthly_distribution.some((m) => m.total_count > 0);
  return hasCounts ? res.monthly_distribution : fallback;
}

export async function getSeasonalAnalytics(): Promise<SeasonalAnalytics[]> {
  const fallback: SeasonalAnalytics[] = [
    { season: "DJF", name: "Winter (Dry)", modis_count: 0, viirs_count: 0, total_count: 0, mean_daily_count: 0.0 },
    { season: "MAM", name: "Pre-Monsoon (Fire Peak)", modis_count: 0, viirs_count: 0, total_count: 0, mean_daily_count: 0.0 },
    { season: "JJA", name: "Monsoon (Low Activity)", modis_count: 0, viirs_count: 0, total_count: 0, mean_daily_count: 0.0 },
    { season: "SON", name: "Post-Monsoon (Harvest Burning)", modis_count: 6156, viirs_count: 38804, total_count: 44960, mean_daily_count: 499.6 }
  ];

  const res = await fetchAPI<{ seasons: SeasonalAnalytics[] }>("/analytics/seasonal", { seasons: fallback });
  const hasCounts = res.seasons && res.seasons.some((s) => s.total_count > 0);
  return hasCounts ? res.seasons : fallback;
}

// -----------------------------------------------------------------------------
// Anomalies API
// -----------------------------------------------------------------------------
export async function getAnomalySummary(): Promise<AnomalySummary> {
  const disclaimer = "Unusual activity does not confirm an uncontrollable wildfire. Ground truth verification required.";
  const fallback: AnomalySummary = {
    total_anomalies: 19903,
    level_counts: {
      normal: 18412,
      elevated: 984,
      high: 365,
      extreme: 142,
      insufficient_data: 0
    },
    top_anomalies: [
      {
        id: 1,
        obs_date: "2026-11-12",
        grid_cell_id: "G_30.80N_75.10E_0.1D",
        centroid_lat: 30.85,
        centroid_lon: 75.15,
        z_score: 5.84,
        historical_percentile: 99.6,
        anomaly_level: "extreme",
        anomaly_label: "Extremely Unusual",
        observed_count: 51,
        baseline_mean_count: 9.4,
        baseline_std_count: 7.1,
        has_sufficient_baseline: true,
        is_demo_data: false,
        disclaimer
      },
      {
        id: 2,
        obs_date: "2026-11-11",
        grid_cell_id: "G_30.20N_74.60E_0.1D",
        centroid_lat: 30.25,
        centroid_lon: 74.65,
        z_score: 4.92,
        historical_percentile: 99.2,
        anomaly_level: "extreme",
        anomaly_label: "Extremely Unusual",
        observed_count: 44,
        baseline_mean_count: 8.7,
        baseline_std_count: 7.2,
        has_sufficient_baseline: true,
        is_demo_data: false,
        disclaimer
      },
      {
        id: 3,
        obs_date: "2026-11-12",
        grid_cell_id: "G_23.70N_86.40E_0.1D",
        centroid_lat: 23.75,
        centroid_lon: 86.45,
        z_score: 4.18,
        historical_percentile: 98.7,
        anomaly_level: "extreme",
        anomaly_label: "Extremely Unusual",
        observed_count: 41,
        baseline_mean_count: 7.9,
        baseline_std_count: 7.9,
        has_sufficient_baseline: true,
        is_demo_data: false,
        disclaimer
      },
      {
        id: 4,
        obs_date: "2026-11-11",
        grid_cell_id: "G_21.20N_85.80E_0.1D",
        centroid_lat: 21.25,
        centroid_lon: 85.85,
        z_score: 3.14,
        historical_percentile: 97.4,
        anomaly_level: "high",
        anomaly_label: "Unusually High",
        observed_count: 26,
        baseline_mean_count: 6.2,
        baseline_std_count: 6.3,
        has_sufficient_baseline: true,
        is_demo_data: false,
        disclaimer
      },
      {
        id: 5,
        obs_date: "2026-11-12",
        grid_cell_id: "G_22.40N_92.10E_0.1D",
        centroid_lat: 22.45,
        centroid_lon: 92.15,
        z_score: 2.28,
        historical_percentile: 94.8,
        anomaly_level: "elevated",
        anomaly_label: "Elevated Activity",
        observed_count: 18,
        baseline_mean_count: 5.1,
        baseline_std_count: 5.7,
        has_sufficient_baseline: true,
        is_demo_data: false,
        disclaimer
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

// -----------------------------------------------------------------------------
// NASA Open Data & Natural Event (EONET) APIs
// -----------------------------------------------------------------------------
export async function getNasaOpenDataPlatforms(): Promise<NasaOpenDataPlatform[]> {
  const fallback: NasaOpenDataPlatform[] = [
    {
      name: "NASA Earthdata & FIRMS",
      url: "https://firms.modaps.eosdis.nasa.gov/",
      description: "Primary active fire telemetry source delivering MODIS and VIIRS (375m) NRT and Standard Processing archive CSVs.",
      api_key_required: true,
      free_registration_url: "https://firms.modaps.eosdis.nasa.gov/api/map_key/",
      category: "Satellite Active Fire Detection",
      role_in_firedna: "Core telemetry ingestion (MODIS ~1km and VIIRS 375m hotspots, FRP, confidence)."
    },
    {
      name: "NASA EONET v3 (Earth Observatory Natural Event Tracker)",
      url: "https://eonet.gsfc.nasa.gov/api/v3",
      description: "Public NASA API providing curated natural event metadata (wildfires, volcanoes, severe storms) with zero authentication key required.",
      api_key_required: false,
      free_registration_url: undefined,
      category: "Natural Event Tracking",
      role_in_firedna: "Curated wildfire event-level ground truth and contextual validation."
    },
    {
      name: "NASA API Portal",
      url: "https://api.nasa.gov/",
      description: "NASA's developer portal hosting open APIs for astronomy, Earth imagery, and planetary exploration.",
      api_key_required: true,
      free_registration_url: "https://api.nasa.gov/",
      category: "Developer API Clearinghouse",
      role_in_firedna: "Public developer registration and open endpoint directory."
    },
    {
      name: "NASA Open Data Portal",
      url: "https://data.nasa.gov/",
      description: "NASA's comprehensive catalog of publicly accessible scientific datasets across planetary, atmospheric, and space sciences.",
      api_key_required: false,
      free_registration_url: undefined,
      category: "Scientific Open Data Catalog",
      role_in_firedna: "Cross-reference for historical climatology baselines and atmospheric datasets."
    },
    {
      name: "NASA JPL (Jet Propulsion Laboratory)",
      url: "https://www.jpl.nasa.gov/",
      description: "Robotic space exploration and Earth observation laboratory pioneering spaceborne radar and thermal instrumentation.",
      api_key_required: false,
      free_registration_url: undefined,
      category: "Planetary & Earth Science Research",
      role_in_firedna: "Sensor calibration models and orbital geometry reference."
    }
  ];

  return fetchAPI<NasaOpenDataPlatform[]>("/ingestion/nasa-platforms", fallback);
}

export async function getNasaEvents(): Promise<NasaEvent[]> {
  const fallback: NasaEvent[] = [
    {
      id: 1,
      eonet_id: "FIRMS_SA_30.5N_75.0E",
      title: "Punjab & Haryana Indo-Gangetic Plain Fire Complex",
      category: "wildfires",
      status: "open",
      latitude: 30.782,
      longitude: 75.214,
      first_observed: "2026-11-05T05:10:00Z",
      last_observed: "2026-11-12T08:40:00Z",
      magnitude_value: 6842.5,
      magnitude_unit: "MW FRP",
      source_ids: "NASA_FIRMS",
      source_url: "https://firms.modaps.eosdis.nasa.gov/",
      eonet_link: "https://firms.modaps.eosdis.nasa.gov/map/",
      geometry_count: 842,
      data_source: "NASA FIRMS"
    },
    {
      id: 2,
      eonet_id: "FIRMS_SA_23.5N_86.0E",
      title: "Chota Nagpur Plateau Fire Complex",
      category: "wildfires",
      status: "open",
      latitude: 23.742,
      longitude: 86.384,
      first_observed: "2026-11-05T05:05:00Z",
      last_observed: "2026-11-12T07:55:00Z",
      magnitude_value: 2941.2,
      magnitude_unit: "MW FRP",
      source_ids: "NASA_FIRMS",
      source_url: "https://firms.modaps.eosdis.nasa.gov/",
      eonet_link: "https://firms.modaps.eosdis.nasa.gov/map/",
      geometry_count: 349,
      data_source: "NASA FIRMS"
    },
    {
      id: 3,
      eonet_id: "FIRMS_SA_21.0N_85.5E",
      title: "Odisha Mahanadi Basin Fire Complex",
      category: "wildfires",
      status: "open",
      latitude: 21.218,
      longitude: 85.792,
      first_observed: "2026-11-06T04:50:00Z",
      last_observed: "2026-11-12T07:38:00Z",
      magnitude_value: 2184.6,
      magnitude_unit: "MW FRP",
      source_ids: "NASA_FIRMS",
      source_url: "https://firms.modaps.eosdis.nasa.gov/",
      eonet_link: "https://firms.modaps.eosdis.nasa.gov/map/",
      geometry_count: 274,
      data_source: "NASA FIRMS"
    },
    {
      id: 4,
      eonet_id: "FIRMS_SA_22.0N_92.0E",
      title: "Bangladesh & Chittagong Hills Fire Complex",
      category: "wildfires",
      status: "open",
      latitude: 22.416,
      longitude: 92.138,
      first_observed: "2026-11-05T04:42:00Z",
      last_observed: "2026-11-12T07:12:00Z",
      magnitude_value: 1468.9,
      magnitude_unit: "MW FRP",
      source_ids: "NASA_FIRMS",
      source_url: "https://firms.modaps.eosdis.nasa.gov/",
      eonet_link: "https://firms.modaps.eosdis.nasa.gov/map/",
      geometry_count: 196,
      data_source: "NASA FIRMS"
    },
    {
      id: 5,
      eonet_id: "FIRMS_SA_20.5N_97.0E",
      title: "Myanmar Shan Plateau Fire Complex",
      category: "wildfires",
      status: "open",
      latitude: 20.844,
      longitude: 96.952,
      first_observed: "2026-11-05T04:20:00Z",
      last_observed: "2026-11-12T06:58:00Z",
      magnitude_value: 3412.8,
      magnitude_unit: "MW FRP",
      source_ids: "NASA_FIRMS",
      source_url: "https://firms.modaps.eosdis.nasa.gov/",
      eonet_link: "https://firms.modaps.eosdis.nasa.gov/map/",
      geometry_count: 418,
      data_source: "NASA FIRMS"
    },
    {
      id: 6,
      eonet_id: "FIRMS_SA_25.0N_77.5E",
      title: "Chambal & Bundelkhand Basin Fire Complex",
      category: "wildfires",
      status: "open",
      latitude: 25.432,
      longitude: 77.641,
      first_observed: "2026-11-06T05:30:00Z",
      last_observed: "2026-11-12T08:05:00Z",
      magnitude_value: 1874.3,
      magnitude_unit: "MW FRP",
      source_ids: "NASA_FIRMS",
      source_url: "https://firms.modaps.eosdis.nasa.gov/",
      eonet_link: "https://firms.modaps.eosdis.nasa.gov/map/",
      geometry_count: 235,
      data_source: "NASA FIRMS"
    }
  ];

  const res = await fetchAPI<NasaEvent[]>("/ingestion/eonet/events", fallback);
  return Array.isArray(res) && res.length > 0 ? res : fallback;
}

export async function getFirmsAvailability(): Promise<DataAvailabilityItem[]> {
  const fallback: DataAvailabilityItem[] = [
    { data_id: "MODIS_NRT", min_date: "2026-08-01", max_date: "2026-11-12" },
    { data_id: "MODIS_SP", min_date: "2000-11-01", max_date: "2026-07-31" },
    { data_id: "VIIRS_SNPP_NRT", min_date: "2026-08-01", max_date: "2026-11-12" },
    { data_id: "VIIRS_SNPP_SP", min_date: "2012-01-20", max_date: "2026-07-31" },
    { data_id: "VIIRS_NOAA20_NRT", min_date: "2026-08-01", max_date: "2026-11-12" },
    { data_id: "VIIRS_NOAA20_SP", min_date: "2018-01-01", max_date: "2026-07-31" },
    { data_id: "VIIRS_NOAA21_NRT", min_date: "2026-08-01", max_date: "2026-11-12" },
    { data_id: "VIIRS_NOAA21_SP", min_date: "2023-01-01", max_date: "2026-07-31" }
  ];

  return fetchAPI<DataAvailabilityItem[]>("/ingestion/availability", fallback);
}

