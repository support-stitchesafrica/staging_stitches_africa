'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, ExternalLink, RefreshCw } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

interface Payout
{
    id: string;
    orderId: string;
    tailorId: string;
    totalAmount: number;
    vendorAmount: number;
    platformAmount: number;
    status: 'success' | 'failed' | 'pending';
    currency: string;
    stripeTransferId?: string;
    flutterwaveTransferId?: string;
    createdAt: string;
    deliveredAt?: string;
}

interface PayoutHistoryWidgetProps
{
    tailorUID: string;
    maxItems?: number;
}

export const PayoutHistoryWidget: React.FC<PayoutHistoryWidgetProps> = ({
    tailorUID,
    maxItems = 10,
}) =>
{
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalEarnings, setTotalEarnings] = useState(0);

    useEffect(() =>
    {
        loadPayouts();
    }, [tailorUID]);

    const loadPayouts = async () =>
    {
        try
        {
            setLoading(true);

            const payoutsRef = collection(db, 'payouts');
            const q = query(
                payoutsRef,
                where('tailorId', '==', tailorUID),
                orderBy('createdAt', 'desc'),
                limit(maxItems)
            );

            const querySnapshot = await getDocs(q);
            const payoutData: Payout[] = [];
            let total = 0;

            querySnapshot.forEach((doc) =>
            {
                const data = doc.data();
                payoutData.push({
                    id: doc.id,
                    ...data,
                } as Payout);

                if (data.status === 'success')
                {
                    total += data.vendorAmount || 0;
                }
            });

            setPayouts(payoutData);
            setTotalEarnings(total);
        } catch (error)
        {
            console.error('Error loading payouts:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const handleRefresh = async () =>
    {
        setRefreshing(true);
        await loadPayouts();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number, currency: string = 'USD') =>
    {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount);
    };

    const formatDate = (dateString: string) =>
    {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusColor = (status: string) =>
    {
        switch (status)
        {
            case 'success':
                return 'bg-emerald-100 text-emerald-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading)
    {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-600">Loading payout history...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-2" />
                            Payout History
                        </CardTitle>
                        <CardDescription>Your recent payouts and earnings</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Total Earnings Summary */}
                <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                            <p className="text-3xl font-bold text-emerald-600">
                                {formatCurrency(totalEarnings)}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        From {payouts.filter(p => p.status === 'success').length} successful payouts
                    </p>
                </div>

                {/* Payouts List */}
                {payouts.length === 0 ? (
                    <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No payouts yet</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Payouts will appear here when orders are delivered
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm text-gray-700">Recent Payouts</h4>
                        {payouts.map((payout) => (
                            <div
                                key={payout.id}
                                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <p className="font-medium text-sm">Order #{payout.orderId}</p>
                                            <Badge className={getStatusColor(payout.status)}>
                                                {payout.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 space-x-3">
                                            <span className="flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {formatDate(payout.createdAt)}
                                            </span>
                                            {payout.stripeTransferId && (
                                                <span className="font-mono">
                                                    {payout.stripeTransferId.substring(0, 20)}...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-emerald-600">
                                            {formatCurrency(payout.vendorAmount, payout.currency)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            of {formatCurrency(payout.totalAmount, payout.currency)}
                                        </p>
                                    </div>
                                </div>

                                {payout.status === 'success' && (
                                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                        <p className="text-xs text-gray-600">
                                            Platform fee: {formatCurrency(payout.platformAmount, payout.currency)}
                                        </p>
                                        {payout.stripeTransferId && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs h-7"
                                                onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                                            >
                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                View in Stripe
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {payout.status === 'failed' && (
                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs text-red-600">
                                            Payout failed. Please contact support if this persists.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* View All Link */}
                {payouts.length >= maxItems && (
                    <div className="text-center pt-4 border-t">
                        <Button variant="outline" className="w-full">
                            View All Payouts
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
