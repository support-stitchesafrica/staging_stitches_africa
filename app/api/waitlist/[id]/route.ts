/**
 * Individual Waitlist API Routes
 * Handles operations for specific waitlists
 */

import { NextRequest, NextResponse } from 'next/server';
import { WaitlistService } from '@/lib/waitlist/waitlist-service';
import { CreateWaitlistForm } from '@/types/waitlist';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/waitlist/[id] - Get waitlist by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const waitlist = await WaitlistService.getWaitlistById(params.id);

    if (!waitlist) {
      return NextResponse.json(
        {
          success: false,
          error: 'Waitlist not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: waitlist
    });
  } catch (error) {
    console.error('Failed to fetch waitlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch waitlist'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/waitlist/[id] - Update waitlist
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { waitlistData, updatedBy } = body;

    if (!updatedBy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Updated by user ID is required'
        },
        { status: 400 }
      );
    }

    // Convert date string to Date object if provided
    const updateData: Partial<CreateWaitlistForm> = {
      ...waitlistData
    };

    if (waitlistData.countdownEndAt) {
      updateData.countdownEndAt = new Date(waitlistData.countdownEndAt);
    }

    const waitlist = await WaitlistService.updateWaitlist(params.id, updateData, updatedBy);

    return NextResponse.json({
      success: true,
      data: waitlist,
      message: 'Waitlist updated successfully'
    });
  } catch (error) {
    console.error('Failed to update waitlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update waitlist'
      },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/waitlist/[id] - Delete waitlist
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await WaitlistService.deleteWaitlist(params.id);

    return NextResponse.json({
      success: true,
      message: 'Waitlist deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete waitlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete waitlist'
      },
      { status: 400 }
    );
  }
}