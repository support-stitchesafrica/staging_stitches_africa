/**
 * Promotional Products Cache Service
 * 
 * Handles caching of promotional events and products with:
 * - Automatic cache expiration
 * - Cache versioning for invalidation
 * - Fallback to cache on network errors
 * - Size limits to prevent memory issues
 * - Robust error handling
 */

interface CachedEvent {
	event: any;
	timestamp: number;
	version: string;
}

interface CachedProducts {
	products: any[];
	total: number;
	hasMore: boolean;
	offset: number;
	timestamp: number;
	version: string;
}

interface CacheConfig {
	maxAge: number; // Cache max age in milliseconds (default: 5 minutes)
	maxSize: number; // Maximum number of cached items per event (default: 10 pages)
	version: string; // Cache version for invalidation
}

const DEFAULT_CONFIG: CacheConfig = {
	maxAge: 5 * 60 * 1000, // 5 minutes
	maxSize: 10, // Max 10 pages cached
	version: '1.0.0', // Increment this to invalidate all caches
};

const CACHE_PREFIX = 'promo_cache_';
const EVENT_CACHE_KEY = (eventId: string) => `${CACHE_PREFIX}event_${eventId}`;
const PRODUCTS_CACHE_KEY = (eventId: string, offset: number) =>
	`${CACHE_PREFIX}products_${eventId}_${offset}`;
const SORTED_PRODUCTS_CACHE_KEY = (eventId: string) =>
	`${CACHE_PREFIX}sorted_products_${eventId}`;
const CACHE_VERSION_KEY = (eventId: string) => `${CACHE_PREFIX}version_${eventId}`;

export class PromotionalCache {
	private config: CacheConfig;

