import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const EMAIL_API_URL = 'https://stitchesafricamobile-backend.onrender.com/api/Email/Send';
const FINANCE_EMAIL = 'finance@stitchesafrica.com';

async function sendFinanceEmail(payload: {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  provider: string;
  amount: number;
  currency: string;
  requestId: string;
}) {
  const { vendorId, vendorName, vendorEmail, provider, amount, currency, requestId } = payload;
  const symbol = currency === 'NGN' ? '₦' : currency;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Payout Request — Finance</title></head>
<body style="font-family:'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <table style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
    <tr>
      <td style="background:#1f2937;padding:25px;text-align:center;">
        <img src="https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png" width="130" alt="Stitches Africa"/>
        <h1 style="color:white;margin:12px 0 0;font-size:20px;">New Payout Request</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;">
        <p style="color:#374151;font-size:15px;margin:0 0 20px;">A vendor has initiated a payout request and is awaiting your approval.</p>
        <div style="background:#f8fafc;padding:20px;border-radius:8px;border-left:4px solid #3b82f6;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px;">Request ID:</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${requestId}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Vendor:</td><td style="padding:6px 0;color:#111827;font-size:14px;">${vendorName} (${vendorId})</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Email:</td><td style="padding:6px 0;color:#111827;font-size:14px;">${vendorEmail}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Provider:</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-transform:capitalize;">${provider}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Amount:</td><td style="padding:6px 0;color:#059669;font-size:16px;font-weight:700;">${symbol}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Date:</td><td style="padding:6px 0;color:#111827;font-size:14px;">${date}</td></tr>
          </table>
        </div>
        <div style="text-align:center;margin:28px 0 0;">
          <a href="https://www.stitchesafrica.com/admin/payout-requests"
             style="display:inline-block;background:#1f2937;color:white;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            Review &amp; Approve in Admin
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:15px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Stitches Africa — Finance Notification</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await fetch(EMAIL_API_URL, {
    method: 'POST',
    headers: { accept: '*/*', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body: html,
      subject: `Payout Request — ${vendorName} via ${provider} | Stitches Africa`,
      emails: [{ emailAddress: FINANCE_EMAIL, name: 'Finance Team' }],
      from: 'noreply@stitchesafrica.com',
      replyTo: 'support@stitchesafrica.com',
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, vendorName, vendorEmail, provider, amount, currency = 'NGN' } = body;

    if (!vendorId || !provider || !amount) {
      return NextResponse.json({ error: 'vendorId, provider, and amount are required' }, { status: 400 });
    }

    if (!['paystack', 'stripe', 'flutterwave'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    // Validate requested amount against delivered-only balance per provider
    const tailorDoc = await adminDb.collection('tailors').doc(vendorId).get();
    const tailorData = tailorDoc.data() || {};
    const byProvider: Record<string, number> = tailorData.wallet_by_provider || {};
    const grossForProvider = Number(byProvider[provider] ?? 0);

    if (grossForProvider <= 0) {
      return NextResponse.json(
        { error: `No available balance for ${provider}. Balance: ₦0` },
        { status: 400 }
      );
    }

    // Compute delivered-only earnings for this provider by checking tailor's order sub-docs
    let deliveredAmount = 0;
    const tailorOrdersSnap = await adminDb
      .collection('tailors').doc(vendorId).collection('orders').get();

    if (!tailorOrdersSnap.empty) {
      const orderIdSet = new Set<string>();
      tailorOrdersSnap.docs.forEach((d) => {
        if (d.data().order_id) orderIdSet.add(d.data().order_id);
      });

      const orderIds = Array.from(orderIdSet);
      const deliveredOrderIds = new Set<string>();

      for (let i = 0; i < orderIds.length; i += 10) {
        const batch = orderIds.slice(i, i + 10);
        const snap = await adminDb.collection('orders').where('orderId', 'in', batch).get();
        snap.docs.forEach((d) => {
          const od = d.data();
          const status = (od.fulfilmentStatus ?? od.status ?? '').toLowerCase();
          const orderProvider = (od.paymentProvider ?? '').toLowerCase();
          if (status === 'delivered' && orderProvider === provider) {
            deliveredOrderIds.add(od.orderId);
          }
        });
      }

      tailorOrdersSnap.docs.forEach((d) => {
        const item = d.data();
        if (!deliveredOrderIds.has(item.order_id)) return;
        const earning = Number(
          item.source_original_price ?? item.sourceOriginalPrice ?? item.price ?? 0
        ) * Math.max(1, Number(item.quantity ?? 1));
        if (earning > 0) deliveredAmount += earning;
      });
    }

    // Cap at gross wallet balance
    const availableForProvider = Math.min(deliveredAmount, grossForProvider);

    if (availableForProvider <= 0) {
      return NextResponse.json(
        { error: `No available balance for ${provider}. Funds are held until orders are delivered.` },
        { status: 400 }
      );
    }

    // Use the available (delivered) balance as the payout amount
    const payoutAmount = availableForProvider;

    // Check for existing pending request for this vendor+provider
    const existing = await adminDb
      .collection('payout_requests')
      .where('vendorId', '==', vendorId)
      .where('provider', '==', provider)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: 'You already have a pending payout request for this provider.' },
        { status: 409 }
      );
    }

    // Create payout request document using the server-verified balance
    const ref = await adminDb.collection('payout_requests').add({
      vendorId,
      vendorName: vendorName || '',
      vendorEmail: vendorEmail || '',
      provider,
      amount: payoutAmount,
      currency,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Send notification email to finance team (non-blocking)
    sendFinanceEmail({
      vendorId,
      vendorName: vendorName || vendorId,
      vendorEmail: vendorEmail || '',
      provider,
      amount: payoutAmount,
      currency,
      requestId: ref.id,
    }).catch((err) => console.error('[payout-request] email error:', err));

    return NextResponse.json({ success: true, requestId: ref.id });
  } catch (error: any) {
    console.error('[payout-request] error:', error);
    return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get('vendorId');

  if (!vendorId) {
    return NextResponse.json({ error: 'vendorId is required' }, { status: 400 });
  }

  try {
    const snapshot = await adminDb
      .collection('payout_requests')
      .where('vendorId', '==', vendorId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('[payout-request GET] error:', error);
    return NextResponse.json({ error: 'Failed to fetch payout requests' }, { status: 500 });
  }
}
