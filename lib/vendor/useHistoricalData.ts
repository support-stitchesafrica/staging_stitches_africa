/**
 * Historical Data Hook
 * Provides access to 12-month historical data, seasonal patterns, and comparisons
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { VendorAnalyticsService } from './analytics-service';
import { DateRange, TrendDataPoint } from '@/types/vendor-analytics';

// ============================================================================
// Types
// ============================================================================

export interface HistoricalDataResult {
  vendorId: string;
  metric: string;
  dataPoints: TrendDataPoint[];
  seasonalPatterns: SeasonalPattern[];
  yearOverYearComparison: YearOverYearComparison[];
}

export interface SeasonalPattern {
  period: string;
  averageValue: number;
  trend: 'high' | 'medium' | 'low';
}

export interface YearOverYearComparison {
  year: number;
  value: number;
  change: number;
}

export interface DateRangeComparison {
  range1: {
    period: DateRange;
    revenue: number;
    orders: number;
    customers: number;
    averageOrderValue: number;
  };
  range2: {
    period: DateRange;
    revenue: number;
    orders: number;
    customers: number;
    averageOrderValue: number;
  };
  changes: {
    revenue: number;
    orders: number;
    customers: number;
    averageOrderValue: number;
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch 12-month historical data
 * Validates: Requirements 16.1
 */
export function useHistoricalData(
  vendorId: string,
  metric: 'revenue' | 'orders' | 'customers' | 'products'
) {
  const [data, setData] = useState<HistoricalDataResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = useCallback(async () => {
    if (!vendorId) return;

    try {
      setLoading(true);
      setError(null);

      const service = new VendorAnalyticsService();
      const result = await service.getHistoricalData(vendorId, metric);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch historical data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch historical data');
      console.error('Historical data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [vendorId, metric]);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  return {
    data,
    loading,
    error,
    refetch: fetchHistoricalData
  };
}

/**
 * Hook to fetch cumulative metrics over time
 * Validates: Requirements 16.3
 */
export function useCumulativeMetrics(
  vendorId: string,
  dateRange: DateRange,
  metric: 'revenue' | 'orders' | 'customers'
) {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCumulativeMetrics = useCallback(async () => {
    if (!vendorId || !dateRange) return;

    try {
      setLoading(true);
      setError(null);

      const service = new VendorAnalyticsService();
      const result = await service.getCumulativeMetrics(vendorId, dateRange, metric);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch cumulative metrics');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cumulative metrics');
      console.error('Cumulative metrics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [vendorId, dateRange, metric]);

  useEffect(() => {
    fetchCumulativeMetrics();
  }, [fetchCumulativeMetrics]);

  return {
    data,
    loading,
    error,
    refetch: fetchCumulativeMetrics
  };
}

/**
 * Hook to compare two custom date ranges
 * Validates: Requirements 16.4
 */
export function useDateRangeComparison(
  vendorId: string,
  range1: DateRange | null,
  range2: DateRange | null
) {
  const [data, setData] = useState<DateRangeComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compareRanges = useCallback(async () => {
    if (!vendorId || !range1 || !range2) return;

    try {
      setLoading(true);
      setError(null);

      const service = new VendorAnalyticsService();
      const result = await service.compareCustomDateRanges(vendorId, range1, range2);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to compare date ranges');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to compare date ranges');
      console.error('Date range comparison error:', err);
    } finally {
      setLoading(false);
    }
  }, [vendorId, range1, range2]);

  useEffect(() => {
    if (range1 && range2) {
      compareRanges();
    }
  }, [compareRanges, range1, range2]);

  return {
    data,
    loading,
    error,
    refetch: compareRanges
  };
}

/**
 * Hook to fetch archived historical data
 * Validates: Requirements 16.5
 */
export function useArchivedData(
  vendorId: string,
  startDate: Date | null,
  endDate: Date | null
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArchivedData = useCallback(async () => {
    if (!vendorId || !startDate || !endDate) return;

    try {
      setLoading(true);
      setError(null);

      const service = new VendorAnalyticsService();
      const result = await service.getArchivedData(vendorId, startDate, endDate);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch archived data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch archived data');
      console.error('Archived data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [vendorId, startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchArchivedData();
    }
  }, [fetchArchivedData, startDate, endDate]);

  return {
    data,
    loading,
    error,
    refetch: fetchArchivedData
  };
}

/**
 * Hook to get seasonal patterns from historical data
 * Validates: Requirements 16.2
 */
export function useSeasonalPatterns(
  vendorId: string,
  metric: 'revenue' | 'orders' | 'customers' | 'products'
) {
  const { data, loading, error } = useHistoricalData(vendorId, metric);

  return {
    patterns: data?.seasonalPatterns || [],
    loading,
    error
  };
}

/**
 * Hook to get year-over-year comparison
 * Validates: Requirements 16.2
 */
export function useYearOverYearComparison(
  vendorId: string,
  metric: 'revenue' | 'orders' | 'customers' | 'products'
) {
  const { data, loading, error } = useHistoricalData(vendorId, metric);

  return {
    comparison: data?.yearOverYearComparison || [],
    loading,
    error
  };
}

/**
 * Utility function to generate date range presets
 */
export function getDateRangePresets(): Record<string, DateRange> {
  const today = new Date();
  
  return {
    'Last 7 Days': {
      start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: today,
      preset: '7days'
    },
    'Last 30 Days': {
      start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: today,
      preset: '30days'
    },
    'Last 3 Months': {
      start: new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()),
      end: today
    },
    'Last 6 Months': {
      start: new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()),
      end: today
    },
    'Last 12 Months': {
      start: new Date(today.getFullYear(), today.getMonth() - 12, today.getDate()),
      end: today
    },
    'This Year': {
      start: new Date(today.getFullYear(), 0, 1),
      end: today
    },
    'Last Year': {
      start: new Date(today.getFullYear() - 1, 0, 1),
      end: new Date(today.getFullYear() - 1, 11, 31)
    }
  };
}

/**
 * Utility function to validate date range is within 12 months
 */
export function isDateRangeValid(startDate: Date, endDate: Date): boolean {
  const monthsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return monthsDiff <= 12 && startDate <= endDate;
}
