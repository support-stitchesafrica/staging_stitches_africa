import { NextRequest, NextResponse } from 'next/server';
import { HierarchicalAdminService } from '@/lib/hierarchical-referral/services/admin-service';

/**
 * GET /api/hierarchical-referral/admin/disputes
 * Get dispute cases that need admin attention
 * Requirements: 6.4
 */
export async function GET(request: NextRequest) {
  try {
    // Get dispute cases
    const disputeCases = await HierarchicalAdminService.getDisputeCases();

    return NextResponse.json({
      success: true,
      data: disputeCases
    });
  } catch (error) {
    console.error('Error getting dispute cases:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}