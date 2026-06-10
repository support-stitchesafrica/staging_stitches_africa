import { serverTimestamp } from 'firebase/firestore';
import type { ProductReview } from '@/types/reviews';

/**
 * Returns the deterministic Firestore document ID for a review.
 * Enforces one review per user per product via setDoc upsert semantics.
 */
export function getReviewDocId(productId: string, userId: string): string {
  return `${productId}_${userId}`;
}

/**
 * Builds the Firestore payload for creating a new review document.
 */
export function buildReviewPayload(
  productId: string,
  userId: string,
  rating: number,
  comment: string
) {
  return {
    product_id: productId,
    user_id: userId,
    rating,
    comment,
    verified_purchase: true as const,
    createdAt: serverTimestamp(),
  };
}

/**
 * Builds the Firestore payload for updating an existing review document.
 */
export function buildReviewUpdatePayload(rating: number, comment: string) {
  return {
    rating,
    comment,
    updatedAt: serverTimestamp(),
  };
}

/**
 * Computes the arithmetic mean of all review ratings, rounded to 1 decimal place.
 * Returns null for an empty array.
 */
export function computeAverageRating(reviews: ProductReview[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * Resolves the display name for a reviewer.
 * Returns displayName when non-empty, otherwise "Customer #" + first 4 chars of uid.
 */
export function resolveDisplayName(
  displayName: string | null | undefined,
  uid: string
): string {
  if (displayName && displayName.trim().length > 0) {
    return displayName.trim();
  }
  return `Customer #${uid.slice(0, 4)}`;
}
