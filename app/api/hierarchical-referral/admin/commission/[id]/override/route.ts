import { NextRequest, NextResponse } from 'next/server';
import { HierarchicalAdminService } from '@/lib/hierarchical-referral/services/admin-service';

/**
 * PUT /api/hierarchical-referral/admin/commission/[id]/override
 * Override commission calculation for dispute handling
 * Requirements: 6.4
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { newAmount, reason } = await request.json();
    const commissionId = params.id;

    // Validate input
    if (typeof newAmount !== 'number' || newAmount < 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a non-negative number' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason is required for commission override' },
        { status: 400 }
      );
    }

    // Override commission
    const result = await HierarchicalAdminService.overrideCommission(
      commissionId,
      newAmount,
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
    console.error('Error overriding commission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}