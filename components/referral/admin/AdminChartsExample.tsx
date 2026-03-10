/**
 * Admin Charts Example
 * Demonstrates how to use ProgramGrowthChart and TopPerformersTable components
 * This is an example file showing integration with the analytics API
 */

'use client';

import React, { useEffect, useState } from 'react';
import { ProgramGrowthChart } from './ProgramGrowthChart';
import { TopPerformersTable } from './TopPerformersTable';
import { DateRange } from '@/lib/referral/types';
import { toast } from 'sonner';

interface AdminChartsExampleProps
{
    token: string; // Firebase auth token
}

/**
 * Example component showing how to integrate the admin charts
 */
export const AdminChartsExample: React.FC<AdminChartsExampleProps> = ({ token }) =>
{
    const [chartData, setChartData] = useState<any>(null);
    const [topPerformers, setTopPerformers] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>('30days');

    /**
     * Fetch analytics data from API
     */
    const fetchAnalytics = async (range: DateRange) =>
    {
        try
        {
            setLoading(true);

            const response = await fetch(`/api/referral/admin/analytics?range=${range}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok)
            {
                throw new Error('Failed to fetch analytics');
            }

            const data = await response.json();

            if (data.success && data.analytics)
            {
                setChartData(data.analytics.chartData);
                setTopPerformers(data.analytics.topPerformers);
            }
        } catch (error: any)
        {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics', {
                description: error.message,
            });
        } finally
        {
            setLoading(false);
        }
    };

    /**
     * Initial load
     */
    useEffect(() =>
    {
        if (token)
        {
            fetchAnalytics(dateRange);
        }
    }, [token]);

    /**
     * Handle date range change
     */
    const handleRangeChange = (range: DateRange) =>
    {
        setDateRange(range);
        fetchAnalytics(range);
    };

    return (
        <div className="space-y-6">
            {/* Program Growth Chart */}
            <ProgramGrowthChart
                data={chartData || { labels: [], referees: [], purchases: [], revenue: [], activeReferrers: [] }}
                isLoading={loading}
                onRangeChange={handleRangeChange}
            />

            {/* Top Performers Table */}
            <TopPerformersTable
                topPerformersByReferrals={topPerformers?.byReferrals || []}
                topPerformersByRevenue={topPerformers?.byRevenue || []}
                isLoading={loading}
            />
        </div>
    );
};
