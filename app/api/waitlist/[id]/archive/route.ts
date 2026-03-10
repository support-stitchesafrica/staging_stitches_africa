/**
 * Waitlist Archive API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { WaitlistService } from '@/lib/waitlist/waitlist-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/waitlist/[id]/archive - Archive waitlist
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const waitlist = await WaitlistService.archiveWaitlist(params.id);

    return NextResponse.json({
      success: true,
      data: waitlist,
      message: 'Waitlist archived successfully'
    });
  } catch (error) {
    console.error('Failed to archive waitlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to archive waitlist'
      },
      { status: 400 }
    );
  }
}