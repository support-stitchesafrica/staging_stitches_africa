/**
 * Referrers Management Page
 * Displays and manages all referrers in the program
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

'use client';

import React, { useEffect, useState } from 'react';
import { ReferrersDataTable } from '@/components/referral/admin/ReferrersDataTable';
import { ExportButton } from '@/components/referral/admin/ExportButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useReferralAuth } from '@/contexts/ReferralAuthContext';
import
    {
        AlertCircle,
        Search,
        Filter,
        Download,
        Users,
        TrendingUp,
        Award,
        DollarSign
    } from 'lucide-react';
import { toast } from 'sonner';
import
    {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from '@/components/ui/select';

interface ReferrerSummary
{
    totalReferrers: number;
    activeReferrers: number;
    totalReferrals: number;
    totalRevenue: number;
}

export default function ReferrersManagementPage()
{
    const { user } = useReferralAuth();
    const [summary, setSummary] = useState<ReferrerSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activityFilter, setActivityFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortBy, setSortBy] = useState<'referrals' | 'revenue' | 'points' | 'date'>('referrals');
    const [authToken, setAuthToken] = useState<string>('');

    // Get auth token
    useEffect(() =>
    {
        const getToken = async () =>
        {
            if (user)
            {
                try
                {
                    const token = await user.getIdToken();
                    setAuthToken(token);
                } catch (err)
                {
                    console.error('Error getting auth token:', err);
                }
            }
        };
        getToken();
    }, [user]);

    // Fetch referrer summary
    useEffect(() =>
    {
        const fetchSummary = async () =>
        {
            try
            {
                setLoading(true);
                setError(null);

                const response = await fetch('/api/referral/admin/stats');

                if (!response.ok)
                {
                    throw new Error('Failed to fetch summary');
                }

                const data = await response.json();

                if (data.success)
                {
                    setSummary({
                        totalReferrers: data.stats.totalReferrers,
                        activeReferrers: data.stats.totalReferrers, // Simplified - could be enhanced
                        totalReferrals: data.stats.totalReferees,
                        totalRevenue: data.stats.totalRevenue,
                    });
                } else
                {
                    throw new Error(data.error?.message || 'Failed to load summary');
                }
            } catch (err: any)
            {
                console.error('Error fetching summary:', err);
                const errorMsg = err.message || 'Failed to load referrer data';
                setError(errorMsg);
                toast.error('Error', {
                    description: errorMsg,
                });
            } finally
            {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    const handleExport = async (format: 'csv' | 'pdf') =>
    {
        try
        {
            toast.info('Preparing export...', {
                description: `Generating ${format.toUpperCase()} file`,
            });

            const response = await fetch('/api/referral/admin/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'referrers',
                    format,
                    filters: {
                        search: searchQuery,
                        activity: activityFilter,
                        sortBy,
                    },
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
            a.download = `referrers-${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Export successful', {
                description: `Downloaded ${format.toUpperCase()} file`,
            });
        } catch (err: any)
        {
            console.error('Export error:', err);
            toast.error('Export failed', {
                description: err.message || 'Failed to export data',
            });
        }
    };

    if (loading)
    {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>

                <Skeleton className="h-96" />
            </div>
        );
    }

    if (error)
    {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Referrers Management</h1>
                    <p className="text-gray-600 mt-2">View and manage all referrers</p>
                </div>

                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Referrers Management</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                        View and manage all referrers in the program
                    </p>
                </div>

                <div className="w-full sm:w-auto">
                    <ExportButton onExport={handleExport} />
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Referrers
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalReferrers}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Registered in program
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Active Referrers
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.activeReferrers}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Currently active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Referrals
                            </CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalReferrals}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Successful referrals
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Revenue
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${summary.totalRevenue.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Generated revenue
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters and Search */}
            <Card>
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Search and Filter</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Find specific referrers or filter by activity
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {/* Search */}
                        <div className="relative sm:col-span-2 lg:col-span-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by name, email, or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 text-sm sm:text-base"
                            />
                        </div>

                        {/* Activity Filter */}
                        <Select value={activityFilter} onValueChange={(value: any) => setActivityFilter(value)}>
                            <SelectTrigger className="text-sm">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by activity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Referrers</SelectItem>
                                <SelectItem value="active">Active Only</SelectItem>
                                <SelectItem value="inactive">Inactive Only</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort By */}
                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                            <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="referrals">Most Referrals</SelectItem>
                                <SelectItem value="revenue">Highest Revenue</SelectItem>
                                <SelectItem value="points">Most Points</SelectItem>
                                <SelectItem value="date">Newest First</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Clear Filters */}
                    {(searchQuery || activityFilter !== 'all' || sortBy !== 'referrals') && (
                        <div className="mt-3 sm:mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                {
                                    setSearchQuery('');
                                    setActivityFilter('all');
                                    setSortBy('referrals');
                                }}
                                className="text-xs sm:text-sm"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Referrers Table */}
            <Card>
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">All Referrers</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Complete list of referrers with their performance metrics
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-4 lg:px-6 pb-4 sm:pb-6">
                    {authToken ? (
                        <ReferrersDataTable
                            token={authToken}
                            onViewDetails={(referrer) => {
                                // Handle view details - could open a modal or navigate
                                console.log('View details for:', referrer);
                            }}
                        />
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading...</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
