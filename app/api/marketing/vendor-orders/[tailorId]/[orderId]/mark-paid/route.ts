import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyAuth } from '@/lib/backoffice/api-auth';
import { PermissionService } from '@/lib/backoffice/permission-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { tailorId: string; orderId: string } }
) {
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // 2. Check marketing.write permission
    if (!PermissionService.hasPermission(user, 'marketing', 'write')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { tailorId, orderId } = params;

    // 3. Fetch the order document
    const orderRef = adminDb
      .collection('tailors')
      .doc(tailorId)
      .collection('orders')
      .doc(orderId);

    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data()!;

    // 4. Check if already paid
    if (orderData.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Order is already marked as paid' },
        { status: 409 }
      );
    }

    // 5. Mark order as paid
    const paidAt = Timestamp.now();
    await orderRef.update({
      payment_status: 'paid',
      paid_at: paidAt,
      paid_by: user.uid,
    });

    // 6. Reset tailor wallet to 0 with retry (up to 3 attempts)
    const tailorRef = adminDb.collection('tailors').doc(tailorId);
    let walletResetSuccess = false;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await tailorRef.update({ wallet: 0 });
        walletResetSuccess = true;
        break;
      } catch (walletError) {
        console.error(
          `[mark-paid] Wallet reset attempt ${attempt}/3 failed for tailor ${tailorId}:`,
          walletError
        );
        if (attempt === 3) {
          // Final failure — flag on the order doc
          try {
            await orderRef.update({ wallet_reset_failed: true });
          } catch (flagError) {
            console.error(
              '[mark-paid] Failed to set wallet_reset_failed flag:',
              flagError
            );
          }
        }
      }
    }

    // 7. Return success
    return NextResponse.json({
      success: true,
      data: {
        orderId,
        tailorId,
        paid_at: paidAt.toDate().toISOString(),
      },
    });
  } catch (error) {
    console.error('[mark-paid] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
