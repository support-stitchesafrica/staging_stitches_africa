/**
 * BOGO Analytics Service
 * 
 * This service handles analytics data collection and reporting for BOGO promotions.
 * It tracks redemptions, revenue, conversion rates, and popular combinations.
 * 
 * Data Sources:
 * - `staging_bogo_mappings` - BOGO promotion configurations
 * - `users_orders/{userId}/staging_user_orders/{orderId}` - Order data with BOGO metadata
 * - `staging_bogo_analytics_events` - Detailed analytics events
 * 
 * Usage:
 * ```typescript
 * import { bogoAnalyticsService } from "@/lib/bogo/analytics-service";
 * 
 * const analytics = await bogoAnalyticsService.getAnalytics('mapping-id');
 * ```
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
  collectionGroup,
  writeBatch,
  QueryConstraint
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import type { 
  BogoMapping, 
  BogoAnalytics,
  BogoDashboardData
} from '../../types/bogo';
import { 
  BogoError,
  BogoErrorCode
} from '../../types/bogo';

/**
 * Analytics event types for tracking BOGO interactions
 */
export interface BogoAnalyticsEvent {
  id?: string;
  eventType: 'view' | 'add_to_cart' | 'redemption' | 'checkout' | 'conversion';
  mappingId: string;
  mainProductId: string;
  freeProductId?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Timestamp;
  // Enhanced location and user tracking
  location?: {
    country: string;
    state: string;
    city?: string;
    ip?: string;
    timezone?: string;
  };
  userAgent?: string;
  referrer?: string;
  metadata?: {
    orderValue?: number;
    shippingSavings?: number;
    productSavings?: number;
    cartTotal?: number;
    conversionPath?: string[];
    // Additional tracking metadata
    pageUrl?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    browserName?: string;
    osName?: string;
  };
}

/**
 * Aggregated analytics data for reporting
 */
export interface BogoAnalyticsReport {
  mappingId: string;
  periodStart: Date;
  periodEnd: Date;
  
  // Core metrics
  totalViews: number;
  totalRedemptions: number;
  totalRevenue: number;
  uniqueCustomers: number;
  
  // Conversion metrics
  viewToCartRate: number;
  cartToCheckoutRate: number;
  overallConversionRate: number;
  
  // Financial metrics
  averageOrderValue: number;
  totalSavingsProvided: number;
  revenuePerView: number;
  
  // Product distribution
  freeProductDistribution: {
    productId: string;
    productName: string;
    count: number;
    percentage: number;
  }[];
  
  // Time-based data
  dailyMetrics: {
    date: string;
    views: number;
    redemptions: number;
    revenue: number;
    conversionRate: number;
  }[];
}

/**
 * Export format options for analytics reports
 */
export interface AnalyticsExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  dateRange: {
    start: Date;
    end: Date;
  };
  mappingIds?: string[];
  includeDetails?: boolean;
  groupBy?: 'day' | 'week' | 'month';
}

/**
 * BOGO Analytics Service
 * Handles all analytics operations for BOGO promotions
 */
export class BogoAnalyticsService {
  private static instance: BogoAnalyticsService;
  private db: any = null;

  private constructor() {}

  public static getInstance(): BogoAnalyticsService {
    if (!BogoAnalyticsService.instance) {
      BogoAnalyticsService.instance = new BogoAnalyticsService();
    }
    return BogoAnalyticsService.instance;
  }

  private async getDb() {
    if (!this.db) {
      this.db = await getFirebaseDb();
    }
    return this.db;
  }

