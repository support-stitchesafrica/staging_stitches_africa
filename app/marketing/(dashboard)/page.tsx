/**
 * Marketing Dashboard - Main Dashboard Page
 * Shows role-specific dashboard content with sidebar navigation
 */

'use client';

import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import MarketingAuthGuard from '@/components/marketing/MarketingAuthGuard';
import TeamMemberDashboard from '@/components/marketing/dashboards/TeamMemberDashboard';
import BDMDashboard from '@/components/marketing/dashboards/BDMDashboard';
import TeamLeadDashboard from '@/components/marketing/dashboards/TeamLeadDashboard';
import SuperAdminDashboard from '@/components/marketing/SuperAdminDashboard';

export default function MarketingDashboardPage()
{
    return (
        <MarketingAuthGuard>
            <DashboardContent />
        </MarketingAuthGuard>
    );
}

function DashboardContent()
{
    const { marketingUser } = useMarketingAuth();

    if (!marketingUser)
    {
        return <div>Loading...</div>;
    }

    // Render role-specific dashboard
    switch (marketingUser.role)
    {
        case 'super_admin':
            return <SuperAdminDashboard />;
        case 'team_lead':
            return <TeamLeadDashboard />;
        case 'bdm':
            return <BDMDashboard />;
        case 'team_member':
            return <TeamMemberDashboard />;
        default:
            return (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Welcome to Marketing Dashboard</h2>
                    <p className="text-gray-600">Your role-specific dashboard will appear here.</p>
                </div>
            );
    }
}