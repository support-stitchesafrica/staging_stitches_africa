import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  deleteDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";

// ✅ Define the data type for each waiting list entry
export interface WaitingListEntry {
  id: string;
  name?: string;
  email: string;
  location?: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  createdAt?: Timestamp;
}

/**
 * 🔹 Get all waiting list users from Firestore
 * Sorted by creation date (most recent first)
 */
export async function getAllWaitingList(): Promise<WaitingListEntry[]> {
  try {
    const waitingListRef = collection(db, "staging_waiting_list");
    const q = query(waitingListRef, orderBy("createdAt", "desc"));

    const snapshot = await getDocs(q);

    const data: WaitingListEntry[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<WaitingListEntry, "id">),
    }));

    return data;
  } catch (error) {
    console.error("❌ Error fetching waiting list:", error);
    throw new Error("Failed to fetch waiting list");
  }
}

/**
 * 🔹 waitingListService — for CRUD operations
 */
export const waitingListService = {
  // ✅ Get all entries
  async getAll() {
    return await getAllWaitingList();
  },

  // ✅ Add new entry
  async add(data: Omit<WaitingListEntry, "id" | "createdAt">) {
    try {
      const ref = collection(db, "staging_waiting_list");
      await addDoc(ref, {
        ...data,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("❌ Error adding waiting list entry:", error);
      throw new Error("Failed to add waiting list entry");
    }
  },

  // ✅ Delete entry by ID
  async delete(id: string) {
    try {
      const ref = doc(db, "staging_waiting_list", id);
      await deleteDoc(ref);
    } catch (error) {
      console.error("❌ Error deleting waiting list entry:", error);
      throw new Error("Failed to delete waiting list entry");
    }
  },
};
