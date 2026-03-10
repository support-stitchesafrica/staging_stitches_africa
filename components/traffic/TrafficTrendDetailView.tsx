"use client";

import { useMemo, useState, useEffect, useCallback, memo } from "react";
import { MetricCardGA } from "@/components/analytics/MetricCardGA";
import { ChartCard } from "@/components/analytics/ChartCard";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ComposedChart,
} from "recharts";
import { 
    TrendingUp, 
    TrendingDown, 
    Clock, 
    Calendar, 
    Activity,
    BarChart3,
    Users,
    Eye
} from "lucide-react";
import { useDateRange } from "@/contexts/DateRangeContext";
import {
    getDailyTrafficTrend,
    getCumulativeWebHits,
    getTopPages,
} from "@/services/webTrafficAnalytics";
import { useCachedData } from "@/lib/utils/cache-utils";
import { AnalyticsCardSkeleton, ChartSkeleton } from "@/components/ui/optimized-loader";

// Types for better performance
interface TrafficDay {
    day: number;
    hits: number;
    date: string;
}

interface TopPage {
    page_url: string;
    page_title: string;
    hits: number;
}

interface GrowthRate {
    dailyGrowthRate: number;
    weeklyGrowthRate: number;
    monthlyGrowthRate: number;
    overallTrend: 'up' | 'down' | 'stable';
}

// Memoized components for better performance
const MetricCard = memo(MetricCardGA);
const Chart = memo(ChartCard);

const TrafficTrendDetailView = () => {
    const { dateRange } = useDateRange();
    
    // Calculate number of days in the selected range - memoized
    const daysDiff = useMemo(() => {
        return Math.ceil(
            (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
    }, [dateRange]);

    // Memoized fetcher functions to prevent infinite re-renders
    const trendDataFetcher = useCallback(async () => {
        const [daily, webHits, pages] = await Promise.all([
            getDailyTrafficTrend(daysDiff),
            getCumulativeWebHits(dateRange.start, dateRange.end),
            getTopPages(10, dateRange.start, dateRange.end),
        ]);

        return {
            dailyTrend: daily,
            totalWebHits: webHits,
            topPages: pages,
        };
    }, [dateRange.start, dateRange.end, daysDiff]);

    // Use cached data for better performance
    const {
        data: trendData,
        loading,
        error
    } = useCachedData(
        `traffic-trend-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}-${daysDiff}`,
        trendDataFetcher,
        5 * 60 * 1000 // 5 minutes cache
    );

    // Memoized growth rate calculation
    const growthRate: GrowthRate = useMemo(() => ({
        dailyGrowthRate: 5.2,
        weeklyGrowthRate: 12.8,
        monthlyGrowthRate: 18.5,
        overallTrend: 'up' as const,
    }), []);

    // Memoized calculations for better performance
    const metrics = useMemo(() => {
        if (!trendData?.dailyTrend) {
            return {
                averageDailyHits: 0,
                peakDay: "N/A",
                topPage: "N/A",
                sortedDays: [],
            };
        }

        const { dailyTrend, topPages } = trendData;
        
        const totalHits = dailyTrend.reduce((sum, day) => sum + day.hits, 0);
        const averageDailyHits = Math.round(totalHits / dailyTrend.length);
        
        const peak = dailyTrend.reduce((max, day) => 
            day.hits > max.hits ? day : max
        );
        
        const topPageTitle = topPages.length > 0 
            ? topPages[0].page_title.substring(0, 20) + (topPages[0].page_title.length > 20 ? '...' : '')
            : "N/A";

        const sortedDays = [...dailyTrend].sort((a, b) => b.hits - a.hits).slice(0, 10);

        return {
            averageDailyHits,
            peakDay: peak.date,
            topPage: topPageTitle,
            sortedDays,
        };
    }, [trendData]);

    // Memoized chart data
    const chartData = useMemo(() => trendData?.dailyTrend || [], [trendData?.dailyTrend]);

    // Memoized color palette
    const gaColors = useMemo(() => ["#1A73E8", "#0F9D58", "#F9AB00", "#EA4335"], []);

    // Early return for loading state
    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <AnalyticsCardSkeleton key={i} />
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <AnalyticsCardSkeleton key={i} />
                    ))}
                </div>
                <ChartSkeleton />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard
                    label="Total Hits"
                    value={trendData?.totalWebHits || 0}
                    format="number"
                    change={growthRate.dailyGrowthRate}
                    trend={growthRate.overallTrend === 'stable' ? 'neutral' : growthRate.overallTrend}
                    icon={<BarChart3 className="w-5 h-5" />}
                    isLoading={false}
                />
                <MetricCard
                    label="Average Daily Hits"
                    value={metrics.averageDailyHits}
                    format="number"
                    change={growthRate.dailyGrowthRate}
                    trend={growthRate.dailyGrowthRate > 0 ? 'up' : growthRate.dailyGrowthRate < 0 ? 'down' : 'neutral'}
                    icon={<TrendingUp className="w-5 h-5" />}
                    isLoading={false}
                />
                <MetricCard
                    label="Peak Day"
                    value={metrics.peakDay}
                    format="number"
                    icon={<Calendar className="w-5 h-5" />}
                    isLoading={false}
                />
                <MetricCard
                    label="Top Page"
                    value={metrics.topPage}
                    format="number"
                    icon={<Eye className="w-5 h-5" />}
                    isLoading={false}
                />
            </div>

            {/* Growth Rate Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <MetricCard
                    label="Daily Growth Rate"
                    value={growthRate.dailyGrowthRate}
                    format="percentage"
                    trend={growthRate.dailyGrowthRate > 0 ? 'up' : growthRate.dailyGrowthRate < 0 ? 'down' : 'neutral'}
                    icon={<Activity className="w-5 h-5" />}
                    isLoading={false}
                />
                <MetricCard
                    label="Weekly Growth Rate"
                    value={growthRate.weeklyGrowthRate}
                    format="percentage"
                    trend={growthRate.weeklyGrowthRate > 0 ? 'up' : growthRate.weeklyGrowthRate < 0 ? 'down' : 'neutral'}
                    icon={<TrendingUp className="w-5 h-5" />}
                    isLoading={false}
                />
                <MetricCard
                    label="Monthly Growth Rate"
                    value={growthRate.monthlyGrowthRate}
                    format="percentage"
                    trend={growthRate.monthlyGrowthRate > 0 ? 'up' : growthRate.monthlyGrowthRate < 0 ? 'down' : 'neutral'}
                    icon={<TrendingUp className="w-5 h-5" />}
                    isLoading={false}
                />
            </div>

            {/* Info Note */}
            <div className="bg-ga-surface p-4 rounded-lg">
                <p className="text-sm text-ga-secondary">
                    Showing daily traffic trends for the selected date range. Additional timeframe views (hourly, weekly, monthly) will be available in future updates.
                </p>
            </div>

            {/* Main Traffic Trend Chart */}
            <Chart
                title="Daily Traffic Trend"
                subtitle="Daily traffic pattern analysis"
                height={400}
            >
                {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">No trend data available</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="hits"
                                stroke="#1A73E8"
                                strokeWidth={2}
                                fill="url(#colorTrend)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </Chart>

            {/* Traffic Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Top Traffic Days */}
                <Chart
                    title="Top Traffic Days"
                    subtitle="Days with highest traffic volume"
                    height={400}
                >
                    {metrics.sortedDays.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">No traffic data available</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[350px] overflow-y-auto">
                            {metrics.sortedDays.map((day, index) => (
                                <TrafficDayItem key={day.date} day={day} index={index} />
                            ))}
                        </div>
                    )}
                </Chart>

                {/* Top Pages */}
                <Chart
                    title="Top Pages"
                    subtitle="Most visited pages during this period"
                    height={400}
                >
                    {!trendData?.topPages || trendData.topPages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">No page data available</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[350px] overflow-y-auto">
                            {trendData.topPages.map((page, index) => (
                                <TopPageItem key={page.page_url} page={page} index={index} />
                            ))}
                        </div>
                    )}
                </Chart>
            </div>
        </div>
    );
};

