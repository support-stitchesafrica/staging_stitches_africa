/**
 * Analytics Processor
 * Processes shop activities into vendor analytics in real-time
 * 
 * Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  Timestamp,
  writeBatch,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { ShopActivity, ActivitySummary } from '@/types/shop-activities';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ProductAnalytics {
  productId: string;
  vendorId: string;
  dateRange: DateRange;
  views: number;
  uniqueViews: number;
  addToCartCount: number;
  removeFromCartCount: number;
  purchaseCount: number;
  conversionRate: number;
  addToCartRate: number;
  cartConversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  updatedAt: Date;
}

export interface VendorAnalyticsSummary {
  vendorId: string;
  dateRange: DateRange;
  totalViews: number;
  totalAddToCarts: number;
  totalPurchases: number;
  totalRevenue: number;
  conversionRate: number;
  products: Map<string, ProductAnalytics>;
  updatedAt: Date;
}

/**
 * Analytics Processor Class
 * Processes shop activities into aggregated analytics
 */
export class AnalyticsProcessor {
  private db = db;
  private processingQueue: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_MS = 30000; // 30 seconds as per requirement 21.7

  /**
   * Processes activities for a specific vendor and date range
   * Validates: Requirements 22.1, 22.7
   */
  async processVendorActivities(
    vendorId: string,
    dateRange: DateRange
  ): Promise<VendorAnalyticsSummary> {
    const activities = await this.fetchActivities(vendorId, dateRange);
    
    // Group activities by product
    const productActivities = this.groupActivitiesByProduct(activities);
    
    // Calculate analytics for each product
    const productAnalytics = new Map<string, ProductAnalytics>();
    let totalViews = 0;
    let totalAddToCarts = 0;
    let totalPurchases = 0;
    let totalRevenue = 0;

    for (const [productId, productActivitiesList] of productActivities.entries()) {
      const analytics = this.calculateProductAnalytics(
        productId,
        vendorId,
        productActivitiesList,
        dateRange
      );
      
      productAnalytics.set(productId, analytics);
      totalViews += analytics.views;
      totalAddToCarts += analytics.addToCartCount;
      totalPurchases += analytics.purchaseCount;
      totalRevenue += analytics.totalRevenue;
    }

    const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

    return {
      vendorId,
      dateRange,
      totalViews,
      totalAddToCarts,
      totalPurchases,
      totalRevenue,
      conversionRate,
      products: productAnalytics,
      updatedAt: new Date()
    };
  }

  /**
   * Calculates view count from activity logs
   * Validates: Requirements 22.2
   */
  async calculateViewCount(
    productId: string,
    dateRange: DateRange
  ): Promise<{ total: number; unique: number }> {
    const activities = await this.fetchProductActivities(
      productId,
      'view',
      dateRange
    );

    const uniqueUsers = new Set(activities.map(a => a.userId));

    return {
      total: activities.length,
      unique: uniqueUsers.size
    };
  }

  /**
   * Calculates conversion rate from activities
   * Validates: Requirements 22.3
   */
  calculateConversionRate(
    viewCount: number,
    purchaseCount: number
  ): number {
    if (viewCount === 0) return 0;
    return (purchaseCount / viewCount) * 100;
  }

  /**
   * Calculates cart conversion rate
   * Validates: Requirements 22.3
   */
  calculateCartConversionRate(
    addToCartCount: number,
    purchaseCount: number
  ): number {
    if (addToCartCount === 0) return 0;
    return (purchaseCount / addToCartCount) * 100;
  }

  /**
   * Calculates product analytics from activities
   * Validates: Requirements 22.2, 22.3, 22.4
   */
  private calculateProductAnalytics(
    productId: string,
    vendorId: string,
    activities: ShopActivity[],
    dateRange: DateRange
  ): ProductAnalytics {
    const views = activities.filter(a => a.type === 'view');
    const addToCarts = activities.filter(a => a.type === 'add_to_cart');
    const purchases = activities.filter(a => a.type === 'purchase');

    const uniqueUsers = new Set(views.map(a => a.userId));
    const totalRevenue = purchases.reduce((sum, p) => {
      return sum + (p.metadata.price || 0) * (p.metadata.quantity || 1);
    }, 0);

    const viewCount = views.length;
    const addToCartCount = addToCarts.length;
    const purchaseCount = purchases.length;

    return {
      productId,
      vendorId,
      dateRange,
      views: viewCount,
      uniqueViews: uniqueUsers.size,
      addToCartCount,
      removeFromCartCount: activities.filter(a => a.type === 'remove_from_cart').length,
      purchaseCount,
      conversionRate: this.calculateConversionRate(viewCount, purchaseCount),
      addToCartRate: viewCount > 0 ? (addToCartCount / viewCount) * 100 : 0,
      cartConversionRate: this.calculateCartConversionRate(addToCartCount, purchaseCount),
      totalRevenue,
      averageOrderValue: purchaseCount > 0 ? totalRevenue / purchaseCount : 0,
      updatedAt: new Date()
    };
  }

