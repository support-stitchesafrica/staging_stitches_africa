/**
 * Waitlist Analytics API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { WaitlistService } from '@/lib/waitlist/waitlist-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/waitlist/[id]/analytics - Get analytics for waitlist
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const analytics = await WaitlistService.getWaitlistAnalytics(params.id);

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Failed to fetch waitlist analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics'
      },
      { status: 500 }
    );
  }
}