import { Firestore, Timestamp } from "firebase-admin/firestore";
import { PayoutProvider, PayoutStatus } from "./types";

export interface PayoutLogData {
  order_id: string;
  tailor_id: string;
  amount: number;
  currency: string;
  provider: PayoutProvider | null;
  status: "completed" | "failed" | "skipped";
  reference: string | null;
  error: string | null;
  reason: string | null;
  gross_amount: number;
  shipping_fee: number;
  net_amount: number;
}

/**
 * Writes a payout audit log to the `payout_logs` collection.
 * Returns the created document ID.
 */
export async function writePayoutLog(
  db: Firestore,
  data: PayoutLogData
): Promise<string> {
  const docRef = await db.collection("payout_logs").add({
    ...data,
    created_at: Timestamp.now(),
  });
  return docRef.id;
}
