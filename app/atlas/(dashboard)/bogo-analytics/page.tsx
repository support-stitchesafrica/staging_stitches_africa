'use client';

import { UnifiedAnalyticsDashboard } from '@/components/atlas/unified-analytics/UnifiedAnalyticsDashboard';

/**
 * BOGO Analytics page
 * Displays BOGO campaign performance and insights
 */
export default function BogoAnalyticsPage() {
  return (
    <UnifiedAnalyticsDashboard activeSection="bogo" />
  );
}