/**
 * Referral Analytics Page for Atlas Dashboard
 * Comprehensive referral program analytics with real-time data
 * Optimized with performance monitoring and caching
 */

'use client';

import React, { Suspense, useEffect } from 'react';
import { ReferralAnalyticsSection } from '@/components/atlas/unified-analytics/ReferralAnalyticsSection';
import { useDateRange } from '@/contexts/DateRangeContext';
import { useAtlasAuth } from '@/contexts/AtlasAuthContext';
import { LoadingSpinner } from '@/components/ui/optimized-loader';
import { useAnalytics } from '@/lib/analytics';
import { usePerformanceMonitor } from '@/lib/utils/performance-utils';
import { preloadData, cacheKeys } from '@/lib/utils/cache-utils';
import { ReferralAnalyticsService } from '@/lib/atlas/unified-analytics/services/referral-analytics-service';

// Optimized loading component with better skeleton
const ReferralAnalyticsLoading = React.memo(() => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-96"></div>
    </div>
    
    {/* Metrics cards skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
    
    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
    
    {/* Conversion metrics skeleton */}
    <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
));

ReferralAnalyticsLoading.displayName = 'ReferralAnalyticsLoading';

export default function ReferralAnalyticsPage() {
  // Performance monitoring
  usePerformanceMonitor('ReferralAnalyticsPage');
  
  const { dateRange } = useDateRange();
  const { atlasUser } = useAtlasAuth();
  const { trackPageView } = useAnalytics('ReferralAnalyticsPage');

  // Track page view with performance monitoring
  useEffect(() => {
    trackPageView('/atlas/referral-analytics', 'Atlas Referral Analytics');
  }, [trackPageView]);

  // Convert date range to the format expected by the service
  const analyticsDateRange = React.useMemo(() => ({
    from: dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: dateRange.end || new Date()
  }), [dateRange.start, dateRange.end]);

  // Preload critical data for better performance
  useEffect(() => {
    if (atlasUser && analyticsDateRange) {
      const cacheKey = cacheKeys.analytics('referral', `${analyticsDateRange.from.getTime()}-${analyticsDateRange.to.getTime()}`);
      
      // Preload data in background
      preloadData(
        cacheKey,
        () => ReferralAnalyticsService.getReferralAnalytics(analyticsDateRange),
        3 * 60 * 1000 // 3 minutes cache
      );
    }
  }, [atlasUser, analyticsDateRange]);

  if (!atlasUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}

      {/* Analytics Section with optimized loading */}
      <Suspense fallback={<ReferralAnalyticsLoading />}>
        <ReferralAnalyticsSection
          dateRange={analyticsDateRange}
          userRole={atlasUser.role}
        />
      </Suspense>
    </div>
  );
}