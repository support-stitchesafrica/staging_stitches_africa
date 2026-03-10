/**
 * Referral Analytics Section for Atlas Dashboard
 * Real-time referral analytics with optimized performance
 * Enhanced with caching and performance optimizations
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Download, 
  DollarSign, 
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink
} from 'lucide-react';
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
import { 
  ReferralAnalyticsService, 
  ReferralAnalyticsData, 
  TopReferrer,
  DateRange 
} from '@/lib/atlas/unified-analytics/services/referral-analytics-service';
import { AtlasRole } from '@/lib/atlas/types';
import { LoadingSpinner, AnalyticsCardSkeleton } from '@/components/ui/optimized-loader';
import { useCachedData, cacheManager, cacheKeys } from '@/lib/utils/cache-utils';
import { usePerformanceMonitor, performanceMonitor } from '@/lib/utils/performance-utils';
import { useAnalytics } from '@/lib/analytics';
import { useRouter } from 'next/navigation';

export interface ReferralAnalyticsSectionProps {
  dateRange: DateRange;
  userRole: AtlasRole;
}

// Optimized metric card component with React.memo and performance tracking
const MetricCard = React.memo<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}>(({ title, value, change, icon, color, loading }) => {
  const trackRender = performanceMonitor.trackComponentRender('MetricCard');
  
  useEffect(() => {
    return trackRender;
  }, [trackRender]);

  if (loading) {
    return <AnalyticsCardSkeleton />;
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
            </div>
          </div>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.change === nextProps.change &&
    prevProps.loading === nextProps.loading
  );
});

MetricCard.displayName = 'MetricCard';

// Optimized chart component with lazy loading and memoization
const OptimizedChart = React.memo<{
  data: any[];
  type: 'line' | 'bar';
  color: string;
  loading?: boolean;
}>(({ data, type, color, loading }) => {
  const trackRender = performanceMonitor.trackComponentRender('OptimizedChart');
  
  useEffect(() => {
    return trackRender;
  }, [trackRender]);

  if (loading || !data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      {type === 'line' ? (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      ) : (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill={color} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.type === nextProps.type &&
    prevProps.color === nextProps.color &&
    prevProps.loading === nextProps.loading
  );
});

OptimizedChart.displayName = 'OptimizedChart';

MetricCard.displayName = 'MetricCard';

// Top referrers table component
const TopReferrersTable = React.memo<{
  referrers: TopReferrer[];
  loading: boolean;
  onViewDetails: (referrerId: string) => void;
}>(({ referrers, loading, onViewDetails }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {referrers.map((referrer, index) => (
        <div
          key={referrer.id}
          className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors duration-150 cursor-pointer"
          onClick={() => onViewDetails(referrer.id)}
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">
                  #{index + 1}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {referrer.fullName}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {referrer.email}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {referrer.referralCode}
                </Badge>
                <span className="text-xs text-gray-400">
                  {referrer.totalReferrals} referrals
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                ${referrer.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {referrer.conversionRate.toFixed(1)}% conversion
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
});

TopReferrersTable.displayName = 'TopReferrersTable';

export const ReferralAnalyticsSection: React.FC<ReferralAnalyticsSectionProps> = React.memo(({
  dateRange
}) => {
  // Performance monitoring
  usePerformanceMonitor('ReferralAnalyticsSection');
  const trackRender = performanceMonitor.trackComponentRender('ReferralAnalyticsSection');
  
  const router = useRouter();
  const { trackInteraction } = useAnalytics('ReferralAnalyticsSection');
  const [selectedChart, setSelectedChart] = useState<'referrals' | 'clicks' | 'downloads' | 'revenue'>('referrals');
  const [lastValidData, setLastValidData] = useState<ReferralAnalyticsData | null>(null);

  // Generate optimized cache key
  const cacheKey = useMemo(() => 
    cacheKeys.analytics('referral', `${dateRange.from.getTime()}-${dateRange.to.getTime()}`),
    [dateRange]
  );

  // Use cached data with optimized fetcher
  const {
    data: analyticsData,
    loading,
    error,
    refetch
  } = useCachedData(
    cacheKey,
    useCallback(() => ReferralAnalyticsService.getReferralAnalytics(dateRange), [dateRange]),
    3 * 60 * 1000 // 3 minutes cache for faster updates
  );

  // Performance tracking
  useEffect(() => {
    return trackRender;
  }, [trackRender]);

  // Keep track of last valid data to prevent disappearing with optimized comparison
  useEffect(() => {
    if (analyticsData && !loading && JSON.stringify(analyticsData) !== JSON.stringify(lastValidData)) {
      setLastValidData(analyticsData);
    }
  }, [analyticsData, loading, lastValidData]);

  // Use last valid data if current data is null but we had data before
  const displayData = analyticsData || lastValidData;

  // Optimized real-time updates with debouncing and performance considerations
  useEffect(() => {
    if (!displayData || loading) return;

    let isSubscribed = true;
    let updateTimeout: NodeJS.Timeout;
    
    const unsubscribe = ReferralAnalyticsService.subscribeToReferralAnalytics(
      dateRange,
      (newData) => {
        // Only update if component is still mounted and we have valid data
        if (isSubscribed && newData) {
          // Debounced update with performance optimization
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => {
            if (isSubscribed) {
              // Clear cache before refetch for fresh data
              cacheManager.delete(cacheKey);
              refetch();
            }
          }, 2000); // 2 second debounce
        }
      }
    );

    return () => {
      isSubscribed = false;
      clearTimeout(updateTimeout);
      unsubscribe();
    };
  }, [dateRange, cacheKey, refetch]); // Optimized dependencies

  // Memoized chart data with performance optimization
  const chartData = useMemo(() => {
    if (!displayData) return [];

    const data = (() => {
      switch (selectedChart) {
        case 'referrals':
          return displayData.referralsByDate;
        case 'clicks':
          return displayData.clicksByDate;
        case 'downloads':
          return displayData.downloadsByDate;
        case 'revenue':
          return displayData.revenueByDate;
        default:
          return [];
      }
    })();

    // Optimize data for chart rendering
    return data.slice(0, 30); // Limit to last 30 data points for performance
  }, [displayData, selectedChart]);

  // Optimized event handlers with useCallback
  const handleViewReferrerDetails = useCallback((referrerId: string) => {
    trackInteraction('referrer_details_button', 'click');
    router.push(`/atlas/referral-analytics/referrer/${referrerId}`);
  }, [router, trackInteraction]);

  const handleChartChange = useCallback((chartType: 'referrals' | 'clicks' | 'downloads' | 'revenue') => {
    setSelectedChart(chartType);
    trackInteraction('chart_type_button', 'click');
  }, [trackInteraction]);

  const handleViewAllReferrers = useCallback(() => {
    trackInteraction('view_all_referrers_button', 'click');
    router.push('/atlas/referral-analytics/referrers');
  }, [router, trackInteraction]);

  // Memoized top referrers with performance optimization
  const topReferrersDisplay = useMemo(() => {
    if (!displayData?.topReferrers) return [];
    return displayData.topReferrers.slice(0, 5); // Show only top 5 for performance
  }, [displayData?.topReferrers]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Referral Analytics
          </h3>
          <p className="text-gray-600 mb-4">
            {error.message || 'Failed to load referral analytics data'}
          </p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Referral Analytics</h2>
          <p className="text-gray-600">
            Real-time insights into your referral program performance
          </p>
        </div>
        <Button
          onClick={handleViewAllReferrers}
          variant="outline"
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          View All Referrers
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <MetricCard
          title="Total Referrers"
          value={displayData?.totalReferrers || 0}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
          loading={loading}
        />
        <MetricCard
          title="Total Referees"
          value={displayData?.totalReferees || 0}
          icon={<UserPlus className="h-5 w-5 text-green-600" />}
          color="bg-green-100"
          loading={loading}
        />
        <MetricCard
          title="Total Clicks"
          value={displayData?.totalClicks || 0}
          icon={<Eye className="h-5 w-5 text-indigo-600" />}
          color="bg-indigo-100"
          loading={loading}
        />
        <MetricCard
          title="Total Downloads"
          value={displayData?.totalDownloads || 0}
          icon={<Download className="h-5 w-5 text-purple-600" />}
          color="bg-purple-100"
          loading={loading}
        />
        <MetricCard
          title="Total Revenue"
          value={displayData ? `$${displayData.totalRevenue.toLocaleString()}` : '$0'}
          icon={<DollarSign className="h-5 w-5 text-orange-600" />}
          color="bg-orange-100"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Trends Over Time
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant={selectedChart === 'referrals' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChartChange('referrals')}
                >
                  Referrals
                </Button>
                <Button
                  variant={selectedChart === 'clicks' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChartChange('clicks')}
                >
                  Clicks
                </Button>
                <Button
                  variant={selectedChart === 'downloads' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChartChange('downloads')}
                >
                  Downloads
                </Button>
                <Button
                  variant={selectedChart === 'revenue' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChartChange('revenue')}
                >
                  Revenue
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <OptimizedChart
              data={chartData}
              type="line"
              color={
                selectedChart === 'referrals' ? '#3b82f6' :
                selectedChart === 'clicks' ? '#6366f1' :
                selectedChart === 'downloads' ? '#8b5cf6' : '#f59e0b'
              }
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Top Referrers
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/atlas/referral-analytics/referrers')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TopReferrersTable
              referrers={topReferrersDisplay}
              loading={loading}
              onViewDetails={handleViewReferrerDetails}
            />
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Conversion Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {displayData?.conversionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Overall Conversion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {displayData?.totalReferees && displayData?.totalReferrers 
                    ? (displayData.totalReferees / displayData.totalReferrers).toFixed(1)
                    : '0'
                  }
                </div>
                <div className="text-sm text-gray-600">Avg Referrals per Referrer</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {displayData?.totalRevenue && displayData?.totalReferees
                    ? `$${(displayData.totalRevenue / displayData.totalReferees).toFixed(0)}`
                    : '$0'
                  }
                </div>
                <div className="text-sm text-gray-600">Avg Revenue per Referee</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

ReferralAnalyticsSection.displayName = 'ReferralAnalyticsSection';