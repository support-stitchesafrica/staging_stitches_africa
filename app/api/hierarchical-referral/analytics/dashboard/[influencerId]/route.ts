/**
 * API Route: Get Dashboard Analytics Data
 * GET /api/hierarchical-referral/analytics/dashboard/[influencerId]
 * Requirements: 3.1 - Dashboard data aggregation and real-time streaming
 */

import { NextRequest, NextResponse } from 'next/server';
import { withHierarchicalAuth } from '@/lib/hierarchical-referral/middleware/auth-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalAnalyticsService } from '@/lib/hierarchical-referral/services/analytics-service';
import { HierarchicalDashboardService } from '@/lib/hierarchical-referral/services/dashboard-service';

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

      // Ensure user can only access their own dashboard or is admin
      if (context.user.uid !== influencerId && context.user.influencerType !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'PERMISSION_DENIED',
            message: 'You can only access your own dashboard data'
          },
          { status: 403 }
        );
      }

      // Parse query parameters
      const period = searchParams.get('period') || '30'; // days
      const granularity = searchParams.get('granularity') || 'day';
      const includeRealTime = searchParams.get('realTime') === 'true';

      // Calculate time period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const timePeriod = {
        start: startDate,
        end: endDate,
        granularity: granularity as 'day' | 'week' | 'month'
      };

      // Get dashboard data based on influencer type
      let dashboardData;
      
      if (context.influencer?.type === 'mother') {
        dashboardData = await HierarchicalDashboardService.getMotherInfluencerDashboardData(
          influencerId,
          timePeriod
        );
      } else if (context.influencer?.type === 'mini') {
        dashboardData = await HierarchicalDashboardService.getMiniInfluencerDashboardData(
          influencerId,
          timePeriod
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INFLUENCER_TYPE',
            message: 'Invalid influencer type for dashboard access'
          },
          { status: 400 }
        );
      }

      // Add real-time data if requested
      if (includeRealTime) {
        const recentActivities = await HierarchicalAnalyticsService.getActivityTimeline(
          influencerId,
          10
        );
        dashboardData.recentActivities = recentActivities;
      }

      return NextResponse.json({
        success: true,
        data: dashboardData,
        metadata: {
          period: timePeriod,
          includeRealTime,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Dashboard analytics error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'ANALYTICS_FAILED',
          message: error.message || 'Failed to get dashboard analytics'
        },
        { status: 500 }
      );
    }
  },
  { requireInfluencerProfile: true }
);