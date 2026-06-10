"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, RefreshCw, Inbox, AlertCircle, Calendar, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuideStatusBadge } from "@/components/vendor/size-guide/GuideStatusBadge";
import type { GuideStatus, SizeGuideCategory, SizeGuideRow } from "@/types/size-guide";
import { formatGuideCategoriesLabel } from "@/lib/size-guide/marketing-display";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApprovalQueueCategorySection {
    id?: string;
    category: SizeGuideCategory;
    rows?: Omit<SizeGuideRow, "id">[];
    enabledRegions?: string[];
    enabled_regions?: string[];
}

export interface ApprovalQueueGuide
{
    id: string;
    vendor_id: string;
    vendor_brand_name: string;
    title: string;
    category: SizeGuideCategory;
    category_sections?: ApprovalQueueCategorySection[] | null;
    unit: string;
    status: GuideStatus;
    version: number;
    enabled_regions: string[];
    uploaded_file_url: string | null;
    uploaded_file_type: string | null;
    display_preference: string | null;
    submitted_at: string | null;
    created_at: string | null;
    updated_at: string | null;
}

interface SizeGuideApprovalQueueProps
{
    getToken: () => Promise<string | undefined>;
    onReview: (guide: ApprovalQueueGuide) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (ts: string | null): string =>
{
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SizeGuideApprovalQueue
 *
 * Table listing all size guides with status = submitted | under_review,
 * sorted by submittedAt ascending (oldest first).
 * Matches the style of existing marketing dashboard tables.
 *
 * Requirements: 7.1, 7.8
 */
export default function SizeGuideApprovalQueue({
    getToken,
    onReview,
}: SizeGuideApprovalQueueProps)
{
    const [guides, setGuides] = useState<ApprovalQueueGuide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadGuides = useCallback(async () =>
    {
        setLoading(true);
        setError(false);
        try
        {
            const token = await getToken();
            const res = await fetch("/api/marketing/size-guides", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setGuides(data.guides ?? []);
        } catch (err)
        {
            console.error("[SizeGuideApprovalQueue] load error:", err);
            setError(true);
        } finally
        {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() =>
    {
        loadGuides();
    }, [loadGuides]);

    // ── Loading skeleton ────────────────────────────────────────────────────────
    if (loading)
    {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
                ))}
            </div>
        );
    }

    // ── Error state ─────────────────────────────────────────────────────────────
    if (error)
    {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p className="text-base font-semibold text-gray-800">Failed to load approval queue</p>
                <Button onClick={loadGuides} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Retry
                </Button>
            </div>
        );
    }

    // ── Empty state ─────────────────────────────────────────────────────────────
    if (guides.length === 0)
    {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <Inbox className="h-10 w-10 text-gray-300" />
                <p className="text-base font-medium text-gray-600">No guides pending review</p>
                <p className="text-sm text-gray-400">
                    Guides submitted by vendors will appear here.
                </p>
                <Button size="sm" variant="outline" onClick={loadGuides} className="gap-1.5 mt-2">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
            </div>
        );
    }

    // ── Table ───────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {guides.length} guide{guides.length !== 1 ? "s" : ""} pending review
                </p>
                <Button size="sm" variant="outline" onClick={loadGuides} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {[
                                "Vendor",
                                "Guide Title",
                                "Categories",
                                "Status",
                                "Submitted",
                                "Actions",
                            ].map((col) => (
                                <th
                                    key={col}
                                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {guides.map((guide) => (
                            <tr
                                key={guide.id}
                                className="hover:bg-gray-50 transition-colors"
                            >
                                {/* Vendor brand name — Requirement 7.8 */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-100 rounded-full p-1.5 shrink-0">
                                            <User className="w-3.5 h-3.5 text-blue-600" />
                                        </div>
                                        <span className="font-medium text-gray-900 truncate max-w-[160px]">
                                            {guide.vendor_brand_name}
                                        </span>
                                    </div>
                                </td>

                                {/* Guide title — Requirement 7.8 */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span className="text-gray-900 truncate max-w-[200px]">
                                            {guide.title}
                                        </span>
                                        {guide.version > 1 && (
                                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                v{guide.version}
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Categories — Requirement 7.8 */}
                                <td className="px-4 py-3 max-w-[220px]">
                                    <div className="flex items-start gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                        <span className="text-gray-700 text-sm leading-snug">
                                            {formatGuideCategoriesLabel(guide)}
                                        </span>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <GuideStatusBadge status={guide.status} />
                                </td>

                                {/* Submission date — Requirement 7.8 */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{fmtDate(guide.submitted_at)}</span>
                                    </div>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <Button
                                        size="sm"
                                        onClick={() => onReview(guide)}
                                        className="text-xs"
                                    >
                                        Review
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
