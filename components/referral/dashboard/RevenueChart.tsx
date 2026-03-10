
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import
{
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

interface RevenueChartProps
{
    data: {
        month: string;
        revenue: number;
        referrals?: number;
    }[];
    isLoading?: boolean;
    currency?: string;
}


export const RevenueChart: React.FC<RevenueChartProps> = ({
    data,
    isLoading = false,
    currency = 'USD',
}) =>
{
    
    const stats = useMemo(() =>
    {
        const total = data.reduce((sum, item) => sum + item.revenue, 0);
        const average = data.length > 0 ? total / data.length : 0;
        const highest = data.length > 0 ? Math.max(...data.map(item => item.revenue)) : 0;

        return { total, average, highest };
    }, [data]);

   
    const formatCurrency = (value: number) =>
    {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    
    const chartConfig = {
        revenue: {
            label: 'Revenue',
            color: 'hsl(var(--chart-2))',
        },
    };

    
    const CustomTooltip = ({ active, payload }: any) =>
    {
        if (!active || !payload || !payload.length)
        {
            return null;
        }

        const data = payload[0].payload;

        return (
            <div className="border-border/50 bg-background rounded-lg border px-3 py-2 shadow-xl">
                <div className="space-y-1.5">
                    <p className="text-sm font-medium">{data.month}</p>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground text-xs">Revenue:</span>
                            <span className="text-foreground font-mono font-medium">
                                {formatCurrency(data.revenue)}
                            </span>
                        </div>
                        {data.referrals !== undefined && (
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground text-xs">Referrals:</span>
                                <span className="text-foreground font-mono font-medium">
                                    {data.referrals}
                                </span>
                            </div>
                        )}
                        {data.referrals !== undefined && data.referrals > 0 && (
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground text-xs">Avg per referral:</span>
                                <span className="text-foreground font-mono font-medium">
                                    {formatCurrency(data.revenue / data.referrals)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className="w-full bg-white border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <span className="truncate">Revenue Overview</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Monthly revenue generated from referrals
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
                {isLoading ? (
                    <div className="flex h-[250px] sm:h-[300px] items-center justify-center">
                        <div className="text-muted-foreground text-xs sm:text-sm">Loading chart data...</div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex h-[250px] sm:h-[300px] items-center justify-center">
                        <div className="text-center px-4">
                            <p className="text-muted-foreground text-xs sm:text-sm">No revenue data available</p>
                            <p className="text-muted-foreground text-xs mt-1">
                                Revenue will appear when your referrals make purchases
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Summary Stats - Requirement: 5.4 */}
                        <div className="mb-3 sm:mb-4 grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="space-y-0.5 sm:space-y-1">
                                <p className="text-muted-foreground text-[10px] sm:text-xs">Total Revenue</p>
                                <p className="text-sm sm:text-lg md:text-xl font-bold truncate">{formatCurrency(stats.total)}</p>
                            </div>
                            <div className="space-y-0.5 sm:space-y-1">
                                <p className="text-muted-foreground text-[10px] sm:text-xs">Monthly Avg</p>
                                <p className="text-sm sm:text-lg md:text-xl font-bold truncate">{formatCurrency(stats.average)}</p>
                            </div>
                            <div className="space-y-0.5 sm:space-y-1">
                                <p className="text-muted-foreground text-[10px] sm:text-xs">Highest</p>
                                <p className="text-sm sm:text-lg md:text-xl font-bold truncate">{formatCurrency(stats.highest)}</p>
                            </div>
                        </div>

                        {/* Bar Chart - Requirement: 5.2, 5.5 */}
                        <div className="w-full overflow-hidden">
                            <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full min-w-0">
                                <BarChart
                                    data={data}
                                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(value) =>
                                        {
                                            // Format month abbreviation (e.g., "Jan 2024" -> "Jan")
                                            return value.split(' ')[0];
                                        }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(value) =>
                                        {
                                            // Format large numbers (e.g., 1000 -> 1K)
                                            if (value >= 1000)
                                            {
                                                return `$${(value / 1000).toFixed(0)}K`;
                                            }
                                            return `$${value}`;
                                        }}
                                    />
                                    {/* Custom Tooltip - Requirement: 5.4 */}
                                    <ChartTooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="revenue"
                                        fill="var(--color-revenue)"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
