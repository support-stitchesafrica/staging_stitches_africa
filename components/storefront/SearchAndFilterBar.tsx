"use client";

import React, { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import ProductFilters from "./ProductFilters";
import {
	ProductFilters as IProductFilters,
	ProductSortOptions,
} from "@/lib/storefront/client-product-service";

interface SearchAndFilterBarProps {
	categories: string[];
	priceRange: { min: number; max: number };
	filters: IProductFilters;
	sort: ProductSortOptions;
	onFiltersChange: (filters: IProductFilters) => void;
	onSortChange: (sort: ProductSortOptions) => void;
	className?: string;
}

export default function SearchAndFilterBar({
	categories,
	priceRange,
	filters,
	sort,
	onFiltersChange,
	onSortChange,
	className = "",
}: SearchAndFilterBarProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Handle search change directly here
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onFiltersChange({ ...filters, search: e.target.value });
	};

	const clearSearch = () => {
		onFiltersChange({ ...filters, search: "" });
	};

	const activeFilterCount = Object.keys(filters).filter((key) => {
		const value = filters[key as keyof IProductFilters];
		return (
			value !== undefined && value !== null && value !== "" && key !== "search"
		); // Exclude search from count
	}).length;

	return (
		<div className={`flex items-center gap-3 ${className}`}>
			<div className="relative flex-1">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search products..."
					value={filters.search || ""}
					onChange={handleSearchChange}
					className="pl-9 bg-white"
				/>
				{filters.search && (
					<button
						onClick={clearSearch}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
					<Button variant="outline" className="gap-2 bg-white relative">
						<SlidersHorizontal className="h-4 w-4" />
						<span className="hidden sm:inline">Filters</span>
						{activeFilterCount > 0 && (
							<span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
								{activeFilterCount}
							</span>
						)}
					</Button>
				</DialogTrigger>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Filters & Sort</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<ProductFilters
							categories={categories}
							priceRange={priceRange}
							filters={filters}
							sort={sort}
							onFiltersChange={onFiltersChange}
							onSortChange={onSortChange}
							hideSearch={true}
							className="shadow-none border-0"
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
