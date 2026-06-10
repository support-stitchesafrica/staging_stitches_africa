"use client";

import { useState, useEffect, useCallback } from "react";
import
{
    X, Save, Send, AlertTriangle, CheckCircle,
    ChevronDown, ChevronUp, Loader2, Plus, Trash2,
} from "lucide-react";
import type {
    SizeGuide,
    SizeGuideRow,
    SizeGuideCategory,
    MeasurementUnit,
    SizeRegion,
    SizeGuideTemplate,
} from "@/types/size-guide";
import { CATEGORY_FIELDS } from "@/types/size-guide";
import { validateGuide, type ValidationWarning } from "@/lib/size-guide/validation";
import { getTemplateById } from "@/lib/size-guide/templateService";
import { createGuide, updateGuide, submitGuide } from "@/vendor-services/sizeGuideService";
import { CategoryFieldRenderer } from "./CategoryFieldRenderer";
import { RegionMapper } from "./RegionMapper";
import { FileUploadSection } from "./FileUploadSection";
import { VersionHistoryList } from "./VersionHistoryList";
import { GuideStatusBadge } from "./GuideStatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

/** One category section within a unified size guide */
export interface CategorySection
{
    id: string;
    category: SizeGuideCategory;
    rows: SizeGuideRow[];
    enabledRegions: SizeRegion[];
}

