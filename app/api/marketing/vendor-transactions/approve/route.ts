import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

const AUTHORIZED_ROLES = ['team_lead', 'bdm', 'super_admin'] as const;

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computeVendorEarning(txData: Record<string, unknown>): number {
  const qty = Math.max(1, Math.floor(num(txData.quantity)));

  // Align with checkout wallet credit: prefer NGN vendor price (source_original_price), then source_price.
  const srcOrig = num(txData.source_original_price);
  const srcPrice = num(txData.source_price);

  const unit =
    srcOrig > 0 ? srcOrig :
    srcPrice > 0 ? srcPrice :
    0;

  return Math.max(0, unit * qty);
}

function resolveProviderKey(txData: Record<string, unknown>): string {
  const raw =
    (typeof txData.provider === 'string' ? txData.provider : '') ||
    (typeof txData.payment_provider === 'string' ? txData.payment_provider : '') ||
    (typeof txData.paymentProvider === 'string' ? txData.paymentProvider : '');

  const key = raw.toLowerCase().trim();
  return key || 'unknown';
}

export async function POST(request: NextRequest) {
  // 1. Validate request body
  let body: { userId?: string; orderId?: string; action?: 'paid' | 'unpaid' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { userId, orderId, action = 'paid' } = body;
  if (!userId || !orderId) {
    return NextResponse.json(
      { success: false, error: 'userId and orderId are required' },
      { status: 400 }
    );
  }

  if (action !== 'paid' && action !== 'unpaid') {
    return NextResponse.json(
      { success: false, error: 'action must be "paid" or "unpaid"' },
      { status: 400 }
    );
  }

  // 2. Authenticate
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // 3. Role check
  if (!AUTHORIZED_ROLES.includes(user.role as typeof AUTHORIZED_ROLES[number])) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // 4. Fetch order document from users_orders/{userId}/user_orders/{orderId}
  const txRef = adminDb
    .collection('users_orders')
    .doc(userId)
    .collection('user_orders')
    .doc(orderId);

  try {
    const result = await adminDb.runTransaction(async (t) => {
      const txSnap = await t.get(txRef);
      if (!txSnap.exists) {
        return { ok: false as const, status: 404, error: 'Transaction not found' };
      }

      const txData = (txSnap.data() ?? {}) as Record<string, unknown>;
      const currentStatus = String(txData.payment_status ?? 'unpaid');
      const alreadyPaid = currentStatus === 'paid';

      const tailorId = String(txData.tailor_id ?? '').trim();
      const providerKey = resolveProviderKey(txData);
      const previouslyDeducted = !!txData.wallet_deducted_at;
      const prevDeductedAmount = num(txData.wallet_deducted_amount);

      // Mark paid: deduct vendor earning from wallet exactly once.
      if (action === 'paid') {
        if (!alreadyPaid) {
          t.update(txRef, {
            payment_status: 'paid',
            approved_at: FieldValue.serverTimestamp(),
            approved_by: user.uid,
          });
        }

        // If we already deducted for this row, do nothing (idempotent).
        if (previouslyDeducted) {
          return { ok: true as const, deducted: false, deductedAmount: prevDeductedAmount, providerKey };
        }

        const amount = computeVendorEarning(txData);
        if (amount <= 0) {
          // No earning to deduct — still mark as paid, but do not touch wallet.
          t.update(txRef, {
            wallet_deducted_at: FieldValue.serverTimestamp(),
            wallet_deducted_amount: 0,
            wallet_deducted_provider: providerKey,
          });
          return { ok: true as const, deducted: false, deductedAmount: 0, providerKey };
        }

        if (tailorId) {
          const tailorRef = adminDb.collection('tailors').doc(tailorId);
          t.update(tailorRef, {
            wallet: FieldValue.increment(-amount),
            wallet_balance: FieldValue.increment(-amount),
            [`wallet_by_provider.${providerKey}`]: FieldValue.increment(-amount),
            'wallet_details.last_updated': FieldValue.serverTimestamp(),
          });
        }

        t.update(txRef, {
          wallet_deducted_at: FieldValue.serverTimestamp(),
          wallet_deducted_amount: amount,
          wallet_deducted_provider: providerKey,
        });

        return { ok: true as const, deducted: true, deductedAmount: amount, providerKey };
      }

      // Mark unpaid: revert wallet deduction if it happened before.
      if (action === 'unpaid') {
        if (alreadyPaid) {
          t.update(txRef, {
            payment_status: 'unpaid',
            approved_at: FieldValue.delete(),
            approved_by: FieldValue.delete(),
          });
        }

        if (previouslyDeducted && prevDeductedAmount > 0 && tailorId) {
          const tailorRef = adminDb.collection('tailors').doc(tailorId);
          const pk = String(txData.wallet_deducted_provider ?? providerKey).toLowerCase().trim() || providerKey;
          t.update(tailorRef, {
            wallet: FieldValue.increment(prevDeductedAmount),
            wallet_balance: FieldValue.increment(prevDeductedAmount),
            [`wallet_by_provider.${pk}`]: FieldValue.increment(prevDeductedAmount),
            'wallet_details.last_updated': FieldValue.serverTimestamp(),
          });
        }

        t.update(txRef, {
          wallet_deducted_at: FieldValue.delete(),
          wallet_deducted_amount: FieldValue.delete(),
          wallet_deducted_provider: FieldValue.delete(),
        });

        return { ok: true as const, deducted: false, deductedAmount: 0, providerKey };
      }

      return { ok: false as const, status: 400, error: 'Invalid action' };
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        userId,
        payment_status: action,
        wallet: {
          providerKey: result.providerKey,
          deducted: result.deducted,
          deductedAmount: result.deductedAmount,
        },
      },
    });
  } catch (error) {
    console.error('[vendor-transactions/approve] Transaction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    );
  }

  // unreachable
}
