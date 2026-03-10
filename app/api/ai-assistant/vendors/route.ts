/**
 * AI Assistant Vendors API
 * 
 * Handles vendor queries for the AI shopping assistant
 * Returns vendor details by IDs
 */

import { NextRequest, NextResponse } from 'next/server';
import { VendorSearchService } from '@/lib/ai-assistant/vendor-search-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorIds } = body;

    if (!vendorIds || !Array.isArray(vendorIds)) {
      return NextResponse.json(
        { error: 'vendorIds array is required' },
        { status: 400 }
      );
    }

    // Get vendors by IDs
    const vendors = await VendorSearchService.getByIds(vendorIds);

    return NextResponse.json({
      vendors,
      count: vendors.length,
    });
  } catch (error) {
    console.error('[AI Vendors API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const location = searchParams.get('location');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const minRating = searchParams.get('minRating');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filters
    const filters: any = {};
    if (location) filters.location = location;
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (minRating) filters.minRating = parseFloat(minRating);

    // Search vendors
    const vendors = await VendorSearchService.searchVendors(
      query || undefined,
      Object.keys(filters).length > 0 ? filters : undefined,
      limit
    );

    return NextResponse.json({
      vendors,
      count: vendors.length,
    });
  } catch (error) {
    console.error('[AI Vendors API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search vendors' },
      { status: 500 }
    );
  }
}
