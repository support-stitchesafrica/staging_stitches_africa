/**
 * Storefront Analytics Service
 * Handles analytics data collection and processing for merchant storefronts
 */

import { adminDb } from '@/lib/firebase-admin';
import type { AnalyticsEvent } from '@/types/storefront';

export interface StorefrontAnalyticsData {
  pageViews: number;
  productViews: number;
  cartAdds: number;
  uniqueVisitors: number;
  conversionRate: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    views: number;
    cartAdds: number;
    conversionRate: number;
  }>;
  dailyStats: Array<{
    date: string;
    pageViews: number;
    productViews: number;
    cartAdds: number;
  }>;
  sessionData: {
    averageSessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
  };
}

export interface DateRange {
  start: Date;
  end: Date;
}

export class StorefrontAnalyticsService {
  /**
   * Track an analytics event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      await adminDb.collection('storefront_analytics').add({
        ...event,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      // Don't throw error to avoid breaking user experience
    }
  }

  /**
   * Get analytics data for a storefront
   */
  async getAnalytics(
    storefrontId: string,
    dateRange: DateRange
  ): Promise<StorefrontAnalyticsData> {
    try {
      const events = await this.getEvents(storefrontId, dateRange);
      
      return this.processAnalyticsData(events, dateRange);
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Get analytics events for a storefront within date range
   */
  private async getEvents(
    storefrontId: string,
    dateRange: DateRange
  ): Promise<AnalyticsEvent[]> {
    const snapshot = await adminDb
      .collection('storefront_analytics')
      .where('storefrontId', '==', storefrontId)
      .where('timestamp', '>=', dateRange.start)
      .where('timestamp', '<=', dateRange.end)
      .orderBy('timestamp', 'desc')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Handle both Firestore Timestamp and Date objects safely
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
      };
    }) as AnalyticsEvent[];
  }

  /**
   * Process raw events into analytics data
   */
  private processAnalyticsData(
    events: AnalyticsEvent[],
    dateRange: DateRange
  ): StorefrontAnalyticsData {
    const pageViews = events.filter(e => e.eventType === 'page_view').length;
    const productViews = events.filter(e => e.eventType === 'product_view').length;
    const cartAdds = events.filter(e => e.eventType === 'add_to_cart').length;
    
    // Calculate unique visitors
    const uniqueVisitors = new Set(
      events.map(e => e.sessionId)
    ).size;

    // Calculate conversion rate (cart adds / product views)
    const conversionRate = productViews > 0 ? (cartAdds / productViews) * 100 : 0;

    // Calculate top products
    const topProducts = this.calculateTopProducts(events);

    // Calculate daily stats
    const dailyStats = this.calculateDailyStats(events, dateRange);

    // Calculate session data
    const sessionData = this.calculateSessionData(events);

    return {
      pageViews,
      productViews,
      cartAdds,
      uniqueVisitors,
      conversionRate: Math.round(conversionRate * 100) / 100,
      topProducts,
      dailyStats,
      sessionData
    };
  }

  /**
   * Calculate top performing products
   */
  private calculateTopProducts(events: AnalyticsEvent[]) {
    const productStats = new Map<string, {
      productName: string;
      views: number;
      cartAdds: number;
    }>();

    events.forEach(event => {
      if (event.eventType === 'product_view' && event.productId) {
        const productId = event.productId;
        const productName = event.metadata?.productName || 'Unknown Product';
        
        if (!productStats.has(productId)) {
          productStats.set(productId, {
            productName,
            views: 0,
            cartAdds: 0
          });
        }
        
        productStats.get(productId)!.views++;
      }
      
      if (event.eventType === 'add_to_cart' && event.productId) {
        const productId = event.productId;
        const productName = event.metadata?.productName || 'Unknown Product';
        
        if (!productStats.has(productId)) {
          productStats.set(productId, {
            productName,
            views: 0,
            cartAdds: 0
          });
        }
        
        productStats.get(productId)!.cartAdds++;
      }
    });

    return Array.from(productStats.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.productName,
        views: stats.views,
        cartAdds: stats.cartAdds,
        conversionRate: stats.views > 0 ? (stats.cartAdds / stats.views) * 100 : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  /**
   * Calculate daily statistics
   */
  private calculateDailyStats(events: AnalyticsEvent[], dateRange: DateRange) {
    const dailyMap = new Map<string, {
      pageViews: number;
      productViews: number;
      cartAdds: number;
    }>();

    // Initialize all days in range
    const currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyMap.set(dateKey, {
        pageViews: 0,
        productViews: 0,
        cartAdds: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process events
    events.forEach(event => {
      const dateKey = event.timestamp.toISOString().split('T')[0];
      const stats = dailyMap.get(dateKey);
      
      if (stats) {
        switch (event.eventType) {
          case 'page_view':
            stats.pageViews++;
            break;
          case 'product_view':
            stats.productViews++;
            break;
          case 'add_to_cart':
            stats.cartAdds++;
            break;
        }
      }
    });

    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        ...stats
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate session-based metrics
   */
  private calculateSessionData(events: AnalyticsEvent[]) {
    const sessions = new Map<string, {
      startTime: Date;
      endTime: Date;
      pageViews: number;
    }>();

    // Group events by session
    events.forEach(event => {
      const sessionId = event.sessionId;
      
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          startTime: event.timestamp,
          endTime: event.timestamp,
          pageViews: 0
        });
      }
      
      const session = sessions.get(sessionId)!;
      
      if (event.timestamp < session.startTime) {
        session.startTime = event.timestamp;
      }
      if (event.timestamp > session.endTime) {
        session.endTime = event.timestamp;
      }
      
      if (event.eventType === 'page_view') {
        session.pageViews++;
      }
    });

    // Calculate metrics
    const sessionArray = Array.from(sessions.values());
    
    if (sessionArray.length === 0) {
      return {
        averageSessionDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0
      };
    }

    const totalDuration = sessionArray.reduce((sum, session) => {
      return sum + (session.endTime.getTime() - session.startTime.getTime());
    }, 0);

    const averageSessionDuration = totalDuration / sessionArray.length / 1000; // Convert to seconds

    const bouncedSessions = sessionArray.filter(session => session.pageViews <= 1).length;
    const bounceRate = (bouncedSessions / sessionArray.length) * 100;

    const totalPageViews = sessionArray.reduce((sum, session) => sum + session.pageViews, 0);
    const pagesPerSession = totalPageViews / sessionArray.length;

    return {
      averageSessionDuration: Math.round(averageSessionDuration),
      bounceRate: Math.round(bounceRate * 100) / 100,
      pagesPerSession: Math.round(pagesPerSession * 100) / 100
    };
  }

  /**
   * Get empty analytics data structure
   */
  private getEmptyAnalytics(): StorefrontAnalyticsData {
    return {
      pageViews: 0,
      productViews: 0,
      cartAdds: 0,
      uniqueVisitors: 0,
      conversionRate: 0,
      topProducts: [],
      dailyStats: [],
      sessionData: {
        averageSessionDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0
      }
    };
  }

  /**
   * Export analytics data as CSV
   */
  async exportAnalytics(
    storefrontId: string,
    dateRange: DateRange,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    const analytics = await this.getAnalytics(storefrontId, dateRange);
    
    if (format === 'json') {
      return JSON.stringify(analytics, null, 2);
    }

    // Generate CSV
    const csvRows = [
      'Date,Page Views,Product Views,Cart Adds',
      ...analytics.dailyStats.map(stat => 
        `${stat.date},${stat.pageViews},${stat.productViews},${stat.cartAdds}`
      )
    ];

    return csvRows.join('\n');
  }

  /**
   * Get analytics for multiple storefronts (for vendor with multiple stores)
   */
  async getMultiStorefrontAnalytics(
    storefrontIds: string[],
    dateRange: DateRange
  ): Promise<Record<string, StorefrontAnalyticsData>> {
    const results: Record<string, StorefrontAnalyticsData> = {};
    
    await Promise.all(
      storefrontIds.map(async (storefrontId) => {
        results[storefrontId] = await this.getAnalytics(storefrontId, dateRange);
      })
    );
    
    return results;
  }
}

// Export singleton instance
export const storefrontAnalyticsService = new StorefrontAnalyticsService();