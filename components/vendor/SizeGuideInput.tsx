import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, X } from "lucide-react";
import { SizeGuide, SizeGuideColumn, SizeGuideRow } from "@/types";

interface SizeGuideInputProps {
	sizes: string[];
	value?: SizeGuide;
	onChange: (guide: SizeGuide) => void;
}

export function SizeGuideInput({
	sizes,
	value,
	onChange,
}: SizeGuideInputProps) {
	// Initialize or use existing data
	const columns = value?.columns || [];
	const rows = value?.rows || [];

	// Sync rows with available sizes
	useEffect(() => {
		if (sizes.length === 0) return;

		const newRows = sizes.map((size) => {
			const existingRow = rows.find((row) => row.sizeLabel === size);
			return (
				existingRow || {
					sizeLabel: size,
					values: {},
				}
			);
		});

		// Only update if there are changes to avoid infinite loop
		const isDifferent =
			newRows.length !== rows.length ||
			newRows.some((newRow, i) => newRow.sizeLabel !== rows[i]?.sizeLabel);

		if (isDifferent) {
			onChange({ columns, rows: newRows });
		}
	}, [sizes, rows, columns, onChange]); // Depend on size changes

	const addColumn = () => {
		const newColumn: SizeGuideColumn = {
			id: `col_${Date.now()}`,
			label: "New Measurement",
		};
		onChange({
			columns: [...columns, newColumn],
			rows,
		});
	};

	const updateColumnLabel = (id: string, newLabel: string) => {
		const newColumns = columns.map((col) =>
			col.id === id ? { ...col, label: newLabel } : col,
		);
		onChange({ columns: newColumns, rows });
	};

	const removeColumn = (id: string) => {
		const newColumns = columns.filter((col) => col.id !== id);
		// Clean up values for this column from rows? Optional but cleaner
		const newRows = rows.map((row) => {
			const newValues = { ...row.values };
			delete newValues[id];
			return { ...row, values: newValues };
		});
		onChange({ columns: newColumns, rows: newRows });
	};

	const updateRowValue = (rowIndex: number, colId: string, val: string) => {
		const newRows = [...rows];
		newRows[rowIndex] = {
			...newRows[rowIndex],
			values: {
				...newRows[rowIndex].values,
				[colId]: val,
			},
		};
		onChange({ columns, rows: newRows });
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<div>
					<h3 className="text-lg font-medium">Size Guide</h3>
					<p className="text-sm text-gray-500">
						Define measurements for each size. Add columns for dimensions (e.g.,
						Chest, Waist).
					</p>
				</div>
				<Button onClick={addColumn} variant="outline" size="sm">
					<Plus className="w-4 h-4 mr-2" /> Add Measurement Column
				</Button>
			</div>

			<div className="border rounded-md overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px]">Size</TableHead>
							{columns.map((col) => (
								<TableHead key={col.id} className="min-w-[150px]">
									<div className="flex items-center space-x-2">
										<Input
											value={col.label}
											onChange={(e) =>
												updateColumnLabel(col.id, e.target.value)
											}
											className="h-8 text-sm"
											placeholder="e.g. Chest (in)"
										/>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
											onClick={() => removeColumn(col.id)}
										>
											<X className="w-4 h-4" />
										</Button>
									</div>
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row, rowIndex) => (
							<TableRow key={row.sizeLabel}>
								<TableCell className="font-medium bg-gray-50">
									{row.sizeLabel}
								</TableCell>
								{columns.map((col) => (
									<TableCell key={col.id}>
										<Input
											value={row.values[col.id] || ""}
											onChange={(e) =>
												updateRowValue(rowIndex, col.id, e.target.value)
											}
											className="h-9"
											placeholder="Value"
										/>
									</TableCell>
								))}
							</TableRow>
						))}
						{rows.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={columns.length + 1}
									className="text-center py-8 text-gray-500"
								>
									No sizes defined. Please add sizes in the "Sizes & Variants"
									step first.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
