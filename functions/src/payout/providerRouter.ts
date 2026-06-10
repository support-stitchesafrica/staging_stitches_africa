import { UserOrder } from "../../../types";
import { PayoutProvider } from "./types";

type OrderData = Partial<UserOrder>;

/**
 * Detects the payment provider from the order's `payment_provider` field.
 * Returns null if the provider is missing or unrecognized.
 */
export function detectProvider(order: OrderData): PayoutProvider | null {
  const provider = order.payment_provider?.toLowerCase();
  if (provider === "paystack") return "paystack";
  if (provider === "flutterwave") return "flutterwave";
  if (provider === "stripe") return "stripe";
  return null;
}
