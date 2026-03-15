import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY!;
const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://https://staging-stitches-africa.vercel.app";

const ACCEPTED_KYC_STATUSES = ["verified", "approved", "completed", "true"];

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("verif-hash");
    const body = await req.json();

    console.log('[Webhook Router] Received webhook:', {
      hasFlutterwaveSignature: !!signature,
      event: body.event || body.type,
      status: body.status || body.description,
    });

    // 🔒 Verify Flutterwave signature
    if (signature && signature === FLW_SECRET_HASH) {
      return handleFlutterwaveWebhook(body);
    }

    // 🚚 Check if this is a DHL delivery event
    const status = body.status || body.description || null;
    if (status && String(status).toLowerCase() === 'delivered') {
      console.log('[Webhook Router] Routing to Stripe payout webhook (DHL delivery)');
      return handleStripePayoutWebhook(body);
    }

    // Default: treat as Stripe webhook
    console.log('[Webhook Router] Routing to Stripe payout webhook (default)');
    return handleStripePayoutWebhook(body);
  } catch (error: any) {
    console.error("Webhook router error:", error);
    return NextResponse.json({ message: "Webhook server error", error: error.message }, { status: 500 });
  }
}

//
// -------------------- FLUTTERWAVE WEBHOOK HANDLER --------------------
//
async function handleFlutterwaveWebhook(body: any) {
  try {
    const { event, data } = body;

    if (event !== "charge.completed" || data.status !== "successful") {
      return NextResponse.json({ message: "Ignored non-success charge event" }, { status: 200 });
    }

    const orderId = data.tx_ref;
    if (!orderId) {
      return NextResponse.json({ message: "Missing order ID" }, { status: 400 });
    }

    // ✅ Mark order as paid
    const orderRef = adminDb.collection("staging_users_orders").doc(orderId);
    await orderRef.update({
      payment_status: "paid",
      flutterwave_transaction_id: data.id,
      payment_date: new Date().toISOString(),
    });

    console.log(`✅ Payment confirmed for order ${orderId}`);
    return NextResponse.json({ message: "Payment confirmed" }, { status: 200 });
  } catch (error: any) {
    console.error("Flutterwave webhook handler error:", error);
    return NextResponse.json({ message: "Flutterwave webhook failed", error: error.message }, { status: 500 });
  }
}

//
// -------------------- STRIPE CONNECT PAYOUT WEBHOOK HANDLER --------------------
//
async function handleStripePayoutWebhook(body: any) {
  try {
    // Forward to Stripe Connect payout endpoint
    const response = await fetch(`${BASE_URL}/api/stripe/connect/payout-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error: any) {
    console.error('Stripe payout webhook routing error:', error);
    return NextResponse.json({ message: 'Webhook routing failed', error: error.message }, { status: 500 });
  }
}


//
// -------------------- EMAIL SENDER --------------------
//
async function sendPayoutEmail({
  to,
  vendorName,
  amount,
  orderId,
}: {
  to: string;
  vendorName: string;
  amount: number;
  orderId: string;
}) {
  const html = `
  <html>
    <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px;">
      <table style="max-width:600px; margin:auto; background:white; border-radius:8px; padding:24px;">
        <tr><td style="text-align:center;">
          <img src="https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png" width="120" />
        </td></tr>
        <tr><td>
          <h2>Hello ${vendorName},</h2>
          <p>Your order <strong>#${orderId}</strong> has been delivered and a payout has been issued.</p>
          <p>Amount: <strong>$${amount.toLocaleString()}</strong></p>
          <p>Thank you for being part of the Stitches Africa family.</p>
          <a href="https://https://staging-stitches-africa.vercel.app/vendor/dashboard" style="display:inline-block; background:#000; color:white; padding:10px 20px; border-radius:8px; text-decoration:none;">
            View Dashboard
          </a>
        </td></tr>
      </table>
      <p style="text-align:center; color:#999; font-size:12px;">© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
    </body>
  </html>`;

  await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
    method: "POST",
    headers: { accept: "*/*", "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      subject: "Payout Received — Stitches Africa",
      body: html,
    }),
  });
}