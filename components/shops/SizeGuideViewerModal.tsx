'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Loader2, AlertCircle, Ruler, FileText, Image as ImageIcon } from 'lucide-react';
import type { SizeGuide, SizeGuideRow, SizeRegion, MeasurementUnit } from '@/types/size-guide';
import { recordView } from '@/lib/size-guide/analyticsService';
import {
    formatCategoryLabel,
    getMeasurementFieldsForSection,
    parseGuideSections,
    type CategorySectionPreview,
} from '@/lib/size-guide/marketing-display';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SizeGuideViewerModalProps
{
    guideId: string;
    productId: string;
    onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate an anonymised session ID — no PII. Requirements: 12.1, 12.4 */
function generateSessionId(): string
{
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const ALL_REGIONS: SizeRegion[] = ['UK', 'US', 'EU', 'AU', 'JP', 'CN'];

const UNIT_LABEL: Record<MeasurementUnit, string> = {
    CM: 'cm',
    Inches: 'in',
};

function rowHasAnyData(row: SizeGuideRow, measurementFields: string[], regions: SizeRegion[]): boolean
{
    const size = (row.size_label ?? '').trim();
    if (size.length > 0) return true;

    // Any regional size value?
    if (regions.some((r) => (row.regional_sizes?.[r] ?? '').trim().length > 0)) return true;

    // Any measurement value (non-null and finite)
    return measurementFields.some((field) =>
    {
        const val = row.measurements?.[field];
        return typeof val === 'number' && Number.isFinite(val);
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SizeGuideViewerModal({ guideId, productId, onClose }: SizeGuideViewerModalProps)
{
    const [guide, setGuide] = useState<SizeGuide | null>(null);
    const [sections, setSections] = useState<CategorySectionPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeRegion, setActiveRegion] = useState<SizeRegion | null>(null);
    const [activeTab, setActiveTab] = useState<'table' | 'file'>('table');

    // Track whether analytics has been recorded for this open
    const analyticsRecorded = useRef(false);

    // ── Fetch guide + rows on mount ──────────────────────────────────────────
    useEffect(() =>
    {
        let cancelled = false;

        async function fetchGuide()
        {
            setLoading(true);
            setError(null);
            try
            {
                const guideRes = await fetch(`/api/size-guides/${guideId}`);

                if (!guideRes.ok)
                {
                    throw new Error(`Failed to load size guide (${guideRes.status})`);
                }

                const guideData = await guideRes.json();

                if (cancelled) return;

                const fetchedGuide: SizeGuide = guideData.guide ?? guideData;
                const fetchedRows: SizeGuideRow[] = (guideData.guide?.rows ?? guideData.rows ?? [])
                    .slice()
                    .sort((a: SizeGuideRow, b: SizeGuideRow) => a.order - b.order);
                const parsedSections = parseGuideSections(fetchedGuide, fetchedRows);

                setGuide(fetchedGuide);
                setSections(parsedSections);

                const primaryRegions =
                    parsedSections[0]?.enabledRegions?.length > 0
                        ? parsedSections[0].enabledRegions
                        : fetchedGuide.enabled_regions ?? [];
                if (primaryRegions.length > 0)
                {
                    setActiveRegion(primaryRegions[0]);
                }

                const hasStructuredRows = parsedSections.some((s) => s.rows.length > 0);
                setActiveTab(hasStructuredRows ? 'table' : 'file');
            } catch (err: any)
            {
                if (!cancelled)
                {
                    setError(err.message ?? 'Failed to load size guide');
                }
            } finally
            {
                if (!cancelled) setLoading(false);
            }
        }

        fetchGuide();
        return () => { cancelled = true; };
    }, [guideId]);

    // ── Record analytics view on open (once) ────────────────────────────────
    useEffect(() =>
    {
        if (analyticsRecorded.current) return;
        analyticsRecorded.current = true;

        const sessionId = generateSessionId();
        // Fire-and-forget — do not block the UI on analytics
        recordView(guideId, productId, sessionId).catch(() =>
        {
            // Silently ignore analytics failures — they must not affect the viewer UX
        });
    }, [guideId, productId]);

    // ── Close on backdrop click ──────────────────────────────────────────────
    const handleBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) =>
        {
            if (e.target === e.currentTarget) onClose();
        },
        [onClose],
    );

    // ── Close on Escape key ──────────────────────────────────────────────────
    useEffect(() =>
    {
        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // ── Derived values ───────────────────────────────────────────────────────
    const hasStructuredRows = sections.some((s) => s.rows.length > 0);
    const unitLabel = guide ? UNIT_LABEL[guide.unit] : '';
    const displayPref = guide?.display_preference ?? 'table';
    const hasUploadPreview =
        !!guide?.uploaded_file_url &&
        (guide.uploaded_file_type === 'image' || guide.uploaded_file_type === 'pdf');
    const showTableTab = hasStructuredRows || displayPref === 'table' || displayPref === 'both';
    const showFileTab =
        hasUploadPreview &&
        !hasStructuredRows &&
        (displayPref === 'file' || displayPref === 'both');

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-label="Size Guide"
        >
            <div className="relative w-full sm:w-[90%] sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh]">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Ruler size={16} className="text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                {guide?.title ?? 'Size Guide'}
                            </h2>
                            {guide && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {sections.length > 1
                                        ? sections.map((s) => formatCategoryLabel(s.category)).join(', ')
                                        : formatCategoryLabel(guide.category)}{' '}
                                    · Measurements in{' '}
                                    <span className="font-medium text-gray-700">{guide.unit}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                        aria-label="Close size guide"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 size={28} className="animate-spin text-gray-400" />
                            <p className="text-sm text-gray-500">Loading size guide…</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
                            <AlertCircle size={28} className="text-red-400" />
                            <p className="text-sm text-red-600 font-medium">Unable to load size guide</p>
                            <p className="text-xs text-gray-500">{error}</p>
                        </div>
                    )}

                    {!loading && !error && guide && (
                        <>
                            {/* ── Display mode tabs (only shown when both table + file are available) ── */}
                            {showFileTab && showTableTab && (
                                <div className="flex gap-1 px-5 pt-4 pb-0">
                                    <button
                                        onClick={() => setActiveTab('table')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'table'
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Ruler size={14} />
                                        Measurements
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('file')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'file'
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {guide.uploaded_file_type === 'pdf' ? (
                                            <FileText size={14} />
                                        ) : (
                                            <ImageIcon size={14} />
                                        )}
                                        Size Chart
                                    </button>
                                </div>
                            )}

                            {/* ── Table view ── */}
                            {(activeTab === 'table' && showTableTab) && (
                                <div className="px-5 pt-4 pb-2 space-y-6">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-gray-500">
                                            All measurements in{' '}
                                            <span className="font-semibold text-gray-800">
                                                {guide.unit} ({unitLabel})
                                            </span>
                                        </span>
                                    </div>

                                    {sections.every((s) => s.rows.length === 0) ? (
                                        <div className="py-10 text-center text-sm text-gray-400 italic">
                                            No measurement data available.
                                        </div>
                                    ) : (
                                        sections.map((section) => {
                                            const measurementFields =
                                                getMeasurementFieldsForSection(section);
                                            const sectionRegions = section.enabledRegions;
                                            const displayRows = section.rows.filter((row) =>
                                                rowHasAnyData(row, measurementFields, sectionRegions),
                                            );

                                            return (
                                                <div key={section.id} className="space-y-3">
                                                    {sections.length > 1 && (
                                                        <h3 className="text-sm font-semibold text-gray-800">
                                                            {formatCategoryLabel(section.category)}
                                                        </h3>
                                                    )}

                                                    {sectionRegions.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                                Region
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {ALL_REGIONS.filter((r) =>
                                                                    sectionRegions.includes(r),
                                                                ).map((region) => (
                                                                    <button
                                                                        key={`${section.id}-${region}`}
                                                                        onClick={() => setActiveRegion(region)}
                                                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${activeRegion === region
                                                                                ? 'bg-gray-900 text-white'
                                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                            }`}
                                                                    >
                                                                        {region}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {section.rows.length === 0 ? (
                                                        <p className="text-sm text-gray-400 italic">
                                                            No rows for this category.
                                                        </p>
                                                    ) : (
                                                        <div className="overflow-x-auto -mx-5 px-5">
                                                            <table className="w-full text-sm border-collapse min-w-[480px]">
                                                                <thead>
                                                                    <tr className="border-b-2 border-gray-200">
                                                                        <th className="text-left py-2.5 pr-4 font-semibold text-gray-700 whitespace-nowrap sticky left-0 bg-white z-10 min-w-[80px]">
                                                                            Size
                                                                        </th>
                                                                        {activeRegion &&
                                                                            sectionRegions.includes(activeRegion) && (
                                                                            <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap min-w-[80px]">
                                                                                {activeRegion} Size
                                                                            </th>
                                                                        )}
                                                                        {measurementFields.map((field) => (
                                                                            <th
                                                                                key={field}
                                                                                className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap min-w-[110px]"
                                                                            >
                                                                                {field}
                                                                                <span className="ml-1 text-xs font-normal text-gray-400">
                                                                                    ({unitLabel})
                                                                                </span>
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {displayRows.length === 0 ? (
                                                                        <tr>
                                                                            <td
                                                                                colSpan={
                                                                                    1 +
                                                                                    (activeRegion && sectionRegions.includes(activeRegion) ? 1 : 0) +
                                                                                    measurementFields.length
                                                                                }
                                                                                className="py-10 text-center text-sm text-gray-400 italic"
                                                                            >
                                                                                No measurement data available.
                                                                            </td>
                                                                        </tr>
                                                                    ) : displayRows.map((row, idx) => (
                                                                        <tr
                                                                            key={row.id}
                                                                            className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                                                                }`}
                                                                        >
                                                                            <td className="py-2.5 pr-4 font-semibold text-gray-900 whitespace-nowrap sticky left-0 bg-inherit z-10">
                                                                                {row.size_label || '—'}
                                                                            </td>
                                                                            {activeRegion &&
                                                                                sectionRegions.includes(activeRegion) && (
                                                                                <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">
                                                                                    {row.regional_sizes?.[activeRegion] ?? '—'}
                                                                                </td>
                                                                            )}
                                                                            {measurementFields.map((field) => {
                                                                                const val = row.measurements?.[field];
                                                                                return (
                                                                                    <td
                                                                                        key={field}
                                                                                        className="py-2.5 px-3 text-gray-700 whitespace-nowrap"
                                                                                    >
                                                                                        {val !== null && val !== undefined ? (
                                                                                            <>
                                                                                                {val}
                                                                                                <span className="ml-0.5 text-xs text-gray-400">
                                                                                                    {unitLabel}
                                                                                                </span>
                                                                                            </>
                                                                                        ) : (
                                                                                            <span className="text-gray-300">—</span>
                                                                                        )}
                                                                                    </td>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* ── File preview view ── */}
                            {(activeTab === 'file' && showFileTab) && (
                                <div className="px-5 pt-4 pb-4">
                                    <FilePreview
                                        url={guide.uploaded_file_url!}
                                        fileType={guide.uploaded_file_type!}
                                        title={guide.title}
                                    />
                                </div>
                            )}

                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                    <p className="text-xs text-gray-400">
                        Measurements are approximate. Fit may vary.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── File Preview Sub-component ───────────────────────────────────────────────

interface FilePreviewProps
{
    url: string;
    fileType: 'image' | 'pdf' | 'csv' | 'xlsx';
    title: string;
}

function FilePreview({ url, fileType, title }: FilePreviewProps)
{
    if (fileType === 'image')
    {
        return (
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={url}
                    alt={`${title} size chart`}
                    className="w-full h-auto object-contain max-h-[60vh]"
                    loading="lazy"
                />
            </div>
        );
    }

    if (fileType === 'pdf')
    {
        return (
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <iframe
                    src={`${url}#toolbar=0&navpanes=0`}
                    title={`${title} size chart`}
                    className="w-full"
                    style={{ height: '60vh', minHeight: '320px' }}
                />
                <div className="px-4 py-2.5 border-t border-gray-200 flex items-center justify-between bg-white">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <FileText size={13} className="text-gray-400" />
                        PDF Size Chart
                    </span>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-gray-700 hover:text-gray-900 underline underline-offset-2"
                    >
                        Open in new tab
                    </a>
                </div>
            </div>
        );
    }

    // Fallback for unsupported preview types (csv, xlsx)
    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
            <FileText size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-600 font-medium mb-1">Size chart file</p>
            <p className="text-xs text-gray-400 mb-4">Preview not available for this file type.</p>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
                Download file
            </a>
        </div>
    );
}
