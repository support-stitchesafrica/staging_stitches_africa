import { 
  MotherInfluencerDashboardData,
  MiniInfluencerDashboardData,
  AdminDashboardData,
  Influencer,
  InfluencerMetrics,
  NetworkMetrics,
  Activity,
  EarningsHistory,
  ReferralCode,
  TimePeriod,
  HierarchicalReferralErrorCode
} from '../../../types/hierarchical-referral';
import { adminDb } from '../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { HierarchicalReferralService } from './referral-service';
import { HierarchicalCommissionService } from './commission-service';
import { HierarchicalAnalyticsService } from './analytics-service';
import { HierarchicalActivityTrackingService } from './activity-tracking-service';

/**
 * DashboardService - Service for aggregating dashboard data
 * 
 * Implements Requirements:
 * - 3.1: Display total earnings from direct and indirect referrals
 * - 3.2: Separate revenue from own referrals and Mini_Influencer commissions
 * - 3.3: Display each Mini_Influencer's clicks, conversions, and revenue
 * - 3.4: Show all active and inactive Sub_Referral_Codes
 * - 3.5: Real-time dashboard updates (5-minute maximum latency)
 */
export class HierarchicalDashboardService {
  private static readonly INFLUENCERS_COLLECTION = 'hierarchical_influencers';
  private static readonly REFERRAL_CODES_COLLECTION = 'hierarchical_referral_codes';
  private static readonly ACTIVITIES_COLLECTION = 'hierarchical_activities';
  private static readonly COMMISSIONS_COLLECTION = 'hierarchical_commissions';
  private static readonly DASHBOARD_CACHE_COLLECTION = 'hierarchical_dashboard_cache';
  private static readonly CACHE_TTL_MINUTES = 5; // 5-minute cache for real-time requirement

