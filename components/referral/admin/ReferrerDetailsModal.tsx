/**
 * Referrer Details Modal Component
 * Shows detailed view of individual referrer with all metrics
 * Requirement: 12.2
 */

'use client';

import React, { useEffect, useState } from 'react';
import
    {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
    } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import
    {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from '@/components/ui/table';
import
    {
        Users,
        Award,
        DollarSign,
        TrendingUp,
        Mail,
        Calendar,
        Code,
        ShoppingCart,
    } from 'lucide-react';
import { toast } from 'sonner';
import { ReferralUser, Referral } from '@/lib/referral/types';

interface ReferrerDetailsModalProps
{
    referrer: ReferralUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    token: string; // Firebase auth token for API calls
}

interface ReferrerDetails
{
    user: ReferralUser;
    referrals: Referral[];
    stats: {
        activeReferrals: number;
        pendingReferrals: number;
        convertedReferrals: number;
        conversionRate: number;
        averageRevenuePerReferral: number;
        totalPurchases: number;
    };
}

/**
 * ReferrerDetailsModal Component
 * Displays comprehensive information about a single referrer
 */
export const ReferrerDetailsModal: React.FC<ReferrerDetailsModalProps> = ({
    referrer,
    open,
    onOpenChange,
    token,
}) =>
{
    const [details, setDetails] = useState<ReferrerDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch detailed referrer information
     * Requirement: 12.2 - Detailed view of individual referrer
     */
    useEffect(() =>
    {
        const fetchDetails = async () =>
        {
            if (!referrer || !open) return;

            try
            {
                setLoading(true);
                setError(null);

                // Fetch referrals for this referrer
                const response = await fetch(
                    `/api/referral/admin/referrers?search=${referrer.email}&limit=1`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok)
                {
                    throw new Error('Failed to fetch referrer details');
                }

                const data = await response.json();

                // Fetch referrals list
                const referralsResponse = await fetch(
                    `/api/referral/dashboard/referrals?referrerId=${referrer.userId}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                let referrals: Referral[] = [];
                if (referralsResponse.ok)
                {
                    const referralsData = await referralsResponse.json();
                    referrals = referralsData.referrals || [];
                }

                // Calculate stats
                const activeReferrals = referrals.filter((r) => r.status === 'active').length;
                const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;
                const convertedReferrals = referrals.filter((r) => r.status === 'converted').length;
                const conversionRate =
                    referrals.length > 0 ? (convertedReferrals / referrals.length) * 100 : 0;
                const totalPurchases = referrals.reduce((sum, r) => sum + (r.totalPurchases || 0), 0);
                const averageRevenuePerReferral =
                    referrals.length > 0 ? referrer.totalRevenue / referrals.length : 0;

                setDetails({
                    user: referrer,
                    referrals,
                    stats: {
                        activeReferrals,
                        pendingReferrals,
                        convertedReferrals,
                        conversionRate,
                        averageRevenuePerReferral,
                        totalPurchases,
                    },
                });
            } catch (err: any)
            {
                console.error('Error fetching referrer details:', err);
                setError(err.message || 'Failed to load referrer details');
                toast.error('Failed to load details', {
                    description: 'Could not retrieve referrer information',
                });
            } finally
            {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [referrer, open, token]);

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
     * Format date
     */
    const formatDate = (timestamp: any): string =>
    {
        if (!timestamp) return 'N/A';

        let date: Date;
        if (typeof timestamp === 'string')
        {
            date = new Date(timestamp);
        } else if (timestamp.toDate && typeof timestamp.toDate === 'function')
        {
            date = timestamp.toDate();
        } else if (timestamp.toMillis && typeof timestamp.toMillis === 'function')
        {
            date = new Date(timestamp.toMillis());
        } else
        {
            return 'N/A';
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    /**
     * Get status badge variant
     */
    const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' =>
    {
        switch (status)
        {
            case 'active':
                return 'default';
            case 'converted':
                return 'default';
            case 'pending':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    if (!referrer) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Referrer Details</DialogTitle>
                    <DialogDescription>
                        Comprehensive information about {referrer.fullName}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-4 py-8">
                        <div className="flex items-center justify-center">
                            <p className="text-muted-foreground">Loading details...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="py-8">
                        <p className="text-destructive text-center">{error}</p>
                    </div>
                ) : details ? (
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">{details.user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Code className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Referral Code</p>
                                        <code className="font-mono font-medium">{details.user.referralCode}</code>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Joined</p>
                                        <p className="font-medium">{formatDate(details.user.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <Badge variant={details.user.isActive ? 'default' : 'secondary'}>
                                            {details.user.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatNumber(details.user.totalReferrals)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {details.stats.activeReferrals} active, {details.stats.pendingReferrals}{' '}
                                        pending
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatNumber(details.user.totalPoints)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Points earned</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(details.user.totalRevenue)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">From referrals</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Additional Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Performance Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
                                    <p className="text-xl font-bold">{details.stats.conversionRate.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Avg. Revenue per Referral</p>
                                    <p className="text-xl font-bold">
                                        {formatCurrency(details.stats.averageRevenuePerReferral)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Total Purchases</p>
                                    <p className="text-xl font-bold">{formatNumber(details.stats.totalPurchases)}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Referrals */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Referrals</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {details.referrals.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No referrals yet</p>
                                ) : (
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Purchases</TableHead>
                                                    <TableHead>Spent</TableHead>
                                                    <TableHead>Joined</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {details.referrals.slice(0, 5).map((referral) => (
                                                    <TableRow key={referral.id}>
                                                        <TableCell className="font-medium">{referral.refereeName}</TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {referral.refereeEmail}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={getStatusVariant(referral.status)}>
                                                                {referral.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{formatNumber(referral.totalPurchases || 0)}</TableCell>
                                                        <TableCell>{formatCurrency(referral.totalSpent || 0)}</TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {formatDate(referral.signUpDate)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                                {details.referrals.length > 5 && (
                                    <p className="text-sm text-muted-foreground text-center mt-4">
                                        Showing 5 of {details.referrals.length} referrals
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
};
