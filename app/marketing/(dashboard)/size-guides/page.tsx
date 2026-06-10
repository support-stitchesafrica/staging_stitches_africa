"use client";

import { useCallback, useState } from "react";
import { useMarketingAuth } from "@/contexts/MarketingAuthContext";
import MarketingAuthGuard from "@/components/marketing/MarketingAuthGuard";
import SizeGuideApprovalQueue, {
    type ApprovalQueueGuide,
} from "@/components/marketing/size-guides/SizeGuideApprovalQueue";
import SizeGuideReviewModal from "@/components/marketing/size-guides/SizeGuideReviewModal";
import type { GuideStatus } from "@/types/size-guide";

// ─── Main Content ─────────────────────────────────────────────────────────────

function SizeGuidesContent()
{
    const { firebaseUser } = useMarketingAuth();

    /**
     * getToken — same pattern used by referral-discounts/page.tsx and other
     * marketing dashboard pages.
     */
    const getToken = useCallback(
        async () => firebaseUser?.getIdToken(),
        [firebaseUser]
    );

    const [reviewingGuide, setReviewingGuide] = useState<ApprovalQueueGuide | null>(null);
    // Key used to force-refresh the queue after a status change
    const [queueKey, setQueueKey] = useState(0);

    /**
     * handleStatusChange — calls POST /api/size-guides/[id]/approve and
     * refreshes the queue on success.
     *
     * Requirements: 7.3, 7.4, 7.5, 7.6
     */
    const handleStatusChange = useCallback(
        async (guideId: string, status: GuideStatus, comment?: string) =>
        {
            const token = await getToken();
            const res = await fetch(`/api/size-guides/${guideId}/approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status, comment }),
            });

            if (!res.ok)
            {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error ?? `Request failed with status ${res.status}`);
            }

            // Refresh the queue so the reviewed guide disappears
            setQueueKey((k) => k + 1);
        },
        [getToken]
    );

    return (
        <div className="space-y-8">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Size Guide Approvals</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Review and approve vendor size guides before they go live.
                </p>
            </div>

            {/* Approval queue table — Requirement 7.1 */}
            <SizeGuideApprovalQueue
                key={queueKey}
                getToken={getToken}
                onReview={(guide) => setReviewingGuide(guide)}
            />

            {/* Review modal — Requirements 7.2, 7.3, 7.4, 7.5, 7.6, 7.7 */}
            {reviewingGuide && (
                <SizeGuideReviewModal
                    guide={reviewingGuide}
                    onClose={() => setReviewingGuide(null)}
                    onStatusChange={handleStatusChange}
                    getToken={getToken}
                />
            )}
        </div>
    );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function SizeGuidesPage()
{
    return (
        <MarketingAuthGuard>
            <SizeGuidesContent />
        </MarketingAuthGuard>
    );
}
