import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { vvipOrderService } from '@/lib/marketing/vvip-order-service';
import { VvipError } from '@/types/vvip';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const body = await request.json();
    const { orderId, adminNote } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 },
      );
    }

    const result = await vvipOrderService.approvePayment(
      orderId,
      user.uid,
      adminNote,
    );

    console.log(`VVIP order ${orderId} approved by ${user.email}`);

    return NextResponse.json({
      success: true,
      message: result.message,
      orderId: result.orderId,
      payment_status: result.data?.payment_status,
    });
  } catch (error) {
    if (error instanceof VvipError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    console.error('VVIP Order Approval Error:', error);
    return NextResponse.json(
      { error: 'Failed to approve payment' },
      { status: 500 },
    );
  }
}
