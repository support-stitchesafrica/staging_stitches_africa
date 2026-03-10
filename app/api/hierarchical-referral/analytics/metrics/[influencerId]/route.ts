/**
 * API Route: Get Influencer Metrics
 * GET /api/hierarchical-referral/analytics/metrics/[influencerId]
 * Requirements: 7.1 - Analytics metrics calculation and performance data
 */

import { NextRequest, NextResponse } from 'next/server';
import { withHierarchicalAuth } from '@/lib/hierarchical-referral/middleware/auth-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalAnalyticsService } from '@/lib/hierarchical-referral/services/analytics-service';

interface RouteParams {
  params: {
    influencerId: string;
  };
}

export const GET = withHierarchicalAuth(
  async (request: NextRequest, context, { params }: RouteParams) => {
    try {
      const { influencerId } = params;
      const { searchParams } = new URL(request.url);

      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(
        request,
        context.user.uid,
        'ANALYTICS_REQUEST'
      );
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Ensure user can only access their own metrics or is admin
      if (context.user.uid !== influencerId && context.user.influencerType !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'PERMISSION_DENIED',
            message: 'You can only access your own metrics'
          },
          { status: 403 }
        );
      }

      // Parse query parameters
      const period = searchParams.get('period') || '30'; // days
      const granularity = searchParams.get('granularity') || 'day';
      const includeRevenueTrends = searchParams.get('revenueTrends') === 'true';
      const includePerformanceRanking = searchParams.get('performanceRanking') === 'true';

      // Calculate time period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const timePeriod = {
        start: startDate,
        end: endDate,
        granularity: granularity as 'day' | 'week' | 'month'
      };

      // Get influencer metrics
      const metrics = await HierarchicalAnalyticsService.getInfluencerMetrics(
        influencerId,
        timePeriod
      );

      const responseData: any = {
        influencerId,
        metrics,
        period: timePeriod
      };

      // Add revenue trends if requested
      if (includeRevenueTrends) {
        const revenueTrends = await HierarchicalAnalyticsService.getRevenueTrendAnalysis(
          influencerId,
          timePeriod
        );
        responseData.revenueTrends = revenueTrends;
      }

      // Add performance ranking if requested (for Mother Influencers)
      if (includePerformanceRanking && context.influencer?.type === 'mother') {
        const performanceRanking = await HierarchicalAnalyticsService.getPerformanceRanking(
          influencerId,
          timePeriod,
          10
        );
        responseData.performanceRanking = performanceRanking;
      }

      // Add network performance for Mother Influencers
      if (context.influencer?.type === 'mother') {
        const networkMetrics = await HierarchicalAnalyticsService.getNetworkPerformance(
          influencerId
        );
        responseData.networkMetrics = networkMetrics;
      }

      return NextResponse.json({
        success: true,
        data: responseData
      });

    } catch (error: any) {
      console.error('Influencer metrics error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'METRICS_FAILED',
          message: error.message || 'Failed to get influencer metrics'
        },
        { status: 500 }
      );
    }
  },
  { requireInfluencerProfile: true }
);