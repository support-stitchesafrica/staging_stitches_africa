/**
 * Notification Analytics Service
 * 
 * Provides methods to query and aggregate notification event data
 * from the Firestore notification_events collection.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/firebase';

// Types for notification analytics
export interface NotificationEvent {
  id: string;
  eventType: 'open' | 'delivered';
  notificationId: string;
  campaignId?: string;
  title: string;
  content: string;
  userId?: string;
  platform: 'ios' | 'android';
  source: 'onesignal_dashboard' | 'backend' | 'automation';
  dedupeKey: string;
  receivedAt?: Date;
  openedAt?: Date;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface NotificationMetrics {
  totalDelivered: number;
  totalOpened: number;
  ctr: number; // Click-through rate as percentage
}

export interface CampaignMetrics {
  campaignId: string;
  delivered: number;
  opened: number;
  ctr: number;
  latestDate: Date;
}

export interface PlatformBreakdown {
  ios: { delivered: number; opened: number };
  android: { delivered: number; opened: number };
}

export interface SourceBreakdown {
  onesignal_dashboard: { delivered: number; opened: number };
  backend: { delivered: number; opened: number };
  automation: { delivered: number; opened: number };
}

export interface DateRange {
  from: Date;
  to: Date;
}

const COLLECTION_NAME = 'staging_notification_events';

/**
 * Notification Analytics Service
 * Handles all Firestore queries for notification event data
 */
export class NotificationAnalyticsService {
  private collectionRef = collection(db, COLLECTION_NAME);

  /**
   * Convert Firestore Timestamp to Date
   */
  private toDate(timestamp: Timestamp | Date | undefined): Date | undefined {
    if (!timestamp) return undefined;
    if (timestamp instanceof Date) return timestamp;
    return timestamp.toDate();
  }

  /**
   * Convert document data to NotificationEvent
   */
  private parseDocument(doc: { id: string; data: () => Record<string, unknown> }): NotificationEvent {
    const data = doc.data();
    return {
      id: doc.id,
      eventType: data.eventType as 'open' | 'delivered',
      notificationId: data.notificationId as string,
      campaignId: data.campaignId as string | undefined,
      title: data.title as string || '',
      content: data.content as string || '',
      userId: data.userId as string | undefined,
      platform: data.platform as 'ios' | 'android',
      source: data.source as 'onesignal_dashboard' | 'backend' | 'automation',
      dedupeKey: data.dedupeKey as string,
      receivedAt: this.toDate(data.receivedAt as Timestamp | undefined),
      openedAt: this.toDate(data.openedAt as Timestamp | undefined),
      createdAt: this.toDate(data.createdAt as Timestamp) || new Date(),
      metadata: data.metadata as Record<string, unknown> | undefined,
    };
  }

  /**
   * Get overall notification metrics within a date range
   */
  async getNotificationMetrics(dateRange?: DateRange): Promise<NotificationMetrics> {
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
    ];

