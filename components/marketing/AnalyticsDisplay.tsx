/**
 * Analytics Display Component
 * Shows analytics data with loading states, error handling, and refresh functionality
 */

'use client';

import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useAnalytics } from '@/lib/marketing/useAnalytics';
import { formatDistanceToNow } from 'date-fns';

interface AnalyticsDisplayProps {
  type: 'organization' | 'team' | 'user' | 'vendor';
  entityId?: string;
  children: (data: any, loading: boolean) => React.ReactNode;
  showRefreshButton?: boolean;
  showLastUpdated?: boolean;
  autoRefreshInterval?: number;
}

export function AnalyticsDisplay({
  type,
  entityId,
  children,
  showRefreshButton = true,
  showLastUpdated = true,
  autoRefreshInterval
}: AnalyticsDisplayProps) {
  const { 
    data, 
    loading, 
    error, 
    lastUpdated, 
    needsRefresh, 
    refresh, 
    forceRefresh 
  } = useAnalytics({
    type,
    entityId,
    autoLoad: true,
    refreshInterval: autoRefreshInterval
  });

  return (
    <div className="space-y-4">
      {/* Header with refresh controls */}
      {(showRefreshButton || showLastUpdated) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showLastUpdated && lastUpdated && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>
                  Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </span>
              </div>
            )}
            {needsRefresh && (
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span>Data may be stale</span>
              </div>
            )}
          </div>
          
          {showRefreshButton && (
            <button
              onClick={() => forceRefresh()}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">
                Failed to load analytics
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => refresh()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state with zeros */}
      {loading && !data && (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500">Loading analytics...</p>
            </div>
          </div>
          {/* Show zeros while loading */}
          {children(
            {
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
              totalUsers: 0
            },
            true
          )}
        </div>
      )}

      {/* Data display */}
      {!loading && data && children(data, false)}
      
      {/* No data state */}
      {!loading && !data && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                No analytics data available
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Analytics data will be generated as activity occurs in the system.
              </p>
            </div>
            <button
              onClick={() => forceRefresh()}
              className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Calculate Analytics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple analytics card with loading state
 */
interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  loading?: boolean;
  trend?: string;
  trendColor?: 'green' | 'red' | 'gray';
}

export function AnalyticsCard({
  title,
  value,
  subtitle,
  loading,
  trend,
  trendColor = 'gray'
}: AnalyticsCardProps) {
  const trendColors = {
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
          {subtitle && <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>}
        </div>
      ) : (
        <>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm mt-2 ${trendColors[trendColor]}`}>
              {trend}
            </p>
          )}
        </>
      )}
    </div>
  );
}
