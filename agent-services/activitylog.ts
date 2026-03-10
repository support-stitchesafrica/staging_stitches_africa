// services/activityService.ts
import { addDoc, collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../firebase"; // Adjust this import to your actual Firebase config

interface ActivityPayload {
  name: string;
  message: string;
  user_id: string;
  value: string;
}

export const addActivityLog = async (payload: ActivityPayload) => {
  try {
    const activityRef = collection(db, "staging_activity");
    const activityData = {
      ...payload,
      timestamp: Timestamp.now(),
    };
    await addDoc(activityRef, activityData);
    console.log("Activity log added:", activityData);
  } catch (error) {
    console.error("Error adding activity log:", error);
    throw error;
  }
};

export const getActivityLogsByAgent = async (agentId: string) => {
  try {
    const activityRef = collection(db, "staging_activity");
    const q = query(
      activityRef,
      where("user_id", "==", agentId),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return logs;
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    // Optional: Fallback if index is missing
    if (error?.code === "failed-precondition" && error.message.includes("index")) {
      return []; // fallback to empty array instead of crashing
    }
    throw error;
  }
};

