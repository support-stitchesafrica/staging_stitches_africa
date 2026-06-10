import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const EMAIL_API_URL = 'https://stitchesafricamobile-backend.onrender.com/api/Email/Send';
const FINANCE_EMAIL = 'finance@stitchesafrica.com';

async function sendEmail(to: string, name: string, subject: string, html: string) {
  const res = await fetch(EMAIL_API_URL, {
    method: 'POST',
    headers: { accept: '*/*', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body: html,
      subject,
      emails: [{ emailAddress: to, name }],
      from: 'noreply@stitchesafrica.com',
      replyTo: 'support@stitchesafrica.com',
    }),
  });
  if (!res.ok) throw new Error(`Email API ${res.status}`);
}

function fmt(amount: number, currency: string) {
  const symbol = currency === 'NGN' ? '₦' : currency + ' ';
  return symbol + amount.toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

async function sendVendorApprovalEmail(vendorEmail: string, vendorName: string, provider: string, amount: number, currency: string, adminNote?: string) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Payout Approved</title></head>
<body style="font-family:'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <table style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
    <tr>
      <td style="background:linear-gradient(135deg,#1f2937 0%,#374151 100%);padding:30px;text-align:center;">
        <img src="https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png" width="130" alt="Stitches Africa"/>
        <h1 style="color:white;margin:12px 0 0;font-size:22px;">Payout Approved!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:35px 30px;">
        <h2 style="color:#111827;margin:0 0 16px;font-size:18px;">Hello ${vendorName},</h2>
        <p style="color:#374151;font-size:15px;margin:0 0 24px;">
          Great news! Your payout request has been <strong>approved</strong> and is now being processed via
          <strong style="text-transform:capitalize;">${provider}</strong>.
        </p>
        <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:22px;border-radius:12px;text-align:center;margin:0 0 24px;">
          <p style="margin:0;color:rgba(255,255,255,.9);font-size:13px;font-weight:500;">PAYOUT AMOUNT</p>
          <p style="margin:6px 0 0;color:white;font-size:30px;font-weight:bold;">${fmt(amount, currency)}</p>
        </div>
        <div style="background:#f8fafc;padding:18px;border-radius:8px;border-left:4px solid #10b981;margin:0 0 20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:5px 0;color:#6b7280;font-size:14px;width:130px;">Provider:</td><td style="padding:5px 0;color:#111827;font-size:14px;font-weight:600;text-transform:capitalize;">${provider}</td></tr>
            <tr><td style="padding:5px 0;color:#6b7280;font-size:14px;">Amount:</td><td style="padding:5px 0;color:#059669;font-size:14px;font-weight:700;">${fmt(amount, currency)}</td></tr>
            <tr><td style="padding:5px 0;color:#6b7280;font-size:14px;">Date:</td><td style="padding:5px 0;color:#111827;font-size:14px;">${date}</td></tr>
            <tr><td style="padding:5px 0;color:#6b7280;font-size:14px;">Status:</td><td style="padding:5px 0;color:#059669;font-size:14px;font-weight:600;">✓ Approved</td></tr>
            ${adminNote ? `<tr><td style="padding:5px 0;color:#6b7280;font-size:14px;">Note:</td><td style="padding:5px 0;color:#374151;font-size:14px;">${adminNote}</td></tr>` : ''}
          </table>
        </div>
        <p style="color:#6b7280;font-size:14px;text-align:center;margin:0;">
          Funds will be transferred to your <strong style="text-transform:capitalize;">${provider}</strong> account shortly.
          Processing times vary by provider (typically 1–3 business days).
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:15px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Questions? <a href="mailto:support@stitchesafrica.com" style="color:#3b82f6;">support@stitchesafrica.com</a></p>
        <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  await sendEmail(vendorEmail, vendorName, `Your Payout Has Been Approved | Stitches Africa`, html);
}

