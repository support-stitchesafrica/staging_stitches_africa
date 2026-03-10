import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { vvipPermissionService } from '@/lib/marketing/vvip-permission-service';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Check permissions
    const canApprovePayment = await vvipPermissionService.canApprovePayment(user.uid);
    if (!canApprovePayment) {
      return NextResponse.json(
        { error: 'Insufficient permissions to approve payments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, adminNote } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Update the order in the orders collection
    const orderRef = adminDb.collection("staging_orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();
    if (!orderData?.isVvip) {
      return NextResponse.json(
        { error: 'Order is not a VVIP order' },
        { status: 400 }
      );
    }

    // Update order status
    await orderRef.update({
      payment_status: 'approved',
      order_status: 'processing',
      payment_verified_by: user.uid,
      payment_verified_at: new Date(),
      admin_note: adminNote || null,
      updated_at: new Date()
    });

    console.log(`VVIP order ${orderId} approved by ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Payment approved successfully',
      orderId
    });

  } catch (error) {
    console.error('VVIP Order Approval Error:', error);
    return NextResponse.json(
      { error: 'Failed to approve payment' },
      { status: 500 }
    );
  }
}