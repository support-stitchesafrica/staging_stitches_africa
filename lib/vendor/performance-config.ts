/**
 * Performance Configuration and Monitoring
 * Centralized performance settings and utilities
 * Validates: Requirements 10.1, 10.2, 10.3
 */

// ============================================================================
// Performance Thresholds
// ============================================================================

export const PERFORMANCE_THRESHOLDS = {
  // Page load time targets (milliseconds)
  INITIAL_LOAD: 1000, // Target: < 1 second
  DATA_FETCH: 500, // Target: < 500ms for data fetching
  RENDER_TIME: 100, // Target: < 100ms for component render
  
  // Query limits
  MAX_QUERY_SIZE: 100, // Maximum items per query
  PAGINATION_SIZE: 20, // Items per page
  
  // Cache durations (milliseconds)
  CACHE_SHORT: 30 * 1000, // 30 seconds
  CACHE_MEDIUM: 5 * 60 * 1000, // 5 minutes
  CACHE_LONG: 30 * 60 * 1000, // 30 minutes
  
  // Debounce/Throttle delays (milliseconds)
  SEARCH_DEBOUNCE: 300, // Search input debounce
  FILTER_DEBOUNCE: 500, // Filter input debounce
  SCROLL_THROTTLE: 100, // Scroll event throttle
  RESIZE_THROTTLE: 200, // Resize event throttle
  
  // Virtual scrolling
  VIRTUAL_LIST_THRESHOLD: 50, // Use virtual scrolling for lists > 50 items
  VIRTUAL_ITEM_HEIGHT: 80, // Default item height for virtual lists
  VIRTUAL_OVERSCAN: 3, // Number of items to render outside viewport
} as const;

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Simple performance monitor for tracking load times
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  
  /**
   * Start timing an operation
   */
  start(label: string): void {
    this.marks.set(label, performance.now());
  }
  
  /**
   * End timing and log if over threshold
   */
  end(label: string, threshold: number = PERFORMANCE_THRESHOLDS.DATA_FETCH): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`Performance mark "${label}" not found`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.marks.delete(label);
    
    if (duration > threshold) {
      console.warn(`⚠️ Performance: "${label}" took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    } else {
      console.log(`✅ Performance: "${label}" took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  /**
   * Measure a function execution time
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    threshold?: number
  ): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label, threshold);
      return result;
    } catch (error) {
      this.end(label, threshold);
      throw error;
    }
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

// ============================================================================
// Code Splitting Helpers
// ============================================================================

/**
 * Lazy load analytics components for code splitting
 * Reduces initial bundle size
 */
export const lazyLoadAnalytics = {
  SalesTrendChart: () => import('@/components/vendor/analytics/SalesTrendChart'),
  OrderFunnelChart: () => import('@/components/vendor/analytics/OrderFunnelChart'),
  RevenueBreakdown: () => import('@/components/vendor/analytics/RevenueBreakdown'),
  TopProductsTable: () => import('@/components/vendor/analytics/TopProductsTable'),
  CustomerSegmentCard: () => import('@/components/vendor/customers/CustomerSegmentCard'),
  LocationHeatmap: () => import('@/components/vendor/customers/LocationHeatmap'),
  PayoutCalendar: () => import('@/components/vendor/payouts/PayoutCalendar'),
  InventoryForecast: () => import('@/components/vendor/inventory/InventoryForecast'),
};

/**
 * Preload critical components on hover
 * Improves perceived performance
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  // Only preload in browser
  if (typeof window !== 'undefined') {
    importFn().catch(() => {
      // Silently fail - component will load when actually needed
    });
  }
}

// ============================================================================
// Memory Management
// ============================================================================

/**
 * Cleanup helper for large datasets
 * Prevents memory leaks
 */
export function cleanupLargeData<T>(data: T[]): void {
  if (data.length > 1000) {
    // Clear references to help garbage collection
    data.length = 0;
  }
}

/**
 * Batch process large arrays to avoid blocking UI
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => R,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = batch.map(processor);
    results.push(...batchResults);
    
    // Yield to browser between batches
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}

// ============================================================================
// Network Optimization
// ============================================================================

/**
 * Check if user is on slow connection
 * Adjust behavior accordingly
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }
  
  const connection = (navigator as any).connection;
  return connection?.effectiveType === 'slow-2g' || 
         connection?.effectiveType === '2g' ||
         connection?.saveData === true;
}

/**
 * Adaptive loading based on connection speed
 */
export function getOptimalPageSize(): number {
  if (isSlowConnection()) {
    return 10; // Smaller page size for slow connections
  }
  return PERFORMANCE_THRESHOLDS.PAGINATION_SIZE;
}

// ============================================================================
// Image Optimization
// ============================================================================

/**
 * Get optimized image URL based on viewport
 */
export function getOptimizedImageUrl(
  url: string,
  width: number,
  quality: number = 80
): string {
  // If using ImageKit or similar service
  if (url.includes('imagekit.io')) {
    return `${url}?tr=w-${width},q-${quality}`;
  }
  
  // If using Next.js Image Optimization
  if (url.startsWith('/')) {
    return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
  }
  
  return url;
}

// ============================================================================
// Bundle Size Monitoring
// ============================================================================

/**
 * Log bundle sizes in development
 */
export function logBundleSize(componentName: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📦 Loaded: ${componentName}`);
  }
}
