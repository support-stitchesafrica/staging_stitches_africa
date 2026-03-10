/**
 * Referral Growth Chart Component
 * Displays line chart showing daily sign-ups over time with date range filter
 * Requirements: 5.1, 5.3, 5.4, 5.5
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import
{
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import
{
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { DateRange } from '@/lib/referral/types';

interface ReferralGrowthChartProps
{
    data: {
        date: string;
        signups: number;
    }[];
    isLoading?: boolean;
    onRangeChange?: (range: DateRange) => void;
}


export const ReferralGrowthChart: React.FC<ReferralGrowthChartProps> = ({
    data,
    isLoading = false,
    onRangeChange,
}) =>
{
    const [dateRange, setDateRange] = useState<DateRange>('30days');

    /**
     * Handle date range change
     * Requirement: 5.3 - Add date range filter (7, 30, 90 days, all time)
     */
    const handleRangeChange = (value: string) =>
    {
        const range = value as DateRange;
        setDateRange(range);
        onRangeChange?.(range);
    };

    /**
     * Calculate growth percentage
     * Requirement: 5.4 - Display detailed information
     */
    const growthPercentage = useMemo(() =>
    {
        if (data.length < 2) return 0;

        const midPoint = Math.floor(data.length / 2);
        const firstHalf = data.slice(0, midPoint);
        const secondHalf = data.slice(midPoint);

        const firstHalfTotal = firstHalf.reduce((sum, item) => sum + item.signups, 0);
        const secondHalfTotal = secondHalf.reduce((sum, item) => sum + item.signups, 0);

        if (firstHalfTotal === 0) return secondHalfTotal > 0 ? 100 : 0;

        return ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
    }, [data]);

    /**
     * Calculate total signups
     */
    const totalSignups = useMemo(() =>
    {
        return data.reduce((sum, item) => sum + item.signups, 0);
    }, [data]);

    /**
     * Chart configuration
     * Requirement: 5.5 - Use modern charting library with smooth animations
     */
    const chartConfig = {
        signups: {
            label: 'Sign-ups',
            color: 'hsl(var(--chart-1))',
        },
    };

    return (
        <Card className="w-full bg-white border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
                            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                            </div>
                            <span className="truncate">Referral Growth</span>
                        </CardTitle>
                        <CardDescription className="text-gray-600 text-xs sm:text-sm">
                            Daily sign-ups over the selected period
                        </CardDescription>
                    </div>
                    {/* Date Range Filter - Requirement: 5.3 */}
                    <Select value={dateRange} onValueChange={handleRangeChange}>
                        <SelectTrigger className="w-full sm:w-[140px]">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">Last 7 days</SelectItem>
                            <SelectItem value="30days">Last 30 days</SelectItem>
                            <SelectItem value="90days">Last 90 days</SelectItem>
                            <SelectItem value="all">All time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
                {isLoading ? (
                    <div className="flex h-[250px] sm:h-[300px] items-center justify-center">
                        <div className="text-muted-foreground text-xs sm:text-sm">Loading chart data...</div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex h-[250px] sm:h-[300px] items-center justify-center">
                        <div className="text-center px-4">
                            <p className="text-muted-foreground text-xs sm:text-sm">No data available</p>
                            <p className="text-muted-foreground text-xs mt-1">
                                Start referring to see your growth
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Summary Stats - Requirement: 5.4 */}
                        <div className="mb-3 sm:mb-4 grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-0.5 sm:space-y-1">
                                <p className="text-gray-500 text-xs font-medium">Total Sign-ups</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalSignups}</p>
                            </div>
                            <div className="space-y-0.5 sm:space-y-1">
                                <p className="text-muted-foreground text-xs">Growth Rate</p>
                                <p className={`text-xl sm:text-2xl font-bold ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        {/* Line Chart - Requirement: 5.1, 5.5 */}
                        <div className="w-full overflow-hidden">
                            <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full min-w-0">
                                <LineChart
                                    data={data}
                                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(value) =>
                                        {
                                            const date = new Date(value);
                                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tick={{ fontSize: 11 }}
                                        allowDecimals={false}
                                    />
                                    {/* Tooltip - Requirement: 5.4 */}
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(value) =>
                                                {
                                                    const date = new Date(value);
                                                    return date.toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    });
                                                }}
                                            />
                                        }
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="signups"
                                        stroke="var(--color-signups)"
                                        strokeWidth={2}
                                        dot={{
                                            fill: 'var(--color-signups)',
                                            r: 4,
                                        }}
                                        activeDot={{
                                            r: 6,
                                        }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
