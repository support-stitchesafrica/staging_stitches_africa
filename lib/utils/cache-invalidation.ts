// Cache invalidation utilities for maintaining data consistency

import { serverCacheManager as cacheManager } from './server-cache-utils';

/**
 * Invalidate caches when user data changes
 */
export const invalidateUserCaches = (userId: string) => {
  // Invalidate user-specific caches
  cacheManager.delete(`user:${userId}`);
  cacheManager.delete(`user-profile:${userId}`);
  cacheManager.delete(`orders:${userId}`);
  cacheManager.delete(`measurements:${userId}`);
  
  // Note: Pattern-based invalidation would need to be implemented
  // For now, we'll just clear specific keys
};

/**
 * Invalidate caches when product data changes
 */
export const invalidateProductCaches = (productId?: string, category?: string) => {
  if (productId) {
    cacheManager.delete(`product:${productId}`);
  }
  
  if (category) {
    cacheManager.delete(`products:category:${category}`);
  }
  
  // Invalidate general product caches
  cacheManager.delete('products:discounted');
  // Note: Pattern-based invalidation would need to be implemented
};

/**
 * Invalidate caches when order status changes
 */
export const invalidateOrderCaches = (userId: string, orderId?: string) => {
  // Invalidate user's order list
  cacheManager.delete(`orders:${userId}`);
  
  if (orderId) {
    cacheManager.delete(`order:${userId}:${orderId}`);
  }
};

/**
 * Invalidate all caches (use sparingly)
 */
export const invalidateAllCaches = () => {
  cacheManager.clear();
  console.log('All caches cleared');
};

/**
 * Invalidate expired caches (called periodically)
 */
export const cleanupExpiredCaches = () => {
  cacheManager.cleanup();
};

/**
 * Cache warming - preload frequently accessed data
 */
export const warmCache = async () => {
  try {
    // This would typically be called on app startup
    // to preload frequently accessed data
    console.log('Cache warming started');
    
    // Example: Preload categories, featured products, etc.
    // These would be actual API calls to populate the cache
    
    console.log('Cache warming completed');
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
};

/**
 * Communicate with service worker for cache management
 */
export const invalidateServiceWorkerCache = (cacheNames: string[]) => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'INVALIDATE_CACHE',
      cacheNames,
    });
  }
};

export const clearAllServiceWorkerCaches = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_ALL_CACHES',
    });
  }
};