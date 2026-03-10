import { NextRequest, NextResponse } from 'next/server';
import { HierarchicalAdminService } from '@/lib/hierarchical-referral/services/admin-service';

/**
 * GET /api/hierarchical-referral/admin/referral-trees
 * Get all Mother Influencers with their referral trees
 * Requirements: 6.1
 */
export async function GET(request: NextRequest) {
  try {
    // Get all referral trees
    const referralTrees = await HierarchicalAdminService.getAllMotherInfluencersWithTrees();

    return NextResponse.json({
      success: true,
      data: referralTrees
    });
  } catch (error) {
    console.error('Error fetching referral trees:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch referral trees'
      },
      { status: 500 }
    );
  }
}