  /**
   * Updates product ranking based on real activity data
   * Validates: Requirements 22.4
   */
  async updateProductRanking(
    productId: string,
    vendorId: string,
    dateRange: DateRange
  ): Promise<void> {
    const activities = await this.fetchProductActivities(productId, undefined, dateRange);
    const analytics = this.calculateProductAnalytics(productId, vendorId, activities, dateRange);

    // Calculate ranking factors from real data
    const rankingData = {
      productId,
      vendorId,
      views: analytics.views,
      addToCartRate: analytics.addToCartRate,
      conversionRate: analytics.conversionRate,
      revenue: analytics.totalRevenue,
      updatedAt: Timestamp.now()
    };

    // Store in product_analytics collection
    const docRef = doc(this.db, "staging_product_analytics", `${productId}_${this.formatDate(new Date())}`);
    await setDoc(docRef, rankingData, { merge: true });
  }

  /**
   * Schedules analytics update with debouncing
   * Validates: Requirements 21.7, 22.7
   */
  scheduleAnalyticsUpdate(vendorId: string): void {
    // Clear existing timeout if any
    if (this.processingQueue.has(vendorId)) {
      clearTimeout(this.processingQueue.get(vendorId)!);
    }

    // Schedule new update
    const timeout = setTimeout(async () => {
      await this.processRecentActivities(vendorId);
      this.processingQueue.delete(vendorId);
    }, this.DEBOUNCE_MS);

    this.processingQueue.set(vendorId, timeout);
  }

  /**
   * Processes recent activities for a vendor
   * Validates: Requirements 22.1, 22.7
   */
  private async processRecentActivities(vendorId: string): Promise<void> {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30000);

    const dateRange: DateRange = {
      start: thirtySecondsAgo,
      end: now
    };

