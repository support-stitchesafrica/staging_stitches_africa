"use client";

import { useState, useEffect, useCallback } from "react";
import
    {
        X,
        CheckCircle,
        XCircle,
        AlertTriangle,
        FileText,
        ExternalLink,
        Loader2,
    } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GuideStatusBadge } from "@/components/vendor/size-guide/GuideStatusBadge";
import { toast } from "sonner";
import type { GuideStatus, SizeGuideRow, SizeGuideWithRows } from "@/types/size-guide";
import type { ApprovalQueueGuide } from "./SizeGuideApprovalQueue";
import {
    formatCategoryLabel,
    formatGuideCategoriesLabel,
    getMeasurementFieldsForSection,
    parseGuideSections,
    type CategorySectionPreview,
} from "@/lib/size-guide/marketing-display";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SizeGuideReviewModalProps
{
    guide: ApprovalQueueGuide;
    onClose: () => void;
    onStatusChange: (
        guideId: string,
        status: GuideStatus,
        comment?: string
    ) => Promise<void>;
    getToken: () => Promise<string | undefined>;
}

type ReviewAction = "approved" | "rejected" | "needs_changes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (ts: string | null): string =>
{
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const ACTION_CONFIG: Record<
    ReviewAction,
    { label: string; icon: React.ReactNode; className: string; requiresComment: boolean }
> = {
    approved: {
        label: "Approve",
        icon: <CheckCircle className="w-4 h-4" />,
        className: "bg-green-600 hover:bg-green-700 text-white",
        requiresComment: false,
    },
    rejected: {
        label: "Reject",
        icon: <XCircle className="w-4 h-4" />,
        className: "bg-red-600 hover:bg-red-700 text-white",
        requiresComment: true,
    },
    needs_changes: {
        label: "Needs Review",
        icon: <AlertTriangle className="w-4 h-4" />,
        className: "bg-amber-500 hover:bg-amber-600 text-white",
        requiresComment: true,
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SizeGuideReviewModal
 *
 * Full preview of a size guide with approve / reject / needs_changes actions.
 * Requires a non-empty comment for reject and needs_changes.
 * Calls POST /api/size-guides/[id]/approve on submit.
 *
 * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */
export default function SizeGuideReviewModal({
    guide,
    onClose,
    onStatusChange,
    getToken,
}: SizeGuideReviewModalProps)
{
    const [sections, setSections] = useState<CategorySectionPreview[]>([]);
    const [guideDetail, setGuideDetail] = useState<SizeGuideWithRows | null>(null);
    const [rowsLoading, setRowsLoading] = useState(true);
    const [rowsError, setRowsError] = useState(false);

    const [selectedAction, setSelectedAction] = useState<ReviewAction | null>(null);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ── Fetch full guide (rows + category_sections) ─────────────────────────────
    const loadGuideDetail = useCallback(async () =>
    {
        setRowsLoading(true);
        setRowsError(false);
        try
        {
            const token = await getToken();
            const res = await fetch(`/api/size-guides/${guide.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const fullGuide = data.guide as SizeGuideWithRows;
            setGuideDetail(fullGuide);
            setSections(
                parseGuideSections(
                    {
                        category: fullGuide.category,
                        enabled_regions: fullGuide.enabled_regions,
                        category_sections: fullGuide.category_sections as ApprovalQueueGuide["category_sections"],
                    },
                    fullGuide.rows ?? [],
                ),
            );
        } catch (err)
        {
            console.error("[SizeGuideReviewModal] guide load error:", err);
            setRowsError(true);
        } finally
        {
            setRowsLoading(false);
        }
    }, [guide.id, getToken]);

    useEffect(() =>
    {
        loadGuideDetail();
    }, [loadGuideDetail]);

    const categoriesLabel = formatGuideCategoriesLabel({
        category: guide.category,
        category_sections: guide.category_sections,
    });

    // ── Submit action ───────────────────────────────────────────────────────────
    const handleSubmit = async () =>
    {
        if (!selectedAction) return;

        const cfg = ACTION_CONFIG[selectedAction];
        if (cfg.requiresComment && !comment.trim())
        {
            toast.error("A comment is required for this action.");
            return;
        }

        setSubmitting(true);
        try
        {
            await onStatusChange(guide.id, selectedAction, comment.trim() || undefined);
            toast.success(
                selectedAction === "approved"
                    ? "Guide approved successfully."
                    : selectedAction === "rejected"
                        ? "Guide rejected."
                        : "Guide marked as needs changes."
            );
            onClose();
        } catch (err: any)
        {
            toast.error(err?.message ?? "Failed to update guide status.");
        } finally
        {
            setSubmitting(false);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* ── Header ── */}
                <div className="flex items-start justify-between px-6 py-4 border-b shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-lg">{guide.title}</p>
                            {guide.version > 1 && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                    v{guide.version}
                                </span>
                            )}
                            <GuideStatusBadge status={guide.status} />
                        </div>
                        <p className="text-sm text-gray-500">
                            {guide.vendor_brand_name} · {guide.unit} · Submitted{" "}
                            {fmtDate(guide.submitted_at)}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {(guide.category_sections && guide.category_sections.length > 0
                                ? guide.category_sections
                                : [{ category: guide.category }]
                            ).map((sec, i) => (
                                <span
                                    key={sec.id ?? `${sec.category}-${i}`}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-100"
                                >
                                    {formatCategoryLabel(sec.category)}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 ml-4 shrink-0"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
                    {/* ── Categories summary ── */}
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-2">Categories</h3>
                        <p className="text-sm text-gray-600">{categoriesLabel}</p>
                    </section>

                    {/* ── Measurement rows per category — Requirement 7.2 ── */}
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-3">Measurement Rows</h3>
                        {rowsLoading ? (
                            <div className="space-y-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-10 rounded bg-gray-100 animate-pulse" />
                                ))}
                            </div>
                        ) : rowsError ? (
                            <div className="flex items-center gap-2 text-red-500 text-sm py-4">
                                <AlertTriangle className="w-4 h-4" />
                                Failed to load size guide details.
                                <button
                                    onClick={loadGuideDetail}
                                    className="underline text-blue-600 hover:text-blue-800"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : sections.length === 0 ||
                          sections.every((s) => s.rows.length === 0) ? (
                            <p className="text-sm text-gray-500 py-4">No measurement rows found.</p>
                        ) : (
                            <div className="space-y-6">
                                {sections.map((section) => {
                                    const measurementFields =
                                        getMeasurementFieldsForSection(section);
                                    const unit =
                                        guideDetail?.unit ?? guide.unit;
                                    const regions = section.enabledRegions;

                                    return (
                                        <div key={section.id} className="space-y-2">
                                            <h4 className="text-sm font-semibold text-gray-800">
                                                {formatCategoryLabel(section.category)}
                                                <span className="ml-2 font-normal text-gray-500">
                                                    ({section.rows.length} size
                                                    {section.rows.length !== 1 ? "s" : ""})
                                                </span>
                                            </h4>
                                            {section.rows.length === 0 ? (
                                                <p className="text-sm text-gray-500">
                                                    No rows for this category.
                                                </p>
                                            ) : (
                                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                                                    Size
                                                                </th>
                                                                {measurementFields.map((field) => (
                                                                    <th
                                                                        key={field}
                                                                        className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                                                                    >
                                                                        {field}
                                                                        {unit ? (
                                                                            <span className="normal-case font-normal text-gray-400 ml-1">
                                                                                ({unit})
                                                                            </span>
                                                                        ) : null}
                                                                    </th>
                                                                ))}
                                                                {regions.length > 0 &&
                                                                    regions.map((region) => (
                                                                        <th
                                                                            key={region}
                                                                            className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                                                                        >
                                                                            {region}
                                                                        </th>
                                                                    ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-100">
                                                            {section.rows.map((row) => (
                                                                <tr
                                                                    key={row.id}
                                                                    className="hover:bg-gray-50"
                                                                >
                                                                    <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                                                                        {row.size_label}
                                                                    </td>
                                                                    {measurementFields.map((field) => (
                                                                        <td
                                                                            key={field}
                                                                            className="px-3 py-2 text-gray-700 whitespace-nowrap"
                                                                        >
                                                                            {row.measurements[field] ?? "—"}
                                                                        </td>
                                                                    ))}
                                                                    {regions.length > 0 &&
                                                                        regions.map((region) => (
                                                                            <td
                                                                                key={region}
                                                                                className="px-3 py-2 text-gray-700 whitespace-nowrap"
                                                                            >
                                                                                {(row.regional_sizes as Record<string, string>)[region] ?? "—"}
                                                                            </td>
                                                                        ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* ── Uploaded file preview — Requirement 7.2 ── */}
                    {guide.uploaded_file_url && (
                        <section>
                            <h3 className="font-semibold text-gray-800 mb-3">Uploaded File</h3>
                            <div className="border rounded-lg p-4 bg-gray-50">
                                {guide.uploaded_file_type === "image" ? (
                                    <div className="text-center">
                                        <img
                                            src={guide.uploaded_file_url}
                                            alt="Uploaded size guide"
                                            className="max-w-full max-h-64 mx-auto rounded border"
                                        />
                                    </div>
                                ) : guide.uploaded_file_type === "pdf" ? (
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-red-500 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">PDF Document</p>
                                            <a
                                                href={guide.uploaded_file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                                            >
                                                Open PDF <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-green-600 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {guide.uploaded_file_type?.toUpperCase() ?? "File"} Document
                                            </p>
                                            <a
                                                href={guide.uploaded_file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                                            >
                                                Download file <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* ── Review actions — Requirements 7.3, 7.4, 7.5 ── */}
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-3">Review Decision</h3>

                        {/* Action selector */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {(Object.keys(ACTION_CONFIG) as ReviewAction[]).map((action) =>
                            {
                                const cfg = ACTION_CONFIG[action];
                                const isSelected = selectedAction === action;
                                return (
                                    <button
                                        key={action}
                                        onClick={() => setSelectedAction(action)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${isSelected
                                                ? cfg.className + " border-transparent shadow-sm"
                                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        {cfg.icon}
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Comment field — required for reject/needs_changes (Requirement 7.5) */}
                        {selectedAction && (
                            <div className="space-y-2">
                                <Label htmlFor="review-comment">
                                    Feedback Comment
                                    {ACTION_CONFIG[selectedAction].requiresComment ? (
                                        <span className="text-red-500 ml-1">*</span>
                                    ) : (
                                        <span className="text-gray-400 ml-1">(optional)</span>
                                    )}
                                </Label>
                                <Textarea
                                    id="review-comment"
                                    placeholder={
                                        ACTION_CONFIG[selectedAction].requiresComment
                                            ? "Provide a reason for this decision (required)…"
                                            : "Add an optional note for the vendor…"
                                    }
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                />
                                {ACTION_CONFIG[selectedAction].requiresComment && !comment.trim() && (
                                    <p className="text-xs text-red-500">
                                        A comment is required when rejecting or requesting changes.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0 bg-gray-50 rounded-b-xl">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            !selectedAction ||
                            submitting ||
                            (selectedAction !== null &&
                                ACTION_CONFIG[selectedAction].requiresComment &&
                                !comment.trim())
                        }
                        className={
                            selectedAction ? ACTION_CONFIG[selectedAction].className : ""
                        }
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving…
                            </>
                        ) : selectedAction ? (
                            <>
                                {ACTION_CONFIG[selectedAction].icon}
                                <span className="ml-1.5">
                                    {ACTION_CONFIG[selectedAction].label}
                                </span>
                            </>
                        ) : (
                            "Select an action"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
