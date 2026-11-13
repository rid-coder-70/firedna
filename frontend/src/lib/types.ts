export type Instrument = "MODIS" | "VIIRS";

export interface Hotspot {
  id: number;
  instrument: Instrument;
  satellite_platform: string;
  source_product: string;
  latitude: number;
  longitude: number;
  acq_date: string;
  acq_time?: string;
  acq_datetime?: string;
  brightness?: number;
  bright_t31?: number;
  frp?: number;
  confidence_raw?: string;
  confidence_normalized?: number;
  confidence_category?: "low" | "nominal" | "high";
  daynight?: "D" | "N";
  is_demo_data: boolean;
  raw_metadata?: Record<string, any>;
}

export interface HotspotSummary {
  total_count: number;
  modis_count: number;
  viirs_count: number;
  mean_frp?: number;
  max_frp?: number;
  earliest_observation?: string;
  latest_observation?: string;
  bbox_applied?: string;
  is_demo_data: boolean;
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: number;
    instrument: string;
    satellite_platform: string;
    source_product: string;
    acq_date: string;
    acq_time?: string;
    brightness?: number;
    frp?: number;
    confidence_category?: string;
    confidence_normalized?: number;
    daynight?: string;
    is_demo_data: boolean;
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
  meta: {
    total_matching: number;
    returned_features: number;
    truncated: boolean;
    is_demo_data: boolean;
    data_attribution: string;
  };
}

export interface HarmonizedCell {
  id: number;
  grid_cell_id: string;
  grid_resolution_deg: number;
  cell_lat_min: number;
  cell_lat_max: number;
  cell_lon_min: number;
  cell_lon_max: number;
  centroid_lat: number;
  centroid_lon: number;
  obs_date: string;
  modis_count: number;
  viirs_snpp_count: number;
  viirs_noaa20_count: number;
  viirs_noaa21_count: number;
  total_viirs_count: number;
  total_detections_all: number;
  total_frp_modis: number;
  total_frp_viirs: number;
  max_frp_all: number;
  hai_score: number;
  hai_count_component?: number;
  hai_frp_component?: number;
  hai_confidence_component?: number;
  hai_is_experimental: boolean;
  mean_confidence_modis?: number;
  mean_confidence_viirs?: number;
  is_demo_data: boolean;
}

export interface SensorComparison {
  grid_cell_id: string;
  centroid_lat: number;
  centroid_lon: number;
  dates: string[];
  modis: {
    daily_counts: number[];
    daily_frp: number[];
    platform: string;
    spatial_resolution: string;
    total_period_detections: number;
    detection_threshold: string;
  };
  viirs: {
    daily_counts: number[];
    daily_frp: number[];
    platforms: string[];
    spatial_resolution: string;
    total_period_detections: number;
    detection_threshold: string;
  };
  harmonized: {
    hai_scores: number[];
    grid_resolution_deg: number;
    temporal_window_hours: number;
    methodology_version: string;
    is_experimental: boolean;
    educational_note: string;
  };
}

export interface DailyAnalytics {
  date: string;
  modis_count: number;
  viirs_count: number;
  total_count: number;
  total_frp_modis: number;
  total_frp_viirs: number;
  hai_mean?: number | null;
}

export interface MonthlyAnalytics {
  month: number;
  month_name: string;
  modis_count: number;
  viirs_count: number;
  total_count: number;
  mean_frp?: number | null;
}

export interface SeasonalAnalytics {
  season: string;
  name: string;
  modis_count: number;
  viirs_count: number;
  total_count: number;
  mean_daily_count: number;
}

export interface Anomaly {
  id: number;
  obs_date: string;
  grid_cell_id: string;
  centroid_lat: number;
  centroid_lon: number;
  z_score?: number;
  historical_percentile?: number;
  anomaly_level: "normal" | "elevated" | "high" | "extreme" | "insufficient_data";
  anomaly_label?: string;
  observed_count?: number;
  baseline_mean_count?: number;
  baseline_std_count?: number;
  has_sufficient_baseline: boolean;
  is_demo_data: boolean;
  disclaimer: string;
}

export interface AnomalySummary {
  total_anomalies: number;
  level_counts: Record<string, number>;
  top_anomalies: Anomaly[];
  is_demo_data: boolean;
}

export interface NasaEvent {
  id: number;
  eonet_id: string;
  title: string;
  category: string;
  status: "open" | "closed";
  closed_at?: string;
  latitude: number;
  longitude: number;
  first_observed?: string;
  last_observed?: string;
  magnitude_value?: number;
  magnitude_unit?: string;
  source_ids?: string;
  source_url?: string;
  eonet_link?: string;
  geometry_count: number;
  data_source: string;
}

export interface NasaOpenDataPlatform {
  name: string;
  url: string;
  description: string;
  api_key_required: boolean;
  free_registration_url?: string;
  category: string;
  role_in_firedna: string;
}

export interface DataAvailabilityItem {
  data_id: string;
  min_date: string;
  max_date: string;
  is_demo?: boolean;
}


