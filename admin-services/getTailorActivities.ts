// services/getTailorActivities.ts
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export interface TailorActivity {
  id: string;
  message: string;
  name: string;
  timestamp: string; // ISO string so it's easy to format
  user_id: string;
  value?: string | number;
}

export async function getTailorActivities(): Promise<TailorActivity[]> {
  // Step 1: Get all tailor IDs
  const tailorsSnap = await getDocs(collection(db, "staging_tailors"));
  const tailorIds = new Set<string>();

  tailorsSnap.forEach((doc) => {
    const data = doc.data();
    if (data.tailor_id) {
      tailorIds.add(data.tailor_id);
    }
  });

  if (tailorIds.size === 0) {
    return [];
  }

  // Step 2: Get all activities
  const activitiesSnap = await getDocs(collection(db, "staging_activity"));
  const tailorActivities: TailorActivity[] = [];

  activitiesSnap.forEach((doc) => {
    const data = doc.data();
    if (tailorIds.has(data.user_id)) {
      tailorActivities.push({
        id: doc.id,
        message: data.message,
        name: data.name,
        timestamp: data.timestamp?.toDate?.().toISOString() ?? new Date().toISOString(),
        user_id: data.user_id,
        value: data.value ?? "",
      });
    }
  });

  // Sort newest first
  return tailorActivities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
