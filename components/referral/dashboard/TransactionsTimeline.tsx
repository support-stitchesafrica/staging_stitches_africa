/**
 * Transactions Timeline Component
 * Displays recent transactions with type, description, points, date
 * Requirements: 7.5
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import
{
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Clock, Award, ShoppingCart, TrendingUp, ExternalLink } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { ReferralTransaction } from '@/lib/referral/types';
import { toast } from 'sonner';

interface TransactionsTimelineProps
{
    userId: string;
    maxItems?: number;
}

/**
 * TransactionsTimeline Component
 * Displays a timeline of recent point-earning transactions
 * Requirement: 7.5 - Display points history showing all earned points with dates and sources
 */
export const TransactionsTimeline: React.FC<TransactionsTimelineProps> = ({
    userId,
    maxItems = 10
}) =>
{
    const [transactions, setTransactions] = useState<ReferralTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);
    const DISPLAY_LIMIT = 5;

    /**
     * Set up real-time listener for transactions
     * Requirement: 7.5 - Display transaction history with real-time updates
     */
    useEffect(() =>
    {
        if (!userId)
        {
            setError('User ID is required');
            setLoading(false);
            return;
        }

        // Query transactions for this referrer
        const transactionsQuery = query(
            collection(db, 'referralTransactions'),
            where('referrerId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(maxItems)
        );

        // Set up real-time listener
        const unsubscribe = onSnapshot(
            transactionsQuery,
            (snapshot) =>
            {
                const transactionsData: ReferralTransaction[] = [];
                snapshot.forEach((doc) =>
                {
                    transactionsData.push({
                        id: doc.id,
                        ...doc.data(),
                    } as ReferralTransaction);
                });

                setTransactions(transactionsData);
                setLoading(false);
                setError(null);
            },
            (err) =>
            {
                console.error('Error fetching transactions:', err);
                setError('Failed to load transactions');
                setLoading(false);
                toast.error('Failed to load transactions', {
                    description: 'Could not retrieve your transaction history',
                });
            }
        );

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [userId, maxItems]);

    /**
     * Format date for display
     * Requirement: 7.5 - Display dates
     */
    const formatDate = (timestamp: any): string =>
    {
        if (!timestamp) return 'N/A';

        let date: Date;
        if (timestamp.toDate)
        {
            date = timestamp.toDate();
        } else if (timestamp.seconds)
        {
            date = new Date(timestamp.seconds * 1000);
        } else
        {
            date = new Date(timestamp);
        }

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        // Relative time for recent transactions
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

        // Absolute date for older transactions
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    /**
     * Format currency
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
     * Get transaction icon based on type
     * Requirement: 7.5 - Display transaction type
     */
    const getTransactionIcon = (type: 'signup' | 'purchase') =>
    {
        switch (type)
        {
            case 'signup':
                return <Award className="h-5 w-5 text-blue-600" />;
            case 'purchase':
                return <ShoppingCart className="h-5 w-5 text-green-600" />;
            default:
                return <TrendingUp className="h-5 w-5 text-purple-600" />;
        }
    };

    /**
     * Get transaction badge based on type
     */
    const getTransactionBadge = (type: 'signup' | 'purchase') =>
    {
        switch (type)
        {
            case 'signup':
                return (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Sign-up
                    </Badge>
                );
            case 'purchase':
                return (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Purchase
                    </Badge>
                );
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    if (loading)
    {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Transactions
                    </CardTitle>
                    <CardDescription>Loading your transaction history...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start gap-4 animate-pulse">
                                <div className="h-10 w-10 bg-muted rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-muted rounded" />
                                    <div className="h-3 w-1/2 bg-muted rounded" />
                                </div>
                                <div className="h-6 w-16 bg-muted rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error)
    {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Transactions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-destructive">{error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600" />
                    </div>
                    <span className="truncate">Recent Transactions</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Your latest point-earning activities
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                {transactions.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                        <p className="text-sm text-muted-foreground">
                            Your transaction history will appear here once you start earning points
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {transactions.slice(0, DISPLAY_LIMIT).map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-start gap-2 sm:gap-4 pb-3 sm:pb-4 border-b last:border-b-0 last:pb-0"
                                >
                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center">
                                            {getTransactionIcon(transaction.type)}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Description and Badge */}
                                        <div className="flex items-start justify-between gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                                            <p className="text-xs sm:text-sm font-medium leading-tight">
                                                {transaction.description}
                                            </p>
                                            <div className="flex-shrink-0">
                                                {getTransactionBadge(transaction.type)}
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                            <span className="truncate max-w-[120px] sm:max-w-none">{transaction.metadata.refereeName}</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span className="truncate">{formatDate(transaction.createdAt)}</span>
                                            {transaction.amount && (
                                                <>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span className="truncate">{formatCurrency(transaction.amount)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Points */}
                                    <div className="flex-shrink-0 text-right">
                                        <div className="text-base sm:text-lg font-bold text-green-600">
                                            +{transaction.points.toLocaleString()}
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-muted-foreground">pts</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Results count and View All button */}
                        {transactions.length > 0 && (
                            <div className="flex items-center justify-between pt-2">
                                <div className="text-sm text-gray-600">
                                    Showing {Math.min(DISPLAY_LIMIT, transactions.length)} of {transactions.length} transaction
                                    {transactions.length === 1 ? '' : 's'}
                                </div>
                                {transactions.length > DISPLAY_LIMIT && (
                                    <Dialog open={showAll} onOpenChange={setShowAll}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                More
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                    <Clock className="h-5 w-5" />
                                                    All Your Transactions ({transactions.length})
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Complete history of all your point-earning activities
                                                </DialogDescription>
                                            </DialogHeader>
                                            <ScrollArea className="flex-1 overflow-y-auto pr-4">
                                                <div className="space-y-4">
                                                    {transactions.map((transaction) => (
                                                        <div
                                                            key={transaction.id}
                                                            className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
                                                        >
                                                            {/* Icon */}
                                                            <div className="flex-shrink-0 mt-1">
                                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                                    {getTransactionIcon(transaction.type)}
                                                                </div>
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                {/* Description and Badge */}
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <p className="text-sm font-medium leading-tight">
                                                                        {transaction.description}
                                                                    </p>
                                                                    {getTransactionBadge(transaction.type)}
                                                                </div>

                                                                {/* Metadata */}
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <span>{transaction.metadata.refereeName}</span>
                                                                    <span>•</span>
                                                                    <span>{formatDate(transaction.createdAt)}</span>
                                                                    {transaction.amount && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>{formatCurrency(transaction.amount)}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Points */}
                                                            <div className="flex-shrink-0 text-right">
                                                                <div className="text-lg font-bold text-green-600">
                                                                    +{transaction.points.toLocaleString()}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">points</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};