    if (dateRange) {
      constraints.push(
        where('createdAt', '>=', Timestamp.fromDate(dateRange.from)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.to))
      );
    }

    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    let totalDelivered = 0;
    let totalOpened = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.eventType === 'delivered') {
        totalDelivered++;
      } else if (data.eventType === 'open') {
        totalOpened++;
      }
    });

    const ctr = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;

    return {
      totalDelivered,
      totalOpened,
      ctr: Math.round(ctr * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Get metrics for a specific campaign
   */
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    const q = query(
      this.collectionRef,
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    let delivered = 0;
    let opened = 0;
    let latestDate = new Date(0);

    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = this.toDate(data.createdAt as Timestamp) || new Date();
      
      if (data.eventType === 'delivered') {
        delivered++;
      } else if (data.eventType === 'open') {
        opened++;
      }

      if (createdAt > latestDate) {
        latestDate = createdAt;
      }
    });

    const ctr = delivered > 0 ? (opened / delivered) * 100 : 0;

    return {
      campaignId,
      delivered,
      opened,
      ctr: Math.round(ctr * 100) / 100,
      latestDate,
    };
  }

  /**
   * Get list of campaigns with aggregated metrics
   */
  async getCampaignList(dateRange?: DateRange): Promise<CampaignMetrics[]> {
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
    ];

    if (dateRange) {
      constraints.push(
        where('createdAt', '>=', Timestamp.fromDate(dateRange.from)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.to))
      );
    }

    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    // Aggregate by campaign
    const campaignMap = new Map<string, { delivered: number; opened: number; latestDate: Date }>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const campaignId = data.campaignId as string || 'unknown';
      const createdAt = this.toDate(data.createdAt as Timestamp) || new Date();

      if (!campaignMap.has(campaignId)) {
        campaignMap.set(campaignId, { delivered: 0, opened: 0, latestDate: new Date(0) });
      }

      const campaign = campaignMap.get(campaignId)!;
      
      if (data.eventType === 'delivered') {
        campaign.delivered++;
      } else if (data.eventType === 'open') {
        campaign.opened++;
      }

      if (createdAt > campaign.latestDate) {
        campaign.latestDate = createdAt;
      }
    });

    // Convert to array and calculate CTR
    const campaigns: CampaignMetrics[] = [];
    campaignMap.forEach((stats, campaignId) => {
      const ctr = stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0;
      campaigns.push({
        campaignId,
        delivered: stats.delivered,
        opened: stats.opened,
        ctr: Math.round(ctr * 100) / 100,
        latestDate: stats.latestDate,
      });
    });

    // Sort by latest date descending
    campaigns.sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());

    return campaigns;
  }

  /**
   * Get platform breakdown (iOS vs Android)
   */
  async getPlatformBreakdown(dateRange?: DateRange): Promise<PlatformBreakdown> {
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
    ];

    if (dateRange) {
      constraints.push(
        where('createdAt', '>=', Timestamp.fromDate(dateRange.from)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.to))
      );
    }

    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    const breakdown: PlatformBreakdown = {
      ios: { delivered: 0, opened: 0 },
      android: { delivered: 0, opened: 0 },
    };

    snapshot.forEach((doc) => {
      const data = doc.data();
      const platform = data.platform as 'ios' | 'android';
      
      if (platform === 'ios' || platform === 'android') {
        if (data.eventType === 'delivered') {
          breakdown[platform].delivered++;
        } else if (data.eventType === 'open') {
          breakdown[platform].opened++;
        }
      }
    });

    return breakdown;
  }

  /**
   * Get source breakdown (dashboard vs backend vs automation)
   */
  async getSourceBreakdown(dateRange?: DateRange): Promise<SourceBreakdown> {
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
    ];

    if (dateRange) {
      constraints.push(
        where('createdAt', '>=', Timestamp.fromDate(dateRange.from)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.to))
      );
    }

    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    const breakdown: SourceBreakdown = {
      onesignal_dashboard: { delivered: 0, opened: 0 },
      backend: { delivered: 0, opened: 0 },
      automation: { delivered: 0, opened: 0 },
    };

    snapshot.forEach((doc) => {
      const data = doc.data();
      const source = data.source as keyof SourceBreakdown;
      
      if (source && breakdown[source]) {
        if (data.eventType === 'delivered') {
          breakdown[source].delivered++;
        } else if (data.eventType === 'open') {
          breakdown[source].opened++;
        }
      }
    });

    return breakdown;
  }

  /**
   * Get recent notification events
   */
  async getRecentNotifications(maxLimit: number = 20): Promise<NotificationEvent[]> {
    const q = query(
      this.collectionRef,
      orderBy('createdAt', 'desc'),
      limit(maxLimit)
    );

    const snapshot = await getDocs(q);
    const events: NotificationEvent[] = [];

    snapshot.forEach((doc) => {
      events.push(this.parseDocument(doc));
    });

    return events;
  }

  /**
   * Get notification history for a specific user
   */
  async getUserNotificationHistory(userId: string, maxLimit: number = 50): Promise<NotificationEvent[]> {
    const q = query(
      this.collectionRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxLimit)
    );

    const snapshot = await getDocs(q);
    const events: NotificationEvent[] = [];

    snapshot.forEach((doc) => {
      events.push(this.parseDocument(doc));
    });

    return events;
  }

  /**
   * Get daily metrics for charting
   */
  async getDailyMetrics(dateRange: DateRange): Promise<Array<{ date: string; delivered: number; opened: number }>> {
    const constraints: QueryConstraint[] = [
      where('createdAt', '>=', Timestamp.fromDate(dateRange.from)),
      where('createdAt', '<=', Timestamp.fromDate(dateRange.to)),
      orderBy('createdAt', 'asc'),
    ];

    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    // Aggregate by day
    const dailyMap = new Map<string, { delivered: number; opened: number }>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = this.toDate(data.createdAt as Timestamp);
      if (!createdAt) return;

      const dateKey = createdAt.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { delivered: 0, opened: 0 });
      }

      const day = dailyMap.get(dateKey)!;
      if (data.eventType === 'delivered') {
        day.delivered++;
      } else if (data.eventType === 'open') {
        day.opened++;
      }
    });

    // Convert to array
    const dailyMetrics: Array<{ date: string; delivered: number; opened: number }> = [];
    dailyMap.forEach((stats, date) => {
      dailyMetrics.push({ date, ...stats });
    });

    // Sort by date
    dailyMetrics.sort((a, b) => a.date.localeCompare(b.date));

    return dailyMetrics;
  }
}

// Export singleton instance
export const notificationAnalyticsService = new NotificationAnalyticsService();
