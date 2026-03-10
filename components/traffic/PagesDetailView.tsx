"use client";

import { useMemo, useState, useEffect } from "react";
import { MetricCardGA } from "@/components/analytics/MetricCardGA";
import { ChartCard } from "@/components/analytics/ChartCard";
import {
    BarChart,
    Bar,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";
import { 
    FileText, 
    Eye, 
    Clock, 
    TrendingUp,
    ExternalLink,
    Search,
    Filter,
    BarChart3,
    Users,
    MousePointer,
} from "lucide-react";
import { useDateRange } from "@/contexts/DateRangeContext";
import {
    getTopPages,
    getCumulativeWebHits,
    type TrafficByPage,
} from "@/services/webTrafficAnalytics";

const PagesDetailView = () => {
    const { dateRange } = useDateRange();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'hits' | 'engagement' | 'bounce_rate'>('hits');
    const [topPages, setTopPages] = useState<TrafficByPage[]>([]);
    const [totalWebHits, setTotalWebHits] = useState(0);

    // Fetch detailed page analytics
    useEffect(() => {
        const fetchPageAnalytics = async () => {
            setLoading(true);
            try {
                const [
                    pages,
                    webHits,
                ] = await Promise.all([
                    getTopPages(50, dateRange.start, dateRange.end),
                    getCumulativeWebHits(dateRange.start, dateRange.end),
                ]);

                setTopPages(pages);
                setTotalWebHits(webHits);
            } catch (error) {
                console.error("Error fetching page analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPageAnalytics();
    }, [dateRange]);

    // Filter and sort pages
    const filteredPages = useMemo(() => {
        let filtered = topPages.filter(page => 
            page.page_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            page.page_url.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sort by hits (only available sorting)
        filtered.sort((a, b) => b.hits - a.hits);

        return filtered;
    }, [topPages, searchTerm]);

    // Calculate metrics
    const totalPages = topPages.length;
    const totalHits = topPages.reduce((sum, page) => sum + page.hits, 0);
    const averageHitsPerPage = totalPages > 0 ? Math.round(totalHits / totalPages) : 0;
    const topPage = topPages.length > 0 ? topPages[0] : null;

    // GA color palette
    const gaColors = [
        "#1A73E8", "#0F9D58", "#F9AB00", "#EA4335", "#9334E6",
        "#00ACC1", "#FF6D00", "#7CB342", "#C2185B", "#5E35B1"
    ];

    // Prepare chart data
    const topPagesChartData = filteredPages.slice(0, 10).map((page, index) => ({
        name: page.page_title.length > 30 ? page.page_title.substring(0, 30) + '...' : page.page_title,
        hits: page.hits,
        color: gaColors[index % gaColors.length],
    }));



    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCardGA
                    label="Total Pages"
                    value={loading ? 0 : totalPages}
                    format="number"
                    icon={<FileText className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Total Page Views"
                    value={loading ? 0 : totalHits}
                    format="number"
                    change={12.5}
                    trend="up"
                    icon={<Eye className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Avg Views per Page"
                    value={loading ? 0 : averageHitsPerPage}
                    format="number"
                    change={8.3}
                    trend="up"
                    icon={<BarChart3 className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Top Page"
                    value={loading ? "..." : (topPage?.page_title ? (topPage.page_title.substring(0, 20) + (topPage.page_title.length > 20 ? '...' : '')) : "N/A")}
                    format="number"
                    icon={<TrendingUp className="w-5 h-5" />}
                    isLoading={loading}
                />
            </div>

            {/* Filters and Search */}
            <div className="bg-ga-surface p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ga-secondary" />
                            <input
                                type="text"
                                placeholder="Search pages by title or URL..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-ga rounded-lg focus:ring-2 focus:ring-ga-accent focus:border-transparent bg-ga-background text-ga-primary"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="text-sm text-ga-secondary">
                        Showing {filteredPages.length} pages sorted by views
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Top Pages Chart */}
                <ChartCard
                    title="Top Pages by Views"
                    subtitle="Most viewed pages on your website"
                    height={400}
                >
                    {loading || topPagesChartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                {loading ? "Loading page data..." : "No page data available"}
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topPagesChartData} layout="horizontal">
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={10}
                                    width={120}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Bar dataKey="hits" fill="#1A73E8" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Page Views Distribution */}
                <ChartCard
                    title="Page Views Distribution"
                    subtitle="Top pages by view count"
                    height={400}
                >
                    {loading || topPagesChartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                {loading ? "Loading page data..." : "No page data available"}
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={topPagesChartData.slice(0, 8)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="hits"
                                    label={({ name, hits }) => `${name}: ${hits}`}
                                >
                                    {topPagesChartData.slice(0, 8).map((entry, index) => (
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
            </div>

            {/* Detailed Pages List */}
            <ChartCard
                title={`Page Performance (${filteredPages.length} pages)`}
                subtitle="Detailed metrics for each page"
                height={600}
            >
                {loading || filteredPages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">
                            {loading ? "Loading page details..." : "No pages found"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[550px] overflow-y-auto">
                        {/* Page Rows */}
                        {filteredPages.map((page, index) => (
                            <div
                                key={page.page_url}
                                className={`
                                    flex justify-between items-center p-3 rounded-lg transition-colors hover:bg-ga-surface
                                    ${index % 2 === 0 ? "bg-ga-background" : "bg-ga-surface/50"}
                                `}
                            >
                                {/* Page Info */}
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <div className="text-sm font-medium text-ga-secondary shrink-0">
                                        {index + 1}
                                    </div>
                                    <FileText className="w-4 h-4 text-ga-accent shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-ga-primary truncate">
                                            {page.page_title}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" />
                                            {page.page_url}
                                        </div>
                                    </div>
                                </div>

                                {/* Views */}
                                <div className="text-right shrink-0">
                                    <div className="text-sm font-semibold text-ga-primary">
                                        {page.hits.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">views</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ChartCard>
        </div>
    );
};

export default PagesDetailView;