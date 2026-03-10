// useTailorsOptimized.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import type { Tailor } from "./useTailors";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const INITIAL_LOAD_LIMIT = 20; // Load only 20 tailors initially

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

const cache = new DataCache();

// Optimized function to get basic tailor info (no enrichment)
async function getTailorsBasic(limitCount: number = INITIAL_LOAD_LIMIT): Promise<Tailor[]> {
  const cacheKey = `tailors_basic_${limitCount}`;
  
  // Check cache first
  const cached = cache.get<Tailor[]>(cacheKey);
  if (cached) {
    console.log('📦 Using cached tailors data');
    return cached;
  }

  console.log('🔄 Fetching tailors from Firestore...');
  
  const startTime = performance.now();
  
  const q = query(
    collection(db, "staging_tailors"),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  const tailors = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Tailor[];

  const endTime = performance.now();
  console.log(`✅ Fetched ${tailors.length} tailors in ${(endTime - startTime).toFixed(0)}ms`);

  // Cache the result
  cache.set(cacheKey, tailors);

  return tailors;
}

// Optimized function to get tailor stats (lightweight)
async function getTailorStatsLightweight(): Promise<{
  totalTailors: number;
  totalVerified: number;
  totalPending: number;
}> {
  const cacheKey = 'tailor_stats_lightweight';
  
  const cached = cache.get<any>(cacheKey);
  if (cached) {
    console.log('📦 Using cached stats');
    return cached;
  }

  console.log('🔄 Fetching tailor stats from Firestore...');
  const startTime = performance.now();

  const snapshot = await getDocs(collection(db, "staging_tailors"));
  
  const stats = {
    totalTailors: snapshot.size,
    totalVerified: snapshot.docs.filter(doc => 
      doc.data().identity_verification?.status === 'verified'
    ).length,
    totalPending: snapshot.docs.filter(doc => 
      doc.data().identity_verification?.status === 'pending'
    ).length,
  };

  const endTime = performance.now();
  console.log(`✅ Fetched stats: ${stats.totalTailors} tailors (${stats.totalVerified} verified) in ${(endTime - startTime).toFixed(0)}ms`);

  cache.set(cacheKey, stats);
  return stats;
}

// Hook for optimized tailor loading
export function useTailorsOptimized(options?: {
  initialLimit?: number;
  autoLoad?: boolean;
}) {
  const { initialLimit = INITIAL_LOAD_LIMIT, autoLoad = true } = options || {};
  
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [stats, setStats] = useState({
    totalTailors: 0,
    totalVerified: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  const loadTailors = useCallback(async (loadMore: boolean = false) => {
    try {
      console.log(`📊 Loading tailors (loadMore: ${loadMore})...`);
      setLoading(true);
      setError(null);

      if (!loadMore) {
        // Initial load - fetch stats first (faster), then tailors
        console.log('🎯 Starting initial load...');
        const statsPromise = getTailorStatsLightweight();
        const tailorsPromise = getTailorsBasic(initialLimit);

        // Set stats immediately when available
        statsPromise.then(statsData => {
          console.log('📈 Stats loaded, updating state:', statsData);
          setStats(statsData);
        }).catch(err => {
          console.error('❌ Error loading stats:', err);
        });

        // Wait for both to complete
        const [tailorsData, statsData] = await Promise.all([
          tailorsPromise,
          statsPromise
        ]);

        console.log('✅ Initial load complete:', {
          tailorsCount: tailorsData.length,
          stats: statsData
        });

        setTailors(tailorsData);
        setStats(statsData);
        setHasMore(tailorsData.length >= initialLimit);
      } else {
        // Load more
        if (!lastDoc) {
          console.log('⚠️ No lastDoc, cannot load more');
          return;
        }

        console.log('📄 Loading more tailors...');
        const q = query(
          collection(db, "staging_tailors"),
          startAfter(lastDoc),
          limit(initialLimit)
        );

        const snapshot = await getDocs(q);
        const newTailors = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Tailor[];

        console.log(`✅ Loaded ${newTailors.length} more tailors`);

        setTailors(prev => [...prev, ...newTailors]);
        setHasMore(newTailors.length >= initialLimit);
        
        if (snapshot.docs.length > 0) {
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        }
      }
    } catch (err: any) {
      console.error('❌ Error loading tailors:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      setError(err.message || "Error fetching tailors");
    } finally {
      setLoading(false);
      console.log('🏁 Loading complete');
    }
  }, [initialLimit, lastDoc]);

  const refresh = useCallback(() => {
    cache.clear();
    setTailors([]);
    setLastDoc(null);
    loadTailors(false);
  }, [loadTailors]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadTailors(true);
    }
  }, [loading, hasMore, loadTailors]);

  useEffect(() => {
    if (autoLoad) {
      console.log('🚀 Auto-loading tailors...');
      loadTailors(false);
    }
  }, []); // Run once on mount

  return {
    tailors,
    stats,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

// Hook for getting a single tailor (with caching)
export function useTailorByIdOptimized(tailorId: string) {
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTailor() {
      if (!tailorId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const cacheKey = `tailor_${tailorId}`;
        const cached = cache.get<Tailor>(cacheKey);
        
        if (cached) {
          setTailor(cached);
          setLoading(false);
          return;
        }

        // Fetch from Firestore
        const { getTailorById } = await import('./useTailors');
        const data = await getTailorById(tailorId);
        
        cache.set(cacheKey, data);
        setTailor(data);
      } catch (err: any) {
        setError(err.message || "Error fetching tailor");
      } finally {
        setLoading(false);
      }
    }

    fetchTailor();
  }, [tailorId]);

  return { tailor, loading, error };
}

// Utility to clear all caches
export function clearTailorCache() {
  cache.clear();
}
