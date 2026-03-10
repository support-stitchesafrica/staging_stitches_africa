import { NextRequest, NextResponse } from 'next/server';
import { HierarchicalAdminService } from '@/lib/hierarchical-referral/services/admin-service';

/**
 * GET /api/hierarchical-referral/admin/performance
 * Get system performance analytics for a time period
 * Requirements: 6.3
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse time period parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const granularity = searchParams.get('granularity') || 'day';

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start date and end date are required'
        },
        { status: 400 }
      );
    }

    const period = {
      start: new Date(startDate),
      end: new Date(endDate),
      granularity: granularity as 'day' | 'week' | 'month'
    };

    // Get system performance analytics
    const performanceData = await HierarchicalAdminService.getSystemPerformanceAnalytics(period);

    return NextResponse.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('Error fetching system performance analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch system performance analytics'
      },
      { status: 500 }
    );
  }
}