export interface SizeGuideEditorProps
{
    tailorUID: string;
    guide?: SizeGuide;
    templateId?: string;
    rejectedGuide?: SizeGuide & { rows?: SizeGuideRow[] };
    versions?: SizeGuide[];
    onSave: (guide: SizeGuide) => void;
    onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: SizeGuideCategory[] = [
    "Shoes", "Shirts", "Dresses", "Trousers", "Jackets",
    "Native_Wear", "Bags", "Kids_Wear", "Unisex",
    "Underwear", "Waist_Beads", "Bracelets", "Accessories", "Suits", "Fila",
];

const UNITS: MeasurementUnit[] = ["CM", "Inches"];

const DISPLAY_PREFERENCES: { value: SizeGuide["display_preference"]; label: string }[] = [
    { value: "table", label: "Table only" },
    { value: "file", label: "File only" },
    { value: "both", label: "Table + File" },
];

const READ_ONLY_STATUSES: SizeGuide["status"][] = ["submitted", "under_review"];

function makeSectionId()
{
    return `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createEmptyRow(order: number): SizeGuideRow
{
    return {
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        size_label: "",
        order,
        measurements: {},
        regional_sizes: {},
    };
}

function createEmptySection(category: SizeGuideCategory): CategorySection
{
    return {
        id: makeSectionId(),
        category,
        rows: [createEmptyRow(0)],
        enabledRegions: [],
    };
}

function categoryLabel(c: SizeGuideCategory)
{
    return c.replace("_", " ");
}

// ─── Warning Modal ────────────────────────────────────────────────────────────

interface WarningModalProps
{
    warnings: ValidationWarning[];
    onConfirm: () => void;
    onCancel: () => void;
}

function WarningModal({ warnings, onConfirm, onCancel }: WarningModalProps)
{
    const [acknowledged, setAcknowledged] = useState<boolean[]>(
        () => warnings.map(() => false),
    );
    const allAcknowledged = acknowledged.every(Boolean);
    const toggle = (i: number) =>
        setAcknowledged((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <h3 className="text-base font-semibold text-gray-900">
                        Review Warnings Before Submitting
                    </h3>
                </div>
                <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
                    <p className="text-sm text-gray-600">
                        The following issues were detected. Acknowledge each one to proceed.
                    </p>
                    {warnings.map((w, i) => (
                        <label
                            key={i}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${acknowledged[i]
                                ? "border-green-300 bg-green-50"
                                : "border-amber-200 bg-amber-50"
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={acknowledged[i]}
                                onChange={() => toggle(i)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                            />
                            <span className="text-sm text-gray-700">{w.message}</span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Go Back
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!allAcknowledged}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Submit Anyway
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Add Category Modal ───────────────────────────────────────────────────────

interface AddCategoryModalProps
{
    usedCategories: SizeGuideCategory[];
    onAdd: (category: SizeGuideCategory) => void;
    onCancel: () => void;
}

function AddCategoryModal({ usedCategories, onAdd, onCancel }: AddCategoryModalProps)
{
    const available = CATEGORIES.filter((c) => !usedCategories.includes(c));
    const [selected, setSelected] = useState<SizeGuideCategory>(available[0]);

    if (available.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Add Category</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Choose a category to add to this size guide.
                    </p>
                </div>
                <div className="px-6 py-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                    </label>
                    <select
                        value={selected}
                        onChange={(e) => setSelected(e.target.value as SizeGuideCategory)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        {available.map((c) => (
                            <option key={c} value={c}>
                                {categoryLabel(c)}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onAdd(selected)}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Add Category
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Helper: parse stored category_sections from guide ───────────────────────

function parseSectionsFromGuide(guide: SizeGuide & { rows?: SizeGuideRow[] }): CategorySection[]
{
    // If the guide has category_sections stored (new format), use those
    const stored = (guide as any).category_sections as CategorySection[] | undefined;
    if (stored && Array.isArray(stored) && stored.length > 0)
    {
        return stored.map((s) => ({ ...s, id: s.id ?? makeSectionId() }));
    }
    // Legacy: single category with rows
    return [
        {
            id: makeSectionId(),
            category: guide.category,
            rows: guide.rows
                ? guide.rows.map((r, i) => ({ ...r, id: r.id ?? `row-legacy-${i}` }))
                : [createEmptyRow(0)],
            enabledRegions: guide.enabled_regions ?? [],
        },
    ];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SizeGuideEditor({
    tailorUID,
    guide,
    templateId,
    rejectedGuide,
    versions = [],
    onSave,
    onClose,
}: SizeGuideEditorProps)
{
    // ── Form state ──────────────────────────────────────────────────────────────
    const [title, setTitle] = useState(guide?.title ?? "");
    const [unit, setUnit] = useState<MeasurementUnit>(
        guide?.unit ?? rejectedGuide?.unit ?? "CM",
    );
    const [sections, setSections] = useState<CategorySection[]>(() =>
    {
        if (guide) return parseSectionsFromGuide(guide as any);
        if (rejectedGuide) return parseSectionsFromGuide(rejectedGuide as any);
        return [createEmptySection("Shirts")];
    });
    const [activeTabId, setActiveTabId] = useState<string>(() =>
    {
        if (guide) return parseSectionsFromGuide(guide as any)[0]?.id ?? "";
        if (rejectedGuide) return parseSectionsFromGuide(rejectedGuide as any)[0]?.id ?? "";
        return sections[0]?.id ?? "";
    });
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string | undefined>(
        guide?.uploaded_file_url,
    );
    const [uploadedFileType, setUploadedFileType] = useState<
        SizeGuide["uploaded_file_type"] | undefined
    >(guide?.uploaded_file_type);
    const [displayPreference, setDisplayPreference] = useState<
        SizeGuide["display_preference"]
    >(guide?.display_preference ?? "table");
    const [templateIdUsed, setTemplateIdUsed] = useState<string | undefined>(
        guide?.template_id,
    );

    // ── UI state ────────────────────────────────────────────────────────────────
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<import("@/lib/size-guide/validation").ValidationError[]>([]);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [pendingWarnings, setPendingWarnings] = useState<ValidationWarning[]>([]);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);

    const isReadOnly = READ_ONLY_STATUSES.includes(guide?.status as SizeGuide["status"]);
    const isNewGuide = !guide;
    const activeSection = sections.find((s) => s.id === activeTabId) ?? sections[0];

    // ── Load template ───────────────────────────────────────────────────────────
    useEffect(() =>
    {
        if (templateId && !guide)
        {
            setLoadingTemplate(true);
            getTemplateById(templateId)
                .then((tpl: SizeGuideTemplate | null) =>
                {
                    if (!tpl) return;
                    setUnit(tpl.unit);
                    setTemplateIdUsed(tpl.id);
                    const sec: CategorySection = {
                        id: makeSectionId(),
                        category: tpl.category,
                        rows: tpl.rows.map((r, i) => ({
                            ...r,
                            id: `row-tpl-${i}-${Math.random().toString(36).slice(2, 7)}`,
                        })),
                        enabledRegions: tpl.enabled_regions,
                    };
                    setSections([sec]);
                    setActiveTabId(sec.id);
                })
                .catch(() => setGlobalError("Failed to load template. You can start from scratch."))
                .finally(() => setLoadingTemplate(false));
        }
    }, [templateId, guide]);

    // ── Section helpers ─────────────────────────────────────────────────────────
    const updateSection = useCallback(
        (id: string, patch: Partial<Omit<CategorySection, "id">>) =>
        {
            setSections((prev) =>
                prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
            );
        },
        [],
    );

    const handleAddCategory = (category: SizeGuideCategory) =>
    {
        const sec = createEmptySection(category);
        setSections((prev) => [...prev, sec]);
        setActiveTabId(sec.id);
        setShowAddCategory(false);
    };

    const handleRemoveSection = (id: string) =>
    {
        if (sections.length <= 1) return; // must keep at least one
        const remaining = sections.filter((s) => s.id !== id);
        setSections(remaining);
        if (activeTabId === id) setActiveTabId(remaining[0].id);
    };

    const handleChangeSectionCategory = (id: string, newCategory: SizeGuideCategory) =>
    {
        updateSection(id, {
            category: newCategory,
            rows: sections.find((s) => s.id === id)?.rows.map((r) => ({
                ...r,
                measurements: {},
            })) ?? [createEmptyRow(0)],
        });
    };

    // ── File upload ─────────────────────────────────────────────────────────────
    const handleFileUploaded = (
        url: string,
        fileType: SizeGuide["uploaded_file_type"],
        parsedRows?: SizeGuideRow[],
    ) =>
    {
        setUploadedFileUrl(url);
        setUploadedFileType(fileType);
        if (parsedRows && parsedRows.length > 0 && activeSection)
        {
            updateSection(activeSection.id, { rows: parsedRows });
        }
    };

    // ── Build payload ───────────────────────────────────────────────────────────
    const buildPayload = () =>
    {
        const primarySection = sections[0];
        // Flatten all rows across sections for the primary rows field (backward compat)
        const allRows = sections.flatMap((s) => s.rows.map(({ id: _id, ...r }) => r));
        return {
            title: title.trim(),
            // Primary category = first section (for backward compat)
            category: primarySection.category,
            unit,
            enabled_regions: primarySection.enabledRegions,
            rows: allRows,
            // Store full multi-category data
            category_sections: sections.map((s) => ({
                id: s.id,
                category: s.category,
                rows: s.rows.map(({ id: _id, ...r }) => r),
                enabledRegions: s.enabledRegions,
            })),
            template_id: templateIdUsed,
            uploaded_file_url: uploadedFileUrl,
            uploaded_file_type: uploadedFileType,
            display_preference: displayPreference,
            ...(rejectedGuide && !guide
                ? {
                    parent_guide_id: rejectedGuide.id,
                    version: (rejectedGuide.version ?? 1) + 1,
                }
                : {}),
        };
    };

    // ── Validate ────────────────────────────────────────────────────────────────
    const runValidation = () =>
    {
        // Validate each section; collect all errors/warnings
        let allErrors: import("@/lib/size-guide/validation").ValidationError[] = [];
        let allWarnings: ValidationWarning[] = [];
        let valid = true;

        if (!title.trim())
        {
            allErrors.push({ message: "Guide title is required." });
            valid = false;
        }
        if (sections.length === 0)
        {
            allErrors.push({ message: "At least one category is required." });
            valid = false;
        }

        for (const sec of sections)
        {
            const result = validateGuide(
                { title: title.trim(), category: sec.category, enabled_regions: sec.enabledRegions },
                sec.rows,
            );
            // Tag errors with section info
            allErrors = allErrors.concat(
                result.errors.map((e) => ({
                    ...e,
                    message: sections.length > 1
                        ? `[${categoryLabel(sec.category)}] ${e.message}`
                        : e.message,
                })),
            );
            allWarnings = allWarnings.concat(
                result.warnings.map((w) => ({
                    ...w,
                    message: sections.length > 1
                        ? `[${categoryLabel(sec.category)}] ${w.message}`
                        : w.message,
                })),
            );
            if (!result.valid) valid = false;
        }

        setErrors(allErrors);
        return { valid, errors: allErrors, warnings: allWarnings };
    };

    // ── Save (new guides are submitted for marketing approval) ────────────────
    const handleSave = async () =>
    {
        const { valid, errors: errs } = runValidation();
        if (!valid)
        {
            setErrors(errs);
            return;
        }
        setSaving(true);
        setGlobalError(null);
        setSuccessMessage(null);
        try
        {
            const payload = buildPayload();
            let saved: SizeGuide;
            if (guide)
            {
                saved = await updateGuide(guide.id, payload as any);
            } else
            {
                saved = await createGuide(payload as any);
            }
            const pendingReview = saved.status === "submitted" || saved.status === "under_review";
            setSuccessMessage(
                pendingReview
                    ? "Size guide submitted for approval. Marketers will review it before it goes live."
                    : "Size guide saved.",
            );
            onSave(saved);
        } catch (err: any)
        {
            setGlobalError(err?.message ?? "Failed to save. Please try again.");
        } finally
        {
            setSaving(false);
        }
    };

    const handleSubmitRequest = () =>
    {
        void handleSave();
    };

    const doSubmit = async () =>
    {
        void handleSave();
    };

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={isReadOnly ? onClose : undefined}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col bg-white shadow-2xl">

                {/* ── Header ── */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {isNewGuide ? "New Size Guide" : "Edit Size Guide"}
                        </h2>
                        {guide && <GuideStatusBadge status={guide.status} />}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ── Read-only banner ── */}
                {isReadOnly && (
                    <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800 shrink-0">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        This guide is currently under review and cannot be edited.
                    </div>
                )}

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                    {/* Loading template */}
                    {loadingTemplate && (
                        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading template…
                        </div>
                    )}

                    {/* ── Basic info ── */}
                    <section className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Guide Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isReadOnly}
                                placeholder="e.g. Men's Clothing Size Guide"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>

                        <div className="flex gap-4">
                            {/* Unit */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Measurement Unit
                                </label>
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
                                    disabled={isReadOnly}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-50"
                                >
                                    {UNITS.map((u) => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Display preference */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Display As
                                </label>
                                <select
                                    value={displayPreference}
                                    onChange={(e) =>
                                        setDisplayPreference(e.target.value as SizeGuide["display_preference"])
                                    }
                                    disabled={isReadOnly}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-50"
                                >
                                    {DISPLAY_PREFERENCES.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* ── Category tabs ── */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Categories</span>
                            {!isReadOnly && sections.length < CATEGORIES.length && (
                                <button
                                    type="button"
                                    onClick={() => setShowAddCategory(true)}
                                    className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Category
                                </button>
                            )}
                        </div>

                        {/* Tab bar */}
                        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
                            {sections.map((sec) => (
                                <div
                                    key={sec.id}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors ${activeTabId === sec.id
                                        ? "bg-gray-900 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                    onClick={() => setActiveTabId(sec.id)}
                                >
                                    {categoryLabel(sec.category)}
                                    {!isReadOnly && sections.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={(e) =>
                                            {
                                                e.stopPropagation();
                                                handleRemoveSection(sec.id);
                                            }}
                                            className={`rounded p-0.5 transition-colors ${activeTabId === sec.id
                                                ? "hover:bg-white/20 text-white/70 hover:text-white"
                                                : "hover:bg-gray-300 text-gray-400 hover:text-gray-600"
                                                }`}
                                            aria-label={`Remove ${categoryLabel(sec.category)}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Active section content ── */}
                    {activeSection && (
                        <section className="space-y-6">
                            <CategoryFieldRenderer
                                category={activeSection.category}
                                rows={activeSection.rows}
                                unit={unit}
                                onChange={(rows) => updateSection(activeSection.id, { rows })}
                            />

                            <RegionMapper
                                rows={activeSection.rows}
                                enabledRegions={activeSection.enabledRegions}
                                onRegionsChange={(enabledRegions) =>
                                    updateSection(activeSection.id, { enabledRegions })
                                }
                                onRowsChange={(rows) =>
                                    updateSection(activeSection.id, { rows })
                                }
                            />
                        </section>
                    )}

