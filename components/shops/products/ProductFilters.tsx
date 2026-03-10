"use client";

import React from "react";
import { Product } from "@/types";
import { ListFilter, X } from "lucide-react";
import {
	FilterState,
	getUniqueCategories,
	getUniqueVendors,
	normalizeProductsVendorData,
	createDefaultFilterState,
	hasActiveFilters,
} from "@/lib/utils/filter-utils";

interface ProductFiltersProps {
	filters: FilterState;
	onFiltersChange: (filters: FilterState) => void;
	products: Product[];
	resultCount: number;
}

const ProductFiltersComponent: React.FC<ProductFiltersProps> = ({
	filters,
	onFiltersChange,
	products,
	resultCount,
}) => {
	const [isOpen, setIsOpen] = React.useState(false);

	// Extract unique values from products with normalized vendor data
	const normalizedProducts = normalizeProductsVendorData(products);
	const categories = getUniqueCategories(normalizedProducts);
	const vendors = getUniqueVendors(normalizedProducts);

	const updateFilter = (key: keyof FilterState, value: any) => {
		onFiltersChange({
			...filters,
			[key]: value,
		});
	};

	const clearFilters = () => {
		onFiltersChange(createDefaultFilterState());
	};

	const filtersActive = hasActiveFilters(filters);

	return (
		<div className="mb-8">
			{/* Mobile Filter Toggle */}
			<div className="lg:hidden mb-4">
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
				>
					<ListFilter size={16} />
					<span>Filters</span>
					{filtersActive && (
						<span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
							Active
						</span>
					)}
				</button>
			</div>

			{/* Filter Panel */}
			<div
				className={`${isOpen ? "block" : "hidden"} lg:block bg-white border border-gray-200 rounded-lg p-6`}
			>
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						<h3 className="text-lg font-semibold text-gray-900">Filters</h3>
						<span className="text-sm text-gray-500">
							{resultCount} {resultCount === 1 ? "product" : "products"}
						</span>
					</div>
					<div className="flex items-center space-x-2">
						{filtersActive && (
							<button
								onClick={clearFilters}
								className="text-sm text-primary-600 hover:text-primary-500"
							>
								Clear all
							</button>
						)}
						<button
							onClick={() => setIsOpen(false)}
							className="lg:hidden p-1 hover:bg-gray-100 rounded"
						>
							<X size={16} />
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
					{/* Product Type */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Type
						</label>
						<select
							value={filters.type}
							onChange={(e) => updateFilter("type", e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
						>
							<option value="all">All Types</option>
							<option value="bespoke">Bespoke</option>
							<option value="ready-to-wear">Ready-to-Wear</option>
						</select>
					</div>

					{/* Category */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Category
						</label>
						<select
							value={filters.category}
							onChange={(e) => updateFilter("category", e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
						>
							<option value="all">All Categories</option>
							{categories.map((category) => (
								<option key={category} value={category}>
									{category.charAt(0).toUpperCase() + category.slice(1)}
								</option>
							))}
						</select>
					</div>

					{/* Vendor */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Brand
						</label>
						<select
							value={filters.vendor}
							onChange={(e) => updateFilter("vendor", e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
						>
							<option value="all">All Brands</option>
							{vendors.map((vendor) => (
								<option key={vendor.id} value={vendor.id}>
									{vendor.name}
								</option>
							))}
						</select>
					</div>

					{/* Availability */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Availability
						</label>
						<select
							value={filters.availability}
							onChange={(e) => updateFilter("availability", e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
						>
							<option value="all">All</option>
							<option value="in_stock">In Stock</option>
							<option value="pre_order">Pre-Order</option>
							<option value="out_of_stock">Out of Stock</option>
						</select>
					</div>

					{/* Sort By */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Sort By
						</label>
						<select
							value={filters.sortBy}
							onChange={(e) => updateFilter("sortBy", e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
						>
							<option value="newest">Newest</option>
							<option value="price_low">Price: Low to High</option>
							<option value="price_high">Price: High to Low</option>
							<option value="discount">Highest Discount</option>
						</select>
					</div>

					{/* Price Range */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Price Range
						</label>
						<div className="space-y-2">
							<input
								type="range"
								min="0"
								max="10000"
								step="100"
								value={filters.priceRange[1]}
								onChange={(e) =>
									updateFilter("priceRange", [
										filters.priceRange[0],
										parseInt(e.target.value),
									])
								}
								className="w-full"
							/>
							<div className="flex justify-between text-xs text-gray-500">
								<span>${filters.priceRange[0]}</span>
								<span>${filters.priceRange[1]}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// Memoization comparison function for ProductFilters
const productFiltersComparison = (
	prevProps: ProductFiltersProps,
	nextProps: ProductFiltersProps,
): boolean => {
	// Compare filters object (shallow comparison of filter values)
	const prevFilters = prevProps.filters;
	const nextFilters = nextProps.filters;

	if (prevFilters.type !== nextFilters.type) return false;
	if (prevFilters.category !== nextFilters.category) return false;
	if (prevFilters.vendor !== nextFilters.vendor) return false;
	if (prevFilters.availability !== nextFilters.availability) return false;
	if (prevFilters.sortBy !== nextFilters.sortBy) return false;
	if (prevFilters.priceRange[0] !== nextFilters.priceRange[0]) return false;
	if (prevFilters.priceRange[1] !== nextFilters.priceRange[1]) return false;

	// Compare products array length (for filter options)
	if (prevProps.products.length !== nextProps.products.length) return false;

	// Compare result count
	if (prevProps.resultCount !== nextProps.resultCount) return false;

	// Compare onFiltersChange function reference
	if (prevProps.onFiltersChange !== nextProps.onFiltersChange) return false;

	return true;
};

// Export memoized component
export const ProductFilters = React.memo(
	ProductFiltersComponent,
	productFiltersComparison,
);
