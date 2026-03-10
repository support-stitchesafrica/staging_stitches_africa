/**
 * Admin Dashboard Main Page
 * Displays overview and key metrics for the referral program
 * Requirements: 10.1, 10.2, 10.4, 10.5
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Users, DollarSign, Award } from 'lucide-react';
import { toast } from 'sonner';

interface GlobalStats
{
    totalReferrers: number;
    totalReferees: number;
    totalPoints: number;
    totalRevenue: number;
    averageReferralsPerReferrer: number;
    overallConversionRate: number;
}

export default function AdminDashboardPage()
{
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch global statistics
    useEffect(() =>
    {
        const fetchStats = async () =>
        {
            try
            {
                setLoading(true);
                setError(null);

                const response = await fetch('/api/referral/admin/stats');

                if (!response.ok)
                {
                    throw new Error('Failed to fetch statistics');
                }

                const data = await response.json();

                if (data.success)
                {
                    setStats(data.stats);
                } else
                {
                    throw new Error(data.error?.message || 'Failed to load statistics');
                }
            } catch (err: any)
            {
                console.error('Error fetching stats:', err);
                const errorMsg = err.message || 'Failed to load dashboard data';
                setError(errorMsg);
                toast.error('Error', {
                    description: errorMsg,
                });
            } finally
            {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading)
    {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Monitor and manage the referral program</p>
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
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-2">
                    Monitor and manage the referral program performance
                </p>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Referrers</CardTitle>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalReferrers}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                Registered referrers
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Referees</CardTitle>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalReferees}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                Sign-ups via referrals
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Points</CardTitle>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                Points awarded
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                From referral purchases
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Key Insights */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                                Avg. Referrals per Referrer
                            </CardTitle>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {stats.averageReferralsPerReferrer.toFixed(1)}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Average performance metric
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                                Overall Conversion Rate
                            </CardTitle>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {stats.overallConversionRate.toFixed(1)}%
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Referees who made purchases
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                                Avg. Revenue per Referrer
                            </CardTitle>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                                ${stats.totalReferrers > 0
                                    ? (stats.totalRevenue / stats.totalReferrers).toFixed(2)
                                    : '0.00'
                                }
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Average revenue generated
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quick Actions */}
            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-gray-900">Quick Actions</CardTitle>
                    <CardDescription className="text-gray-600">
                        Common administrative tasks
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <a
                            href="/referral/admin/referrers"
                            className="flex items-center space-x-3 sm:space-x-4 p-4 sm:p-5 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md group"
                        >
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm sm:text-base">Manage Referrers</p>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">View and manage all referrers</p>
                            </div>
                        </a>

                        <a
                            href="/referral/admin/analytics"
                            className="flex items-center space-x-3 sm:space-x-4 p-4 sm:p-5 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all shadow-sm hover:shadow-md group"
                        >
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors flex-shrink-0">
                                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm sm:text-base">View Analytics</p>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">Detailed reports and insights</p>
                            </div>
                        </a>

                        <a
                            href="/referral/admin/analytics?export=true"
                            className="flex items-center space-x-3 sm:space-x-4 p-4 sm:p-5 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all shadow-sm hover:shadow-md group sm:col-span-2 lg:col-span-1"
                        >
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors flex-shrink-0">
                                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm sm:text-base">Export Data</p>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">Download reports as CSV/PDF</p>
                            </div>
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
