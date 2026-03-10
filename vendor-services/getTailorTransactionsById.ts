// services/tailors.ts
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase"

export interface TailorTransaction {
  transaction_id: string
  amount: number
  created_by: string
  date: any // Firestore Timestamp
  description: string
  order_id: string
  related_transaction_id?: string
  status: string
  type: string
}

export const getTailorTransactionsById = async (
  tailorId: string
): Promise<TailorTransaction[]> => {
  const transactionsRef = collection(db, `tailors/${tailorId}/transactions`)
  const snapshot = await getDocs(transactionsRef)

  if (snapshot.empty) {
    console.warn(`No transactions found for tailorId: ${tailorId}`)
  }
console.log("Fetching transactions for:", tailorId)
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      transaction_id: doc.id, // doc.id is critical
      amount: data.amount,
      created_by: data.created_by,
      date: data.date,
      description: data.description,
      order_id: data.order_id,
      related_transaction_id: data.related_transaction_id || "",
      status: data.status,
      type: data.type,
    }
  })
}
