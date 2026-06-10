/**
 * Fetches payment_status for all orders belonging to a specific vendor
 * from the users_orders/{userId}/user_orders collectionGroup.
 *
 * The marketing portal writes payment_status to this collection, so vendors
 * must read from here to see up-to-date payment approval status.
 */
import { collectionGroup, getDocs, query, where } from "firebase/firestore";
import { getDbInstance } from "../firebase";

export interface OrderPaymentStatus {
  /** The shared order_id field on the document */
  order_id: string;
  /** Firestore document ID */
  doc_id: string;
  /** The user who placed the order */
  user_id: string;
  payment_status: "paid" | "unpaid";
  approved_at?: any;
  approved_by?: string;
}

export async function getVendorOrderPaymentStatuses(
  tailorId: string
): Promise<OrderPaymentStatus[]> {
  try {
    const db = getDbInstance();
    const q = query(
      collectionGroup(db, "user_orders"),
      where("tailor_id", "==", tailorId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        order_id: data.order_id || doc.id,
        doc_id: doc.id,
        user_id: doc.ref.parent.parent?.id ?? data.user_id ?? "",
        payment_status: data.payment_status ?? "unpaid",
        approved_at: data.approved_at,
        approved_by: data.approved_by,
      };
    });
  } catch (err) {
    console.error("[getVendorOrderPaymentStatuses] failed:", err);
    return [];
  }
}
