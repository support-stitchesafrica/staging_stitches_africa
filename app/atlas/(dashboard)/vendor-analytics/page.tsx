'use client';

import { UnifiedAnalyticsDashboard } from '@/components/atlas/unified-analytics/UnifiedAnalyticsDashboard';

/**
 * Vendor Analytics page
 * Displays consolidated vendor performance metrics
 */
export default function VendorAnalyticsPage() {
  return (
    <UnifiedAnalyticsDashboard activeSection="vendor" />
  );
}