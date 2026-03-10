import { useState, useEffect, useCallback } from 'react';
import type { 
  BogoDashboardData, 
  BogoAnalytics,
  AnalyticsExportOptions 
} from '@/lib/bogo/analytics-service';

interface UseBogoAnalyticsOptions {
  mappingId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseBogoAnalyticsReturn {
  // Data
  dashboardData: BogoDashboardData | null;
  mappingAnalytics: BogoAnalytics | null;
  popularCombinations: any[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  trackEvent: (eventData: {
    eventType: 'view' | 'add_to_cart' | 'redemption' | 'checkout' | 'conversion';
    mappingId: string;
    mainProductId: string;
    freeProductId?: string;
    userId?: string;
    sessionId?: string;
    metadata?: any;
  }) => Promise<void>;
  exportAnalytics: (options: AnalyticsExportOptions) => Promise<{ success: boolean; data?: string; error?: string }>;
}

export function useBogoAnalytics(options: UseBogoAnalyticsOptions = {}): UseBogoAnalyticsReturn {
  const {
    mappingId,
    dateRange,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [dashboardData, setDashboardData] = useState<BogoDashboardData | null>(null);
  const [mappingAnalytics, setMappingAnalytics] = useState<BogoAnalytics | null>(null);
  const [popularCombinations, setPopularCombinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (dateRange?.start) {
        params.append('startDate', dateRange.start.toISOString());
      }
      if (dateRange?.end) {
        params.append('endDate', dateRange.end.toISOString());
      }

      if (mappingId) {
        // Fetch analytics for specific mapping
        params.append('mappingId', mappingId);
        params.append('type', 'mapping');
        
        const response = await fetch(`/api/bogo/analytics?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setMappingAnalytics(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch mapping analytics');
        }
      } else {
        // Fetch dashboard data
        params.set('type', 'dashboard');
        
        const dashboardResponse = await fetch(`/api/bogo/analytics?${params}`);
        const dashboardResult = await dashboardResponse.json();
        
        if (dashboardResult.success) {
          setDashboardData(dashboardResult.data);
        } else {
          throw new Error(dashboardResult.error || 'Failed to fetch dashboard data');
        }
      }

      // Always fetch popular combinations
      const combinationsParams = new URLSearchParams(params);
      combinationsParams.set('type', 'combinations');
      combinationsParams.set('limit', '10');
      
      const combinationsResponse = await fetch(`/api/bogo/analytics?${combinationsParams}`);
      const combinationsResult = await combinationsResponse.json();
      
      if (combinationsResult.success) {
        setPopularCombinations(combinationsResult.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [mappingId, dateRange]);

  const trackEvent = useCallback(async (eventData: {
    eventType: 'view' | 'add_to_cart' | 'redemption' | 'checkout' | 'conversion';
    mappingId: string;
    mainProductId: string;
    freeProductId?: string;
    userId?: string;
    sessionId?: string;
    metadata?: any;
  }) => {
    try {
      const response = await fetch('/api/bogo/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track',
          ...eventData
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to track event');
      }
    } catch (err) {
      console.error('Failed to track BOGO analytics event:', err);
      // Don't throw here to avoid disrupting user experience
    }
  }, []);

  const exportAnalytics = useCallback(async (exportOptions: AnalyticsExportOptions) => {
    try {
      const response = await fetch('/api/bogo/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'export',
          ...exportOptions,
          dateRange: {
            start: exportOptions.dateRange.start.toISOString(),
            end: exportOptions.dateRange.end.toISOString()
          }
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Export failed' };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Export failed' 
      };
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  // Initial load
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalytics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAnalytics]);

  return {
    dashboardData,
    mappingAnalytics,
    popularCombinations,
    loading,
    error,
    refresh,
    trackEvent,
    exportAnalytics
  };
}

// Helper hook for tracking BOGO events
export function useBogoEventTracker() {
  const trackEvent = useCallback(async (eventData: {
    eventType: 'view' | 'add_to_cart' | 'redemption' | 'checkout' | 'conversion';
    mappingId: string;
    mainProductId: string;
    freeProductId?: string;
    userId?: string;
    sessionId?: string;
    metadata?: any;
  }) => {
    try {
      const response = await fetch('/api/bogo/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track',
          ...eventData
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        console.error('Failed to track BOGO event:', result.error);
      }
    } catch (err) {
      console.error('Failed to track BOGO analytics event:', err);
    }
  }, []);

  return { trackEvent };
}

// Helper functions for common tracking scenarios
export const bogoEventTrackers = {
  trackProductView: (mappingId: string, mainProductId: string, userId?: string) => {
    return fetch('/api/bogo/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track',
        eventType: 'view',
        mappingId,
        mainProductId,
        userId,
        sessionId: getSessionId()
      })
    }).catch(err => console.error('Failed to track product view:', err));
  },

  trackAddToCart: (mappingId: string, mainProductId: string, freeProductId?: string, userId?: string) => {
    return fetch('/api/bogo/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track',
        eventType: 'add_to_cart',
        mappingId,
        mainProductId,
        freeProductId,
        userId,
        sessionId: getSessionId()
      })
    }).catch(err => console.error('Failed to track add to cart:', err));
  },

  trackRedemption: (
    mappingId: string, 
    mainProductId: string, 
    freeProductId: string, 
    orderValue: number,
    userId?: string
  ) => {
    return fetch('/api/bogo/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track',
        eventType: 'redemption',
        mappingId,
        mainProductId,
        freeProductId,
        userId,
        sessionId: getSessionId(),
        metadata: { orderValue }
      })
    }).catch(err => console.error('Failed to track redemption:', err));
  },

  trackCheckout: (
    mappingId: string, 
    mainProductId: string, 
    freeProductId: string,
    cartTotal: number,
    shippingSavings: number,
    userId?: string
  ) => {
    return fetch('/api/bogo/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track',
        eventType: 'checkout',
        mappingId,
        mainProductId,
        freeProductId,
        userId,
        sessionId: getSessionId(),
        metadata: { cartTotal, shippingSavings }
      })
    }).catch(err => console.error('Failed to track checkout:', err));
  }
};

// Helper function to get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('bogo_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('bogo_session_id', sessionId);
  }
  return sessionId;
}