import { NextRequest, NextResponse } from 'next/server';
import { HierarchicalAdminService } from '@/lib/hierarchical-referral/services/admin-service';

/**
 * PUT /api/hierarchical-referral/admin/payout/[id]/adjust
 * Adjust payout amount for dispute handling
 * Requirements: 6.4
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { adjustmentAmount, reason } = await request.json();
    const payoutId = params.id;

    // Validate input
    if (typeof adjustmentAmount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid adjustment amount. Must be a number' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason is required for payout adjustment' },
        { status: 400 }
      );
    }

    // Adjust payout
    const result = await HierarchicalAdminService.adjustPayout(
      payoutId,
      adjustmentAmount,
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
    console.error('Error adjusting payout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}