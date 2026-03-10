/**
 * Referrals Table Component
 * Displays list of referrals with search and sorting functionality
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import
{
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import
{
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Users, ExternalLink } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Referral } from '@/lib/referral/types';
import { toast } from 'sonner';

interface ReferralsTableProps
{
    userId: string;
}

type SortField = 'signUpDate' | 'pointsEarned' | 'totalSpent';
type SortDirection = 'asc' | 'desc';

/**
 * ReferralsTable Component
 * Displays all referrals for a referrer with search and sorting capabilities
 */
export const ReferralsTable: React.FC<ReferralsTableProps> = ({ userId }) =>
{
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('signUpDate');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [showAll, setShowAll] = useState(false);
    const DISPLAY_LIMIT = 5;

    /**
     * Set up real-time listener for referrals
     * Requirement: 6.1 - Display referee details
     */
    useEffect(() =>
    {
        if (!userId)
        {
            setError('User ID is required');
            setLoading(false);
            return;
        }

        // Query referrals for this referrer
        const referralsQuery = query(
            collection(db, 'referrals'),
            where('referrerId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        // Set up real-time listener
        const unsubscribe = onSnapshot(
            referralsQuery,
            (snapshot) =>
            {
                const referralsData: Referral[] = [];
                snapshot.forEach((doc) =>
                {
                    referralsData.push({
                        id: doc.id,
                        ...doc.data(),
                    } as Referral);
                });

                setReferrals(referralsData);
                setLoading(false);
                setError(null);
            },
            (err) =>
            {
                console.error('Error fetching referrals:', err);
                setError('Failed to load referrals');
                setLoading(false);
                toast.error('Failed to load referrals', {
                    description: 'Could not retrieve your referral list',
                });
            }
        );

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [userId]);

    /**
     * Filter and sort referrals
     * Requirements: 6.4 - Search by name or email, 6.5 - Sort by date, points, or purchase amount
     */
    const filteredAndSortedReferrals = useMemo(() =>
    {
        let filtered = referrals;

        // Apply search filter - Requirement: 6.4
        if (searchQuery.trim())
        {
            const query = searchQuery.toLowerCase();
            filtered = referrals.filter(
                (referral) =>
                    referral.refereeName.toLowerCase().includes(query) ||
                    referral.refereeEmail.toLowerCase().includes(query)
            );
        }

        // Apply sorting - Requirement: 6.5
        const sorted = [...filtered].sort((a, b) =>
        {
            let aValue: number;
            let bValue: number;

            switch (sortField)
            {
                case 'signUpDate':
                    aValue = a.signUpDate?.toMillis?.() || a.signUpDate?.seconds * 1000 || 0;
                    bValue = b.signUpDate?.toMillis?.() || b.signUpDate?.seconds * 1000 || 0;
                    break;
                case 'pointsEarned':
                    aValue = a.pointsEarned || 0;
                    bValue = b.pointsEarned || 0;
                    break;
                case 'totalSpent':
                    aValue = a.totalSpent || 0;
                    bValue = b.totalSpent || 0;
                    break;
                default:
                    return 0;
            }

            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        });

        return sorted;
    }, [referrals, searchQuery, sortField, sortDirection]);

    /**
     * Handle sort field change
     */
    const handleSort = (field: SortField) =>
    {
        if (sortField === field)
        {
            // Toggle direction if same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else
        {
            // Set new field with default descending
            setSortField(field);
            setSortDirection('desc');
        }
    };

    /**
     * Get sort icon for column header
     */
    const getSortIcon = (field: SortField) =>
    {
        if (sortField !== field)
        {
            return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
        }
        return sortDirection === 'asc' ? (
            <ArrowUp className="h-4 w-4 ml-1" />
        ) : (
            <ArrowDown className="h-4 w-4 ml-1" />
        );
    };

    /**
     * Format date for display
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
     * Get status badge variant and label
     * Requirement: 6.1 - Display status
     */
    const getStatusBadge = (status: string) =>
    {
        switch (status)
        {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
            case 'active':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Active</Badge>;
            case 'converted':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Converted</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading)
    {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Your Referrals
                    </CardTitle>
                    <CardDescription>Loading your referral list...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
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
                        <Users className="h-5 w-5" />
                        Your Referrals
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
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
                    </div>
                    <span className="truncate">Your Referrals</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Track all the people you&apos;ve referred and their activity
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                {/* Search Input - Requirement: 6.4 */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        aria-label="Search referrals"
                    />
                </div>

                {/* Referrals Table */}
                {filteredAndSortedReferrals.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            {searchQuery ? 'No referrals found' : 'No referrals yet'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Start sharing your referral code to see your referrals here'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {/* Requirement: 6.1 - Display referee name */}
                                    <TableHead className="min-w-[150px]">Name</TableHead>
                                    {/* Requirement: 6.1 - Display referee email */}
                                    <TableHead className="min-w-[200px] hidden md:table-cell">Email</TableHead>
                                    {/* Requirement: 6.1 - Display sign-up date with sorting */}
                                    <TableHead className="min-w-[140px] hidden lg:table-cell">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('signUpDate')}
                                            className="h-8 px-2 -ml-2"
                                            aria-label="Sort by sign-up date"
                                        >
                                            Sign-Up Date
                                            {getSortIcon('signUpDate')}
                                        </Button>
                                    </TableHead>
                                    {/* Requirement: 6.1 - Display status */}
                                    <TableHead className="min-w-[100px]">Status</TableHead>
                                    {/* Requirement: 6.2 - Display points earned with sorting */}
                                    <TableHead className="min-w-[100px]">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('pointsEarned')}
                                            className="h-8 px-2 -ml-2"
                                            aria-label="Sort by points"
                                        >
                                            Points
                                            {getSortIcon('pointsEarned')}
                                        </Button>
                                    </TableHead>
                                    {/* Requirement: 6.3 - Display total purchases with sorting */}
                                    <TableHead className="min-w-[120px] hidden sm:table-cell">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('totalSpent')}
                                            className="h-8 px-2 -ml-2"
                                            aria-label="Sort by purchase amount"
                                        >
                                            Purchases
                                            {getSortIcon('totalSpent')}
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedReferrals.slice(0, DISPLAY_LIMIT).map((referral) => (
                                    <TableRow key={referral.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{referral.refereeName}</span>
                                                <span className="text-xs text-muted-foreground md:hidden">
                                                    {referral.refereeEmail}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground hidden md:table-cell">
                                            {referral.refereeEmail}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {formatDate(referral.signUpDate)}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(referral.status)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">
                                                {referral.pointsEarned.toLocaleString()}
                                            </span>
                                            <span className="text-muted-foreground text-xs ml-1">pts</span>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    {formatCurrency(referral.totalSpent)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {referral.totalPurchases} {referral.totalPurchases === 1 ? 'order' : 'orders'}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Results count and View All button */}
                {filteredAndSortedReferrals.length > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-gray-600">
                            Showing {Math.min(DISPLAY_LIMIT, filteredAndSortedReferrals.length)} of {filteredAndSortedReferrals.length} referral
                            {filteredAndSortedReferrals.length === 1 ? '' : 's'}
                        </div>
                        {filteredAndSortedReferrals.length > DISPLAY_LIMIT && (
                            <Dialog open={showAll} onOpenChange={setShowAll}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        View All
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            All Your Referrals ({filteredAndSortedReferrals.length})
                                        </DialogTitle>
                                        <DialogDescription>
                                            Complete list of all people you&apos;ve referred
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex-1 overflow-y-auto pr-2">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-white z-10">
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Sign-Up Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Points</TableHead>
                                                    <TableHead>Revenue</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredAndSortedReferrals.map((referral) => (
                                                    <TableRow key={referral.id}>
                                                        <TableCell className="font-medium">{referral.refereeName}</TableCell>
                                                        <TableCell className="text-gray-600">{referral.refereeEmail}</TableCell>
                                                        <TableCell>{formatDate(referral.signUpDate)}</TableCell>
                                                        <TableCell>{getStatusBadge(referral.status)}</TableCell>
                                                        <TableCell>
                                                            <span className="font-medium">{referral.pointsEarned.toLocaleString()}</span>
                                                            <span className="text-gray-500 text-xs ml-1">pts</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <div className="font-medium">{formatCurrency(referral.totalSpent)}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    {referral.totalPurchases} {referral.totalPurchases === 1 ? 'order' : 'orders'}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
