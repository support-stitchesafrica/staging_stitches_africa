// Server-side cache utilities (no "use client" directive)

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ServerCacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // Maximum cache entries

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

export const serverCacheManager = new ServerCacheManager();

// Cache key generators
export const cacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (category?: string) => `products${category ? `:${category}` : ''}`,
  user: (id: string) => `user:${id}`,
  orders: (userId: string) => `orders:${userId}`,
  order: (id: string) => `order:${id}`,
  cart: (userId: string) => `cart:${userId}`,
  wishlist: (userId: string) => `wishlist:${userId}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
};

// Higher-order function for caching async operations (server-side)
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl: number = 5 * 60 * 1000
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = serverCacheManager.get<R>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    try {
      const result = await fn(...args);
      serverCacheManager.set(key, result, ttl);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  };
}

// Preload data into cache (server-side)
export function preloadData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<void> {
  return fetcher()
    .then(data => {
      serverCacheManager.set(key, data, ttl);
    })
    .catch(error => {
      console.warn(`Failed to preload data for key ${key}:`, error);
    });
}

// Batch cache operations (server-side)
export class BatchCache {
  private operations: Array<() => Promise<void>> = [];

  add<T>(key: string, fetcher: () => Promise<T>, ttl?: number) {
    this.operations.push(() => preloadData(key, fetcher, ttl));
    return this;
  }

  async execute(): Promise<void> {
    await Promise.allSettled(this.operations.map(op => op()));
    this.operations = [];
  }
}

// Cache warming for critical data (server-side)
export const warmCache = () => {
  const batch = new BatchCache();
  
  // Add critical data to warm up
  // This will be called on app initialization
  
  return batch.execute();
};