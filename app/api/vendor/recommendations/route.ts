/**
 * API Route: Vendor Recommendations
 * Provides comprehensive recommendations for vendor improvement
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

    // Get vendor analytics for context
    const dateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    };

    const analyticsService = new VendorAnalyticsService();
    const analytics = await analyticsService.getVendorAnalytics(vendorId, dateRange);

    // Generate comprehensive recommendations
    const recommendations = await recommendationsService.generateVendorRecommendations(
      vendorId,
      analytics
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