                    {/* ── File upload ── */}
                    {(displayPreference === "file" || displayPreference === "both") && (
                        <FileUploadSection
                            tailorUID={tailorUID}
                            uploadedFileUrl={uploadedFileUrl}
                            uploadedFileType={uploadedFileType}
                            onFileUploaded={handleFileUploaded}
                        />
                    )}

                    {/* ── Version history ── */}
                    {versions.length > 0 && (
                        <section>
                            <button
                                type="button"
                                onClick={() => setShowVersionHistory((v) => !v)}
                                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                            >
                                {showVersionHistory
                                    ? <ChevronUp className="h-4 w-4" />
                                    : <ChevronDown className="h-4 w-4" />
                                }
                                Version History ({versions.length})
                            </button>
                            {showVersionHistory && (
                                <div className="mt-3">
                                    <VersionHistoryList versions={versions} />
                                </div>
                            )}
                        </section>
                    )}

                    {/* ── Errors ── */}
                    {errors.length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-1">
                            {errors.map((e, i) => (
                                <p key={i} className="text-sm text-red-700">{e.message}</p>
                            ))}
                        </div>
                    )}

                    {/* ── Global error ── */}
                    {globalError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-sm text-red-700">{globalError}</p>
                        </div>
                    )}

                    {/* ── Success ── */}
                    {successMessage && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                            <p className="text-sm text-green-700">{successMessage}</p>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                {!isReadOnly && (
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                                : <><Save className="h-4 w-4" /> Save Size Guide</>
                            }
                        </button>
                    </div>
                )}
            </div>

            {/* ── Warning modal ── */}
            {showWarningModal && (
                <WarningModal
                    warnings={pendingWarnings}
                    onConfirm={() => void doSubmit()}
                    onCancel={() => setShowWarningModal(false)}
                />
            )}

            {/* ── Add category modal ── */}
            {showAddCategory && (
                <AddCategoryModal
                    usedCategories={sections.map((s) => s.category)}
                    onAdd={handleAddCategory}
                    onCancel={() => setShowAddCategory(false)}
                />
            )}
        </>
    );
}
