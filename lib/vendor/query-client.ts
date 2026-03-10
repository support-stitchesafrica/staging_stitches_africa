/**
 * React Query Configuration for Vendor Analytics
 * Implements real-time data updates with optimized caching
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create a configured QueryClient instance with optimized settings
 * for vendor analytics real-time updates
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Requirement 10.1: Load data in under 1 second
      staleTime: 30 * 1000, // 30 seconds - data is fresh for 30s
      gcTime: 5 * 60 * 1000, // 5 minutes - keep unused data in cache for 5 minutes
      
      // Requirement 10.2: Real-time updates without page refresh
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when internet reconnects
      
      // Requirement 10.3: Instant filter application
      refetchOnMount: true, // Refetch when component mounts
      
      // Error handling
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Optimistic updates for mutations
      retry: 1,
    },
  },
});

/**
 * Query Keys for vendor analytics
 * Organized by feature for easy invalidation
 */
export const queryKeys = {
  // Vendor analytics
  analytics: {
    all: ['vendor-analytics'] as const,
    byVendor: (vendorId: string) => ['vendor-analytics', vendorId] as const,
    byVendorAndRange: (vendorId: string, dateRange: { start: Date; end: Date }) =>
      ['vendor-analytics', vendorId, dateRange] as const,
  },
  
  // Product analytics
  products: {
    all: ['product-analytics'] as const,
    byVendor: (vendorId: string) => ['product-analytics', vendorId] as const,
    byProduct: (productId: string) => ['product-analytics', 'product', productId] as const,
    ranking: (productId: string) => ['product-analytics', 'ranking', productId] as const,
  },
  
  // Customer insights
  customers: {
    all: ['customer-insights'] as const,
    byVendor: (vendorId: string) => ['customer-insights', vendorId] as const,
    segments: (vendorId: string) => ['customer-insights', 'segments', vendorId] as const,
    segment: (vendorId: string, segment: string) =>
      ['customer-insights', 'segment', vendorId, segment] as const,
  },
  
  // Payouts
  payouts: {
    all: ['payouts'] as const,
    byVendor: (vendorId: string) => ['payouts', vendorId] as const,
    history: (vendorId: string) => ['payouts', 'history', vendorId] as const,
    statement: (statementId: string) => ['payouts', 'statement', statementId] as const,
  },
  
  // Inventory
  inventory: {
    all: ['inventory'] as const,
    byVendor: (vendorId: string) => ['inventory', vendorId] as const,
    alerts: (vendorId: string) => ['inventory', 'alerts', vendorId] as const,
    forecast: (productId: string, days: number) =>
      ['inventory', 'forecast', productId, days] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    byVendor: (vendorId: string) => ['notifications', vendorId] as const,
    unread: (vendorId: string) => ['notifications', 'unread', vendorId] as const,
  },
  
  // Store metrics
  store: {
    all: ['store-metrics'] as const,
    byVendor: (vendorId: string) => ['store-metrics', vendorId] as const,
  },
  
  // Orders (Requirement 10.5: Immediate reflection of new orders)
  orders: {
    all: ['orders'] as const,
    byVendor: (vendorId: string) => ['orders', vendorId] as const,
    recent: (vendorId: string) => ['orders', 'recent', vendorId] as const,
  },
};

/**
 * Cache time configurations for different data types
 * Requirement 10.4: Rankings update within 12-24 hours
 */
export const cacheConfig = {
  // Real-time data - refresh frequently
  orders: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },
  
  // Analytics data - moderate refresh
  analytics: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Product rankings - update less frequently (12-24 hours)
  rankings: {
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Customer data - moderate refresh
  customers: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  
  // Payouts - less frequent updates
  payouts: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Inventory - moderate refresh
  inventory: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  
  // Notifications - frequent refresh
  notifications: {
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
};

/**
 * Helper function to invalidate related queries
 * Useful for optimistic updates and mutations
 */
export const invalidateVendorQueries = async (vendorId: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.byVendor(vendorId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.byVendor(vendorId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.customers.byVendor(vendorId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.byVendor(vendorId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.byVendor(vendorId) }),
  ]);
};

/**
 * Helper function to prefetch data
 * Improves perceived performance
 */
export const prefetchVendorData = async (vendorId: string) => {
  // Prefetch key data that will likely be needed
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.analytics.byVendor(vendorId),
      staleTime: cacheConfig.analytics.staleTime,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.notifications.unread(vendorId),
      staleTime: cacheConfig.notifications.staleTime,
    }),
  ]);
};
