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
import { WEAR_CATEGORY_PRESETS } from "@/lib/wear-category-presets";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
	convertUsdToCurrencySync,
	convertCurrencyToUsdSync,
} from "@/lib/utils/currency";

/** Upper bound stored in filters / applyPriceFilter (USD-equivalent semantics). */
const PRICE_RANGE_MAX_USD = 10000;

/** NGN slider top end (maps linearly ↔ {@link PRICE_RANGE_MAX_USD} for stored filter values). */
const PRICE_RANGE_MAX_DISPLAY_NGN = 6_000_000;

interface ProductFiltersProps {
	filters: FilterState;
	onFiltersChange: (filters: FilterState) => void;
	products: Product[];
	/** Count for the panel label (preview = draft match count when applying is deferred). */
	resultCount: number;
	/** When set, filter edits stay local until Apply is clicked. */
	onApply?: () => void;
	/** True when draft filters differ from applied (enables Apply). */
	hasPendingChanges?: boolean;
	/** Resets draft + applied filter state (required for deferred mode clear behaviour). */
	onClearAll?: () => void;
}

const ProductFiltersComponent: React.FC<ProductFiltersProps> = ({
	filters,
	onFiltersChange,
	products,
	resultCount,
	onApply,
	hasPendingChanges = false,
	onClearAll,
}) => {
	const [isOpen, setIsOpen] = React.useState(false);
	const { userCurrency, formatPrice, isLoading } = useCurrency();

	// Extract unique values from products with normalized vendor data
	const normalizedProducts = normalizeProductsVendorData(products);
	const categories = getUniqueCategories(normalizedProducts);
	const vendors = getUniqueVendors(normalizedProducts);

	const { sliderMaxDisplay, sliderValueDisplay, sliderStep } = React.useMemo(
		() =>
		{
			const cappedUsdMax = Math.min(
				Math.max(0, filters.priceRange[1]),
				PRICE_RANGE_MAX_USD,
			);

			const useNgnDisplayCap = userCurrency === "NGN";

			const maxDisplay = useNgnDisplayCap
				? PRICE_RANGE_MAX_DISPLAY_NGN
				: Math.round(
						convertUsdToCurrencySync(PRICE_RANGE_MAX_USD, userCurrency),
					);
			const valueDisplay = useNgnDisplayCap
				? Math.round(
						(cappedUsdMax / PRICE_RANGE_MAX_USD) *
							PRICE_RANGE_MAX_DISPLAY_NGN,
					)
				: Math.round(
						convertUsdToCurrencySync(cappedUsdMax, userCurrency),
					);

			let step = 100;
			if (userCurrency === "JPY") step = 1000;
			else if (userCurrency === "NGN") step = 25000;
			else if (userCurrency !== "USD")
			{
				step = Math.max(
					50,
					Math.round(convertUsdToCurrencySync(25, userCurrency)),
				);
			}

			return {
				sliderMaxDisplay: maxDisplay,
				sliderValueDisplay: valueDisplay,
				sliderStep: step,
			};
		},
		[filters.priceRange, userCurrency],
	);

	const updateFilter = (key: keyof FilterState, value: any) => {
		onFiltersChange({
			...filters,
			[key]: value,
		});
	};

	const clearFilters = () => {
		if (onClearAll) {
			onClearAll();
		} else {
			onFiltersChange(createDefaultFilterState());
		}
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
					<div className="flex items-center gap-2 flex-wrap justify-end">
						{onApply ? (
							<button
								type="button"
								onClick={() =>
								{
									onApply();
									setIsOpen(false);
								}}
								disabled={!hasPendingChanges}
								className="text-sm font-medium px-3 py-1.5 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-black transition-colors"
							>
								Apply
							</button>
						) : null}
						{filtersActive && (
							<button
								type="button"
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

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
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

					{/* Sub-category (wear_category) */}
					{/* <div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Sub-category
						</label>
						<select
							value={filters.subCategory}
							onChange={(e) => updateFilter("subCategory", e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
						>
							<option value="all">All sub-categories</option>
							{WEAR_CATEGORY_PRESETS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.value}
								</option>
							))}
						</select>
					</div> */}

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

					{/* Price Range (labels + slider scale follow selected storefront currency; filter state stays USD-equivalent.) */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Price range
							{!isLoading && userCurrency !== "USD" ? (
								<span className="font-normal text-gray-500"> ({userCurrency})</span>
							) : null}
						</label>
						<div className="space-y-2">
							<input
								type="range"
								min="0"
								max={sliderMaxDisplay}
								step={sliderStep}
								value={sliderValueDisplay}
								disabled={isLoading || sliderMaxDisplay <= 0}
								onChange={(e) =>
								{
									const displayMax = Number(e.target.value);
									const usdMaxRaw =
										userCurrency === "NGN"
											? (displayMax /
													PRICE_RANGE_MAX_DISPLAY_NGN) *
												PRICE_RANGE_MAX_USD
											: convertCurrencyToUsdSync(
													displayMax,
													userCurrency,
												);
									const usdMax = Math.min(
										Math.max(0, Math.round(usdMaxRaw)),
										PRICE_RANGE_MAX_USD,
									);
									updateFilter("priceRange", [
										filters.priceRange[0],
										usdMax,
									]);
								}}
								className="w-full disabled:opacity-50"
							/>
							<div className="flex justify-between text-xs text-gray-500">
								<span>
									{isLoading
										? "…"
										: formatPrice(0, userCurrency)}
								</span>
								<span>
									{isLoading
										? "…"
										: formatPrice(sliderValueDisplay, userCurrency)}
								</span>
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
	if (prevFilters.subCategory !== nextFilters.subCategory) return false;
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
	if (prevProps.onApply !== nextProps.onApply) return false;
	if (prevProps.hasPendingChanges !== nextProps.hasPendingChanges) return false;
	if (prevProps.onClearAll !== nextProps.onClearAll) return false;

	return true;
};

// Export memoized component
export const ProductFilters = React.memo(
	ProductFiltersComponent,
	productFiltersComparison,
);
