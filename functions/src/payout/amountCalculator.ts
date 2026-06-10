import { UserOrder } from "../../../types";
import { PayoutCalculation } from "./types";

type OrderData = Partial<UserOrder>;

/**
 * Calculates vendor payout using source_original_price (NGN vendor price before platform commission).
 * Falls back to source_price, then price only if source_original_price is not set.
 */
export function calculateVendorPayout(order: OrderData): PayoutCalculation {
  const grossAmount = order.source_original_price ?? order.source_price ?? order.price ?? 0;
  const shippingFee = order.shipping_fee ?? 0;
  const netAmount = Math.max(0, grossAmount - shippingFee);
  const vendorAmount = parseFloat((netAmount * 0.80).toFixed(2));
  const platformAmount = parseFloat((netAmount * 0.20).toFixed(2));
  const currency = order.source_currency ?? order.currency ?? "NGN";

  return { grossAmount, shippingFee, netAmount, vendorAmount, platformAmount, currency };
}
