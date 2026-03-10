/**
 * Admin Stats Cards Component
 * Displays overall program statistics with growth metrics
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Award, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface AdminStatsCardsProps
{
    token: string; // Firebase auth token for API calls
}

interface GrowthMetrics
{
    referrersGrowth: number;
    refereesGrowth: number;
    revenueGrowth: number;
    pointsGrowth: number;
    period: string;
}

interface AdminStats
{
    totalReferrers: number;
    totalReferees: number;
    totalPoints: number;
    totalRevenue: number;
    averageReferralsPerReferrer: number;
    overallConversionRate: number;
    growthMetrics: GrowthMetrics;
}

/**
 * AdminStatsCards Component
 * Displays key metrics for the entire referral program with growth indicators
 */
export const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({ token }) =>
{
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch admin statistics from API
     * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
     */
    useEffect(() =>
    {
        const fetchStats = async () =>
        {
            try
            {
                setLoading(true);
                setError(null);

                const response = await fetch('/api/referral/admin/stats', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok)
                {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'Failed to fetch statistics');
                }

                const data = await response.json();

                if (data.success && data.stats)
                {
                    setStats(data.stats);
                } else
                {
                    throw new Error('Invalid response format');
                }
            } catch (err: any)
            {
                console.error('Error fetching admin stats:', err);
                setError(err.message || 'Failed to load statistics');
                toast.error('Failed to load stats', {
                    description: 'Could not retrieve program statistics',
                });
            } finally
            {
                setLoading(false);
            }
        };

        if (token)
        {
            fetchStats();
        } else
        {
            setError('Authentication token is required');
            setLoading(false);
        }
    }, [token]);

    /**
     * Format currency values
     */
    const formatCurrency = (amount: number): string =>
    {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    /**
     * Format number with commas
     */
    const formatNumber = (num: number): string =>
    {
        return new Intl.NumberFormat('en-US').format(num);
    };

    /**
     * Render growth indicator with icon and percentage
     */
    const renderGrowthIndicator = (growth: number) =>
    {
        const isPositive = growth >= 0;
        const Icon = isPositive ? TrendingUp : TrendingDown;
        const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

        return (
            <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
                <Icon className="h-3 w-3" />
                <span>{Math.abs(growth).toFixed(1)}%</span>
            </div>
        );
    };

    if (loading)
    {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                <div className="h-4 w-24 bg-muted rounded" />
                            </CardTitle>
                            <div className="h-4 w-4 bg-muted rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-32 bg-muted rounded mb-2" />
                            <div className="h-3 w-40 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error || !stats)
    {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-full">
                    <CardContent className="pt-6">
                        <p className="text-sm text-destructive">
                            {error || 'Failed to load statistics'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Referrers Card - Requirement: 11.1 */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Referrers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.totalReferrers)}</div>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                            Registered referrers
                        </p>
                        {renderGrowthIndicator(stats.growthMetrics.referrersGrowth)}
                    </div>
                </CardContent>
            </Card>

            {/* Total Referees Card - Requirement: 11.2 */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Referees</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.totalReferees)}</div>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                            Sign-ups via referrals
                        </p>
                        {renderGrowthIndicator(stats.growthMetrics.refereesGrowth)}
                    </div>
                </CardContent>
            </Card>

            {/* Total Points Card - Requirement: 11.3 */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.totalPoints)}</div>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                            Points awarded
                        </p>
                        {renderGrowthIndicator(stats.growthMetrics.pointsGrowth)}
                    </div>
                </CardContent>
            </Card>

            {/* Total Revenue Card - Requirement: 11.4 */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                            From referral purchases
                        </p>
                        {renderGrowthIndicator(stats.growthMetrics.revenueGrowth)}
                    </div>
                </CardContent>
            </Card>

            {/* Additional Metrics - Requirement: 11.5 */}
            <Card className="sm:col-span-2 lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Program Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Avg. Referrals per Referrer</p>
                            <p className="text-xl font-bold">
                                {stats.averageReferralsPerReferrer.toFixed(1)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Overall Conversion Rate</p>
                            <p className="text-xl font-bold">
                                {stats.overallConversionRate.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                        Growth metrics based on last {stats.growthMetrics.period}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
