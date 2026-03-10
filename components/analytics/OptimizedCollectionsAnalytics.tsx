'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react';
import { useDateRange } from '@/contexts/DateRangeContext';
import { useCachedData } from '@/lib/utils/cache-utils';
import { AnalyticsCardSkeleton, ChartSkeleton } from '@/components/ui/optimized-loader';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface OptimizedAnalyticsData {
  summary: {
    totalCollections: number;
    totalViews: number;
    totalAddToCarts: number;
    totalPurchases: number;
    totalRevenue: number;
    conversionRate: number;
    averageOrderValue: number;
    revenuePerView: number;
  };
  integrity: {
    webHitsCollectionViews: number;
    analyticsCollectionViews: number;
    discrepancy: number;
    lastSyncTime: string;
    syncStatus: 'synced' | 'partial' | 'error';
  };
  performance: {
    queryTime: number;
    cacheHit: boolean;
    dataFreshness: number;
    optimized: boolean;
  };
}

interface OptimizedCollectionsAnalyticsProps {
  collectionId?: string;
  showPerformanceMetrics?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export function OptimizedCollectionsAnalytics({
  collectionId,
  showPerformanceMetrics = true,
  autoRefresh = false,
  refreshInterval = 300 // 5 minutes
}: OptimizedCollectionsAnalyticsProps) {
  const { dateRange } = useDateRange();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Optimized data fetcher with performance tracking
  const optimizedDataFetcher = useCallback(async () => {
    const startTime = Date.now();
    
    const params = new URLSearchParams({
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString()
    });

    if (collectionId) {
      params.append('collectionId', collectionId);
    }

    const response = await fetch(`/api/analytics/collections/optimized?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch optimized analytics data');
    }

    // Add client-side performance metrics
    result.data.performance = {
      ...result.data.performance,
      clientFetchTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

    return result.data;
  }, [dateRange.start, dateRange.end, collectionId]);

  // Use aggressive caching for fast loading (1 minute cache)
  const {
    data: analyticsData,
    loading,
    error,
    refetch
  } = useCachedData<OptimizedAnalyticsData>(
    `optimized-collections-${collectionId || 'all'}-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`,
    optimizedDataFetcher,
    1 * 60 * 1000 // 1 minute cache for fast loading
  );

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      try {
        await refetch();
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  // Manual refresh with performance tracking
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const startTime = Date.now();
    
    try {
      // Force refresh by clearing cache
      await fetch('/api/analytics/collections/optimized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'clearCache', 
          collectionId: collectionId || undefined 
        })
      });
      
      await refetch();
      setLastRefresh(new Date());
      
      console.log(`Refresh completed in ${Date.now() - startTime}ms`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Force data synchronization
  const handleSync = async () => {
    setIsRefreshing(true);
    
    try {
      const response = await fetch('/api/analytics/collections/optimized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sync',
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          }
        })
      });

      if (response.ok) {
        await refetch();
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get sync status color and icon
  const getSyncStatusDisplay = (status: string) => {
    switch (status) {
      case 'synced':
        return { color: 'text-green-600', icon: CheckCircle, text: 'Synced' };
      case 'partial':
        return { color: 'text-yellow-600', icon: AlertTriangle, text: 'Partial' };
      case 'error':
        return { color: 'text-red-600', icon: AlertTriangle, text: 'Error' };
      default:
        return { color: 'text-gray-600', icon: Clock, text: 'Unknown' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <AnalyticsCardSkeleton key={i} />
          ))}
        </div>
        {showPerformanceMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        )}
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Analytics
          </h3>
          <p className="text-gray-600 mb-4">
            {error || 'Unable to fetch optimized analytics data'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
            <Button onClick={handleSync} disabled={isRefreshing} variant="outline">
              <Zap className="w-4 h-4 mr-2" />
              Force Sync
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const syncStatus = getSyncStatusDisplay(analyticsData.integrity.syncStatus);

  return (
    <div className="space-y-6">
      {/* Header with Performance Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {collectionId ? 'Collection Analytics' : 'Collections Overview'}
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">
              Optimized analytics with synchronized data
            </p>
            {showPerformanceMetrics && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={syncStatus.color}>
                  <syncStatus.icon className="w-3 h-3 mr-1" />
                  {syncStatus.text}
                </Badge>
                <Badge variant="secondary">
                  <Zap className="w-3 h-3 mr-1" />
                  {analyticsData.performance.queryTime}ms
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {analyticsData.integrity.discrepancy > 0 && (
            <Button 
              onClick={handleSync} 
              disabled={isRefreshing}
              size="sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Sync Data
            </Button>
          )}
        </div>
      </div>

      {/* Data Integrity Alert */}
      {analyticsData.integrity.discrepancy > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  Data Discrepancy Detected
                </p>
                <p className="text-sm text-yellow-700">
                  {analyticsData.integrity.discrepancy} records differ between web hits and analytics. 
                  <button 
                    onClick={handleSync}
                    className="ml-1 underline hover:no-underline"
                  >
                    Click to synchronize
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Synchronized count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Add to Carts</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.totalAddToCarts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(analyticsData.summary.conversionRate)} conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analyticsData.summary.averageOrderValue)} avg order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue per View</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.summary.revenuePerView)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.summary.totalPurchases} purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {showPerformanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Query Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Query Time:</span>
                  <Badge variant={analyticsData.performance.queryTime < 100 ? 'default' : 'secondary'}>
                    {analyticsData.performance.queryTime}ms
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cache Status:</span>
                  <Badge variant={analyticsData.performance.cacheHit ? 'default' : 'outline'}>
                    {analyticsData.performance.cacheHit ? 'Hit' : 'Miss'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Optimized:</span>
                  <Badge variant={analyticsData.performance.optimized ? 'default' : 'destructive'}>
                    {analyticsData.performance.optimized ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data Integrity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant={analyticsData.integrity.syncStatus === 'synced' ? 'default' : 'destructive'}>
                    {analyticsData.integrity.syncStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Discrepancy:</span>
                  <span className="text-sm font-medium">
                    {analyticsData.integrity.discrepancy}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Sync:</span>
                  <span className="text-xs text-gray-500">
                    {new Date(analyticsData.integrity.lastSyncTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Refresh:</span>
                  <span className="text-xs text-gray-500">
                    {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Auto Refresh:</span>
                  <Badge variant={autoRefresh ? 'default' : 'outline'}>
                    {autoRefresh ? 'On' : 'Off'}
                  </Badge>
                </div>
                {autoRefresh && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Interval:</span>
                    <span className="text-sm font-medium">
                      {refreshInterval}s
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}