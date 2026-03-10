"use client";

import { useMemo, useState, useEffect } from "react";
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
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { 
    Globe, 
    TrendingUp, 
    Clock, 
    Users, 
    Eye, 
    MousePointer,
    Calendar,
    Activity
} from "lucide-react";
import { useDateRange } from "@/contexts/DateRangeContext";
import {
    getCumulativeWebHits,
    getDailyTrafficTrend,
    getTrafficByDevice,
    getTopBrowsers,
    type WebTrafficStats,
} from "@/services/webTrafficAnalytics";

const WebsiteHitsDetailView = () => {
    const { dateRange } = useDateRange();
    const [loading, setLoading] = useState(true);
    const [totalWebHits, setTotalWebHits] = useState(0);
    const [dailyTrend, setDailyTrend] = useState<Array<{ day: number; hits: number; date: string }>>([]);
    const [deviceData, setDeviceData] = useState<{desktop: number; mobile: number; tablet: number; other: number}>({
        desktop: 0,
        mobile: 0,
        tablet: 0,
        other: 0,
    });
    const [browserData, setBrowserData] = useState<Array<{browser: string; hits: number; percentage: number}>>([]);
    const [bounceRate, setBounceRate] = useState<number>(0);
    const [avgLoadTime, setAvgLoadTime] = useState<number>(0);

    // Calculate number of days in the selected range
    const daysDiff = useMemo(() => {
        return (
            Math.ceil(
                (dateRange.end.getTime() - dateRange.start.getTime()) /
                    (1000 * 60 * 60 * 24)
            ) + 1
        );
    }, [dateRange]);

    // Fetch detailed analytics
    useEffect(() => {
        const fetchDetailedAnalytics = async () => {
            setLoading(true);
            try {
                const [
                    webHits,
                    trend,
                    devices,
                    browsers,
                ] = await Promise.all([
                    getCumulativeWebHits(dateRange.start, dateRange.end),
                    getDailyTrafficTrend(daysDiff),
                    getTrafficByDevice(),
                    getTopBrowsers(10, dateRange.start, dateRange.end),
                ]);

                setTotalWebHits(webHits);
                setDailyTrend(trend);
                setDeviceData(devices);
                setBrowserData(browsers);
                
                // Mock data for missing analytics
                setBounceRate(45.2); // Mock bounce rate
                setAvgLoadTime(2.3); // Mock average load time
            } catch (error) {
                console.error("Error fetching detailed website hits analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetailedAnalytics();
    }, [dateRange, daysDiff]);

    // GA color palette
    const gaColors = [
        "#1A73E8", "#0F9D58", "#F9AB00", "#EA4335", "#9334E6",
        "#00ACC1", "#FF6D00", "#7CB342", "#C2185B", "#5E35B1"
    ];

    // Calculate metrics
    const averageDailyHits = useMemo(() => {
        if (dailyTrend.length === 0) return 0;
        return Math.round(dailyTrend.reduce((sum, day) => sum + day.hits, 0) / dailyTrend.length);
    }, [dailyTrend]);

    const topDevice = useMemo(() => {
        const devices = Object.entries(deviceData);
        if (devices.length === 0) return "N/A";
        const maxDevice = devices.reduce((max, [device, count]) => 
            count > max[1] ? [device, count] : max
        );
        return maxDevice[0].charAt(0).toUpperCase() + maxDevice[0].slice(1);
    }, [deviceData]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCardGA
                    label="Total Website Hits"
                    value={loading ? 0 : totalWebHits}
                    format="number"
                    change={8.3}
                    trend="up"
                    icon={<Globe className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Average Daily Hits"
                    value={loading ? 0 : averageDailyHits}
                    format="number"
                    change={5.7}
                    trend="up"
                    icon={<TrendingUp className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Top Device Type"
                    value={loading ? "..." : topDevice}
                    format="text"
                    icon={<Users className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Bounce Rate"
                    value={loading ? 0 : bounceRate}
                    format="percentage"
                    change={-2.1}
                    trend="down"
                    icon={<Activity className="w-5 h-5" />}
                    isLoading={loading}
                />
            </div>

            {/* Traffic Trend Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Daily Traffic Trend */}
                <ChartCard
                    title="Daily Traffic Trend"
                    subtitle="Website hits over the selected date range"
                    height={400}
                >
                    {loading || dailyTrend.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                {loading ? "Loading trend data..." : "No trend data available"}
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyTrend}>
                                <defs>
                                    <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12} 
                                />
                                <YAxis 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12} 
                                />
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
                                    fill="url(#colorHits)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Top Browsers */}
                <ChartCard
                    title="Top Browsers"
                    subtitle="Browser usage distribution"
                    height={400}
                >
                    {loading || browserData.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                {loading ? "Loading browser data..." : "No browser data available"}
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={browserData.slice(0, 8)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="browser" 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12} 
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Bar dataKey="hits" fill="#1A73E8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>
            </div>

            {/* Device Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Traffic by Device */}
                <ChartCard
                    title="Traffic by Device"
                    subtitle="Device type distribution"
                    height={400}
                >
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">Loading device data...</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={Object.entries(deviceData).map(([device, count], index) => ({
                                        name: device.charAt(0).toUpperCase() + device.slice(1),
                                        value: count,
                                        color: gaColors[index % gaColors.length],
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {Object.entries(deviceData).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={gaColors[index % gaColors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Performance Summary */}
                <ChartCard
                    title="Performance Summary"
                    subtitle="Key performance indicators"
                    height={400}
                >
                    <div className="space-y-6 p-4">
                        <div className="text-center p-6 bg-ga-surface rounded-lg">
                            <div className="text-3xl font-bold text-ga-primary mb-2">
                                {loading ? "..." : `${bounceRate}%`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Average Bounce Rate
                            </div>
                        </div>
                        
                        <div className="text-center p-6 bg-ga-surface rounded-lg">
                            <div className="text-3xl font-bold text-ga-primary mb-2">
                                {loading ? "..." : `${avgLoadTime}s`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Average Load Time
                            </div>
                        </div>

                        <div className="text-center p-6 bg-ga-surface rounded-lg">
                            <div className="text-3xl font-bold text-ga-primary mb-2">
                                {loading ? "..." : browserData.length > 0 ? browserData[0].browser : "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Top Browser
                            </div>
                        </div>
                    </div>
                </ChartCard>
            </div>


        </div>
    );
};

export default WebsiteHitsDetailView;