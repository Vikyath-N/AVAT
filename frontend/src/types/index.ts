// Type definitions for the AV Accident Analysis Platform

export interface AccidentRecord {
  id: number;
  timestamp: string;
  company: string;
  vehicle_make: string;
  vehicle_model: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  city: string;
  county: string;
  city_type: 'urban' | 'suburban' | 'rural';
  intersection_type: string;
  damage_severity: 'minor' | 'moderate' | 'severe' | 'total loss';
  weather_conditions: string;
  time_of_day: string;
  casualties: number;
  av_mode: 'autonomous' | 'manual' | 'disengaged';
  speed_limit: number;
  traffic_signals: string;
  road_type: string;
  damage_location: string;
  raw_text: string;
  report_url: string;
  created_at: string;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface AccidentCluster {
  id: string;
  coordinates: [number, number];
  accident_count: number;
  accidents: AccidentRecord[];
}

export interface AnalyticsData {
  company_stats: CompanyStats[];
  vehicle_stats: VehicleStats[];
  city_stats: CityStats[];
  intersection_stats: IntersectionStats[];
  damage_stats: DamageStats[];
  temporal_stats: TemporalStats[];
  severity_stats: SeverityStats[];
}

export interface CompanyStats {
  company: string;
  accident_count: number;
  severity_breakdown: Record<string, number>;
  growth_rate: number;
  market_share: number;
}

export interface VehicleStats {
  make: string;
  model: string;
  accident_count: number;
  accident_rate_per_mile: number;
  severity_score: number;
}

export interface CityStats {
  city: string;
  city_type: string;
  accident_count: number;
  accidents_per_capita: number;
  most_common_intersection_type: string;
}

export interface IntersectionStats {
  intersection_type: string;
  accident_count: number;
  severity_distribution: Record<string, number>;
  peak_hours: string[];
}

export interface DamageStats {
  damage_location: string;
  frequency: number;
  associated_severity: string;
  common_scenarios: string[];
}

export interface TemporalStats {
  hour: number;
  day_of_week: string;
  month: string;
  accident_count: number;
}

export interface SeverityStats {
  severity: string;
  count: number;
  percentage: number;
  average_casualties: number;
}

export interface FilterState {
  companies: string[];
  vehicle_makes: string[];
  cities: string[];
  city_types: string[];
  intersection_types: string[];
  damage_severities: string[];
  date_range: {
    start: string;
    end: string;
  };
  casualties_min: number;
  casualties_max: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface TimeSeriesData {
  date: string;
  accidents: number;
  companies: Record<string, number>;
}

export interface HeatmapData {
  lat: number;
  lng: number;
  intensity: number;
  accidents: AccidentRecord[];
}

export interface MapStyle {
  id: string;
  name: string;
  url: string;
  preview?: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  map_style: string;
  default_zoom: number;
  auto_refresh: boolean;
  notifications: boolean;
}

export interface APIResponse<T> {
  data: T;
  message: string;
  status: 'success' | 'error';
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SearchParams {
  query: string;
  filters: Partial<FilterState>;
  pagination: PaginationParams;
}

// Component props interfaces
export interface AccidentMarkerProps {
  accident: AccidentRecord;
  onClick: (accident: AccidentRecord) => void;
  isSelected?: boolean;
}

export interface AccidentPopupProps {
  accident: AccidentRecord;
  onClose: () => void;
}

export interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableOptions: {
    companies: string[];
    vehicle_makes: string[];
    cities: string[];
    intersection_types: string[];
  };
}

export interface AnalyticsDashboardProps {
  data: AnalyticsData;
  loading?: boolean;
  error?: string;
}

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

// Utility types
export type AccidentField = keyof AccidentRecord;
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'map' | 'list' | 'analytics';
export type ExportFormat = 'csv' | 'json' | 'pdf';

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'accident_update' | 'analytics_update' | 'system_status';
  payload: any;
  timestamp: string;
}

export interface AccidentUpdateMessage extends WebSocketMessage {
  type: 'accident_update';
  payload: {
    new_accidents: AccidentRecord[];
    updated_accidents: AccidentRecord[];
    deleted_accident_ids: number[];
  };
}

export interface AnalyticsUpdateMessage extends WebSocketMessage {
  type: 'analytics_update';
  payload: {
    analytics: Partial<AnalyticsData>;
    affected_filters: string[];
  };
}
