/**
 * Conversion Funnel Component
 * Displays funnel chart showing conversion stages
 * Requirement: 14.3
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Users, UserCheck, ShoppingCart, DollarSign } from 'lucide-react';

interface ConversionStage
{
    name: string;
    count: number;
    percentage: number;
    icon: React.ReactNode;
    color: string;
}

interface ConversionFunnelProps
{
    data: {
        totalReferrers: number;
        activeReferrers: number;
        totalReferees: number;
        refereesWithPurchases: number;
        totalPurchases: number;
        totalRevenue: number;
    };
    isLoading?: boolean;
}

/**
 * ConversionFunnel Component
 * Displays a visual funnel chart showing conversion stages from referrer sign-up to revenue
 * Requirement: 14.3 - Display conversion funnel metrics
 */
export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({
    data,
    isLoading = false,
}) =>
{
    /**
     * Calculate conversion stages
     */
    const stages: ConversionStage[] = React.useMemo(() =>
    {
        const totalReferrers = data.totalReferrers || 1; // Avoid division by zero

        return [
            {
                name: 'Total Referrers',
                count: data.totalReferrers,
                percentage: 100,
                icon: <Users className="h-5 w-5" />,
                color: 'bg-blue-500',
            },
            {
                name: 'Active Referrers',
                count: data.activeReferrers,
                percentage: (data.activeReferrers / totalReferrers) * 100,
                icon: <UserCheck className="h-5 w-5" />,
                color: 'bg-green-500',
            },
            {
                name: 'Total Referees',
                count: data.totalReferees,
                percentage: (data.totalReferees / totalReferrers) * 100,
                icon: <Users className="h-5 w-5" />,
                color: 'bg-purple-500',
            },
            {
                name: 'Referees with Purchases',
                count: data.refereesWithPurchases,
                percentage: data.totalReferees > 0
                    ? (data.refereesWithPurchases / data.totalReferees) * 100
                    : 0,
                icon: <ShoppingCart className="h-5 w-5" />,
                color: 'bg-orange-500',
            },
            {
                name: 'Total Purchases',
                count: data.totalPurchases,
                percentage: data.totalReferees > 0
                    ? (data.totalPurchases / data.totalReferees) * 100
                    : 0,
                icon: <DollarSign className="h-5 w-5" />,
                color: 'bg-emerald-500',
            },
        ];
    }, [data]);

    /**
     * Format currency value
     */
    const formatCurrency = (amount: number): string =>
    {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
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
     * Calculate drop-off rate between stages
     */
    const calculateDropOff = (currentIndex: number): number | null =>
    {
        if (currentIndex === 0) return null;

        const previousStage = stages[currentIndex - 1];
        const currentStage = stages[currentIndex];

        if (previousStage.count === 0) return 0;

        const dropOff = ((previousStage.count - currentStage.count) / previousStage.count) * 100;
        return dropOff;
    };

    /**
     * Loading skeleton
     */
    if (isLoading)
    {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Conversion Funnel
                    </CardTitle>
                    <CardDescription>Loading funnel data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-16 rounded-lg bg-muted" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Conversion Funnel
                </CardTitle>
                <CardDescription>
                    Track user journey from referrer sign-up to revenue generation
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Summary Stats */}
                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border bg-muted/50 p-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Overall Conversion Rate</p>
                        <p className="text-2xl font-bold">
                            {data.totalReferrers > 0
                                ? ((data.refereesWithPurchases / data.totalReferrers) * 100).toFixed(1)
                                : '0.0'}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Referrers to purchasing referees
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            From {formatNumber(data.totalPurchases)} purchases
                        </p>
                    </div>
                </div>

                {/* Funnel Visualization */}
                <div className="space-y-3">
                    {stages.map((stage, index) =>
                    {
                        const dropOff = calculateDropOff(index);
                        const maxWidth = 100;
                        const width = stage.percentage;

                        return (
                            <div key={stage.name} className="space-y-2">
                                {/* Stage Bar */}
                                <div className="relative">
                                    <div
                                        className={`${stage.color} rounded-lg transition-all duration-500 ease-out`}
                                        style={{
                                            width: `${width}%`,
                                            minWidth: '120px',
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-4 p-4 text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-white/20 p-2">
                                                    {stage.icon}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{stage.name}</p>
                                                    <p className="text-xs opacity-90">
                                                        {formatNumber(stage.count)} ({stage.percentage.toFixed(1)}%)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Drop-off Indicator */}
                                {dropOff !== null && dropOff > 0 && (
                                    <div className="ml-4 flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="h-px w-8 bg-border" />
                                        <span className="rounded-full bg-muted px-2 py-0.5">
                                            {dropOff.toFixed(1)}% drop-off
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Insights */}
                <div className="mt-6 space-y-2 rounded-lg border bg-muted/30 p-4">
                    <h4 className="text-sm font-semibold">Key Insights</h4>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 text-blue-500">•</span>
                            <span>
                                <strong>{((data.activeReferrers / (data.totalReferrers || 1)) * 100).toFixed(1)}%</strong> of referrers are actively sharing their codes
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 text-purple-500">•</span>
                            <span>
                                Each active referrer brings in an average of{' '}
                                <strong>
                                    {data.activeReferrers > 0
                                        ? (data.totalReferees / data.activeReferrers).toFixed(1)
                                        : '0'}
                                </strong>{' '}
                                referees
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 text-orange-500">•</span>
                            <span>
                                <strong>
                                    {data.totalReferees > 0
                                        ? ((data.refereesWithPurchases / data.totalReferees) * 100).toFixed(1)
                                        : '0'}%
                                </strong>{' '}
                                of referees make at least one purchase
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 text-emerald-500">•</span>
                            <span>
                                Average revenue per purchasing referee:{' '}
                                <strong>
                                    {data.refereesWithPurchases > 0
                                        ? formatCurrency(data.totalRevenue / data.refereesWithPurchases)
                                        : '$0'}
                                </strong>
                            </span>
                        </li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};
