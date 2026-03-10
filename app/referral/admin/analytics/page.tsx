/**
 * Admin Analytics Page
 * Displays detailed reports and analytics for the referral program
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import
    {
        AlertCircle,
        BarChart3,
        TrendingUp,
        Download,
        RefreshCw,
    } from 'lucide-react';
import { toast } from 'sonner';
import { ProgramGrowthChart } from '@/components/referral/admin/ProgramGrowthChart';
import { TopPerformersTable } from '@/components/referral/admin/TopPerformersTable';
import { ConversionFunnel } from '@/components/referral/admin/ConversionFunnel';
import { CustomReportBuilder } from '@/components/referral/admin/CustomReportBuilder';
import { DateRange } from '@/lib/referral/types';

interface AnalyticsData
{
    chartData: {
        labels: string[];
        referees: number[];
        purchases: number[];
        revenue: number[];
        activeReferrers: number[];
    };
    topPerformersByReferrals: Array<{
        id: string;
        name: string;
        email: string;
        referralCode: string;
        totalReferrals: number;
        totalPoints: number;
        totalRevenue: number;
    }>;
    topPerformersByRevenue: Array<{
        id: string;
        name: string;
        email: string;
        referralCode: string;
        totalReferrals: number;
        totalPoints: number;
        totalRevenue: number;
    }>;
    conversionData: {
        totalReferrers: number;
        activeReferrers: number;
        totalReferees: number;
        refereesWithPurchases: number;
        totalPurchases: number;
        totalRevenue: number;
    };
}

export default function AnalyticsPage()
{
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>('30days');
    const [refreshing, setRefreshing] = useState(false);
    const [authToken, setAuthToken] = useState<string>('');

    /**
     * Fetch analytics data
     */
    const fetchAnalytics = async (range: DateRange = dateRange) =>
    {
        try
        {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/referral/admin/analytics?range=${range}`);

            if (!response.ok)
            {
                throw new Error('Failed to fetch analytics data');
            }

            const result = await response.json();

            if (result.success)
            {
                setData(result.data);
            } else
            {
                throw new Error(result.error?.message || 'Failed to load analytics');
            }
        } catch (err: any)
        {
            console.error('Error fetching analytics:', err);
            const errorMsg = err.message || 'Failed to load analytics data';
            setError(errorMsg);
            toast.error('Error', {
                description: errorMsg,
            });
        } finally
        {
            setLoading(false);
            setRefreshing(false);
        }
    };

    /**
     * Handle date range change
     */
    const handleRangeChange = (range: DateRange) =>
    {
        setDateRange(range);
        fetchAnalytics(range);
    };

    /**
     * Handle refresh
     */
    const handleRefresh = () =>
    {
        setRefreshing(true);
        fetchAnalytics();
    };

    /**
     * Export all analytics data
     */
    const handleExportAll = async () =>
    {
        try
        {
            toast.info('Preparing export...', {
                description: 'Generating comprehensive analytics report',
            });

            const response = await fetch('/api/referral/admin/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'analytics',
                    format: 'csv',
                    range: dateRange,
                }),
            });

            if (!response.ok)
            {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${dateRange}-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Export successful', {
                description: 'Downloaded analytics report',
            });
        } catch (err: any)
        {
            console.error('Export error:', err);
            toast.error('Export failed', {
                description: err.message || 'Failed to export data',
            });
        }
    };

    /**
     * Initial data fetch
     */
    useEffect(() =>
    {
        fetchAnalytics();

        // Get auth token for custom report builder
        // In a real implementation, this would come from your auth context
        const token = localStorage.getItem('authToken') || '';
        setAuthToken(token);
    }, []);

    /**
     * Loading state
     */
    if (loading && !data)
    {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>

                <div className="space-y-6">
                    <Skeleton className="h-[500px]" />
                    <Skeleton className="h-[400px]" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        );
    }

    /**
     * Error state
     */
    if (error && !data)
    {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-600 mt-2">Detailed reports and insights</p>
                </div>

                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>

                <Button onClick={() => fetchAnalytics()} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                        Detailed reports and insights into referral program performance
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                        onClick={handleRefresh}
                        variant="outline"
                        disabled={refreshing}
                        size="sm"
                        className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                        <RefreshCw className={`mr-2 h-3 w-3 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={handleExportAll} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                        <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Export All
                    </Button>
                </div>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                    <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-3">
                        <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="growth" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-3">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">Growth</span>
                    </TabsTrigger>
                    <TabsTrigger value="performers" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-3">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">Performers</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-3">
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">Reports</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Summary Cards */}
                    {data && (
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                                    <CardTitle className="text-xs sm:text-sm font-medium">
                                        Total Referrers
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                    <div className="text-xl sm:text-2xl font-bold">
                                        {data.conversionData.totalReferrers}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {data.conversionData.activeReferrers} active
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                                    <CardTitle className="text-xs sm:text-sm font-medium">
                                        Total Referees
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                    <div className="text-xl sm:text-2xl font-bold">
                                        {data.conversionData.totalReferees}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {data.conversionData.refereesWithPurchases} with purchases
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                                    <CardTitle className="text-xs sm:text-sm font-medium">
                                        Total Purchases
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                    <div className="text-xl sm:text-2xl font-bold">
                                        {data.conversionData.totalPurchases}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        From referrals
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                                    <CardTitle className="text-xs sm:text-sm font-medium">
                                        Total Revenue
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                    <div className="text-xl sm:text-2xl font-bold">
                                        ${data.conversionData.totalRevenue.toFixed(2)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Generated revenue
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Conversion Funnel */}
                    {data && (
                        <ConversionFunnel
                            data={data.conversionData}
                            isLoading={loading}
                        />
                    )}
                </TabsContent>

                {/* Growth Tab */}
                <TabsContent value="growth" className="space-y-6">
                    {data && (
                        <ProgramGrowthChart
                            data={data.chartData}
                            isLoading={loading}
                            onRangeChange={handleRangeChange}
                        />
                    )}
                </TabsContent>

                {/* Top Performers Tab */}
                <TabsContent value="performers" className="space-y-6">
                    {data && (
                        <TopPerformersTable
                            topPerformersByReferrals={data.topPerformersByReferrals}
                            topPerformersByRevenue={data.topPerformersByRevenue}
                            isLoading={loading}
                        />
                    )}
                </TabsContent>

                {/* Custom Reports Tab */}
                <TabsContent value="reports" className="space-y-6">
                    <CustomReportBuilder token={authToken} />

                    {/* Quick Export Options */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Export Options</CardTitle>
                            <CardDescription>
                                Download pre-configured reports for common use cases
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start p-3 sm:p-4 text-left"
                                    onClick={() =>
                                    {
                                        toast.info('Exporting...', {
                                            description: 'Generating monthly summary report',
                                        });
                                    }}
                                >
                                    <div className="font-semibold text-sm sm:text-base">Monthly Summary</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Last 30 days overview
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start p-3 sm:p-4 text-left"
                                    onClick={() =>
                                    {
                                        toast.info('Exporting...', {
                                            description: 'Generating quarterly report',
                                        });
                                    }}
                                >
                                    <div className="font-semibold text-sm sm:text-base">Quarterly Report</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Last 90 days detailed analysis
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start p-3 sm:p-4 text-left sm:col-span-2 lg:col-span-1"
                                    onClick={() =>
                                    {
                                        toast.info('Exporting...', {
                                            description: 'Generating year-to-date report',
                                        });
                                    }}
                                >
                                    <div className="font-semibold text-sm sm:text-base">Year-to-Date</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Complete year overview
                                    </div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
