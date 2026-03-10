/**
 * React Query Hooks for Vendor Analytics
 * Implements real-time data updates with optimized caching
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig, invalidateVendorQueries } from './query-client';
import { VendorAnalyticsService } from './analytics-service';
import { ProductRankingService } from './product-ranking-service';
import { CustomerInsightsService } from './customer-insights-service';
import { PayoutService } from './payout-service';
import { InventoryService } from './inventory-service';
import { NotificationService } from './notification-service';
import { DateRange, ExportOptions } from '@/types/vendor-analytics';

// ============================================================================
// Analytics Hooks
// ============================================================================

/**
 * Hook to fetch vendor analytics with real-time updates
 * Requirement 10.1: Load data in under 1 second
 * Requirement 10.2: Real-time updates without page refresh
 */
export function useVendorAnalytics(vendorId: string, dateRange: DateRange) {
  const analyticsService = new VendorAnalyticsService();
  
  return useQuery({
    queryKey: queryKeys.analytics.byVendorAndRange(vendorId, dateRange),
    queryFn: async () => {
      const response = await analyticsService.getVendorAnalytics(vendorId, dateRange);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch analytics');
      }
      return response.data;
    },
    enabled: !!vendorId,
    staleTime: cacheConfig.analytics.staleTime,
    gcTime: cacheConfig.analytics.gcTime,
    // Requirement 10.2: Real-time updates
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to export analytics data
 */
export function useExportAnalytics(vendorId: string) {
  const analyticsService = new VendorAnalyticsService();
  
  return useMutation({
    mutationFn: async (options: ExportOptions) => {
      const response = await analyticsService.exportAnalytics(vendorId, options);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to export data');
      }
      return response.data;
    },
  });
}

// ============================================================================
// Product Analytics Hooks
// ============================================================================

/**
 * Hook to fetch product analytics
 * Requirement 10.3: Instant filter application
 */
export function useProductAnalytics(vendorId: string) {
  const analyticsService = new VendorAnalyticsService();
  
  return useQuery({
    queryKey: queryKeys.products.byVendor(vendorId),
    queryFn: async () => {
      const response = await analyticsService.getProductAnalytics(vendorId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch product analytics');
      }
      return response.data;
    },
    enabled: !!vendorId,
    staleTime: cacheConfig.analytics.staleTime,
    gcTime: cacheConfig.analytics.gcTime,
  });
}

/**
 * Hook to fetch product ranking
 * Requirement 10.4: Rankings update within 12-24 hours
 */
export function useProductRanking(productId: string) {
  const rankingService = new ProductRankingService();
  
  return useQuery({
    queryKey: queryKeys.products.ranking(productId),
    queryFn: async () => {
      const response = await rankingService.getProductRanking(productId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch ranking');
      }
      return response.data;
    },
    enabled: !!productId,
    // Requirement 10.4: Update rankings every 12-24 hours
    staleTime: cacheConfig.rankings.staleTime,
    gcTime: cacheConfig.rankings.gcTime,
    refetchInterval: 12 * 60 * 60 * 1000, // Refetch every 12 hours
  });
}

// ============================================================================
// Customer Insights Hooks
// ============================================================================

/**
 * Hook to fetch customer segments
 */
export function useCustomerSegments(vendorId: string) {
  const customerService = new CustomerInsightsService();
  
  return useQuery({
    queryKey: queryKeys.customers.segments(vendorId),
    queryFn: async () => {
      const response = await customerService.getCustomerSegments(vendorId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch customer segments');
      }
      return response.data;
    },
    enabled: !!vendorId,
    staleTime: cacheConfig.customers.staleTime,
    gcTime: cacheConfig.customers.gcTime,
  });
}

/**
 * Hook to fetch specific customer segment details
 */
export function useCustomerSegment(vendorId: string, segment: string) {
  const customerService = new CustomerInsightsService();
  
  return useQuery({
    queryKey: queryKeys.customers.segment(vendorId, segment),
    queryFn: async () => {
      const response = await customerService.getSegmentDetails(vendorId, segment);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch segment details');
      }
      return response.data;
    },
    enabled: !!vendorId && !!segment,
    staleTime: cacheConfig.customers.staleTime,
    gcTime: cacheConfig.customers.gcTime,
  });
}

// ============================================================================
// Payout Hooks
// ============================================================================

/**
 * Hook to fetch payout details
 */
export function usePayoutDetails(vendorId: string) {
  const payoutService = new PayoutService();
  
  return useQuery({
    queryKey: queryKeys.payouts.byVendor(vendorId),
    queryFn: async () => {
      const response = await payoutService.getPayoutDetails(vendorId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch payout details');
      }
      return response.data;
    },
    enabled: !!vendorId,
    staleTime: cacheConfig.payouts.staleTime,
    gcTime: cacheConfig.payouts.gcTime,
  });
}

