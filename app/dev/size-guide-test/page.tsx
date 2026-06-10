"use client";

/**
 * DEV-ONLY test page for the unified SizeGuideEditor.
 * Opens the editor pre-populated with all 9 categories, each with 2 sample rows.
 * Visit: /dev/size-guide-test
 *
 * Remove this file before deploying to production.
 */

import { useState } from "react";
import { SizeGuideEditor } from "@/components/vendor/size-guide/SizeGuideEditor";
import type { SizeGuide } from "@/types/size-guide";

// ── Sample guide with all 9 categories pre-filled ────────────────────────────

const SAMPLE_GUIDE: SizeGuide & { category_sections: any[]; rows: any[] } = {
    id: "test-guide-001",
    vendor_id: "test-vendor",
    title: "Full Catalogue Size Guide",
    category: "Shirts",
    unit: "CM",
    enabled_regions: ["UK", "US", "EU"],
    status: "draft",
    version: 1,
    display_preference: "table",
    created_at: null as any,
    updated_at: null as any,
    rows: [],
    category_sections: [
        {
            id: "sec-shoes",
            category: "Shoes",
            enabledRegions: ["UK", "US", "EU"],
            rows: [
                {
                    id: "r-shoes-1",
                    size_label: "UK 6",
                    order: 0,
                    measurements: { "UK Size": 6, "US Size": 6.5, "EU Size": 39, "CM Length": 24.5, "Foot Width": 8.5 },
                    regional_sizes: { UK: "6", US: "6.5", EU: "39" },
                },
                {
                    id: "r-shoes-2",
                    size_label: "UK 8",
                    order: 1,
                    measurements: { "UK Size": 8, "US Size": 8.5, "EU Size": 42, "CM Length": 26.5, "Foot Width": 9 },
                    regional_sizes: { UK: "8", US: "8.5", EU: "42" },
                },
            ],
        },
        {
            id: "sec-shirts",
            category: "Shirts",
            enabledRegions: ["UK", "US"],
            rows: [
                {
                    id: "r-shirts-1",
                    size_label: "S",
                    order: 0,
                    measurements: { "Chest/Bust": 88, "Waist": 72, "Hips": 90, "Shoulder Width": 42, "Sleeve Length": 62, "Neck": 37, "Inseam": null, "Length": 70 },
                    regional_sizes: { UK: "S", US: "S" },
                },
                {
                    id: "r-shirts-2",
                    size_label: "M",
                    order: 1,
                    measurements: { "Chest/Bust": 96, "Waist": 80, "Hips": 98, "Shoulder Width": 44, "Sleeve Length": 64, "Neck": 39, "Inseam": null, "Length": 72 },
                    regional_sizes: { UK: "M", US: "M" },
                },
            ],
        },
        {
            id: "sec-dresses",
            category: "Dresses",
            enabledRegions: ["UK", "EU"],
            rows: [
                {
                    id: "r-dresses-1",
                    size_label: "XS",
                    order: 0,
                    measurements: { "Chest/Bust": 80, "Waist": 62, "Hips": 86, "Shoulder Width": 36, "Sleeve Length": 58, "Neck": 34, "Inseam": null, "Length": 90 },
                    regional_sizes: { UK: "6", EU: "34" },
                },
                {
                    id: "r-dresses-2",
                    size_label: "S",
                    order: 1,
                    measurements: { "Chest/Bust": 84, "Waist": 66, "Hips": 90, "Shoulder Width": 38, "Sleeve Length": 60, "Neck": 35, "Inseam": null, "Length": 92 },
                    regional_sizes: { UK: "8", EU: "36" },
                },
            ],
        },
        {
            id: "sec-trousers",
            category: "Trousers",
            enabledRegions: ["UK", "US"],
            rows: [
                {
                    id: "r-trousers-1",
                    size_label: "28W",
                    order: 0,
                    measurements: { "Chest/Bust": null, "Waist": 71, "Hips": 90, "Shoulder Width": null, "Sleeve Length": null, "Neck": null, "Inseam": 76, "Length": 100 },
                    regional_sizes: { UK: "28", US: "28" },
                },
                {
                    id: "r-trousers-2",
                    size_label: "32W",
                    order: 1,
                    measurements: { "Chest/Bust": null, "Waist": 81, "Hips": 100, "Shoulder Width": null, "Sleeve Length": null, "Neck": null, "Inseam": 78, "Length": 102 },
                    regional_sizes: { UK: "32", US: "32" },
                },
            ],
        },
        {
            id: "sec-jackets",
            category: "Jackets",
            enabledRegions: ["UK", "EU"],
            rows: [
                {
                    id: "r-jackets-1",
                    size_label: "S",
                    order: 0,
                    measurements: { "Chest/Bust": 92, "Waist": 76, "Hips": 94, "Shoulder Width": 43, "Sleeve Length": 63, "Neck": 38, "Inseam": null, "Length": 68 },
                    regional_sizes: { UK: "S", EU: "44" },
                },
                {
                    id: "r-jackets-2",
                    size_label: "L",
                    order: 1,
                    measurements: { "Chest/Bust": 104, "Waist": 88, "Hips": 106, "Shoulder Width": 47, "Sleeve Length": 67, "Neck": 42, "Inseam": null, "Length": 72 },
                    regional_sizes: { UK: "L", EU: "50" },
                },
            ],
        },
        {
            id: "sec-native",
            category: "Native_Wear",
            enabledRegions: [],
            rows: [
                {
                    id: "r-native-1",
                    size_label: "M",
                    order: 0,
                    measurements: { "Agbada Length": 120, "Trouser Length": 100, "Shoulder": 44, "Cap Size": 57, "Arm Circumference": 32 },
                    regional_sizes: {},
                },
                {
                    id: "r-native-2",
                    size_label: "XL",
                    order: 1,
                    measurements: { "Agbada Length": 130, "Trouser Length": 108, "Shoulder": 48, "Cap Size": 59, "Arm Circumference": 36 },
                    regional_sizes: {},
                },
            ],
        },
        {
            id: "sec-bags",
            category: "Bags",
            enabledRegions: [],
            rows: [
                {
                    id: "r-bags-1",
                    size_label: "Small",
                    order: 0,
                    measurements: { "Height": 20, "Width": 15, "Depth": 8, "Strap Length": 55 },
                    regional_sizes: {},
                },
                {
                    id: "r-bags-2",
                    size_label: "Large",
                    order: 1,
                    measurements: { "Height": 35, "Width": 28, "Depth": 14, "Strap Length": 120 },
                    regional_sizes: {},
                },
            ],
        },
        {
            id: "sec-kids",
            category: "Kids_Wear",
            enabledRegions: ["UK", "EU"],
            rows: [
                {
                    id: "r-kids-1",
                    size_label: "2Y",
                    order: 0,
                    measurements: { "Chest/Bust": 53, "Waist": 50, "Hips": 55, "Shoulder Width": 26, "Sleeve Length": 30, "Neck": 26, "Inseam": 28, "Length": 52 },
                    regional_sizes: { UK: "2Y", EU: "92" },
                },
                {
                    id: "r-kids-2",
                    size_label: "4Y",
                    order: 1,
                    measurements: { "Chest/Bust": 57, "Waist": 53, "Hips": 59, "Shoulder Width": 28, "Sleeve Length": 34, "Neck": 28, "Inseam": 34, "Length": 60 },
                    regional_sizes: { UK: "4Y", EU: "104" },
                },
            ],
        },
        {
            id: "sec-unisex",
            category: "Unisex",
            enabledRegions: ["UK", "US", "EU"],
            rows: [
                {
                    id: "r-unisex-1",
                    size_label: "S",
                    order: 0,
                    measurements: { "Chest/Bust": 90, "Waist": 74, "Hips": 92, "Shoulder Width": 43, "Sleeve Length": 62, "Neck": 37, "Inseam": null, "Length": 68 },
                    regional_sizes: { UK: "S", US: "S", EU: "44" },
                },
                {
                    id: "r-unisex-2",
                    size_label: "L",
                    order: 1,
                    measurements: { "Chest/Bust": 106, "Waist": 90, "Hips": 108, "Shoulder Width": 48, "Sleeve Length": 66, "Neck": 42, "Inseam": null, "Length": 74 },
                    regional_sizes: { UK: "L", US: "L", EU: "50" },
                },
            ],
        },
    ],
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SizeGuideTestPage()
{
    const [open, setOpen] = useState(false);
    const [saved, setSaved] = useState<SizeGuide | null>(null);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-6 p-8">
            <div className="bg-white rounded-xl shadow p-6 w-full max-w-md text-center space-y-4">
                <h1 className="text-xl font-semibold text-gray-900">Size Guide Editor — Dev Test</h1>
                <p className="text-sm text-gray-500">
                    Opens the editor pre-loaded with all 9 categories (Shoes, Shirts, Dresses,
                    Trousers, Jackets, Native Wear, Bags, Kids Wear, Unisex), each with 2 sample rows.
                </p>
                <button
                    onClick={() => setOpen(true)}
                    className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Open Editor (all categories)
                </button>
                {saved && (
                    <div className="text-left bg-gray-50 rounded-lg p-3 text-xs text-gray-600 overflow-auto max-h-48">
                        <p className="font-medium text-gray-800 mb-1">Last saved payload:</p>
                        <pre>{JSON.stringify(saved, null, 2)}</pre>
                    </div>
                )}
            </div>

            {open && (
                <SizeGuideEditor
                    tailorUID="test-vendor"
                    guide={SAMPLE_GUIDE as any}
                    onSave={(g) => { setSaved(g); setOpen(false); }}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
}
