import { 
  InfluencerMetrics, 
  NetworkMetrics, 
  Activity, 
  AnalyticsReport, 
  InfluencerRanking, 
  ReportCriteria,
  TimePeriod,
  MiniInfluencerPerformance,
  Commission
} from '../../../types/hierarchical-referral';
import { adminDb } from '../../firebase-admin';
import { HierarchicalExportService } from './export-service';

/**
 * AnalyticsService - Service for generating analytics and reports
 * Requirements: 7.1, 7.2
 */
export class HierarchicalAnalyticsService {
  private static readonly INFLUENCERS_COLLECTION = 'hierarchical_influencers';
  private static readonly ACTIVITIES_COLLECTION = 'hierarchical_activities';
  private static readonly COMMISSIONS_COLLECTION = 'hierarchical_commissions';

  /**
   * Get comprehensive metrics for an influencer with enhanced calculations
   * Requirements: 7.1, 7.2
   */
  static async getInfluencerMetrics(influencerId: string, period: TimePeriod): Promise<InfluencerMetrics> {
    try {
      // Get influencer
      const influencerDoc = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(influencerId)
        .get();

      if (!influencerDoc.exists) {
        throw new Error('Influencer not found');
      }

      const influencer = influencerDoc.data();

      // Get activities in period
      const activitiesSnapshot = await adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .where('influencerId', '==', influencerId)
        .where('timestamp', '>=', period.start)
        .where('timestamp', '<=', period.end)
        .get();

      const activities = activitiesSnapshot.docs.map(doc => doc.data() as Activity);

      // Enhanced conversion rate and CTR calculations
      const { conversionRate, clickThroughRate } = this.calculateConversionMetrics(activities);

      // Get commission data
      const commissionsSnapshot = await adminDb
        .collection(this.COMMISSIONS_COLLECTION)
        .where('motherInfluencerId', '==', influencerId)
        .where('createdAt', '>=', period.start)
        .where('createdAt', '<=', period.end)
        .get();

      const commissions = commissionsSnapshot.docs.map(doc => doc.data() as Commission);
      const directEarnings = commissions
        .filter(c => c.type === 'direct')
        .reduce((sum, c) => sum + c.amount, 0);
      const indirectEarnings = commissions
        .filter(c => c.type === 'indirect')
        .reduce((sum, c) => sum + c.amount, 0);

      // Get Mini Influencer data if this is a Mother Influencer
      let activeMiniInfluencers = 0;
      let totalMiniInfluencers = 0;
      let topPerformingMiniInfluencers: MiniInfluencerPerformance[] = [];

      if (influencer?.type === 'mother') {
        const miniInfluencersSnapshot = await adminDb
          .collection(this.INFLUENCERS_COLLECTION)
          .where('parentInfluencerId', '==', influencerId)
          .get();

        totalMiniInfluencers = miniInfluencersSnapshot.size;
        
        // Calculate active Mini Influencers (those with activities in period)
        const miniInfluencerIds = miniInfluencersSnapshot.docs.map(doc => doc.id);
        
        for (const miniId of miniInfluencerIds) {
          const miniActivitiesSnapshot = await adminDb
            .collection(this.ACTIVITIES_COLLECTION)
            .where('influencerId', '==', miniId)
            .where('timestamp', '>=', period.start)
            .where('timestamp', '<=', period.end)
            .limit(1)
            .get();

          if (!miniActivitiesSnapshot.empty) {
            activeMiniInfluencers++;
          }
        }

        // Get top performing Mini Influencers
        topPerformingMiniInfluencers = await this.getTopPerformingMiniInfluencers(influencerId, period, 5);
      }

      return {
        totalEarnings: directEarnings + indirectEarnings,
        directEarnings,
        indirectEarnings,
        totalActivities: activities.length,
        conversionRate,
        clickThroughRate,
        activeMiniInfluencers,
        totalMiniInfluencers,
        topPerformingMiniInfluencers
      };
    } catch (error) {
      console.error('Error getting influencer metrics:', error);
      throw error;
    }
  }

