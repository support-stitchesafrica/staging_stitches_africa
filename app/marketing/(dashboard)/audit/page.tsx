/**
 * Marketing Dashboard Audit Page
 * Super Admin only - View and manage activity logs
 * Requirements: 13.1, 13.2
 */

'use client';

import { AuditDashboard } from '@/components/marketing/audit/AuditDashboard';
import { SuperAdminGuard } from '@/components/marketing/MarketingAuthGuard';

export default function AuditPage()
{
    return (
        <SuperAdminGuard>
            <div className="container mx-auto px-4 py-8">
                <AuditDashboard />
            </div>
        </SuperAdminGuard>
    );
}
