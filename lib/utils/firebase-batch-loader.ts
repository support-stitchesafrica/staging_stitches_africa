/**
 * Firebase Batch Loader
 * 
 * Optimizes multiple Firebase queries by:
 * - Batching requests
 * - Deduplicating queries
 * - Parallel execution
 * - Request coalescing
 */

import { Firestore } from 'firebase/firestore';
import { executeOptimizedQuery, batchGetDocuments } from './firestore-query-optimizer';

interface BatchRequest {
  collectionName: string;
  ids?: string[];
  resolve: (data: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

class FirebaseBatchLoader {
  private queue: Map<string, BatchRequest[]> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 10; // ms
  private readonly MAX_BATCH_SIZE = 10;
  private db: Firestore | null = null;

  setFirestore(db: Firestore) {
    this.db = db;
  }

  /**
   * Load a single document by ID with batching
   */
  async loadDocument<T>(collectionName: string, id: string): Promise<T | null> {
    if (!this.db) {
      throw new Error('Firestore not initialized. Call setFirestore() first.');
    }

    return new Promise((resolve, reject) => {
      const key = `${collectionName}:doc`;
      
      if (!this.queue.has(key)) {
        this.queue.set(key, []);
      }

      this.queue.get(key)!.push({
        collectionName,
        ids: [id],
        resolve,
        reject,
        timestamp: Date.now(),
      });

      this.scheduleBatch();
    });
  }

  /**
   * Load multiple documents by IDs with batching
   */
  async loadDocuments<T>(collectionName: string, ids: string[]): Promise<T[]> {
    if (!this.db) {
      throw new Error('Firestore not initialized. Call setFirestore() first.');
    }

    if (ids.length === 0) return [];

    return new Promise((resolve, reject) => {
      const key = `${collectionName}:docs`;
      
      if (!this.queue.has(key)) {
        this.queue.set(key, []);
      }

      this.queue.get(key)!.push({
        collectionName,
        ids,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      this.scheduleBatch();
    });
  }

  /**
   * Schedule batch execution
   */
  private scheduleBatch() {
    if (this.batchTimeout) {
      return;
    }

    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
      this.batchTimeout = null;
    }, this.BATCH_DELAY);
  }

  /**
   * Execute batched requests
   */
  private async executeBatch() {
    if (!this.db) return;

    const currentQueue = new Map(this.queue);
    this.queue.clear();

    for (const [key, requests] of currentQueue) {
      const [collectionName] = key.split(':');
      
      try {
        // Deduplicate IDs
        const allIds = new Set<string>();
        requests.forEach(req => {
          req.ids?.forEach(id => allIds.add(id));
        });

        const uniqueIds = Array.from(allIds);
        
        // Batch fetch documents
        const results = await batchGetDocuments(
          this.db,
          collectionName,
          uniqueIds,
          { useCache: true }
        );

        // Create a map for quick lookup
        const resultMap = new Map(
          results.map(doc => [(doc as any).id, doc])
        );

        // Resolve all requests
        requests.forEach(req => {
          if (req.ids && req.ids.length === 1) {
            // Single document request
            const doc = resultMap.get(req.ids[0]);
            req.resolve(doc || null);
          } else if (req.ids) {
            // Multiple documents request
            const docs = req.ids
              .map(id => resultMap.get(id))
              .filter(doc => doc !== undefined);
            req.resolve(docs);
          }
        });

        console.log(`✅ Batch executed for ${collectionName}: ${uniqueIds.length} docs`);
      } catch (error) {
        console.error(`❌ Batch execution failed for ${collectionName}:`, error);
        requests.forEach(req => req.reject(error));
      }
    }
  }

  /**
   * Clear pending batches
   */
  clear() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.queue.clear();
  }
}

// Singleton instance
export const batchLoader = new FirebaseBatchLoader();

/**
 * Preload critical data in parallel
 */
export async function preloadCriticalData(db: Firestore) {
  console.log('🚀 Preloading critical data...');
  
  const startTime = Date.now();

  try {
    // Preload in parallel for maximum speed
    await Promise.allSettled([
      // Add your critical collections here
      executeOptimizedQuery(db, 'categories', [], { useCache: true, cacheTTL: 30 * 60 * 1000 }),
      executeOptimizedQuery(db, 'featured_products', [], { useCache: true, cacheTTL: 10 * 60 * 1000 }),
      // Add more critical queries as needed
    ]);

    const duration = Date.now() - startTime;
    console.log(`✅ Critical data preloaded in ${duration}ms`);
  } catch (error) {
    console.error('❌ Failed to preload critical data:', error);
  }
}

/**
 * Warmup cache with common queries
 */
export async function warmupCache(db: Firestore) {
  console.log('🔥 Warming up cache...');
  
  const startTime = Date.now();

  try {
    // Execute common queries to populate cache
    await Promise.allSettled([
      executeOptimizedQuery(db, 'tailor_works', [], { 
        useCache: true, 
        cacheTTL: 5 * 60 * 1000 
      }),
      executeOptimizedQuery(db, 'tailors', [], { 
        useCache: true, 
        cacheTTL: 10 * 60 * 1000 
      }),
    ]);

    const duration = Date.now() - startTime;
    console.log(`✅ Cache warmed up in ${duration}ms`);
  } catch (error) {
    console.error('❌ Cache warmup failed:', error);
  }
}
