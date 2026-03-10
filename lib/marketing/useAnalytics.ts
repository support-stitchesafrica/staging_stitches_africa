/**
 * Analytics Hook
 * Provides analytics data with loading states, error handling, and refresh functionality
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnalyticsPersistenceServiceClient as AnalyticsPersistenceService } from './analytics-persistence-service-client';

export interface AnalyticsData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  monthlyGrowthRate: number;
  vendorGrowthRate: number;
  revenueGrowthRate: number;
  bdmConversionRate: number;
  averageVendorOnboardingTime: number;
  totalVendors: number;
  activeVendors: number;
  totalTeams: number;
  totalUsers: number;
  lastUpdated: Date | null;
}

export interface UseAnalyticsOptions {
  type: 'organization' | 'team' | 'user' | 'vendor';
  entityId?: string;
  autoLoad?: boolean;
  refreshInterval?: number; // in milliseconds
}

export interface UseAnalyticsResult {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  needsRefresh: boolean;
  refresh: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

const DEFAULT_ANALYTICS: AnalyticsData = {
  totalRevenue: 0,
  monthlyRevenue: 0,
  totalOrders: 0,
  completedOrders: 0,
  averageOrderValue: 0,
  monthlyGrowthRate: 0,
  vendorGrowthRate: 0,
  revenueGrowthRate: 0,
  bdmConversionRate: 0,
  averageVendorOnboardingTime: 0,
  totalVendors: 0,
  activeVendors: 0,
  totalTeams: 0,
  totalUsers: 0,
  lastUpdated: null
};

export function useAnalytics(options: UseAnalyticsOptions): UseAnalyticsResult {
  const { type, entityId, autoLoad = true, refreshInterval } = options;
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  
  /**
   * Load analytics from Firestore
   */
  const loadAnalytics = useCallback(async (force: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get Firebase ID token
      const { auth } = await import('@/firebase');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError('Not authenticated');
        setData(DEFAULT_ANALYTICS);
        return;
      }
      
      const idToken = await currentUser.getIdToken();
      
      // Fetch from API with force refresh parameter
      const endpoint = type === 'organization' 
        ? '/api/marketing/analytics/organization'
        : type === 'team'
        ? `/api/marketing/analytics/team/${entityId}`
        : `/api/marketing/analytics/team-members?userId=${entityId}`;
      
      const url = force ? `${endpoint}?refresh=true` : endpoint;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const analyticsData: AnalyticsData = {
          totalRevenue: result.data.totalRevenue || 0,
          monthlyRevenue: result.data.monthlyRevenue || 0,
          totalOrders: result.data.totalOrders || 0,
          completedOrders: result.data.completedOrders || 0,
          averageOrderValue: result.data.averageOrderValue || 0,
          monthlyGrowthRate: result.data.monthlyGrowthRate || 0,
          vendorGrowthRate: result.data.vendorGrowthRate || 0,
          revenueGrowthRate: result.data.revenueGrowthRate || 0,
          bdmConversionRate: result.data.bdmConversionRate || 0,
          averageVendorOnboardingTime: result.data.averageVendorOnboardingTime || 0,
          totalVendors: result.data.totalVendors || 0,
          activeVendors: result.data.activeVendors || 0,
          totalTeams: result.data.totalTeams || 0,
          totalUsers: result.data.totalUsers || 0,
          lastUpdated: new Date()
        };
        
        setData(analyticsData);
        setLastUpdated(new Date());
        
        // Check if data needs refresh
        const needsRefreshCheck = await AnalyticsPersistenceService.needsRefresh(type, entityId);
        setNeedsRefresh(needsRefreshCheck);
      } else {
        // No data available, use defaults
        setData(DEFAULT_ANALYTICS);
        setNeedsRefresh(true);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      setData(DEFAULT_ANALYTICS);
      setNeedsRefresh(true);
    } finally {
      setLoading(false);
    }
  }, [type, entityId]);
  
  /**
   * Refresh analytics (uses cache if available)
   */
  const refresh = useCallback(async () => {
    await loadAnalytics(false);
  }, [loadAnalytics]);
  
  /**
   * Force refresh analytics (bypasses cache)
   */
  const forceRefresh = useCallback(async () => {
    await loadAnalytics(true);
  }, [loadAnalytics]);
  
  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadAnalytics(false);
    }
  }, [autoLoad, loadAnalytics]);
  
  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        loadAnalytics(false);
      }, refreshInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, loadAnalytics]);
  
  return {
    data,
    loading,
    error,
    lastUpdated,
    needsRefresh,
    refresh,
    forceRefresh
  };
}
