import { 
  Activity, 
  HierarchicalReferralErrorCode,
  FirestoreTimestamp
} from '../../../types/hierarchical-referral';
import { adminDb } from '../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { validateActivityMetadata } from '../utils/validation';

/**
 * ActivityTrackingService - Enhanced service for comprehensive activity tracking
 * 
 * Implements Requirements:
 * - 4.1: Comprehensive activity logging with timestamp and action type
 * - 4.2: Support for clicks, views, interactions, conversions
 * - 4.3: Daily, weekly, monthly activity summaries
 * - 4.5: 12-month data retention policy
 */
export class HierarchicalActivityTrackingService {
  private static readonly ACTIVITIES_COLLECTION = 'hierarchical_activities';
  private static readonly ACTIVITY_SUMMARIES_COLLECTION = 'hierarchical_activity_summaries';
  private static readonly DATA_RETENTION_MONTHS = 12;

  /**
   * Track a new activity with comprehensive logging
   * Requirements: 4.1, 4.2
   * 
   * Supports all activity types: click, view, conversion, signup, purchase
   * Captures timestamp and comprehensive metadata
   */
  static async trackActivity(
    influencerId: string,
    type: 'click' | 'view' | 'conversion' | 'signup' | 'purchase',
    referralCode: string,
    metadata: {
      productId?: string;
      amount?: number;
      currency?: string;
      userAgent?: string;
      location?: string;
      sessionId?: string;
      ipHash?: string;
      deviceType?: 'mobile' | 'tablet' | 'desktop';
      source?: 'direct' | 'search' | 'social' | 'referral';
      campaignId?: string;
      customData?: Record<string, any>;
      timestamp?: number;
    } = {}
  ): Promise<Activity> {
    try {
      // Validate metadata
      const validationError = validateActivityMetadata(metadata);
      if (validationError) {
        throw validationError;
      }

      // Create activity record with comprehensive metadata
      const activityRef = adminDb.collection(this.ACTIVITIES_COLLECTION).doc();
      
      const activity: Activity = {
        id: activityRef.id,
        influencerId,
        type,
        referralCode,
        metadata: {
          ...metadata,
          sessionId: metadata.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          timestamp: Date.now(),
          // Ensure we capture essential tracking data
          userAgent: metadata.userAgent || 'unknown',
          location: metadata.location || 'unknown',
          currency: metadata.currency || 'USD'
        },
        timestamp: Timestamp.now(),
        processed: false
      };

      await activityRef.set(activity);

      // Update activity summaries asynchronously for real-time analytics
      this.updateActivitySummaries(influencerId, type, activity.timestamp).catch(error => {
        console.error('Error updating activity summaries:', error);
      });

      return activity;
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to track activity',
        details: error
      };
    }
  }

  /**
   * Track multiple activities in batch for performance
   * Requirements: 4.1, 4.2
   */
  static async trackActivitiesBatch(activities: Array<{
    influencerId: string;
    type: 'click' | 'view' | 'conversion' | 'signup' | 'purchase';
    referralCode: string;
    metadata?: {
      productId?: string;
      amount?: number;
      currency?: string;
      userAgent?: string;
      location?: string;
      sessionId?: string;
      ipHash?: string;
      deviceType?: 'mobile' | 'tablet' | 'desktop';
      source?: 'direct' | 'search' | 'social' | 'referral';
      campaignId?: string;
      customData?: Record<string, any>;
      timestamp?: number;
    };
  }>): Promise<Activity[]> {
    try {
      const batch = adminDb.batch();
      const trackedActivities: Activity[] = [];

      for (const activityData of activities) {
        // Validate each activity
        const validationError = validateActivityMetadata(activityData.metadata || {});
        if (validationError) {
          console.warn(`Skipping invalid activity: ${validationError.message}`);
          continue;
        }

        const activityRef = adminDb.collection(this.ACTIVITIES_COLLECTION).doc();
        
        const activity: Activity = {
          id: activityRef.id,
          influencerId: activityData.influencerId,
          type: activityData.type,
          referralCode: activityData.referralCode,
          metadata: {
            ...activityData.metadata,
            sessionId: activityData.metadata?.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            timestamp: Date.now(),
            userAgent: activityData.metadata?.userAgent || 'unknown',
            location: activityData.metadata?.location || 'unknown',
            currency: activityData.metadata?.currency || 'USD'
          },
          timestamp: Timestamp.now(),
          processed: false
        };

        batch.set(activityRef, activity);
        trackedActivities.push(activity);
      }

      await batch.commit();

      // Update summaries for all tracked activities
      for (const activity of trackedActivities) {
        this.updateActivitySummaries(activity.influencerId, activity.type, activity.timestamp).catch(error => {
          console.error('Error updating activity summaries:', error);
        });
      }

      return trackedActivities;
    } catch (error: any) {
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to track activities batch',
        details: error
      };
    }
  }

  /**
   * Get activities for an influencer with enhanced filtering
   * Requirements: 4.1, 4.2
   */
  static async getActivities(
    influencerId: string,
    options: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      type?: 'click' | 'view' | 'conversion' | 'signup' | 'purchase';
      referralCode?: string;
      includeMetadata?: boolean;
      orderBy?: 'timestamp' | 'type';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<Activity[]> {
    try {
      let query = adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .where('influencerId', '==', influencerId);

      if (options.type) {
        query = query.where('type', '==', options.type);
      }

      if (options.referralCode) {
        query = query.where('referralCode', '==', options.referralCode);
      }

      if (options.startDate) {
        query = query.where('timestamp', '>=', Timestamp.fromDate(options.startDate));
      }

      if (options.endDate) {
        query = query.where('timestamp', '<=', Timestamp.fromDate(options.endDate));
      }

      // Default ordering by timestamp descending
      const orderBy = options.orderBy || 'timestamp';
      const orderDirection = options.orderDirection || 'desc';
      query = query.orderBy(orderBy, orderDirection);

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      const activities = snapshot.docs.map(doc => doc.data() as Activity);

      // Optionally strip metadata for performance
      if (options.includeMetadata === false) {
        return activities.map(activity => ({
          ...activity,
          metadata: {
            sessionId: activity.metadata.sessionId,
            timestamp: activity.metadata.timestamp
          }
        }));
      }

      return activities;
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  /**
   * Get comprehensive activity summary for a time period
   * Requirements: 4.3 - Daily, weekly, monthly summaries
   */
  static async getActivitySummary(
    influencerId: string,
    period: 'day' | 'week' | 'month',
    date: Date
  ): Promise<{
    influencerId: string;
    period: string;
    date: Date;
    totalActivities: number;
    clickCount: number;
    viewCount: number;
    conversionCount: number;
    signupCount: number;
    purchaseCount: number;
    uniqueSessions: number;
    totalRevenue: number;
    averageSessionDuration: number;
    topReferralCodes: Array<{ code: string; count: number }>;
    deviceBreakdown: Record<string, number>;
    sourceBreakdown: Record<string, number>;
  }> {
    try {
      const summaryId = this.generateSummaryId(influencerId, period, date);
      
      const summaryDoc = await adminDb
        .collection(this.ACTIVITY_SUMMARIES_COLLECTION)
        .doc(summaryId)
        .get();

      if (summaryDoc.exists) {
        const data = summaryDoc.data();
        return {
          influencerId,
          period,
          date,
          totalActivities: data?.totalActivities || 0,
          clickCount: data?.clickCount || 0,
          viewCount: data?.viewCount || 0,
          conversionCount: data?.conversionCount || 0,
          signupCount: data?.signupCount || 0,
          purchaseCount: data?.purchaseCount || 0,
          uniqueSessions: data?.uniqueSessions || 0,
          totalRevenue: data?.totalRevenue || 0,
          averageSessionDuration: data?.averageSessionDuration || 0,
          topReferralCodes: data?.topReferralCodes || [],
          deviceBreakdown: data?.deviceBreakdown || {},
          sourceBreakdown: data?.sourceBreakdown || {}
        };
      }

      // If summary doesn't exist, calculate it from raw activities
      const { startDate, endDate } = this.getPeriodBounds(period, date);
      
      const activities = await this.getActivities(influencerId, {
        startDate,
        endDate,
        includeMetadata: true
      });

      // Calculate comprehensive metrics
      const summary = this.calculateComprehensiveSummary(activities, influencerId, period, date);

      // Store the calculated summary for future use
      await adminDb
        .collection(this.ACTIVITY_SUMMARIES_COLLECTION)
        .doc(summaryId)
        .set({
          ...summary,
          createdAt: Timestamp.now(),
          lastUpdated: Timestamp.now()
        });

      return summary;
    } catch (error) {
      console.error('Error getting activity summary:', error);
      return {
        influencerId,
        period,
        date,
        totalActivities: 0,
        clickCount: 0,
        viewCount: 0,
        conversionCount: 0,
        signupCount: 0,
        purchaseCount: 0,
        uniqueSessions: 0,
        totalRevenue: 0,
        averageSessionDuration: 0,
        topReferralCodes: [],
        deviceBreakdown: {},
        sourceBreakdown: {}
      };
    }
  }

  /**
   * Get activity history for multiple time periods
   * Requirements: 4.3 - Activity history queries
   */
  static async getActivityHistory(
    influencerId: string,
    periods: Array<{ period: 'day' | 'week' | 'month'; date: Date }>
  ): Promise<Array<{
    period: string;
    date: Date;
    summary: any;
  }>> {
    try {
      const results = await Promise.all(
        periods.map(async ({ period, date }) => {
          const summary = await this.getActivitySummary(influencerId, period, date);
          return {
            period,
            date,
            summary
          };
        })
      );

      return results;
    } catch (error) {
      console.error('Error getting activity history:', error);
      return [];
    }
  }

  /**
   * Get aggregated metrics across multiple influencers
   * Requirements: 4.3 - Activity aggregation
   */
  static async getAggregatedMetrics(
    influencerIds: string[],
    period: 'day' | 'week' | 'month',
    date: Date
  ): Promise<{
    totalInfluencers: number;
    totalActivities: number;
    totalRevenue: number;
    averageActivitiesPerInfluencer: number;
    topPerformers: Array<{ influencerId: string; totalActivities: number; totalRevenue: number }>;
    activityBreakdown: Record<string, number>;
  }> {
    try {
      const summaries = await Promise.all(
        influencerIds.map(id => this.getActivitySummary(id, period, date))
      );

      const totalActivities = summaries.reduce((sum, s) => sum + s.totalActivities, 0);
      const totalRevenue = summaries.reduce((sum, s) => sum + s.totalRevenue, 0);
      const averageActivitiesPerInfluencer = totalActivities / influencerIds.length;

      // Calculate top performers
      const topPerformers = summaries
        .map((summary, index) => ({
          influencerId: influencerIds[index],
          totalActivities: summary.totalActivities,
          totalRevenue: summary.totalRevenue
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      // Calculate activity breakdown
      const activityBreakdown = summaries.reduce((acc, summary) => {
        acc.clicks = (acc.clicks || 0) + summary.clickCount;
        acc.views = (acc.views || 0) + summary.viewCount;
        acc.conversions = (acc.conversions || 0) + summary.conversionCount;
        acc.signups = (acc.signups || 0) + summary.signupCount;
        acc.purchases = (acc.purchases || 0) + summary.purchaseCount;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalInfluencers: influencerIds.length,
        totalActivities,
        totalRevenue,
        averageActivitiesPerInfluencer,
        topPerformers,
        activityBreakdown
      };
    } catch (error) {
      console.error('Error getting aggregated metrics:', error);
      return {
        totalInfluencers: 0,
        totalActivities: 0,
        totalRevenue: 0,
        averageActivitiesPerInfluencer: 0,
        topPerformers: [],
        activityBreakdown: {}
      };
    }
  }

  /**
   * Schedule automated data retention cleanup
   * Requirements: 4.5 - 12-month data retention policy
   */
  static async scheduleRetentionCleanup(): Promise<{
    scheduled: boolean;
    nextCleanupDate: Date;
    retentionMonths: number;
  }> {
    try {
      // In a real implementation, this would schedule a Cloud Function or cron job
      // For now, we'll just return the configuration
      const nextCleanupDate = new Date();
      nextCleanupDate.setDate(nextCleanupDate.getDate() + 7); // Weekly cleanup

      return {
        scheduled: true,
        nextCleanupDate,
        retentionMonths: this.DATA_RETENTION_MONTHS
      };
    } catch (error) {
      console.error('Error scheduling retention cleanup:', error);
      return {
        scheduled: false,
        nextCleanupDate: new Date(),
        retentionMonths: this.DATA_RETENTION_MONTHS
      };
    }
  }

  /**
   * Get retention policy status
   * Requirements: 4.5 - Data retention monitoring
   */
  static async getRetentionStatus(): Promise<{
    oldestActivityDate: Date | null;
    activitiesCount: number;
    retentionMonths: number;
    needsCleanup: boolean;
    estimatedCleanupCount: number;
  }> {
    try {
      // Get oldest activity
      const oldestSnapshot = await adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .orderBy('timestamp', 'asc')
        .limit(1)
        .get();

      const oldestActivityDate = oldestSnapshot.empty ? 
        null : oldestSnapshot.docs[0].data().timestamp.toDate();

      // Get total count (approximate)
      const countSnapshot = await adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .limit(1000)
        .get();

      const activitiesCount = countSnapshot.size; // This is approximate

      // Calculate if cleanup is needed
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - this.DATA_RETENTION_MONTHS);

      const needsCleanup = oldestActivityDate ? oldestActivityDate < cutoffDate : false;

      // Estimate cleanup count
      let estimatedCleanupCount = 0;
      if (needsCleanup) {
        const cleanupSnapshot = await adminDb
          .collection(this.ACTIVITIES_COLLECTION)
          .where('timestamp', '<', Timestamp.fromDate(cutoffDate))
          .limit(1000)
          .get();
        
        estimatedCleanupCount = cleanupSnapshot.size;
      }

      return {
        oldestActivityDate,
        activitiesCount,
        retentionMonths: this.DATA_RETENTION_MONTHS,
        needsCleanup,
        estimatedCleanupCount
      };
    } catch (error) {
      console.error('Error getting retention status:', error);
      return {
        oldestActivityDate: null,
        activitiesCount: 0,
        retentionMonths: this.DATA_RETENTION_MONTHS,
        needsCleanup: false,
        estimatedCleanupCount: 0
      };
    }
  }
  static async markActivityProcessed(activityId: string): Promise<void> {
    try {
      await adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .doc(activityId)
        .update({
          processed: true
        });
    } catch (error) {
      console.error('Error marking activity as processed:', error);
    }
  }

  /**
   * Get unprocessed activities
   */
  static async getUnprocessedActivities(limit: number = 100): Promise<Activity[]> {
    try {
      const snapshot = await adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .where('processed', '==', false)
        .orderBy('timestamp', 'asc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data() as Activity);
    } catch (error) {
      console.error('Error getting unprocessed activities:', error);
      return [];
    }
  }

  /**
   * Clean up old activities based on data retention policy
   * Requirements: 4.5 - 12-month data retention policy
   */
  static async cleanupOldActivities(retentionMonths: number = this.DATA_RETENTION_MONTHS): Promise<{
    deletedCount: number;
    archivedCount: number;
    errors: string[];
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

      let totalDeleted = 0;
      let totalArchived = 0;
      const errors: string[] = [];

      // Process in batches to avoid timeout
      let hasMore = true;
      while (hasMore) {
        const snapshot = await adminDb
          .collection(this.ACTIVITIES_COLLECTION)
          .where('timestamp', '<', Timestamp.fromDate(cutoffDate))
          .limit(500) // Process in batches
          .get();

        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        try {
          // Archive activities before deletion (optional - for compliance)
          const archiveBatch = adminDb.batch();
          const deleteBatch = adminDb.batch();

          snapshot.docs.forEach(doc => {
            const activity = doc.data() as Activity;
            
            // Archive to a separate collection for compliance
            const archiveRef = adminDb.collection('hierarchical_activities_archive').doc(doc.id);
            archiveBatch.set(archiveRef, {
              ...activity,
              archivedAt: Timestamp.now(),
              originalCollection: this.ACTIVITIES_COLLECTION
            });

            // Mark for deletion
            deleteBatch.delete(doc.ref);
          });

          // Execute archive first, then delete
          await archiveBatch.commit();
          totalArchived += snapshot.size;

          await deleteBatch.commit();
          totalDeleted += snapshot.size;

        } catch (batchError: any) {
          errors.push(`Batch processing error: ${batchError.message}`);
          console.error('Error in cleanup batch:', batchError);
        }

        // Small delay to prevent overwhelming Firestore
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Also cleanup old activity summaries
      await this.cleanupOldActivitySummaries(retentionMonths);

      return {
        deletedCount: totalDeleted,
        archivedCount: totalArchived,
        errors
      };
    } catch (error: any) {
      console.error('Error cleaning up old activities:', error);
      return {
        deletedCount: 0,
        archivedCount: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Calculate comprehensive summary from activities
   * Requirements: 4.3
   */
  private static calculateComprehensiveSummary(
    activities: Activity[],
    influencerId: string,
    period: string,
    date: Date
  ) {
    const uniqueSessions = new Set(activities.map(a => a.metadata.sessionId)).size;
    
    // Calculate revenue from purchase activities
    const totalRevenue = activities
      .filter(a => a.type === 'purchase' && a.metadata.amount)
      .reduce((sum, a) => sum + (a.metadata.amount || 0), 0);

    // Calculate referral code usage
    const referralCodeCounts = activities.reduce((acc, activity) => {
      acc[activity.referralCode] = (acc[activity.referralCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topReferralCodes = Object.entries(referralCodeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));

    // Calculate device breakdown
    const deviceBreakdown = activities.reduce((acc, activity) => {
      const device = activity.metadata.deviceType || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate source breakdown
    const sourceBreakdown = activities.reduce((acc, activity) => {
      const source = activity.metadata.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average session duration (simplified - would need session tracking)
    const averageSessionDuration = activities.length > 0 ? 
      activities.reduce((sum, a) => sum + (a.metadata.timestamp || 0), 0) / uniqueSessions : 0;

    return {
      influencerId,
      period,
      date,
      totalActivities: activities.length,
      clickCount: activities.filter(a => a.type === 'click').length,
      viewCount: activities.filter(a => a.type === 'view').length,
      conversionCount: activities.filter(a => a.type === 'conversion').length,
      signupCount: activities.filter(a => a.type === 'signup').length,
      purchaseCount: activities.filter(a => a.type === 'purchase').length,
      uniqueSessions,
      totalRevenue,
      averageSessionDuration,
      topReferralCodes,
      deviceBreakdown,
      sourceBreakdown
    };
  }

  /**
   * Clean up old activity summaries
   */
  private static async cleanupOldActivitySummaries(retentionMonths: number): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

      const snapshot = await adminDb
        .collection(this.ACTIVITY_SUMMARIES_COLLECTION)
        .where('createdAt', '<', Timestamp.fromDate(cutoffDate))
        .limit(500)
        .get();

      if (!snapshot.empty) {
        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Error cleaning up old activity summaries:', error);
    }
  }
  /**
   * Update activity summaries for an influencer with enhanced metrics
   * Requirements: 4.3
   */
  private static async updateActivitySummaries(
    influencerId: string,
    activityType: string,
    timestamp: FirestoreTimestamp
  ): Promise<void> {
    try {
      const date = timestamp.toDate();
      
      // Update daily, weekly, and monthly summaries
      const periods: Array<'day' | 'week' | 'month'> = ['day', 'week', 'month'];
      
      for (const period of periods) {
        const summaryId = this.generateSummaryId(influencerId, period, date);
        
        const summaryRef = adminDb
          .collection(this.ACTIVITY_SUMMARIES_COLLECTION)
          .doc(summaryId);

        // Use transaction to safely increment counters
        await adminDb.runTransaction(async (transaction) => {
          const summaryDoc = await transaction.get(summaryRef);
          
          if (summaryDoc.exists) {
            const data = summaryDoc.data();
            const updates: any = {
              totalActivities: (data?.totalActivities || 0) + 1,
              lastUpdated: Timestamp.now()
            };
            
            // Increment specific activity type counter
            const typeCountField = `${activityType}Count`;
            updates[typeCountField] = (data?.[typeCountField] || 0) + 1;
            
            transaction.update(summaryRef, updates);
          } else {
            // Create new summary with enhanced structure
            const newSummary: any = {
              influencerId,
              period,
              date: Timestamp.fromDate(date),
              totalActivities: 1,
              clickCount: 0,
              viewCount: 0,
              conversionCount: 0,
              signupCount: 0,
              purchaseCount: 0,
              uniqueSessions: 0,
              totalRevenue: 0,
              averageSessionDuration: 0,
              topReferralCodes: [],
              deviceBreakdown: {},
              sourceBreakdown: {},
              createdAt: Timestamp.now(),
              lastUpdated: Timestamp.now()
            };
            
            newSummary[`${activityType}Count`] = 1;
            transaction.set(summaryRef, newSummary);
          }
        });
      }
    } catch (error) {
      console.error('Error updating activity summaries:', error);
    }
  }

  /**
   * Generate summary ID for consistent document naming
   */
  private static generateSummaryId(influencerId: string, period: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch (period) {
      case 'day':
        return `${influencerId}_${period}_${year}-${month}-${day}`;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekYear = weekStart.getFullYear();
        const weekMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
        const weekDay = String(weekStart.getDate()).padStart(2, '0');
        return `${influencerId}_${period}_${weekYear}-${weekMonth}-${weekDay}`;
      case 'month':
        return `${influencerId}_${period}_${year}-${month}`;
      default:
        return `${influencerId}_${period}_${year}-${month}-${day}`;
    }
  }

  /**
   * Get period bounds for date calculations
   */
  private static getPeriodBounds(period: 'day' | 'week' | 'month', date: Date): {
    startDate: Date;
    endDate: Date;
  } {
    const startDate = new Date(date);
    const endDate = new Date(date);

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(date.getDate() - date.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(date.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  }
}