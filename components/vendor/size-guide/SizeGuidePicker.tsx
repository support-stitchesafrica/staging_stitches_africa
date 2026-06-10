"use client";

/**
 * SizeGuidePicker
 * Lets a vendor select one of their approved size guides for a product.
 * Filters guides to those whose category_sections include the product's wear_category.
 *
 * Usage:
 *   <SizeGuidePicker
 *     tailorUID={uid}
 *     wearCategory="Dresses"          // optional — filters the list
 *     value={formData.size_guide_id}
 *     onChange={(id) => setFormData(p => ({ ...p, size_guide_id: id }))}
 *   />
 */

import { useEffect, useState } from "react";
import { getVendorGuides } from "@/vendor-services/sizeGuideService";
import type { SizeGuide, SizeGuideCategory } from "@/types/size-guide";
import { Loader2, BookOpen, X } from "lucide-react";

// Map product wear_category strings → SizeGuideCategory values
const WEAR_CATEGORY_MAP: Record<string, SizeGuideCategory[]> = {
    // clothing
    dress: ["Dresses"],
    dresses: ["Dresses"],
    shirt: ["Shirts"],
    shirts: ["Shirts"],
    blouse: ["Shirts"],
    top: ["Shirts", "Unisex"],
    trouser: ["Trousers"],
    trousers: ["Trousers"],
    pants: ["Trousers"],
    jacket: ["Jackets"],
    jackets: ["Jackets"],
    coat: ["Jackets"],
    native: ["Native_Wear"],
    "native wear": ["Native_Wear"],
    agbada: ["Native_Wear"],
    kaftan: ["Native_Wear"],
    bag: ["Bags"],
    bags: ["Bags"],
    handbag: ["Bags"],
    purse: ["Bags"],
    kids: ["Kids_Wear"],
    "kids wear": ["Kids_Wear"],
    children: ["Kids_Wear"],
    unisex: ["Unisex"],
    // footwear
    shoe: ["Shoes"],
    shoes: ["Shoes"],
    sneaker: ["Shoes"],
    sneakers: ["Shoes"],
    boot: ["Shoes"],
    boots: ["Shoes"],
    sandal: ["Shoes"],
    sandals: ["Shoes"],
    footwear: ["Shoes"],
    loafer: ["Shoes"],
    heel: ["Shoes"],
    heels: ["Shoes"],
};

function guideMatchesCategory(
    guide: SizeGuide & { category_sections?: { category: SizeGuideCategory }[] },
    wearCategory: string,
): boolean
{
    const key = wearCategory.toLowerCase().trim();
    const targets = WEAR_CATEGORY_MAP[key];
    if (!targets || targets.length === 0) return true; // no filter if unknown

    // Check multi-category sections first
    const sections = (guide as any).category_sections as { category: SizeGuideCategory }[] | undefined;
    if (sections && sections.length > 0)
    {
        return sections.some((s) => targets.includes(s.category));
    }
    // Fall back to primary category
    return targets.includes(guide.category);
}

interface SizeGuidePickerProps
{
    tailorUID: string;
    wearCategory?: string;
    value?: string;
    onChange: (guideId: string | undefined) => void;
}

export function SizeGuidePicker({
    tailorUID,
    wearCategory,
    value,
    onChange,
}: SizeGuidePickerProps)
{
    const [guides, setGuides] = useState<SizeGuide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() =>
    {
        if (!tailorUID) return;
        setLoading(true);
        getVendorGuides()
            .then((all) =>
            {
                // Only show approved guides
                const approved = all.filter((g) => g.status === "approved");
                setGuides(approved);
            })
            .catch(() => setError("Failed to load size guides."))
            .finally(() => setLoading(false));
    }, [tailorUID]);

    const filtered = wearCategory
        ? guides.filter((g) => guideMatchesCategory(g as any, wearCategory))
        : guides;

    const selected = guides.find((g) => g.id === value);

    if (loading)
    {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading size guides…
            </div>
        );
    }

    if (error)
    {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-sm font-medium text-gray-700">Size Guide</span>
                {wearCategory && filtered.length < guides.length && (
                    <span className="text-xs text-gray-400">
                        (filtered for {wearCategory})
                    </span>
                )}
            </div>

            {filtered.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                    No approved size guides found
                    {wearCategory ? ` for ${wearCategory}` : ""}.
                    Create one in your settings.
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {filtered.map((guide) =>
                    {
                        const isSelected = guide.id === value;
                        // Collect category names for display
                        const sections = (guide as any).category_sections as
                            | { category: string }[]
                            | undefined;
                        const categoryLabel = sections && sections.length > 1
                            ? sections.map((s) => s.category.replace("_", " ")).join(", ")
                            : guide.category.replace("_", " ");

                        return (
                            <button
                                key={guide.id}
                                type="button"
                                onClick={() => onChange(isSelected ? undefined : guide.id)}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${isSelected
                                    ? "border-gray-900 bg-gray-900 text-white"
                                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-500 hover:bg-gray-50"
                                    }`}
                            >
                                <span className="font-medium">{guide.title}</span>
                                <span className={`text-xs ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                                    {categoryLabel}
                                </span>
                                {isSelected && (
                                    <X className="h-3.5 w-3.5 text-gray-300 hover:text-white" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {selected && (
                <p className="text-xs text-green-700 flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                    Size guide attached: {selected.title}
                </p>
            )}
        </div>
    );
}
