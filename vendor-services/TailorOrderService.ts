// vendor-services/TailorOrderService.ts
// Feature: vendor-order-payment-tracking
import {
  collection,
  collectionGroup,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { getDbInstance } from "@/firebase";
import type { CartItem } from "@/types";
import type { UserAddress } from "@/vendor-services/TailorOrders";

// Re-export UserAddress for consumers
export type { UserAddress } from "@/vendor-services/TailorOrders";

export interface TailorOrder {
  order_id: string;
  product_id: string;
  title: string;
  quantity: number;
  price: number;
  shipping_fee: number;
  order_status: string;
  delivery_date: string;
  delivery_type: string;
  user_id: string;
  user_address: UserAddress;
  images: string[];
  timestamp: Timestamp | string;
  tailor_id: string;
  tailor_name: string;
  payment_status: "unpaid" | "paid";
  paid_at?: Timestamp | string;
  paid_by?: string;
  wallet_reset_failed?: boolean;
}

export interface TailorOrderContext {
  user_id: string;
  user_address: UserAddress;
  delivery_type?: string;
  delivery_date?: string;
  order_status?: string;
}

/**
 * Writes one TailorOrder document per unique tailor in the cart.
 * Fire-and-forget: errors are caught and logged, never re-thrown.
 */
export async function writeTailorOrderDocs(
  items: CartItem[],
  orderId: string,
  shippingFee: number,
  context?: TailorOrderContext
): Promise<void> {
  try {
    const db = getDbInstance();

    // Group items by tailor_id
    const byTailor = new Map<string, CartItem[]>();
    for (const item of items) {
      const tailorId = item.tailor_id;
      if (!tailorId) continue;
      if (!byTailor.has(tailorId)) byTailor.set(tailorId, []);
      byTailor.get(tailorId)!.push(item);
    }

    const writes = Array.from(byTailor.entries()).map(async ([tailorId, tailorItems]) => {
      for (const item of tailorItems) {
        const doc: Omit<TailorOrder, "paid_at" | "paid_by" | "wallet_reset_failed"> = {
          order_id: orderId,
          product_id: item.product_id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          shipping_fee: shippingFee,
          order_status: context?.order_status ?? "Processing",
          delivery_date: context?.delivery_date ?? new Date().toISOString(),
          delivery_type: context?.delivery_type ?? "Standard",
          user_id: context?.user_id ?? item.user_id,
          user_address: context?.user_address ?? ({} as UserAddress),
          images: item.images ?? [],
          timestamp: Timestamp.now(),
          tailor_id: tailorId,
          tailor_name: item.tailor,
          payment_status: "unpaid",
        };

        await addDoc(collection(db, "tailors", tailorId, "orders"), doc).catch(
          (err) => console.error(`[TailorOrderService] Failed to write order doc for tailor ${tailorId}:`, err)
        );
      }
    });

    await Promise.all(writes);
  } catch (err) {
    console.error("[TailorOrderService] writeTailorOrderDocs failed:", err);
  }
}

/**
 * Fetches all orders for a specific tailor, ordered by timestamp desc.
 * Used by the vendor dashboard.
 */
export async function getTailorOrders(tailorId: string): Promise<TailorOrder[]> {
  try {
    const db = getDbInstance();
    const q = query(
      collection(db, "tailors", tailorId, "orders"),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...(d.data() as TailorOrder), order_id: d.data().order_id || d.id }));
  } catch (err) {
    console.error("[TailorOrderService] getTailorOrders failed:", err);
    return [];
  }
}

/**
 * Computes the wallet balance for a tailor as the sum of price × quantity
 * across all orders with payment_status === 'unpaid'.
 *
 * Feature: vendor-order-payment-tracking
 * Property 14: Wallet display equals sum of price × quantity for unpaid orders
 * Validates: Requirements 5.1
 */
export function computeWalletBalance(orders: TailorOrder[]): number {
  return orders
    .filter((o) => o.payment_status === "unpaid")
    .reduce((sum, o) => sum + o.price * o.quantity, 0);
}

/**
 * Fetches all tailor orders across all tailors via collectionGroup.
 * Used by the marketing dashboard.
 */
export async function getAllTailorOrders(): Promise<TailorOrder[]> {
  try {
    const db = getDbInstance();
    const snap = await getDocs(collectionGroup(db, "orders"));
    return snap.docs.map((d) => ({ ...(d.data() as TailorOrder), order_id: d.data().order_id || d.id }));
  } catch (err) {
    console.error("[TailorOrderService] getAllTailorOrders failed:", err);
    return [];
  }
}