  /**
   * Enhanced conversion rate and CTR calculations
   * Requirements: 7.1
   */
  private static calculateConversionMetrics(activities: Activity[]): { conversionRate: number; clickThroughRate: number } {
    const totalActivities = activities.length;
    const views = activities.filter(a => a.type === 'view').length;
    const clicks = activities.filter(a => a.type === 'click').length;
    const conversions = activities.filter(a => a.type === 'conversion' || a.type === 'purchase').length;
    
    // CTR = (Clicks / Views) * 100
    const clickThroughRate = views > 0 ? (clicks / views) * 100 : 0;
    
    // Conversion Rate = (Conversions / Clicks) * 100
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

    return {
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      clickThroughRate: parseFloat(clickThroughRate.toFixed(2))
    };
  }

  /**
   * Get revenue trend analysis over time periods
   * Requirements: 7.1
   */
  static async getRevenueTrendAnalysis(
    influencerId: string, 
    period: TimePeriod
  ): Promise<{ date: string; revenue: number; activities: number }[]> {
    try {
      const trends: { date: string; revenue: number; activities: number }[] = [];
      
      // Generate date ranges based on granularity
      const dateRanges = this.generateDateRanges(period);
      
      for (const range of dateRanges) {
        // Get commissions for this date range
        const commissionsSnapshot = await adminDb
          .collection(this.COMMISSIONS_COLLECTION)
          .where('motherInfluencerId', '==', influencerId)
          .where('createdAt', '>=', range.start)
          .where('createdAt', '<=', range.end)
          .get();

        const revenue = commissionsSnapshot.docs
          .map(doc => doc.data() as Commission)
          .reduce((sum, c) => sum + c.amount, 0);

        // Get activities for this date range
        const activitiesSnapshot = await adminDb
          .collection(this.ACTIVITIES_COLLECTION)
          .where('influencerId', '==', influencerId)
          .where('timestamp', '>=', range.start)
          .where('timestamp', '<=', range.end)
          .get();

        trends.push({
          date: range.start.toISOString().split('T')[0],
          revenue: parseFloat(revenue.toFixed(2)),
          activities: activitiesSnapshot.size
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting revenue trend analysis:', error);
      return [];
    }
  }

  /**
   * Enhanced performance ranking system
   * Requirements: 7.2
   */
  static async getPerformanceRanking(
    motherInfluencerId: string,
    period: TimePeriod,
    limit: number = 10
  ): Promise<MiniInfluencerPerformance[]> {
    try {
      // Get Mini Influencers
      const miniInfluencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('parentInfluencerId', '==', motherInfluencerId)
        .get();

      const performances: MiniInfluencerPerformance[] = [];

      for (const doc of miniInfluencersSnapshot.docs) {
        const influencer = { id: doc.id, ...doc.data() } as any;
        
        // Get activities for this Mini Influencer in the period
        const activitiesSnapshot = await adminDb
          .collection(this.ACTIVITIES_COLLECTION)
          .where('influencerId', '==', doc.id)
          .where('timestamp', '>=', period.start)
          .where('timestamp', '<=', period.end)
          .get();

        const activities = activitiesSnapshot.docs.map(d => d.data() as Activity);
        
        // Get commissions for this Mini Influencer
        const commissionsSnapshot = await adminDb
          .collection(this.COMMISSIONS_COLLECTION)
          .where('miniInfluencerId', '==', doc.id)
          .where('createdAt', '>=', period.start)
          .where('createdAt', '<=', period.end)
          .get();

        const earnings = commissionsSnapshot.docs
          .map(d => d.data() as Commission)
          .reduce((sum, c) => sum + c.amount, 0);

        const { conversionRate } = this.calculateConversionMetrics(activities);

        performances.push({
          influencer,
          earnings: parseFloat(earnings.toFixed(2)),
          activities: activities.length,
          conversionRate,
          rank: 0 // Will be set after sorting
        });
      }

      // Enhanced ranking algorithm: weighted score based on earnings, activities, and conversion rate
      performances.forEach(perf => {
        // Weighted score: 50% earnings, 30% activities, 20% conversion rate
        const normalizedEarnings = perf.earnings;
        const normalizedActivities = perf.activities;
        const normalizedConversionRate = perf.conversionRate;
        
        perf.rank = (normalizedEarnings * 0.5) + (normalizedActivities * 0.3) + (normalizedConversionRate * 0.2);
      });

      // Sort by weighted score and assign final ranks
      performances.sort((a, b) => b.rank - a.rank);
      performances.forEach((perf, index) => {
        perf.rank = index + 1;
      });

      return performances.slice(0, limit);
    } catch (error) {
      console.error('Error getting performance ranking:', error);
      return [];
    }
  }

  /**
   * Generate date ranges based on period granularity
   */
  private static generateDateRanges(period: TimePeriod): { start: Date; end: Date }[] {
    const ranges: { start: Date; end: Date }[] = [];
    const current = new Date(period.start);
    
    while (current <= period.end) {
      const rangeStart = new Date(current);
      let rangeEnd: Date;
      
      switch (period.granularity) {
        case 'day':
          rangeEnd = new Date(current);
          rangeEnd.setDate(rangeEnd.getDate() + 1);
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          rangeEnd = new Date(current);
          rangeEnd.setDate(rangeEnd.getDate() + 7);
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          rangeEnd = new Date(current);
          rangeEnd.setMonth(rangeEnd.getMonth() + 1);
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          rangeEnd = new Date(current);
          rangeEnd.setDate(rangeEnd.getDate() + 1);
          current.setDate(current.getDate() + 1);
      }
      
      // Ensure we don't exceed the period end
      if (rangeEnd > period.end) {
        rangeEnd = new Date(period.end);
      }
      
      ranges.push({ start: rangeStart, end: rangeEnd });
      
      if (rangeEnd >= period.end) break;
    }
    
    return ranges;
  }

  /**
   * Get network performance metrics for a Mother Influencer
   */
  static async getNetworkPerformance(motherInfluencerId: string): Promise<NetworkMetrics> {
    try {
      // Get all Mini Influencers
      const miniInfluencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('parentInfluencerId', '==', motherInfluencerId)
        .get();

      const miniInfluencers = miniInfluencersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const totalNetworkSize = miniInfluencers.length;
      const totalNetworkEarnings = miniInfluencers.reduce((sum, mini) => sum + (mini.totalEarnings || 0), 0);
      const averageEarningsPerMini = totalNetworkSize > 0 ? totalNetworkEarnings / totalNetworkSize : 0;

      // Calculate growth rate (simplified - would need historical data)
      const growthRate = 0; // Placeholder

      // Calculate retention rate (simplified - would need historical data)
      const retentionRate = 0; // Placeholder

      // Get top performers
      const topPerformers = await this.getTopPerformingMiniInfluencers(
        motherInfluencerId, 
        { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date(), granularity: 'day' }, 
        10
      );

      return {
        totalNetworkSize,
        totalNetworkEarnings,
        averageEarningsPerMini: parseFloat(averageEarningsPerMini.toFixed(2)),
        topPerformers,
        growthRate,
        retentionRate
      };
    } catch (error) {
      console.error('Error getting network performance:', error);
      throw error;
    }
  }

  /**
   * Get activity timeline for an influencer
   */
  static async getActivityTimeline(influencerId: string, limit?: number): Promise<Activity[]> {
    try {
      let query = adminDb
        .collection(this.ACTIVITIES_COLLECTION)
        .where('influencerId', '==', influencerId)
        .orderBy('timestamp', 'desc');

      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => doc.data() as Activity);
    } catch (error) {
      console.error('Error getting activity timeline:', error);
      return [];
    }
  }

  /**
   * Generate analytics report with enhanced data
   * Requirements: 6.5
   */
  static async generateReport(criteria: ReportCriteria): Promise<AnalyticsReport> {
    try {
      let reportData: any = {};

      if (criteria.influencerId) {
        // Individual influencer report
        const metrics = await this.getInfluencerMetrics(criteria.influencerId, criteria.period);
        const revenueTrends = await this.getRevenueTrendAnalysis(criteria.influencerId, criteria.period);
        
        reportData = {
          influencerId: criteria.influencerId,
          metrics,
          revenueTrends,
          period: criteria.period
        };

        if (criteria.includeSubInfluencers) {
          const performanceRanking = await this.getPerformanceRanking(criteria.influencerId, criteria.period);
          reportData.subInfluencerPerformance = performanceRanking;
        }
      } else {
        // System-wide report
        const topPerformers = await this.getTopPerformers(10);
        reportData = {
          systemMetrics: {
            topPerformers,
            period: criteria.period
          }
        };
      }

      const report: AnalyticsReport = {
        id: `report_${Date.now()}`,
        type: criteria.influencerId ? 'influencer' : 'system',
        period: criteria.period,
        data: reportData,
        generatedAt: new Date() as any,
        requestedBy: criteria.influencerId || 'system'
      };

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Export report data to CSV format using enhanced export service
   * Requirements: 6.5
   */
  static async exportReportToCSV(report: AnalyticsReport): Promise<string> {
    try {
      return await HierarchicalExportService.exportAnalyticsReportToCSV(report);
    } catch (error) {
      console.error('Error exporting report to CSV:', error);
      throw error;
    }
  }

  /**
   * Export influencer metrics to CSV format
   * Requirements: 6.5
   */
  static exportInfluencerMetricsToCSV(
    influencerId: string, 
    metrics: InfluencerMetrics, 
    period: TimePeriod
  ): string {
    return HierarchicalExportService.exportInfluencerMetricsToCSV(
      influencerId, 
      metrics, 
      { start: period.start, end: period.end }
    );
  }

  /**
   * Export performance ranking to CSV format
   * Requirements: 6.5
   */
  static exportPerformanceRankingToCSV(
    motherInfluencerId: string,
    ranking: MiniInfluencerPerformance[],
    period: TimePeriod
  ): string {
    return HierarchicalExportService.exportPerformanceRankingToCSV(
      motherInfluencerId,
      ranking,
      { start: period.start, end: period.end }
    );
  }

  /**
   * Validate CSV data format and content
   * Requirements: 6.5
   */
  static validateCSVExport(csvContent: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if content is empty
    if (!csvContent || csvContent.trim().length === 0) {
      errors.push('CSV content is empty');
      return { isValid: false, errors };
    }

    // Check if content has at least header and one data row
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      errors.push('CSV must have at least header and one data row');
      return { isValid: false, errors };
    }

    // Check if content contains comma-separated values
    const hasValidHeaders = lines.some(line => line.includes(','));
    if (!hasValidHeaders) {
      errors.push('CSV content must contain comma-separated values');
      return { isValid: false, errors };
    }

    // Additional validation can be added here
    // For now, if we pass basic checks, it's valid
    return { isValid: true, errors: [] };
  }

  /**
   * Get top performers across the system
   */
  static async getTopPerformers(limit: number): Promise<InfluencerRanking[]> {
    try {
      // Get all influencers ordered by total earnings
      const snapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .orderBy('totalEarnings', 'desc')
        .limit(limit)
        .get();

      const rankings: InfluencerRanking[] = [];
      
      for (let i = 0; i < snapshot.docs.length; i++) {
        const doc = snapshot.docs[i];
        const influencer = { id: doc.id, ...doc.data() } as any;
        
        // Get metrics for this influencer
        const metrics = await this.getInfluencerMetrics(
          doc.id, 
          { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date(), granularity: 'day' }
        );

        rankings.push({
          influencer,
          rank: i + 1,
          score: influencer.totalEarnings, // Simple scoring based on earnings
          metrics
        });
      }

      return rankings;
    } catch (error) {
      console.error('Error getting top performers:', error);
      return [];
    }
  }

  /**
   * Helper method to get top performing Mini Influencers (uses enhanced ranking)
   */
  private static async getTopPerformingMiniInfluencers(
    motherInfluencerId: string, 
    period: TimePeriod, 
    limit: number
  ): Promise<MiniInfluencerPerformance[]> {
    return this.getPerformanceRanking(motherInfluencerId, period, limit);
  }
}