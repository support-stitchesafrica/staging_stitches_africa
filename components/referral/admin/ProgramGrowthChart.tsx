/**
 * Program Growth Chart Component
 * Displays multi-line chart showing referrers, referees, and revenue over time
 * Requirement: 14.1
 */

'use client';

import React, { useState } from 'react';
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
        ChartLegend,
        ChartLegendContent,
    } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { DateRange } from '@/lib/referral/types';

interface ProgramGrowthChartProps
{
    data: {
        labels: string[];
        referees: number[];
        purchases: number[];
        revenue: number[];
        activeReferrers: number[];
    };
    isLoading?: boolean;
    onRangeChange?: (range: DateRange) => void;
}

/**
 * ProgramGrowthChart Component
 * Displays a multi-line chart showing program growth metrics over time
 * Requirement: 14.1 - Display chart showing referral growth over time
 */
export const ProgramGrowthChart: React.FC<ProgramGrowthChartProps> = ({
    data,
    isLoading = false,
    onRangeChange,
}) =>
{
    const [dateRange, setDateRange] = useState<DateRange>('30days');
    const [selectedMetric, setSelectedMetric] = useState<'all' | 'referrers' | 'referees' | 'revenue'>('all');

    /**
     * Handle date range change
     */
    const handleRangeChange = (value: string) =>
    {
        const range = value as DateRange;
        setDateRange(range);
        onRangeChange?.(range);
    };

    /**
     * Transform data for chart
     */
    const chartData = React.useMemo(() =>
    {
        if (!data.labels || data.labels.length === 0) return [];

        return data.labels.map((label, index) => ({
            date: label,
            referrers: data.activeReferrers[index] || 0,
            referees: data.referees[index] || 0,
            revenue: data.revenue[index] || 0,
            purchases: data.purchases[index] || 0,
        }));
    }, [data]);

    /**
     * Calculate summary statistics
     */
    const stats = React.useMemo(() =>
    {
        const totalReferrers = data.activeReferrers.reduce((sum, val) => sum + val, 0);
        const totalReferees = data.referees.reduce((sum, val) => sum + val, 0);
        const totalRevenue = data.revenue.reduce((sum, val) => sum + val, 0);
        const totalPurchases = data.purchases.reduce((sum, val) => sum + val, 0);

        return {
            totalReferrers,
            totalReferees,
            totalRevenue,
            totalPurchases,
            avgRevenuePerDay: chartData.length > 0 ? totalRevenue / chartData.length : 0,
        };
    }, [data, chartData.length]);

    /**
     * Format currency value
     */
    const formatCurrency = (value: number) =>
    {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    /**
     * Chart configuration
     */
    const chartConfig = {
        referrers: {
            label: 'Active Referrers',
            color: 'hsl(var(--chart-1))',
        },
        referees: {
            label: 'New Referees',
            color: 'hsl(var(--chart-2))',
        },
        revenue: {
            label: 'Revenue ($)',
            color: 'hsl(var(--chart-3))',
        },
    };

    /**
     * Custom tooltip content
     */
    const CustomTooltip = ({ active, payload }: any) =>
    {
        if (!active || !payload || !payload.length)
        {
            return null;
        }

        const data = payload[0].payload;
        const date = new Date(data.date);

        return (
            <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl">
                <div className="space-y-1.5">
                    <p className="text-sm font-medium">
                        {date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </p>
                    <div className="space-y-1">
                        {(selectedMetric === 'all' || selectedMetric === 'referrers') && (
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                                    <span className="text-xs text-muted-foreground">Active Referrers:</span>
                                </div>
                                <span className="font-mono text-sm font-medium">{data.referrers}</span>
                            </div>
                        )}
                        {(selectedMetric === 'all' || selectedMetric === 'referees') && (
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                                    <span className="text-xs text-muted-foreground">New Referees:</span>
                                </div>
                                <span className="font-mono text-sm font-medium">{data.referees}</span>
                            </div>
                        )}
                        {(selectedMetric === 'all' || selectedMetric === 'revenue') && (
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
                                    <span className="text-xs text-muted-foreground">Revenue:</span>
                                </div>
                                <span className="font-mono text-sm font-medium">{formatCurrency(data.revenue)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/50">
                            <span className="text-xs text-muted-foreground">Purchases:</span>
                            <span className="font-mono text-sm font-medium">{data.purchases}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Program Growth
                        </CardTitle>
                        <CardDescription>
                            Track referrers, referees, and revenue trends over time
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {/* Metric Filter */}
                        <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Select metric" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Metrics</SelectItem>
                                <SelectItem value="referrers">Referrers</SelectItem>
                                <SelectItem value="referees">Referees</SelectItem>
                                <SelectItem value="revenue">Revenue</SelectItem>
                            </SelectContent>
                        </Select>
                        {/* Date Range Filter */}
                        <Select value={dateRange} onValueChange={handleRangeChange}>
                            <SelectTrigger className="w-[140px]">
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
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-[350px] items-center justify-center">
                        <div className="text-sm text-muted-foreground">Loading chart data...</div>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex h-[350px] items-center justify-center">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">No data available</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Data will appear as the program grows
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Summary Stats */}
                        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Total Referrers</p>
                                <p className="text-xl font-bold">{stats.totalReferrers}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Total Referees</p>
                                <p className="text-xl font-bold">{stats.totalReferees}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Total Revenue</p>
                                <p className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Avg Revenue/Day</p>
                                <p className="text-xl font-bold">{formatCurrency(stats.avgRevenuePerDay)}</p>
                            </div>
                        </div>

                        {/* Multi-Line Chart */}
                        <ChartContainer config={chartConfig} className="h-[350px] w-full">
                            <LineChart
                                data={chartData}
                                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
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
                                    allowDecimals={false}
                                />
                                <ChartTooltip content={<CustomTooltip />} />
                                <ChartLegend content={<ChartLegendContent />} />

                                {/* Conditional rendering based on selected metric */}
                                {(selectedMetric === 'all' || selectedMetric === 'referrers') && (
                                    <Line
                                        type="monotone"
                                        dataKey="referrers"
                                        stroke="var(--color-referrers)"
                                        strokeWidth={2}
                                        dot={{ fill: 'var(--color-referrers)', r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                )}
                                {(selectedMetric === 'all' || selectedMetric === 'referees') && (
                                    <Line
                                        type="monotone"
                                        dataKey="referees"
                                        stroke="var(--color-referees)"
                                        strokeWidth={2}
                                        dot={{ fill: 'var(--color-referees)', r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                )}
                                {(selectedMetric === 'all' || selectedMetric === 'revenue') && (
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="var(--color-revenue)"
                                        strokeWidth={2}
                                        dot={{ fill: 'var(--color-revenue)', r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                )}
                            </LineChart>
                        </ChartContainer>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