async function sendVendorRejectionEmail(vendorEmail: string, vendorName: string, provider: string, amount: number, currency: string, adminNote?: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Payout Request Update</title></head>
<body style="font-family:'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <table style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
    <tr>
      <td style="background:linear-gradient(135deg,#1f2937 0%,#374151 100%);padding:30px;text-align:center;">
        <img src="https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png" width="130" alt="Stitches Africa"/>
        <h1 style="color:white;margin:12px 0 0;font-size:22px;">Payout Request Update</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:35px 30px;">
        <h2 style="color:#111827;margin:0 0 16px;font-size:18px;">Hello ${vendorName},</h2>
        <p style="color:#374151;font-size:15px;margin:0 0 20px;">
          We wanted to let you know that your payout request of <strong>${fmt(amount, currency)}</strong> via
          <strong style="text-transform:capitalize;">${provider}</strong> could not be processed at this time.
        </p>
        ${adminNote ? `
        <div style="background:#fef2f2;padding:16px;border-radius:8px;border-left:4px solid #ef4444;margin:0 0 20px;">
          <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;">Reason:</p>
          <p style="margin:6px 0 0;color:#7f1d1d;font-size:14px;">${adminNote}</p>
        </div>` : ''}
        <p style="color:#374151;font-size:14px;margin:0 0 20px;">
          You can submit a new payout request from your vendor settings once the issue has been resolved.
          If you have questions, please contact our support team.
        </p>
        <div style="text-align:center;">
          <a href="https://www.stitchesafrica.com/vendor/settings?tab=payouts"
             style="display:inline-block;background:#1f2937;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            View Payout Settings
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:15px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Questions? <a href="mailto:support@stitchesafrica.com" style="color:#3b82f6;">support@stitchesafrica.com</a></p>
        <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  await sendEmail(vendorEmail, vendorName, `Payout Request Update | Stitches Africa`, html);
}

async function sendAdminActionConfirmationEmail(action: 'approved' | 'rejected', requestId: string, vendorName: string, vendorId: string, provider: string, amount: number, currency: string, adminNote?: string) {
  const isApproved = action === 'approved';
  const statusColor = isApproved ? '#059669' : '#dc2626';
  const statusLabel = isApproved ? 'APPROVED' : 'REJECTED';
  const date = new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Payout ${statusLabel} — Admin Confirmation</title></head>
<body style="font-family:'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <table style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
    <tr>
      <td style="background:${isApproved ? '#059669' : '#dc2626'};padding:25px;text-align:center;">
        <img src="https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png" width="120" alt="Stitches Africa"/>
        <h1 style="color:white;margin:10px 0 0;font-size:20px;">Payout ${statusLabel}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;">
        <p style="color:#374151;font-size:15px;margin:0 0 20px;">
          A payout request has been <strong style="color:${statusColor};">${action}</strong> by the admin team.
        </p>
        <div style="background:#f8fafc;padding:20px;border-radius:8px;border-left:4px solid ${statusColor};margin:0 0 20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:130px;">Request ID:</td><td style="padding:6px 0;color:#111827;font-size:13px;font-family:monospace;">${requestId}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Vendor:</td><td style="padding:6px 0;color:#111827;font-size:14px;">${vendorName} (${vendorId})</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Provider:</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-transform:capitalize;">${provider}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Amount:</td><td style="padding:6px 0;color:${statusColor};font-size:15px;font-weight:700;">${fmt(amount, currency)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Status:</td><td style="padding:6px 0;color:${statusColor};font-size:14px;font-weight:700;">${statusLabel}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Processed:</td><td style="padding:6px 0;color:#111827;font-size:14px;">${date}</td></tr>
            ${adminNote ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Note:</td><td style="padding:6px 0;color:#374151;font-size:14px;">${adminNote}</td></tr>` : ''}
          </table>
        </div>
        <div style="text-align:center;">
          <a href="https://www.stitchesafrica.com/admin/payout-requests"
             style="display:inline-block;background:#1f2937;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            View All Payout Requests
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:15px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Stitches Africa — Admin Notification</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail(FINANCE_EMAIL, 'Finance Team', `Payout ${statusLabel} — ${vendorName} via ${provider} | Stitches Africa`, html);
}

// ─── Provider payout helpers ─────────────────────────────────────────────────

async function triggerPaystackPayout(subaccountCode: string, amount: number, vendorName: string, requestId: string): Promise<string> {
  // Paystack transfer: create a transfer recipient from the subaccount, then initiate transfer
  // Amount in kobo (NGN × 100)
  const amountKobo = Math.round(amount * 100);

  // First create a transfer recipient using the subaccount code
  const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'subaccount',
      name: vendorName,
      account_number: subaccountCode,
      currency: 'NGN',
    }),
  });

  const recipientData = await recipientRes.json();
  if (!recipientRes.ok || !recipientData.data?.recipient_code) {
    throw new Error(`Paystack recipient creation failed: ${JSON.stringify(recipientData)}`);
  }

  const recipientCode = recipientData.data.recipient_code;

  // Initiate the transfer
  const transferRes = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      amount: amountKobo,
      recipient: recipientCode,
      reason: `Payout for request ${requestId}`,
      currency: 'NGN',
    }),
  });

  const transferData = await transferRes.json();
  if (!transferRes.ok) {
    throw new Error(`Paystack transfer failed: ${JSON.stringify(transferData)}`);
  }

  return transferData.data?.transfer_code || transferData.data?.id || 'paystack_transfer';
}

async function triggerFlutterwavePayout(subaccountId: string, accountBank: string, accountNumber: string, amount: number, vendorName: string, requestId: string): Promise<string> {
  const transferRes = await fetch('https://api.flutterwave.com/v3/transfers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account_bank: accountBank,
      account_number: accountNumber,
      amount,
      narration: `Payout for request ${requestId}`,
      currency: 'NGN',
      reference: `payout_${requestId}_${Date.now()}`,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/flutterwave/payout-callback`,
      debit_currency: 'NGN',
    }),
  });

  const transferData = await transferRes.json();
  if (!transferRes.ok || transferData.status !== 'success') {
    throw new Error(`Flutterwave transfer failed: ${JSON.stringify(transferData)}`);
  }

  return String(transferData.data?.id || 'flutterwave_transfer');
}

