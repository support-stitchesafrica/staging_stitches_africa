/**
 * Waitlist Publish API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { WaitlistService } from '@/lib/waitlist/waitlist-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/waitlist/[id]/publish - Publish waitlist
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const waitlist = await WaitlistService.publishWaitlist(params.id);

    return NextResponse.json({
      success: true,
      data: waitlist,
      message: 'Waitlist published successfully'
    });
  } catch (error) {
    console.error('Failed to publish waitlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish waitlist'
      },
      { status: 400 }
    );
  }
}