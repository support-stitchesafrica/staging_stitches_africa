/**
 * Complementary Products API Endpoint
 * 
 * GET /api/vendor/bundling/complementary
 * Returns complementary product relationships for a vendor
 * 
 * Requirement 18.5: Highlight complementary product relationships
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

    const result = await bundlingInsightsService.getComplementaryProducts(vendorId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch complementary products' },
        { status: 500 }
      );
    }

    // Convert Map to object for JSON serialization
    const dataObject: Record<string, any> = {};
    if (result.data) {
      result.data.forEach((value, key) => {
        dataObject[key] = value;
      });
    }

    return NextResponse.json({
      success: true,
      data: dataObject,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('Error in complementary products API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
