/**
 * VVIP Bank Details API Route
 * 
 * GET /api/checkout/vvip/bank-details
 * 
 * Returns bank account details for VVIP manual payments.
 * 
 * Requirements: 4.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBankDetails } from '@/lib/marketing/vvip-checkout-service';

export async function GET(request: NextRequest) {
  try {
    const bankDetails = getBankDetails();

    return NextResponse.json({
      success: true,
      bankDetails,
    });

  } catch (error) {
    console.error('[API] Error getting bank details:', error);

    return NextResponse.json(
      {
        error: 'BANK_DETAILS_ERROR',
        message: 'Failed to retrieve bank details',
      },
      { status: 500 }
    );
  }
}