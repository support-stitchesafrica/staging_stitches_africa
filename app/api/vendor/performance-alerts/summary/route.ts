/**
 * Performance Alerts Summary API
 * Endpoint for getting alert counts by severity
 */

import { NextRequest, NextResponse } from 'next/server';
import { PerformanceAlertsService } from '@/lib/vendor/performance-alerts-service';

const alertsService = new PerformanceAlertsService();

/**
 * GET /api/vendor/performance-alerts/summary
 * Gets alert summary counts for the authenticated vendor
 */
export async function GET(request: NextRequest) {
  try {
    // Get vendor ID from query params (in production, get from auth token)
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Get alert summary
    const result = await alertsService.getAlertSummary(vendorId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to get alert summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Alert summary API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
