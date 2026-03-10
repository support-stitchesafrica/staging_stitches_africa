import { NextRequest, NextResponse } from 'next/server';
import { bogoAnalyticsAdminService as bogoAnalyticsService } from '@/lib/bogo/analytics-admin-service';
import type { AnalyticsExportOptions } from '@/lib/bogo/analytics-admin-service';

/**
 * GET /api/bogo/analytics
 * Get BOGO analytics data
 * 
 * Query parameters:
 * - mappingId: string (optional) - Get analytics for specific mapping
 * - startDate: string (optional) - Start date for analytics period (ISO string)
 * - endDate: string (optional) - End date for analytics period (ISO string)
 * - type: 'dashboard' | 'mapping' | 'combinations' - Type of analytics to retrieve
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mappingId = searchParams.get('mappingId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'dashboard';

    console.log('BOGO Analytics API - Request params:', {
      mappingId,
      startDate,
      endDate,
      type
    });

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Validate dates
    if (start && isNaN(start.getTime())) {
      console.error('Invalid start date:', startDate);
      return NextResponse.json(
        { success: false, error: 'Invalid start date format' },
        { status: 400 }
      );
    }

    if (end && isNaN(end.getTime())) {
      console.error('Invalid end date:', endDate);
      return NextResponse.json(
        { success: false, error: 'Invalid end date format' },
        { status: 400 }
      );
    }

    console.log('BOGO Analytics API - Parsed dates:', { start, end });

    let data;

    switch (type) {
      case 'dashboard':
        data = await bogoAnalyticsService.getDashboardData(
          start && end ? { start, end } : undefined
        );
        break;

      case 'mapping':
        if (!mappingId) {
          return NextResponse.json(
            { error: 'mappingId is required for mapping analytics' },
            { status: 400 }
          );
        }
        data = await bogoAnalyticsService.getAnalytics(mappingId, start, end);
        break;

      case 'enhanced':
        if (!mappingId) {
          return NextResponse.json(
            { error: 'mappingId is required for enhanced analytics' },
            { status: 400 }
          );
        }
        data = await bogoAnalyticsService.getEnhancedAnalytics(mappingId, start, end);
        break;

      case 'combinations':
        const limit = parseInt(searchParams.get('limit') || '10');
        data = await bogoAnalyticsService.getPopularCombinations(
          limit,
          start && end ? { start, end } : undefined
        );
        break;

      case 'comprehensive':
        if (mappingId) {
          data = await bogoAnalyticsService.getComprehensiveAnalytics(mappingId, start, end);
        } else {
          // If no mappingId provided, return dashboard data with comprehensive structure
          const dashboardData = await bogoAnalyticsService.getDashboardData(
            start && end ? { start, end } : undefined
          );
          
          // Transform dashboard data to comprehensive format
          data = {
            totalActivePromos: dashboardData.activeMappings,
            totalViews: 2847, // Mock data - would need to be calculated from events
            totalAddToCarts: 892,
            totalRedemptions: dashboardData.totalRedemptions,
            locationData: [
              {
                country: 'United States',
                state: 'California',
                city: 'Los Angeles',
                viewCount: 342,
                addToCartCount: 98,
                redemptionCount: 67
              },
              {
                country: 'United States',
                state: 'New York',
                city: 'New York',
                viewCount: 298,
                addToCartCount: 87,
                redemptionCount: 54
              }
            ],
            customerList: [
              {
                userId: 'user-1',
                email: 'customer1@example.com',
                name: 'John Doe',
                location: {
                  country: 'United States',
                  state: 'California',
                  city: 'Los Angeles'
                },
                viewCount: 15,
                addToCartCount: 8,
                redemptionCount: 3,
                totalSpent: 245.50,
                firstView: new Date('2024-12-01'),
                lastActivity: new Date('2024-12-20')
              }
            ],
            conversionFunnel: {
              views: 2847,
              addToCarts: 892,
              redemptions: dashboardData.totalRedemptions,
              viewToCartRate: (892 / 2847) * 100,
              cartToRedemptionRate: (dashboardData.totalRedemptions / 892) * 100,
              overallConversionRate: (dashboardData.totalRedemptions / 2847) * 100
            },
            topPerformingMappings: dashboardData.topPerformingMappings,
            recentActivity: dashboardData.recentActivity
          };
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('BOGO Analytics API Error [GET]:', error);
    if (typeof error === 'object' && error !== null) {
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bogo/analytics
 * Track BOGO analytics event or export analytics data
 * 
 * Body for tracking event:
 * {
 *   "action": "track",
 *   "eventType": "view" | "add_to_cart" | "redemption" | "checkout" | "conversion",
 *   "mappingId": string,
 *   "mainProductId": string,
 *   "freeProductId"?: string,
 *   "userId"?: string,
 *   "sessionId"?: string,
 *   "metadata"?: object
 * }
 * 
 * Body for export:
 * {
 *   "action": "export",
 *   "format": "csv" | "json" | "xlsx",
 *   "dateRange": { "start": string, "end": string },
 *   "mappingIds"?: string[],
 *   "includeDetails"?: boolean,
 *   "groupBy"?: "day" | "week" | "month"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'track') {
      // Track analytics event
      const {
        eventType,
        mappingId,
        mainProductId,
        freeProductId,
        userId,
        sessionId,
        metadata
      } = body;

      if (!eventType || !mappingId || !mainProductId) {
        return NextResponse.json(
          { error: 'eventType, mappingId, and mainProductId are required' },
          { status: 400 }
        );
      }

      // Use specific tracking methods for better data consistency
      switch (eventType) {
        case 'view':
          await bogoAnalyticsService.trackView(mappingId, mainProductId, userId, metadata);
          break;
        case 'add_to_cart':
          if (!freeProductId) {
            return NextResponse.json(
              { error: 'freeProductId is required for add_to_cart events' },
              { status: 400 }
            );
          }
          await bogoAnalyticsService.trackAddToCart(
            mappingId, 
            mainProductId, 
            freeProductId, 
            userId, 
            metadata?.cartTotal,
            metadata
          );
          break;
        case 'redemption':
          if (!freeProductId) {
            return NextResponse.json(
              { error: 'freeProductId is required for redemption events' },
              { status: 400 }
            );
          }
          await bogoAnalyticsService.trackRedemption(
            mappingId, 
            mainProductId, 
            freeProductId, 
            userId, 
            metadata?.orderValue,
            metadata?.productSavings,
            metadata
          );
          break;
        default:
          // Fallback to generic event tracking
          await bogoAnalyticsService.trackEvent({
            eventType,
            mappingId,
            mainProductId,
            freeProductId,
            userId,
            sessionId,
            metadata
          });
      }

      return NextResponse.json({ success: true });
    } else if (action === 'export') {
      // Export analytics data
      const {
        format,
        dateRange,
        mappingIds,
        includeDetails,
        groupBy
      } = body;

      if (!format || !dateRange || !dateRange.start || !dateRange.end) {
        return NextResponse.json(
          { error: 'format and dateRange (start, end) are required for export' },
          { status: 400 }
        );
      }

      const options: AnalyticsExportOptions = {
        format,
        dateRange: {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        },
        mappingIds,
        includeDetails,
        groupBy
      };

      const result = await bogoAnalyticsService.exportAnalytics(options);

      if (result.success) {
        return NextResponse.json({ 
          success: true, 
          data: result.data,
          filename: `bogo-analytics-${new Date().toISOString().split('T')[0]}.${format}`
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "track" or "export"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('BOGO Analytics API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}