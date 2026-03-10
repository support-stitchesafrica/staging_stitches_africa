import { NextRequest, NextResponse } from 'next/server';
import { SureGiftsService } from '@/lib/suregifts/suregifts-service';
import { VoucherErrorCode } from '@/types/suregifts';

export async function POST(request: NextRequest) {
  try {
    const { voucherCode } = await request.json();

    if (!voucherCode || typeof voucherCode !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Voucher code is required',
          errorCode: VoucherErrorCode.VALIDATION_ERROR
        },
        { status: 400 }
      );
    }

    const result = await SureGiftsService.validateVoucher(voucherCode);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Voucher validation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        errorCode: VoucherErrorCode.API_ERROR
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}