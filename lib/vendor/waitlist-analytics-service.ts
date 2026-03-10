/**
 * Vendor Waitlist Analytics Service
 * 
 * Tracks and analyzes collection waitlist performance including:
 * - Subscription events and user engagement
 * - Conversion rates and email engagement
 * - Vendor performance metrics
 * - Real-time analytics updates
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
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
  writeBatch,
  QueryConstraint,
  increment
} from 'firebase/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { 
  CollectionWaitlist, 
  WaitlistSubscription, 
  CollectionAnalytics,
  FirestoreTimestamp 
} from '@/types/vendor-waitlist';

/**
 * Waitlist analytics event types
 */
export interface WaitlistAnalyticsEvent {
  id?: string;
  eventType: 'view' | 'subscribe' | 'email_open' | 'email_click' | 'conversion';
  collectionId: string;
  collectionName?: string;
  vendorId: string;
  vendorName?: string;
  userId?: string;
  sessionId?: string;
  timestamp: AdminTimestamp;
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
    subscriptionId?: string;
    emailId?: string;
    clickUrl?: string;
    conversionValue?: number;
    source?: 'direct' | 'social' | 'referral';
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    browserName?: string;
    osName?: string;
    [key: string]: any;
  };
}

/**
 * Vendor waitlist analytics summary
 */
export interface VendorWaitlistAnalytics {
  vendorId: string;
  vendorName: string;
  totalCollections: number;
  totalSubscriptions: number;
  totalViews: number;
  averageConversionRate: number;
  emailEngagementRate: number;
  topCollections: {
    collectionId: string;
    collectionName: string;
    subscriptions: number;
    views: number;
    conversionRate: number;
  }[];
  recentActivity: {
    date: string;
    views: number;
    subscriptions: number;
    emailOpens: number;
    emailClicks: number;
  }[];
  subscriptionsBySource: {
    source: string;
    count: number;
    percentage: number;
  }[];
  locationData: {
    country: string;
    state: string;
    city?: string;
    subscriptions: number;
    percentage: number;
  }[];
}

/**
 * Collection-specific analytics
 */
export interface CollectionWaitlistAnalytics {
  collectionId: string;
  collectionName: string;
  vendorId: string;
  totalViews: number;
  totalSubscriptions: number;
  conversionRate: number;
  emailEngagementRate: number;
  clickThroughRate: number;
  subscriptionsByDate: { date: string; count: number }[];
  subscriptionsBySource: { source: string; count: number }[];
  topSubscribers: {
    userId: string;
    fullName: string;
    email: string;
    subscribedAt: Date;
    source: string;
    location?: {
      country: string;
      state: string;
    };
  }[];
  emailMetrics: {
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  };
}

/**
 * Dashboard overview data for vendor waitlists
 */
export interface VendorWaitlistDashboard {
  totalCollections: number;
  totalSubscriptions: number;
  totalViews: number;
  averageConversionRate: number;
  topPerformingCollections: {
    collectionId: string;
    collectionName: string;
    subscriptions: number;
    conversionRate: number;
  }[];
  recentActivity: {
    date: string;
    views: number;
    subscriptions: number;
  }[];
  subscriptionTrends: {
    period: string;
    subscriptions: number;
    change: number;
  }[];
}

export class VendorWaitlistAnalyticsService {
  private static instance: VendorWaitlistAnalyticsService;

  private constructor() {}

  public static getInstance(): VendorWaitlistAnalyticsService {
    if (!VendorWaitlistAnalyticsService.instance) {
      VendorWaitlistAnalyticsService.instance = new VendorWaitlistAnalyticsService();
    }
    return VendorWaitlistAnalyticsService.instance;
  }

  /**
   * Track collection view event
   */
  async trackCollectionView(
    collectionId: string,
    vendorId: string,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'view',
      collectionId,
      vendorId,
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
   * Track subscription event
   */
  async trackSubscription(
    collectionId: string,
    vendorId: string,
    subscriptionId: string,
    userId?: string,
    source: string = 'direct',
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'subscribe',
      collectionId,
      vendorId,
      userId,
      sessionId: this.generateSessionId(),
      location: await this.getLocationData(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      metadata: {
        ...metadata,
        subscriptionId,
        source,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        deviceType: this.getDeviceType(),
        browserName: this.getBrowserName(),
        osName: this.getOSName(),
      }
    });
  }

