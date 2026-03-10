import { NextRequest, NextResponse } from 'next/server';
import { atlasStorefrontAnalyticsService } from '@/lib/atlas/unified-analytics/services/storefront-analytics-service';
import { DateRange } from '@/lib/atlas/unified-analytics/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const storefrontIds = searchParams.get('storefrontIds');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: from and to dates' },
        { status: 400 }
      );
    }

    const dateRange: DateRange = {
      from: new Date(fromDate),
      to: new Date(toDate)
    };

    let analyticsData;

    if (storefrontIds) {
      // Get analytics for specific storefronts
      const ids = storefrontIds.split(',');
      analyticsData = await atlasStorefrontAnalyticsService.getStorefrontAnalyticsById(ids, dateRange);
    } else {
      // Get all storefront analytics
      analyticsData = await atlasStorefrontAnalyticsService.getStorefrontPerformanceMetrics(dateRange);
    }

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching storefront analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storefront analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storefrontData } = body;

    if (!storefrontData) {
      return NextResponse.json(
        { error: 'Missing storefrontData in request body' },
        { status: 400 }
      );
    }

    const recommendations = await atlasStorefrontAnalyticsService.generateOptimizationRecommendations(storefrontData);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error generating optimization recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}