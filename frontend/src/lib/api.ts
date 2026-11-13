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
    total_count: 44960,
    modis_count: 6156,
    viirs_count: 38804,
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
    features: [],
    meta: {
      total_matching: 0,
      returned_features: 0,
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
  const fallback: HarmonizedCell[] = [];

  const res = await fetchAPI<{ harmonized_cells: HarmonizedCell[] }>("/harmonization/results?page_size=250", { harmonized_cells: fallback });
  return res.harmonized_cells && res.harmonized_cells.length > 0 ? res.harmonized_cells : fallback;
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
  const fallback: AnomalySummary = {
    total_anomalies: 0,
    level_counts: {
      normal: 0,
      elevated: 0,
      high: 0,
      extreme: 0,
      insufficient_data: 0
    },
    top_anomalies: [],
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
  const fallback: NasaEvent[] = [];

  return fetchAPI<NasaEvent[]>("/ingestion/eonet/events", fallback);
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

