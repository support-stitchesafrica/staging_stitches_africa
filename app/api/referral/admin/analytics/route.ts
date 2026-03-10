import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/referral/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { ReferralErrorCode } from '@/lib/referral/types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/referral/admin/analytics
 * Get detailed analytics data for admin dashboard
 * Requirements: 14.1, 14.2, 14.3
 * 
 * Query Parameters:
 * - range: Date range (7days, 30days, 90days, all) (default: 30days)
 * - startDate: Custom start date (ISO string)
 * - endDate: Custom end date (ISO string)
 * 
 * Returns:
 * - chartData: Time-series data for charts (referrers, referees, revenue over time)
 * - topPerformers: Top referrers by referrals and revenue
 * - conversionFunnel: Conversion metrics at each stage
 * - summary: Overall analytics summary
 */
export const GET = withAdminAuth(async (request: NextRequest, user) => {
  try {

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30days';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      switch (range) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          startDate = new Date(0); // Beginning of time
          break;
        case '30days':
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Get referrals over time for chart data
    const referralsSnapshot = await adminDb
      .collection("staging_referrals")
      .where('createdAt', '>=', startTimestamp)
      .where('createdAt', '<=', endTimestamp)
      .orderBy('createdAt', 'asc')
      .get();

    // Get purchases over time for chart data
    const purchasesSnapshot = await adminDb
      .collection("staging_referralPurchases")
      .where('createdAt', '>=', startTimestamp)
      .where('createdAt', '<=', endTimestamp)
      .orderBy('createdAt', 'asc')
      .get();

    // Aggregate data by date
    const dataByDate = new Map<string, { 
      signups: number; 
      purchases: number; 
      revenue: number;
      activeReferrers: Set<string>;
    }>();

    referralsSnapshot.forEach((doc) => {
      const referral = doc.data();
      const date = referral.createdAt.toDate().toISOString().split('T')[0];
      const existing = dataByDate.get(date) || { 
        signups: 0, 
        purchases: 0, 
        revenue: 0,
        activeReferrers: new Set<string>()
      };
      existing.signups += 1;
      existing.activeReferrers.add(referral.referrerId);
      dataByDate.set(date, existing);
    });

    purchasesSnapshot.forEach((doc) => {
      const purchase = doc.data();
      const date = purchase.createdAt.toDate().toISOString().split('T')[0];
      const existing = dataByDate.get(date) || { 
        signups: 0, 
        purchases: 0, 
        revenue: 0,
        activeReferrers: new Set<string>()
      };
      existing.purchases += 1;
      existing.revenue += purchase.amount || 0;
      existing.activeReferrers.add(purchase.referrerId);
      dataByDate.set(date, existing);
    });

    // Convert to chart data format
    const chartData = {
      labels: [] as string[],
      referees: [] as number[],
      purchases: [] as number[],
      revenue: [] as number[],
      activeReferrers: [] as number[],
    };

    const sortedDates = Array.from(dataByDate.keys()).sort();
    sortedDates.forEach((date) => {
      const data = dataByDate.get(date)!;
      chartData.labels.push(date);
      chartData.referees.push(data.signups);
      chartData.purchases.push(data.purchases);
      chartData.revenue.push(parseFloat(data.revenue.toFixed(2)));
      chartData.activeReferrers.push(data.activeReferrers.size);
    });

    // Get top performers (top 10 by referrals and revenue)
    const allReferrersSnapshot = await adminDb
      .collection("staging_referralUsers")
      .orderBy('totalReferrals', 'desc')
      .limit(10)
      .get();

    const topPerformersByReferrals = allReferrersSnapshot.docs.map((doc) => {
      const referrer = doc.data();
      return {
        id: referrer.userId,
        name: referrer.fullName,
        email: referrer.email,
        referralCode: referrer.referralCode,
        totalReferrals: referrer.totalReferrals || 0,
        totalPoints: referrer.totalPoints || 0,
        totalRevenue: parseFloat((referrer.totalRevenue || 0).toFixed(2)),
      };
    });

    const topByRevenueSnapshot = await adminDb
      .collection("staging_referralUsers")
      .orderBy('totalRevenue', 'desc')
      .limit(10)
      .get();

    const topPerformersByRevenue = topByRevenueSnapshot.docs.map((doc) => {
      const referrer = doc.data();
      return {
        id: referrer.userId,
        name: referrer.fullName,
        email: referrer.email,
        referralCode: referrer.referralCode,
        totalReferrals: referrer.totalReferrals || 0,
        totalPoints: referrer.totalPoints || 0,
        totalRevenue: parseFloat((referrer.totalRevenue || 0).toFixed(2)),
      };
    });

    // Calculate conversion funnel
    const totalReferrers = (await adminDb.collection("staging_referralUsers").get()).size;
    const totalReferees = referralsSnapshot.size;
    const uniquePurchasers = new Set(purchasesSnapshot.docs.map(doc => doc.data().refereeId));
    const totalPurchasers = uniquePurchasers.size;
    const totalPurchases = purchasesSnapshot.size;

    const conversionFunnel = {
      stages: [
        {
          name: 'Referrers',
          count: totalReferrers,
          percentage: 100,
        },
        {
          name: 'Referees (Sign-ups)',
          count: totalReferees,
          percentage: totalReferrers > 0 ? (totalReferees / totalReferrers) * 100 : 0,
        },
        {
          name: 'First-time Purchasers',
          count: totalPurchasers,
          percentage: totalReferees > 0 ? (totalPurchasers / totalReferees) * 100 : 0,
        },
        {
          name: 'Total Purchases',
          count: totalPurchases,
          percentage: totalReferees > 0 ? (totalPurchases / totalReferees) * 100 : 0,
        },
      ],
      overallConversionRate: totalReferees > 0 
        ? parseFloat(((totalPurchasers / totalReferees) * 100).toFixed(2))
        : 0,
    };

    // Calculate summary statistics
    let totalRevenue = 0;
    let totalPoints = 0;

    purchasesSnapshot.forEach((doc) => {
      const purchase = doc.data();
      totalRevenue += purchase.amount || 0;
      totalPoints += purchase.points || 0;
    });

    // Add signup points
    const signupPoints = totalReferees * 1; // 1 point per signup
    totalPoints += signupPoints;

    const summary = {
      totalReferrers,
      totalReferees,
      totalPurchasers,
      totalPurchases,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalPoints,
      averageRevenuePerReferee: totalReferees > 0 
        ? parseFloat((totalRevenue / totalReferees).toFixed(2))
        : 0,
      averagePurchaseValue: totalPurchases > 0 
        ? parseFloat((totalRevenue / totalPurchases).toFixed(2))
        : 0,
      conversionRate: conversionFunnel.overallConversionRate,
    };

    return NextResponse.json(
      {
        success: true,
        analytics: {
          chartData,
          topPerformers: {
            byReferrals: topPerformersByReferrals,
            byRevenue: topPerformersByRevenue,
          },
          conversionFunnel,
          summary,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            range,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in admin analytics endpoint:', error);

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
          message: 'An error occurred while fetching analytics data',
        },
      },
      { status: 500 }
    );
  }
});
