import { NextRequest, NextResponse } from 'next/server';
import { bogoAnalyticsAdminService } from '@/lib/bogo/analytics-admin-service';

/**
 * Enhanced BOGO Analytics API - Comprehensive Real-Time Data
 * 
 * GET /api/bogo/analytics/comprehensive
 * Provides comprehensive analytics including:
 * - Product views, add-to-cart, and redemptions
 * - User location and demographic data
 * - Real-time tracking data
 * - Customer journey analytics
 * 
 * Query parameters:
 * - mappingId: string (optional) - Specific BOGO mapping
 * - startDate: string (optional) - Start date (ISO string)
 * - endDate: string (optional) - End date (ISO string)
 * - includeUserData: boolean (optional) - Include detailed user information
 * - includeLocationData: boolean (optional) - Include location analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mappingId = searchParams.get('mappingId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeUserData = searchParams.get('includeUserData') === 'true';
    const includeLocationData = searchParams.get('includeLocationData') === 'true';

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    let data;

    if (mappingId) {
      // Get comprehensive analytics for specific mapping
      data = await bogoAnalyticsAdminService.getComprehensiveAnalytics(mappingId, start, end);
    } else {
      // Get overall dashboard data with enhanced metrics
      const dashboardData = await bogoAnalyticsAdminService.getDashboardData(
        start && end ? { start, end } : undefined
      );
      
      // Get additional comprehensive metrics
      const allMappings = await bogoAnalyticsAdminService.getAllActiveMappingIds();
      const comprehensiveData = await Promise.all(
        allMappings.slice(0, 5).map(id => 
          bogoAnalyticsAdminService.getComprehensiveAnalytics(id, start, end)
        )
      );

      // Aggregate data across all mappings
      const aggregatedData = {
        totalActivePromos: dashboardData.activeMappings,
        totalViews: comprehensiveData.reduce((sum, d) => sum + d.totalViews, 0),
        totalAddToCarts: comprehensiveData.reduce((sum, d) => sum + d.totalAddToCarts, 0),
        totalRedemptions: comprehensiveData.reduce((sum, d) => sum + d.totalRedemptions, 0),
        locationData: aggregateLocationData(comprehensiveData),
        customerList: aggregateCustomerData(comprehensiveData),
        topPerformingMappings: dashboardData.topPerformingMappings,
        recentActivity: dashboardData.recentActivity,
        conversionFunnel: {
          views: comprehensiveData.reduce((sum, d) => sum + d.totalViews, 0),
          addToCarts: comprehensiveData.reduce((sum, d) => sum + d.totalAddToCarts, 0),
          redemptions: comprehensiveData.reduce((sum, d) => sum + d.totalRedemptions, 0),
          viewToCartRate: 0,
          cartToRedemptionRate: 0,
          overallConversionRate: 0
        }
      };

      // Calculate conversion rates
      if (aggregatedData.conversionFunnel.views > 0) {
        aggregatedData.conversionFunnel.viewToCartRate = 
          (aggregatedData.conversionFunnel.addToCarts / aggregatedData.conversionFunnel.views) * 100;
        aggregatedData.conversionFunnel.overallConversionRate = 
          (aggregatedData.conversionFunnel.redemptions / aggregatedData.conversionFunnel.views) * 100;
      }
      if (aggregatedData.conversionFunnel.addToCarts > 0) {
        aggregatedData.conversionFunnel.cartToRedemptionRate = 
          (aggregatedData.conversionFunnel.redemptions / aggregatedData.conversionFunnel.addToCarts) * 100;
      }

      data = aggregatedData;
    }

    // Filter data based on privacy settings
    if (!includeUserData && data.customerList) {
      data.customerList = data.customerList.map((customer: any) => ({
        ...customer,
        email: undefined,
        name: customer.name ? 'Anonymous User' : undefined
      }));
    }

    if (!includeLocationData && data.locationData) {
      data.locationData = data.locationData.map((location: any) => ({
        ...location,
        city: undefined
      }));
    }

    return NextResponse.json({ 
      success: true, 
      data,
      timestamp: new Date().toISOString(),
      period: {
        start: start?.toISOString(),
        end: end?.toISOString()
      }
    });
  } catch (error) {
    console.error('Comprehensive BOGO Analytics API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch comprehensive analytics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bogo/analytics/comprehensive
 * Track enhanced analytics events with location and user data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventType,
      mappingId,
      mainProductId,
      freeProductId,
      userId,
      userInfo,
      location,
      deviceInfo,
      metadata
    } = body;

    if (!eventType || !mappingId || !mainProductId) {
      return NextResponse.json(
        { error: 'eventType, mappingId, and mainProductId are required' },
        { status: 400 }
      );
    }

    // Enhanced metadata with location and device info
    const enhancedMetadata = {
      ...metadata,
      pageUrl: metadata?.pageUrl || (typeof window !== 'undefined' ? window.location.href : undefined),
      deviceType: deviceInfo?.deviceType || getDeviceType(request),
      browserName: deviceInfo?.browserName || getBrowserName(request),
      osName: deviceInfo?.osName || getOSName(request),
      userAgent: request.headers.get('user-agent'),
      referrer: request.headers.get('referer'),
      timestamp: new Date().toISOString()
    };

    // Enhanced location data
    const enhancedLocation = {
      ...location,
      ip: getClientIP(request),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Track the event with enhanced data
    await bogoAnalyticsAdminService.trackEvent({
      eventType,
      mappingId,
      mainProductId,
      freeProductId,
      userId,
      sessionId: metadata?.sessionId || generateSessionId(),
      location: enhancedLocation,
      userAgent: request.headers.get('user-agent') || undefined,
      referrer: request.headers.get('referer') || undefined,
      metadata: enhancedMetadata
    });

    // If user info is provided, store it separately for analytics
    if (userInfo && userId) {
      await storeUserInfo(userId, userInfo, enhancedLocation);
    }

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString(),
      sessionId: metadata?.sessionId || generateSessionId()
    });
  } catch (error) {
    console.error('Enhanced BOGO Analytics Tracking Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to track analytics event',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper functions
function aggregateLocationData(comprehensiveData: any[]): any[] {
  const locationMap = new Map();
  
  comprehensiveData.forEach(data => {
    data.locationData?.forEach((location: any) => {
      const key = `${location.country}-${location.state}-${location.city || ''}`;
      const existing = locationMap.get(key) || {
        country: location.country,
        state: location.state,
        city: location.city,
        viewCount: 0,
        addToCartCount: 0,
        redemptionCount: 0
      };
      
      existing.viewCount += location.viewCount;
      existing.addToCartCount += location.addToCartCount;
      existing.redemptionCount += location.redemptionCount;
      
      locationMap.set(key, existing);
    });
  });
  
  return Array.from(locationMap.values())
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 20); // Top 20 locations
}

function aggregateCustomerData(comprehensiveData: any[]): any[] {
  const customerMap = new Map();
  
  comprehensiveData.forEach(data => {
    data.customerList?.forEach((customer: any) => {
      const existing = customerMap.get(customer.userId) || {
        userId: customer.userId,
        email: customer.email,
        name: customer.name,
        location: customer.location,
        viewCount: 0,
        addToCartCount: 0,
        redemptionCount: 0,
        totalSpent: 0,
        firstView: customer.firstView,
        lastActivity: customer.lastActivity
      };
      
      existing.viewCount += customer.viewCount;
      existing.addToCartCount += customer.addToCartCount;
      existing.redemptionCount += customer.redemptionCount;
      existing.totalSpent += customer.totalSpent;
      
      // Update activity dates
      if (customer.firstView < existing.firstView) {
        existing.firstView = customer.firstView;
      }
      if (customer.lastActivity > existing.lastActivity) {
        existing.lastActivity = customer.lastActivity;
      }
      
      customerMap.set(customer.userId, existing);
    });
  });
  
  return Array.from(customerMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 100); // Top 100 customers
}

function getDeviceType(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

function getBrowserName(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
}

function getOSName(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function storeUserInfo(userId: string, userInfo: any, location: any): Promise<void> {
  // In a real implementation, you would store this in a user analytics collection
  // For now, we'll just log it
  console.log('Storing user info for analytics:', {
    userId,
    userInfo,
    location,
    timestamp: new Date().toISOString()
  });
}