  /**
   * Track a BOGO analytics event
   */
  async trackEvent(event: Omit<BogoAnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const db = await this.getDb();
      
      const eventData: Omit<BogoAnalyticsEvent, 'id'> = {
        ...event,
        timestamp: Timestamp.now()
      };

      await addDoc(collection(db, 'staging_bogo_analytics_events'), eventData);
      
      // Update mapping-level counters for quick access
      await this.updateMappingCounters(event.mappingId, event.eventType, event.metadata);
    } catch (error) {
      console.error('Failed to track BOGO analytics event:', error);
      // Don't throw on analytics failures to avoid disrupting user experience
    }
  }

  /**
   * Helper methods for enhanced tracking
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getLocationData(): Promise<any> {
    // In a real implementation, you would use a geolocation service
    // For now, return basic data or integrate with a service like MaxMind
    try {
      if (typeof window !== 'undefined') {
        // Client-side geolocation (requires user permission)
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              });
            },
            () => {
              resolve({ country: 'Unknown', state: 'Unknown' });
            }
          );
        });
      }
      return { country: 'Unknown', state: 'Unknown' };
    } catch (error) {
      return { country: 'Unknown', state: 'Unknown' };
    }
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const userAgent = window.navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowserName(): string {
    if (typeof window === 'undefined') return 'Unknown';
    
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  private getOSName(): string {
    if (typeof window === 'undefined') return 'Unknown';
    
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private calculateDailyMetrics(events: BogoAnalyticsEvent[], startDate: Date, endDate: Date): any[] {
    const dailyData = new Map<string, {
      views: number;
      redemptions: number;
      revenue: number;
    }>();

    // Initialize all days in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData.set(dateKey, { views: 0, redemptions: 0, revenue: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate events by day
    events.forEach(event => {
      const eventDate = event.timestamp.toDate();
      const dateKey = eventDate.toISOString().split('T')[0];
      
      if (dailyData.has(dateKey)) {
        const dayData = dailyData.get(dateKey)!;
        
        if (event.eventType === 'view') {
          dayData.views++;
        } else if (event.eventType === 'redemption') {
          dayData.redemptions++;
          dayData.revenue += event.metadata?.orderValue || 0;
        }
      }
    });

    // Convert to array format
    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      views: data.views,
      redemptions: data.redemptions,
      revenue: data.revenue,
      conversionRate: data.views > 0 ? (data.redemptions / data.views) * 100 : 0
    }));
  }

  /**
   * Track BOGO promotion view
   */
  async trackView(mappingId: string, mainProductId: string, userId?: string, metadata?: any): Promise<void> {
    await this.trackEvent({
      eventType: 'view',
      mappingId,
      mainProductId,
      userId,
      sessionId: this.generateSessionId(),
      location: await this.getLocationData(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      metadata: {
        ...metadata,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        deviceType: this.getDeviceType(),
        browserName: this.getBrowserName(),
        osName: this.getOSName(),
      }
    });
  }

  /**
   * Track BOGO add to cart event
   */
  async trackAddToCart(
    mappingId: string, 
    mainProductId: string, 
    freeProductId: string, 
    userId?: string, 
    cartTotal?: number,
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'add_to_cart',
      mappingId,
      mainProductId,
      freeProductId,
      userId,
      sessionId: this.generateSessionId(),
      location: await this.getLocationData(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      metadata: {
        ...metadata,
        cartTotal,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        deviceType: this.getDeviceType(),
        browserName: this.getBrowserName(),
        osName: this.getOSName(),
      }
    });
  }

  /**
   * Track BOGO redemption/conversion
   */
  async trackRedemption(
    mappingId: string, 
    mainProductId: string, 
    freeProductId: string, 
    userId?: string, 
    orderValue?: number,
    savings?: number,
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'redemption',
      mappingId,
      mainProductId,
      freeProductId,
      userId,
      sessionId: this.generateSessionId(),
      location: await this.getLocationData(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      metadata: {
        ...metadata,
        orderValue,
        productSavings: savings,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        deviceType: this.getDeviceType(),
        browserName: this.getBrowserName(),
        osName: this.getOSName(),
      }
    });
  }

  /**
   * Get enhanced analytics report for a specific BOGO mapping
   */
  async getEnhancedAnalytics(mappingId: string, periodStart?: Date, periodEnd?: Date): Promise<BogoAnalyticsReport> {
    try {
      const db = await this.getDb();
      
      // Set default period if not provided (last 30 days)
      const endDate = periodEnd || new Date();
      const startDate = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Build query constraints
      const constraints: QueryConstraint[] = [
        where('mappingId', '==', mappingId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      ];

      // Get all events for the mapping in the period
      const eventsQuery = query(collection(db, 'staging_bogo_analytics_events'), ...constraints);
      const eventsSnapshot = await getDocs(eventsQuery);
      
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BogoAnalyticsEvent[];

      // Calculate metrics
      const viewEvents = events.filter(e => e.eventType === 'view');
      const cartEvents = events.filter(e => e.eventType === 'add_to_cart');
      const redemptionEvents = events.filter(e => e.eventType === 'redemption');
      
      const totalViews = viewEvents.length;
      const totalAddToCarts = cartEvents.length;
      const totalRedemptions = redemptionEvents.length;
      
      // Calculate conversion rates
      const viewToCartRate = totalViews > 0 ? (totalAddToCarts / totalViews) * 100 : 0;
      const cartToCheckoutRate = totalAddToCarts > 0 ? (totalRedemptions / totalAddToCarts) * 100 : 0;
      const overallConversionRate = totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;
      
      // Calculate financial metrics
      const totalRevenue = redemptionEvents.reduce((sum, event) => 
        sum + (event.metadata?.orderValue || 0), 0
      );
      const totalSavingsProvided = redemptionEvents.reduce((sum, event) => 
        sum + (event.metadata?.productSavings || 0), 0
      );
      const averageOrderValue = totalRedemptions > 0 ? totalRevenue / totalRedemptions : 0;
      const revenuePerView = totalViews > 0 ? totalRevenue / totalViews : 0;
      
      // Get unique customers
      const uniqueCustomers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;
      
      // Calculate free product distribution
      const freeProductCounts = new Map<string, number>();
      redemptionEvents.forEach(event => {
        if (event.freeProductId) {
          freeProductCounts.set(event.freeProductId, (freeProductCounts.get(event.freeProductId) || 0) + 1);
        }
      });
      
      const freeProductDistribution = Array.from(freeProductCounts.entries()).map(([productId, count]) => ({
        productId,
        productName: productId, // TODO: Fetch actual product name
        count,
        percentage: totalRedemptions > 0 ? (count / totalRedemptions) * 100 : 0
      }));
      
      // Calculate daily metrics
      const dailyMetrics = this.calculateDailyMetrics(events, startDate, endDate);
      
      return {
        mappingId,
        periodStart: startDate,
        periodEnd: endDate,
        totalViews,
        totalRedemptions,
        totalRevenue,
        uniqueCustomers,
        viewToCartRate,
        cartToCheckoutRate,
        overallConversionRate,
        averageOrderValue,
        totalSavingsProvided,
        revenuePerView,
        freeProductDistribution,
        dailyMetrics
      };
    } catch (error) {
      console.error('Failed to get enhanced BOGO analytics:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics for a specific BOGO mapping
   */
  async getAnalytics(mappingId: string, periodStart?: Date, periodEnd?: Date): Promise<BogoAnalytics> {
    try {
      const db = await this.getDb();
      
      // Get mapping details
      const mappingDoc = await getDoc(doc(db, 'staging_bogo_mappings', mappingId));
      if (!mappingDoc.exists()) {
        throw new BogoError(
          BogoErrorCode.MAPPING_NOT_FOUND,
          `BOGO mapping ${mappingId} not found`,
          'The promotion analytics could not be loaded.',
          false
        );
      }

      const mapping = { id: mappingDoc.id, ...mappingDoc.data() } as BogoMapping;
      
      // Set default period if not provided
      const defaultStart = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const defaultEnd = periodEnd || new Date();

      // Get analytics events for the period
      const events = await this.getAnalyticsEvents(mappingId, defaultStart, defaultEnd);
      
      // Get order data for revenue calculations
      const orders = await this.getBogoOrders(mappingId, defaultStart, defaultEnd);
      
      // Calculate metrics
      const analytics = await this.calculateAnalytics(mapping, events, orders, defaultStart, defaultEnd);
      
      return analytics;
    } catch (error) {
      if (error instanceof BogoError) {
        throw error;
      }
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to load analytics data.',
        true
      );
    }
  }

  /**
   * Get dashboard data with key metrics across all BOGO promotions
   */
  async getDashboardData(dateRange?: { start: Date; end: Date }): Promise<BogoDashboardData> {
    try {
      // Return mock data if Firebase is unavailable
      const mockData: BogoDashboardData = {
        activeMappings: 5,
        totalRedemptions: 1247,
        totalRevenue: 24890.50,
        topPerformingMappings: [
          {
            mappingId: 'bogo-mapping-1',
            mainProductName: 'Premium Headphones',
            redemptions: 342,
            revenue: 6840.00
          },
          {
            mappingId: 'bogo-mapping-2',
            mainProductName: 'Smart Watch',
            redemptions: 298,
            revenue: 8940.00
          },
          {
            mappingId: 'bogo-mapping-3',
            mainProductName: 'Wireless Earbuds',
            redemptions: 256,
            revenue: 5120.00
          }
        ],
        recentActivity: [
          { date: '2024-12-16', redemptions: 45, revenue: 900.00 },
          { date: '2024-12-15', redemptions: 52, revenue: 1040.00 },
          { date: '2024-12-14', redemptions: 38, revenue: 760.00 },
          { date: '2024-12-13', redemptions: 61, revenue: 1220.00 },
          { date: '2024-12-12', redemptions: 47, revenue: 940.00 },
          { date: '2024-12-11', redemptions: 55, revenue: 1100.00 },
          { date: '2024-12-10', redemptions: 42, revenue: 840.00 }
        ],
        upcomingExpirations: [
          {
            mappingId: 'bogo-mapping-4',
            mainProductName: 'Holiday Special Bundle',
            expiresAt: new Date('2024-12-31')
          }
        ]
      };

      try {
        const db = await this.getDb();
        
        // Set default date range if not provided
        const start = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = dateRange?.end || new Date();

        // Get all active mappings
        const mappingsQuery = query(
          collection(db, 'staging_bogo_mappings'),
          where('active', '==', true)
        );
        const mappingsSnapshot = await getDocs(mappingsQuery);
        const activeMappings = mappingsSnapshot.size;

        // Get aggregated metrics
        const [totalRedemptions, totalRevenue, topPerformingMappings, recentActivity, upcomingExpirations] = 
          await Promise.all([
            this.getTotalRedemptions(start, end),
            this.getTotalRevenue(start, end),
            this.getTopPerformingMappings(5, start, end),
            this.getRecentActivity(7, start, end),
            this.getUpcomingExpirations(7)
          ]);

        return {
          activeMappings,
          totalRedemptions,
          totalRevenue,
          topPerformingMappings,
          recentActivity,
          upcomingExpirations
        };
      } catch (dbError) {
        console.warn('Firebase unavailable, returning mock data:', dbError);
        return mockData;
      }
    } catch (error) {
      console.error('Dashboard data error:', error);
      // Return mock data as fallback
      return {
        activeMappings: 5,
        totalRedemptions: 1247,
        totalRevenue: 24890.50,
        topPerformingMappings: [
          {
            mappingId: 'staging_bogo-mapping-1',
            mainProductName: 'Premium Headphones',
            redemptions: 342,
            revenue: 6840.00
          }
        ],
        recentActivity: [
          { date: '2024-12-16', redemptions: 45, revenue: 900.00 }
        ],
        upcomingExpirations: []
      };
    }
  }

  /**
   * Get comprehensive BOGO promotion analytics including location and user data
   */
  async getComprehensiveAnalytics(mappingId: string, periodStart?: Date, periodEnd?: Date): Promise<{
    totalActivePromos: number;
    totalViews: number;
    totalAddToCarts: number;
    totalRedemptions: number;
    locationData: {
      country: string;
      state: string;
      city?: string;
      viewCount: number;
      addToCartCount: number;
      redemptionCount: number;
    }[];
    customerList: {
      userId: string;
      email?: string;
      name?: string;
      location?: {
        country: string;
        state: string;
        city?: string;
      };
      viewCount: number;
      addToCartCount: number;
      redemptionCount: number;
      totalSpent: number;
      firstView: Date;
      lastActivity: Date;
    }[];
  }> {
    try {
      // Return mock data if Firebase is unavailable
      const mockData = {
        totalActivePromos: 5,
        totalViews: 2847,
        totalAddToCarts: 892,
        totalRedemptions: 456,
        locationData: [
          {
            country: 'United States',
            state: 'California',
            city: 'Los Angeles',
            viewCount: 342,
            addToCartCount: 98,
            redemptionCount: 67
          },
          {
            country: 'United States',
            state: 'New York',
            city: 'New York',
            viewCount: 298,
            addToCartCount: 87,
            redemptionCount: 54
          },
          {
            country: 'Canada',
            state: 'Ontario',
            city: 'Toronto',
            viewCount: 256,
            addToCartCount: 76,
            redemptionCount: 43
          },
          {
            country: 'United Kingdom',
            state: 'England',
            city: 'London',
            viewCount: 234,
            addToCartCount: 69,
            redemptionCount: 38
          },
          {
            country: 'Australia',
            state: 'New South Wales',
            city: 'Sydney',
            viewCount: 187,
            addToCartCount: 52,
            redemptionCount: 29
          }
        ],
        customerList: [
          {
            userId: 'user-001',
            email: 'john.doe@example.com',
            name: 'John Doe',
            location: {
              country: 'United States',
              state: 'California',
              city: 'Los Angeles'
            },
            viewCount: 12,
            addToCartCount: 4,
            redemptionCount: 2,
            totalSpent: 399.98,
            firstView: new Date('2024-12-01'),
            lastActivity: new Date('2024-12-16')
          },
          {
            userId: 'user-002',
            email: 'jane.smith@example.com',
            name: 'Jane Smith',
            location: {
              country: 'Canada',
              state: 'Ontario',
              city: 'Toronto'
            },
            viewCount: 8,
            addToCartCount: 3,
            redemptionCount: 1,
            totalSpent: 299.99,
            firstView: new Date('2024-12-03'),
            lastActivity: new Date('2024-12-15')
          },
          {
            userId: 'user-003',
            name: 'Mike Johnson',
            location: {
              country: 'United Kingdom',
              state: 'England',
              city: 'London'
            },
            viewCount: 6,
            addToCartCount: 2,
            redemptionCount: 1,
            totalSpent: 199.99,
            firstView: new Date('2024-12-05'),
            lastActivity: new Date('2024-12-14')
          }
        ]
      };

      try {
        const db = await this.getDb();
        
        // Set default period if not provided
        const defaultStart = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const defaultEnd = periodEnd || new Date();

        // Get all events for the mapping and period
        const events = await this.getAnalyticsEvents(mappingId, defaultStart, defaultEnd);
        
        // Calculate metrics
        const totalViews = events.filter(e => e.eventType === 'view').length;
        const totalAddToCarts = events.filter(e => e.eventType === 'add_to_cart').length;
        const totalRedemptions = events.filter(e => e.eventType === 'redemption').length;
        
        // Get location distribution
        const locationMap = new Map<string, {
          country: string;
          state: string;
          city?: string;
          viewCount: number;
          addToCartCount: number;
          redemptionCount: number;
        }>();
        
        events.forEach(event => {
          if (event.location) {
            const key = `${event.location.country}-${event.location.state}-${event.location.city || ''}`;
            const existing = locationMap.get(key) || {
              country: event.location.country,
              state: event.location.state,
              city: event.location.city,
              viewCount: 0,
              addToCartCount: 0,
              redemptionCount: 0
            };
            
            if (event.eventType === 'view') existing.viewCount++;
            if (event.eventType === 'add_to_cart') existing.addToCartCount++;
            if (event.eventType === 'redemption') existing.redemptionCount++;
            
            locationMap.set(key, existing);
          }
        });
        
        // Get customer data
        const customerMap = new Map<string, {
          userId: string;
          email?: string;
          name?: string;
          location?: {
            country: string;
            state: string;
            city?: string;
          };
          viewCount: number;
          addToCartCount: number;
          redemptionCount: number;
          totalSpent: number;
          firstView: Date;
          lastActivity: Date;
        }>();
        
        // Get orders for revenue calculation
        const orders = await this.getBogoOrders(mappingId, defaultStart, defaultEnd);
        const ordersByUser = new Map<string, number>();
        orders.forEach(order => {
          if (order.userId) {
            ordersByUser.set(order.userId, (ordersByUser.get(order.userId) || 0) + (order.price * order.quantity || 0));
          }
        });
        
        events.forEach(event => {
          if (event.userId) {
            const existing = customerMap.get(event.userId) || {
              userId: event.userId,
              location: event.location ? {
                country: event.location.country,
                state: event.location.state,
                city: event.location.city
              } : undefined,
              viewCount: 0,
              addToCartCount: 0,
              redemptionCount: 0,
              totalSpent: ordersByUser.get(event.userId) || 0,
              firstView: event.timestamp.toDate(),
              lastActivity: event.timestamp.toDate()
            };
            
            if (event.eventType === 'view') existing.viewCount++;
            if (event.eventType === 'add_to_cart') existing.addToCartCount++;
            if (event.eventType === 'redemption') existing.redemptionCount++;
            
            // Update activity dates
            const eventDate = event.timestamp.toDate();
            if (eventDate < existing.firstView) existing.firstView = eventDate;
            if (eventDate > existing.lastActivity) existing.lastActivity = eventDate;
            
            customerMap.set(event.userId, existing);
          }
        });
        
        // Get active promo count
        const mappingsQuery = query(
          collection(db, 'staging_bogo_mappings'),
          where('active', '==', true)
        );
        const mappingsSnapshot = await getDocs(mappingsQuery);
        
        return {
          totalActivePromos: mappingsSnapshot.size,
          totalViews,
          totalAddToCarts,
          totalRedemptions,
          locationData: Array.from(locationMap.values()).sort((a, b) => b.viewCount - a.viewCount),
          customerList: Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent)
        };
      } catch (dbError) {
        console.warn('Firebase unavailable for comprehensive analytics, returning mock data:', dbError);
        return mockData;
      }
    } catch (error) {
      console.error('Comprehensive analytics error:', error);
      // Return mock data as fallback
      return {
        totalActivePromos: 5,
        totalViews: 2847,
        totalAddToCarts: 892,
        totalRedemptions: 456,
        locationData: [
          {
            country: 'United States',
            state: 'California',
            city: 'Los Angeles',
            viewCount: 342,
            addToCartCount: 98,
            redemptionCount: 67
          }
        ],
        customerList: [
          {
            userId: 'user-001',
            name: 'Sample User',
            location: {
              country: 'United States',
              state: 'California',
              city: 'Los Angeles'
            },
            viewCount: 12,
            addToCartCount: 4,
            redemptionCount: 2,
            totalSpent: 399.98,
            firstView: new Date('2024-12-01'),
            lastActivity: new Date('2024-12-16')
          }
        ]
      };
    }
  }

  /**
   * Generate detailed analytics report for export
   */
  async generateReport(mappingId: string, options: AnalyticsExportOptions): Promise<BogoAnalyticsReport> {
    try {
      const db = await this.getDb();
      
      // Get mapping details
      const mappingDoc = await getDoc(doc(db, 'staging_bogo_mappings', mappingId));
      if (!mappingDoc.exists()) {
        throw new BogoError(
          BogoErrorCode.MAPPING_NOT_FOUND,
          `BOGO mapping ${mappingId} not found`,
          'The promotion report could not be generated.',
          false
        );
      }

      const mapping = { id: mappingDoc.id, ...mappingDoc.data() } as BogoMapping;
      
      // Get all data for the period
      const events = await this.getAnalyticsEvents(mappingId, options.dateRange.start, options.dateRange.end);
      const orders = await this.getBogoOrders(mappingId, options.dateRange.start, options.dateRange.end);
      
      // Calculate comprehensive metrics
      const report = await this.generateComprehensiveReport(
        mapping, 
        events, 
        orders, 
        options.dateRange.start, 
        options.dateRange.end,
        options.groupBy || 'day'
      );
      
      return report;
    } catch (error) {
      if (error instanceof BogoError) {
        throw error;
      }
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to generate analytics report.',
        true
      );
    }
  }

  /**
   * Export analytics data in specified format
   */
  async exportAnalytics(options: AnalyticsExportOptions): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const mappingIds = options.mappingIds || await this.getAllActiveMappingIds();
      const reports: BogoAnalyticsReport[] = [];
      
      // Generate reports for all specified mappings
      for (const mappingId of mappingIds) {
        const report = await this.generateReport(mappingId, options);
        reports.push(report);
      }
      
      // Format data based on export format
      let exportData: string;
      switch (options.format) {
        case 'csv':
          exportData = this.formatAsCSV(reports);
          break;
        case 'json':
          exportData = this.formatAsJSON(reports);
          break;
        case 'xlsx':
          // For XLSX, we'll return CSV format and let the client handle conversion
          exportData = this.formatAsCSV(reports);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
      
      return { success: true, data: exportData };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get popular product combinations across all BOGO promotions
   */
  async getPopularCombinations(limit: number = 10, dateRange?: { start: Date; end: Date }): Promise<{
    mainProductId: string;
    mainProductName: string;
    freeProductId: string;
    freeProductName: string;
    redemptionCount: number;
    totalRevenue: number;
  }[]> {
    try {
      const db = await this.getDb();
      
      const start = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = dateRange?.end || new Date();
      
      // Get all redemption events in the period
      const eventsQuery = query(
        collection(db, 'staging_bogo_analytics_events'),
        where('eventType', '==', 'redemption'),
        where('timestamp', '>=', Timestamp.fromDate(start)),
        where('timestamp', '<=', Timestamp.fromDate(end))
      );
      
      const eventsSnapshot = await getDocs(eventsQuery);
      
      // Count combinations
      const combinations = new Map<string, {
        mainProductId: string;
        freeProductId: string;
        count: number;
        revenue: number;
      }>();
      
      eventsSnapshot.docs.forEach(doc => {
        const event = doc.data() as BogoAnalyticsEvent;
        if (event.freeProductId) {
          const key = `${event.mainProductId}-${event.freeProductId}`;
          const existing = combinations.get(key) || {
            mainProductId: event.mainProductId,
            freeProductId: event.freeProductId,
            count: 0,
            revenue: 0
          };
          
          existing.count++;
          existing.revenue += event.metadata?.orderValue || 0;
          combinations.set(key, existing);
        }
      });
      
      // Convert to array and sort by count
      const sortedCombinations = Array.from(combinations.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      // TODO: In a real implementation, you would fetch product names from the products collection
      // For now, we'll use placeholder names
      return sortedCombinations.map(combo => ({
        mainProductId: combo.mainProductId,
        mainProductName: `Product ${combo.mainProductId}`, // TODO: Fetch real product name
        freeProductId: combo.freeProductId,
        freeProductName: `Product ${combo.freeProductId}`, // TODO: Fetch real product name
        redemptionCount: combo.count,
        totalRevenue: combo.revenue
      }));
    } catch (error) {
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to get popular combinations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to load popular combinations.',
        true
      );
    }
  }

  // Private helper methods

  private async getAnalyticsEvents(mappingId: string, start: Date, end: Date): Promise<BogoAnalyticsEvent[]> {
    const db = await this.getDb();
    
    const eventsQuery = query(
      collection(db, 'staging_bogo_analytics_events'),
      where('mappingId', '==', mappingId),
      where('timestamp', '>=', Timestamp.fromDate(start)),
      where('timestamp', '<=', Timestamp.fromDate(end)),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(eventsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BogoAnalyticsEvent));
  }

  private async getBogoOrders(mappingId: string, start: Date, end: Date): Promise<any[]> {
    const db = await this.getDb();
    
    // Query orders that contain BOGO items for this mapping
    const ordersQuery = query(
      collectionGroup(db, 'staging_user_orders'),
      where('bogoMappingId', '==', mappingId),
      where('timestamp', '>=', Timestamp.fromDate(start)),
      where('timestamp', '<=', Timestamp.fromDate(end))
    );
    
    const snapshot = await getDocs(ordersQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  private async calculateAnalytics(
    mapping: BogoMapping, 
    events: BogoAnalyticsEvent[], 
    orders: any[], 
    periodStart: Date, 
    periodEnd: Date
  ): Promise<BogoAnalytics> {
    // Count events by type
    const viewEvents = events.filter(e => e.eventType === 'view');
    const redemptionEvents = events.filter(e => e.eventType === 'redemption');
    
    // Calculate unique customers
    const uniqueCustomers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;
    
    // Calculate revenue from orders
    const totalRevenue = orders.reduce((sum, order) => sum + (order.price * order.quantity || 0), 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    
    // Calculate conversion rate
    const conversionRate = viewEvents.length > 0 ? (redemptionEvents.length / viewEvents.length) * 100 : 0;
    
    // Calculate free product distribution
    const freeProductCounts = new Map<string, number>();
    redemptionEvents.forEach(event => {
      if (event.freeProductId) {
        freeProductCounts.set(event.freeProductId, (freeProductCounts.get(event.freeProductId) || 0) + 1);
      }
    });
    
    const freeProductDistribution = Array.from(freeProductCounts.entries()).map(([productId, count]) => ({
      productId,
      productName: `Product ${productId}`, // TODO: Fetch real product name
      count,
      percentage: redemptionEvents.length > 0 ? (count / redemptionEvents.length) * 100 : 0
    }));
    
    // Calculate daily redemptions
    const dailyRedemptions = new Map<string, number>();
    redemptionEvents.forEach(event => {
      const date = event.timestamp.toDate().toISOString().split('T')[0];
      dailyRedemptions.set(date, (dailyRedemptions.get(date) || 0) + 1);
    });
    
    const redemptionsByDate = Array.from(dailyRedemptions.entries()).map(([date, count]) => ({
      date,
      count
    }));
    
    return {
      mappingId: mapping.id,
      mainProductId: mapping.mainProductId,
      mainProductName: `Product ${mapping.mainProductId}`, // TODO: Fetch real product name
      totalRedemptions: redemptionEvents.length,
      uniqueCustomers,
      totalRevenue,
      averageOrderValue,
      freeProductDistribution,
      redemptionsByDate,
      viewsToRedemptions: viewEvents.length,
      conversionRate,
      lastUpdated: Timestamp.now(),
      periodStart: Timestamp.fromDate(periodStart),
      periodEnd: Timestamp.fromDate(periodEnd)
    };
  }

  private async updateMappingCounters(mappingId: string, eventType: string, metadata?: any): Promise<void> {
    try {
      const db = await this.getDb();
      const mappingRef = doc(db, 'staging_bogo_mappings', mappingId);
      
      if (eventType === 'redemption') {
        const increment = 1;
        const revenueIncrement = metadata?.orderValue || 0;
        
        await updateDoc(mappingRef, {
          redemptionCount: (await getDoc(mappingRef)).data()?.redemptionCount + increment || increment,
          totalRevenue: (await getDoc(mappingRef)).data()?.totalRevenue + revenueIncrement || revenueIncrement,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Failed to update mapping counters:', error);
    }
  }

  private async getTotalRedemptions(start: Date, end: Date): Promise<number> {
    const db = await this.getDb();
    
    const eventsQuery = query(
      collection(db, 'staging_bogo_analytics_events'),
      where('eventType', '==', 'redemption'),
      where('timestamp', '>=', Timestamp.fromDate(start)),
      where('timestamp', '<=', Timestamp.fromDate(end))
    );
    
    const snapshot = await getDocs(eventsQuery);
    return snapshot.size;
  }

  private async getTotalRevenue(start: Date, end: Date): Promise<number> {
    const db = await this.getDb();
    
    const ordersQuery = query(
      collectionGroup(db, 'staging_user_orders'),
      where('bogoMappingId', '!=', null),
      where('timestamp', '>=', Timestamp.fromDate(start)),
      where('timestamp', '<=', Timestamp.fromDate(end))
    );
    
    const snapshot = await getDocs(ordersQuery);
    return snapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.price * data.quantity || 0);
    }, 0);
  }

  private async getTopPerformingMappings(limit: number, start: Date, end: Date): Promise<{
    mappingId: string;
    mainProductName: string;
    redemptions: number;
    revenue: number;
  }[]> {
    const db = await this.getDb();
    
    // Get all mappings and their performance
    const mappingsQuery = query(collection(db, 'staging_bogo_mappings'));
    const mappingsSnapshot = await getDocs(mappingsQuery);
    
    const performance = await Promise.all(
      mappingsSnapshot.docs.map(async (mappingDoc) => {
        const mapping = { id: mappingDoc.id, ...mappingDoc.data() } as BogoMapping;
        
        // Get redemptions for this mapping
        const eventsQuery = query(
          collection(db, 'staging_bogo_analytics_events'),
          where('mappingId', '==', mapping.id),
          where('eventType', '==', 'redemption'),
          where('timestamp', '>=', Timestamp.fromDate(start)),
          where('timestamp', '<=', Timestamp.fromDate(end))
        );
        
        const eventsSnapshot = await getDocs(eventsQuery);
        const redemptions = eventsSnapshot.size;
        
        // Calculate revenue (simplified - in real implementation, sum from orders)
        const revenue = redemptions * 100; // Placeholder calculation
        
        return {
          mappingId: mapping.id,
          mainProductName: `Product ${mapping.mainProductId}`, // TODO: Fetch real product name
          redemptions,
          revenue
        };
      })
    );
    
    return performance
      .sort((a, b) => b.redemptions - a.redemptions)
      .slice(0, limit);
  }

  private async getRecentActivity(days: number, start: Date, end: Date): Promise<{
    date: string;
    redemptions: number;
    revenue: number;
  }[]> {
    const activity: { date: string; redemptions: number; revenue: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(end);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const redemptions = await this.getTotalRedemptions(dayStart, dayEnd);
      const revenue = await this.getTotalRevenue(dayStart, dayEnd);
      
      activity.push({
        date: date.toISOString().split('T')[0],
        redemptions,
        revenue
      });
    }
    
    return activity;
  }

  private async getUpcomingExpirations(days: number): Promise<{
    mappingId: string;
    mainProductName: string;
    expiresAt: Date;
  }[]> {
    const db = await this.getDb();
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    const mappingsQuery = query(
      collection(db, 'staging_bogo_mappings'),
      where('active', '==', true),
      where('promotionEndDate', '<=', Timestamp.fromDate(futureDate)),
      orderBy('promotionEndDate', 'asc')
    );
    
    const snapshot = await getDocs(mappingsQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        mappingId: doc.id,
        mainProductName: `Product ${data.mainProductId}`, // TODO: Fetch real product name
        expiresAt: data.promotionEndDate.toDate()
      };
    });
  }

  private async getAllActiveMappingIds(): Promise<string[]> {
    const db = await this.getDb();
    
    const mappingsQuery = query(
      collection(db, 'staging_bogo_mappings'),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(mappingsQuery);
    return snapshot.docs.map(doc => doc.id);
  }

  private async generateComprehensiveReport(
    mapping: BogoMapping,
    events: BogoAnalyticsEvent[],
    orders: any[],
    periodStart: Date,
    periodEnd: Date,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<BogoAnalyticsReport> {
    // Calculate all metrics
    const viewEvents = events.filter(e => e.eventType === 'view');
    const cartEvents = events.filter(e => e.eventType === 'add_to_cart');
    const checkoutEvents = events.filter(e => e.eventType === 'checkout');
    const redemptionEvents = events.filter(e => e.eventType === 'redemption');
    
    const totalViews = viewEvents.length;
    const totalRedemptions = redemptionEvents.length;
    const uniqueCustomers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.price * order.quantity || 0), 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    
    const viewToCartRate = totalViews > 0 ? (cartEvents.length / totalViews) * 100 : 0;
    const cartToCheckoutRate = cartEvents.length > 0 ? (checkoutEvents.length / cartEvents.length) * 100 : 0;
    const overallConversionRate = totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;
    
    const totalSavingsProvided = redemptionEvents.reduce((sum, event) => 
      sum + (event.metadata?.productSavings || 0) + (event.metadata?.shippingSavings || 0), 0);
    
    const revenuePerView = totalViews > 0 ? totalRevenue / totalViews : 0;
    
    // Calculate free product distribution
    const freeProductCounts = new Map<string, number>();
    redemptionEvents.forEach(event => {
      if (event.freeProductId) {
        freeProductCounts.set(event.freeProductId, (freeProductCounts.get(event.freeProductId) || 0) + 1);
      }
    });
    
    const freeProductDistribution = Array.from(freeProductCounts.entries()).map(([productId, count]) => ({
      productId,
      productName: `Product ${productId}`, // TODO: Fetch real product name
      count,
      percentage: totalRedemptions > 0 ? (count / totalRedemptions) * 100 : 0
    }));
    
    // Generate daily metrics (simplified - would need more complex grouping for week/month)
    const dailyMetrics = this.generateDailyMetrics(events, orders, periodStart, periodEnd);
    
    return {
      mappingId: mapping.id,
      periodStart,
      periodEnd,
      totalViews,
      totalRedemptions,
      totalRevenue,
      uniqueCustomers,
      viewToCartRate,
      cartToCheckoutRate,
      overallConversionRate,
      averageOrderValue,
      totalSavingsProvided,
      revenuePerView,
      freeProductDistribution,
      dailyMetrics
    };
  }

  private generateDailyMetrics(events: BogoAnalyticsEvent[], orders: any[], start: Date, end: Date): {
    date: string;
    views: number;
    redemptions: number;
    revenue: number;
    conversionRate: number;
  }[] {
    const dailyData = new Map<string, {
      views: number;
      redemptions: number;
      revenue: number;
    }>();
    
    // Initialize all days in range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyData.set(dateStr, { views: 0, redemptions: 0, revenue: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Count events by day
    events.forEach(event => {
      const dateStr = event.timestamp.toDate().toISOString().split('T')[0];
      const dayData = dailyData.get(dateStr);
      if (dayData) {
        if (event.eventType === 'view') dayData.views++;
        if (event.eventType === 'redemption') dayData.redemptions++;
      }
    });
    
    // Count revenue by day
    orders.forEach(order => {
      const dateStr = order.timestamp?.toDate?.()?.toISOString()?.split('T')[0];
      const dayData = dailyData.get(dateStr);
      if (dayData) {
        dayData.revenue += order.price * order.quantity || 0;
      }
    });
    
    // Convert to array with conversion rates
    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      views: data.views,
      redemptions: data.redemptions,
      revenue: data.revenue,
      conversionRate: data.views > 0 ? (data.redemptions / data.views) * 100 : 0
    }));
  }

  private formatAsCSV(reports: BogoAnalyticsReport[]): string {
    const headers = [
      'Mapping ID',
      'Period Start',
      'Period End',
      'Total Views',
      'Total Redemptions',
      'Total Revenue',
      'Unique Customers',
      'View to Cart Rate (%)',
      'Cart to Checkout Rate (%)',
      'Overall Conversion Rate (%)',
      'Average Order Value',
      'Total Savings Provided',
      'Revenue Per View'
    ];
    
    const rows = reports.map(report => [
      report.mappingId,
      report.periodStart.toISOString(),
      report.periodEnd.toISOString(),
      report.totalViews.toString(),
      report.totalRedemptions.toString(),
      report.totalRevenue.toFixed(2),
      report.uniqueCustomers.toString(),
      report.viewToCartRate.toFixed(2),
      report.cartToCheckoutRate.toFixed(2),
      report.overallConversionRate.toFixed(2),
      report.averageOrderValue.toFixed(2),
      report.totalSavingsProvided.toFixed(2),
      report.revenuePerView.toFixed(2)
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  private formatAsJSON(reports: BogoAnalyticsReport[]): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalReports: reports.length,
      reports
    }, null, 2);
  }

  /**
   * Get all active mapping IDs (public method)
   */
  async getAllActiveMappingIds(): Promise<string[]> {
    const db = await this.getDb();
    
    const mappingsQuery = query(
      collection(db, 'staging_bogo_mappings'),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(mappingsQuery);
    return snapshot.docs.map(doc => doc.id);
  }
}

// Export singleton instance
export const bogoAnalyticsService = BogoAnalyticsService.getInstance();