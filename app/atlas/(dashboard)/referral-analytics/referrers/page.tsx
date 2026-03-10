/**
 * Referrers List Page for Atlas Dashboard
 * Paginated list of all referrers with search and filtering
 * Optimized with performance monitoring, caching, and lazy loading
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ArrowUpDown,
  ChevronLeft,
  ExternalLink,
  Users,
  DollarSign
} from 'lucide-react';
import { 
  ReferralAnalyticsService, 
  TopReferrer 
} from '@/lib/atlas/unified-analytics/services/referral-analytics-service';
import { LoadingSpinner } from '@/components/ui/optimized-loader';
import { useAnalytics } from '@/lib/analytics';
import { useRouter } from 'next/navigation';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { usePerformanceMonitor, useDebouncedState } from '@/lib/utils/performance-utils';
import { useCachedData, cacheKeys, preloadData } from '@/lib/utils/cache-utils';

interface ReferrersListState {
  referrers: TopReferrer[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  totalCount: number;
}

// Optimized referrer card skeleton component
const ReferrerCardSkeleton = React.memo(() => (
  <div className="p-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-48 mb-1"></div>
          <div className="flex items-center space-x-4">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="h-6 bg-gray-200 rounded w-20 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
));

ReferrerCardSkeleton.displayName = 'ReferrerCardSkeleton';

// Optimized referrer card component with React.memo
const ReferrerCard = React.memo<{
  referrer: TopReferrer;
  index: number;
  onViewDetails: (referrerId: string) => void;
}>(({ referrer, index, onViewDetails }) => (
  <div
    className="p-4 hover:bg-gray-50 transition-colors duration-150"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {referrer.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-sm font-semibold text-gray-900">
              {referrer.fullName}
            </p>
            <Badge variant="outline" className="text-xs">
              {referrer.referralCode}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            {referrer.email}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{referrer.totalReferrals} referrals</span>
            <span>{referrer.totalDownloads} downloads</span>
            <span>{referrer.totalClicks} clicks</span>
            <span>{referrer.conversionRate.toFixed(1)}% conversion</span>
            <span>Joined {referrer.createdAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ${referrer.totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            {referrer.totalPoints.toLocaleString()} points
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(referrer.id);
          }}
          className="gap-1"
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
      </div>
    </div>
  </div>
), (prevProps, nextProps) => {
  return (
    prevProps.referrer.id === nextProps.referrer.id &&
    prevProps.referrer.totalRevenue === nextProps.referrer.totalRevenue &&
    prevProps.referrer.totalReferrals === nextProps.referrer.totalReferrals &&
    prevProps.index === nextProps.index
  );
});

ReferrerCard.displayName = 'ReferrerCard';

// Optimized summary card component
const SummaryCard = React.memo<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}>(({ title, value, icon, color, loading }) => (
  <Card className="bg-white border border-gray-200 shadow-sm">
    <CardContent className="p-4">
      {loading ? (
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {value.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
));

SummaryCard.displayName = 'SummaryCard';

export default function ReferrersListPage() {
  // Performance monitoring
  usePerformanceMonitor('ReferrersListPage');
  
  const router = useRouter();
  const { trackInteraction, trackPageView } = useAnalytics('ReferrersListPage');
  
  const [state, setState] = useState<ReferrersListState>({
    referrers: [],
    loading: true,
    error: null,
    hasMore: true,
    totalCount: 0
  });
  
  // Use debounced search for better performance
  const [searchTerm, setSearchTerm] = useDebouncedState('', 300);
  const [sortBy, setSortBy] = useState<'revenue' | 'referrals' | 'name'>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 10; // Reduced from 20 for faster loading

  // Cache total count
  const {
    data: totalCount,
    loading: countLoading
  } = useCachedData(
    cacheKeys.analytics('referrers-count', 'total'),
    () => ReferralAnalyticsService.getTotalReferrersCount(),
    10 * 60 * 1000 // 10 minutes cache for count
  );

  // Track page view
  useEffect(() => {
    trackPageView('/atlas/referral-analytics/referrers', 'Atlas Referrers List');
  }, [trackPageView]);

  // Load initial referrers with caching and optimization
  const loadReferrers = useCallback(async (reset = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Always use the full method for proper pagination support
      const { referrers, lastDoc } = await ReferralAnalyticsService.getReferrersList(
        pageSize,
        reset ? undefined : state.lastDoc
      );
      
      // Get total count on initial load
      let newTotalCount = totalCount;
      if (reset && !totalCount) {
        try {
          newTotalCount = await ReferralAnalyticsService.getTotalReferrersCount();
        } catch (error) {
          console.error('Error getting total count:', error);
          newTotalCount = 0;
        }
      }
      
      setState(prev => ({
        ...prev,
        referrers: reset ? referrers : [...prev.referrers, ...referrers],
        loading: false,
        hasMore: referrers.length === pageSize,
        lastDoc,
        totalCount: newTotalCount || prev.totalCount
      }));
    } catch (error) {
      console.error('Error loading referrers:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load referrers'
      }));
    }
  }, [state.lastDoc, totalCount, pageSize]);

  // Initial load
  useEffect(() => {
    loadReferrers(true);
  }, []);

  // Preload next page data for better UX
  useEffect(() => {
    if (state.hasMore && !state.loading && state.referrers.length > 0) {
      // Preload next page in background
      setTimeout(() => {
        const cacheKey = cacheKeys.analytics('referrers-list', `next-page-${state.referrers.length}`);
        preloadData(
          cacheKey,
          () => ReferralAnalyticsService.getReferrersList(pageSize, state.lastDoc),
          5 * 60 * 1000
        );
      }, 1000);
    }
  }, [state.hasMore, state.loading, state.referrers.length, state.lastDoc, pageSize]);

  // Optimized filter and sort with memoization
  const filteredAndSortedReferrers = useMemo(() => {
    let filtered = state.referrers;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(referrer =>
        referrer.fullName.toLowerCase().includes(term) ||
        referrer.email.toLowerCase().includes(term) ||
        referrer.referralCode.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortBy) {
        case 'revenue':
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
          break;
        case 'referrals':
          aValue = a.totalReferrals;
          bValue = b.totalReferrals;
          break;
        case 'name':
          aValue = a.fullName;
          bValue = b.fullName;
          break;
        default:
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
    
    return filtered;
  }, [state.referrers, searchTerm, sortBy, sortOrder]);

  // Paginated referrers with virtual scrolling for large lists
  const displayReferrers = filteredAndSortedReferrers; // Use all loaded referrers, no client-side pagination

  // Optimized event handlers with useCallback
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    trackInteraction('search_input', 'change');
  }, [setSearchTerm, trackInteraction]);

  const handleSort = useCallback((field: 'revenue' | 'referrals' | 'name') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    trackInteraction('sort_button', 'click');
  }, [sortBy, sortOrder, trackInteraction]);

  const handleViewDetails = useCallback((referrerId: string) => {
    trackInteraction('referrer_details_button', 'click');
    router.push(`/atlas/referral-analytics/referrer/${referrerId}`);
  }, [router, trackInteraction]);

  const handleLoadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      loadReferrers(false);
    }
  }, [state.loading, state.hasMore, loadReferrers]);

  // Memoized summary calculations
  const summaryData = useMemo(() => ({
    totalRevenue: state.referrers.reduce((sum, r) => sum + r.totalRevenue, 0),
    totalReferrals: state.referrers.reduce((sum, r) => sum + r.totalReferrals, 0),
    totalClicks: state.referrers.reduce((sum, r) => sum + r.totalClicks, 0),
    totalDownloads: state.referrers.reduce((sum, r) => sum + r.totalDownloads, 0)
  }), [state.referrers]);

  if (state.error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Referrers
          </h3>
          <p className="text-gray-600 mb-4">{state.error}</p>
          <Button onClick={() => loadReferrers(true)} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Referrers</h1>
          <p className="text-gray-600 mt-2">
            Manage and view detailed analytics for all referrers
          </p>
        </div>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Analytics
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Referrers"
          value={totalCount || 0}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
          loading={countLoading}
        />
        <SummaryCard
          title="Total Revenue"
          value={summaryData.totalRevenue}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          color="bg-green-100"
          loading={state.loading && state.referrers.length === 0}
        />
        <SummaryCard
          title="Total Referrals"
          value={summaryData.totalReferrals}
          icon={<Users className="h-5 w-5 text-purple-600" />}
          color="bg-purple-100"
          loading={state.loading && state.referrers.length === 0}
        />
        <SummaryCard
          title="Total Clicks"
          value={summaryData.totalClicks}
          icon={<Eye className="h-5 w-5 text-indigo-600" />}
          color="bg-indigo-100"
          loading={state.loading && state.referrers.length === 0}
        />
      </div>

      {/* Filters and Search */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or referral code..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'revenue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('revenue')}
                className="gap-2"
              >
                Revenue
                <ArrowUpDown className="h-3 w-3" />
              </Button>
              <Button
                variant={sortBy === 'referrals' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('referrals')}
                className="gap-2"
              >
                Referrals
                <ArrowUpDown className="h-3 w-3" />
              </Button>
              <Button
                variant={sortBy === 'name' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('name')}
                className="gap-2"
              >
                Name
                <ArrowUpDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrers List */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Referrers ({filteredAndSortedReferrers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {state.loading && state.referrers.length === 0 ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, index) => (
                <ReferrerCardSkeleton key={index} />
              ))}
            </div>
          ) : displayReferrers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No referrers found
              </h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria' : 'No referrers have been created yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayReferrers.map((referrer, index) => (
                <ReferrerCard
                  key={referrer.id}
                  referrer={referrer}
                  index={index}
                  onViewDetails={handleViewDetails}
                />
              ))}
              {state.loading && state.referrers.length > 0 && (
                <div className="p-4 text-center">
                  <LoadingSpinner />
                  <p className="text-sm text-gray-500 mt-2">Loading more referrers...</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load More Button for server-side pagination */}
      {state.hasMore && !searchTerm && (
        <div className="text-center">
          <Button
            onClick={handleLoadMore}
            disabled={state.loading}
            variant="outline"
            className="gap-2"
          >
            {state.loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Load More Referrers
          </Button>
        </div>
      )}

      {/* Display current count */}
      {state.referrers.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Showing {displayReferrers.length} of {state.totalCount || 'many'} referrers
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </p>
        </div>
      )}
    </div>
  );
}