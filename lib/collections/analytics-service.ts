/**
 * Collections Analytics Service
 * 
 * Tracks and analyzes collection performance including:
 * - Collection views and user engagement
 * - Add to cart events from collections
 * - Purchase conversions and revenue
 * - User behavior and demographics
 * 
 * Database Collections Used:
 * - product_collections: Main collection for product collections data
 * - collection_analytics_events: Stores all analytics events
 * - collection_analytics_counters: Quick access counters for collections
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
  QueryConstraint,
  increment
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import { string } from 'fast-check';
import { any } from 'zod';
import { events } from '@react-three/fiber';
import { number } from 'framer-motion';
import { metadata } from '@/app/layout';
import { db } from '@/firebase';
import { start } from 'repl';

/**
 * Collection analytics event types
 */
export interface CollectionAnalyticsEvent {
  id?: string;
  eventType: 'view' | 'product_view' | 'add_to_cart' | 'purchase' | 'share';
  collectionId: string;
  collectionName?: string;
  productId?: string;
  productName?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Timestamp;
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
    price?: number;
    quantity?: number;
    cartTotal?: number;
    revenue?: number;
    pageUrl?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    browserName?: string;
    osName?: string;
    [key: string]: any;
  };
}

/**
 * Collection analytics summary data
 */
export interface CollectionAnalyticsSummary {
  collectionId: string;
  collectionName: string;
  totalViews: number;
  uniqueViewers: number;
  totalProductViews: number;
  totalAddToCarts: number;
  totalPurchases: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: {
    productId: string;
    productName: string;
    views: number;
    addToCarts: number;
    purchases: number;
    revenue: number;
  }[];
  topViewers: {
    userId: string;
    userName?: string;
    userEmail?: string;
    views: number;
    addToCarts: number;
    purchases: number;
    totalSpent: number;
    location?: {
      country: string;
      state: string;
      city?: string;
    };
  }[];
  recentActivity: {
    date: string;
    views: number;
    addToCarts: number;
    purchases: number;
    revenue: number;
  }[];
  locationData: {
    country: string;
    state: string;
    city?: string;
    views: number;
    addToCarts: number;
    purchases: number;
    revenue: number;
  }[];
}

/**
 * Dashboard overview data
 */
export interface CollectionsDashboardData {
  totalCollections: number;
  totalViews: number;
  totalAddToCarts: number;
  totalPurchases: number;
  totalRevenue: number;
  topCollections: {
    collectionId: string;
    collectionName: string;
    views: number;
    purchases: number;
    revenue: number;
  }[];
  recentActivity: {
    date: string;
    views: number;
    addToCarts: number;
    purchases: number;
    revenue: number;
  }[];
  topProducts: {
    productId: string;
    productName: string;
    collectionId: string;
    collectionName: string;
    addToCarts: number;
    purchases: number;
    revenue: number;
  }[];
  topCustomers: {
    userId: string;
    userName?: string;
    userEmail?: string;
    collectionsViewed: number;
    totalPurchases: number;
    totalSpent: number;
    location?: {
      country: string;
      state: string;
    };
  }[];
}

export class CollectionsAnalyticsService {
  private static instance: CollectionsAnalyticsService;
  private db: any = null;

  private constructor() {}

  public static getInstance(): CollectionsAnalyticsService {
    if (!CollectionsAnalyticsService.instance) {
      CollectionsAnalyticsService.instance = new CollectionsAnalyticsService();
    }
    return CollectionsAnalyticsService.instance;
  }

  private async getDb() {
    if (!this.db) {
      this.db = await getFirebaseDb();
    }
    return this.db;
  }

