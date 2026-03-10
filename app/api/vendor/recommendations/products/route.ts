/**
 * API Route: Product Recommendations
 * Provides product-specific improvement recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { recommendationsService } from '@/lib/vendor/recommendations-service';
import { VendorAnalyticsService } from '@/lib/vendor/analytics-service';

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

    // Get vendor analytics
    const dateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    };

    const analyticsService = new VendorAnalyticsService();
    const analyticsResponse = await analyticsService.getVendorAnalytics(vendorId, dateRange);
    
    if (!analyticsResponse.success || !analyticsResponse.data) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Generate product recommendations
    const recommendations = await recommendationsService.generateProductRecommendations(
      vendorId,
      analyticsResponse.data
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching product recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product recommendations' },
      { status: 500 }
    );
  }
}
