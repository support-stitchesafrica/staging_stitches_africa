"use client";

/**
 * Modern Product Filters Component for Storefront
 * Provides filtering and sorting options for product catalog with modern design
 *
 * Validates: Requirements 7.1, 7.2
 */

import React, { useState, useEffect } from "react";
import {
	ProductFilters as IProductFilters,
	ProductSortOptions,
} from "@/lib/storefront/client-product-service";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductFiltersProps {
	categories: string[];
	priceRange: { min: number; max: number };
	filters: IProductFilters;
	sort: ProductSortOptions;
	onFiltersChange: (filters: IProductFilters) => void;
	onSortChange: (sort: ProductSortOptions) => void;
	className?: string;
	hideSearch?: boolean;
	hideHeader?: boolean;
}

export default function ProductFilters({
	categories,
	priceRange,
	filters,
	sort,
	onFiltersChange,
	onSortChange,
	className = "",
	hideSearch = false,
	hideHeader = false,
}: ProductFiltersProps) {
	const [localFilters, setLocalFilters] = useState<IProductFilters>(filters);
	const [showFilters, setShowFilters] = useState(false);
	const isMobile = useIsMobile();

	// Update local filters when props change
	useEffect(() => {
		setLocalFilters(filters);
	}, [filters]);

	const handleFilterChange = (key: keyof IProductFilters, value: any) => {
		const newFilters = { ...localFilters, [key]: value };
		setLocalFilters(newFilters);
		onFiltersChange(newFilters);
	};

	const handlePriceRangeChange = (min: number, max: number) => {
		const newFilters = {
			...localFilters,
			priceRange: { min, max },
		};
		setLocalFilters(newFilters);
		onFiltersChange(newFilters);
	};

	const clearFilters = () => {
		const clearedFilters: IProductFilters = {};
		setLocalFilters(clearedFilters);
		onFiltersChange(clearedFilters);
	};

	const hasActiveFilters = Object.keys(localFilters).some((key) => {
		const value = localFilters[key as keyof IProductFilters];
		return value !== undefined && value !== null && value !== "";
	});

	const activeFilterCount = Object.keys(localFilters).filter((key) => {
		const value = localFilters[key as keyof IProductFilters];
		return value !== undefined && value !== null && value !== "";
	}).length;

	return (
		<div
			className={`bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden ${className}`}
		>
			{/* Mobile Filter Toggle */}
			{isMobile && !hideHeader && (
				<div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
					<button
						onClick={() => setShowFilters(!showFilters)}
						className="flex items-center justify-between w-full text-left group"
					>
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
								<svg
									className="w-5 h-5 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
									/>
								</svg>
							</div>
							<div>
								<span className="font-semibold text-gray-900">
									Filters & Sort
								</span>
								{hasActiveFilters && (
									<div className="flex items-center gap-2 mt-1">
										<span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-medium">
											{activeFilterCount} active
										</span>
									</div>
								)}
							</div>
						</div>
						<div className="p-1 rounded-lg group-hover:bg-gray-100 transition-colors">
							<svg
								className={`w-5 h-5 text-gray-600 transform transition-transform duration-200 ${
									showFilters ? "rotate-180" : ""
								}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</div>
					</button>
				</div>
			)}

			{/* Filters Content */}
			<div
				className={`${
					isMobile && !hideHeader ? (showFilters ? "block" : "hidden") : "block"
				} p-6 space-y-6`}
			>
				{/* Search */}
				{!hideSearch && (
					<div className="space-y-3">
						<label className="flex items-center gap-2 font-semibold text-gray-900">
							<svg
								className="w-4 h-4 text-gray-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
							Search Products
						</label>
						<div className="relative">
							<input
								type="text"
								value={localFilters.search || ""}
								onChange={(e) => handleFilterChange("search", e.target.value)}
								placeholder="Search by name, description, or tags..."
								className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
							/>
							<svg
								className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</div>
					</div>
				)}

				{/* Sort */}
				<div className="space-y-3">
					<label className="flex items-center gap-2 font-semibold text-gray-900">
						<svg
							className="w-4 h-4 text-gray-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
							/>
						</svg>
						Sort By
					</label>
					<select
						value={`${sort.field}-${sort.direction}`}
						onChange={(e) => {
							const [field, direction] = e.target.value.split("-");
							onSortChange({
								field: field as ProductSortOptions["field"],
								direction: direction as ProductSortOptions["direction"],
							});
						}}
						className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
							backgroundPosition: "right 0.5rem center",
							backgroundRepeat: "no-repeat",
							backgroundSize: "1.5em 1.5em",
						}}
					>
						<option value="createdAt-desc">✨ Newest First</option>
						<option value="createdAt-asc">🕐 Oldest First</option>
						<option value="title-asc">🔤 Name A-Z</option>
						<option value="title-desc">🔤 Name Z-A</option>
						<option value="price-asc">💰 Price Low to High</option>
						<option value="price-desc">💰 Price High to Low</option>
						<option value="featured-desc">⭐ Featured First</option>
					</select>
				</div>

				{/* Category and Availability Filters */}
				<div className="grid gap-6 md:grid-cols-2">
					{/* Category Filter */}
					{categories.length > 0 && (
						<div className="space-y-3">
							<label className="flex items-center gap-2 font-semibold text-gray-900">
								<svg
									className="w-4 h-4 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
									/>
								</svg>
								Category
							</label>
							<select
								value={localFilters.category || ""}
								onChange={(e) =>
									handleFilterChange("category", e.target.value || undefined)
								}
								className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
								style={{
									backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
									backgroundPosition: "right 0.5rem center",
									backgroundRepeat: "no-repeat",
									backgroundSize: "1.5em 1.5em",
								}}
							>
								<option value="">All Categories</option>
								{categories.map((category) => (
									<option key={category} value={category}>
										{category}
									</option>
								))}
							</select>
						</div>
					)}

					{/* Availability Filter */}
					<div className="space-y-3">
						<label className="flex items-center gap-2 font-semibold text-gray-900">
							<svg
								className="w-4 h-4 text-gray-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
							Availability
						</label>
						<select
							value={localFilters.availability || ""}
							onChange={(e) =>
								handleFilterChange("availability", e.target.value || undefined)
							}
							className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
							style={{
								backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
								backgroundPosition: "right 0.5rem center",
								backgroundRepeat: "no-repeat",
								backgroundSize: "1.5em 1.5em",
							}}
						>
							<option value="">All Items</option>
							<option value="in_stock">✅ In Stock</option>
							<option value="pre_order">📅 Pre-Order</option>
							<option value="out_of_stock">❌ Out of Stock</option>
						</select>
					</div>
				</div>

				{/* Price Range Filter */}
				{priceRange.max > 0 && (
					<div className="space-y-3">
						<label className="flex items-center gap-2 font-semibold text-gray-900">
							<svg
								className="w-4 h-4 text-gray-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
								/>
							</svg>
							Price Range
						</label>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-3">
								<div className="relative">
									<input
										type="number"
										value={localFilters.priceRange?.min || priceRange.min}
										onChange={(e) =>
											handlePriceRangeChange(
												parseInt(e.target.value) || priceRange.min,
												localFilters.priceRange?.max || priceRange.max
											)
										}
										placeholder="Min"
										className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
									/>
									<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
										$
									</span>
								</div>
								<div className="relative">
									<input
										type="number"
										value={localFilters.priceRange?.max || priceRange.max}
										onChange={(e) =>
											handlePriceRangeChange(
												localFilters.priceRange?.min || priceRange.min,
												parseInt(e.target.value) || priceRange.max
											)
										}
										placeholder="Max"
										className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
									/>
									<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
										$
									</span>
								</div>
							</div>
							<div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
								<span>Range: ${priceRange.min.toLocaleString()}</span>
								<span>-</span>
								<span>${priceRange.max.toLocaleString()}</span>
							</div>
						</div>
					</div>
				)}

				{/* Clear Filters */}
				{hasActiveFilters && (
					<div className="pt-4 border-t border-gray-100">
						<button
							onClick={clearFilters}
							className="w-full px-4 py-3 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Clear All Filters ({activeFilterCount})
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
