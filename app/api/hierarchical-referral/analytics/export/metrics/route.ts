/**
 * API Route: Export Metrics to CSV
 * POST /api/hierarchical-referral/analytics/export/metrics
 * Requirements: 6.5 - Export functionality for metrics data
 */

import { NextRequest, NextResponse } from 'next/server';
import { withHierarchicalAuth } from '@/lib/hierarchical-referral/middleware/auth-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalAnalyticsService } from '@/lib/hierarchical-referral/services/analytics-service';

interface ExportMetricsRequest {
  influencerId?: string;
  period: {
    start: string;
    end: string;
    granularity: 'day' | 'week' | 'month';
  };
  includePerformanceRanking?: boolean;
}

export const POST = withHierarchicalAuth(
  async (request: NextRequest, context) => {
    try {
      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(
        request,
        context.user.uid,
        'EXPORT_REQUEST'
      );
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Parse request body
      const body: ExportMetricsRequest = await request.json();

      // Validate request
      if (!body.period) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'Period is required'
          },
          { status: 400 }
        );
      }

      const influencerId = body.influencerId || context.user.uid;

      // Ensure user can only export their own metrics or is admin
      if (context.user.uid !== influencerId && context.user.influencerType !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'PERMISSION_DENIED',
            message: 'You can only export your own metrics'
          },
          { status: 403 }
        );
      }

      // Create time period
      const timePeriod = {
        start: new Date(body.period.start),
        end: new Date(body.period.end),
        granularity: body.period.granularity
      };

      // Get metrics
      const metrics = await HierarchicalAnalyticsService.getInfluencerMetrics(
        influencerId,
        timePeriod
      );

      // Export to CSV
      const csvContent = HierarchicalAnalyticsService.exportInfluencerMetricsToCSV(
        influencerId,
        metrics,
        timePeriod
      );

      // If performance ranking requested and user is Mother Influencer
      if (body.includePerformanceRanking && context.influencer?.type === 'mother') {
        const performanceRanking = await HierarchicalAnalyticsService.getPerformanceRanking(
          influencerId,
          timePeriod,
          50 // Export more data for CSV
        );

        const rankingCsvContent = HierarchicalAnalyticsService.exportPerformanceRankingToCSV(
          influencerId,
          performanceRanking,
          timePeriod
        );

        // Combine both CSV contents
        const combinedCsvContent = csvContent + '\n\n' + rankingCsvContent;

        return new NextResponse(combinedCsvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="hierarchical-metrics-with-ranking-${influencerId}-${Date.now()}.csv"`
          }
        });
      }

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="hierarchical-metrics-${influencerId}-${Date.now()}.csv"`
        }
      });

    } catch (error: any) {
      console.error('Export metrics error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'EXPORT_FAILED',
          message: error.message || 'Failed to export metrics'
        },
        { status: 500 }
      );
    }
  },
  { requireInfluencerProfile: true }
);