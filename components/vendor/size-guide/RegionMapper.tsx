import { AlertTriangle } from "lucide-react";
import type { SizeRegion, SizeGuideRow } from "@/types/size-guide";
import { suggestRegionConversions } from "@/lib/size-guide/regionConversions";

const ALL_REGIONS: SizeRegion[] = ["UK", "US", "EU", "AU", "JP", "CN"];

// EU size range considered valid for standard clothing/shoes
const EU_VALID_RANGE = { min: 30, max: 60 };
// UK size range considered valid
const UK_VALID_RANGE = { min: 1, max: 20 };

interface RegionMapperProps
{
    enabledRegions: SizeRegion[];
    rows: SizeGuideRow[];
    onRegionsChange: (regions: SizeRegion[]) => void;
    onRowsChange: (rows: SizeGuideRow[]) => void;
}

function isOutOfRange(region: SizeRegion, value: string): boolean
{
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (region === "EU") return num < EU_VALID_RANGE.min || num > EU_VALID_RANGE.max;
    if (region === "UK") return num < UK_VALID_RANGE.min || num > UK_VALID_RANGE.max;
    return false;
}

export function RegionMapper({
    enabledRegions,
    rows,
    onRegionsChange,
    onRowsChange,
}: RegionMapperProps)
{
    const toggleRegion = (region: SizeRegion) =>
    {
        if (enabledRegions.includes(region))
        {
            onRegionsChange(enabledRegions.filter((r) => r !== region));
        } else
        {
            onRegionsChange([...enabledRegions, region]);
        }
    };

    const handleValueChange = (
        rowIndex: number,
        region: SizeRegion,
        value: string,
    ) =>
    {
        const updated = rows.map((row, i) =>
        {
            if (i !== rowIndex) return row;
            return {
                ...row,
                regional_sizes: {
                    ...row.regional_sizes,
                    [region]: value,
                },
            };
        });
        onRowsChange(updated);
    };

    /**
     * Get conversion hints for a given row and region.
     * Tries each enabled region as a source to find suggestions for the target region.
     */
    const getHint = (row: SizeGuideRow, targetRegion: SizeRegion): string | null =>
    {
        for (const sourceRegion of enabledRegions)
        {
            if (sourceRegion === targetRegion) continue;
            const sourceValue = row.regional_sizes[sourceRegion];
            if (!sourceValue || sourceValue.trim() === "") continue;

            const suggestions = suggestRegionConversions(sourceRegion, sourceValue);
            const match = suggestions.find((s) => s.region === targetRegion);
            if (match) return match.suggestedValue;
        }
        return null;
    };

    if (rows.length === 0)
    {
        return (
            <p className="text-sm text-gray-500 italic py-4 text-center">
                Add measurement rows first to map regional sizes.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {/* Region toggle buttons */}
            <div className="flex flex-wrap gap-2">
                {ALL_REGIONS.map((region) =>
                {
                    const enabled = enabledRegions.includes(region);
                    return (
                        <button
                            key={region}
                            type="button"
                            onClick={() => toggleRegion(region)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${enabled
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-500 hover:text-gray-800"
                                }`}
                            aria-pressed={enabled}
                        >
                            {region}
                        </button>
                    );
                })}
            </div>

            {enabledRegions.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                    No regions enabled. Toggle regions above to add regional size columns.
                </p>
            )}

            {enabledRegions.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2 pr-3 font-medium text-gray-600 whitespace-nowrap min-w-[100px]">
                                    Size Label
                                </th>
                                {enabledRegions.map((region) => (
                                    <th
                                        key={region}
                                        className="text-left py-2 px-2 font-medium text-gray-600 whitespace-nowrap min-w-[100px]"
                                    >
                                        {region}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rowIndex) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                    {/* Size label (read-only reference) */}
                                    <td className="py-2 pr-3">
                                        <span className="text-sm text-gray-700 font-medium">
                                            {row.size_label || (
                                                <span className="text-gray-400 italic">Row {rowIndex + 1}</span>
                                            )}
                                        </span>
                                    </td>

                                    {/* Regional size inputs */}
                                    {enabledRegions.map((region) =>
                                    {
                                        const value = row.regional_sizes[region] ?? "";
                                        const outOfRange = value !== "" && isOutOfRange(region, value);
                                        const hint = !value ? getHint(row, region) : null;

                                        return (
                                            <td key={region} className="py-2 px-2">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={value}
                                                        onChange={(e) =>
                                                            handleValueChange(rowIndex, region, e.target.value)
                                                        }
                                                        placeholder={hint ? `~${hint}` : "—"}
                                                        className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 ${outOfRange
                                                                ? "border-amber-400 bg-amber-50 pr-7"
                                                                : "border-gray-300"
                                                            }`}
                                                    />
                                                    {outOfRange && (
                                                        <span
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500"
                                                            title={`${region} value ${value} may be out of the expected range`}
                                                        >
                                                            <AlertTriangle className="h-3.5 w-3.5" />
                                                        </span>
                                                    )}
                                                </div>
                                                {hint && !value && (
                                                    <p className="mt-0.5 text-xs text-blue-500">
                                                        Suggested: {hint}
                                                    </p>
                                                )}
                                                {outOfRange && (
                                                    <p className="mt-0.5 text-xs text-amber-600">
                                                        Value may be out of range for {region}
                                                    </p>
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
}