    try {
      const summary = await this.processVendorActivities(vendorId, dateRange);
      await this.saveAnalyticsSummary(summary);
    } catch (error) {
      console.error(`Failed to process activities for vendor ${vendorId}:`, error);
      // Activities will be processed in next batch
    }
  }

  /**
   * Saves analytics summary to Firestore
   */
  private async saveAnalyticsSummary(summary: VendorAnalyticsSummary): Promise<void> {
    const batch = writeBatch(this.db);

    // Save vendor-level analytics
    const vendorDocRef = doc(
      this.db, "staging_vendor_analytics",
      `${summary.vendorId}_${this.formatDate(new Date())}`
    );

    batch.set(vendorDocRef, {
      vendorId: summary.vendorId,
      date: Timestamp.fromDate(new Date()),
      totalViews: summary.totalViews,
      totalAddToCarts: summary.totalAddToCarts,
      totalPurchases: summary.totalPurchases,
      totalRevenue: summary.totalRevenue,
      conversionRate: summary.conversionRate,
      updatedAt: Timestamp.fromDate(summary.updatedAt)
    }, { merge: true });

    // Save product-level analytics
    for (const [productId, analytics] of summary.products.entries()) {
      const productDocRef = doc(
        this.db, "staging_product_analytics",
        `${productId}_${this.formatDate(new Date())}`
      );

      batch.set(productDocRef, {
        productId: analytics.productId,
        vendorId: analytics.vendorId,
        date: Timestamp.fromDate(new Date()),
        views: analytics.views,
        uniqueViews: analytics.uniqueViews,
        addToCartCount: analytics.addToCartCount,
        purchaseCount: analytics.purchaseCount,
        conversionRate: analytics.conversionRate,
        addToCartRate: analytics.addToCartRate,
        cartConversionRate: analytics.cartConversionRate,
        totalRevenue: analytics.totalRevenue,
        averageOrderValue: analytics.averageOrderValue,
        updatedAt: Timestamp.fromDate(analytics.updatedAt)
      }, { merge: true });
    }

    await batch.commit();
  }

  /**
   * Fetches activities for a vendor within a date range
   * Added fallback mechanism for when indexes are building
   */
  private async fetchActivities(
    vendorId: string,
    dateRange: DateRange
  ): Promise<ShopActivity[]> {
    try {
      const activitiesRef = collection(this.db, "staging_shop_activities");
      const q = query(
        activitiesRef,
        where('vendorId', '==', vendorId),
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end)),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ShopActivity));
    } catch (error: any) {
      // Check if error is due to missing index
      if (error?.message?.includes('index') || error?.code === 'failed-precondition') {
        console.warn('Firestore index still building, using fallback method for vendor analytics');
        return this.fetchActivitiesFallback(vendorId, dateRange);
      }
      throw error;
    }
  }

  /**
   * Fallback method to fetch activities when indexes are building
   * Uses simpler queries that don't require compound indexes
   */
  private async fetchActivitiesFallback(
    vendorId: string,
    dateRange: DateRange
  ): Promise<ShopActivity[]> {
    try {
      // Use a simpler query without compound index requirement
      const activitiesRef = collection(this.db, "staging_shop_activities");
      const q = query(
        activitiesRef,
        where('vendorId', '==', vendorId),
        limit(1000) // Limit to prevent large reads
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ShopActivity));

      // Filter by date range in memory since we can't use compound query
      return activities.filter(activity => {
        const activityDate = activity.timestamp instanceof Timestamp 
          ? activity.timestamp.toDate() 
          : new Date(activity.timestamp);
        return activityDate >= dateRange.start && activityDate <= dateRange.end;
      });
    } catch (error) {
      console.warn('Fallback query also failed, returning empty activities array:', error);
      return [];
    }
  }

  /**
   * Fetches activities for a specific product
   * Added fallback mechanism for when indexes are building
   */
  private async fetchProductActivities(
    productId: string,
    activityType?: string,
    dateRange?: DateRange
  ): Promise<ShopActivity[]> {
    try {
      const activitiesRef = collection(this.db, "staging_shop_activities");
      let q = query(
        activitiesRef,
        where('productId', '==', productId)
      );

      if (activityType) {
        q = query(q, where('type', '==', activityType));
      }

      if (dateRange) {
        q = query(
          q,
          where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
          where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
        );
      }

      q = query(q, orderBy('timestamp', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ShopActivity));
    } catch (error: any) {
      // Check if error is due to missing index
      if (error?.message?.includes('index') || error?.code === 'failed-precondition') {
        console.warn('Firestore index still building, using fallback method for product activities');
        return this.fetchProductActivitiesFallback(productId, activityType, dateRange);
      }
      throw error;
    }
  }

  /**
   * Fallback method to fetch product activities when indexes are building
   */
  private async fetchProductActivitiesFallback(
    productId: string,
    activityType?: string,
    dateRange?: DateRange
  ): Promise<ShopActivity[]> {
    try {
      // Use simpler query without compound index requirement
      const activitiesRef = collection(this.db, "staging_shop_activities");
      const q = query(
        activitiesRef,
        where('productId', '==', productId),
        limit(500) // Limit to prevent large reads
      );

      const snapshot = await getDocs(q);
      let activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ShopActivity));

      // Filter by activity type if specified
      if (activityType) {
        activities = activities.filter(activity => activity.type === activityType);
      }

      // Filter by date range if specified
      if (dateRange) {
        activities = activities.filter(activity => {
          const activityDate = activity.timestamp instanceof Timestamp 
            ? activity.timestamp.toDate() 
            : new Date(activity.timestamp);
          return activityDate >= dateRange.start && activityDate <= dateRange.end;
        });
      }

      return activities;
    } catch (error) {
      console.warn('Fallback product query also failed, returning empty activities array:', error);
      return [];
    }
  }

  /**
   * Groups activities by product ID
   */
  private groupActivitiesByProduct(
    activities: ShopActivity[]
  ): Map<string, ShopActivity[]> {
    const grouped = new Map<string, ShopActivity[]>();

    for (const activity of activities) {
      if (!activity.productId) continue;

      if (!grouped.has(activity.productId)) {
        grouped.set(activity.productId, []);
      }

      grouped.get(activity.productId)!.push(activity);
    }

    return grouped;
  }

  /**
   * Formats date as YYYYMMDD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Gets analytics summary for a product
   * Validates: Requirements 22.2, 22.3
   */
  async getProductAnalyticsSummary(
    productId: string,
    dateRange: DateRange
  ): Promise<ActivitySummary | null> {
    const activities = await this.fetchProductActivities(productId, undefined, dateRange);
    
    if (activities.length === 0) {
      return null;
    }

    const vendorId = activities[0].vendorId;
    const analytics = this.calculateProductAnalytics(productId, vendorId, activities, dateRange);

    return {
      vendorId,
      productId,
      dateRange,
      totalViews: analytics.views,
      uniqueViews: analytics.uniqueViews,
      addToCartCount: analytics.addToCartCount,
      removeFromCartCount: analytics.removeFromCartCount,
      addToCartRate: analytics.addToCartRate,
      purchaseCount: analytics.purchaseCount,
      conversionRate: analytics.conversionRate,
      cartConversionRate: analytics.cartConversionRate,
      totalRevenue: analytics.totalRevenue,
      averageOrderValue: analytics.averageOrderValue
    };
  }

  /**
   * Handles concurrent activity processing
   * Validates: Requirements 22.7
   */
  async processConcurrentActivities(
    vendorIds: string[],
    dateRange: DateRange
  ): Promise<Map<string, VendorAnalyticsSummary>> {
    const results = new Map<string, VendorAnalyticsSummary>();

    // Process all vendors in parallel
    const promises = vendorIds.map(async (vendorId) => {
      try {
        const summary = await this.processVendorActivities(vendorId, dateRange);
        return { vendorId, summary };
      } catch (error) {
        console.error(`Failed to process vendor ${vendorId}:`, error);
        return null;
      }
    });

    const settled = await Promise.allSettled(promises);

    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value) {
        results.set(result.value.vendorId, result.value.summary);
      }
    }

    return results;
  }
}

// Export singleton instance
export const analyticsProcessor = new AnalyticsProcessor();
