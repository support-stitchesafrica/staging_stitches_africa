import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/referral/auth-middleware';
import { ReferralService } from '@/lib/referral/referral-service';
import { ReferralErrorCode } from '@/lib/referral/types';

/**
 * GET /api/referral/dashboard/stats
 * Get referrer dashboard statistics
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * Returns:
 * - totalReferrals: Total number of successful referrals
 * - totalPoints: Total points earned
 * - totalRevenue: Total revenue generated from referee purchases
 * - conversionRate: Percentage of referrals that made purchases
 * - activeReferrals: Number of active referrals
 * - pendingReferrals: Number of pending referrals
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const userId = user.userId;

    // Verify user is a referral user
    const referrer = await ReferralService.getReferrerById(userId);
    
    if (!referrer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.USER_NOT_FOUND,
            message: 'Referrer not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if account is active
    if (!referrer.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.UNAUTHORIZED,
            message: 'Account is inactive',
          },
        },
        { status: 403 }
      );
    }

    // Get referrer statistics
    const stats = await ReferralService.getReferrerStats(userId);

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalReferrals: stats.totalReferrals,
          totalPoints: stats.totalPoints,
          totalRevenue: parseFloat(stats.totalRevenue.toFixed(2)),
          conversionRate: stats.conversionRate,
          activeReferrals: stats.activeReferrals,
          pendingReferrals: stats.pendingReferrals,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in dashboard stats endpoint:', error);

    // Handle specific error codes
    if (error.code === ReferralErrorCode.USER_NOT_FOUND) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message || 'Referrer not found',
          },
        },
        { status: 404 }
      );
    }

    if (error.code === ReferralErrorCode.UNAUTHORIZED) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message || 'Unauthorized access',
          },
        },
        { status: 401 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching statistics',
        },
      },
      { status: 500 }
    );
  }
});
