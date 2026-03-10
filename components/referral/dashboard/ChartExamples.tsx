/**
 * Chart Components Usage Examples
 * This file demonstrates how to use the ReferralGrowthChart and RevenueChart components
 */

'use client';

import React from 'react';
import { ReferralGrowthChart } from './ReferralGrowthChart';
import { RevenueChart } from './RevenueChart';
import { DateRange } from '@/lib/referral/types';

/**
 * Example usage of chart components
 */
export const ChartExamples: React.FC = () =>
{
    // Sample data for ReferralGrowthChart
    const growthData = [
        { date: '2024-01-01', signups: 5 },
        { date: '2024-01-02', signups: 8 },
        { date: '2024-01-03', signups: 12 },
        { date: '2024-01-04', signups: 7 },
        { date: '2024-01-05', signups: 15 },
        { date: '2024-01-06', signups: 20 },
        { date: '2024-01-07', signups: 18 },
    ];

    // Sample data for RevenueChart
    const revenueData = [
        { month: 'Jan 2024', revenue: 1250, referrals: 25 },
        { month: 'Feb 2024', revenue: 1800, referrals: 32 },
        { month: 'Mar 2024', revenue: 2100, referrals: 38 },
        { month: 'Apr 2024', revenue: 1950, referrals: 35 },
        { month: 'May 2024', revenue: 2400, referrals: 42 },
        { month: 'Jun 2024', revenue: 2800, referrals: 48 },
    ];

    const handleRangeChange = (range: DateRange) =>
    {
        console.log('Date range changed to:', range);
        // Fetch new data based on the selected range
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h2 className="text-2xl font-bold mb-4">Chart Components Examples</h2>
                <p className="text-muted-foreground mb-6">
                    Below are examples of the ReferralGrowthChart and RevenueChart components
                </p>
            </div>

            {/* Referral Growth Chart Example */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Referral Growth Chart</h3>
                <ReferralGrowthChart
                    data={growthData}
                    onRangeChange={handleRangeChange}
                />
            </div>

            {/* Revenue Chart Example */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Revenue Chart</h3>
                <RevenueChart
                    data={revenueData}
                    currency="USD"
                />
            </div>

            {/* Loading State Example */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Loading State</h3>
                <ReferralGrowthChart
                    data={[]}
                    isLoading={true}
                />
            </div>

            {/* Empty State Example */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Empty State</h3>
                <RevenueChart
                    data={[]}
                    isLoading={false}
                />
            </div>
        </div>
    );
};
