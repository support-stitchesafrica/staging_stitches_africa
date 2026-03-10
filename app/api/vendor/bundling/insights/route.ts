/**
 * Bundling Insights API Endpoint
 * 
 * GET /api/vendor/bundling/insights
 * Returns bundling insights for a vendor's products
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { bundlingInsightsService } from '@/lib/vendor/bundling-insights-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendorId');
    const productId = searchParams.get('productId');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check here
    // Verify that the requesting user is the vendor or has permission

    const result = await bundlingInsightsService.getBundlingInsights(
      vendorId,
      productId || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch bundling insights' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in bundling insights API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
