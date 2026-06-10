import { Plus, Trash2 } from "lucide-react";
import type {
    SizeGuideCategory,
    MeasurementUnit,
    SizeGuideRow,
} from "@/types/size-guide";
import { CATEGORY_FIELDS } from "@/types/size-guide";

export interface ValidationError
{
    rowIndex?: number;
    field?: string;
    message: string;
}

interface CategoryFieldRendererProps
{
    category: SizeGuideCategory;
    unit: MeasurementUnit;
    rows: SizeGuideRow[];
    onChange: (rows: SizeGuideRow[]) => void;
    errors?: ValidationError[];
}

function getFieldError(
    errors: ValidationError[] | undefined,
    rowIndex: number,
    field: string,
): string | undefined
{
    return errors?.find((e) => e.rowIndex === rowIndex && e.field === field)
        ?.message;
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

export function CategoryFieldRenderer({
    category,
    unit,
    rows,
    onChange,
    errors,
}: CategoryFieldRendererProps)
{
    const fields = CATEGORY_FIELDS[category] ?? [];
    const unitLabel = unit === "CM" ? "cm" : "in";

    // Determine which fields are numeric (all fields for most categories)
    // Shoes has mixed numeric fields; we show unit label on all measurement fields
    const isNumericField = (field: string) =>
    {
        // size_label is always text; all measurement fields are numeric
        return true;
    };

    const handleAddRow = () =>
    {
        const newRow = createEmptyRow(rows.length);
        onChange([...rows, newRow]);
    };

    const handleRemoveRow = (index: number) =>
    {
        const updated = rows
            .filter((_, i) => i !== index)
            .map((row, i) => ({ ...row, order: i }));
        onChange(updated);
    };

    const handleLabelChange = (index: number, value: string) =>
    {
        const updated = rows.map((row, i) =>
            i === index ? { ...row, size_label: value } : row,
        );
        onChange(updated);
    };

    const handleMeasurementChange = (
        index: number,
        field: string,
        value: string,
    ) =>
    {
        const updated = rows.map((row, i) =>
        {
            if (i !== index) return row;
            const parsed = value === "" ? null : parseFloat(value);
            return {
                ...row,
                measurements: {
                    ...row.measurements,
                    [field]: isNaN(parsed as number) ? null : parsed,
                },
            };
        });
        onChange(updated);
    };

    const labelError = (rowIndex: number) =>
        errors?.find((e) => e.rowIndex === rowIndex && e.field === "size_label")
            ?.message;

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-2 pr-3 font-medium text-gray-600 whitespace-nowrap min-w-[100px]">
                                Size Label
                            </th>
                            {fields.map((field) => (
                                <th
                                    key={field}
                                    className="text-left py-2 px-2 font-medium text-gray-600 whitespace-nowrap min-w-[110px]"
                                >
                                    {field}
                                    {isNumericField(field) && (
                                        <span className="ml-1 text-xs text-gray-400 font-normal">
                                            ({unitLabel})
                                        </span>
                                    )}
                                </th>
                            ))}
                            <th className="w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={fields.length + 2}
                                    className="py-6 text-center text-gray-400 text-sm italic"
                                >
                                    No rows yet. Click "Add Row" to get started.
                                </td>
                            </tr>
                        )}
                        {rows.map((row, rowIndex) => (
                            <tr
                                key={row.id}
                                className="border-b border-gray-100 hover:bg-gray-50"
                            >
                                {/* Size label cell */}
                                <td className="py-2 pr-3">
                                    <div>
                                        <input
                                            type="text"
                                            value={row.size_label}
                                            onChange={(e) =>
                                                handleLabelChange(rowIndex, e.target.value)
                                            }
                                            placeholder="e.g. S, M, 42"
                                            className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 ${labelError(rowIndex)
                                                    ? "border-red-400 bg-red-50"
                                                    : "border-gray-300"
                                                }`}
                                        />
                                        {labelError(rowIndex) && (
                                            <p className="mt-0.5 text-xs text-red-600">
                                                {labelError(rowIndex)}
                                            </p>
                                        )}
                                    </div>
                                </td>

                                {/* Measurement fields */}
                                {fields.map((field) =>
                                {
                                    const fieldErr = getFieldError(errors, rowIndex, field);
                                    const rawVal = row.measurements[field];
                                    const displayVal =
                                        rawVal === null || rawVal === undefined ? "" : String(rawVal);

                                    return (
                                        <td key={field} className="py-2 px-2">
                                            <div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={displayVal}
                                                        onChange={(e) =>
                                                            handleMeasurementChange(
                                                                rowIndex,
                                                                field,
                                                                e.target.value,
                                                            )
                                                        }
                                                        min="0"
                                                        step="0.1"
                                                        placeholder="—"
                                                        className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 pr-8 ${fieldErr
                                                                ? "border-red-400 bg-red-50"
                                                                : "border-gray-300"
                                                            }`}
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                                                        {unitLabel}
                                                    </span>
                                                </div>
                                                {fieldErr && (
                                                    <p className="mt-0.5 text-xs text-red-600">
                                                        {fieldErr}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}

                                {/* Remove row button */}
                                <td className="py-2 pl-2">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRow(rowIndex)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        aria-label={`Remove row ${rowIndex + 1}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add row button */}
            <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
                <Plus className="h-4 w-4" />
                Add Row
            </button>

            {/* Global errors (no rowIndex) */}
            {errors
                ?.filter((e) => e.rowIndex === undefined && e.field === undefined)
                .map((e, i) => (
                    <p key={i} className="text-sm text-red-600">
                        {e.message}
                    </p>
                ))}
        </div>
    );
}