  /**
   * Track email engagement events
   */
  async trackEmailEngagement(
    collectionId: string,
    vendorId: string,
    eventType: 'email_open' | 'email_click',
    emailId: string,
    userId?: string,
    clickUrl?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType,
      collectionId,
      vendorId,
      userId,
      sessionId: this.generateSessionId(),
      metadata: {
        emailId,
        clickUrl,
        source: 'email'
      }
    });
  }

  /**
   * Track conversion events (when subscriber makes a purchase)
   */
  async trackConversion(
    collectionId: string,
    vendorId: string,
    userId: string,
    conversionValue: number,
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'conversion',
      collectionId,
      vendorId,
      userId,
      sessionId: this.generateSessionId(),
      metadata: {
        ...metadata,
        conversionValue,
        source: 'waitlist_conversion'
      }
    });
  }

  /**
   * Get comprehensive analytics for a vendor's waitlists
   */
  async getVendorAnalytics(
    vendorId: string, 
    periodStart?: Date, 
    periodEnd?: Date
  ): Promise<VendorWaitlistAnalytics> {
    try {
      // Set default period if not provided (last 30 days)
      const endDate = periodEnd || new Date();
      const startDate = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Get all collections for the vendor
      const collectionsSnapshot = await adminDb.collection('collection_waitlists')
        .where('vendorId', '==', vendorId)
        .get();
      
      const collections = collectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CollectionWaitlist[];

      // Get vendor details
      const vendorDoc = await adminDb.collection("staging_tailors").doc(vendorId).get();
      const vendorName = vendorDoc.exists ? 
        (vendorDoc.data()?.brand_name || vendorDoc.data()?.brandName || 'Unknown Vendor') : 
        'Unknown Vendor';

      // Build query constraints for events
      const constraints: any[] = [
        adminDb.collection('waitlist_analytics_events').where('vendorId', '==', vendorId),
        adminDb.collection('waitlist_analytics_events').where('timestamp', '>=', AdminTimestamp.fromDate(startDate)),
        adminDb.collection('waitlist_analytics_events').where('timestamp', '<=', AdminTimestamp.fromDate(endDate))
      ];

      // Get all events for the vendor in the period
      let eventsQuery = adminDb.collection('waitlist_analytics_events');
      constraints.forEach(constraint => {
        eventsQuery = constraint;
      });
      
      const eventsSnapshot = await eventsQuery.orderBy('timestamp', 'desc').get();
      
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WaitlistAnalyticsEvent[];

      // Calculate metrics
      const viewEvents = events.filter(e => e.eventType === 'view');
      const subscriptionEvents = events.filter(e => e.eventType === 'subscribe');
      const emailOpenEvents = events.filter(e => e.eventType === 'email_open');
      const emailClickEvents = events.filter(e => e.eventType === 'email_click');
      
      const totalViews = viewEvents.length;
      const totalSubscriptions = subscriptionEvents.length;
      const averageConversionRate = totalViews > 0 ? (totalSubscriptions / totalViews) * 100 : 0;
      
      // Calculate email engagement rate
      const emailEngagementRate = emailOpenEvents.length > 0 ? 
        (emailClickEvents.length / emailOpenEvents.length) * 100 : 0;

      // Calculate top collections
      const collectionMap = new Map<string, {
        collectionId: string;
        collectionName: string;
        subscriptions: number;
        views: number;
        conversionRate: number;
      }>();
      
      events.forEach(event => {
        const existing = collectionMap.get(event.collectionId) || {
          collectionId: event.collectionId,
          collectionName: event.collectionName || event.collectionId,
          subscriptions: 0,
          views: 0,
          conversionRate: 0
        };
        
        if (event.eventType === 'view') existing.views++;
        if (event.eventType === 'subscribe') existing.subscriptions++;
        
        collectionMap.set(event.collectionId, existing);
      });
      
      // Calculate conversion rates for collections
      collectionMap.forEach((data, collectionId) => {
        data.conversionRate = data.views > 0 ? (data.subscriptions / data.views) * 100 : 0;
      });
      
      const topCollections = Array.from(collectionMap.values())
        .sort((a, b) => b.subscriptions - a.subscriptions)
        .slice(0, 10);

      // Calculate recent activity (last 7 days)
      const recentActivity = this.calculateDailyMetrics(events, startDate, endDate);
      
      // Calculate subscriptions by source
      const sourceMap = new Map<string, number>();
      subscriptionEvents.forEach(event => {
        const source = event.metadata?.source || 'direct';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });
      
      const subscriptionsBySource = Array.from(sourceMap.entries()).map(([source, count]) => ({
        source,
        count,
        percentage: totalSubscriptions > 0 ? (count / totalSubscriptions) * 100 : 0
      }));
      
      // Calculate location data
      const locationMap = new Map<string, number>();
      subscriptionEvents.forEach(event => {
        if (event.location) {
          const key = `${event.location.country}-${event.location.state}-${event.location.city || ''}`;
          locationMap.set(key, (locationMap.get(key) || 0) + 1);
        }
      });
      
      const locationData = Array.from(locationMap.entries()).map(([locationKey, count]) => {
        const [country, state, city] = locationKey.split('-');
        return {
          country,
          state,
          city: city || undefined,
          subscriptions: count,
          percentage: totalSubscriptions > 0 ? (count / totalSubscriptions) * 100 : 0
        };
      }).sort((a, b) => b.subscriptions - a.subscriptions).slice(0, 10);

      return {
        vendorId,
        vendorName,
        totalCollections: collections.length,
        totalSubscriptions,
        totalViews,
        averageConversionRate,
        emailEngagementRate,
        topCollections,
        recentActivity,
        subscriptionsBySource,
        locationData
      };
    } catch (error) {
      console.error('Failed to get vendor waitlist analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics for a specific collection
   */
  async getCollectionAnalytics(
    collectionId: string, 
    periodStart?: Date, 
    periodEnd?: Date
  ): Promise<CollectionWaitlistAnalytics> {
    try {
      // Get collection details
      const collectionDoc = await adminDb.collection('collection_waitlists').doc(collectionId).get();
      if (!collectionDoc.exists) {
        throw new Error('Collection not found');
      }
      
      const collection = { id: collectionDoc.id, ...collectionDoc.data() } as CollectionWaitlist;
      
      // Set default period if not provided (last 30 days)
      const endDate = periodEnd || new Date();
      const startDate = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Get all events for the collection in the period
      const eventsSnapshot = await adminDb.collection('waitlist_analytics_events')
        .where('collectionId', '==', collectionId)
        .where('timestamp', '>=', AdminTimestamp.fromDate(startDate))
        .where('timestamp', '<=', AdminTimestamp.fromDate(endDate))
        .orderBy('timestamp', 'desc')
        .get();
      
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WaitlistAnalyticsEvent[];

      // Calculate metrics
      const viewEvents = events.filter(e => e.eventType === 'view');
      const subscriptionEvents = events.filter(e => e.eventType === 'subscribe');
      const emailOpenEvents = events.filter(e => e.eventType === 'email_open');
      const emailClickEvents = events.filter(e => e.eventType === 'email_click');
      
      const totalViews = viewEvents.length;
      const totalSubscriptions = subscriptionEvents.length;
      const conversionRate = totalViews > 0 ? (totalSubscriptions / totalViews) * 100 : 0;
      
      // Calculate email metrics
      const emailEngagementRate = emailOpenEvents.length > 0 ? 
        (emailClickEvents.length / emailOpenEvents.length) * 100 : 0;
      const clickThroughRate = totalSubscriptions > 0 ? 
        (emailClickEvents.length / totalSubscriptions) * 100 : 0;

      // Calculate subscriptions by date
      const subscriptionsByDate = this.calculateSubscriptionsByDate(subscriptionEvents, startDate, endDate);
      
      // Calculate subscriptions by source
      const sourceMap = new Map<string, number>();
      subscriptionEvents.forEach(event => {
        const source = event.metadata?.source || 'direct';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });
      
      const subscriptionsBySource = Array.from(sourceMap.entries()).map(([source, count]) => ({
        source,
        count
      }));

      // Get top subscribers (from actual subscription records)
      const subscriptionsSnapshot = await adminDb.collection('waitlist_subscriptions')
        .where('collectionId', '==', collectionId)
        .orderBy('subscribedAt', 'desc')
        .limit(20)
        .get();
      
      const topSubscribers = subscriptionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: data.userId || 'anonymous',
          fullName: data.fullName || 'Anonymous',
          email: data.email || '',
          subscribedAt: data.subscribedAt.toDate(),
          source: data.source || 'direct',
          location: data.metadata?.location
        };
      });

      // Email metrics (would need integration with email service)
      const emailMetrics = {
        sent: totalSubscriptions, // Assume we send email to each subscriber
        opened: emailOpenEvents.length,
        clicked: emailClickEvents.length,
        openRate: totalSubscriptions > 0 ? (emailOpenEvents.length / totalSubscriptions) * 100 : 0,
        clickRate: emailOpenEvents.length > 0 ? (emailClickEvents.length / emailOpenEvents.length) * 100 : 0
      };

      return {
        collectionId,
        collectionName: collection.name,
        vendorId: collection.vendorId,
        totalViews,
        totalSubscriptions,
        conversionRate,
        emailEngagementRate,
        clickThroughRate,
        subscriptionsByDate,
        subscriptionsBySource,
        topSubscribers,
        emailMetrics
      };
    } catch (error) {
      console.error('Failed to get collection analytics:', error);
      throw error;
    }
  }

  /**
   * Get dashboard overview for vendor waitlists
   */
  async getVendorDashboard(vendorId: string): Promise<VendorWaitlistDashboard> {
    try {
      // Get last 30 days of data
      const endDate = new Date();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const analytics = await this.getVendorAnalytics(vendorId, startDate, endDate);
      
      // Calculate subscription trends (compare with previous period)
      const previousStartDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const previousEndDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const previousAnalytics = await this.getVendorAnalytics(vendorId, previousStartDate, previousEndDate);
      
      const subscriptionChange = previousAnalytics.totalSubscriptions > 0 ? 
        ((analytics.totalSubscriptions - previousAnalytics.totalSubscriptions) / previousAnalytics.totalSubscriptions) * 100 : 0;

      return {
        totalCollections: analytics.totalCollections,
        totalSubscriptions: analytics.totalSubscriptions,
        totalViews: analytics.totalViews,
        averageConversionRate: analytics.averageConversionRate,
        topPerformingCollections: analytics.topCollections.map(c => ({
          collectionId: c.collectionId,
          collectionName: c.collectionName,
          subscriptions: c.subscriptions,
          conversionRate: c.conversionRate
        })),
        recentActivity: analytics.recentActivity,
        subscriptionTrends: [
          {
            period: 'Current (30 days)',
            subscriptions: analytics.totalSubscriptions,
            change: subscriptionChange
          },
          {
            period: 'Previous (30 days)',
            subscriptions: previousAnalytics.totalSubscriptions,
            change: 0
          }
        ]
      };
    } catch (error) {
      console.error('Failed to get vendor dashboard:', error);
      throw error;
    }
  }

  /**
   * Track generic analytics event
   */
  private async trackEvent(event: Omit<WaitlistAnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const eventData: Omit<WaitlistAnalyticsEvent, 'id'> = {
        ...event,
        timestamp: AdminTimestamp.now()
      };

      // Store the event
      await adminDb.collection('waitlist_analytics_events').add(eventData);
      
      // Update collection-level counters for quick access
      await this.updateCollectionCounters(event.collectionId, event.eventType, event.metadata);
    } catch (error) {
      console.error('Failed to track waitlist analytics event:', error);
    }
  }

  /**
   * Update collection counters for quick access
   */
  private async updateCollectionCounters(collectionId: string, eventType: string, metadata?: any): Promise<void> {
    try {
      const counterRef = adminDb.collection('waitlist_analytics_counters').doc(collectionId);
      
      const updates: any = {};
      
      if (eventType === 'view') {
        updates.totalViews = adminDb.FieldValue.increment(1);
      } else if (eventType === 'subscribe') {
        updates.totalSubscriptions = adminDb.FieldValue.increment(1);
      } else if (eventType === 'email_open') {
        updates.totalEmailOpens = adminDb.FieldValue.increment(1);
      } else if (eventType === 'email_click') {
        updates.totalEmailClicks = adminDb.FieldValue.increment(1);
      } else if (eventType === 'conversion') {
        updates.totalConversions = adminDb.FieldValue.increment(1);
        updates.totalRevenue = adminDb.FieldValue.increment(metadata?.conversionValue || 0);
      }
      
      updates.updatedAt = AdminTimestamp.now();
      
      await counterRef.set(updates, { merge: true });
    } catch (error) {
      console.error('Failed to update collection counters:', error);
    }
  }

  /**
   * Calculate daily metrics from events
   */
  private calculateDailyMetrics(events: WaitlistAnalyticsEvent[], startDate: Date, endDate: Date): any[] {
    const dailyData = new Map<string, {
      views: number;
      subscriptions: number;
      emailOpens: number;
      emailClicks: number;
    }>();

    // Initialize all days in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData.set(dateKey, { views: 0, subscriptions: 0, emailOpens: 0, emailClicks: 0 });
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
        } else if (event.eventType === 'subscribe') {
          dayData.subscriptions++;
        } else if (event.eventType === 'email_open') {
          dayData.emailOpens++;
        } else if (event.eventType === 'email_click') {
          dayData.emailClicks++;
        }
      }
    });

    // Convert to array format
    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      views: data.views,
      subscriptions: data.subscriptions,
      emailOpens: data.emailOpens,
      emailClicks: data.emailClicks
    }));
  }

  /**
   * Calculate subscriptions by date
   */
  private calculateSubscriptionsByDate(events: WaitlistAnalyticsEvent[], startDate: Date, endDate: Date): { date: string; count: number }[] {
    const dailyData = new Map<string, number>();

    // Initialize all days in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData.set(dateKey, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate subscription events by day
    events.forEach(event => {
      const eventDate = event.timestamp.toDate();
      const dateKey = eventDate.toISOString().split('T')[0];
      
      if (dailyData.has(dateKey)) {
        dailyData.set(dateKey, dailyData.get(dateKey)! + 1);
      }
    });

    // Convert to array format
    return Array.from(dailyData.entries()).map(([date, count]) => ({
      date,
      count
    }));
  }

  // Helper methods
  private generateSessionId(): string {
    return `waitlist_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
export const vendorWaitlistAnalyticsService = VendorWaitlistAnalyticsService.getInstance();