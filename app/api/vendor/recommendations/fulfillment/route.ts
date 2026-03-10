/**
 * API Route: Fulfillment Recommendations
 * Provides fulfillment process improvement recommendations
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

    // Generate fulfillment recommendations
    const recommendations = await recommendationsService.generateFulfillmentRecommendations(
      vendorId,
      analyticsResponse.data.orders
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching fulfillment recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fulfillment recommendations' },
      { status: 500 }
    );
  }
}