/**
 * Hook to fetch payout history
 */
export function usePayoutHistory(vendorId: string) {
  const payoutService = new PayoutService();
  
  return useQuery({
    queryKey: queryKeys.payouts.history(vendorId),
    queryFn: async () => {
      const response = await payoutService.getPayoutHistory(vendorId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch payout history');
      }
      return response.data;
    },
    enabled: !!vendorId,
    staleTime: cacheConfig.payouts.staleTime,
    gcTime: cacheConfig.payouts.gcTime,
  });
}

// ============================================================================
// Inventory Hooks
// ============================================================================

/**
 * Hook to fetch inventory alerts
 */
export function useInventoryAlerts(vendorId: string) {
  const inventoryService = new InventoryService();
  
  return useQuery({
    queryKey: queryKeys.inventory.alerts(vendorId),
    queryFn: async () => {
      const response = await inventoryService.getInventoryAlerts(vendorId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch inventory alerts');
      }
      return response.data;
    },
    enabled: !!vendorId,
    staleTime: cacheConfig.inventory.staleTime,
    gcTime: cacheConfig.inventory.gcTime,
    // Refresh frequently for critical alerts
    refetchInterval: 60 * 1000, // Every minute
  });
}

/**
 * Hook to fetch inventory forecast
 */
export function useInventoryForecast(productId: string, daysAhead: number) {
  const inventoryService = new InventoryService();
  
  return useQuery({
    queryKey: queryKeys.inventory.forecast(productId, daysAhead),
    queryFn: async () => {
      const response = await inventoryService.forecastInventory(productId, daysAhead);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch inventory forecast');
      }
      return response.data;
    },
    enabled: !!productId && daysAhead > 0,
    staleTime: cacheConfig.inventory.staleTime,
    gcTime: cacheConfig.inventory.gcTime,
  });
}

// ============================================================================
// Notification Hooks
// ============================================================================

/**
 * Hook to fetch vendor notifications
 * Requirement 10.2: Real-time updates
 */
export function useVendorNotifications(vendorId: string) {
  const notificationService = new NotificationService();
  
  return useQuery({
    queryKey: queryKeys.notifications.byVendor(vendorId),
    queryFn: async () => {
      const response = await notificationService.getNotifications(vendorId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch notifications');
      }
      return response.data;
    },
    enabled: !!vendorId,
    staleTime: cacheConfig.notifications.staleTime,
    gcTime: cacheConfig.notifications.gcTime,
    // Frequent updates for notifications
    refetchInterval: 15 * 1000, // Every 15 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const notificationService = new NotificationService();
  
  return useMutation({
    mutationFn: async ({ notificationId, vendorId }: { notificationId: string; vendorId: string }) => {
      const response = await notificationService.markAsRead(notificationId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to mark notification as read');
      }
      return response.data;
    },
    // Optimistic update
    onMutate: async ({ notificationId, vendorId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.byVendor(vendorId) });
      
      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(queryKeys.notifications.byVendor(vendorId));
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.notifications.byVendor(vendorId), (old: any) => {
        if (!old) return old;
        return old.map((notif: any) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        );
      });
      
      return { previousNotifications };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.byVendor(variables.vendorId),
          context.previousNotifications
        );
      }
    },
    // Refetch on success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.byVendor(variables.vendorId) });
    },
  });
}

// ============================================================================
// Orders Hooks (Requirement 10.5)
// ============================================================================

/**
 * Hook to fetch recent orders with real-time updates
 * Requirement 10.5: Immediate reflection of new orders
 */
export function useRecentOrders(vendorId: string) {
  const analyticsService = new VendorAnalyticsService();
  
  return useQuery({
    queryKey: queryKeys.orders.recent(vendorId),
    queryFn: async () => {
      const response = await analyticsService.getRecentOrders(vendorId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch recent orders');
      }
      return response.data;
    },
    enabled: !!vendorId,
    // Requirement 10.5: Very frequent updates for new orders
    staleTime: cacheConfig.orders.staleTime,
    gcTime: cacheConfig.orders.gcTime,
    refetchInterval: 10 * 1000, // Every 10 seconds
    refetchOnWindowFocus: true,
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to invalidate all vendor queries
 * Useful for manual refresh
 */
export function useInvalidateVendorQueries() {
  return useMutation({
    mutationFn: async (vendorId: string) => {
      await invalidateVendorQueries(vendorId);
    },
  });
}

/**
 * Hook to check if any query is loading
 * Useful for global loading states
 */
export function useIsAnyQueryLoading() {
  const queryClient = useQueryClient();
  const queries = queryClient.getQueryCache().getAll();
  return queries.some(query => query.state.fetchStatus === 'fetching');
}
