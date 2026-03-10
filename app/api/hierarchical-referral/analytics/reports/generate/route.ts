/**
 * API Route: Generate Analytics Report
 * POST /api/hierarchical-referral/analytics/reports/generate
 * Requirements: 6.5 - Report generation and export functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { withHierarchicalAuth } from '@/lib/hierarchical-referral/middleware/auth-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalAnalyticsService } from '@/lib/hierarchical-referral/services/analytics-service';
import { ReportCriteria } from '@/types/hierarchical-referral';

interface GenerateReportRequest {
  influencerId?: string;
  period: {
    start: string;
    end: string;
    granularity: 'day' | 'week' | 'month';
  };
  metrics: string[];
  format: 'json' | 'csv';
  includeSubInfluencers?: boolean;
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
      const body: GenerateReportRequest = await request.json();

      // Validate request
      if (!body.period || !body.metrics || !body.format) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'Period, metrics, and format are required'
          },
          { status: 400 }
        );
      }

      // Ensure user can only generate reports for themselves or is admin
      if (body.influencerId && context.user.uid !== body.influencerId && context.user.influencerType !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'PERMISSION_DENIED',
            message: 'You can only generate reports for yourself'
          },
          { status: 403 }
        );
      }

      // Create report criteria
      const criteria: ReportCriteria = {
        influencerId: body.influencerId || context.user.uid,
        period: {
          start: new Date(body.period.start),
          end: new Date(body.period.end),
          granularity: body.period.granularity
        },
        metrics: body.metrics,
        format: body.format,
        includeSubInfluencers: body.includeSubInfluencers
      };

      // Generate report
      const report = await HierarchicalAnalyticsService.generateReport(criteria);

      // If CSV format requested, export to CSV
      if (body.format === 'csv') {
        const csvContent = await HierarchicalAnalyticsService.exportReportToCSV(report);
        
        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="hierarchical-referral-report-${report.id}.csv"`
          }
        });
      }

      // Return JSON report
      return NextResponse.json({
        success: true,
        data: report
      });

    } catch (error: any) {
      console.error('Generate report error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'REPORT_GENERATION_FAILED',
          message: error.message || 'Failed to generate report'
        },
        { status: 500 }
      );
    }
  },
  { requireInfluencerProfile: true }
);