"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, Loader2, Eye, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import
    {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogFooter,
        DialogDescription,
    } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { SizeGuide } from "@/types/size-guide";
import {
    getVendorGuides,
    deleteGuide,
    getGuideReviewFeedback,
    GUIDE_REVIEW_FEEDBACK_STATUSES,
    SizeGuideApiError,
    type GuideReviewFeedback,
} from "@/vendor-services/sizeGuideService";
import { GuideStatusBadge } from "./GuideStatusBadge";
import { SizeGuideEditor } from "./SizeGuideEditor";

interface SizeGuideTabProps
{
    tailorUID: string;
}

interface DeleteConfirmState
{
    guide: SizeGuide;
    /** Products assigned to this guide — populated by the 409 response */
    affectedProducts?: string[];
}

export function SizeGuideTab({ tailorUID }: SizeGuideTabProps)
{
    const [guides, setGuides] = useState<SizeGuide[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingGuide, setEditingGuide] = useState<SizeGuide | undefined>(undefined);
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [reviewDialogGuide, setReviewDialogGuide] = useState<SizeGuide | null>(null);
    const [reviewFeedback, setReviewFeedback] = useState<GuideReviewFeedback | null>(null);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);

    const fetchGuides = useCallback(async () =>
    {
        setLoading(true);
        try
        {
            const data = await getVendorGuides();
            setGuides(data.filter((g): g is SizeGuide => Boolean(g?.id)));
        } catch (err)
        {
            toast.error("Failed to load size guides");
        } finally
        {
            setLoading(false);
        }
    }, []);

    useEffect(() =>
    {
        if (tailorUID) fetchGuides();
    }, [tailorUID, fetchGuides]);

    const handleCreate = () =>
    {
        setEditingGuide(undefined);
        setShowEditor(true);
    };

    const handleEdit = (guide: SizeGuide) =>
    {
        setEditingGuide(guide);
        setShowEditor(true);
    };

    const handleEditorSave = (saved: SizeGuide) =>
    {
        if (!saved?.id)
        {
            void fetchGuides();
            setShowEditor(false);
            setEditingGuide(undefined);
            return;
        }
        setGuides((prev) =>
        {
            const idx = prev.findIndex((g) => g?.id === saved.id);
            if (idx >= 0)
            {
                const next = [...prev];
                next[idx] = saved;
                return next;
            }
            return [saved, ...prev.filter(Boolean)];
        });
        setShowEditor(false);
        setEditingGuide(undefined);
    };

    const handleEditorClose = () =>
    {
        setShowEditor(false);
        setEditingGuide(undefined);
    };

    const handleDeleteClick = (guide: SizeGuide) =>
    {
        setDeleteConfirm({ guide });
    };

    const handleViewReviewFeedback = async (guide: SizeGuide) =>
    {
        setReviewDialogGuide(guide);
        setReviewFeedback(null);
        setReviewError(null);
        setReviewLoading(true);
        try
        {
            const feedback = await getGuideReviewFeedback(guide.id);
            if (!feedback)
            {
                setReviewError("No review message was found for this guide.");
            } else
            {
                setReviewFeedback(feedback);
            }
        } catch (err)
        {
            setReviewError(
                err instanceof Error ? err.message : "Failed to load review message",
            );
        } finally
        {
            setReviewLoading(false);
        }
    };

    const closeReviewDialog = () =>
    {
        setReviewDialogGuide(null);
        setReviewFeedback(null);
        setReviewError(null);
    };

    const showReviewFeedbackAction = (status: SizeGuide["status"]) =>
        GUIDE_REVIEW_FEEDBACK_STATUSES.includes(status);

    const handleDeleteConfirm = async (force = false) =>
    {
        if (!deleteConfirm) return;
        setDeleting(true);
        try
        {
            await deleteGuide(deleteConfirm.guide.id, force);
            setGuides((prev) => prev.filter((g) => g.id !== deleteConfirm.guide.id));
            toast.success("Size guide deleted");
            setDeleteConfirm(null);
        } catch (err)
        {
            if (err instanceof SizeGuideApiError && err.status === 409)
            {
                // Guide is assigned to products — show warning with confirmation
                setDeleteConfirm((prev) =>
                    prev ? { ...prev, affectedProducts: [] } : null
                );
            } else
            {
                toast.error(err instanceof Error ? err.message : "Failed to delete guide");
            }
        } finally
        {
            setDeleting(false);
        }
    };

    if (showEditor)
    {
        return (
            <SizeGuideEditor
                tailorUID={tailorUID}
                guide={editingGuide}
                onSave={handleEditorSave}
                onClose={handleEditorClose}
            />
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle>Size Guides</CardTitle>
                        <CardDescription className="mt-1">
                            Create structured size guides for your products. New guides are pending
                            review until approved by the marketing team.
                        </CardDescription>
                    </div>
                    <Button
                        onClick={handleCreate}
                        className="bg-black hover:bg-gray-800 text-white shrink-0"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Size Guide
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            Loading guides…
                        </div>
                    ) : guides.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                            <p className="text-gray-500 text-sm mb-4">
                                No size guides yet. Create one to help customers find their perfect fit.
                            </p>
                            <Button
                                variant="outline"
                                onClick={handleCreate}
                                className="border-gray-300"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create your first size guide
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {guides.map((guide) => (
                                <div
                                    key={guide.id}
                                    className="flex items-center justify-between py-4 gap-4"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-gray-900 truncate">
                                                {guide.title}
                                            </span>
                                            <GuideStatusBadge status={guide.status} />
                                            {guide.is_default_for_category && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {guide.category.replace(/_/g, " ")} · v{guide.version} · {guide.unit}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {showReviewFeedbackAction(guide.status) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => void handleViewReviewFeedback(guide)}
                                                className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                                title="View review message"
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View review message</span>
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(guide)}
                                            className="text-gray-600 hover:text-gray-900"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteClick(guide)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Marketing review feedback dialog */}
            <Dialog
                open={!!reviewDialogGuide}
                onOpenChange={(open) => { if (!open) closeReviewDialog(); }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-amber-600" />
                            Review message
                        </DialogTitle>
                        <DialogDescription>
                            {reviewDialogGuide && (
                                <>
                                    Feedback from the marketing team for{" "}
                                    <strong>{reviewDialogGuide.title}</strong>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        {reviewLoading ? (
                            <div className="flex items-center justify-center py-8 text-gray-400">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                Loading message…
                            </div>
                        ) : reviewError ? (
                            <p className="text-sm text-red-600">{reviewError}</p>
                        ) : reviewFeedback ? (
                            <div className="space-y-3">
                                <GuideStatusBadge status={reviewFeedback.status} />
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                        {reviewFeedback.comment}
                                    </p>
                                </div>
                                {reviewFeedback.reviewed_at && (
                                    <p className="text-xs text-gray-500">
                                        Reviewed{" "}
                                        {new Date(reviewFeedback.reviewed_at).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeReviewDialog}>
                            Close
                        </Button>
                        {reviewDialogGuide &&
                            showReviewFeedbackAction(reviewDialogGuide.status) && (
                            <Button
                                onClick={() =>
                                {
                                    closeReviewDialog();
                                    handleEdit(reviewDialogGuide);
                                }}
                            >
                                Edit guide
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog
                open={!!deleteConfirm}
                onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {deleteConfirm?.affectedProducts !== undefined ? (
                                <>
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Guide is assigned to products
                                </>
                            ) : (
                                "Delete size guide?"
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {deleteConfirm?.affectedProducts !== undefined ? (
                                <>
                                    <strong>{deleteConfirm.guide.title}</strong> is currently assigned
                                    to one or more products. Deleting it will remove the size guide
                                    reference from those products. This action cannot be undone.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to delete{" "}
                                    <strong>{deleteConfirm?.guide.title}</strong>? This action cannot
                                    be undone.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                handleDeleteConfirm(
                                    deleteConfirm?.affectedProducts !== undefined
                                )
                            }
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting…
                                </>
                            ) : deleteConfirm?.affectedProducts !== undefined ? (
                                "Delete anyway"
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
