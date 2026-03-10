/**
 * Optimized Analytics Service
 * 
 * Reduces Firebase queries by:
 * - Batching multiple analytics queries
 * - Caching results with appropriate TTL
 * - Using count aggregation instead of full document fetches
 * - Parallel query execution
 */

import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  Timestamp,
} from "firebase/firestore";
import { serverCacheManager as cacheManager } from "@/lib/utils/server-cache-utils";
import { executeParallelQueries, getCollectionCount } from "@/lib/utils/firestore-query-optimizer";

// Cache TTL constants
const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 10 * 60 * 1000,      // 10 minutes
  VERY_LONG: 30 * 60 * 1000, // 30 minutes
};

/**
 * Get all analytics data in a single optimized call
 */
export async function getAllAnalytics() {
  const cacheKey = 'analytics:all';
  const cached = cacheManager.get(cacheKey);
  
  if (cached) {
    console.log('✅ Analytics cache hit');
    return cached;
  }

  console.log('🚀 Fetching all analytics in parallel...');
  const startTime = Date.now();

  try {
    // Execute all count queries in parallel
    const [
      totalUsers,
      totalInstalls,
      totalSearches,
      totalOrders,
      webSignups,
    ] = await Promise.all([
      getCollectionCount(db, 'staging_users', [], { useCache: true, cacheTTL: CACHE_TTL.LONG }),
      getCollectionCount(db, 'app_installs', [], { useCache: true, cacheTTL: CACHE_TTL.MEDIUM }),
      getCollectionCount(db, 'searches', [], { useCache: true, cacheTTL: CACHE_TTL.SHORT }),
      getCollectionCount(db, 'staging_orders', [], { useCache: true, cacheTTL: CACHE_TTL.SHORT }),
      getCollectionCount(db, 'web_signUp', [], { useCache: true, cacheTTL: CACHE_TTL.LONG }),
    ]);

    const result = {
      totalUsers,
      totalInstalls,
      totalSearches,
      totalOrders,
      webSignups,
      timestamp: new Date(),
    };

    // Cache for 2 minutes
    cacheManager.set(cacheKey, result, CACHE_TTL.SHORT);

    const duration = Date.now() - startTime;
    console.log(`✅ All analytics fetched in ${duration}ms`);

    return result;
  } catch (error) {
    console.error('❌ Failed to fetch analytics:', error);
    throw error;
  }
}

/**
 * Get install analytics by platform (optimized)
 */
export async function getInstallsByPlatform() {
  const cacheKey = 'analytics:installs:platform';
  const cached = cacheManager.get(cacheKey);
  
  if (cached) return cached;

  try {
    const installsRef = collection(db, "staging_app_installs");

    const [androidCount, iosCount] = await Promise.all([
      getCountFromServer(query(installsRef, where('device_type', '==', 'android'))),
      getCountFromServer(query(installsRef, where('device_type', '==', 'ios'))),
    ]);

    const result = {
      android: androidCount.data().count,
      ios: iosCount.data().count,
      total: androidCount.data().count + iosCount.data().count,
    };

    cacheManager.set(cacheKey, result, CACHE_TTL.MEDIUM);
    return result;
  } catch (error) {
    console.error('Failed to get installs by platform:', error);
    throw error;
  }
}

/**
 * Get user location analytics (optimized with caching)
 */
export async function getUsersByCountry() {
  const cacheKey = 'analytics:users:country';
  const cached = cacheManager.get(cacheKey);
  
  if (cached) return cached;

  try {
    const usersRef = collection(db, "staging_users");
    const q = query(usersRef, where('registration_country', '!=', null));
    const snapshot = await getDocs(q);

    // Group by country
    const countryMap = new Map<string, number>();
    snapshot.docs.forEach(doc => {
      const country = doc.data().registration_country;
      if (country) {
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      }
    });

    const result = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    cacheManager.set(cacheKey, result, CACHE_TTL.LONG);
    return result;
  } catch (error) {
    console.error('Failed to get users by country:', error);
    throw error;
  }
}

/**
 * Get search analytics (optimized)
 */
export async function getTopSearchTerms(limit: number = 10) {
  const cacheKey = `analytics:search:top:${limit}`;
  const cached = cacheManager.get(cacheKey);
  
  if (cached) return cached;

  try {
    const searchAnalyticsRef = collection(db, 'search_analytics');
    const snapshot = await getDocs(searchAnalyticsRef);

    const results = snapshot.docs
      .map(doc => ({
        term: doc.id,
        count: doc.data().search_count || 0,
        avgResults: doc.data().avg_results || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    cacheManager.set(cacheKey, results, CACHE_TTL.MEDIUM);
    return results;
  } catch (error) {
    console.error('Failed to get top search terms:', error);
    throw error;
  }
}

/**
 * Get analytics for a date range (optimized)
 */
export async function getAnalyticsByDateRange(startDate: Date, endDate: Date) {
  const cacheKey = `analytics:range:${startDate.getTime()}:${endDate.getTime()}`;
  const cached = cacheManager.get(cacheKey);
  
  if (cached) return cached;

  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Execute queries in parallel
    const [installsSnapshot, searchesSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db, "staging_app_installs"),
          where('timestamp', '>=', startTimestamp),
          where('timestamp', '<=', endTimestamp)
        )
      ),
      getDocs(
        query(
          collection(db, "staging_searches"),
          where('timestamp', '>=', startTimestamp),
          where('timestamp', '<=', endTimestamp)
        )
      ),
    ]);

    const result = {
      installs: installsSnapshot.size,
      searches: searchesSnapshot.size,
      dateRange: { startDate, endDate },
    };

    cacheManager.set(cacheKey, result, CACHE_TTL.MEDIUM);
    return result;
  } catch (error) {
    console.error('Failed to get analytics by date range:', error);
    throw error;
  }
}

/**
 * Preload analytics data for dashboard
 */
export async function preloadDashboardAnalytics() {
  console.log('🚀 Preloading dashboard analytics...');
  
  const startTime = Date.now();

  try {
    await Promise.allSettled([
      getAllAnalytics(),
      getInstallsByPlatform(),
      getUsersByCountry(),
      getTopSearchTerms(10),
    ]);

    const duration = Date.now() - startTime;
    console.log(`✅ Dashboard analytics preloaded in ${duration}ms`);
  } catch (error) {
    console.error('❌ Failed to preload dashboard analytics:', error);
  }
}

/**
 * Clear analytics cache
 */
export function clearAnalyticsCache() {
  const keys = Array.from(cacheManager['cache'].keys());
  keys.forEach(key => {
    if (key.startsWith('analytics:')) {
      cacheManager.delete(key);
    }
  });
  console.log('✅ Analytics cache cleared');
}