  /**
   * Track collection view event
   */
  async trackCollectionView(
    collectionId: string,
    collectionName: string,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'view',
      collectionId,
      collectionName,
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
   * Track product view within collection
   */
  async trackProductView(
    collectionId: string,
    collectionName: string,
    productId: string,
    productName: string,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'product_view',
      collectionId,
      collectionName,
      productId,
      productName,
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
   * Track add to cart from collection
   */
  async trackAddToCart(
    collectionId: string,
    collectionName: string,
    productId: string,
    productName: string,
    price: number,
    quantity: number = 1,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'add_to_cart',
      collectionId,
      collectionName,
      productId,
      productName,
      userId,
      sessionId: this.generateSessionId(),
      location: await this.getLocationData(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      metadata: {
        ...metadata,
        price,
        quantity,
        cartTotal: price * quantity,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        deviceType: this.getDeviceType(),
        browserName: this.getBrowserName(),
        osName: this.getOSName(),
      }
    });
  }

  /**
   * Track purchase from collection
   */
  async trackPurchase(
    collectionId: string,
    collectionName: string,
    productId: string,
    productName: string,
    price: number,
    quantity: number = 1,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    const revenue = price * quantity;
    
    await this.trackEvent({
      eventType: 'purchase',
      collectionId,
      collectionName,
      productId,
      productName,
      userId,
      sessionId: this.generateSessionId(),
      location: await this.getLocationData(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      metadata: {
        ...metadata,
        price,
        quantity,
        revenue,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        deviceType: this.getDeviceType(),
        browserName: this.getBrowserName(),
        osName: this.getOSName(),
      }
    });
  }

  /**
   * Track generic analytics event
   */
  private async trackEvent(event: Omit<CollectionAnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const db = await this.getDb();
      
      const eventData: Omit<CollectionAnalyticsEvent, 'id'> = {
        ...event,
        timestamp: Timestamp.now()
      };

      // Store the event
      await addDoc(collection(db, 'collection_analytics_events'), eventData);
      
      // Update collection-level counters for quick access
      await this.updateCollectionCounters(event.collectionId, event.eventType, event.metadata);
    } catch (error) {
      console.error('Failed to track collection analytics event:', error);
    }
  }

  /**
   * Get collection details from the product_collections collection
   */
  private async getCollectionDetails(collectionId: string): Promise<{ name: string; title?: string } | null> {
    try {
      const db = await this.getDb();
      const collectionRef = doc(db, 'product_collections', collectionId);
      const collectionSnap = await getDoc(collectionRef);
      
      if (collectionSnap.exists()) {
        const data = collectionSnap.data();
        return {
          name: data.name || data.title || collectionId,
          title: data.title || data.name
        };
      }
      return null;
    } catch (error) {
      console.warn('Failed to get collection details:', error);
      return null;
    }
  }

  /**
   * Get comprehensive analytics for a specific collection
   */
  async getCollectionAnalytics(
    collectionId: string, 
    periodStart?: Date, 
    periodEnd?: Date
  ): Promise<CollectionAnalyticsSummary> {
    try {
      const db = await this.getDb();
      
      // Get collection details
      const collectionDetails = await this.getCollectionDetails(collectionId);
      
      // Set default period if not provided (last 30 days)
      const endDate = periodEnd || new Date();
      const startDate = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Build query constraints
      const constraints: QueryConstraint[] = [
        where('collectionId', '==', collectionId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      ];

      // Get all events for the collection in the period
      const eventsQuery = query(collection(db, 'collection_analytics_events'), ...constraints);
      const eventsSnapshot = await getDocs(eventsQuery);
      
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CollectionAnalyticsEvent[];

      // Calculate metrics
      const viewEvents = events.filter(e => e.eventType === 'view');
      const productViewEvents = events.filter(e => e.eventType === 'product_view');
      const cartEvents = events.filter(e => e.eventType === 'add_to_cart');
      const purchaseEvents = events.filter(e => e.eventType === 'purchase');
      
      const totalViews = viewEvents.length;
      const totalProductViews = productViewEvents.length;
      const totalAddToCarts = cartEvents.length;
      const totalPurchases = purchaseEvents.length;
      
      // Calculate revenue
      const totalRevenue = purchaseEvents.reduce((sum, event) => 
        sum + (event.metadata?.revenue || 0), 0
      );
      
      // Calculate conversion rate
      const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;
      
      // Calculate average order value
      const averageOrderValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;
      
      // Get unique viewers
      const uniqueViewers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;
      
      // Calculate top products
      const productMap = new Map<string, {
        productId: string;
        productName: string;
        views: number;
        addToCarts: number;
        purchases: number;
        revenue: number;
      }>();
      
      events.forEach(event => {
        if (event.productId) {
          const key = event.productId;
          const existing = productMap.get(key) || {
            productId: event.productId,
            productName: event.productName || event.productId,
            views: 0,
            addToCarts: 0,
            purchases: 0,
            revenue: 0
          };
          
          if (event.eventType === 'product_view') existing.views++;
          if (event.eventType === 'add_to_cart') existing.addToCarts++;
          if (event.eventType === 'purchase') {
            existing.purchases++;
            existing.revenue += event.metadata?.revenue || 0;
          }
          
          productMap.set(key, existing);
        }
      });
      
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      // Calculate top viewers
      const viewerMap = new Map<string, {
        userId: string;
        userName?: string;
        userEmail?: string;
        views: number;
        addToCarts: number;
        purchases: number;
        totalSpent: number;
        location?: any;
      }>();
      
      events.forEach(event => {
        if (event.userId) {
          const existing = viewerMap.get(event.userId) || {
            userId: event.userId,
            views: 0,
            addToCarts: 0,
            purchases: 0,
            totalSpent: 0,
            location: event.location
          };
          
          if (event.eventType === 'view') existing.views++;
          if (event.eventType === 'add_to_cart') existing.addToCarts++;
          if (event.eventType === 'purchase') {
            existing.purchases++;
            existing.totalSpent += event.metadata?.revenue || 0;
          }
          
          viewerMap.set(event.userId, existing);
        }
      });
      
      const topViewers = Array.from(viewerMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 20);
      
      // Calculate recent activity (last 7 days)
      const recentActivity = this.calculateDailyMetrics(events, startDate, endDate);
      
      // Calculate location data
      const locationMap = new Map<string, {
        country: string;
        state: string;
        city?: string;
        views: number;
        addToCarts: number;
        purchases: number;
        revenue: number;
      }>();
      
      events.forEach(event => {
        if (event.location) {
          const key = `${event.location.country}-${event.location.state}-${event.location.city || ''}`;
          const existing = locationMap.get(key) || {
            country: event.location.country,
            state: event.location.state,
            city: event.location.city,
            views: 0,
            addToCarts: 0,
            purchases: 0,
            revenue: 0
          };
          
          if (event.eventType === 'view') existing.views++;
          if (event.eventType === 'add_to_cart') existing.addToCarts++;
          if (event.eventType === 'purchase') {
            existing.purchases++;
            existing.revenue += event.metadata?.revenue || 0;
          }
          
          locationMap.set(key, existing);
        }
      });
      
      const locationData = Array.from(locationMap.values())
        .sort((a, b) => b.views - a.views)
        .slice(0, 15);
      
      return {
        collectionId,
        collectionName: collectionDetails?.name || events[0]?.collectionName || collectionId,
        totalViews,
        uniqueViewers,
        totalProductViews,
        totalAddToCarts,
        totalPurchases,
        totalRevenue,
        conversionRate,
        averageOrderValue,
        topProducts,
        topViewers,
        recentActivity,
        locationData
      };
    } catch (error) {
      console.error('Failed to get collection analytics:', error);
      throw error;
    }
  }

  /**
   * Get dashboard overview data
   */
  async getDashboardData(dateRange?: { start: Date; end: Date }): Promise<CollectionsDashboardData> {
    try {
      const db = await this.getDb();
      
      // Set default date range if not provided
      const start = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = dateRange?.end || new Date();

      // Get all collections count from the correct collection
      let totalCollections = 0;
      try {
        const collectionsQuery = query(collection(db, 'product_collections'));
        const collectionsSnapshot = await getDocs(collectionsQuery);
        totalCollections = collectionsSnapshot.size;
        console.log('Collections Analytics: Found product_collections:', totalCollections);
      } catch (collectionsError) {
        console.warn('Collections Analytics: Error fetching product_collections count:', collectionsError);
        // Try alternative collection names as fallback
        try {
          const altCollectionsQuery = query(collection(db, 'collections'));
          const altCollectionsSnapshot = await getDocs(altCollectionsQuery);
          totalCollections = altCollectionsSnapshot.size;
          console.log('Collections Analytics: Found collections (fallback):', totalCollections);
        } catch (altError) {
          console.warn('Collections Analytics: Error fetching collections (fallback):', altError);
        }
      }

      // Get all analytics events in the period
      const eventsQuery = query(
        collection(db, 'collection_analytics_events'),
        where('timestamp', '>=', Timestamp.fromDate(start)),
        where('timestamp', '<=', Timestamp.fromDate(end)),
        orderBy('timestamp', 'desc')
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CollectionAnalyticsEvent[];

      // Calculate overall metrics
      const totalViews = events.filter(e => e.eventType === 'view').length;
      const totalAddToCarts = events.filter(e => e.eventType === 'add_to_cart').length;
      const totalPurchases = events.filter(e => e.eventType === 'purchase').length;
      const totalRevenue = events
        .filter(e => e.eventType === 'purchase')
        .reduce((sum, event) => sum + (event.metadata?.revenue || 0), 0);

      // Calculate top collections
      const collectionMap = new Map<string, {
        collectionId: string;
        collectionName: string;
        views: number;
        purchases: number;
        revenue: number;
      }>();
      
      events.forEach(event => {
        const existing = collectionMap.get(event.collectionId) || {
          collectionId: event.collectionId,
          collectionName: event.collectionName || event.collectionId,
          views: 0,
          purchases: 0,
          revenue: 0
        };
        
        if (event.eventType === 'view') existing.views++;
        if (event.eventType === 'purchase') {
          existing.purchases++;
          existing.revenue += event.metadata?.revenue || 0;
        }
        
        collectionMap.set(event.collectionId, existing);
      });
      
      // Enrich collection names from the database
      const collectionIds = Array.from(collectionMap.keys());
      for (const collectionId of collectionIds) {
        const details = await this.getCollectionDetails(collectionId);
        if (details) {
          const existing = collectionMap.get(collectionId);
          if (existing) {
            existing.collectionName = details.name;
            collectionMap.set(collectionId, existing);
          }
        }
      }
      
      const topCollections = Array.from(collectionMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate recent activity
      const recentActivity = this.calculateDailyMetrics(events, start, end);

      // Calculate top products across all collections
      const productMap = new Map<string, {
        productId: string;
        productName: string;
        collectionId: string;
        collectionName: string;
        addToCarts: number;
        purchases: number;
        revenue: number;
      }>();
      
      events.forEach(event => {
        if (event.productId) {
          const key = `${event.productId}-${event.collectionId}`;
          const existing = productMap.get(key) || {
            productId: event.productId,
            productName: event.productName || event.productId,
            collectionId: event.collectionId,
            collectionName: event.collectionName || event.collectionId,
            addToCarts: 0,
            purchases: 0,
            revenue: 0
          };
          
          if (event.eventType === 'add_to_cart') existing.addToCarts++;
          if (event.eventType === 'purchase') {
            existing.purchases++;
            existing.revenue += event.metadata?.revenue || 0;
          }
          
          productMap.set(key, existing);
        }
      });
      
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 15);

      // Calculate top customers
      const customerMap = new Map<string, {
        userId: string;
        userName?: string;
        userEmail?: string;
        collectionsViewed: Set<string>;
        totalPurchases: number;
        totalSpent: number;
        location?: any;
      }>();
      
      events.forEach(event => {
        if (event.userId) {
          const existing = customerMap.get(event.userId) || {
            userId: event.userId,
            collectionsViewed: new Set<string>(),
            totalPurchases: 0,
            totalSpent: 0,
            location: event.location
          };
          
          if (event.eventType === 'view') {
            existing.collectionsViewed.add(event.collectionId);
          }
          if (event.eventType === 'purchase') {
            existing.totalPurchases++;
            existing.totalSpent += event.metadata?.revenue || 0;
          }
          
          customerMap.set(event.userId, existing);
        }
      });
      
      const topCustomers = Array.from(customerMap.values())
        .map(customer => ({
          userId: customer.userId,
          userName: customer.userName,
          userEmail: customer.userEmail,
          collectionsViewed: customer.collectionsViewed.size,
          totalPurchases: customer.totalPurchases,
          totalSpent: customer.totalSpent,
          location: customer.location ? {
            country: customer.location.country,
            state: customer.location.state
          } : undefined
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 20);

      return {
        totalCollections,
        totalViews,
        totalAddToCarts,
        totalPurchases,
        totalRevenue,
        topCollections,
        recentActivity,
        topProducts,
        topCustomers
      };
    } catch (error) {
      console.error('Failed to get collections dashboard data:', error);
      
      // Return empty data structure instead of mock data
      return {
        totalCollections: 0,
        totalViews: 0,
        totalAddToCarts: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        topCollections: [],
        recentActivity: [],
        topProducts: [],
        topCustomers: []
      };
    }
  }

  // Helper methods
  private async updateCollectionCounters(collectionId: string, eventType: string, metadata?: any): Promise<void> {
    try {
      const db = await this.getDb();
      const counterRef = doc(db, 'collection_analytics_counters', collectionId);
      
      const updates: any = {};
      
      if (eventType === 'view') {
        updates.totalViews = increment(1);
      } else if (eventType === 'add_to_cart') {
        updates.totalAddToCarts = increment(1);
      } else if (eventType === 'purchase') {
        updates.totalPurchases = increment(1);
        updates.totalRevenue = increment(metadata?.revenue || 0);
      }
      
      updates.updatedAt = Timestamp.now();
      
      await updateDoc(counterRef, updates);
    } catch (error) {
      console.error('Failed to update collection counters:', error);
    }
  }

  private calculateDailyMetrics(events: CollectionAnalyticsEvent[], startDate: Date, endDate: Date): any[] {
    const dailyData = new Map<string, {
      views: number;
      addToCarts: number;
      purchases: number;
      revenue: number;
    }>();

    // Initialize all days in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData.set(dateKey, { views: 0, addToCarts: 0, purchases: 0, revenue: 0 });
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
        } else if (event.eventType === 'add_to_cart') {
          dayData.addToCarts++;
        } else if (event.eventType === 'purchase') {
          dayData.purchases++;
          dayData.revenue += event.metadata?.revenue || 0;
        }
      }
    });

    // Convert to array format
    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      views: data.views,
      addToCarts: data.addToCarts,
      purchases: data.purchases,
      revenue: data.revenue
    }));
  }

  private generateSessionId(): string {
    return `collection_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getLocationData(): Promise<any> {
    try {
      if (typeof window !== 'undefined') {
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
}

// Export singleton instance
export const collectionsAnalyticsService = CollectionsAnalyticsService.getInstance();
