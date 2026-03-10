import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/referral/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { ReferralService } from '@/lib/referral/referral-service';
import { ReferralErrorCode } from '@/lib/referral/types';

/**
 * GET /api/referral/admin/stats
 * Get overall program statistics for admin dashboard
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 * 
 * Returns:
 * - totalReferrers: Total number of registered referrers
 * - totalReferees: Total number of referees (sign-ups)
 * - totalPoints: Total points awarded across all referrers
 * - totalRevenue: Total revenue generated from all referrals
 * - averageReferralsPerReferrer: Average number of referrals per referrer
 * - overallConversionRate: Percentage of referees who made purchases
 * - growthMetrics: Comparison with previous period
 */
export const GET = withAdminAuth(async (request: NextRequest, user) => {
  try {

    // Get global statistics
    const stats = await ReferralService.getGlobalStats();

    // Calculate growth metrics (compare with 30 days ago)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get referrers created in last 30 days
    const recentReferrersSnapshot = await adminDb
      .collection("staging_referralUsers")
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const newReferrers = recentReferrersSnapshot.size;

    // Get referrals created in last 30 days
    const recentReferralsSnapshot = await adminDb
      .collection("staging_referrals")
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const newReferees = recentReferralsSnapshot.size;

    // Calculate growth percentages
    const referrersGrowth = stats.totalReferrers > 0
      ? ((newReferrers / stats.totalReferrers) * 100)
      : 0;

    const refereesGrowth = stats.totalReferees > 0
      ? ((newReferees / stats.totalReferees) * 100)
      : 0;

    // Get revenue from last 30 days
    const recentPurchasesSnapshot = await adminDb
      .collection("staging_referralPurchases")
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    let recentRevenue = 0;
    recentPurchasesSnapshot.forEach((doc) => {
      const purchase = doc.data();
      recentRevenue += purchase.amount || 0;
    });

    const revenueGrowth = stats.totalRevenue > 0
      ? ((recentRevenue / stats.totalRevenue) * 100)
      : 0;

    // Get points awarded in last 30 days
    const recentTransactionsSnapshot = await adminDb
      .collection("staging_referralTransactions")
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    let recentPoints = 0;
    recentTransactionsSnapshot.forEach((doc) => {
      const transaction = doc.data();
      recentPoints += transaction.points || 0;
    });

    const pointsGrowth = stats.totalPoints > 0
      ? ((recentPoints / stats.totalPoints) * 100)
      : 0;

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalReferrers: stats.totalReferrers,
          totalReferees: stats.totalReferees,
          totalPoints: stats.totalPoints,
          totalRevenue: parseFloat(stats.totalRevenue.toFixed(2)),
          averageReferralsPerReferrer: stats.averageReferralsPerReferrer,
          overallConversionRate: stats.overallConversionRate,
          growthMetrics: {
            referrersGrowth: parseFloat(referrersGrowth.toFixed(2)),
            refereesGrowth: parseFloat(refereesGrowth.toFixed(2)),
            revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
            pointsGrowth: parseFloat(pointsGrowth.toFixed(2)),
            period: '30 days',
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in admin stats endpoint:', error);

    // Handle specific error codes
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
          message: 'An error occurred while fetching admin statistics',
        },
      },
      { status: 500 }
    );
  }
});
