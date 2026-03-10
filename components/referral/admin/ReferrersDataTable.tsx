/**
 * Referrers Data Table Component
 * Displays comprehensive table with all referrers
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import
{
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import
{
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import
{
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { ReferralUser } from '@/lib/referral/types';

interface ReferrersDataTableProps
{
    token: string; // Firebase auth token for API calls
    onViewDetails?: (referrer: ReferralUser) => void; // Callback when viewing details
}

interface PaginationInfo
{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

type SortField = 'name' | 'referrals' | 'points' | 'revenue' | 'date';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'active' | 'inactive';

/**
 * ReferrersDataTable Component
 * Comprehensive table with search, filter, sort, and pagination
 */
export const ReferrersDataTable: React.FC<ReferrersDataTableProps> = ({
    token,
    onViewDetails,
}) =>
{
    const [referrers, setReferrers] = useState<ReferralUser[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: false,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter and sort state
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [filter, setFilter] = useState<FilterType>('all');
    const [itemsPerPage, setItemsPerPage] = useState(10);

    /**
     * Debounce search input
     * Requirement: 12.3 - Search functionality
     */
    useEffect(() =>
    {
        const timer = setTimeout(() =>
        {
            setDebouncedSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    /**
     * Fetch referrers from API
     * Requirements: 12.1, 12.2, 12.3, 12.4
     */
    const fetchReferrers = useCallback(async () =>
    {
        try
        {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: itemsPerPage.toString(),
                sortBy,
                sortOrder,
                filter,
            });

            if (debouncedSearch)
            {
                params.append('search', debouncedSearch);
            }

            const response = await fetch(`/api/referral/admin/referrers?${params}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok)
            {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to fetch referrers');
            }

            const data = await response.json();

            if (data.success && data.referrers)
            {
                setReferrers(data.referrers);
                setPagination(data.pagination);
            } else
            {
                throw new Error('Invalid response format');
            }
        } catch (err: any)
        {
            console.error('Error fetching referrers:', err);
            setError(err.message || 'Failed to load referrers');
            toast.error('Failed to load referrers', {
                description: 'Could not retrieve referrer data',
            });
        } finally
        {
            setLoading(false);
        }
    }, [token, pagination.currentPage, itemsPerPage, sortBy, sortOrder, filter, debouncedSearch]);

    /**
     * Fetch referrers when dependencies change
     */
    useEffect(() =>
    {
        if (token)
        {
            fetchReferrers();
        }
    }, [fetchReferrers, token]);

    /**
     * Reset to page 1 when search or filters change
     */
    useEffect(() =>
    {
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }, [debouncedSearch, filter, itemsPerPage]);

    /**
     * Handle sort column click
     * Requirement: 12.4 - Sorting functionality
     */
    const handleSort = (field: SortField) =>
    {
        if (sortBy === field)
        {
            // Toggle sort order
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else
        {
            // New field, default to descending
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    /**
     * Render sort icon for column headers
     */
    const renderSortIcon = (field: SortField) =>
    {
        if (sortBy !== field)
        {
            return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
        }
        return sortOrder === 'asc' ? (
            <ArrowUp className="h-4 w-4 ml-1" />
        ) : (
            <ArrowDown className="h-4 w-4 ml-1" />
        );
    };

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
    const formatDate = (dateString: string | null): string =>
    {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    /**
     * Handle page navigation
     */
    const goToPage = (page: number) =>
    {
        setPagination((prev) => ({ ...prev, currentPage: page }));
    };

    if (loading && referrers.length === 0)
    {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="h-9 w-64 bg-muted rounded animate-pulse" />
                    <div className="flex gap-2">
                        <div className="h-9 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-9 w-32 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <div className="border rounded-lg">
                    <div className="p-8 text-center">
                        <p className="text-muted-foreground">Loading referrers...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Search and Filters - Requirement: 12.3, 12.4 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 text-sm sm:text-base"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                        <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => setItemsPerPage(parseInt(value))}
                    >
                        <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
                            <SelectValue placeholder="Per page" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 per page</SelectItem>
                            <SelectItem value="25">25 per page</SelectItem>
                            <SelectItem value="50">50 per page</SelectItem>
                            <SelectItem value="100">100 per page</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table - Requirement: 12.1, 12.2 */}
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[150px]">
                                <button
                                    onClick={() => handleSort('name')}
                                    className="flex items-center hover:text-foreground transition-colors"
                                >
                                    Name
                                    {renderSortIcon('name')}
                                </button>
                            </TableHead>
                            <TableHead className="min-w-[200px] hidden md:table-cell">Email</TableHead>
                            <TableHead className="min-w-[100px] hidden lg:table-cell">Code</TableHead>
                            <TableHead className="min-w-[100px]">
                                <button
                                    onClick={() => handleSort('referrals')}
                                    className="flex items-center hover:text-foreground transition-colors"
                                >
                                    Referrals
                                    {renderSortIcon('referrals')}
                                </button>
                            </TableHead>
                            <TableHead className="min-w-[100px] hidden sm:table-cell">
                                <button
                                    onClick={() => handleSort('points')}
                                    className="flex items-center hover:text-foreground transition-colors"
                                >
                                    Points
                                    {renderSortIcon('points')}
                                </button>
                            </TableHead>
                            <TableHead className="min-w-[120px] hidden lg:table-cell">
                                <button
                                    onClick={() => handleSort('revenue')}
                                    className="flex items-center hover:text-foreground transition-colors"
                                >
                                    Revenue
                                    {renderSortIcon('revenue')}
                                </button>
                            </TableHead>
                            <TableHead className="min-w-[100px] hidden sm:table-cell">Status</TableHead>
                            <TableHead className="min-w-[120px] hidden xl:table-cell">
                                <button
                                    onClick={() => handleSort('date')}
                                    className="flex items-center hover:text-foreground transition-colors"
                                >
                                    Joined
                                    {renderSortIcon('date')}
                                </button>
                            </TableHead>
                            <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {error ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8">
                                    <p className="text-destructive">{error}</p>
                                </TableCell>
                            </TableRow>
                        ) : referrers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8">
                                    <p className="text-muted-foreground">
                                        {debouncedSearch || filter !== 'all'
                                            ? 'No referrers found matching your criteria'
                                            : 'No referrers yet'}
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            referrers.map((referrer) => (
                                <TableRow key={referrer.userId}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{referrer.fullName}</span>
                                            <span className="text-xs text-muted-foreground md:hidden">
                                                {referrer.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground hidden md:table-cell">{referrer.email}</TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                            {referrer.referralCode}
                                        </code>
                                    </TableCell>
                                    <TableCell>{formatNumber(referrer.totalReferrals)}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{formatNumber(referrer.totalPoints)}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{formatCurrency(referrer.totalRevenue)}</TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge variant={referrer.isActive ? 'default' : 'secondary'}>
                                            {referrer.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground hidden xl:table-cell">
                                        {formatDate(referrer.createdAt as any)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewDetails?.(referrer)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">View details</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination - Requirement: 12.4 */}
            {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                        Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
                        {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                        {pagination.totalItems} referrers
                    </p>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(1)}
                            disabled={!pagination.hasPreviousPage || loading}
                            className="h-8 w-8 sm:h-9 sm:w-auto px-2 sm:px-3"
                        >
                            <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sr-only">First page</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(pagination.currentPage - 1)}
                            disabled={!pagination.hasPreviousPage || loading}
                            className="h-8 w-8 sm:h-9 sm:w-auto px-2 sm:px-3"
                        >
                            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sr-only">Previous page</span>
                        </Button>

                        <span className="text-xs sm:text-sm font-medium px-1 sm:px-2">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(pagination.currentPage + 1)}
                            disabled={!pagination.hasNextPage || loading}
                            className="h-8 w-8 sm:h-9 sm:w-auto px-2 sm:px-3"
                        >
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sr-only">Next page</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(pagination.totalPages)}
                            disabled={!pagination.hasNextPage || loading}
                            className="h-8 w-8 sm:h-9 sm:w-auto px-2 sm:px-3"
                        >
                            <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sr-only">Last page</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