  /**
   * Get comprehensive dashboard data for Mother Influencer
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  static async getMotherInfluencerDashboard(influencerId: string): Promise<MotherInfluencerDashboardData> {
    try {
      // Check cache first for real-time performance
      const cachedData = await this.getCachedDashboardData(influencerId, 'mother');
      if (cachedData) {
        return cachedData as MotherInfluencerDashboardData;
      }

      // Get influencer data
      const influencerDoc = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(influencerId)
        .get();

      if (!influencerDoc.exists) {
        throw {
          code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
          message: 'Mother Influencer not found'
        };
      }

      const influencer = { id: influencerDoc.id, ...influencerDoc.data() } as Influencer;

      if (influencer.type !== 'mother') {
        throw {
          code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
          message: 'Only Mother Influencers can access this dashboard'
        };
      }

      // Get time period for current metrics (last 30 days)
      const period: TimePeriod = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
        granularity: 'day'
      };

      // Get comprehensive metrics
      const metrics = await HierarchicalAnalyticsService.getInfluencerMetrics(influencerId, period);
      
      // Get network metrics
      const networkMetrics = await HierarchicalAnalyticsService.getNetworkPerformance(influencerId);

      // Get recent activities (last 50)
      const recentActivities = await HierarchicalActivityTrackingService.getActivities(influencerId, {
        limit: 50,
        orderBy: 'timestamp',
        orderDirection: 'desc',
        includeMetadata: true
      });

      // Get earnings history
      const earningsHistory = await HierarchicalCommissionService.getEarningsHistory(influencerId);

      // Get all referral codes created by this Mother Influencer
      const referralCodes = await this.getReferralCodesForInfluencer(influencerId);

      const dashboardData: MotherInfluencerDashboardData = {
        influencer,
        metrics,
        networkMetrics,
        recentActivities,
        earningsHistory,
        referralCodes
      };

      // Cache the data for real-time performance
      await this.cacheDashboardData(influencerId, 'mother', dashboardData);

      return dashboardData;
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get Mother Influencer dashboard data',
        details: error
      };
    }
  }

  /**
   * Get dashboard data for Mini Influencer
   * Requirements: 2.3, 2.5
   */
  static async getMiniInfluencerDashboard(influencerId: string): Promise<MiniInfluencerDashboardData> {
    try {
      // Check cache first
      const cachedData = await this.getCachedDashboardData(influencerId, 'mini');
      if (cachedData) {
        return cachedData as MiniInfluencerDashboardData;
      }

      // Get influencer data
      const influencerDoc = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(influencerId)
        .get();

      if (!influencerDoc.exists) {
        throw {
          code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
          message: 'Mini Influencer not found'
        };
      }

      const influencer = { id: influencerDoc.id, ...influencerDoc.data() } as Influencer;

      if (influencer.type !== 'mini') {
        throw {
          code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
          message: 'Only Mini Influencers can access this dashboard'
        };
      }

      // Get Mother Influencer data
      let motherInfluencer: Influencer | null = null;
      if (influencer.parentInfluencerId) {
        const motherDoc = await adminDb
          .collection(this.INFLUENCERS_COLLECTION)
          .doc(influencer.parentInfluencerId)
          .get();
        
        if (motherDoc.exists) {
          motherInfluencer = { id: motherDoc.id, ...motherDoc.data() } as Influencer;
        }
      }

      if (!motherInfluencer) {
        throw {
          code: HierarchicalReferralErrorCode.INVALID_INPUT,
          message: 'Mother Influencer not found for this Mini Influencer'
        };
      }

      // Get personal metrics
      const period: TimePeriod = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
        granularity: 'day'
      };

      const metrics = await HierarchicalAnalyticsService.getInfluencerMetrics(influencerId, period);

      // Calculate rank among siblings
      const siblingInfluencers = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('parentInfluencerId', '==', influencer.parentInfluencerId)
        .orderBy('totalEarnings', 'desc')
        .get();

      const rank = siblingInfluencers.docs.findIndex(doc => doc.id === influencerId) + 1;

      const personalMetrics = {
        totalEarnings: metrics.totalEarnings,
        totalActivities: metrics.totalActivities,
        conversionRate: metrics.conversionRate,
        rank
      };

      // Get recent activities
      const recentActivities = await HierarchicalActivityTrackingService.getActivities(influencerId, {
        limit: 30,
        orderBy: 'timestamp',
        orderDirection: 'desc',
        includeMetadata: true
      });

      // Get earnings history
      const earningsHistory = await HierarchicalCommissionService.getEarningsHistory(influencerId);

      const dashboardData: MiniInfluencerDashboardData = {
        influencer,
        motherInfluencer,
        personalMetrics,
        recentActivities,
        earningsHistory
      };

      // Cache the data
      await this.cacheDashboardData(influencerId, 'mini', dashboardData);

      return dashboardData;
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get Mini Influencer dashboard data',
        details: error
      };
    }
  }

  /**
   * Get admin dashboard data with system-wide metrics
   * Requirements: 6.1, 6.3
   */
  static async getAdminDashboard(): Promise<AdminDashboardData> {
    try {
      // Check cache first
      const cachedData = await this.getCachedDashboardData('admin', 'admin');
      if (cachedData) {
        return cachedData as AdminDashboardData;
      }

      // Get system metrics
      const motherInfluencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('type', '==', 'mother')
        .get();

      const miniInfluencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('type', '==', 'mini')
        .get();

      const totalMotherInfluencers = motherInfluencersSnapshot.size;
      const totalMiniInfluencers = miniInfluencersSnapshot.size;

      // Calculate total earnings
      const allInfluencers = [
        ...motherInfluencersSnapshot.docs.map(doc => doc.data()),
        ...miniInfluencersSnapshot.docs.map(doc => doc.data())
      ];

      const totalEarnings = allInfluencers.reduce((sum, inf) => sum + (inf.totalEarnings || 0), 0);

      // Get total activities count (approximate)
      const activitiesSnapshot = await adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .limit(1000)
        .get();

      const totalActivities = activitiesSnapshot.size; // Approximate count

      // Calculate average network size
      const motherInfluencers = motherInfluencersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      let totalNetworkSize = 0;

      for (const mother of motherInfluencers) {
        const miniCount = await adminDb
          .collection(this.INFLUENCERS_COLLECTION)
          .where('parentInfluencerId', '==', mother.id)
          .get();
        totalNetworkSize += miniCount.size;
      }

      const averageNetworkSize = totalMotherInfluencers > 0 ? totalNetworkSize / totalMotherInfluencers : 0;

      const systemMetrics = {
        totalMotherInfluencers,
        totalMiniInfluencers,
        totalEarnings,
        totalActivities,
        averageNetworkSize: parseFloat(averageNetworkSize.toFixed(2))
      };

      // Get top performers
      const topPerformers = await HierarchicalAnalyticsService.getTopPerformers(10);

      // Get recent activities across the system
      const recentActivitiesSnapshot = await adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      const recentActivities = recentActivitiesSnapshot.docs.map(doc => doc.data() as Activity);

      // Get payout queue (pending payouts)
      const payoutQueue: any[] = []; // Would be populated from actual payout service

      const dashboardData: AdminDashboardData = {
        systemMetrics,
        topPerformers,
        recentActivities,
        payoutQueue
      };

      // Cache the data
      await this.cacheDashboardData('admin', 'admin', dashboardData);

      return dashboardData;
    } catch (error: any) {
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get admin dashboard data',
        details: error
      };
    }
  }

  /**
   * Get detailed Mini Influencer metrics for Mother Influencer dashboard
   * Requirements: 3.3 - Display each Mini_Influencer's clicks, conversions, and revenue
   */
  static async getMiniInfluencerDetailedMetrics(
    motherInfluencerId: string,
    period?: TimePeriod
  ): Promise<Array<{
    influencer: Influencer;
    clicks: number;
    conversions: number;
    revenue: number;
    activities: Activity[];
    conversionRate: number;
    earnings: number;
  }>> {
    try {
      // Default to last 30 days if no period specified
      const defaultPeriod: TimePeriod = period || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
        granularity: 'day'
      };

      // Get all Mini Influencers under this Mother Influencer
      const miniInfluencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('parentInfluencerId', '==', motherInfluencerId)
        .get();

      const detailedMetrics = [];

      for (const doc of miniInfluencersSnapshot.docs) {
        const influencer = { id: doc.id, ...doc.data() } as Influencer;

        // Get activities for this Mini Influencer in the period
        const activities = await HierarchicalActivityTrackingService.getActivities(influencer.id, {
          startDate: defaultPeriod.start,
          endDate: defaultPeriod.end,
          includeMetadata: true
        });

        // Calculate metrics
        const clicks = activities.filter(a => a.type === 'click').length;
        const conversions = activities.filter(a => a.type === 'conversion').length;
        const purchases = activities.filter(a => a.type === 'purchase');
        
        const revenue = purchases.reduce((sum, activity) => {
          return sum + (activity.metadata.amount || 0);
        }, 0);

        const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

        // Get earnings from commissions
        const commissionsSnapshot = await adminDb
          .collection(this.COMMISSIONS_COLLECTION)
          .where('miniInfluencerId', '==', influencer.id)
          .where('createdAt', '>=', Timestamp.fromDate(defaultPeriod.start))
          .where('createdAt', '<=', Timestamp.fromDate(defaultPeriod.end))
          .get();

        const earnings = commissionsSnapshot.docs
          .map(doc => doc.data())
          .reduce((sum, commission) => sum + commission.amount, 0);

        detailedMetrics.push({
          influencer,
          clicks,
          conversions,
          revenue,
          activities,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          earnings
        });
      }

      // Sort by revenue descending
      detailedMetrics.sort((a, b) => b.revenue - a.revenue);

      return detailedMetrics;
    } catch (error) {
      console.error('Error getting Mini Influencer detailed metrics:', error);
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get Mini Influencer detailed metrics',
        details: error
      };
    }
  }

  /**
   * Get referral code status tracking for Mother Influencer
   * Requirements: 3.4 - Show all active and inactive Sub_Referral_Codes
   */
  static async getReferralCodeStatus(motherInfluencerId: string): Promise<Array<{
    code: ReferralCode;
    assignedInfluencer?: Influencer;
    usageMetrics: {
      totalClicks: number;
      totalConversions: number;
      totalRevenue: number;
      lastUsed?: Date;
    };
  }>> {
    try {
      // Get all referral codes created by this Mother Influencer
      const referralCodes = await this.getReferralCodesForInfluencer(motherInfluencerId);

      const codeStatusList = [];

      for (const code of referralCodes) {
        let assignedInfluencer: Influencer | undefined;

        // If code is assigned, get the assigned influencer
        if (code.assignedTo) {
          const assignedDoc = await adminDb
            .collection(this.INFLUENCERS_COLLECTION)
            .doc(code.assignedTo)
            .get();

          if (assignedDoc.exists) {
            assignedInfluencer = { id: assignedDoc.id, ...assignedDoc.data() } as Influencer;
          }
        }

        // Get usage metrics for this code
        const activitiesSnapshot = await adminDb
          .collection(this.ACTIVITIES_COLLECTION)
          .where('referralCode', '==', code.code)
          .get();

        const activities = activitiesSnapshot.docs.map(doc => doc.data() as Activity);

        const totalClicks = activities.filter(a => a.type === 'click').length;
        const totalConversions = activities.filter(a => a.type === 'conversion').length;
        const purchases = activities.filter(a => a.type === 'purchase');
        
        const totalRevenue = purchases.reduce((sum, activity) => {
          return sum + (activity.metadata.amount || 0);
        }, 0);

        // Get last used date
        const lastUsed = activities.length > 0 ? 
          new Date(Math.max(...activities.map(a => a.timestamp.toDate().getTime()))) : 
          undefined;

        const usageMetrics = {
          totalClicks,
          totalConversions,
          totalRevenue,
          lastUsed
        };

        codeStatusList.push({
          code,
          assignedInfluencer,
          usageMetrics
        });
      }

      // Sort by creation date descending
      codeStatusList.sort((a, b) => 
        b.code.createdAt.toDate().getTime() - a.code.createdAt.toDate().getTime()
      );

      return codeStatusList;
    } catch (error) {
      console.error('Error getting referral code status:', error);
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get referral code status',
        details: error
      };
    }
  }

  /**
   * Invalidate dashboard cache for real-time updates
   * Requirements: 3.5 - Real-time dashboard updates
   */
  static async invalidateDashboardCache(influencerId: string, type?: 'mother' | 'mini' | 'admin'): Promise<void> {
    try {
      if (type) {
        // Invalidate specific cache
        const cacheId = `${influencerId}_${type}`;
        await adminDb
          .collection(this.DASHBOARD_CACHE_COLLECTION)
          .doc(cacheId)
          .delete();
      } else {
        // Invalidate all caches for this influencer
        const cacheSnapshot = await adminDb
          .collection(this.DASHBOARD_CACHE_COLLECTION)
          .where('influencerId', '==', influencerId)
          .get();

        const batch = adminDb.batch();
        cacheSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
      }
    } catch (error) {
      console.error('Error invalidating dashboard cache:', error);
      // Don't throw error as cache invalidation is not critical
    }
  }

  /**
   * Get earnings breakdown for Mother Influencer
   * Requirements: 3.1, 3.2 - Display total earnings from direct and indirect referrals
   */
  static async getEarningsBreakdown(
    motherInfluencerId: string,
    period?: TimePeriod
  ): Promise<{
    totalEarnings: number;
    directEarnings: number;
    indirectEarnings: number;
    earningsByMiniInfluencer: Array<{
      miniInfluencer: Influencer;
      earnings: number;
      percentage: number;
    }>;
    earningsTimeline: Array<{
      date: Date;
      directEarnings: number;
      indirectEarnings: number;
      totalEarnings: number;
    }>;
  }> {
    try {
      // Default to last 30 days if no period specified
      const defaultPeriod: TimePeriod = period || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
        granularity: 'day'
      };

      // Get all commissions for this Mother Influencer in the period
      const commissionsSnapshot = await adminDb
        .collection(this.COMMISSIONS_COLLECTION)
        .where('motherInfluencerId', '==', motherInfluencerId)
        .where('createdAt', '>=', Timestamp.fromDate(defaultPeriod.start))
        .where('createdAt', '<=', Timestamp.fromDate(defaultPeriod.end))
        .get();

      const commissions = commissionsSnapshot.docs.map(doc => doc.data());

      // Calculate direct and indirect earnings
      const directEarnings = commissions
        .filter(c => c.type === 'direct')
        .reduce((sum, c) => sum + c.amount, 0);

      const indirectEarnings = commissions
        .filter(c => c.type === 'indirect')
        .reduce((sum, c) => sum + c.amount, 0);

      const totalEarnings = directEarnings + indirectEarnings;

      // Calculate earnings by Mini Influencer
      const earningsByMini = new Map<string, number>();
      
      commissions
        .filter(c => c.type === 'indirect' && c.miniInfluencerId)
        .forEach(c => {
          const current = earningsByMini.get(c.miniInfluencerId!) || 0;
          earningsByMini.set(c.miniInfluencerId!, current + c.amount);
        });

      const earningsByMiniInfluencer = [];
      for (const [miniId, earnings] of earningsByMini.entries()) {
        const miniDoc = await adminDb
          .collection(this.INFLUENCERS_COLLECTION)
          .doc(miniId)
          .get();

        if (miniDoc.exists) {
          const miniInfluencer = { id: miniDoc.id, ...miniDoc.data() } as Influencer;
          const percentage = totalEarnings > 0 ? (earnings / totalEarnings) * 100 : 0;

          earningsByMiniInfluencer.push({
            miniInfluencer,
            earnings,
            percentage: parseFloat(percentage.toFixed(2))
          });
        }
      }

      // Sort by earnings descending
      earningsByMiniInfluencer.sort((a, b) => b.earnings - a.earnings);

      // Create earnings timeline (simplified - daily aggregation)
      const earningsTimeline = [];
      const timelineMap = new Map<string, { direct: number; indirect: number }>();

      commissions.forEach(c => {
        const date = c.createdAt.toDate();
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const current = timelineMap.get(dateKey) || { direct: 0, indirect: 0 };
        
        if (c.type === 'direct') {
          current.direct += c.amount;
        } else {
          current.indirect += c.amount;
        }
        
        timelineMap.set(dateKey, current);
      });

      for (const [dateKey, earnings] of timelineMap.entries()) {
        earningsTimeline.push({
          date: new Date(dateKey),
          directEarnings: earnings.direct,
          indirectEarnings: earnings.indirect,
          totalEarnings: earnings.direct + earnings.indirect
        });
      }

      // Sort timeline by date
      earningsTimeline.sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        totalEarnings,
        directEarnings,
        indirectEarnings,
        earningsByMiniInfluencer,
        earningsTimeline
      };
    } catch (error) {
      console.error('Error getting earnings breakdown:', error);
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get earnings breakdown',
        details: error
      };
    }
  }

  /**
   * Helper method to get referral codes for an influencer
   */
  private static async getReferralCodesForInfluencer(influencerId: string): Promise<ReferralCode[]> {
    try {
      const snapshot = await adminDb
        .collection(this.REFERRAL_CODES_COLLECTION)
        .where('createdBy', '==', influencerId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as ReferralCode);
    } catch (error) {
      console.error('Error getting referral codes:', error);
      return [];
    }
  }

  /**
   * Helper method to get cached dashboard data
   * Requirements: 3.5 - 5-minute maximum latency
   */
  private static async getCachedDashboardData(
    influencerId: string, 
    type: 'mother' | 'mini' | 'admin'
  ): Promise<any | null> {
    try {
      const cacheId = `${influencerId}_${type}`;
      const cacheDoc = await adminDb
        .collection(this.DASHBOARD_CACHE_COLLECTION)
        .doc(cacheId)
        .get();

      if (!cacheDoc.exists) {
        return null;
      }

      const cacheData = cacheDoc.data();
      const cacheTime = cacheData?.cachedAt?.toDate();
      const now = new Date();

      // Check if cache is still valid (within TTL)
      if (cacheTime && (now.getTime() - cacheTime.getTime()) < (this.CACHE_TTL_MINUTES * 60 * 1000)) {
        return cacheData.data;
      }

      // Cache is expired, delete it
      await cacheDoc.ref.delete();
      return null;
    } catch (error) {
      console.error('Error getting cached dashboard data:', error);
      return null;
    }
  }

  /**
   * Helper method to cache dashboard data
   * Requirements: 3.5 - Real-time dashboard updates with caching
   */
  private static async cacheDashboardData(
    influencerId: string, 
    type: 'mother' | 'mini' | 'admin', 
    data: any
  ): Promise<void> {
    try {
      const cacheId = `${influencerId}_${type}`;
      
      await adminDb
        .collection(this.DASHBOARD_CACHE_COLLECTION)
        .doc(cacheId)
        .set({
          influencerId,
          type,
          data,
          cachedAt: Timestamp.now()
        });
    } catch (error) {
      console.error('Error caching dashboard data:', error);
      // Don't throw error as caching is not critical
    }
  }
}