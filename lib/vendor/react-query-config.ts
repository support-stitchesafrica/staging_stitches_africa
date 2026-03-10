/**
 * React Query Configuration for Vendor Analytics
 * Implements caching strategy and real-time updates
 * Validates: Requirements 10.1, 10.2, 10.3
 */

import { QueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

// ============================================================================
// Query Client Configuration
// ============================================================================

/**
 * Optimized Query Client with caching strategy
 * - Fast initial loads with stale-while-revalidate
 * - Background refetching for real-time feel
 * - Aggressive caching for static data
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests 2 times
      retry: 2,
      
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for real-time feel
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Centralized query keys for consistent caching
 * Follows hierarchical structure for easy invalidation
 */
export const queryKeys = {
  // Vendor-level keys
  vendor: {
    all: ['vendor'] as const,
    detail: (vendorId: string) => ['vendor', vendorId] as const,
    profile: (vendorId: string) => ['vendor', vendorId, 'profile'] as const,
  },
  
  // Analytics keys
  analytics: {
    all: ['analytics'] as const,
    vendor: (vendorId: string) => ['analytics', vendorId] as const,
    summary: (vendorId: string, dateRange: string) => 
      ['analytics', vendorId, 'summary', dateRange] as const,
    sales: (vendorId: string, dateRange: string) => 
      ['analytics', vendorId, 'sales', dateRange] as const,
    orders: (vendorId: string, dateRange: string) => 
      ['analytics', vendorId, 'orders', dateRange] as const,
    products: (vendorId: string) => 
      ['analytics', vendorId, 'products'] as const,
    customers: (vendorId: string, dateRange: string) => 
      ['analytics', vendorId, 'customers', dateRange] as const,
    store: (vendorId: string, dateRange: string) => 
      ['analytics', vendorId, 'store', dateRange] as const,
    historical: (vendorId: string, metric: string) => 
      ['analytics', vendorId, 'historical', metric] as const,
  },
  
  // Product keys
  products: {
    all: ['products'] as const,
    vendor: (vendorId: string) => ['products', vendorId] as const,
    detail: (productId: string) => ['products', 'detail', productId] as const,
    analytics: (productId: string) => ['products', 'analytics', productId] as const,
    ranking: (productId: string) => ['products', 'ranking', productId] as const,
  },
  
  // Customer keys
  customers: {
    all: ['customers'] as const,
    vendor: (vendorId: string) => ['customers', vendorId] as const,
    segments: (vendorId: string) => ['customers', vendorId, 'segments'] as const,
    segment: (vendorId: string, segmentType: string) => 
      ['customers', vendorId, 'segments', segmentType] as const,
  },
  
  // Payout keys
  payouts: {
    all: ['payouts'] as const,
    vendor: (vendorId: string) => ['payouts', vendorId] as const,
    history: (vendorId: string) => ['payouts', vendorId, 'history'] as const,
    balance: (vendorId: string) => ['payouts', vendorId, 'balance'] as const,
  },
  
  // Notification keys
  notifications: {
    all: ['notifications'] as const,
    vendor: (vendorId: string) => ['notifications', vendorId] as const,
    unread: (vendorId: string) => ['notifications', vendorId, 'unread'] as const,
  },
  
  // Inventory keys
  inventory: {
    all: ['inventory'] as const,
    vendor: (vendorId: string) => ['inventory', vendorId] as const,
    alerts: (vendorId: string) => ['inventory', vendorId, 'alerts'] as const,
  },
};

// ============================================================================
// Cache Time Configurations
// ============================================================================

/**
 * Different cache strategies for different data types
 */
export const cacheConfig = {
  // Real-time data - short cache, frequent refetch
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  },
  
  // Frequently changing data - moderate cache
  dynamic: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  },
  
  // Stable data - long cache
  stable: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: false,
  },
  
  // Static data - very long cache
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchInterval: false,
  },
};

// ============================================================================
// Query Options Factories
// ============================================================================

/**
 * Creates query options for analytics data
 * Uses dynamic caching for balance between freshness and performance
 */
