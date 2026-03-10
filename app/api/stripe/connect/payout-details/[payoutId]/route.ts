import { NextRequest, NextResponse } from 'next/server';
// Remove client-side Firebase imports
import type { PayoutRecord } from '@/lib/stripe/payout-history-service';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/stripe/connect/payout-details/[payoutId]
 * Fetch detailed information for a specific payout
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const { payoutId } = params;

    if (!payoutId) {
      return NextResponse.json(
        { error: 'Missing payoutId parameter' },
        { status: 400 }
      );
    }

    console.log('[Payout Details API] Fetching details for:', payoutId);

    // Get payout document using admin SDK
    const payoutDoc = await adminDb.collection("staging_payouts").doc(payoutId).get();

    if (!payoutDoc.exists) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    const payoutData = payoutDoc.data();
    const payout: PayoutRecord = {
      id: payoutDoc.id,
      ...payoutData
    } as PayoutRecord;

    console.log('[Payout Details API] Returning payout details for:', payoutId);

    return NextResponse.json(payout);

  } catch (error: any) {
    console.error('[Payout Details API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch payout details',
        details: error.message 
      },
      { status: 500 }
    );
  }
}