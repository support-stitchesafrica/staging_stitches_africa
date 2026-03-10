/**
 * Top Performers Table Component
 * Displays leaderboard of top referrers by referrals and revenue
 * Requirement: 14.2
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import
    {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Award, DollarSign, Users, Mail } from 'lucide-react';

interface TopPerformer
{
    id: string;
    name: string;
    email: string;
    referralCode: string;
    totalReferrals: number;
    totalPoints: number;
    totalRevenue: number;
}

interface TopPerformersTableProps
{
    topPerformersByReferrals: TopPerformer[];
    topPerformersByRevenue: TopPerformer[];
    isLoading?: boolean;
}

/**
 * TopPerformersTable Component
 * Displays a leaderboard of top referrers with tabs for different metrics
 * Requirement: 14.2 - Display top performing referrers by referrals and revenue
 */
export const TopPerformersTable: React.FC<TopPerformersTableProps> = ({
    topPerformersByReferrals,
    topPerformersByRevenue,
    isLoading = false,
}) =>
{
    const [activeTab, setActiveTab] = useState<'referrals' | 'revenue'>('referrals');

    /**
     * Format currency value
     */
    const formatCurrency = (amount: number): string =>
    {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
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
     * Get medal icon for top 3 positions
     */
    const getMedalBadge = (rank: number) =>
    {
        const medals = {
            1: { color: 'bg-yellow-500', label: '🥇' },
            2: { color: 'bg-gray-400', label: '🥈' },
            3: { color: 'bg-amber-600', label: '🥉' },
        };

        const medal = medals[rank as keyof typeof medals];
        if (!medal) return null;

        return (
            <span className="text-lg" title={`Rank ${rank}`}>
                {medal.label}
            </span>
        );
    };

    /**
     * Render table rows for performers
     */
    const renderPerformerRows = (performers: TopPerformer[], sortBy: 'referrals' | 'revenue') =>
    {
        if (performers.length === 0)
        {
            return (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Trophy className="mb-2 h-8 w-8 opacity-50" />
                            <p className="text-sm">No performers yet</p>
                            <p className="text-xs">Data will appear as referrers earn rewards</p>
                        </div>
                    </TableCell>
                </TableRow>
            );
        }

        return performers.map((performer, index) =>
        {
            const rank = index + 1;
            const primaryMetric = sortBy === 'referrals' ? performer.totalReferrals : performer.totalRevenue;

            return (
                <TableRow key={performer.id} className="hover:bg-muted/50">
                    {/* Rank */}
                    <TableCell className="w-16 text-center font-medium">
                        {rank <= 3 ? (
                            getMedalBadge(rank)
                        ) : (
                            <span className="text-muted-foreground">#{rank}</span>
                        )}
                    </TableCell>

                    {/* Name & Email */}
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{performer.name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {performer.email}
                            </span>
                        </div>
                    </TableCell>

                    {/* Referral Code */}
                    <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                            {performer.referralCode}
                        </Badge>
                    </TableCell>

                    {/* Total Referrals */}
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatNumber(performer.totalReferrals)}</span>
                        </div>
                    </TableCell>

                    {/* Total Revenue */}
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatCurrency(performer.totalRevenue)}</span>
                        </div>
                    </TableCell>

                    {/* Total Points */}
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatNumber(performer.totalPoints)}</span>
                        </div>
                    </TableCell>
                </TableRow>
            );
        });
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
                        <Trophy className="h-5 w-5" />
                        Top Performers
                    </CardTitle>
                    <CardDescription>Loading leaderboard...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 rounded bg-muted" />
                                    <div className="h-3 w-1/2 rounded bg-muted" />
                                </div>
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
                    <Trophy className="h-5 w-5" />
                    Top Performers
                </CardTitle>
                <CardDescription>
                    Leaderboard of highest performing referrers
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="referrals" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            By Referrals
                        </TabsTrigger>
                        <TabsTrigger value="revenue" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            By Revenue
                        </TabsTrigger>
                    </TabsList>

                    {/* Top by Referrals */}
                    <TabsContent value="referrals" className="mt-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16 text-center">Rank</TableHead>
                                        <TableHead>Referrer</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead className="text-right">Referrals</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renderPerformerRows(topPerformersByReferrals, 'referrals')}
                                </TableBody>
                            </Table>
                        </div>
                        {topPerformersByReferrals.length > 0 && (
                            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Showing top {topPerformersByReferrals.length} referrers by total referrals</span>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Top by Revenue */}
                    <TabsContent value="revenue" className="mt-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16 text-center">Rank</TableHead>
                                        <TableHead>Referrer</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead className="text-right">Referrals</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renderPerformerRows(topPerformersByRevenue, 'revenue')}
                                </TableBody>
                            </Table>
                        </div>
                        {topPerformersByRevenue.length > 0 && (
                            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Showing top {topPerformersByRevenue.length} referrers by total revenue</span>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};