export function analyticsQueryOptions<T>(
  vendorId: string,
  dateRange: string
): Partial<UseQueryOptions<T>> {
  return {
    ...cacheConfig.dynamic,
    enabled: !!vendorId,
    // Prevent refetch on window focus for analytics (user-initiated only)
    refetchOnWindowFocus: false,
  };
}

/**
 * Creates query options for real-time data (notifications, alerts)
 */
export function realtimeQueryOptions<T>(
  vendorId: string
): Partial<UseQueryOptions<T>> {
  return {
    ...cacheConfig.realtime,
    enabled: !!vendorId,
    refetchOnWindowFocus: true,
  };
}

/**
 * Creates query options for product data
 */
export function productQueryOptions<T>(
  vendorId: string
): Partial<UseQueryOptions<T>> {
  return {
    ...cacheConfig.stable,
    enabled: !!vendorId,
    refetchOnWindowFocus: false,
  };
}

/**
 * Creates query options for static reference data
 */
export function staticQueryOptions<T>(): Partial<UseQueryOptions<T>> {
  return {
    ...cacheConfig.static,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  };
}

// ============================================================================
// Cache Invalidation Helpers
// ============================================================================

/**
 * Invalidates all analytics data for a vendor
 * Use after data mutations that affect analytics
 */
export function invalidateVendorAnalytics(vendorId: string) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.analytics.vendor(vendorId),
  });
}

/**
 * Invalidates product data for a vendor
 * Use after product updates
 */
export function invalidateVendorProducts(vendorId: string) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.products.vendor(vendorId),
  });
}

/**
 * Invalidates specific product analytics
 * Use after product-specific updates
 */
export function invalidateProductAnalytics(productId: string) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.products.analytics(productId),
  });
}

/**
 * Invalidates notifications
 * Use after marking notifications as read
 */
export function invalidateNotifications(vendorId: string) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.notifications.vendor(vendorId),
  });
}

/**
 * Invalidates all vendor data
 * Use sparingly - only for major updates like profile changes
 */
export function invalidateAllVendorData(vendorId: string) {
  queryClient.invalidateQueries({
    queryKey: ['vendor', vendorId],
  });
  queryClient.invalidateQueries({
    queryKey: ['analytics', vendorId],
  });
  queryClient.invalidateQueries({
    queryKey: ['products', vendorId],
  });
  queryClient.invalidateQueries({
    queryKey: ['customers', vendorId],
  });
  queryClient.invalidateQueries({
    queryKey: ['payouts', vendorId],
  });
  queryClient.invalidateQueries({
    queryKey: ['notifications', vendorId],
  });
}

// ============================================================================
// Prefetch Helpers
// ============================================================================

/**
 * Prefetches analytics data for faster navigation
 * Call this when user hovers over analytics links
 */
export async function prefetchAnalytics(
  vendorId: string,
  dateRange: string,
  fetchFn: () => Promise<any>
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.analytics.summary(vendorId, dateRange),
    queryFn: fetchFn,
    ...cacheConfig.dynamic,
  });
}

/**
 * Prefetches product details for faster navigation
 */
export async function prefetchProductDetails(
  productId: string,
  fetchFn: () => Promise<any>
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: fetchFn,
    ...cacheConfig.stable,
  });
}

// ============================================================================
// Optimistic Update Helpers
// ============================================================================

/**
 * Updates notification read status optimistically
 * Provides instant UI feedback
 */
export function optimisticUpdateNotification(
  vendorId: string,
  notificationId: string,
  isRead: boolean
) {
  const queryKey = queryKeys.notifications.vendor(vendorId);
  
  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    
    return {
      ...old,
      notifications: old.notifications?.map((n: any) =>
        n.id === notificationId ? { ...n, isRead } : n
      ),
    };
  });
}

/**
 * Updates product stock optimistically
 */
export function optimisticUpdateProductStock(
  vendorId: string,
  productId: string,
  newStock: number
) {
  const queryKey = queryKeys.products.vendor(vendorId);
  
  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    
    return {
      ...old,
      products: old.products?.map((p: any) =>
        p.id === productId ? { ...p, stock: newStock } : p
      ),
    };
  });
}