	constructor(config: Partial<CacheConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Get cached event if valid
	 */
	getEvent(eventId: string): any | null {
		try {
			const cacheKey = EVENT_CACHE_KEY(eventId);
			const cached = localStorage.getItem(cacheKey);
			if (!cached) return null;

			const data: CachedEvent = JSON.parse(cached);
			const versionKey = CACHE_VERSION_KEY(eventId);
			const cachedVersion = localStorage.getItem(versionKey);

			// Check version mismatch
			if (cachedVersion !== this.config.version) {
				this.clearEvent(eventId);
				return null;
			}

			// Check expiration
			const age = Date.now() - data.timestamp;
			if (age > this.config.maxAge) {
				this.clearEvent(eventId);
				return null;
			}

			return data.event;
		} catch (error) {
			console.warn('[PromotionalCache] Error reading event cache:', error);
			this.clearEvent(eventId);
			return null;
		}
	}

	/**
	 * Cache event data
	 */
	setEvent(eventId: string, event: any): void {
		try {
			const cacheKey = EVENT_CACHE_KEY(eventId);
			const versionKey = CACHE_VERSION_KEY(eventId);
			
			const cachedData: CachedEvent = {
				event,
				timestamp: Date.now(),
				version: this.config.version,
			};

			localStorage.setItem(cacheKey, JSON.stringify(cachedData));
			localStorage.setItem(versionKey, this.config.version);
		} catch (error) {
			console.warn('[PromotionalCache] Error caching event:', error);
			// If storage is full, try to clear old cache
			if (error instanceof DOMException && error.name === 'QuotaExceededError') {
				this.clearOldCache(eventId);
				try {
					const cacheKey = EVENT_CACHE_KEY(eventId);
					const cachedData: CachedEvent = {
						event,
						timestamp: Date.now(),
						version: this.config.version,
					};
					localStorage.setItem(cacheKey, JSON.stringify(cachedData));
				} catch (retryError) {
					console.error('[PromotionalCache] Failed to cache after cleanup:', retryError);
				}
			}
		}
	}

	/**
	 * Get cached products for a specific offset
	 * Special case: offset = -1 returns sorted products cache
	 */
	getProducts(eventId: string, offset: number): CachedProducts | null {
		try {
			// Special handling for sorted products (offset = -1)
			if (offset === -1) {
				const cacheKey = SORTED_PRODUCTS_CACHE_KEY(eventId);
				const cached = localStorage.getItem(cacheKey);
				if (!cached) return null;

				const data: CachedProducts = JSON.parse(cached);
				const versionKey = CACHE_VERSION_KEY(eventId);
				const cachedVersion = localStorage.getItem(versionKey);

				// Check version mismatch
				if (cachedVersion !== this.config.version) {
					localStorage.removeItem(cacheKey);
					return null;
				}

				// Check expiration
				const age = Date.now() - data.timestamp;
				if (age > this.config.maxAge) {
					return null;
				}

				return data;
			}

			// Regular offset-based cache
			const cacheKey = PRODUCTS_CACHE_KEY(eventId, offset);
			const cached = localStorage.getItem(cacheKey);
			if (!cached) return null;

			const data: CachedProducts = JSON.parse(cached);
			const versionKey = CACHE_VERSION_KEY(eventId);
			const cachedVersion = localStorage.getItem(versionKey);

			// Check version mismatch
			if (cachedVersion !== this.config.version) {
				this.clearProducts(eventId);
				return null;
			}

			// Check expiration
			const age = Date.now() - data.timestamp;
			if (age > this.config.maxAge) {
				// Don't clear immediately, but return null
				return null;
			}

			return data;
		} catch (error) {
			console.warn('[PromotionalCache] Error reading products cache:', error);
			return null;
		}
	}

	/**
	 * Cache products for a specific offset
	 * Special case: offset = -1 caches sorted products
	 */
	setProducts(
		eventId: string,
		offset: number,
		products: any[],
		total: number,
		hasMore: boolean
	): void {
		try {
			// Special handling for sorted products (offset = -1)
			if (offset === -1) {
				const cacheKey = SORTED_PRODUCTS_CACHE_KEY(eventId);
				const cachedData: CachedProducts = {
					products,
					total,
					hasMore,
					offset: -1,
					timestamp: Date.now(),
					version: this.config.version,
				};
				localStorage.setItem(cacheKey, JSON.stringify(cachedData));
				return;
			}

			// Limit cache size - remove oldest if exceeding maxSize
			this.enforceCacheSize(eventId);

			const cacheKey = PRODUCTS_CACHE_KEY(eventId, offset);
			const cachedData: CachedProducts = {
				products,
				total,
				hasMore,
				offset,
				timestamp: Date.now(),
				version: this.config.version,
			};

			localStorage.setItem(cacheKey, JSON.stringify(cachedData));
		} catch (error) {
			console.warn('[PromotionalCache] Error caching products:', error);
			// If storage is full, try to clear old cache
			if (error instanceof DOMException && error.name === 'QuotaExceededError') {
				this.clearOldCache(eventId);
			}
		}
	}

	/**
	 * Get all cached products for an event (up to maxSize)
	 */
	getAllCachedProducts(eventId: string): any[] {
		const allProducts: any[] = [];
		const seenIds = new Set<string>();

		for (let offset = 0; offset < this.config.maxSize * 20; offset += 20) {
			const cached = this.getProducts(eventId, offset);
			if (!cached) break;

			// Deduplicate products
			cached.products.forEach((product) => {
				if (!seenIds.has(product.productId)) {
					seenIds.add(product.productId);
					allProducts.push(product);
				}
			});

			if (!cached.hasMore) break;
		}

		return allProducts;
	}

	/**
	 * Clear all cache for an event
	 */
	clearEvent(eventId: string): void {
		try {
			const cacheKey = EVENT_CACHE_KEY(eventId);
			localStorage.removeItem(cacheKey);
		} catch (error) {
			console.warn('[PromotionalCache] Error clearing event cache:', error);
		}
	}

	/**
	 * Clear all products cache for an event
	 */
	clearProducts(eventId: string): void {
		try {
			// Remove all product cache keys for this event
			const keysToRemove: string[] = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith(`${CACHE_PREFIX}products_${eventId}_`) ||
					key === SORTED_PRODUCTS_CACHE_KEY(eventId)) {
					keysToRemove.push(key);
				}
			}
			keysToRemove.forEach((key) => localStorage.removeItem(key));
		} catch (error) {
			console.warn('[PromotionalCache] Error clearing products cache:', error);
		}
	}

	/**
	 * Clear all cache for an event (event + products)
	 */
	clearAll(eventId: string): void {
		this.clearEvent(eventId);
		this.clearProducts(eventId);
		const versionKey = CACHE_VERSION_KEY(eventId);
		localStorage.removeItem(versionKey);
	}

	/**
	 * Invalidate cache by changing version (forces reload)
	 */
	invalidate(eventId: string): void {
		this.clearAll(eventId);
	}

	/**
	 * Check if cache is stale (but still valid for fallback)
	 */
	isStale(eventId: string, offset: number = 0): boolean {
		try {
			const cacheKey = offset === 0 
				? EVENT_CACHE_KEY(eventId)
				: PRODUCTS_CACHE_KEY(eventId, offset);
			const cached = localStorage.getItem(cacheKey);
			if (!cached) return true;

			const data = JSON.parse(cached);
			const age = Date.now() - data.timestamp;
			// Consider stale if older than 50% of maxAge
			return age > this.config.maxAge * 0.5;
		} catch {
			return true;
		}
	}

	/**
	 * Enforce cache size limit by removing oldest entries
	 */
	private enforceCacheSize(eventId: string): void {
		try {
			const cacheEntries: Array<{ key: string; timestamp: number; offset: number }> = [];

			// Collect all product cache entries for this event
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith(`${CACHE_PREFIX}products_${eventId}_`)) {
					try {
						const cached = localStorage.getItem(key);
						if (cached) {
							const data: CachedProducts = JSON.parse(cached);
							const offset = parseInt(key.split('_').pop() || '0', 10);
							cacheEntries.push({ key, timestamp: data.timestamp, offset });
						}
					} catch {
						// Invalid cache entry, remove it
						if (key) localStorage.removeItem(key);
					}
				}
			}

			// Sort by offset (ascending) and remove oldest if exceeding maxSize
			cacheEntries.sort((a, b) => a.offset - b.offset);
			if (cacheEntries.length >= this.config.maxSize) {
				// Remove oldest entries (keep most recent)
				const toRemove = cacheEntries.slice(0, cacheEntries.length - this.config.maxSize + 1);
				toRemove.forEach((entry) => localStorage.removeItem(entry.key));
			}
		} catch (error) {
			console.warn('[PromotionalCache] Error enforcing cache size:', error);
		}
	}

	/**
	 * Clear old cache entries to free up space
	 */
	private clearOldCache(eventId: string): void {
		try {
			const now = Date.now();
			const keysToRemove: string[] = [];

			// Find and mark expired entries
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith(CACHE_PREFIX)) {
					try {
						const cached = localStorage.getItem(key);
						if (cached) {
							const data = JSON.parse(cached);
							if (now - data.timestamp > this.config.maxAge) {
								keysToRemove.push(key);
							}
						}
					} catch {
						// Invalid entry, remove it
						if (key) keysToRemove.push(key);
					}
				}
			}

			// Remove expired entries
			keysToRemove.forEach((key) => localStorage.removeItem(key));
		} catch (error) {
			console.warn('[PromotionalCache] Error clearing old cache:', error);
		}
	}

	/**
	 * Get cache statistics for debugging
	 */
	getStats(eventId: string): {
		hasEvent: boolean;
		productPages: number;
		totalProducts: number;
		oldestTimestamp: number | null;
		newestTimestamp: number | null;
	} {
		let hasEvent = false;
		let productPages = 0;
		let totalProducts = 0;
		let oldestTimestamp: number | null = null;
		let newestTimestamp: number | null = null;

		try {
			const eventKey = EVENT_CACHE_KEY(eventId);
			const eventCached = localStorage.getItem(eventKey);
			if (eventCached) {
				const eventData: CachedEvent = JSON.parse(eventCached);
				hasEvent = true;
				if (!oldestTimestamp || eventData.timestamp < oldestTimestamp) {
					oldestTimestamp = eventData.timestamp;
				}
				if (!newestTimestamp || eventData.timestamp > newestTimestamp) {
					newestTimestamp = eventData.timestamp;
				}
			}

			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith(`${CACHE_PREFIX}products_${eventId}_`)) {
					try {
						const cached = localStorage.getItem(key);
						if (cached) {
							const data: CachedProducts = JSON.parse(cached);
							productPages++;
							totalProducts += data.products.length;
							if (!oldestTimestamp || data.timestamp < oldestTimestamp) {
								oldestTimestamp = data.timestamp;
							}
							if (!newestTimestamp || data.timestamp > newestTimestamp) {
								newestTimestamp = data.timestamp;
							}
						}
					} catch {
						// Skip invalid entries
					}
				}
			}
		} catch (error) {
			console.warn('[PromotionalCache] Error getting stats:', error);
		}

		return {
			hasEvent,
			productPages,
			totalProducts,
			oldestTimestamp,
			newestTimestamp,
		};
	}
}

// Export singleton instance
export const promotionalCache = new PromotionalCache();

