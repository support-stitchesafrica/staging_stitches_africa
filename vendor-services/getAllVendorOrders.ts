/**
 * Fetches all vendor orders from the users_orders/{userId}/user_orders collectionGroup.
 * Used by the marketing portal to display real user-placed orders across all vendors.
 */
import { collectionGroup, getDocs } from "firebase/firestore";
import { getDbInstance } from "../firebase";
import { UserOrder } from "./TailorOrders";

export interface VendorOrderWithMeta extends UserOrder {
  /** payment_status for marketing approval workflow */
  payment_status?: "unpaid" | "paid";
  approved_at?: string;
  approved_by?: string;
}

export const getAllVendorOrders = async (): Promise<VendorOrderWithMeta[]> => {
  try {
    const snapshot = await getDocs(
      collectionGroup(getDbInstance(), "user_orders")
    );

    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      // user_id lives on the parent document (users_orders/{userId})
      const userId = doc.ref.parent.parent?.id ?? data.user_id ?? "";

      return {
        ...(data as UserOrder),
        order_id: data.order_id || doc.id,
        doc_id: doc.id,
        user_id: userId,
        tailor_id: data.tailor_id ?? "",
        tailor_name: data.tailor_name ?? "",
        timestamp:
          data.timestamp?.toDate
            ? data.timestamp.toDate().toISOString()
            : data.timestamp ?? "",
        images: data.images ?? [],
        payment_status: data.payment_status ?? "unpaid",
        approved_at: data.approved_at,
        approved_by: data.approved_by,
      } as VendorOrderWithMeta;
    });
  } catch (error) {
    console.error("getAllVendorOrders error:", error);
    return [];
  }
};
