/**
 * Firestore Query Optimizer
 * 
 * Provides optimized query patterns with:
 * - Automatic batching
 * - Query result caching
 * - Pagination support
 * - Index hints
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  QueryConstraint,
  DocumentSnapshot,
  Query,
  Firestore,
  getCountFromServer,
  DocumentData,
} from 'firebase/firestore';
import { serverCacheManager as cacheManager, cacheKeys } from './server-cache-utils';

interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  pageSize?: number;
  startAfterDoc?: DocumentSnapshot;
}

interface BatchQueryResult<T> {
  data: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
  fromCache: boolean;
}

/**
 * Optimized query executor with caching
 */
export async function executeOptimizedQuery<T = DocumentData>(
  db: Firestore,
  collectionName: string,
  constraints: QueryConstraint[] = [],
  options: QueryOptions = {}
): Promise<T[]> {
  const {
    useCache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
  } = options;

  // Generate cache key
  const cacheKey = `query:${collectionName}:${JSON.stringify(constraints)}`;

  // Check cache first
  if (useCache) {
    const cached = cacheManager.get<T[]>(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for ${collectionName}`);
      return cached;
    }
  }

  // Execute query
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);

  const results = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];

  // Cache results
  if (useCache) {
    cacheManager.set(cacheKey, results, cacheTTL);
  }

  console.log(`✅ Query executed for ${collectionName}: ${results.length} docs`);
  return results;
}

/**
 * Paginated query with caching
 */
export async function executePaginatedQuery<T = DocumentData>(
  db: Firestore,
  collectionName: string,
  constraints: QueryConstraint[] = [],
  options: QueryOptions = {}
): Promise<BatchQueryResult<T>> {
  const {
    useCache = true,
    cacheTTL = 5 * 60 * 1000,
    pageSize = 20,
    startAfterDoc,
  } = options;

  // Build query with pagination
  const queryConstraints = [...constraints, limit(pageSize + 1)];
  if (startAfterDoc) {
    queryConstraints.push(startAfter(startAfterDoc));
  }

  // Generate cache key
  const cacheKey = `paginated:${collectionName}:${JSON.stringify(constraints)}:${startAfterDoc?.id || 'first'}`;

  // Check cache
  if (useCache && !startAfterDoc) {
    const cached = cacheManager.get<BatchQueryResult<T>>(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for paginated ${collectionName}`);
      return cached;
    }
  }

  // Execute query
  const q = query(collection(db, collectionName), ...queryConstraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const results = docs.slice(0, pageSize);

  const data = results.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];

  const result: BatchQueryResult<T> = {
    data,
    lastDoc: results[results.length - 1] || null,
    hasMore,
    fromCache: false,
  };

  // Cache first page only
  if (useCache && !startAfterDoc) {
    cacheManager.set(cacheKey, result, cacheTTL);
  }

  console.log(`✅ Paginated query for ${collectionName}: ${data.length} docs, hasMore: ${hasMore}`);
  return result;
}

/**
 * Batch get documents by IDs
 */
export async function batchGetDocuments<T = DocumentData>(
  db: Firestore,
  collectionName: string,
  ids: string[],
  options: QueryOptions = {}
): Promise<T[]> {
  const {
    useCache = true,
    cacheTTL = 10 * 60 * 1000, // 10 minutes for individual docs
  } = options;

  if (ids.length === 0) return [];

  // Check cache for each document
  const results: T[] = [];
  const uncachedIds: string[] = [];

  if (useCache) {
    for (const id of ids) {
      const cacheKey = `doc:${collectionName}:${id}`;
      const cached = cacheManager.get<T>(cacheKey);
      if (cached) {
        results.push(cached);
      } else {
        uncachedIds.push(id);
      }
    }
  } else {
    uncachedIds.push(...ids);
  }

  // Fetch uncached documents
  if (uncachedIds.length > 0) {
    const fetchPromises = uncachedIds.map(async (id) => {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as T;
        
        // Cache individual document
        if (useCache) {
          const cacheKey = `doc:${collectionName}:${id}`;
          cacheManager.set(cacheKey, data, cacheTTL);
        }
        
        return data;
      }
      return null;
    });

    const fetchedDocs = await Promise.all(fetchPromises);
    results.push(...fetchedDocs.filter(doc => doc !== null) as T[]);
  }

  console.log(`✅ Batch get ${collectionName}: ${results.length}/${ids.length} docs`);
  return results;
}

/**
 * Get document count efficiently
 */
