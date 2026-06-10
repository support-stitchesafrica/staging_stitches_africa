import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

import { isDeliveryEvent } from "./deliveryDetector";
import { isKycComplete } from "./kycChecker";
import { calculateVendorPayout } from "./amountCalculator";
import { detectProvider } from "./providerRouter";
import { writePayoutLog } from "./auditLogger";
import {
  sendVendorPayoutNotification,
  sendAdminPayoutNotification,
} from "./notificationService";
import { executePaystackPayout } from "./providers/paystackPayout";
import { executeFlutterwavePayout } from "./providers/flutterwavePayout";
import { executeStripePayout } from "./providers/stripePayout";
import { PayoutProvider, PayoutResult, PayoutSkipReason } from "./types";

// ─── Secrets ─────────────────────────────────────────────────────────────────

const PAYSTACK_SECRET_KEY = defineSecret("PAYSTACK_SECRET_KEY");
const FLUTTERWAVE_SECRET_KEY = defineSecret("FLUTTERWAVE_SECRET_KEY");
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Checks that the vendor has the required payment account for the given provider. */
function vendorHasAccountForProvider(
  vendor: Record<string, unknown>,
  provider: PayoutProvider
): boolean {
  if (provider === "paystack") {
    const sub = vendor.paystackSubaccount as Record<string, unknown> | undefined;
    return !!sub?.subaccount_code;
  }
  if (provider === "flutterwave") {
    const details = vendor.flutterwaveAccountDetails as Record<string, unknown> | undefined;
    return !!details?.bank_code && !!details?.account_number;
  }
  if (provider === "stripe") {
    return typeof vendor.stripeConnectAccountId === "string" && !!vendor.stripeConnectAccountId;
  }
  return false;
}

/** Executes the payout for the detected provider with up to 3 retries (exponential backoff). */
async function executePayoutWithRetry(
  db: FirebaseFirestore.Firestore,
  provider: PayoutProvider,
  order: Record<string, unknown> & { id: string },
  vendor: Record<string, unknown> & { id: string },
  calculation: ReturnType<typeof calculateVendorPayout>
): Promise<PayoutResult> {
  const MAX_RETRIES = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (provider === "paystack") {
        const key = PAYSTACK_SECRET_KEY.value();
        return await executePaystackPayout(db, order as any, vendor as any, calculation, key);
      }
      if (provider === "flutterwave") {
        const key = FLUTTERWAVE_SECRET_KEY.value();
        return await executeFlutterwavePayout(order as any, vendor as any, calculation, key);
      }
      // stripe
      const key = STRIPE_SECRET_KEY.value();
      return await executeStripePayout(order as any, vendor as any, calculation, key);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await sleep(Math.pow(2, attempt) * 1000); // 2s, 4s
      }
    }
  }

  return {
    status: "failed",
    error: lastError?.message ?? "Payout failed after max retries",
    provider,
  };
}

// ─── Main trigger ─────────────────────────────────────────────────────────────

