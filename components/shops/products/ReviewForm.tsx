"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import type { ProductReview } from "@/types/reviews";
import type { User } from "firebase/auth";

const MAX_COMMENT_LENGTH = 1000;

interface ReviewFormProps
{
    /** Existing review for the current user, used to pre-fill the form when editing. */
    userReview: ProductReview | null;
    /** The authenticated Firebase user submitting the review. */
    user: User;
    /** Called with (rating, comment) when the form is submitted. Should throw on error. */
    onSubmit: (rating: number, comment: string, user: User) => Promise<void>;
}

/**
 * Star rating selector sub-component.
 */
function StarSelector({
    value,
    onChange,
    error,
}: {
    value: number;
    onChange: (rating: number) => void;
    error?: string;
})
{
    const [hovered, setHovered] = useState(0);

    return (
        <div>
            <div
                className="flex items-center gap-1"
                role="radiogroup"
                aria-label="Star rating"
            >
                {Array.from({ length: 5 }, (_, i) =>
                {
                    const starValue = i + 1;
                    const filled = starValue <= (hovered || value);
                    return (
                        <button
                            key={starValue}
                            type="button"
                            role="radio"
                            aria-checked={value === starValue}
                            aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
                            onClick={() => onChange(starValue)}
                            onMouseEnter={() => setHovered(starValue)}
                            onMouseLeave={() => setHovered(0)}
                            className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                        >
                            <Star
                                size={28}
                                className={
                                    filled
                                        ? "fill-amber-400 text-amber-400 transition-colors"
                                        : "fill-gray-200 text-gray-200 transition-colors"
                                }
                                aria-hidden="true"
                            />
                        </button>
                    );
                })}
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

/**
 * Review submission form with star rating selector and optional comment textarea.
 * Handles create and edit (pre-fill) flows.
 * Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7
 */
export function ReviewForm({ userReview, user, onSubmit }: ReviewFormProps)
{
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState<string>("");
    const [ratingError, setRatingError] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    // Requirement 2.4: pre-fill form when editing an existing review
    useEffect(() =>
    {
        if (userReview)
        {
            setRating(userReview.rating);
            setComment(userReview.comment ?? "");
        }
    }, [userReview]);

    const commentLength = comment.length;
    const commentTooLong = commentLength > MAX_COMMENT_LENGTH;
    const isEditing = userReview !== null;

    const handleRatingChange = (value: number) =>
    {
        setRating(value);
        if (value > 0) setRatingError("");
    };

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();

        // Requirement 2.5: inline validation — rating is required
        if (rating === 0)
        {
            setRatingError("Please select a star rating before submitting.");
            return;
        }

        // Requirement 2.6: block submit when comment is too long
        if (commentTooLong) return;

        setSubmitting(true);
        try
        {
            await onSubmit(rating, comment, user);

            // Requirement 2.7: confirmation toast on success
            toast.success(isEditing ? "Review updated!" : "Review submitted!", {
                description: "Thank you for sharing your experience.",
            });

            // Clear form only when creating a new review; editing keeps the updated values
            if (!isEditing)
            {
                setRating(0);
                setComment("");
            }
        } catch (err)
        {
            // Requirement 2.7: error toast, keep form populated
            console.error("[ReviewForm] Submit failed:", err);
            toast.error("Failed to submit review", {
                description: "Please try again.",
            });
        } finally
        {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <h3 className="text-sm font-semibold text-gray-900">
                {isEditing ? "Edit your review" : "Write a review"}
            </h3>

            {/* Star rating selector — Requirement 2.1 */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rating <span className="text-red-500">*</span>
                </label>
                <StarSelector
                    value={rating}
                    onChange={handleRatingChange}
                    error={ratingError}
                />
            </div>

            {/* Comment textarea — Requirement 2.2 */}
            <div>
                <label
                    htmlFor="review-comment"
                    className="block text-xs font-medium text-gray-700 mb-1"
                >
                    Comment <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Share your experience with this product…"
                    className={`w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-1 transition-colors ${commentTooLong
                            ? "border-red-400 focus:ring-red-400"
                            : "border-gray-200 focus:ring-black focus:border-black"
                        }`}
                    aria-describedby="comment-count"
                />
                {/* Character count — Requirement 2.6 */}
                <div
                    id="comment-count"
                    className={`mt-1 text-xs flex justify-end ${commentTooLong ? "text-red-600 font-medium" : "text-gray-400"
                        }`}
                    role={commentTooLong ? "alert" : undefined}
                >
                    {commentTooLong
                        ? `Comment is too long — ${commentLength - MAX_COMMENT_LENGTH} character${commentLength - MAX_COMMENT_LENGTH !== 1 ? "s" : ""} over the limit`
                        : `${commentLength} / ${MAX_COMMENT_LENGTH}`}
                </div>
            </div>

            {/* Submit button — disabled when comment is too long (Requirement 2.6) */}
            <button
                type="submit"
                disabled={submitting || commentTooLong}
                className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting
                    ? "Submitting…"
                    : isEditing
                        ? "Update review"
                        : "Submit review"}
            </button>
        </form>
    );
}
