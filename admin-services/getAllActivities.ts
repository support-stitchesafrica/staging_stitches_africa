// lib/firebase/getAllActivities.ts
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase"; // update path accordingly

export interface Activities {
  id: string;
  name: string;
  message: string;
  value: string;
  user_id: string;
  timestamp: string;
}

export const getAllActivities = async (): Promise<Activities[]> => {
  try {
    const activityRef = collection(db, "staging_activity");
    const q = query(activityRef, orderBy("timestamp", "desc")); // optional sorting
    const snapshot = await getDocs(q);

    const activities: Activities[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name || "",
        message: data.message || "",
        value: data.value || "",
        user_id: data.user_id || "",
        timestamp:
          data.timestamp instanceof Timestamp
            ? data.timestamp.toDate().toISOString()
            : new Date().toISOString() // fallback
      };
    });

    return activities;
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return [];
  }
};
