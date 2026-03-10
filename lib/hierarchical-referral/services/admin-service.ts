import { 
  AdminDashboardData,
  Influencer,
  ReferralTree,
  InfluencerRanking,
  Activity,
  PayoutResult,
  Commission,
  TimePeriod
} from '../../../types/hierarchical-referral';
import { adminDb } from '../../firebase-admin';
import { HierarchicalAnalyticsService } from './analytics-service';

/**
 * AdminService - Service for admin dashboard system visibility and controls
 * Requirements: 6.1, 6.3
 */
export class HierarchicalAdminService {
  private static readonly INFLUENCERS_COLLECTION = 'influencers';
  private static readonly ACTIVITIES_COLLECTION = 'hierarchical_activities';
  private static readonly COMMISSIONS_COLLECTION = 'hierarchical_commissions';
  private static readonly PAYOUTS_COLLECTION = 'hierarchical_payouts';

  /**
   * Get comprehensive admin dashboard data with system visibility
   * Requirements: 6.1, 6.3
   */
  static async getAdminDashboardData(): Promise<AdminDashboardData> {
    try {
      // Get system metrics
      const systemMetrics = await this.getSystemMetrics();
      
      // Get top performers
      const topPerformers = await HierarchicalAnalyticsService.getTopPerformers(10);
      
      // Get recent activities (last 50)
      const recentActivities = await this.getRecentSystemActivities(50);
      
      // Get payout queue
      const payoutQueue = await this.getPayoutQueue();

      return {
        systemMetrics,
        topPerformers,
        recentActivities,
        payoutQueue
      };
    } catch (error) {
      console.error('Error getting admin dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get system-wide metrics
   * Requirements: 6.1, 6.3
   */
  static async getSystemMetrics() {
    try {
      // Get total Mother Influencers
      const motherInfluencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('type', '==', 'mother')
        .get();

      // Get total Mini Influencers
      const miniInfluencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('type', '==', 'mini')
        .get();

      // Get total earnings from all commissions
      const commissionsSnapshot = await adminDb
        .collection(this.COMMISSIONS_COLLECTION)
        .get();

      const totalEarnings = commissionsSnapshot.docs
        .map(doc => doc.data() as Commission)
        .reduce((sum, commission) => sum + commission.amount, 0);

      // Get total activities
      const activitiesSnapshot = await adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .get();

      const totalActivities = activitiesSnapshot.size;

      // Calculate average network size
      const totalMotherInfluencers = motherInfluencersSnapshot.size;
      const totalMiniInfluencers = miniInfluencersSnapshot.size;
      const averageNetworkSize = totalMotherInfluencers > 0 
        ? totalMiniInfluencers / totalMotherInfluencers 
        : 0;

      return {
        totalMotherInfluencers,
        totalMiniInfluencers,
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        totalActivities,
        averageNetworkSize: parseFloat(averageNetworkSize.toFixed(2))
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw error;
    }
  }

  /**
   * Get all Mother Influencers with their referral trees
   * Requirements: 6.1
   */
  static async getAllMotherInfluencersWithTrees(): Promise<ReferralTree[]> {
    try {
      // Get all Mother Influencers
      const motherInfluencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('type', '==', 'mother')
        .orderBy('totalEarnings', 'desc')
        .get();

      const referralTrees: ReferralTree[] = [];

      for (const doc of motherInfluencersSnapshot.docs) {
        const motherInfluencer = { id: doc.id, ...doc.data() } as Influencer;

        // Get Mini Influencers for this Mother Influencer
        const miniInfluencersSnapshot = await adminDb
          .collection(this.INFLUENCERS_COLLECTION)
          .where('parentInfluencerId', '==', doc.id)
          .orderBy('totalEarnings', 'desc')
          .get();

        const miniInfluencers = miniInfluencersSnapshot.docs.map(miniDoc => ({
          id: miniDoc.id,
          ...miniDoc.data()
        })) as Influencer[];

        // Calculate total network earnings
        const totalNetworkEarnings = miniInfluencers.reduce(
          (sum, mini) => sum + (mini.totalEarnings || 0), 
          motherInfluencer.totalEarnings || 0
        );

        // Get total network activities
        const networkActivitiesSnapshot = await adminDb
          .collection(this.ACTIVITIES_COLLECTION)
          .where('influencerId', 'in', [doc.id, ...miniInfluencers.map(m => m.id)])
          .get();

        const totalNetworkActivities = networkActivitiesSnapshot.size;

        referralTrees.push({
          motherInfluencer,
          miniInfluencers,
          totalNetworkEarnings: parseFloat(totalNetworkEarnings.toFixed(2)),
          totalNetworkActivities
        });
      }

      return referralTrees;
    } catch (error) {
      console.error('Error getting Mother Influencers with trees:', error);
      return [];
    }
  }

  /**
   * Get recent system-wide activities
   * Requirements: 6.1
   */
  static async getRecentSystemActivities(limit: number = 50): Promise<Activity[]> {
    try {
      const snapshot = await adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
    } catch (error) {
      console.error('Error getting recent system activities:', error);
      return [];
    }
  }

  /**
   * Get payout queue for admin review
   * Requirements: 6.1
   */
  static async getPayoutQueue(): Promise<PayoutResult[]> {
    try {
      const snapshot = await adminDb
        .collection(this.PAYOUTS_COLLECTION)
        .where('status', 'in', ['pending', 'failed'])
        .orderBy('processedAt', 'desc')
        .limit(20)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PayoutResult[];
    } catch (error) {
      console.error('Error getting payout queue:', error);
      return [];
    }
  }

  /**
   * Get system performance analytics for a time period
   * Requirements: 6.3
   */
  static async getSystemPerformanceAnalytics(period: TimePeriod) {
    try {
      // Get activities in period
      const activitiesSnapshot = await adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .where('timestamp', '>=', period.start)
        .where('timestamp', '<=', period.end)
        .get();

      const activities = activitiesSnapshot.docs.map(doc => doc.data() as Activity);

      // Get commissions in period
      const commissionsSnapshot = await adminDb
        .collection(this.COMMISSIONS_COLLECTION)
        .where('createdAt', '>=', period.start)
        .where('createdAt', '<=', period.end)
        .get();

      const commissions = commissionsSnapshot.docs.map(doc => doc.data() as Commission);

      // Calculate metrics
      const totalRevenue = commissions.reduce((sum, c) => sum + c.amount, 0);
      const totalActivities = activities.length;
      const conversionRate = this.calculateSystemConversionRate(activities);
      const averageOrderValue = this.calculateAverageOrderValue(activities);

      // Get growth metrics
      const growthMetrics = await this.calculateGrowthMetrics(period);

      return {
        period,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalActivities,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        growthMetrics
      };
    } catch (error) {
      console.error('Error getting system performance analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate system-wide conversion rate
   */
  private static calculateSystemConversionRate(activities: Activity[]): number {
    const clicks = activities.filter(a => a.type === 'click').length;
    const conversions = activities.filter(a => a.type === 'conversion' || a.type === 'purchase').length;
    
    return clicks > 0 ? (conversions / clicks) * 100 : 0;
  }

  /**
   * Calculate average order value from purchase activities
   */
  private static calculateAverageOrderValue(activities: Activity[]): number {
    const purchases = activities.filter(a => a.type === 'purchase' && a.metadata?.amount);
    
    if (purchases.length === 0) return 0;
    
    const totalValue = purchases.reduce((sum, p) => sum + (p.metadata?.amount || 0), 0);
    return totalValue / purchases.length;
  }

  /**
   * Calculate growth metrics comparing to previous period
   */
  private static async calculateGrowthMetrics(period: TimePeriod) {
    try {
      // Calculate previous period
      const periodDuration = period.end.getTime() - period.start.getTime();
      const previousPeriodStart = new Date(period.start.getTime() - periodDuration);
      const previousPeriodEnd = new Date(period.start.getTime());

      // Get current period metrics
      const currentInfluencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('createdAt', '>=', period.start)
        .where('createdAt', '<=', period.end)
        .get();

      // Get previous period metrics
      const previousInfluencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('createdAt', '>=', previousPeriodStart)
        .where('createdAt', '<=', previousPeriodEnd)
        .get();

      const currentNewInfluencers = currentInfluencersSnapshot.size;
      const previousNewInfluencers = previousInfluencersSnapshot.size;

      const influencerGrowthRate = previousNewInfluencers > 0 
        ? ((currentNewInfluencers - previousNewInfluencers) / previousNewInfluencers) * 100
        : 0;

      return {
        influencerGrowthRate: parseFloat(influencerGrowthRate.toFixed(2)),
        newInfluencersThisPeriod: currentNewInfluencers,
        newInfluencersPreviousPeriod: previousNewInfluencers
      };
    } catch (error) {
      console.error('Error calculating growth metrics:', error);
      return {
        influencerGrowthRate: 0,
        newInfluencersThisPeriod: 0,
        newInfluencersPreviousPeriod: 0
      };
    }
  }

  /**
   * Get detailed influencer information for admin view
   * Requirements: 6.1
   */
  static async getInfluencerDetails(influencerId: string) {
    try {
      const influencerDoc = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(influencerId)
        .get();

      if (!influencerDoc.exists) {
        throw new Error('Influencer not found');
      }

      const influencer = { id: influencerDoc.id, ...influencerDoc.data() } as Influencer;

      // Get recent activities
      const recentActivities = await HierarchicalAnalyticsService.getActivityTimeline(influencerId, 20);

      // Get metrics for last 30 days
      const period: TimePeriod = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
        granularity: 'day'
      };

      const metrics = await HierarchicalAnalyticsService.getInfluencerMetrics(influencerId, period);

      // If Mother Influencer, get network data
      let networkData = null;
      if (influencer.type === 'mother') {
        networkData = await HierarchicalAnalyticsService.getNetworkPerformance(influencerId);
      }

      return {
        influencer,
        metrics,
        networkData,
        recentActivities
      };
    } catch (error) {
      console.error('Error getting influencer details:', error);
      throw error;
    }
  }

  /**
   * Search influencers by various criteria
   * Requirements: 6.1
   */
  static async searchInfluencers(
    searchTerm: string,
    type?: 'mother' | 'mini',
    status?: 'active' | 'suspended' | 'pending',
    limit: number = 20
  ): Promise<Influencer[]> {
    try {
      let query = adminDb.collection(this.INFLUENCERS_COLLECTION);

      // Apply filters
      if (type) {
        query = query.where('type', '==', type);
      }

      if (status) {
        query = query.where('status', '==', status);
      }

      // For now, get all matching documents and filter by search term
      // In production, you might want to use Algolia or similar for full-text search
      const snapshot = await query.limit(limit * 2).get(); // Get more to account for filtering

      const influencers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as Influencer)
        .filter(influencer => {
          // If no search term, return all results that match type/status filters
          if (!searchTerm || searchTerm.trim() === '') {
            return true;
          }
          // Otherwise, filter by search term
          return influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 influencer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 (influencer.masterReferralCode && influencer.masterReferralCode.toLowerCase().includes(searchTerm.toLowerCase()));
        })
        .slice(0, limit);

      return influencers;
    } catch (error) {
      console.error('Error searching influencers:', error);
      return [];
    }
  }

  /**
   * Update influencer status (enable/disable/suspend)
   * Requirements: 6.2
   */
  static async updateInfluencerStatus(
    influencerId: string,
    status: 'active' | 'suspended' | 'pending',
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const influencerRef = adminDb.collection(this.INFLUENCERS_COLLECTION).doc(influencerId);
      
      // Check if influencer exists
      const influencerDoc = await influencerRef.get();
      if (!influencerDoc.exists) {
        return {
          success: false,
          message: 'Influencer not found'
        };
      }

      // Update status
      await influencerRef.update({
        status,
        updatedAt: new Date(),
        statusChangeReason: reason || `Status changed to ${status}`,
        statusChangedBy: 'admin',
        statusChangedAt: new Date()
      });

      // Log the status change
      await this.logAdminAction({
        action: 'status_change',
        targetId: influencerId,
        targetType: 'influencer',
        details: {
          oldStatus: influencerDoc.data()?.status,
          newStatus: status,
          reason
        },
        performedBy: 'admin',
        timestamp: new Date()
      });

      return {
        success: true,
        message: `Influencer status updated to ${status}`
      };
    } catch (error) {
      console.error('Error updating influencer status:', error);
      return {
        success: false,
        message: 'Failed to update influencer status'
      };
    }
  }

  /**
   * Override commission calculation for dispute handling
   * Requirements: 6.4
   */
  static async overrideCommission(
    commissionId: string,
    newAmount: number,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const commissionRef = adminDb.collection(this.COMMISSIONS_COLLECTION).doc(commissionId);
      
      // Check if commission exists
      const commissionDoc = await commissionRef.get();
      if (!commissionDoc.exists) {
        return {
          success: false,
          message: 'Commission not found'
        };
      }

      const originalAmount = commissionDoc.data()?.amount;

      // Update commission with override
      await commissionRef.update({
        amount: newAmount,
        originalAmount: originalAmount,
        overridden: true,
        overrideReason: reason,
        overriddenBy: 'admin',
        overriddenAt: new Date(),
        updatedAt: new Date()
      });

      // Log the override action
      await this.logAdminAction({
        action: 'commission_override',
        targetId: commissionId,
        targetType: 'commission',
        details: {
          originalAmount,
          newAmount,
          reason
        },
        performedBy: 'admin',
        timestamp: new Date()
      });

      return {
        success: true,
        message: 'Commission successfully overridden'
      };
    } catch (error) {
      console.error('Error overriding commission:', error);
      return {
        success: false,
        message: 'Failed to override commission'
      };
    }
  }

  /**
   * Adjust payout amount for dispute handling
   * Requirements: 6.4
   */
  static async adjustPayout(
    payoutId: string,
    adjustmentAmount: number,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const payoutRef = adminDb.collection(this.PAYOUTS_COLLECTION).doc(payoutId);
      
      // Check if payout exists
      const payoutDoc = await payoutRef.get();
      if (!payoutDoc.exists) {
        return {
          success: false,
          message: 'Payout not found'
        };
      }

      const originalAmount = payoutDoc.data()?.amount;
      const newAmount = originalAmount + adjustmentAmount;

      // Update payout with adjustment
      await payoutRef.update({
        amount: newAmount,
        originalAmount: originalAmount,
        adjustmentAmount: adjustmentAmount,
        adjusted: true,
        adjustmentReason: reason,
        adjustedBy: 'admin',
        adjustedAt: new Date(),
        updatedAt: new Date()
      });

      // Log the adjustment action
      await this.logAdminAction({
        action: 'payout_adjustment',
        targetId: payoutId,
        targetType: 'payout',
        details: {
          originalAmount,
          adjustmentAmount,
          newAmount,
          reason
        },
        performedBy: 'admin',
        timestamp: new Date()
      });

      return {
        success: true,
        message: 'Payout successfully adjusted'
      };
    } catch (error) {
      console.error('Error adjusting payout:', error);
      return {
        success: false,
        message: 'Failed to adjust payout'
      };
    }
  }

  /**
   * Bulk update influencer statuses
   * Requirements: 6.2
   */
  static async bulkUpdateInfluencerStatus(
    influencerIds: string[],
    status: 'active' | 'suspended' | 'pending',
    reason?: string
  ): Promise<{ success: boolean; message: string; results: any[] }> {
    try {
      const results = [];
      const batch = adminDb.batch();

      for (const influencerId of influencerIds) {
        const influencerRef = adminDb.collection(this.INFLUENCERS_COLLECTION).doc(influencerId);
        
        batch.update(influencerRef, {
          status,
          updatedAt: new Date(),
          statusChangeReason: reason || `Bulk status change to ${status}`,
          statusChangedBy: 'admin',
          statusChangedAt: new Date()
        });

        results.push({
          influencerId,
          success: true,
          newStatus: status
        });
      }

      await batch.commit();

      // Log bulk action
      await this.logAdminAction({
        action: 'bulk_status_change',
        targetId: 'multiple',
        targetType: 'influencer',
        details: {
          influencerIds,
          newStatus: status,
          reason,
          count: influencerIds.length
        },
        performedBy: 'admin',
        timestamp: new Date()
      });

      return {
        success: true,
        message: `Successfully updated ${influencerIds.length} influencers to ${status}`,
        results
      };
    } catch (error) {
      console.error('Error bulk updating influencer status:', error);
      return {
        success: false,
        message: 'Failed to bulk update influencer statuses',
        results: []
      };
    }
  }

  /**
   * Log admin actions for audit trail
   * Requirements: 6.4
   */
  private static async logAdminAction(action: {
    action: string;
    targetId: string;
    targetType: string;
    details: any;
    performedBy: string;
    timestamp: Date;
  }): Promise<void> {
    try {
      await adminDb.collection('hierarchical_admin_logs').add({
        ...action,
        id: `${action.action}_${Date.now()}`
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw error as this is just logging
    }
  }

  /**
   * Get admin action logs for audit purposes
   * Requirements: 6.4
   */
  static async getAdminLogs(
    limit: number = 50,
    targetId?: string,
    action?: string
  ): Promise<any[]> {
    try {
      let query = adminDb
        .collection('hierarchical_admin_logs')
        .orderBy('timestamp', 'desc')
        .limit(limit);

      if (targetId) {
        query = query.where('targetId', '==', targetId);
      }

      if (action) {
        query = query.where('action', '==', action);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting admin logs:', error);
      return [];
    }
  }

  /**
   * Get dispute cases that need admin attention
   * Requirements: 6.4
   */
  static async getDisputeCases(): Promise<any[]> {
    try {
      // Get commissions with disputes
      const disputedCommissionsSnapshot = await adminDb
        .collection(this.COMMISSIONS_COLLECTION)
        .where('disputed', '==', true)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const disputedCommissions = disputedCommissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'commission',
        ...doc.data()
      }));

      // Get failed payouts that might need attention
      const failedPayoutsSnapshot = await adminDb
        .collection(this.PAYOUTS_COLLECTION)
        .where('status', '==', 'failed')
        .orderBy('processedAt', 'desc')
        .limit(20)
        .get();

      const failedPayouts = failedPayoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'payout',
        ...doc.data()
      }));

      return [...disputedCommissions, ...failedPayouts];
    } catch (error) {
      console.error('Error getting dispute cases:', error);
      return [];
    }
  }
}