/**
 * VVIP Orders API Route
 * 
 * POST /api/vvip/orders - Create a new VVIP order
 * 
 * This endpoint handles the creation of VVIP orders from the manual checkout process.
 */

import { NextRequest, NextResponse } from 'next/server';
import { vvipCheckoutService } from '@/lib/marketing/vvip-checkout-service';
import { buildVvipUserOrderMirrorWrites } from '@/lib/marketing/vvip-user-order-mirror';
import { VvipError, VvipErrorCode } from '@/types/vvip';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const EMAIL_API = 'https://stitchesafricamobile-backend.onrender.com/api/Email/Send';
const ADMIN_EMAILS = ['Sales@stitchesafrica.com', 'stitchesafrica5m@gmail.com', 'stitchesafrica5m@gmail.com', 'support@stitchesafrica.com'];

async function sendEmail(to: string, name: string, subject: string, html: string) {
  try {
    await fetch(EMAIL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        body: html,
        emails: [{ emailAddress: to, name }],
      }),
    });
  } catch (err) {
    console.warn('[VVIP Orders] Email send failed:', err);
  }
}

function buildCustomerEmail(params: {
  customerName: string;
  orderId: string;
  paymentReference: string;
  amount: number;
  currency: string;
  items: any[];
}) {
  const { customerName, orderId, paymentReference, amount, currency, items } = params;
  const itemRows = items.map((item: any) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${item.title || item.name || 'Item'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity || 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${currency} ${Number(item.price || 0).toLocaleString()}</td>
    </tr>`
  ).join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
      <div style="background:#1a1a1a;padding:24px;text-align:center;">
        <img src="https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png" alt="Stitches Africa" style="height:40px;" />
      </div>
      <div style="padding:32px 24px;">
        <h2 style="color:#1a1a1a;margin:0 0 8px;">Order Received ✓</h2>
        <p style="color:#555;margin:0 0 24px;">Hi ${customerName}, we've received your VVIP order and your payment proof is under review.</p>
        <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Payment Reference:</strong> ${paymentReference}</p>
          <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Total Amount:</strong> ${currency} ${Number(amount).toLocaleString()}</p>
          <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Status:</strong> <span style="color:#d97706;font-weight:600;">Pending Verification</span></p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="padding:8px 12px;text-align:left;font-size:13px;">Item</th>
              <th style="padding:8px 12px;text-align:center;font-size:13px;">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-size:13px;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="color:#555;font-size:14px;">Our team will verify your payment within 24 hours. You'll receive another email once your order is confirmed.</p>
        <p style="color:#555;font-size:14px;margin-top:16px;">Questions? Contact us at <a href="mailto:support@stitchesafrica.com" style="color:#000;">support@stitchesafrica.com</a></p>
      </div>
      <div style="background:#f5f5f5;padding:16px;text-align:center;">
        <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
      </div>
    </div>`;
}

function buildAdminEmail(params: {
  customerName: string;
  customerEmail: string;
  orderId: string;
  paymentReference: string;
  amount: number;
  currency: string;
  paymentProofUrl: string;
  items: any[];
}) {
  const { customerName, customerEmail, orderId, paymentReference, amount, currency, paymentProofUrl, items } = params;
  const itemList = items.map((item: any) =>
    `<li style="margin-bottom:4px;">${item.title || item.name || 'Item'} × ${item.quantity || 1} — ${currency} ${Number(item.price || 0).toLocaleString()}</li>`
  ).join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
      <div style="background:#1a1a1a;padding:24px;text-align:center;">
        <img src="https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png" alt="Stitches Africa" style="height:40px;" />
      </div>
      <div style="padding:32px 24px;">
        <h2 style="color:#1a1a1a;margin:0 0 8px;">New VVIP Order — Action Required</h2>
        <p style="color:#555;margin:0 0 24px;">A VVIP shopper has placed an order and uploaded payment proof. Please verify and approve.</p>
        <div style="background:#fff8e1;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
          <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Payment Reference:</strong> ${paymentReference}</p>
          <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Amount:</strong> ${currency} ${Number(amount).toLocaleString()}</p>
        </div>
        <h3 style="color:#333;font-size:15px;">Items Ordered:</h3>
        <ul style="color:#555;font-size:14px;padding-left:20px;">${itemList}</ul>
        <div style="margin-top:24px;">
          <a href="${paymentProofUrl}" target="_blank" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View Payment Proof</a>
        </div>
        <p style="color:#555;font-size:13px;margin-top:24px;">Log in to the admin dashboard to approve or reject this order.</p>
      </div>
      <div style="background:#f5f5f5;padding:16px;text-align:center;">
        <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
      </div>
    </div>`;
}

/**
 * POST /api/vvip/orders
 * 
 * Create a new VVIP order with manual payment
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body first (read only once)
    const orderData = await request.json();

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    let userId: string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Verify Firebase ID token
      const idToken = authHeader.substring(7);
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      userId = decodedToken.uid;
    } else {
      // For now, get userId from request body (less secure but functional)
      userId = orderData.userId;
      
      if (!userId) {
        return NextResponse.json(
          { 
            error: VvipErrorCode.UNAUTHORIZED, 
            message: 'User ID is required' 
          },
          { status: 401 }
        );
      }
    }

    // Validate required fields (amounts in `currency`; no USD default)
    const requiredFields = [
      'userId',
      'items',
      'shippingAddress',
      'payment_proof_url',
      'payment_reference',
      'payment_date',
      'amount_paid',
      'currency',
      'shipping_fee',
    ];

    for (const field of requiredFields) {
      if (orderData[field] === undefined || orderData[field] === null) {
        return NextResponse.json(
          { 
            error: VvipErrorCode.VALIDATION_ERROR, 
            message: `Missing required field: ${field}`,
            field 
          },
          { status: 400 }
        );
      }
    }

    // Ensure the user making the request matches the order user
    if (orderData.userId !== userId) {
      return NextResponse.json(
        { 
          error: VvipErrorCode.UNAUTHORIZED, 
          message: 'Cannot create order for another user' 
        },
        { status: 403 }
      );
    }

    const orderCurrencyRaw =
      typeof orderData.currency === 'string' ? orderData.currency : '';
    const orderCurrency = orderCurrencyRaw.trim().toUpperCase();
    if (!orderCurrency) {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'currency must be a non-empty string',
          field: 'currency',
        },
        { status: 400 },
      );
    }

    const amountPaidNum = Number(orderData.amount_paid);
    if (!Number.isFinite(amountPaidNum) || amountPaidNum <= 0) {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'amount_paid must be a positive number',
          field: 'amount_paid',
        },
        { status: 400 },
      );
    }

    const shippingFeeNum = Number(orderData.shipping_fee);
    const shippingFee =
      Number.isFinite(shippingFeeNum) ? Math.max(0, shippingFeeNum) : 0;

    // Create VVIP order using the checkout service
    const result = await vvipCheckoutService.createManualPaymentOrder({
      userId: orderData.userId,
      items: orderData.items,
      amount_paid: amountPaidNum,
      total: amountPaidNum,
      currency: orderCurrency,
      shipping_address: orderData.shippingAddress,
      payment_proof_url: orderData.payment_proof_url,
      payment_reference: orderData.payment_reference,
      payment_date: new Date(orderData.payment_date),
      shipping_fee: shippingFee,
      subtotal_after_coupon:
        typeof orderData.subtotal_after_coupon === 'number' &&
        Number.isFinite(orderData.subtotal_after_coupon)
          ? orderData.subtotal_after_coupon
          : undefined,
      coupon_code: orderData.coupon_code ?? null,
      coupon_value:
        typeof orderData.coupon_value === 'number' && Number.isFinite(orderData.coupon_value)
          ? orderData.coupon_value
          : null,
      coupon_currency: orderData.coupon_currency ?? null,
      measurements: orderData.measurements,
    });

    const userSnap = await adminDb.collection('users').doc(userId).get();

    try {
      const itemsNormalized = vvipCheckoutService.normalizeVvipOrderLineItems(
        orderData.items || [],
      );
      const userDataPrecheck = userSnap.data();
      const userNameFb = `${userDataPrecheck?.first_name || ''} ${userDataPrecheck?.last_name || ''}`
        .trim();

      const mirrorWrites = buildVvipUserOrderMirrorWrites({
        userId,
        masterOrderId: result.orderId,
        items: itemsNormalized,
        shippingFee,
        shippingAddress: orderData.shippingAddress,
        userNameFallback: userNameFb,
        orderStatus: 'pending',
      });

      await Promise.all(
        mirrorWrites.map(({ docId, data }) =>
          adminDb
            .collection('users_orders')
            .doc(userId)
            .collection('user_orders')
            .doc(docId)
            .set(data as any),
        ),
      );
    } catch (mirrorErr) {
      console.warn('[VVIP] Failed to mirror order to user_orders (non-blocking):', mirrorErr);
    }

    // Fetch user details for email notifications
    const userDoc = userSnap;
    const userData = userDoc.data();
    const customerName = `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Valued Customer';
    const customerEmail = userData?.email || '';

    // Send customer confirmation email (non-blocking)
    if (customerEmail) {
      sendEmail(
        customerEmail,
        customerName,
        `Order Received — ${orderData.payment_reference}`,
        buildCustomerEmail({
          customerName,
          orderId: result.orderId,
          paymentReference: orderData.payment_reference,
          amount: amountPaidNum,
          currency: orderCurrency,
          items: orderData.items,
        })
      );
    }

    // Send admin notification emails (non-blocking)
    const adminHtml = buildAdminEmail({
      customerName,
      customerEmail,
      orderId: result.orderId,
      paymentReference: orderData.payment_reference,
      amount: amountPaidNum,
      currency: orderCurrency,
      paymentProofUrl: orderData.payment_proof_url,
      items: orderData.items,
    });

    for (const adminEmail of ADMIN_EMAILS) {
      sendEmail(
        adminEmail,
        'Stitches Admin',
        `🛍️ New VVIP Order — ${customerName} | ${orderCurrency} ${Number(amountPaidNum).toLocaleString()}`,
        adminHtml
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: 'VVIP order created successfully',
      data: {
        orderId: result.orderId,
        status: 'pending_verification',
        payment_reference: orderData.payment_reference,
        created_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('VVIP Orders API Error:', error);

    if (error instanceof VvipError) {
      return NextResponse.json(
        { 
          error: error.code, 
          message: error.message,
          field: error.field,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: VvipErrorCode.DATABASE_ERROR, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}