/**
 * Hybrid Data Service
 * Tries real API first, falls back to mock data for production demo
 */

import { accidentService, analyticsService, systemService } from './api';
import { mockAccidents, mockMapData, mockAnalytics } from './mockData';
import { AccidentRecord } from '../types';

const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';

/**
 * Check if backend API is available
 */
const checkApiHealth = async (): Promise<boolean> => {
  try {
    await systemService.healthCheck();
    return true;
  } catch (error) {
    console.warn('🟡 Backend API not available, using mock data');
    return false;
  }
};

/**
 * Hybrid service that tries API first, falls back to mock data
 */
export const dataService = {
  // Get accidents with API fallback
  getAccidents: async (params?: any) => {
    if (isDemoMode) {
      // Return mock data in production or when API is down
      return {
        data: mockAccidents,
        total_count: mockAccidents.length,
        pagination: {
          page: 1,
          limit: 50,
          total_pages: 1,
          has_next: false,
          has_prev: false
        },
        status: 'success',
        timestamp: new Date().toISOString()
      };
    }

    return await accidentService.getAccidents(params);
  },

  // Get map data with fallback
  getMapData: async (params?: any) => {
    if (isDemoMode) {
      return {
        data: mockMapData,
        status: 'success',
        timestamp: new Date().toISOString()
      };
    }

    return await accidentService.getMapData(params);
  },

  // Get analytics with fallback
  getAnalytics: async () => {
    if (isDemoMode) {
      return {
        data: mockAnalytics,
        status: 'success',
        timestamp: new Date().toISOString()
      };
    }

    return await analyticsService.getOverview();
  },

  // Get system stats with fallback
  getSystemStats: async () => {
    if (isDemoMode) {
      return {
        data: {
          total_accidents: mockAccidents.length,
          total_companies: 5,
          total_cities: 6,
          data_freshness: new Date().toISOString(),
          update_frequency: "Demo Mode",
          api_version: "2.0.0",
          database_size: "Demo Data"
        },
        status: 'success',
        timestamp: new Date().toISOString()
      };
    }

    return await systemService.getStats();
  }
};

/**
 * Get demo banner info
 */
export const getDemoInfo = () => {
  const isDemo = isDemoMode;
  return {
    isDemo: isDemo,
    message: isDemo ? 
      'Demo Mode: Using sample data for demonstration purposes' : 
      'Live Mode: Connected to real-time data',
    dataSource: isDemo ? 'Mock Data' : 'Live API'
  };
};
