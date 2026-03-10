/**
 * Marketing Dashboard - Team Management Page
 * Team management functionality for team leads
 */

'use client';

import { TeamLeadGuard } from '@/components/marketing/MarketingAuthGuard';
import TeamLeadDashboard from '@/components/marketing/dashboards/TeamLeadDashboard';

export default function TeamManagementPage() {
  return (
    <TeamLeadGuard>
      <TeamLeadDashboard />
    </TeamLeadGuard>
  );
}
