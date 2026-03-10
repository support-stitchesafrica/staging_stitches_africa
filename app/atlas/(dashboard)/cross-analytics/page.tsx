'use client';

import { UnifiedAnalyticsDashboard } from '@/components/atlas/unified-analytics/UnifiedAnalyticsDashboard';

/**
 * Cross Analytics page
 * Displays cross-analytics insights and correlations
 */
export default function CrossAnalyticsPage() {
  return (
    <UnifiedAnalyticsDashboard activeSection="cross-analytics" />
  );
}