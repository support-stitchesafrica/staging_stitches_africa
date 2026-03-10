import { NextRequest, NextResponse } from 'next/server';
import { HierarchicalAdminService } from '@/lib/hierarchical-referral/services/admin-service';

/**
 * PUT /api/hierarchical-referral/admin/influencer/[id]/status
 * Update influencer status (enable/disable/suspend)
 * Requirements: 6.2
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, reason } = await request.json();
    const influencerId = params.id;

    // Validate status
    if (!['active', 'suspended', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be active, suspended, or pending' },
        { status: 400 }
      );
    }

    // Update influencer status
    const result = await HierarchicalAdminService.updateInfluencerStatus(
      influencerId,
      status,
      reason
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error updating influencer status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}