/**
 * Vendor Waitlist Analytics API Routes
 * 
 * Provides analytics endpoints for vendor waitlist management
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { vendorWaitlistAnalyticsService } from '@/lib/vendor/waitlist-analytics-service';
import { requireVendor, AuthContext } from '@/lib/vendor/waitlist-auth-middleware';

/**
 * GET /api/vendor/waitlists/analytics - Get vendor waitlist analytics
 */
export async function GET(request: NextRequest) {
  try {
    // Require vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const authContext = authResult as AuthContext;

    // Use authenticated vendor's ID
    const vendorId = authContext.vendorId!;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Parse date parameters
    const periodStart = startDate ? new Date(startDate) : undefined;
    const periodEnd = endDate ? new Date(endDate) : undefined;

    // Validate dates
    if (startDate && isNaN(periodStart!.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid start date format' },
        { status: 400 }
      );
    }

    if (endDate && isNaN(periodEnd!.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid end date format' },
        { status: 400 }
      );
    }

    const analytics = await vendorWaitlistAnalyticsService.getVendorAnalytics(
      vendorId,
      periodStart,
      periodEnd
    );

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Failed to fetch vendor waitlist analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics data'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/waitlists/analytics - Track analytics event
 */
export async function POST(request: NextRequest) {
  try {
    // Require vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const authContext = authResult as AuthContext;

    const body = await request.json();
    const { eventType, collectionId, userId, metadata } = body;

    // Use authenticated vendor's ID
    const vendorId = authContext.vendorId!;

    if (!eventType || !collectionId) {
      return NextResponse.json(
        { success: false, error: 'Event type and collection ID are required' },
        { status: 400 }
      );
    }

    // Track the event based on type
    switch (eventType) {
      case 'view':
        await vendorWaitlistAnalyticsService.trackCollectionView(
          collectionId,
          vendorId,
          userId,
          metadata
        );
        break;

      case 'subscribe':
        if (!metadata?.subscriptionId) {
          return NextResponse.json(
            { success: false, error: 'Subscription ID is required for subscribe events' },
            { status: 400 }
          );
        }
        await vendorWaitlistAnalyticsService.trackSubscription(
          collectionId,
          vendorId,
          metadata.subscriptionId,
          userId,
          metadata.source,
          metadata
        );
        break;

      case 'email_open':
      case 'email_click':
        if (!metadata?.emailId) {
          return NextResponse.json(
            { success: false, error: 'Email ID is required for email events' },
            { status: 400 }
          );
        }
        await vendorWaitlistAnalyticsService.trackEmailEngagement(
          collectionId,
          vendorId,
          eventType,
          metadata.emailId,
          userId,
          metadata.clickUrl
        );
        break;

      case 'conversion':
        if (!userId || !metadata?.conversionValue) {
          return NextResponse.json(
            { success: false, error: 'User ID and conversion value are required for conversion events' },
            { status: 400 }
          );
        }
        await vendorWaitlistAnalyticsService.trackConversion(
          collectionId,
          vendorId,
          userId,
          metadata.conversionValue,
          metadata
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid event type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track event'
      },
      { status: 500 }
    );
  }
}