export async function getCollectionCount(
  db: Firestore,
  collectionName: string,
  constraints: QueryConstraint[] = [],
  options: QueryOptions = {}
): Promise<number> {
  const {
    useCache = true,
    cacheTTL = 10 * 60 * 1000, // 10 minutes
  } = options;

  const cacheKey = `count:${collectionName}:${JSON.stringify(constraints)}`;

  // Check cache
  if (useCache) {
    const cached = cacheManager.get<number>(cacheKey);
    if (cached !== null) {
      console.log(`✅ Cache hit for count ${collectionName}`);
      return cached;
    }
  }

  // Execute count query
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getCountFromServer(q);
  const count = snapshot.data().count;

  // Cache result
  if (useCache) {
    cacheManager.set(cacheKey, count, cacheTTL);
  }

  console.log(`✅ Count query for ${collectionName}: ${count}`);
  return count;
}

/**
 * Parallel query executor for multiple collections
 */
export async function executeParallelQueries<T = DocumentData>(
  db: Firestore,
  queries: Array<{
    collectionName: string;
    constraints?: QueryConstraint[];
    options?: QueryOptions;
  }>
): Promise<T[][]> {
  console.log(`🚀 Executing ${queries.length} queries in parallel`);
  
  const startTime = Date.now();
  
  const results = await Promise.all(
    queries.map(({ collectionName, constraints = [], options = {} }) =>
      executeOptimizedQuery<T>(db, collectionName, constraints, options)
    )
  );

  const duration = Date.now() - startTime;
  console.log(`✅ Parallel queries completed in ${duration}ms`);

  return results;
}

/**
 * Query builder with common patterns
 */
export class QueryBuilder<T = DocumentData> {
  private constraints: QueryConstraint[] = [];
  private collectionName: string;
  private db: Firestore;
  private options: QueryOptions = {};

  constructor(db: Firestore, collectionName: string) {
    this.db = db;
    this.collectionName = collectionName;
  }

  whereEqual(field: string, value: any): this {
    this.constraints.push(where(field, '==', value));
    return this;
  }

  whereIn(field: string, values: any[]): this {
    // Firestore 'in' queries are limited to 10 values
    if (values.length <= 10) {
      this.constraints.push(where(field, 'in', values));
    } else {
      console.warn(`whereIn limited to 10 values, got ${values.length}. Consider using multiple queries.`);
      this.constraints.push(where(field, 'in', values.slice(0, 10)));
    }
    return this;
  }

  whereGreaterThan(field: string, value: any): this {
    this.constraints.push(where(field, '>', value));
    return this;
  }

  whereLessThan(field: string, value: any): this {
    this.constraints.push(where(field, '<', value));
    return this;
  }

  orderByField(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.constraints.push(orderBy(field, direction));
    return this;
  }

  limitTo(count: number): this {
    this.constraints.push(limit(count));
    return this;
  }

  withCache(ttl?: number): this {
    this.options.useCache = true;
    if (ttl) this.options.cacheTTL = ttl;
    return this;
  }

  withoutCache(): this {
    this.options.useCache = false;
    return this;
  }

  async execute(): Promise<T[]> {
    return executeOptimizedQuery<T>(
      this.db,
      this.collectionName,
      this.constraints,
      this.options
    );
  }

  async executePaginated(pageSize?: number, startAfterDoc?: DocumentSnapshot): Promise<BatchQueryResult<T>> {
    return executePaginatedQuery<T>(
      this.db,
      this.collectionName,
      this.constraints,
      { ...this.options, pageSize, startAfterDoc }
    );
  }

  async count(): Promise<number> {
    return getCollectionCount(
      this.db,
      this.collectionName,
      this.constraints,
      this.options
    );
  }
}

/**
 * Create a query builder
 */
export function createQueryBuilder<T = DocumentData>(
  db: Firestore,
  collectionName: string
): QueryBuilder<T> {
  return new QueryBuilder<T>(db, collectionName);
}

/**
 * Invalidate cache for a collection
 */
export function invalidateCollectionCache(collectionName: string): void {
  const patterns = [
    `query:${collectionName}:`,
    `paginated:${collectionName}:`,
    `count:${collectionName}:`,
    `doc:${collectionName}:`,
  ];

  patterns.forEach(pattern => {
    const keys = Array.from(cacheManager['cache'].keys());
    keys.forEach(key => {
      if (key.startsWith(pattern)) {
        cacheManager.delete(key);
      }
    });
  });

  console.log(`✅ Cache invalidated for ${collectionName}`);
}
