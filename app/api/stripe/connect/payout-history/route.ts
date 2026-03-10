import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { PayoutRecord, PayoutHistoryResponse } from '@/lib/stripe/payout-history-service';

/**
 * GET /api/stripe/connect/payout-history
 * Fetch payout history for a vendor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tailorUID = searchParams.get('tailorUID');
    const status = searchParams.get('status') || 'all';
    const limitParam = parseInt(searchParams.get('limit') || '10');
    const offsetParam = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!tailorUID) {
      return NextResponse.json(
        { error: 'Missing tailorUID parameter' },
        { status: 400 }
      );
    }

    console.log('[Payout History API] Fetching history for:', {
      tailorUID,
      status,
      limit: limitParam,
      offset: offsetParam,
      startDate,
      endDate
    });

    // Verify vendor exists
    const vendorRef = adminDb.collection("staging_tailors").doc(tailorUID);
    const vendorSnap = await vendorRef.get();

    if (!vendorSnap.exists) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Build query
    let payoutQuery = adminDb.collection("staging_payouts")
      .where('tailorId', '==', tailorUID)
      .orderBy('createdAt', 'desc');

    // Add status filter if not 'all'
    if (status !== 'all') {
      payoutQuery = adminDb.collection("staging_payouts")
        .where('tailorId', '==', tailorUID)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc');
    }

    // Add limit
    if (limitParam > 0) {
      payoutQuery = payoutQuery.limit(limitParam + offsetParam);
    }

    // Execute query
    const querySnapshot = await payoutQuery.get();
    const allPayouts: PayoutRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allPayouts.push({
        id: doc.id,
        ...data
      } as PayoutRecord);
    });

    // Apply date filtering (Firestore doesn't support complex date range queries easily)
    let filteredPayouts = allPayouts;
    if (startDate || endDate) {
      filteredPayouts = allPayouts.filter(payout => {
        const payoutDate = new Date(payout.createdAt);
        if (startDate && payoutDate < new Date(startDate)) return false;
        if (endDate && payoutDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Apply pagination
    const paginatedPayouts = filteredPayouts.slice(offsetParam, offsetParam + limitParam);

    // Calculate summary statistics
    const summary = {
      totalEarnings: filteredPayouts
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + p.vendorAmount, 0),
      successfulPayouts: filteredPayouts.filter(p => p.status === 'success').length,
      failedPayouts: filteredPayouts.filter(p => p.status === 'failed').length,
      pendingPayouts: filteredPayouts.filter(p => p.status === 'pending').length,
      lastPayoutDate: filteredPayouts.length > 0 ? filteredPayouts[0].createdAt : undefined
    };

    const response: PayoutHistoryResponse = {
      payouts: paginatedPayouts,
      totalCount: filteredPayouts.length,
      hasMore: offsetParam + limitParam < filteredPayouts.length,
      summary
    };

    console.log('[Payout History API] Returning:', {
      payoutCount: paginatedPayouts.length,
      totalCount: filteredPayouts.length,
      hasMore: response.hasMore,
      summary
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Payout History API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch payout history',
        details: error.message 
      },
      { status: 500 }
    );
  }
}