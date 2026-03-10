"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { ProductFilters } from "./ProductFilters";
import {
	parseUrlFilters,
	applyAllFilters,
	FilterState,
} from "@/lib/utils/filter-utils";

interface ProductGridProps {
	products: Product[];
	showFilters?: boolean;
	totalItems?: number;
	isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
	products,
	showFilters = true,
	totalItems,
	isLoading = false,
}) => {
	const searchParams = useSearchParams();
	const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());

	// Filter states - initialize from URL parameters
	const [filters, setFilters] = useState<FilterState>(() =>
		parseUrlFilters(searchParams)
	);

	// Update filters when URL parameters change
	useEffect(() => {
		setFilters(parseUrlFilters(searchParams));
	}, [searchParams]);

	// Apply filters to products - TEMPORARILY DISABLED FOR DEBUGGING
	const filteredProducts = useMemo(() => {
		console.log("ProductGrid: Received", products?.length, "products");
		if (!products || products.length === 0) return [];
		
		// Skip filtering for now - just return all products
		// This ensures we see all products regardless of filters
		return products;
		
		/* Original filtering code - re-enable after debugging
		const normalized = products.map((p) => ({
			...p,
			vendorName: p.vendor?.name || (p as any).vendorName || "",
			vendorId: p.vendor?.id || (p as any).vendorId || p.tailor_id || "",
		}));
		
		const result = applyAllFilters(normalized, filters);
		console.log("ProductGrid: After filtering:", result.length, "products");
		return result;
		*/
	}, [products]);

	const handleWishlistToggle = (productId: string) => {
		setWishlistItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(productId)) {
				newSet.delete(productId);
			} else {
				newSet.add(productId);
			}
			return newSet;
		});
	};

	// Show loading skeleton when parent is loading
	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				{showFilters && (
					<div className="mb-6">
						<div className="h-10 bg-gray-200 rounded animate-pulse w-full max-w-md"></div>
					</div>
				)}
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
					{Array.from({ length: 20 }).map((_, index) => (
						<div key={index} className="animate-pulse">
							<div className="bg-gray-200 aspect-[3/4] rounded-lg mb-4"></div>
							<div className="space-y-2">
								<div className="h-4 bg-gray-200 rounded w-3/4"></div>
								<div className="h-3 bg-gray-200 rounded w-1/2"></div>
								<div className="h-4 bg-gray-200 rounded w-1/4"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	// Show empty state
	if (!products || products.length === 0) {
		return (
			<div className="container mx-auto px-4 py-8">
				{showFilters && (
					<ProductFilters
						filters={filters}
						onFiltersChange={setFilters}
						products={[]}
						resultCount={0}
					/>
				)}
				<div className="text-center py-12">
					<p className="text-gray-500 text-lg">No products found.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			{showFilters && (
				<ProductFilters
					filters={filters}
					onFiltersChange={setFilters}
					products={products}
					resultCount={filteredProducts.length}
				/>
			)}

			{filteredProducts.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 text-lg">
						No products found matching your criteria.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
					{filteredProducts.map((product) => (
						<ProductCard
							key={product.product_id}
							product={product}
							onWishlistToggle={handleWishlistToggle}
							isInWishlist={wishlistItems.has(product.product_id)}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default ProductGrid;
