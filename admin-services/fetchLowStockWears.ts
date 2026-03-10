import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const fetchLowStockWears = async (threshold = 5) => {
  const q = query(collection(db, "staging_tailor_works"), where("wear_quantity", "<=", threshold));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
