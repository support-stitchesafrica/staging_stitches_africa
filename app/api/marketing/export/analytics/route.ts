import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/marketing/analytics-service';

/**
 * GET /api/marketing/export/analytics
 * Export organization analytics data
 */
export async function GET(request: NextRequest) {
  try {
    // Calculate organization analytics
    const analytics = await AnalyticsService.calculateOrganizationAnalytics();

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}