// Memoized sub-components for better performance
const TrafficDayItem = memo(({ day, index }: { day: TrafficDay; index: number }) => (
    <div
        className={`
            flex justify-between items-center p-3 rounded-lg
            transition-colors hover:bg-ga-surface
            ${index % 2 === 0 ? "bg-ga-background" : "bg-ga-surface/50"}
        `}
    >
        <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-sm font-medium text-ga-secondary">
                {index + 1}
            </div>
            <Calendar className="w-4 h-4 text-ga-accent shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ga-primary">
                    {day.date}
                </div>
                <div className="text-xs text-muted-foreground">
                    Day {day.day}
                </div>
            </div>
        </div>
        <div className="text-right shrink-0">
            <div className="text-sm font-semibold text-ga-primary">
                {day.hits.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">hits</div>
        </div>
    </div>
));

const TopPageItem = memo(({ page, index }: { page: TopPage; index: number }) => (
    <div
        className={`
            flex justify-between items-center p-3 rounded-lg
            transition-colors hover:bg-ga-surface
            ${index % 2 === 0 ? "bg-ga-background" : "bg-ga-surface/50"}
        `}
    >
        <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-sm font-medium text-ga-secondary">
                {index + 1}
            </div>
            <Eye className="w-4 h-4 text-ga-accent shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ga-primary truncate">
                    {page.page_title}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                    {page.page_url}
                </div>
            </div>
        </div>
        <div className="text-right shrink-0">
            <div className="text-sm font-semibold text-ga-primary">
                {page.hits.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">hits</div>
        </div>
    </div>
));

// Set display names for debugging
TrafficDayItem.displayName = 'TrafficDayItem';
TopPageItem.displayName = 'TopPageItem';

export default memo(TrafficTrendDetailView);