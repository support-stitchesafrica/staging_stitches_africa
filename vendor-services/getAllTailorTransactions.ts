import { collectionGroup, getDocs } from "firebase/firestore";
import { getDbInstance } from "../firebase";
import { TailorTransaction } from "./getTailorTransactionsById";
import { extractTailorIdFromPath } from "./transactionFilters";

export interface TailorTransactionWithMeta extends TailorTransaction {
  tailor_id: string;
  tailor_name?: string;
  payment_status?: "unpaid" | "paid";
  approved_at?: string;
  approved_by?: string;
}

export const getAllTailorTransactions = async (): Promise<TailorTransactionWithMeta[]> => {
  try {
    const snapshot = await getDocs(collectionGroup(getDbInstance(), "transactions"));

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      // Extract tailor_id from path: tailors/{tailorId}/transactions/{transactionId}
      const tailor_id = extractTailorIdFromPath(doc.ref.path);

      return {
        transaction_id: doc.id,
        amount: data.amount,
        created_by: data.created_by,
        date: data.date,
        description: data.description,
        order_id: data.order_id,
        related_transaction_id: data.related_transaction_id || "",
        status: data.status,
        type: data.type,
        tailor_id,
        tailor_name: data.tailor_name,
        payment_status: data.payment_status ?? "unpaid",
        approved_at: data.approved_at,
        approved_by: data.approved_by,
      };
    });
  } catch (error) {
    console.error("getAllTailorTransactions error:", error);
    return [];
  }
};
