/**
 * BDM Dashboard Page
 * Dedicated page for BDM role dashboard
 */

'use client';

import BDMDashboard from '@/components/marketing/dashboards/BDMDashboard';
import MarketingAuthGuard from '@/components/marketing/MarketingAuthGuard';

export default function BDMDashboardPage()
{
    return (
        <MarketingAuthGuard requiredRole="bdm">
            <BDMDashboard />
        </MarketingAuthGuard>
    );
}