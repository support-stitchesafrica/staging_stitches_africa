/**
 * Team Member Dashboard Page
 * Dedicated page for team member role dashboard
 */

'use client';

import TeamMemberDashboard from '@/components/marketing/dashboards/TeamMemberDashboard';
import MarketingAuthGuard from '@/components/marketing/MarketingAuthGuard';

export default function TeamMemberDashboardPage()
{
    return (
        <MarketingAuthGuard requiredRole="team_member">
            <TeamMemberDashboard />
        </MarketingAuthGuard>
    );
}