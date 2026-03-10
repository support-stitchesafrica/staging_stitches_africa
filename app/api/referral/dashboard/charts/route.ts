import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/referral/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { ReferralService } from '@/lib/referral/referral-service';
import { ReferralErrorCode, DateRange } from '@/lib/referral/types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/referral/dashboard/charts
 * Get chart data for visualization on referrer dashboard
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * Query Parameters:
 * - range: Date range (7days, 30days, 90days, all) (default: 30days)
 * 
 * Returns:
 * - signupsChart: Daily sign-ups data for line chart
 * - revenueChart: Monthly revenue data for bar chart
 * - dateRange: Applied date range
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const rangeParam = searchParams.get('range') || '30days';
    
    // Validate range parameter
    const validRanges: DateRange[] = ['7days', '30days', '90days', 'all'];
    const range: DateRange = validRanges.includes(rangeParam as DateRange) 
      ? (rangeParam as DateRange) 
      : '30days';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(now);

    // Get referrals within date range
    const referralsSnapshot = await adminDb
      .collection("staging_referrals")
      .where('referrerId', '==', userId)
      .where('createdAt', '>=', startTimestamp)
      .where('createdAt', '<=', endTimestamp)
      .orderBy('createdAt', 'asc')
      .get();

    // Get purchases within date range
    const purchasesSnapshot = await adminDb
      .collection("staging_referralPurchases")
      .where('referrerId', '==', userId)
      .where('createdAt', '>=', startTimestamp)
      .where('createdAt', '<=', endTimestamp)
      .orderBy('createdAt', 'asc')
      .get();

    // Aggregate sign-ups by date
    const signupsByDate = new Map<string, number>();
    referralsSnapshot.forEach((doc) => {
      const referral = doc.data();
      const date = referral.createdAt.toDate().toISOString().split('T')[0];
      signupsByDate.set(date, (signupsByDate.get(date) || 0) + 1);
    });

    // Aggregate revenue by month
    const revenueByMonth = new Map<string, number>();
    purchasesSnapshot.forEach((doc) => {
      const purchase = doc.data();
      const date = purchase.createdAt.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) || 0) + (purchase.amount || 0));
    });

    // Format sign-ups chart data
    const signupsChartData = {
      labels: [] as string[],
      data: [] as number[],
    };

    // Fill in all dates in range with 0 for missing dates
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      signupsChartData.labels.push(dateStr);
      signupsChartData.data.push(signupsByDate.get(dateStr) || 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Format revenue chart data
    const revenueChartData = {
      labels: [] as string[],
      data: [] as number[],
    };

    // Sort months and format data
    const sortedMonths = Array.from(revenueByMonth.keys()).sort();
    sortedMonths.forEach((month) => {
      revenueChartData.labels.push(month);
      revenueChartData.data.push(parseFloat((revenueByMonth.get(month) || 0).toFixed(2)));
    });

    // If no revenue data, provide empty structure
    if (revenueChartData.labels.length === 0) {
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      revenueChartData.labels.push(currentMonth);
      revenueChartData.data.push(0);
    }

    return NextResponse.json(
      {
        success: true,
        charts: {
          signups: {
            labels: signupsChartData.labels,
            data: signupsChartData.data,
            title: 'Daily Sign-ups',
            type: 'line',
          },
          revenue: {
            labels: revenueChartData.labels,
            data: revenueChartData.data,
            title: 'Monthly Revenue',
            type: 'bar',
          },
        },
        dateRange: {
          range,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        },
        summary: {
          totalSignups: signupsChartData.data.reduce((sum, val) => sum + val, 0),
          totalRevenue: parseFloat(
            revenueChartData.data.reduce((sum, val) => sum + val, 0).toFixed(2)
          ),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in charts endpoint:', error);

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
          message: 'An error occurred while fetching chart data',
        },
      },
      { status: 500 }
    );
  }
});
