/**
 * Collection Waitlist Analytics API Route
 * 
 * Provides analytics endpoints for specific collection waitlists
 */

import { NextRequest, NextResponse } from 'next/server';
import { vendorWaitlistAnalyticsService } from '@/lib/vendor/waitlist-analytics-service';
import { requireCollectionOwnership, AuthContext } from '@/lib/vendor/waitlist-auth-middleware';

/**
 * GET /api/vendor/waitlists/[id]/analytics - Get collection analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collectionId = params.id;

    // Require vendor authentication and collection ownership
    const authResult = await requireCollectionOwnership(request, collectionId);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { searchParams } = new URL(request.url);
    
    // Parse date range parameters
    const periodStartParam = searchParams.get('periodStart');
    const periodEndParam = searchParams.get('periodEnd');
    
    let periodStart: Date | undefined;
    let periodEnd: Date | undefined;
    
    if (periodStartParam) {
      periodStart = new Date(periodStartParam);
    }
    
    if (periodEndParam) {
      periodEnd = new Date(periodEndParam);
    }

    const analytics = await vendorWaitlistAnalyticsService.getCollectionAnalytics(
      collectionId,
      periodStart,
      periodEnd
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Failed to fetch collection analytics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch collection analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
