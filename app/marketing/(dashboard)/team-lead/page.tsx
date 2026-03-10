/**
 * Team Lead Dashboard Page
 * Dedicated page for team lead role dashboard
 */

'use client';

import TeamLeadDashboard from '@/components/marketing/dashboards/TeamLeadDashboard';
import MarketingAuthGuard from '@/components/marketing/MarketingAuthGuard';

export default function TeamLeadDashboardPage()
{
    return (
        <MarketingAuthGuard requiredRole="team_lead">
            <TeamLeadDashboard />
        </MarketingAuthGuard>
    );
}