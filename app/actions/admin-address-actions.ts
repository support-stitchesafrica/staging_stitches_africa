"use server";

import { adminDb } from "@/lib/firebase-admin";
import { UserAddress } from "@/types";

export async function fetchUserAddressesAdmin(userId: string): Promise<UserAddress[]> {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`[AdminAction] Fetching addresses for user: ${userId}`);

    // Use adminDb to bypass security rules
    // Collection path: users_addresses/{userId}/user_addresses
    const collectionPath = `users_addresses/${userId}/user_addresses`;
    const snapshot = await adminDb.collection(collectionPath).get();

    if (snapshot.empty) {
      console.log(`[AdminAction] No addresses found for user: ${userId}`);
      return [];
    }

    const addresses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to Dates if needed, or Strings for client serialization
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      } as UserAddress;
    });

    console.log(`[AdminAction] Found ${addresses.length} addresses`);
    
    // Serialize simpler types for client component if necessary
    // Next.js server actions handle JSON serialization, but Date objects are fine.
    return JSON.parse(JSON.stringify(addresses)); 
  } catch (error: any) {
    console.error("[AdminAction] Error fetching user addresses:", error);
    throw new Error(`Failed to fetch user addresses: ${error.message}`);
  }
}
