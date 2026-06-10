"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useProductReviews } from "@/lib/hooks/useProductReviews";
import { useVerifiedPurchaser } from "@/lib/hooks/useVerifiedPurchaser";
import { RatingSummary } from "./RatingSummary";
import { ReviewForm } from "./ReviewForm";
import { ReviewList } from "./ReviewList";

interface ReviewSectionProps
{
    productId: string;
}

/**
 * Container component that composes the full review experience for a product.
 *
 * Renders exactly one of three auth/verification states:
 *  1. ReviewForm — when the user is logged in AND is a verified purchaser
 *  2. "Only verified purchasers may leave a review" — logged in but not verified
 *  3. "Log in to leave a review" prompt — not logged in
 *
 * Always renders RatingSummary and ReviewList regardless of auth state.
 * Requirements: 1.2, 1.3, 1.4, 3.1
 */
export function ReviewSection({ productId }: ReviewSectionProps)
{
    const { user } = useAuth();
    const isLoggedIn = user !== null;

    const { reviews, loading, userReview, submitReview, error } =
        useProductReviews(productId, user?.uid ?? null);

    const { isVerified, loading: verifiedLoading } = useVerifiedPurchaser(
        productId,
        user?.uid ?? null
    );

    return (
        <section className="mt-10 space-y-6" aria-label="Product reviews">
            <h2 className="text-lg font-semibold text-gray-900">Customer Reviews</h2>

            {/* Rating summary — always visible (Requirement 3.1) */}
            <RatingSummary reviews={reviews} />

            {/* Auth / verification gate */}
            <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
                {isLoggedIn ? (
                    isVerified ? (
                        /* Requirement 1.2: verified purchaser sees the form */
                        <ReviewForm
                            userReview={userReview}
                            user={user!}
                            onSubmit={submitReview}
                        />
                    ) : verifiedLoading ? (
                        /* Loading state while checking purchase verification */
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                            <span>Checking purchase history…</span>
                        </div>
                    ) : (
                        /* Requirement 1.3: logged in but not a verified purchaser */
                        <p className="text-sm text-gray-600">
                            Only verified purchasers may leave a review. Purchase this product
                            to share your experience.
                        </p>
                    )
                ) : (
                    /* Requirement 1.4: not logged in */
                    <p className="text-sm text-gray-600">
                        <Link
                            href="/shops/auth"
                            className="font-semibold text-black underline underline-offset-2 hover:text-gray-700 transition-colors"
                        >
                            Log in
                        </Link>{" "}
                        to leave a review.
                    </p>
                )}
            </div>

            {/* Fetch error message */}
            {error && (
                <p className="text-sm text-red-600" role="alert">
                    {error}
                </p>
            )}

            {/* Review list — always visible (Requirement 3.1) */}
            <ReviewList reviews={reviews} loading={loading} />
        </section>
    );
}
