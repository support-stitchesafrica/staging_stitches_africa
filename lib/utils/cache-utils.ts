"use client"

// React hook for cached data
import { useState, useEffect, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
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

export const cacheManager = new CacheManager();

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

// Higher-order function for caching async operations
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl: number = 5 * 60 * 1000
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = cacheManager.get<R>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    try {
      const result = await fn(...args);
      cacheManager.set(key, result, ttl);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  };
}



export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      // Only show loading on initial load or force refresh
      if (!data || forceRefresh) {
        setLoading(true);
      }
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = cacheManager.get<T>(key);
        if (cached !== null) {
          setData(cached);
          setLoading(false);
          return;
        }
      }
      
      // Fetch fresh data
      const result = await fetcher();
      cacheManager.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    cacheManager.delete(key);
    fetchData(true);
  }, [key, fetchData]);

  return { data, loading, error, refetch };
}

// Preload data into cache
export function preloadData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<void> {
  return fetcher()
    .then(data => {
      cacheManager.set(key, data, ttl);
    })
    .catch(error => {
      console.warn(`Failed to preload data for key ${key}:`, error);
    });
}

// Batch cache operations
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

// Cache warming for critical data
export const warmCache = () => {
  const batch = new BatchCache();
  
  // Add critical data to warm up
  // This will be called on app initialization
  
  return batch.execute();
};