"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  doc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDbInstance } from "@/firebase";
import type { ProductReview } from "@/types/reviews";
import {
  getReviewDocId,
  buildReviewPayload,
  buildReviewUpdatePayload,
  resolveDisplayName,
} from "@/lib/reviews/reviewService";

interface UseProductReviewsResult {
  reviews: ProductReview[];
  loading: boolean;
  userReview: ProductReview | null;
  submitReview: (rating: number, comment: string, user: User) => Promise<void>;
  error: string | null;
}

/**
 * Fetches and manages reviews for a given product.
 * Reviews are ordered most-recent first (Requirement 3.5).
 * Exposes submitReview for upsert semantics (Requirement 2.4).
 *
 * Requirements: 2.3, 2.4, 2.7, 3.1, 3.5, 3.6, 5.1, 5.2
 */
export function useProductReviews(
  productId: string,
  currentUserId?: string | null
): UseProductReviewsResult {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const db = getDbInstance();
      const reviewsRef = collection(db, "product_reviews");

      let snapshot;
      try {
        // Ordered query requires a composite index on (product_id, createdAt desc)
        const q = query(
          reviewsRef,
          where("product_id", "==", productId),
          orderBy("createdAt", "desc")
        );
        snapshot = await getDocs(q);
      } catch (indexErr: any) {
        // Firestore will throw if the composite index doesn't exist yet.
        // Fall back to an unordered query and sort client-side.
        console.warn(
          "[useProductReviews] Ordered query failed (index may be building). Falling back to unordered fetch.",
          indexErr?.message ?? indexErr
        );
        const fallbackQ = query(
          reviewsRef,
          where("product_id", "==", productId)
        );
        snapshot = await getDocs(fallbackQ);
      }

      const fetched: ProductReview[] = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            product_id: data.product_id,
            user_id: data.user_id,
            // Resolve display name at read time (Requirements 6.1, 6.2, 6.3)
            display_name: resolveDisplayName(data.display_name ?? null, data.user_id),
            rating: data.rating,
            comment: data.comment ?? "",
            verified_purchase: true,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as ProductReview;
        })
        // Client-side sort as fallback for Requirement 3.5
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });

      setReviews(fetched);
    } catch (err: any) {
      // Requirement 3.6 / error handling: set error state, do not crash
      console.error("[useProductReviews] Failed to fetch reviews:", err);
      // Don't show an error to the user if it's a permissions issue on an empty collection
      // (can happen before Firestore rules are deployed)
      if (err?.code === "permission-denied") {
        console.warn(
          "[useProductReviews] Permission denied — ensure Firestore rules are deployed: firebase deploy --only firestore:rules"
        );
        setReviews([]);
      } else {
        setError("Failed to load reviews. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /**
   * Submits (creates or updates) a review for the current user.
   * Uses setDoc with the deterministic doc ID for upsert semantics (Requirement 2.4).
   * Throws on error so the calling form can display a toast (Requirement 2.7).
   */
  const submitReview = useCallback(
    async (rating: number, comment: string, user: User) => {
      const db = getDbInstance();
      const docId = getReviewDocId(productId, user.uid);
      const docRef = doc(db, "product_reviews", docId);

      const existingReview = reviews.find((r) => r.user_id === user.uid);

      const payload = existingReview
        ? buildReviewUpdatePayload(rating, comment)
        : buildReviewPayload(productId, user.uid, rating, comment);

      // setDoc with merge:true handles both create and update
      await setDoc(docRef, payload, { merge: true });

      // Refresh the list after a successful write (Requirement 2.7)
      await fetchReviews();
    },
    [productId, reviews, fetchReviews]
  );

  const userReview =
    currentUserId != null
      ? reviews.find((r) => r.user_id === currentUserId) ?? null
      : null;

  return { reviews, loading, userReview, submitReview, error };
}
