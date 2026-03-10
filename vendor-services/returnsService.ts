import { db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const getUserReturns = async (userId: string) => {
  try {
    const returnsRef = collection(db, "staging_returns");

    // Since user_id is nested in user_order array, we need to get all returns and filter client-side
    // This is because Firestore doesn't support querying nested fields in arrays efficiently
    const snapshot = await getDocs(returnsRef);

    if (snapshot.empty) {
      console.log("No returns found in collection");
      return [];
    }

    // Filter returns that contain the user_id in any of their user_order items
    const userReturns = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
        } as any;
      })
      .filter((returnDoc) => {
        // Check if any order in user_order array has the matching user_id
        return returnDoc.user_order?.some((order: any) => order.user_id === userId);
      });

    console.log(`Found ${userReturns.length} returns for user ${userId}`);
    return userReturns;
  } catch (error) {
    console.error("Error fetching user returns:", error);
    return [];
  }
};