export const processVendorPayout = onDocumentWritten(
  {
    document: "user_orders/{orderId}",
    region: "europe-west1",
    secrets: [PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_KEY, STRIPE_SECRET_KEY],
    timeoutSeconds: 120,
  },
  async (event) => {
    const db = admin.firestore();
    const orderId = event.params.orderId;

    const beforeSnap = event.data?.before;
    const afterSnap = event.data?.after;

    // Document deleted — nothing to do
    if (!afterSnap?.exists) return;

    const before = (beforeSnap?.data() ?? {}) as Record<string, unknown>;
    const after = afterSnap.data() as Record<string, unknown>;

    // ── 7.2 Idempotency guard ────────────────────────────────────────────────
    const currentPayoutStatus = after.payout_status as string | undefined;
    if (currentPayoutStatus === "completed" || currentPayoutStatus === "processing") {
      console.log(`[Payout] Skipping order ${orderId} — payout_status is already '${currentPayoutStatus}'`);
      return;
    }

    // ── 7.3 Delivery detection ───────────────────────────────────────────────
    if (!isDeliveryEvent(before as any, after as any)) {
      return;
    }

    console.log(`[Payout] Delivery detected for order ${orderId}. Starting payout flow.`);

    const orderRef = db.collection("user_orders").doc(orderId);

    // ── 7.4 Set payout_status = 'processing' ────────────────────────────────
    await orderRef.update({ payout_status: "processing" });

    const tailorId = after.tailor_id as string | undefined;

    // ── 7.5 Fetch vendor document ────────────────────────────────────────────
    if (!tailorId) {
      console.warn(`[Payout] Order ${orderId} has no tailor_id — skipping`);
      const skipReason: PayoutSkipReason = "vendor_not_found";
      await orderRef.update({ payout_status: "skipped", payout_skip_reason: skipReason });
      const logId = await writePayoutLog(db, {
        order_id: orderId, tailor_id: "", amount: 0, currency: "NGN",
        provider: null, status: "skipped", reference: null, error: null,
        reason: skipReason, gross_amount: 0, shipping_fee: 0, net_amount: 0,
      });
      await orderRef.update({ payout_log_id: logId });
      await sendAdminPayoutNotification(db, {
        orderId, vendorId: "", status: "skipped", amount: 0, currency: "NGN",
        reason: skipReason,
      });
      return;
    }

    const vendorSnap = await db.collection("tailors").doc(tailorId).get();

    if (!vendorSnap.exists) {
      console.warn(`[Payout] Vendor ${tailorId} not found — skipping order ${orderId}`);
      const skipReason: PayoutSkipReason = "vendor_not_found";
      await orderRef.update({ payout_status: "skipped", payout_skip_reason: skipReason });
      const logId = await writePayoutLog(db, {
        order_id: orderId, tailor_id: tailorId, amount: 0, currency: "NGN",
        provider: null, status: "skipped", reference: null, error: null,
        reason: skipReason, gross_amount: 0, shipping_fee: 0, net_amount: 0,
      });
      await orderRef.update({ payout_log_id: logId });
      await sendAdminPayoutNotification(db, {
        orderId, vendorId: tailorId, status: "skipped", amount: 0, currency: "NGN",
        reason: skipReason,
      });
      return;
    }

    const vendor = { id: vendorSnap.id, ...vendorSnap.data() } as Record<string, unknown> & { id: string };

    // ── 7.6 KYC check ────────────────────────────────────────────────────────
    if (!isKycComplete(vendor as any)) {
      console.warn(`[Payout] Vendor ${tailorId} KYC incomplete — skipping order ${orderId}`);
      const skipReason: PayoutSkipReason = "kyc_incomplete";
      await orderRef.update({ payout_status: "skipped", payout_skip_reason: skipReason });
      const logId = await writePayoutLog(db, {
        order_id: orderId, tailor_id: tailorId, amount: 0, currency: "NGN",
        provider: null, status: "skipped", reference: null, error: null,
        reason: skipReason, gross_amount: 0, shipping_fee: 0, net_amount: 0,
      });
      await orderRef.update({ payout_log_id: logId });
      await sendAdminPayoutNotification(db, {
        orderId, vendorId: tailorId, status: "skipped", amount: 0, currency: "NGN",
        reason: skipReason,
      });
      return;
    }

    // ── 7.7 Calculate payout amount ──────────────────────────────────────────
    const calculation = calculateVendorPayout(after as any);

    if (calculation.vendorAmount <= 0) {
      console.warn(`[Payout] Invalid payout amount for order ${orderId} — skipping`);
      const skipReason: PayoutSkipReason = "invalid_amount";
      await orderRef.update({ payout_status: "skipped", payout_skip_reason: skipReason });
      const logId = await writePayoutLog(db, {
        order_id: orderId, tailor_id: tailorId, amount: 0, currency: calculation.currency,
        provider: null, status: "skipped", reference: null, error: null,
        reason: skipReason, gross_amount: calculation.grossAmount,
        shipping_fee: calculation.shippingFee, net_amount: calculation.netAmount,
      });
      await orderRef.update({ payout_log_id: logId });
      await sendAdminPayoutNotification(db, {
        orderId, vendorId: tailorId, status: "skipped",
        amount: 0, currency: calculation.currency, reason: skipReason,
      });
      return;
    }

    // ── 7.8 Detect payment provider ──────────────────────────────────────────
    const provider = detectProvider(after as any);

    if (!provider) {
      console.warn(`[Payout] Unknown provider for order ${orderId} — skipping`);
      const skipReason: PayoutSkipReason = "unknown_provider";
      await orderRef.update({ payout_status: "skipped", payout_skip_reason: skipReason });
      const logId = await writePayoutLog(db, {
        order_id: orderId, tailor_id: tailorId, amount: calculation.vendorAmount,
        currency: calculation.currency, provider: null, status: "skipped",
        reference: null, error: null, reason: skipReason,
        gross_amount: calculation.grossAmount, shipping_fee: calculation.shippingFee,
        net_amount: calculation.netAmount,
      });
      await orderRef.update({ payout_log_id: logId });
      await sendAdminPayoutNotification(db, {
        orderId, vendorId: tailorId, status: "skipped",
        amount: calculation.vendorAmount, currency: calculation.currency,
        reason: skipReason,
      });
      return;
    }

    // ── 7.9 Check vendor has required payment account ────────────────────────
    if (!vendorHasAccountForProvider(vendor, provider)) {
      console.warn(`[Payout] Vendor ${tailorId} has no ${provider} account — skipping order ${orderId}`);
      const skipReason: PayoutSkipReason = "no_payment_account";
      await orderRef.update({ payout_status: "skipped", payout_skip_reason: skipReason });
      const logId = await writePayoutLog(db, {
        order_id: orderId, tailor_id: tailorId, amount: calculation.vendorAmount,
        currency: calculation.currency, provider, status: "skipped",
        reference: null, error: null, reason: skipReason,
        gross_amount: calculation.grossAmount, shipping_fee: calculation.shippingFee,
        net_amount: calculation.netAmount,
      });
      await orderRef.update({ payout_log_id: logId });
      await sendAdminPayoutNotification(db, {
        orderId, vendorId: tailorId, status: "skipped",
        amount: calculation.vendorAmount, currency: calculation.currency,
        provider, reason: skipReason,
      });
      return;
    }

    // ── 7.10 Execute payout with retry ───────────────────────────────────────
    const result = await executePayoutWithRetry(db, provider, { id: orderId, ...after } as any, vendor, calculation);

    if (result.status === "completed") {
      // ── 7.11 Update order on success ──────────────────────────────────────
      await orderRef.update({
        payout_status: "completed",
        payout_reference: result.reference ?? null,
        payout_amount: calculation.vendorAmount,
        payout_provider: provider,
        payout_currency: calculation.currency,
        payout_completed_at: Timestamp.now(),
      });

      // ── 7.13 Vendor notification (success only) ───────────────────────────
      const productTitle = (after.product_title ?? after.title ?? "") as string;
      const vendorEmail = vendor.email as string | undefined;

      await sendVendorPayoutNotification(db, tailorId, {
        orderId,
        amount: calculation.vendorAmount,
        currency: calculation.currency,
        reference: result.reference ?? "",
        productTitle,
      });

      if (vendorEmail) {
        const { logPayoutEmail } = await import("./notificationService");
        await logPayoutEmail(db, vendorEmail, {
          orderId,
          amount: calculation.vendorAmount,
          currency: calculation.currency,
          reference: result.reference ?? "",
          productTitle,
          vendorName: (vendor.brandName ?? vendor.name ?? "") as string,
        });
      }
    } else {
      // ── 7.12 Update order on failure ──────────────────────────────────────
      await orderRef.update({
        payout_status: "failed",
        payout_error: result.error ?? "Unknown error",
        payout_provider: provider,
      });
    }

    // ── 7.13 Admin notification (all outcomes) ────────────────────────────────
    await sendAdminPayoutNotification(db, {
      orderId,
      vendorId: tailorId,
      status: result.status,
      amount: calculation.vendorAmount,
      currency: calculation.currency,
      provider,
      reference: result.reference ?? null,
      error: result.error ?? null,
    });

    // ── 7.14 Write audit log and update order with payout_log_id ─────────────
    const logId = await writePayoutLog(db, {
      order_id: orderId,
      tailor_id: tailorId,
      amount: calculation.vendorAmount,
      currency: calculation.currency,
      provider,
      status: result.status,
      reference: result.reference ?? null,
      error: result.error ?? null,
      reason: null,
      gross_amount: calculation.grossAmount,
      shipping_fee: calculation.shippingFee,
      net_amount: calculation.netAmount,
    });

    await orderRef.update({ payout_log_id: logId });

    console.log(`[Payout] Order ${orderId} payout ${result.status} via ${provider}. Log: ${logId}`);
  }
);
