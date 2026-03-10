// Cache service for API responses and dynamic content

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private readonly defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 10 * 1024 * 1024, // 10MB
    strategy: 'stale-while-revalidate',
  };

  // Memory cache operations
  set<T>(key: string, data: T, config?: Partial<CacheConfig>): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: finalConfig.ttl,
    };

    this.memoryCache.set(key, entry);
    this.cleanupExpiredEntries();
  }

  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.memoryCache.delete(key);
  }

  clear(): void {
    this.memoryCache.clear();
  }

  has(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      return false;
    }

    return true;
  }

  // Cache strategies for API requests
  async cacheFirst<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config?: Partial<CacheConfig>
  ): Promise<T> {
    // Try memory cache first
    const cached = this.get<T>(key);
    if (cached) {
      return cached;
    }

    // Try browser cache
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('api-cache');
        const response = await cache.match(key);
        if (response) {
          const data = await response.json();
          this.set(key, data, config);
          return data;
        }
      } catch (error) {
        console.warn('Browser cache access failed:', error);
      }
    }

    // Fetch from network
    const data = await fetchFn();
    this.set(key, data, config);
    
    // Store in browser cache
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('api-cache');
        const response = new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': `max-age=${(config?.ttl || this.defaultConfig.ttl) / 1000}`,
          },
        });
        await cache.put(key, response);
      } catch (error) {
        console.warn('Browser cache storage failed:', error);
      }
    }

    return data;
  }

  async networkFirst<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config?: Partial<CacheConfig>
  ): Promise<T> {
    try {
      // Try network first
      const data = await fetchFn();
      this.set(key, data, config);
      
      // Store in browser cache
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await caches.open('api-cache');
          const response = new Response(JSON.stringify(data), {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': `max-age=${(config?.ttl || this.defaultConfig.ttl) / 1000}`,
            },
          });
          await cache.put(key, response);
        } catch (error) {
          console.warn('Browser cache storage failed:', error);
        }
      }

      return data;
    } catch (error) {
      // Fallback to cache
      const cached = this.get<T>(key);
      if (cached) {
        return cached;
      }

      // Try browser cache
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await caches.open('api-cache');
          const response = await cache.match(key);
          if (response) {
            const data = await response.json();
            this.set(key, data, config);
            return data;
          }
        } catch (cacheError) {
          console.warn('Browser cache access failed:', cacheError);
        }
      }

      throw error;
    }
  }

  async staleWhileRevalidate<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config?: Partial<CacheConfig>
  ): Promise<T> {
    // Return cached data immediately if available
    const cached = this.get<T>(key);
    
    // Revalidate in background
    const revalidatePromise = fetchFn()
      .then((data) => {
        this.set(key, data, config);
        
        // Update browser cache
        if (typeof window !== 'undefined' && 'caches' in window) {
          caches.open('api-cache').then((cache) => {
            const response = new Response(JSON.stringify(data), {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': `max-age=${(config?.ttl || this.defaultConfig.ttl) / 1000}`,
              },
            });
            cache.put(key, response);
          }).catch((error) => {
            console.warn('Browser cache storage failed:', error);
          });
        }

        return data;
      })
      .catch((error) => {
        console.warn('Background revalidation failed:', error);
        // If revalidation fails and we have cached data, return it
        if (cached !== null) {
          return cached;
        }
        // If no cached data and revalidation fails, re-throw the error
        throw error;
      });

    if (cached) {
      // Return cached data immediately, revalidation happens in background
      return cached;
    }

    // No cached data, wait for network
    return revalidatePromise;
  }

  // Cache invalidation
  invalidate(pattern: string | RegExp): void {
    const keys = Array.from(this.memoryCache.keys());
    const keysToDelete = keys.filter((key) => {
      if (typeof pattern === 'string') {
        return key.includes(pattern);
      }
      return pattern.test(key);
    });

    keysToDelete.forEach((key) => {
      this.memoryCache.delete(key);
    });

    // Also clear from browser cache
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.open('api-cache').then((cache) => {
        cache.keys().then((requests) => {
          requests.forEach((request) => {
            const url = request.url;
            const shouldDelete = keysToDelete.some((key) => url.includes(key));
            if (shouldDelete) {
              cache.delete(request);
            }
          });
        });
      }).catch((error) => {
        console.warn('Browser cache invalidation failed:', error);
      });
    }
  }

  // Utility methods
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Cache statistics
  getStats() {
    const entries = Array.from(this.memoryCache.entries());
    const totalSize = entries.reduce((size, [, entry]) => {
      return size + JSON.stringify(entry.data).length;
    }, 0);

    return {
      entryCount: entries.length,
      totalSize,
      expiredCount: entries.filter(([, entry]) => this.isExpired(entry)).length,
    };
  }

  // Preload cache with critical data
  async preload(entries: Array<{ key: string; fetchFn: () => Promise<any>; config?: Partial<CacheConfig> }>) {
    const promises = entries.map(async ({ key, fetchFn, config }) => {
      try {
        const data = await fetchFn();
        this.set(key, data, config);
      } catch (error) {
        console.warn(`Failed to preload cache for key: ${key}`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key generators
export const generateCacheKey = (endpoint: string, params?: Record<string, any>): string => {
  const baseKey = endpoint.replace(/^\//, '').replace(/\//g, '_');
  if (!params) return baseKey;
  
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  
  return `${baseKey}?${sortedParams}`;
};

// Cache decorators for API functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  config?: Partial<CacheConfig>
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const cacheKey = generateCacheKey(propertyKey, args[0]);
      
      const strategy = config?.strategy || 'stale-while-revalidate';
      const fetchFn = () => originalMethod.apply(this, args);

      switch (strategy) {
        case 'cache-first':
          return cacheService.cacheFirst(cacheKey, fetchFn, config);
        case 'network-first':
          return cacheService.networkFirst(cacheKey, fetchFn, config);
        case 'stale-while-revalidate':
        default:
          return cacheService.staleWhileRevalidate(cacheKey, fetchFn, config);
      }
    };

    return descriptor;
  };
}