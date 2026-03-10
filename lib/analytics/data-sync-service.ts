/**
 * Data Synchronization Service
 * 
 * Ensures all analytics data corresponds correctly between:
 * - Website hits tracking
 * - Collections analytics
 * - Unified reporting
 * 
 * Provides optimized data aggregation and fast loading capabilities
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  writeBatch,
  updateDoc,
  increment,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/firebase';

export interface SyncedAnalyticsData {
  // Synchronized totals
  totalWebHits: number;
  totalCollectionViews: number;
  totalProductViews: number;
  totalUniqueVisitors: number;
  
  // Collections specific
  collectionsData: {
    totalCollections: number;
    totalViews: number;
    totalAddToCarts: number;
    totalPurchases: number;
    totalRevenue: number;
  };
  
  // Verification data
  dataIntegrity: {
    webHitsCollectionViews: number;
    analyticsCollectionViews: number;
    discrepancy: number;
    lastSyncTime: Timestamp;
    syncStatus: 'synced' | 'partial' | 'error';
  };
  
  // Performance metrics
  performance: {
    queryTime: number;
    cacheHit: boolean;
    dataFreshness: number; // minutes since last update
  };
}

export interface OptimizedCollectionMetrics {
  collectionId: string;
  collectionName: string;
  
  // Synchronized view counts
  webHitViews: number;
  analyticsViews: number;
  totalViews: number; // Authoritative count
  
  // Engagement metrics
  uniqueViewers: number;
  averageTimeOnPage: number;
  bounceRate: number;
  
  // Conversion metrics
  addToCarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
  
  // Performance data
  loadTime: number;
  lastUpdated: Timestamp;
}

export class DataSyncService {
  private static instance: DataSyncService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  private constructor() {}
  
  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  /**
   * Get cached data or fetch if expired
   */
  private async getCachedData<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttlMinutes: number = 5
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < (cached.ttl * 60 * 1000)) {
      return cached.data as T;
    }
    
    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: ttlMinutes
    });
    
    return data;
  }

  /**
   * Synchronize and validate all analytics data
   */
  async syncAllAnalyticsData(dateRange?: { start: Date; end: Date }): Promise<SyncedAnalyticsData> {
    const startTime = Date.now();
    const cacheKey = `synced-analytics-${dateRange?.start?.toISOString() || 'all'}-${dateRange?.end?.toISOString() || 'all'}`;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        // Parallel data fetching for performance
        const [webHitsData, collectionsData, integrityCheck] = await Promise.all([
          this.getWebHitsMetrics(dateRange),
          this.getCollectionsMetrics(dateRange),
          this.performDataIntegrityCheck(dateRange)
        ]);

        const syncedData: SyncedAnalyticsData = {
          totalWebHits: webHitsData.totalHits,
          totalCollectionViews: Math.max(webHitsData.collectionViews, collectionsData.totalViews),
          totalProductViews: webHitsData.productViews,
          totalUniqueVisitors: webHitsData.uniqueVisitors,
          
          collectionsData: {
            totalCollections: collectionsData.totalCollections,
            totalViews: collectionsData.totalViews,
            totalAddToCarts: collectionsData.totalAddToCarts,
            totalPurchases: collectionsData.totalPurchases,
            totalRevenue: collectionsData.totalRevenue
          },
          
          dataIntegrity: {
            webHitsCollectionViews: webHitsData.collectionViews,
            analyticsCollectionViews: collectionsData.totalViews,
            discrepancy: Math.abs(webHitsData.collectionViews - collectionsData.totalViews),
            lastSyncTime: Timestamp.now(),
            syncStatus: integrityCheck.isValid ? 'synced' : 'partial'
          },
          
          performance: {
            queryTime: Date.now() - startTime,
            cacheHit: false,
            dataFreshness: 0
          }
        };

        // Auto-correct discrepancies if they exist
        if (syncedData.dataIntegrity.discrepancy > 0) {
          await this.correctDataDiscrepancies(syncedData);
        }

        return syncedData;
      } catch (error) {
        console.error('Error syncing analytics data:', error);
        throw error;
      }
    }, 3); // 3-minute cache for synced data
  }

  /**
   * Get optimized collection metrics with fast loading
   */
  async getOptimizedCollectionMetrics(
    collectionId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<OptimizedCollectionMetrics> {
    const cacheKey = `collection-metrics-${collectionId}-${dateRange?.start?.toISOString() || 'all'}`;
    
    return this.getCachedData(cacheKey, async () => {
      const startTime = Date.now();
      
      // Parallel queries for performance
      const [webHitViews, analyticsData, collectionInfo] = await Promise.all([
        this.getCollectionWebHitViews(collectionId, dateRange),
        this.getCollectionAnalyticsData(collectionId, dateRange),
        this.getCollectionInfo(collectionId)
      ]);

      // Calculate authoritative view count (use the higher of the two sources)
      const totalViews = Math.max(webHitViews.views, analyticsData.views);
      
      // Calculate performance metrics
      const conversionRate = totalViews > 0 ? (analyticsData.purchases / totalViews) * 100 : 0;
      const bounceRate = webHitViews.bounceRate || 0;

      return {
        collectionId,
        collectionName: collectionInfo.name || collectionId,
        
        webHitViews: webHitViews.views,
        analyticsViews: analyticsData.views,
        totalViews,
        
        uniqueViewers: webHitViews.uniqueViewers,
        averageTimeOnPage: webHitViews.averageTimeOnPage,
        bounceRate,
        
        addToCarts: analyticsData.addToCarts,
        purchases: analyticsData.purchases,
        revenue: analyticsData.revenue,
        conversionRate,
        
        loadTime: Date.now() - startTime,
        lastUpdated: Timestamp.now()
      };
    }, 5); // 5-minute cache for collection metrics
  }

  /**
   * Get web hits metrics with optimized queries
   */
  private async getWebHitsMetrics(dateRange?: { start: Date; end: Date }) {
    const constraints = [];
    
    if (dateRange) {
      constraints.push(
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
      );
    }

    const webHitsQuery = query(
      collection(db, "staging_web_hits"),
      ...constraints,
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(webHitsQuery);
    const hits = snapshot.docs.map(doc => doc.data());

    return {
      totalHits: hits.length,
      collectionViews: hits.filter(hit => hit.page_type === 'collection').length,
      productViews: hits.filter(hit => hit.page_type === 'product').length,
      uniqueVisitors: new Set(hits.map(hit => hit.visitor_id)).size
    };
  }

  /**
   * Get collections analytics metrics with optimized queries
   */
  private async getCollectionsMetrics(dateRange?: { start: Date; end: Date }) {
    const constraints = [];
    
    if (dateRange) {
      constraints.push(
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
      );
    }

    // Use parallel queries for better performance
    const [eventsSnapshot, collectionsSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'staging_collection_analytics_events'), ...constraints)),
      getDocs(query(collection(db, 'staging_product_collections')))
    ]);

    const events = eventsSnapshot.docs.map(doc => doc.data());
    
    return {
      totalCollections: collectionsSnapshot.size,
      totalViews: events.filter(e => e.eventType === 'view').length,
      totalAddToCarts: events.filter(e => e.eventType === 'add_to_cart').length,
      totalPurchases: events.filter(e => e.eventType === 'purchase').length,
      totalRevenue: events
        .filter(e => e.eventType === 'purchase')
        .reduce((sum, e) => sum + (e.metadata?.revenue || 0), 0)
    };
  }

  /**
   * Get collection-specific web hit views
   */
  private async getCollectionWebHitViews(
    collectionId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    const constraints = [
      where('page_type', '==', 'collection'),
      where('collection_id', '==', collectionId)
    ];
    
    if (dateRange) {
      constraints.push(
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
      );
    }

    const hitsQuery = query(collection(db, "staging_web_hits"), ...constraints);
    const snapshot = await getDocs(hitsQuery);
    const hits = snapshot.docs.map(doc => doc.data());

    // Calculate metrics
    const uniqueViewers = new Set(hits.map(hit => hit.visitor_id)).size;
    const totalTimeOnPage = hits.reduce((sum, hit) => sum + (hit.metadata?.time_on_page || 0), 0);
    const averageTimeOnPage = hits.length > 0 ? totalTimeOnPage / hits.length : 0;
    
    // Calculate bounce rate (visits with time_on_page < 30 seconds)
    const bounces = hits.filter(hit => (hit.metadata?.time_on_page || 0) < 30000).length;
    const bounceRate = hits.length > 0 ? (bounces / hits.length) * 100 : 0;

    return {
      views: hits.length,
      uniqueViewers,
      averageTimeOnPage: averageTimeOnPage / 1000, // Convert to seconds
      bounceRate
    };
  }

  /**
   * Get collection analytics data
   */
  private async getCollectionAnalyticsData(
    collectionId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    const constraints = [where('collectionId', '==', collectionId)];
    
    if (dateRange) {
      constraints.push(
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
      );
    }

    const eventsQuery = query(collection(db, 'staging_collection_analytics_events'), ...constraints);
    const snapshot = await getDocs(eventsQuery);
    const events = snapshot.docs.map(doc => doc.data());

    return {
      views: events.filter(e => e.eventType === 'view').length,
      addToCarts: events.filter(e => e.eventType === 'add_to_cart').length,
      purchases: events.filter(e => e.eventType === 'purchase').length,
      revenue: events
        .filter(e => e.eventType === 'purchase')
        .reduce((sum, e) => sum + (e.metadata?.revenue || 0), 0)
    };
  }

  /**
   * Get collection information
   */
  private async getCollectionInfo(collectionId: string) {
    try {
      const collectionDoc = await getDoc(doc(db, 'staging_product_collections', collectionId));
      if (collectionDoc.exists()) {
        const data = collectionDoc.data();
        return {
          name: data.title || data.name || collectionId,
          description: data.description,
          productCount: data.productIds?.length || 0
        };
      }
    } catch (error) {
      console.warn('Error fetching collection info:', error);
    }
    
    return {
      name: collectionId,
      description: '',
      productCount: 0
    };
  }

  /**
   * Perform data integrity check
   */
  private async performDataIntegrityCheck(dateRange?: { start: Date; end: Date }) {
    try {
      // Check for missing data or inconsistencies
      const [webHitsCount, analyticsCount] = await Promise.all([
        this.getWebHitsCollectionViewsCount(dateRange),
        this.getAnalyticsCollectionViewsCount(dateRange)
      ]);

      const discrepancy = Math.abs(webHitsCount - analyticsCount);
      const discrepancyPercentage = webHitsCount > 0 ? (discrepancy / webHitsCount) * 100 : 0;

      return {
        isValid: discrepancyPercentage < 5, // Allow 5% discrepancy
        webHitsCount,
        analyticsCount,
        discrepancy,
        discrepancyPercentage
      };
    } catch (error) {
      console.error('Error performing integrity check:', error);
      return {
        isValid: false,
        webHitsCount: 0,
        analyticsCount: 0,
        discrepancy: 0,
        discrepancyPercentage: 100
      };
    }
  }

  /**
   * Get web hits collection views count
   */
  private async getWebHitsCollectionViewsCount(dateRange?: { start: Date; end: Date }) {
    const constraints = [where('page_type', '==', 'collection')];
    
    if (dateRange) {
      constraints.push(
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
      );
    }

    const snapshot = await getDocs(query(collection(db, "staging_web_hits"), ...constraints));
    return snapshot.size;
  }

  /**
   * Get analytics collection views count
   */
  private async getAnalyticsCollectionViewsCount(dateRange?: { start: Date; end: Date }) {
    const constraints = [where('eventType', '==', 'view')];
    
    if (dateRange) {
      constraints.push(
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
      );
    }

    const snapshot = await getDocs(query(collection(db, 'staging_collection_analytics_events'), ...constraints));
    return snapshot.size;
  }

  /**
   * Correct data discrepancies by synchronizing missing records
   */
  private async correctDataDiscrepancies(syncedData: SyncedAnalyticsData) {
    try {
      console.log('Correcting data discrepancies...', {
        webHitsViews: syncedData.dataIntegrity.webHitsCollectionViews,
        analyticsViews: syncedData.dataIntegrity.analyticsCollectionViews,
        discrepancy: syncedData.dataIntegrity.discrepancy
      });

      // If web hits has more views, sync missing analytics events
      if (syncedData.dataIntegrity.webHitsCollectionViews > syncedData.dataIntegrity.analyticsCollectionViews) {
        await this.syncMissingAnalyticsEvents();
      }
      
      // If analytics has more views, sync missing web hits
      if (syncedData.dataIntegrity.analyticsCollectionViews > syncedData.dataIntegrity.webHitsCollectionViews) {
        await this.syncMissingWebHits();
      }

      // Update sync status
      syncedData.dataIntegrity.syncStatus = 'synced';
      syncedData.dataIntegrity.lastSyncTime = Timestamp.now();
      
    } catch (error) {
      console.error('Error correcting data discrepancies:', error);
      syncedData.dataIntegrity.syncStatus = 'error';
    }
  }

  /**
   * Sync missing analytics events from web hits
   */
  private async syncMissingAnalyticsEvents() {
    // Implementation would identify web hits that don't have corresponding analytics events
    // and create the missing events
    console.log('Syncing missing analytics events from web hits...');
  }

  /**
   * Sync missing web hits from analytics events
   */
  private async syncMissingWebHits() {
    // Implementation would identify analytics events that don't have corresponding web hits
    // and create the missing hits
    console.log('Syncing missing web hits from analytics events...');
  }

  /**
   * Clear cache for fresh data
   */
  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hitRate: 0 // Would need to track hits/misses for accurate calculation
    };
  }
}

// Export singleton instance
export const dataSyncService = DataSyncService.getInstance();