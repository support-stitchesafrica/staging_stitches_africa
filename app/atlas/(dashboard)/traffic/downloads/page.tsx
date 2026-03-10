"use client";

import { useState, useEffect } from "react";
import { MetricCardGA } from "@/components/analytics/MetricCardGA";
import { ChartCard } from "@/components/analytics/ChartCard";
import {
    LineChart,
    Line,
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
} from "recharts";
import { 
    Download,
    FileText,
    TrendingUp,
    Users,
    Calendar,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDateRange } from "@/contexts/DateRangeContext";

const DownloadsDetailView = () => {
    const router = useRouter();
    const { dateRange } = useDateRange();
    const [loading, setLoading] = useState(true);

    // Mock data for downloads
    const [downloadMetrics, setDownloadMetrics] = useState({
        totalDownloads: 0,
        uniqueDownloaders: 0,
        averageDownloadsPerUser: 0,
        topDownloadedFile: "N/A",
    });

    const [downloadTrends, setDownloadTrends] = useState<Array<{date: string; downloads: number}>>([]);
    const [topFiles, setTopFiles] = useState<Array<{fileName: string; downloads: number; fileType: string}>>([]);
    const [downloadsByType, setDownloadsByType] = useState<Array<{type: string; downloads: number}>>([]);

    // GA color palette
    const gaColors = ["#1A73E8", "#0F9D58", "#F9AB00", "#EA4335"];

    useEffect(() => {
        const fetchDownloadData = async () => {
            setLoading(true);
            try {
                // Mock download metrics
                setDownloadMetrics({
                    totalDownloads: 15420,
                    uniqueDownloaders: 3240,
                    averageDownloadsPerUser: 4.8,
                    topDownloadedFile: "Product Catalog 2024.pdf",
                });

                // Mock download trends
                const trends = [];
                for (let i = 0; i < 30; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    trends.push({
                        date: date.toISOString().split('T')[0],
                        downloads: Math.floor(Math.random() * 200) + 100,
                    });
                }
                setDownloadTrends(trends.reverse());

                // Mock top files
                setTopFiles([
                    { fileName: "Product Catalog 2024.pdf", downloads: 2340, fileType: "PDF" },
                    { fileName: "User Manual v3.2.docx", downloads: 1890, fileType: "DOCX" },
                    { fileName: "Price List Q4.xlsx", downloads: 1560, fileType: "XLSX" },
                    { fileName: "Company Brochure.pdf", downloads: 1230, fileType: "PDF" },
                    { fileName: "Technical Specs.pdf", downloads: 980, fileType: "PDF" },
                    { fileName: "Installation Guide.pdf", downloads: 750, fileType: "PDF" },
                    { fileName: "FAQ Document.docx", downloads: 620, fileType: "DOCX" },
                    { fileName: "Terms of Service.pdf", downloads: 450, fileType: "PDF" },
                ]);

                // Mock downloads by type
                setDownloadsByType([
                    { type: "PDF", downloads: 8950 },
                    { type: "DOCX", downloads: 3240 },
                    { type: "XLSX", downloads: 2100 },
                    { type: "Other", downloads: 1130 },
                ]);
            } catch (error) {
                console.error("Error fetching download data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDownloadData();
    }, [dateRange]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-ga-primary">Downloads Analytics</h1>
                    <p className="text-ga-secondary">Detailed analysis of file downloads and user engagement</p>
                </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCardGA
                    label="Total Downloads"
                    value={loading ? 0 : downloadMetrics.totalDownloads}
                    format="number"
                    change={12.5}
                    trend="up"
                    icon={<Download className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Unique Downloaders"
                    value={loading ? 0 : downloadMetrics.uniqueDownloaders}
                    format="number"
                    change={8.3}
                    trend="up"
                    icon={<Users className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Avg Downloads/User"
                    value={loading ? 0 : downloadMetrics.averageDownloadsPerUser}
                    format="number"
                    change={5.7}
                    trend="up"
                    icon={<TrendingUp className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Top Downloaded File"
                    value={loading ? "..." : downloadMetrics.topDownloadedFile}
                    format="number"
                    icon={<FileText className="w-5 h-5" />}
                    isLoading={loading}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Download Trends */}
                <ChartCard
                    title="Download Trends"
                    subtitle="Daily download activity over time"
                    height={400}
                >
                    {loading || downloadTrends.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                {loading ? "Loading download trends..." : "No download data available"}
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={downloadTrends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return `${date.getMonth() + 1}/${date.getDate()}`;
                                    }}
                                />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="downloads" 
                                    stroke="#1A73E8" 
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Downloads by File Type */}
                <ChartCard
                    title="Downloads by File Type"
                    subtitle="Distribution of downloads by file format"
                    height={400}
                >
                    {loading || downloadsByType.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                {loading ? "Loading file type data..." : "No file type data available"}
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={downloadsByType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="downloads"
                                    label={({ type, downloads }) => `${type}: ${downloads}`}
                                >
                                    {downloadsByType.map((entry, index) => (
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

            {/* Top Downloaded Files */}
            <ChartCard
                title="Top Downloaded Files"
                subtitle="Most popular files by download count"
                height={500}
            >
                {loading || topFiles.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">
                            {loading ? "Loading top files..." : "No file data available"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[450px] overflow-y-auto">
                        {topFiles.map((file, index) => (
                            <div
                                key={file.fileName}
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
                                    <FileText className="w-4 h-4 text-ga-accent shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-ga-primary truncate">
                                            {file.fileName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {file.fileType} file
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-sm font-semibold text-ga-primary">
                                        {file.downloads.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">downloads</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ChartCard>
        </div>
    );
};

export default DownloadsDetailView;