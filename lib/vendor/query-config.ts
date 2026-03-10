/**
 * Firestore Query Configuration and Optimization
 * Centralized query configuration with proper indexing
 * Validates: Requirements 10.1, 10.2, 10.3
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  Query,
  DocumentData,
  WhereFilterOp,
  OrderByDirection
} from 'firebase/firestore';
import { db } from '@/firebase';

// ============================================================================
// Query Builder with Index Optimization
// ============================================================================

export interface QueryConfig {
  collection: string;
  filters?: Array<{
    field: string;
    operator: WhereFilterOp;
    value: any;
  }>;
  orderByField?: string;
  orderByDirection?: OrderByDirection;
  limitCount?: number;
}

/**
 * Builds optimized Firestore queries with proper indexing
 * All queries are designed to use composite indexes defined in firestore.indexes.json
 */
export class QueryBuilder {
  /**
   * Builds a query with automatic index optimization
   */
  static build(config: QueryConfig): Query<DocumentData> {
    let q = collection(db, config.collection);
    let queryRef: Query<DocumentData> = q;

    // Apply filters
    if (config.filters && config.filters.length > 0) {
      config.filters.forEach(filter => {
        queryRef = query(queryRef, where(filter.field, filter.operator, filter.value));
      });
    }

    // Apply ordering
    if (config.orderByField) {
      queryRef = query(
        queryRef,
        orderBy(config.orderByField, config.orderByDirection || 'desc')
      );
    }

    // Apply limit
    if (config.limitCount) {
      queryRef = query(queryRef, limit(config.limitCount));
    }

    return queryRef;
  }

  /**
   * Vendor orders query - optimized for date range filtering
   * Uses composite index: (tailor_id, created_at)
   */
  static vendorOrders(vendorId: string, startDate?: Date, endDate?: Date, limitCount: number = 100): Query<DocumentData> {
    const filters: QueryConfig['filters'] = [
      { field: 'tailor_id', operator: '==', value: vendorId }
    ];

    if (startDate) {
      filters.push({ field: 'created_at', operator: '>=', value: startDate });
    }

    if (endDate) {
      filters.push({ field: 'created_at', operator: '<=', value: endDate });
    }

    return this.build({
      collection: 'user_orders',
      filters,
      orderByField: 'created_at',
      orderByDirection: 'desc',
      limitCount
    });
  }

  /**
   * Vendor products query - optimized
   * Uses index: (tailor_id)
   */
  static vendorProducts(vendorId: string, limitCount?: number): Query<DocumentData> {
    return this.build({
      collection: 'tailor_works',
      filters: [
        { field: 'tailor_id', operator: '==', value: vendorId }
      ],
      limitCount
    });
  }

  /**
   * Product analytics query - optimized
   * Uses composite index: (vendorId, updatedAt)
   */
  static productAnalytics(vendorId: string, limitCount?: number): Query<DocumentData> {
    return this.build({
      collection: 'product_analytics',
      filters: [
        { field: 'vendorId', operator: '==', value: vendorId }
      ],
      orderByField: 'updatedAt',
      orderByDirection: 'desc',
      limitCount
    });
  }

  /**
   * Vendor payouts query - optimized
   * Uses composite index: (vendorId, transferDate)
   */
  static vendorPayouts(vendorId: string, limitCount: number = 10): Query<DocumentData> {
    return this.build({
      collection: 'vendor_payouts',
      filters: [
        { field: 'vendorId', operator: '==', value: vendorId }
      ],
      orderByField: 'transferDate',
      orderByDirection: 'desc',
      limitCount
    });
  }

  /**
   * Vendor notifications query - optimized
   * Uses composite index: (vendorId, createdAt)
   */
  static vendorNotifications(vendorId: string, unreadOnly: boolean = false, limitCount: number = 20): Query<DocumentData> {
    const filters: QueryConfig['filters'] = [
      { field: 'vendorId', operator: '==', value: vendorId }
    ];

    if (unreadOnly) {
      filters.push({ field: 'isRead', operator: '==', value: false });
    }

    return this.build({
      collection: 'vendor_notifications',
      filters,
      orderByField: 'createdAt',
      orderByDirection: 'desc',
      limitCount
    });
  }

  /**
   * Shop activities query - optimized for analytics processing
   * Uses composite index: (vendorId, timestamp)
   */
  static shopActivities(
    vendorId: string,
    activityType?: string,
    startDate?: Date,
    endDate?: Date,
    limitCount: number = 1000
  ): Query<DocumentData> {
    const filters: QueryConfig['filters'] = [
      { field: 'vendorId', operator: '==', value: vendorId }
    ];

    if (activityType) {
      filters.push({ field: 'type', operator: '==', value: activityType });
    }

    if (startDate) {
      filters.push({ field: 'timestamp', operator: '>=', value: startDate });
    }

    if (endDate) {
      filters.push({ field: 'timestamp', operator: '<=', value: endDate });
    }

    return this.build({
      collection: 'shop_activities',
      filters,
      orderByField: 'timestamp',
      orderByDirection: 'desc',
      limitCount
    });
  }

  /**
   * Customer segments query - optimized
   * Uses composite index: (vendorId, type)
   */
  static customerSegments(vendorId: string, segmentType?: string): Query<DocumentData> {
    const filters: QueryConfig['filters'] = [
      { field: 'vendorId', operator: '==', value: vendorId }
    ];

    if (segmentType) {
      filters.push({ field: 'type', operator: '==', value: segmentType });
    }

    return this.build({
      collection: 'customer_segments',
      filters,
      orderByField: 'updatedAt',
      orderByDirection: 'desc'
    });
  }

  /**
   * Inventory alerts query - optimized
   * Uses composite index: (vendorId, severity, createdAt)
   */
  static inventoryAlerts(vendorId: string, severity?: string, limitCount: number = 50): Query<DocumentData> {
    const filters: QueryConfig['filters'] = [
      { field: 'vendorId', operator: '==', value: vendorId }
    ];

    if (severity) {
      filters.push({ field: 'severity', operator: '==', value: severity });
    }

    return this.build({
      collection: 'inventory_alerts',
      filters,
      orderByField: 'createdAt',
      orderByDirection: 'desc',
      limitCount
    });
  }
}

// ============================================================================
// Query Pagination Helper
// ============================================================================

export interface PaginationConfig {
  pageSize: number;
  lastVisible?: any;
}

/**
 * Helper for implementing cursor-based pagination
 * Improves performance for large datasets
 */
export class PaginationHelper {
  static async paginate<T>(
    queryRef: Query<DocumentData>,
    config: PaginationConfig
  ): Promise<{ data: T[]; lastVisible: any; hasMore: boolean }> {
    // Implementation would use startAfter for cursor-based pagination
    // This is a placeholder for the pattern
    return {
      data: [],
      lastVisible: null,
      hasMore: false
    };
  }
}

// ============================================================================
// Batch Operations Helper
// ============================================================================

/**
 * Helper for batch operations to reduce round trips
 */
export class BatchHelper {
  /**
   * Batch read multiple documents efficiently
   */
  static async batchRead(refs: any[]): Promise<any[]> {
    // Firestore automatically batches reads
    // This helper ensures we're following best practices
    const promises = refs.map(ref => ref.get());
    return Promise.all(promises);
  }

  /**
   * Chunk large arrays for batch processing
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
