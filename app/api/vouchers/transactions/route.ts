import { NextRequest, NextResponse } from 'next/server';
import { VoucherRepository } from '@/lib/suregifts/voucher-repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId && !orderId) {
      return NextResponse.json(
        { error: 'Either userId or orderId is required' },
        { status: 400 }
      );
    }

    let transactions;

    if (orderId) {
      transactions = await VoucherRepository.getTransactionsByOrder(orderId);
    } else if (userId) {
      transactions = await VoucherRepository.getUserTransactions(userId, limit);
    }

    return NextResponse.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('[API] Failed to get voucher transactions:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve transactions' 
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}