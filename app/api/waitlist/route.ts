/**
 * Waitlist API Routes
 * Handles CRUD operations for waitlists
 */

import { NextRequest, NextResponse } from 'next/server';
import { WaitlistService } from '@/lib/waitlist/waitlist-service';
import { CreateWaitlistForm } from '@/types/waitlist';

/**
 * GET /api/waitlist - Get all waitlists or published waitlists
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published') === 'true';

    let waitlists;
    if (published) {
      waitlists = await WaitlistService.getPublishedWaitlists();
    } else {
      waitlists = await WaitlistService.getAllWaitlists();
    }

    return NextResponse.json({
      success: true,
      data: waitlists
    });
  } catch (error) {
    console.error('Failed to fetch waitlists:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch waitlists'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/waitlist - Create a new waitlist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { waitlistData, createdBy } = body;

    // Validate required fields
    if (!waitlistData || !createdBy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Waitlist data and creator ID are required'
        },
        { status: 400 }
      );
    }

    // Convert date string to Date object
    const formData: CreateWaitlistForm = {
      ...waitlistData,
      countdownEndAt: new Date(waitlistData.countdownEndAt)
    };

    const waitlist = await WaitlistService.createWaitlist(formData, createdBy);

    return NextResponse.json({
      success: true,
      data: waitlist,
      message: 'Waitlist created successfully'
    });
  } catch (error) {
    console.error('Failed to create waitlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create waitlist'
      },
      { status: 400 }
    );
  }
}