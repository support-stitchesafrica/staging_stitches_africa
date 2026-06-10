"use client";

import type { ProductReview } from "@/types/reviews";
import { ReviewCard } from "./ReviewCard";

interface ReviewListProps
{
    reviews: ProductReview[];
    loading: boolean;
}

/**
 * Loading skeleton for a single review card.
 */
function ReviewCardSkeleton()
{
    return (
        <div className="border border-gray-100 rounded-lg p-4 bg-white space-y-2 animate-pulse">
            <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="w-4 h-4 rounded bg-gray-200" />
                ))}
            </div>
            <div className="space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-4/5" />
            </div>
            <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
        </div>
    );
}

/**
 * Renders the list of product reviews with loading skeleton and empty state.
 * Requirements: 3.1, 3.4, 3.6
 */
export function ReviewList({ reviews, loading }: ReviewListProps)
{
    // Requirement 3.6: show loading skeleton while fetching
    if (loading)
    {
        return (
            <div className="space-y-3" aria-busy="true" aria-label="Loading reviews">
                {Array.from({ length: 3 }, (_, i) => (
                    <ReviewCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    // Requirement 3.4: empty state when no reviews
    if (reviews.length === 0)
    {
        return (
            <div className="py-8 text-center text-sm text-gray-500">
                No reviews have been submitted yet. Be the first to share your experience!
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
            ))}
        </div>
    );
}
