/**
 * Performance Alerts API
 * Endpoint for generating and retrieving vendor performance alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { PerformanceAlertsService } from '@/lib/vendor/performance-alerts-service';

const alertsService = new PerformanceAlertsService();

/**
 * GET /api/vendor/performance-alerts
 * Generates performance alerts for the authenticated vendor
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

    // Generate performance alerts
    const result = await alertsService.generatePerformanceAlerts(vendorId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to generate alerts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Performance alerts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
