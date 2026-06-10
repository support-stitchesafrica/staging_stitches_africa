import Stripe from "stripe";
import { PayoutCalculation, PayoutResult } from "../types";

interface VendorDoc {
  id: string;
  stripeConnectAccountId?: string;
  [key: string]: unknown;
}

interface OrderDoc {
  id: string;
  tailor_id: string;
  title?: string;
  product_title?: string;
  [key: string]: unknown;
}

/**
 * Currencies that use smallest unit as integer (no decimal subdivision).
 * For these, amount should NOT be multiplied by 100.
 * See: https://stripe.com/docs/currencies#zero-decimal
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "gnf", "jpy", "kmf", "krw", "mga", "pyg",
  "rwf", "ugx", "vnd", "vuv", "xaf", "xof",
]);

/**
 * Converts a decimal amount to the smallest currency unit for Stripe.
 * Multiplies by 100 for standard currencies (USD, GBP, EUR, etc.).
 * Leaves zero-decimal currencies as-is.
 */
function toSmallestUnit(amount: number, currency: string): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

/**
 * Executes a Stripe transfer payout to the vendor's connected account.
 * Uses stripe.transfers.create with destination set to vendor.stripeConnectAccountId.
 */
export async function executeStripePayout(
  order: OrderDoc,
  vendor: VendorDoc,
  calculation: PayoutCalculation,
  secretKey: string
): Promise<PayoutResult> {
  if (!vendor.stripeConnectAccountId) {
    return {
      status: "failed",
      error: "Vendor missing stripeConnectAccountId",
      provider: "stripe",
    };
  }

  const stripe = new Stripe(secretKey);
  const amountInSmallestUnit = toSmallestUnit(
    calculation.vendorAmount,
    calculation.currency
  );

  try {
    const transfer = await stripe.transfers.create({
      amount: amountInSmallestUnit,
      currency: calculation.currency.toLowerCase(),
      destination: vendor.stripeConnectAccountId,
      transfer_group: order.id,
      description: `Payout for order ${order.id}`,
    });

    return {
      status: "completed",
      reference: transfer.id,
      provider: "stripe",
    };
  } catch (err) {
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : "Stripe transfer failed with unknown error";

    return {
      status: "failed",
      error: message,
      provider: "stripe",
    };
  }
}
