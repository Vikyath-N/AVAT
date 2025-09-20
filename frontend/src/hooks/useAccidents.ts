/**
 * Custom hooks for accident data management
 * Replaces hardcoded data with real API integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { accidentService, AccidentQueryParams, AccidentResponse } from '../services/api';
import { AccidentRecord } from '../types';
import toast from 'react-hot-toast';

/**
 * Hook for fetching paginated accidents with filters
 */
export const useAccidents = (params?: AccidentQueryParams) => {
  return useQuery<AccidentResponse, Error>(
    ['accidents', params],
    () => accidentService.getAccidents(params),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      onError: (error) => {
        toast.error(`Failed to fetch accidents: ${error.message}`);
      }
    }
  );
};

/**
 * Hook for fetching a specific accident by ID
 */
export const useAccident = (id: number | null) => {
  return useQuery<AccidentRecord, Error>(
    ['accident', id],
    () => accidentService.getAccident(id!),
    {
      enabled: id !== null,
      staleTime: 30 * 60 * 1000, // 30 minutes
      onError: (error) => {
        toast.error(`Failed to fetch accident details: ${error.message}`);
      }
    }
  );
};

/**
 * Hook for map data with real-time updates
 */
export const useMapData = (params?: {
  bounds_north?: number;
  bounds_south?: number;
  bounds_east?: number;
  bounds_west?: number;
  zoom_level?: number;
  company?: string;
  severity?: string;
}) => {
  return useQuery(
    ['mapData', params],
    () => accidentService.getMapData(params),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for map data
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onError: (error: Error) => {
        toast.error(`Failed to fetch map data: ${error.message}`);
      }
    }
  );
};

/**
 * Hook for company statistics
 */
export const useCompanyStats = (company: string | null) => {
  return useQuery(
    ['companyStats', company],
    () => accidentService.getCompanyStats(company!),
    {
      enabled: !!company,
      staleTime: 15 * 60 * 1000, // 15 minutes
      onError: (error: Error) => {
        toast.error(`Failed to fetch company stats: ${error.message}`);
      }
    }
  );
};

/**
 * Hook for city statistics
 */
export const useCityStats = (city: string | null) => {
  return useQuery(
    ['cityStats', city],
    () => accidentService.getCityStats(city!),
    {
      enabled: !!city,
      staleTime: 15 * 60 * 1000, // 15 minutes
      onError: (error: Error) => {
        toast.error(`Failed to fetch city stats: ${error.message}`);
      }
    }
  );
};

/**
 * Hook for hourly trends
 */
export const useHourlyTrends = (daysBack: number = 30) => {
  return useQuery(
    ['hourlyTrends', daysBack],
    () => accidentService.getHourlyTrends(daysBack),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      onError: (error: Error) => {
        toast.error(`Failed to fetch hourly trends: ${error.message}`);
      }
    }
  );
};

/**
 * Hook for data refresh mutation
 */
export const useRefreshData = () => {
  const queryClient = useQueryClient();

  return useMutation(
    accidentService.refreshData,
    {
      onSuccess: () => {
        // Invalidate all accident-related queries
        queryClient.invalidateQueries('accidents');
        queryClient.invalidateQueries('mapData');
        queryClient.invalidateQueries('analytics');
        toast.success('Data refresh initiated successfully');
      },
      onError: (error: Error) => {
        toast.error(`Failed to refresh data: ${error.message}`);
      }
    }
  );
};

/**
 * Hook for real-time accident updates via WebSocket
 */
export const useRealTimeAccidents = () => {
  const [realTimeData, setRealTimeData] = useState<{
    newAccidents: AccidentRecord[];
    updatedAccidents: AccidentRecord[];
    deletedAccidentIds: number[];
  }>({
    newAccidents: [],
    updatedAccidents: [],
    deletedAccidentIds: []
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const { wsService } = require('../services/api');

    const handleMessage = (data: any) => {
      switch (data.type) {
        case 'accident_update':
          setRealTimeData(data.payload);
          // Invalidate relevant queries to trigger refetch
          queryClient.invalidateQueries('accidents');
          queryClient.invalidateQueries('mapData');
          
          if (data.payload.new_accidents?.length > 0) {
            toast.success(`${data.payload.new_accidents.length} new accidents reported`);
          }
          break;
          
        case 'analytics_update':
          queryClient.invalidateQueries('analytics');
          break;
          
        case 'heartbeat':
          console.log('📡 WebSocket heartbeat:', data.payload.server_time);
          break;
          
        default:
          console.log('📨 Unknown WebSocket message type:', data.type);
      }
    };

    const handleError = (error: Event) => {
      console.error('🔴 WebSocket connection error:', error);
      toast.error('Real-time connection lost. Some data may not be current.');
    };

    wsService.connect(handleMessage, handleError);

    return () => {
      wsService.disconnect();
    };
  }, [queryClient]);

  return realTimeData;
};

/**
 * Hook for filtering and search functionality
 */
export const useAccidentFilters = () => {
  const [filters, setFilters] = useState<AccidentQueryParams>({
    page: 1,
    limit: 50,
    sort_by: 'timestamp',
    sort_order: 'desc'
  });

  const updateFilter = useCallback((key: keyof AccidentQueryParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset page when other filters change
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 50,
      sort_by: 'timestamp',
      sort_order: 'desc'
    });
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
    setFilters
  };
};
