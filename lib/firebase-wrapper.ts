/**
 * Optimized Firebase wrapper with caching and performance enhancements
 */

import { getFirebaseDb } from './firebase';
import { serverCacheManager as cacheManager, cacheKeys } from './utils/server-cache-utils';

// Module cache for dynamic imports
const moduleCache = new Map<string, any>();

export const clearModuleCache = () => {
  moduleCache.clear();
};

// Cached Firebase operations
export const getCachedFirebaseDb = async () => {
  const cacheKey = 'firebase:db';
  let db = cacheManager.get(cacheKey);
  
  if (!db) {
    db = await getFirebaseDb();
    cacheManager.set(cacheKey, db, 30 * 60 * 1000); // 30 minutes
  }
  
  return db;
};

// Optimized Firestore operations with batching
export class OptimizedFirestore {
  private batchOperations: Array<() => Promise<any>> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  // Add operation to batch
  addToBatch(operation: () => Promise<any>) {
    this.batchOperations.push(operation);
    
    // Auto-execute batch after 100ms or when it reaches 10 operations
    if (this.batchOperations.length >= 10) {
      this.executeBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.executeBatch(), 100);
    }
  }

  // Execute all batched operations
  async executeBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const operations = [...this.batchOperations];
    this.batchOperations = [];

    if (operations.length === 0) return;

    try {
      await Promise.allSettled(operations.map(op => op()));
    } catch (error) {
      console.error('Batch operation failed:', error);
    }
  }

  // Optimized document read with caching
  async getDocument(collection: string, id: string, ttl: number = 5 * 60 * 1000) {
    const cacheKey = `doc:${collection}:${id}`;
    const cached = cacheManager.get(cacheKey);
    
    if (cached) return cached;

    const db = await getCachedFirebaseDb();
    const { doc, getDoc } = await import('firebase/firestore');
    
    const docRef = doc(db, collection, id);
    const docSnap = await getDoc(docRef);
    
    const result = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    
    if (result) {
      cacheManager.set(cacheKey, result, ttl);
    }
    
    return result;
  }

  // Optimized collection query with caching
  async getCollection(
    collection: string, 
    constraints: any[] = [], 
    ttl: number = 5 * 60 * 1000
  ) {
    const cacheKey = `collection:${collection}:${JSON.stringify(constraints)}`;
    const cached = cacheManager.get(cacheKey);
    
    if (cached) return cached;

    const db = await getCachedFirebaseDb();
    const { collection: firestoreCollection, query, getDocs } = await import('firebase/firestore');
    
    const q = constraints.length > 0 
      ? query(firestoreCollection(db, collection), ...constraints)
      : firestoreCollection(db, collection);
    
    const querySnapshot = await getDocs(q);
    const result = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    cacheManager.set(cacheKey, result, ttl);
    return result;
  }

  // Optimized write operations
  async writeDocument(collection: string, id: string, data: any) {
    const db = await getCachedFirebaseDb();
    const { doc, setDoc } = await import('firebase/firestore');
    
    const docRef = doc(db, collection, id);
    await setDoc(docRef, data, { merge: true });
    
    // Invalidate cache
    const cacheKey = `doc:${collection}:${id}`;
    cacheManager.delete(cacheKey);
  }

  // Optimized update operations
  async updateDocument(collection: string, id: string, data: any) {
    const db = await getCachedFirebaseDb();
    const { doc, updateDoc } = await import('firebase/firestore');
    
    const docRef = doc(db, collection, id);
    await updateDoc(docRef, data);
    
    // Invalidate cache
    const cacheKey = `doc:${collection}:${id}`;
    cacheManager.delete(cacheKey);
  }
}

export const optimizedFirestore = new OptimizedFirestore();

// Preload critical Firebase modules
export const preloadFirebaseModules = async () => {
  try {
    await Promise.all([
      import('firebase/firestore'),
      import('firebase/auth'),
    ]);
    console.log('✅ Firebase modules preloaded');
  } catch (error) {
    console.warn('⚠️ Firebase module preload failed:', error);
  }
};

// Initialize preloading
if (typeof window !== 'undefined') {
  preloadFirebaseModules();
}