'use client';

import { UnifiedAnalyticsDashboard } from '@/components/atlas/unified-analytics/UnifiedAnalyticsDashboard';

/**
 * Storefront Analytics page
 * Displays aggregated storefront performance data
 */
export default function StorefrontAnalyticsPage() {
  return (
    <UnifiedAnalyticsDashboard activeSection="storefront" />
  );
}