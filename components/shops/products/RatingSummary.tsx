"use client";

import { Star } from "lucide-react";
import type { ProductReview } from "@/types/reviews";
import { computeAverageRating } from "@/lib/reviews/reviewService";

interface RatingSummaryProps
{
    reviews: ProductReview[];
}

/**
 * Displays the average star rating and total review count for a product.
 * Shows "No ratings yet" when the reviews array is empty.
 * Requirements: 3.3, 5.1, 5.3, 5.4
 */
export function RatingSummary({ reviews }: RatingSummaryProps)
{
    const average = computeAverageRating(reviews);
    const count = reviews.length;

    // Requirement 5.4: show "No ratings yet" when there are no reviews
    if (average === null)
    {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-0.5" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={16} className="fill-gray-200 text-gray-200" />
                    ))}
                </div>
                <span>No ratings yet</span>
            </div>
        );
    }

    // Filled stars based on rounded average for visual display
    const filledStars = Math.round(average);

    return (
        <div
            className="flex items-center gap-2"
            aria-label={`Average rating: ${average} out of 5 stars from ${count} review${count !== 1 ? "s" : ""}`}
        >
            {/* Star icons */}
            <div className="flex items-center gap-0.5" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star
                        key={i}
                        size={18}
                        className={
                            i < filledStars
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-200 text-gray-200"
                        }
                    />
                ))}
            </div>

            {/* Numeric average rounded to 1 decimal place (Requirement 5.3) */}
            <span className="text-sm font-semibold text-gray-900">{average.toFixed(1)}</span>

            {/* Total count */}
            <span className="text-sm text-gray-500">
                ({count} review{count !== 1 ? "s" : ""})
            </span>
        </div>
    );
}
