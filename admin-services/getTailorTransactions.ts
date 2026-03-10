// services/tailors.ts
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // adjust path accordingly

export interface TailorTransaction {
  transaction_id: string;
  amount: number;
  created_by: string;
  date: string;
  description: string;
  order_id: string;
  related_transaction_id: string;
  status: string;
  type: string;
}

export const getAllTailorTransactions = async (): Promise<TailorTransaction[]> => {
  const snapshot = await getDocs(collectionGroup(db, "staging_transactions"));

  const transactions: TailorTransaction[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      transaction_id: data.transaction_id,
      amount: data.amount,
      created_by: data.created_by,
      date: data.date,
      description: data.description,
      order_id: data.order_id,
      related_transaction_id: data.related_transaction_id,
      status: data.status,
      type: data.type,
    };
  });

  return transactions;
};
