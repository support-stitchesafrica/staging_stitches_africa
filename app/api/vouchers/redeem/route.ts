import { NextRequest, NextResponse } from 'next/server';
import { SureGiftsService } from '@/lib/suregifts/suregifts-service';
import { VoucherRepository } from '@/lib/suregifts/voucher-repository';
import { VoucherErrorCode } from '@/types/suregifts';

export async function POST(request: NextRequest) {
  try {
    const { 
      voucherCode, 
      amount, 
      orderId, 
      customerEmail, 
      customerName,
      userId 
    } = await request.json();

    // Validate required fields
    if (!voucherCode || !amount || !orderId || !customerEmail || !customerName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          errorCode: VoucherErrorCode.VALIDATION_ERROR
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Amount must be greater than 0',
          errorCode: VoucherErrorCode.VALIDATION_ERROR
        },
        { status: 400 }
      );
    }

    // First validate the voucher
    const validation = await SureGiftsService.validateVoucher(voucherCode);
    
    if (!validation.success || !validation.voucher) {
      return NextResponse.json({
        success: false,
        error: validation.error || 'Invalid voucher',
        errorCode: validation.errorCode || VoucherErrorCode.INVALID_CODE
      });
    }

    const voucher = validation.voucher;

    // Check if voucher has sufficient balance
    if (voucher.balance < amount) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient voucher balance',
        errorCode: VoucherErrorCode.INSUFFICIENT_BALANCE
      });
    }

    // Redeem the voucher
    const redemption = await SureGiftsService.redeemVoucher(
      voucherCode,
      amount,
      orderId,
      customerEmail,
      customerName
    );

    if (!redemption.success) {
      return NextResponse.json(redemption);
    }

    // Save transaction record if userId is provided
    if (userId) {
      try {
        await VoucherRepository.saveTransaction({
          voucherCode,
          orderId,
          userId,
          amountRedeemed: redemption.amountRedeemed,
          remainingBalance: redemption.remainingBalance,
          transactionId: redemption.transactionId || `voucher_${Date.now()}`,
          status: 'completed',
          createdAt: new Date(),
          completedAt: new Date()
        });

        // Save admin log
        await VoucherRepository.saveAdminLog({
          voucherCode,
          orderId,
          customerEmail,
          amountRedeemed: redemption.amountRedeemed,
          transactionId: redemption.transactionId || '',
          timestamp: new Date(),
          status: 'success'
        });
      } catch (dbError) {
        console.error('[API] Failed to save voucher transaction:', dbError);
        // Don't fail the redemption if database save fails
      }
    }

    return NextResponse.json(redemption);
  } catch (error) {
    console.error('[API] Voucher redemption error:', error);
    
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