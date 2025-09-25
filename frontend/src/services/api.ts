/**
 * API Service Layer - Connects frontend to backend
 * Replaces hardcoded mock data with actual API calls
 */

import axios from 'axios';
import { AccidentRecord } from '../types';

// Configure axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('🔴 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('🔴 API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export interface AccidentQueryParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  company?: string;
  city?: string;
  severity?: string;
  start_date?: string;
  end_date?: string;
  has_coordinates?: boolean;
}

export interface AccidentResponse {
  data: AccidentRecord[];
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  total_count: number;
  status: string;
  timestamp: string;
}

export interface MapDataResponse {
  accidents: AccidentRecord[];
  clusters: any[];
  heatmap: any[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * Accidents API
 */
export const accidentService = {
  // Get paginated accidents with filters
  getAccidents: async (params?: AccidentQueryParams): Promise<AccidentResponse> => {
    const response = await api.get('/accidents', { params });
    return response.data;
  },

  // Get specific accident by ID
  getAccident: async (id: number): Promise<AccidentRecord> => {
    const response = await api.get(`/accidents/${id}`);
    return response.data;
  },

  // Get map data for visualization
  getMapData: async (params?: {
    bounds_north?: number;
    bounds_south?: number;
    bounds_east?: number;
    bounds_west?: number;
    zoom_level?: number;
    company?: string;
    severity?: string;
  }): Promise<MapDataResponse> => {
    const response = await api.get('/accidents/map/data', { params });
    return response.data;
  },

  // Get company statistics
  getCompanyStats: async (company: string) => {
    const response = await api.get(`/accidents/companies/${company}/stats`);
    return response.data;
  },

  // Get the most recent accident by id desc
  getLatestAccident: async (): Promise<AccidentRecord | null> => {
    const response = await api.get('/accidents', {
      params: { page: 1, limit: 1, sort_by: 'id', sort_order: 'desc' }
    });
    const payload = response.data;
    if (payload && payload.data && payload.data.length > 0) {
      return payload.data[0] as AccidentRecord;
    }
    return null;
  },

  // Get city statistics
  getCityStats: async (city: string) => {
    const response = await api.get(`/accidents/cities/${city}/stats`);
    return response.data;
  },

  // Get hourly trends
  getHourlyTrends: async (daysBack: number = 30) => {
    const response = await api.get('/accidents/trends/hourly', {
      params: { days_back: daysBack }
    });
    return response.data;
  },

  // Get weekly trends
  getWeeklyTrends: async (weeksBack: number = 12) => {
    const response = await api.get('/accidents/trends/weekly', {
      params: { weeks_back: weeksBack }
    });
    return response.data;
  },

  // Get accident hotspots
  getHotspots: async (limit: number = 20, radiusKm: number = 1.0) => {
    const response = await api.get('/accidents/hotspots', {
      params: { limit, radius_km: radiusKm }
    });
    return response.data;
  },

  // Trigger data refresh
  refreshData: async () => {
    const response = await api.post('/accidents/refresh');
    return response.data;
  }
};

/**
 * Analytics API
 */
export const analyticsService = {
  // Get analytics overview
  getOverview: async () => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },

  // Get temporal trends
  getTemporalTrends: async (period: 'hourly' | 'daily' | 'weekly' | 'monthly', daysBack: number = 30) => {
    const response = await api.get('/analytics/trends/temporal', {
      params: { period, days_back: daysBack }
    });
    return response.data;
  },

  // Get intersection patterns
  getIntersectionPatterns: async () => {
    const response = await api.get('/analytics/patterns/intersection');
    return response.data;
  },

  // Get risk assessment
  getRiskAssessment: async () => {
    const response = await api.get('/analytics/risk-assessment');
    return response.data;
  },

  // Get company performance
  getCompanyPerformance: async () => {
    const response = await api.get('/analytics/performance/companies');
    return response.data;
  }
};

/**
 * System API
 */
export const systemService = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Get system stats
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },

  // Get filter options
  getFilterOptions: async () => {
    const response = await api.get('/filters/options');
    return response.data;
  },

  // Export data
  exportData: async (format: 'csv' | 'json' | 'xlsx', filters?: any) => {
    const response = await api.post('/export', {
      format,
      filters,
      include_metadata: true
    });
    return response.data;
  }
};

/**
 * WebSocket Service for real-time updates
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(onMessage?: (data: any) => void, onError?: (error: Event) => void) {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🟢 WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data);
          onMessage?.(data);
        } catch (error) {
          console.error('🔴 WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔴 WebSocket disconnected');
        this.attemptReconnect(onMessage, onError);
      };

      this.ws.onerror = (error) => {
        console.error('🔴 WebSocket error:', error);
        onError?.(error);
      };

    } catch (error) {
      console.error('🔴 WebSocket connection error:', error);
      onError?.(error as Event);
    }
  }

  private attemptReconnect(onMessage?: (data: any) => void, onError?: (error: Event) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting WebSocket reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(onMessage, onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('🟡 WebSocket not connected, message not sent:', message);
    }
  }

  subscribe(filters: any) {
    this.send({
      type: 'subscribe',
      filters
    });
  }

  ping() {
    this.send({
      type: 'ping',
      timestamp: new Date().toISOString()
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();

export default api;
