"use client";

import { Star } from "lucide-react";
import type { ProductReview } from "@/types/reviews";
import { Timestamp } from "firebase/firestore";

interface ReviewCardProps
{
    review: ProductReview;
}

/**
 * Formats a Firestore Timestamp or Date-like value as a relative date string.
 * e.g. "2 days ago", "just now", "3 months ago"
 */
function formatRelativeDate(createdAt: Timestamp | undefined | null): string
{
    if (!createdAt) return "";

    let date: Date;
    if (createdAt instanceof Timestamp)
    {
        date = createdAt.toDate();
    } else if (typeof (createdAt as any).toDate === "function")
    {
        date = (createdAt as any).toDate();
    } else
    {
        date = new Date(createdAt as any);
    }

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
    if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? "s" : ""} ago`;
    return `${diffYear} year${diffYear !== 1 ? "s" : ""} ago`;
}

/**
 * Renders a single product review with star rating, comment, display name, and relative date.
 * Requirements: 3.2, 6.1, 6.2, 6.3
 */
export function ReviewCard({ review }: ReviewCardProps)
{
    const { rating, comment, display_name, createdAt } = review;
    const relativeDate = formatRelativeDate(createdAt);

    return (
        <div className="border border-gray-100 rounded-lg p-4 bg-white space-y-2">
            {/* Star rating */}
            <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, i) => (
                    <Star
                        key={i}
                        size={16}
                        className={
                            i < rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-200 text-gray-200"
                        }
                        aria-hidden="true"
                    />
                ))}
            </div>

            {/* Comment — only rendered when non-empty (Requirement 3.2) */}
            {comment && comment.trim().length > 0 && (
                <p className="text-sm text-gray-700 leading-relaxed">{comment}</p>
            )}

            {/* Reviewer info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                {/* display_name is already resolved via resolveDisplayName in the hook (Requirements 6.1–6.3) */}
                <span className="font-medium text-gray-700">{display_name}</span>
                {relativeDate && <span>{relativeDate}</span>}
            </div>
        </div>
    );
}