async function triggerStripePayout(stripeAccountId: string, amount: number, requestId: string): Promise<string> {
  // Stripe: create a transfer to the connected account
  const stripeRes = await fetch('https://api.stripe.com/v1/transfers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: String(Math.round(amount * 100)), // cents
      currency: 'usd',
      destination: stripeAccountId,
      description: `Payout for request ${requestId}`,
    }).toString(),
  });

  const stripeData = await stripeRes.json();
  if (!stripeRes.ok) {
    throw new Error(`Stripe transfer failed: ${JSON.stringify(stripeData)}`);
  }

  return stripeData.id || 'stripe_transfer';
}

// GET — list all payout requests (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    let query = adminDb.collection('payout_requests').orderBy('createdAt', 'desc');
    if (status !== 'all') {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await (query as any).limit(100).get();

    const requests = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('[admin/payout-requests GET] error:', error);
    return NextResponse.json({ error: 'Failed to fetch payout requests' }, { status: 500 });
  }
}

// POST — approve or reject a payout request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action, adminNote } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
    }

    const docRef = adminDb.collection('payout_requests').doc(requestId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
    }

    const data = docSnap.data()!;

    if (data.status !== 'pending') {
      return NextResponse.json({ error: `Request is already ${data.status}` }, { status: 409 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // ── On approval: deduct wallet + trigger provider payout ─────────────────
    let providerTransferId: string | null = null;
    let payoutError: string | null = null;

    if (action === 'approve') {
      // 1. Fetch vendor's tailor doc to get subaccount details
      const tailorDoc = await adminDb.collection('tailors').doc(data.vendorId).get();
      const tailorData = tailorDoc.data() || {};

      // 2. Deduct from wallet and per-provider bucket atomically
      const providerKey = (data.provider || 'unknown').toLowerCase().trim();
      await adminDb.collection('tailors').doc(data.vendorId).update({
        wallet: FieldValue.increment(-data.amount),
        wallet_balance: FieldValue.increment(-data.amount),
        [`wallet_by_provider.${providerKey}`]: FieldValue.increment(-data.amount),
        'wallet_details.last_updated': FieldValue.serverTimestamp(),
      });

      // 3. Trigger provider-specific payout
      try {
        if (data.provider === 'paystack') {
          const subaccount = tailorData.paystackSubaccount || tailorData.paystackSubaccounts?.[0];
          const subaccountCode = subaccount?.subaccount_code || subaccount?.id;
          if (!subaccountCode) throw new Error('No Paystack subaccount found for vendor');
          providerTransferId = await triggerPaystackPayout(subaccountCode, data.amount, data.vendorName || data.vendorId, docRef.id);

        } else if (data.provider === 'flutterwave') {
          const fw = tailorData.flutterwaveSubaccount || tailorData.flutterwaveSubaccounts?.[0];
          if (!fw?.account_bank || !fw?.account_number) throw new Error('No Flutterwave subaccount found for vendor');
          providerTransferId = await triggerFlutterwavePayout(fw.subaccount_id, fw.account_bank, fw.account_number, data.amount, data.vendorName || data.vendorId, docRef.id);

        } else if (data.provider === 'stripe') {
          const stripeAccountId = tailorData.stripeConnectAccountId || tailorData.stripeAccountId || tailorData.stripeConnectAccounts?.[0]?.accountId;
          if (!stripeAccountId) throw new Error('No Stripe Connect account found for vendor');
          providerTransferId = await triggerStripePayout(stripeAccountId, data.amount, docRef.id);
        }

        // Update request with transfer reference
        await docRef.update({
          providerTransferId,
          payoutTriggeredAt: FieldValue.serverTimestamp(),
        });
      } catch (err: any) {
        payoutError = err.message || 'Provider payout failed';
        console.error(`[payout-requests] ${data.provider} payout error:`, err);
        // Rollback wallet deduction on provider failure
        await adminDb.collection('tailors').doc(data.vendorId).update({
          wallet: FieldValue.increment(data.amount),
          wallet_balance: FieldValue.increment(data.amount),
          [`wallet_by_provider.${providerKey}`]: FieldValue.increment(data.amount),
        });
        // Mark request as failed
        await docRef.update({ status: 'payout_failed', payoutError, updatedAt: FieldValue.serverTimestamp() });
        return NextResponse.json({ error: `Payout approved but provider transfer failed: ${payoutError}` }, { status: 502 });
      }
    }

    await docRef.update({
      status: newStatus,
      adminNote: adminNote || '',
      processedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Send emails (non-blocking)
    const emailPromises: Promise<void>[] = [];

    if (action === 'approve' && data.vendorEmail) {
      emailPromises.push(
        sendVendorApprovalEmail(data.vendorEmail, data.vendorName || data.vendorId, data.provider, data.amount, data.currency || 'NGN', adminNote)
          .catch((err) => console.error('[payout-requests] vendor approval email error:', err))
      );
    }

    if (action === 'reject' && data.vendorEmail) {
      emailPromises.push(
        sendVendorRejectionEmail(data.vendorEmail, data.vendorName || data.vendorId, data.provider, data.amount, data.currency || 'NGN', adminNote)
          .catch((err) => console.error('[payout-requests] vendor rejection email error:', err))
      );
    }

    // Always notify finance team of the action taken
    emailPromises.push(
      sendAdminActionConfirmationEmail(newStatus as 'approved' | 'rejected', docRef.id, data.vendorName || data.vendorId, data.vendorId, data.provider, data.amount, data.currency || 'NGN', adminNote)
        .catch((err) => console.error('[payout-requests] admin confirmation email error:', err))
    );

    Promise.allSettled(emailPromises);

    return NextResponse.json({ success: true, status: newStatus, providerTransferId });
  } catch (error: any) {
    console.error('[admin/payout-requests POST] error:', error);
    return NextResponse.json({ error: 'Failed to process payout request' }, { status: 500 });
  }
}
