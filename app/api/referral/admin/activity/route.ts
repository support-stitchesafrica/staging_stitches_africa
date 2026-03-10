import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/referral/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { ReferralErrorCode } from '@/lib/referral/types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/referral/admin/activity
 * Get recent activity feed for admin dashboard
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 * 
 * Query Parameters:
 * - limit: Number of activities to return (default: 50, max: 200)
 * - type: Filter by activity type (all, signup, purchase, points) (default: all)
 * - since: Get activities since timestamp (ISO string)
 * 
 * Returns:
 * - activities: Array of activity objects with details
 * - hasMore: Boolean indicating if more activities exist
 */
export const GET = withAdminAuth(async (request: NextRequest, user) => {
  try {

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const type = searchParams.get('type') || 'all';
    const since = searchParams.get('since');

    const activities: any[] = [];

    // Get sign-up activities (from referrals collection)
    if (type === 'all' || type === 'signup') {
      let signupQuery = adminDb.collection("staging_referrals");

      // Firestore requires inequality filters to come before orderBy
      if (since) {
        const sinceDate = Timestamp.fromDate(new Date(since));
        signupQuery = signupQuery.where('createdAt', '>', sinceDate) as any;
      }

      signupQuery = signupQuery.orderBy('createdAt', 'desc').limit(limit);

      const signupsSnapshot = await signupQuery.get();

      for (const doc of signupsSnapshot.docs) {
        const referral = doc.data();
        
        // Get referrer details
        const referrerDoc = await adminDb
          .collection("staging_referralUsers")
          .doc(referral.referrerId)
          .get();
        
        const referrer = referrerDoc.data();

        activities.push({
          id: doc.id,
          type: 'signup',
          timestamp: referral.createdAt && typeof referral.createdAt.toMillis === 'function'
            ? new Date(referral.createdAt.toMillis()).toISOString()
            : null,
          referrer: {
            id: referral.referrerId,
            name: referrer?.fullName || 'Unknown',
            email: referrer?.email || '',
            referralCode: referrer?.referralCode || '',
          },
          referee: {
            name: referral.refereeName,
            email: referral.refereeEmail,
          },
          description: `${referral.refereeName} signed up using ${referrer?.fullName}'s referral code`,
        });
      }
    }

    // Get purchase activities (from referralPurchases collection)
    if (type === 'all' || type === 'purchase') {
      let purchaseQuery = adminDb.collection("staging_referralPurchases");

      // Firestore requires inequality filters to come before orderBy
      if (since) {
        const sinceDate = Timestamp.fromDate(new Date(since));
        purchaseQuery = purchaseQuery.where('createdAt', '>', sinceDate) as any;
      }

      purchaseQuery = purchaseQuery.orderBy('createdAt', 'desc').limit(limit);

      const purchasesSnapshot = await purchaseQuery.get();

      for (const doc of purchasesSnapshot.docs) {
        const purchase = doc.data();
        
        // Get referrer details
        const referrerDoc = await adminDb
          .collection("staging_referralUsers")
          .doc(purchase.referrerId)
          .get();
        
        const referrer = referrerDoc.data();

        // Get referral details for referee info
        const referralDoc = await adminDb
          .collection("staging_referrals")
          .doc(purchase.referralId)
          .get();
        
        const referral = referralDoc.data();

        activities.push({
          id: doc.id,
          type: 'purchase',
          timestamp: purchase.createdAt && typeof purchase.createdAt.toMillis === 'function'
            ? new Date(purchase.createdAt.toMillis()).toISOString()
            : null,
          referrer: {
            id: purchase.referrerId,
            name: referrer?.fullName || 'Unknown',
            email: referrer?.email || '',
            referralCode: referrer?.referralCode || '',
          },
          referee: {
            name: referral?.refereeName || 'Unknown',
            email: referral?.refereeEmail || '',
          },
          amount: parseFloat((purchase.amount || 0).toFixed(2)),
          commission: parseFloat((purchase.commission || 0).toFixed(2)),
          points: purchase.points || 0,
          orderId: purchase.orderId,
          description: `${referral?.refereeName || 'A referee'} made a purchase of $${purchase.amount?.toFixed(2)}`,
        });
      }
    }

    // Get points activities (from referralTransactions collection)
    if (type === 'all' || type === 'points') {
      let transactionQuery = adminDb.collection("staging_referralTransactions");

      // Firestore requires inequality filters to come before orderBy
      if (since) {
        const sinceDate = Timestamp.fromDate(new Date(since));
        transactionQuery = transactionQuery.where('createdAt', '>', sinceDate) as any;
      }

      transactionQuery = transactionQuery.orderBy('createdAt', 'desc').limit(limit);

      const transactionsSnapshot = await transactionQuery.get();

      for (const doc of transactionsSnapshot.docs) {
        const transaction = doc.data();
        
        // Get referrer details
        const referrerDoc = await adminDb
          .collection("staging_referralUsers")
          .doc(transaction.referrerId)
          .get();
        
        const referrer = referrerDoc.data();

        activities.push({
          id: doc.id,
          type: 'points',
          subType: transaction.type, // 'signup' or 'purchase'
          timestamp: transaction.createdAt && typeof transaction.createdAt.toMillis === 'function'
            ? new Date(transaction.createdAt.toMillis()).toISOString()
            : null,
          referrer: {
            id: transaction.referrerId,
            name: referrer?.fullName || 'Unknown',
            email: referrer?.email || '',
            referralCode: referrer?.referralCode || '',
          },
          referee: {
            name: transaction.metadata?.refereeName || 'Unknown',
            email: transaction.metadata?.refereeEmail || '',
          },
          points: transaction.points || 0,
          amount: transaction.amount ? parseFloat(transaction.amount.toFixed(2)) : undefined,
          description: transaction.description,
        });
      }
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });

    // Limit to requested number
    const limitedActivities = activities.slice(0, limit);
    const hasMore = activities.length > limit;

    return NextResponse.json(
      {
        success: true,
        activities: limitedActivities,
        hasMore,
        count: limitedActivities.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in admin activity endpoint:', error);

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
          message: 'An error occurred while fetching activity feed',
        },
      },
      { status: 500 }
    );
  }
});
