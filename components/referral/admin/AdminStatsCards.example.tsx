/**
 * AdminStatsCards Example Usage
 * Demonstrates how to use the AdminStatsCards component in an admin dashboard
 */

'use client';

import React, { memo } from 'react';
import { AdminStatsCards } from './AdminStatsCards';
import { useAuth } from '@/contexts/ReferralAuthContext';

/**
 * Example 1: Basic Usage in Admin Dashboard
 */
export function AdminDashboardExample()
{
    const { user, getIdToken } = useAuth();
    const [token, setToken] = React.useState<string>('');

    React.useEffect(() =>
    {
        const fetchToken = async () =>
        {
            if (user)
            {
                const idToken = await getIdToken();
                setToken(idToken);
            }
        };
        fetchToken();
    }, [user, getIdToken]);

    if (!token)
    {
        return <div>Loading authentication...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of the referral program performance
                </p>
            </div>

            <AdminStatsCards token={token} />

            {/* Other admin dashboard components would go here */}
        </div>
    );
}

export const MemoizedAdminDashboard = memo(AdminDashboard);

/**
 * Example 2: With Refresh Button
 */
export function AdminDashboardWithRefresh()
{
    const { user, getIdToken } = useAuth();
    const [token, setToken] = React.useState<string>('');
    const [refreshKey, setRefreshKey] = React.useState(0);

    React.useEffect(() =>
    {
        const fetchToken = async () =>
        {
            if (user)
            {
                const idToken = await getIdToken();
                setToken(idToken);
            }
        };
        fetchToken();
    }, [user, getIdToken]);

    const handleRefresh = () =>
    {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Overview of the referral program performance
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                    Refresh Stats
                </button>
            </div>

            <AdminStatsCards key={refreshKey} token={token} />
        </div>
    );
}

/**
 * Example 3: With Date Range Filter (Future Enhancement)
 */
export function AdminDashboardWithFilters()
{
    const { user, getIdToken } = useAuth();
    const [token, setToken] = React.useState<string>('');
    const [dateRange, setDateRange] = React.useState('30days');

    React.useEffect(() =>
    {
        const fetchToken = async () =>
        {
            if (user)
            {
                const idToken = await getIdToken();
                setToken(idToken);
            }
        };
        fetchToken();
    }, [user, getIdToken]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Overview of the referral program performance
                    </p>
                </div>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-4 py-2 border rounded-md"
                >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="all">All Time</option>
                </select>
            </div>

            <AdminStatsCards token={token} />

            <p className="text-xs text-muted-foreground">
                Note: Date range filtering will be implemented in a future update
            </p>
        </div>
    );
}

/**
 * Example 4: Standalone Component Test
 */
export function AdminStatsCardsStandalone()
{
    // For testing purposes, you can use a mock token
    // In production, always use a real Firebase auth token
    const mockToken = 'your-firebase-auth-token-here';

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-2xl font-bold">AdminStatsCards Component Test</h2>
            <AdminStatsCards token={mockToken} />
        </div>
    );
}
