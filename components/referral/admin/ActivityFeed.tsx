/**
 * Activity Feed Component
 * Displays real-time stream of sign-ups, purchases, and points awarded
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import
    {
        UserPlus,
        ShoppingCart,
        Award,
        Clock,
        Filter,
        RefreshCw,
        Mail,
        DollarSign,
        TrendingUp,
        Activity as ActivityIcon,
    } from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem
{
    id: string;
    type: 'signup' | 'purchase' | 'points';
    subType?: 'signup' | 'purchase';
    timestamp: string;
    referrer: {
        id: string;
        name: string;
        email: string;
        referralCode: string;
    };
    referee: {
        name: string;
        email: string;
    };
    points?: number;
    amount?: number;
    commission?: number;
    orderId?: string;
    description: string;
}

interface ActivityFeedProps
{
    token: string; // Firebase auth token for API calls
    maxItems?: number; // Maximum number of items to display
    enableRealtime?: boolean; // Enable Firestore real-time listeners
}

type ActivityFilter = 'all' | 'signup' | 'purchase' | 'points';

/**
 * ActivityFeed Component
 * Displays a real-time feed of all referral program activities
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({
    token,
    maxItems = 50,
    enableRealtime = true,
}) =>
{
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<ActivityFilter>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    /**
     * Fetch activities from API
     * Requirements: 13.1, 13.2, 13.3
     */
    const fetchActivities = useCallback(async (showToast = false) =>
    {
        try
        {
            if (showToast)
            {
                setIsRefreshing(true);
            } else
            {
                setLoading(true);
            }
            setError(null);

            const params = new URLSearchParams({
                limit: maxItems.toString(),
                type: filter,
            });

            const response = await fetch(`/api/referral/admin/activity?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok)
            {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to fetch activities');
            }

            const data = await response.json();

            if (data.success && data.activities)
            {
                setActivities(data.activities);
                if (showToast)
                {
                    toast.success('Activity feed refreshed');
                }
            } else
            {
                throw new Error('Invalid response format');
            }
        } catch (err: any)
        {
            console.error('Error fetching activities:', err);
            setError(err.message || 'Failed to load activity feed');
            if (showToast)
            {
                toast.error('Failed to refresh', {
                    description: 'Could not retrieve latest activities',
                });
            }
        } finally
        {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [token, maxItems, filter]);

    /**
     * Set up Firestore real-time listeners
     * Requirement: 13.4 - Real-time updates using Firestore listeners
     */
    useEffect(() =>
    {
        if (!enableRealtime)
        {
            fetchActivities();
            return;
        }

        const unsubscribers: (() => void)[] = [];

        try
        {
            // Listen to referrals collection for sign-ups
            if (filter === 'all' || filter === 'signup')
            {
                const referralsQuery = query(
                    collection(db, 'referrals'),
                    orderBy('createdAt', 'desc'),
                    limit(maxItems)
                );

                const unsubReferrals = onSnapshot(
                    referralsQuery,
                    () =>
                    {
                        // Refresh data when changes detected
                        fetchActivities();
                    },
                    (error) =>
                    {
                        console.error('Error in referrals listener:', error);
                    }
                );

                unsubscribers.push(unsubReferrals);
            }

            // Listen to referralPurchases collection for purchases
            if (filter === 'all' || filter === 'purchase')
            {
                const purchasesQuery = query(
                    collection(db, 'referralPurchases'),
                    orderBy('createdAt', 'desc'),
                    limit(maxItems)
                );

                const unsubPurchases = onSnapshot(
                    purchasesQuery,
                    () =>
                    {
                        // Refresh data when changes detected
                        fetchActivities();
                    },
                    (error) =>
                    {
                        console.error('Error in purchases listener:', error);
                    }
                );

                unsubscribers.push(unsubPurchases);
            }

            // Listen to referralTransactions collection for points
            if (filter === 'all' || filter === 'points')
            {
                const transactionsQuery = query(
                    collection(db, 'referralTransactions'),
                    orderBy('createdAt', 'desc'),
                    limit(maxItems)
                );

                const unsubTransactions = onSnapshot(
                    transactionsQuery,
                    () =>
                    {
                        // Refresh data when changes detected
                        fetchActivities();
                    },
                    (error) =>
                    {
                        console.error('Error in transactions listener:', error);
                    }
                );

                unsubscribers.push(unsubTransactions);
            }
        } catch (error)
        {
            console.error('Error setting up listeners:', error);
            // Fallback to API fetch
            fetchActivities();
        }

        // Cleanup listeners on unmount
        return () =>
        {
            unsubscribers.forEach((unsub) => unsub());
        };
    }, [enableRealtime, filter, maxItems, fetchActivities]);

    /**
     * Handle filter change
     * Requirement: 13.5 - Filter activities by type
     */
    const handleFilterChange = (newFilter: ActivityFilter) =>
    {
        setFilter(newFilter);
    };

    /**
     * Handle manual refresh
     */
    const handleRefresh = () =>
    {
        fetchActivities(true);
    };

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
     * Format relative time
     */
    const formatRelativeTime = (timestamp: string): string =>
    {
        try
        {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch
        {
            return 'Unknown time';
        }
    };

    /**
     * Get icon for activity type
     */
    const getActivityIcon = (type: string, subType?: string) =>
    {
        if (type === 'signup')
        {
            return <UserPlus className="h-4 w-4" />;
        }
        if (type === 'purchase')
        {
            return <ShoppingCart className="h-4 w-4" />;
        }
        if (type === 'points')
        {
            if (subType === 'signup')
            {
                return <UserPlus className="h-4 w-4" />;
            }
            if (subType === 'purchase')
            {
                return <ShoppingCart className="h-4 w-4" />;
            }
            return <Award className="h-4 w-4" />;
        }
        return <ActivityIcon className="h-4 w-4" />;
    };

    /**
     * Get badge variant for activity type
     */
    const getActivityBadge = (type: string) =>
    {
        switch (type)
        {
            case 'signup':
                return { variant: 'default' as const, label: 'Sign-up' };
            case 'purchase':
                return { variant: 'secondary' as const, label: 'Purchase' };
            case 'points':
                return { variant: 'outline' as const, label: 'Points' };
            default:
                return { variant: 'outline' as const, label: 'Activity' };
        }
    };

    /**
     * Render activity item
     */
    const renderActivityItem = (activity: ActivityItem) =>
    {
        const badge = getActivityBadge(activity.type);
        const icon = getActivityIcon(activity.type, activity.subType);

        return (
            <div
                key={activity.id}
                className="flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
            >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {icon}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(activity.timestamp)}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm mb-2">{activity.description}</p>

                    {/* Details */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {/* Referrer */}
                        <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span className="font-medium">{activity.referrer.name}</span>
                            <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">
                                {activity.referrer.referralCode}
                            </Badge>
                        </div>

                        {/* Referee */}
                        <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{activity.referee.name}</span>
                        </div>

                        {/* Points */}
                        {activity.points !== undefined && (
                            <div className="flex items-center gap-1 text-primary font-medium">
                                <Award className="h-3 w-3" />
                                <span>+{formatNumber(activity.points)} pts</span>
                            </div>
                        )}

                        {/* Amount */}
                        {activity.amount !== undefined && (
                            <div className="flex items-center gap-1 font-medium">
                                <DollarSign className="h-3 w-3" />
                                <span>{formatCurrency(activity.amount)}</span>
                            </div>
                        )}

                        {/* Commission */}
                        {activity.commission !== undefined && (
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                                <span>Commission: {formatCurrency(activity.commission)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Loading skeleton
     */
    if (loading && activities.length === 0)
    {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ActivityIcon className="h-5 w-5" />
                        Activity Feed
                    </CardTitle>
                    <CardDescription>Loading recent activities...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start gap-4 animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 rounded bg-muted" />
                                    <div className="h-3 w-1/2 rounded bg-muted" />
                                    <div className="h-3 w-2/3 rounded bg-muted" />
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
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <ActivityIcon className="h-5 w-5" />
                            Activity Feed
                            {enableRealtime && (
                                <Badge variant="outline" className="text-xs">
                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1" />
                                    Live
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Real-time stream of referral program activities
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Filter Tabs - Requirement: 13.5 */}
                <Tabs value={filter} onValueChange={(value: any) => handleFilterChange(value)} className="mb-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all" className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            All
                        </TabsTrigger>
                        <TabsTrigger value="signup" className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Sign-ups
                        </TabsTrigger>
                        <TabsTrigger value="purchase" className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Purchases
                        </TabsTrigger>
                        <TabsTrigger value="points" className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Points
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Error State */}
                {error && (
                    <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 mb-4">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Activities List */}
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <ActivityIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No activities yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            {filter === 'all'
                                ? 'Activities will appear here as referrers earn rewards and referees sign up or make purchases.'
                                : `No ${filter} activities found. Try selecting a different filter.`}
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[600px] rounded-md border">
                        <div className="divide-y">
                            {activities.map((activity) => renderActivityItem(activity))}
                        </div>
                    </ScrollArea>
                )}

                {/* Footer */}
                {activities.length > 0 && (
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Showing {activities.length} recent activities</span>
                        {enableRealtime && (
                            <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                Updates automatically
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
