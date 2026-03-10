/**
 * Bundling Statistics API Endpoint
 * 
 * GET /api/vendor/bundling/stats
 * Returns overall bundling statistics for a vendor
 * 
 * Requirements: 18.3, 18.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { bundlingInsightsService } from '@/lib/vendor/bundling-insights-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check here
    // Verify that the requesting user is the vendor or has permission

    const result = await bundlingInsightsService.getOverallBundlingStats(vendorId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch bundling statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in bundling stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
