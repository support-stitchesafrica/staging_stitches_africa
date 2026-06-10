"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getDbInstance } from "@/firebase";

/**
 * Checks whether the current user is a verified purchaser of a given product.
 * A verified purchaser has at least one non-cancelled order containing the product.
 *
 * Requirements: 1.1, 1.5
 */
export function useVerifiedPurchaser(
  productId: string,
  userId: string | null
): { isVerified: boolean; loading: boolean } {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Requirement 1.5: return false immediately when userId is null
    if (!userId) {
      setIsVerified(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const checkPurchase = async () => {
      try {
        const db = getDbInstance();
        // Correct path: users_orders/{userId}/user_orders (Requirement 1.1)
        const ordersRef = collection(db, "users_orders", userId, "user_orders");
        const q = query(ordersRef, where("product_id", "==", productId));
        const snapshot = await getDocs(q);

        if (cancelled) return;

        // Filter client-side for non-cancelled orders (Requirement 1.1)
        const hasValidOrder = snapshot.docs.some(
          (doc) => doc.data().order_status !== "cancelled"
        );

        setIsVerified(hasValidOrder);
      } catch (error) {
        // Requirement 1.5: log error, return isVerified: false without blocking the page
        console.error("[useVerifiedPurchaser] Firestore query failed:", error);
        if (!cancelled) setIsVerified(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkPurchase();

    return () => {
      cancelled = true;
    };
  }, [productId, userId]);

  return { isVerified, loading };
}
