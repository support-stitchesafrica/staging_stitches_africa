'use client';

import { OptimizedCollectionsAnalytics } from '@/components/analytics/OptimizedCollectionsAnalytics';
import { DateRangeProvider } from '@/contexts/DateRangeContext';

/**
 * Collections Analytics Page for Atlas Dashboard
 * 
 * This page provides optimized analytics for product collections with:
 * - Synchronized data between web hits and collections analytics
 * - Fast loading with intelligent caching
 * - Real-time data integrity monitoring
 * - Performance metrics and optimization
 */
export default function CollectionsAnalyticsPage() {
  return (
    <DateRangeProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Collections Analytics</h1>
          <p className="text-gray-600 mt-2">
            Optimized analytics with synchronized data and fast loading for collection performance tracking
          </p>
        </div>
        
        <OptimizedCollectionsAnalytics 
          showPerformanceMetrics={true}
          autoRefresh={true}
          refreshInterval={300}
        />
      </div>
    </DateRangeProvider>
  );
}