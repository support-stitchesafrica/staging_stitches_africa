"use client";

/**
 * Product Catalog Component for Storefront
 * Main component that displays vendor products in grid/list layout with filtering and sorting
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React, { useState, useEffect, useCallback } from "react";
import { Product } from "@/types";
import { ProductDisplayConfig, ThemeConfiguration } from "@/types/storefront";
import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";
import SearchAndFilterBar from "./SearchAndFilterBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStorefrontCart } from "@/contexts/StorefrontCartContext";
import {
	getVendorProducts,
	getVendorProductCategories,
	getVendorProductPriceRange,
	ProductFilters as IProductFilters,
	ProductSortOptions,
} from "@/lib/storefront/client-product-service";

interface ProductCatalogProps {
	vendorId: string;
	config: ProductDisplayConfig;
	onAddToCart?: (product: Product) => Promise<void>;
	className?: string;
	theme?: ThemeConfiguration;
}

export default function ProductCatalog({
	vendorId,
	config,
	onAddToCart,
	className = "",
	theme,
}: ProductCatalogProps) {
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<string[]>([]);
	const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
	const [filters, setFilters] = useState<IProductFilters>({});
	const [sort, setSort] = useState<ProductSortOptions>({
		field: "createdAt",
		direction: "desc",
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalProducts, setTotalProducts] = useState(0);
	const [viewLayout, setViewLayout] = useState<"grid" | "list">(
		config.layout === "list" ? "list" : "grid"
	);
	const [addingToCart, setAddingToCart] = useState<string | null>(null);
	const isMobile = useIsMobile();

	// Use storefront cart context with error handling
	let addToCart: any = null;
	try {
		const cartContext = useStorefrontCart();
		addToCart = cartContext.addItem;
	} catch (error) {
		console.warn(
			"ProductCatalog: StorefrontCartProvider not available, cart functionality disabled"
		);
	}

	// Adjust products per page for mobile
	const productsPerPage = isMobile
		? config.productsPerPage || 8
		: config.productsPerPage || 12;
	const totalPages = Math.ceil(totalProducts / productsPerPage);

	// Fetch products
	const fetchProducts = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const offset = (currentPage - 1) * productsPerPage;
			const result = await getVendorProducts(vendorId, {
				limit: productsPerPage,
				offset,
				filters,
				sort,
			});

			setProducts(result.products);
			setTotalProducts(result.total);
		} catch (err) {
			console.error("Error fetching products:", err);
			setError("Failed to load products. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [vendorId, currentPage, productsPerPage, filters, sort]);

	// Fetch filter options
	const fetchFilterOptions = useCallback(async () => {
		try {
			const [categoriesResult, priceRangeResult] = await Promise.all([
				getVendorProductCategories(vendorId),
				getVendorProductPriceRange(vendorId),
			]);

			setCategories(categoriesResult);
			setPriceRange(priceRangeResult);
		} catch (err) {
			console.error("Error fetching filter options:", err);
		}
	}, [vendorId]);

	// Initial load
	useEffect(() => {
		fetchFilterOptions();
	}, [fetchFilterOptions]);

	// Fetch products when dependencies change
	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	// Reset to first page when filters change
	const resetToFirstPage = useCallback(() => {
		if (currentPage !== 1) {
			setCurrentPage(1);
		}
	}, [currentPage]);

	const handleFiltersChange = (newFilters: IProductFilters) => {
		setFilters(newFilters);
		resetToFirstPage();
	};

	const handleSortChange = (newSort: ProductSortOptions) => {
		setSort(newSort);
		resetToFirstPage();
	};

	const handleAddToCart = async (product: Product) => {
		if (onAddToCart) {
			await onAddToCart(product);
		} else if (config.cartIntegration.enabled && addToCart) {
			// Use storefront cart integration
			try {
				setAddingToCart(product.product_id);
				await addToCart(product, 1);
				// You could add a success toast notification here
			} catch (error) {
				console.error("Error adding to cart:", error);
				// You could add an error toast notification here
			} finally {
				setAddingToCart(null);
			}
		} else {
			// Default behavior: redirect to main Stitches Africa product page
			window.open(`/shops/products/${product.product_id}`, "_blank");
		}
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		// Scroll to top of catalog
		document
			.getElementById("product-catalog")
			?.scrollIntoView({ behavior: "smooth" });
	};

	if (error) {
		return (
			<div className={`text-center py-12 ${className}`}>
				<div className="text-red-600 mb-4">
					<svg
						className="w-12 h-12 mx-auto mb-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p className="text-lg font-medium">{error}</p>
				</div>
				<button
					onClick={fetchProducts}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
				>
					Try Again
				</button>
			</div>
		);
	}

	return (
		<div id="product-catalog" className={`space-y-6 ${className}`}>
			{/* Search and Filter Bar */}
			{config.showFilters && (
				<SearchAndFilterBar
					categories={categories}
					priceRange={priceRange}
					filters={filters}
					sort={sort}
					onFiltersChange={handleFiltersChange}
					onSortChange={handleSortChange}
				/>
			)}
			{/* Layout Toggle and Controls */}
			<div
				className={`flex items-center justify-between ${
					isMobile ? "flex-col gap-3" : ""
				}`}
			>
				<div className="text-sm text-gray-600">
					{loading
						? "Loading products..."
						: `Showing ${products.length} of ${totalProducts} products`}
				</div>

				<div
					className={`flex items-center gap-4 ${
						isMobile ? "w-full justify-between" : ""
					}`}
				>
					{/* Layout Toggle Buttons */}
					{config.layout !== "carousel" && !isMobile && (
						<div className="flex items-center gap-1 border border-gray-300 rounded-md p-1">
							<button
								onClick={() => setViewLayout("grid")}
								className={`p-2 rounded transition-colors duration-200 ${
									viewLayout === "grid"
										? "bg-blue-600 text-white"
										: "text-gray-600 hover:bg-gray-100"
								}`}
								title="Grid view"
							>
								<svg
									className="w-4 h-4"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
								</svg>
							</button>
							<button
								onClick={() => setViewLayout("list")}
								className={`p-2 rounded transition-colors duration-200 ${
									viewLayout === "list"
										? "bg-blue-600 text-white"
										: "text-gray-600 hover:bg-gray-100"
								}`}
								title="List view"
							>
								<svg
									className="w-4 h-4"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
										clipRule="evenodd"
									/>
								</svg>
							</button>
						</div>
					)}
				</div>
			</div>
			{/* Products Grid/List */}
			{loading ? (
				<div
					className={`grid gap-4 ${
						isMobile
							? "grid-cols-2"
							: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
					}`}
				>
					{Array.from({ length: productsPerPage }).map((_, index) => (
						<div
							key={index}
							className="bg-gray-200 animate-pulse rounded-lg aspect-square"
						></div>
					))}
				</div>
			) : products.length === 0 ? (
				<div className="text-center py-12">
					<svg
						className="w-16 h-16 mx-auto mb-4 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
						/>
					</svg>
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						No products found
					</h3>
					<p className="text-gray-600 mb-4">
						{Object.keys(filters).length > 0
							? "Try adjusting your filters to see more products."
							: "This store doesn't have any products yet."}
					</p>
					{Object.keys(filters).length > 0 && (
						<button
							onClick={() => setFilters({})}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
						>
							Clear Filters
						</button>
					)}
				</div>
			) : (
				<>
					{/* Products */}
					<div
						className={
							config.layout === "carousel"
								? "flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
								: viewLayout === "list"
								? "space-y-4"
								: isMobile
								? "grid grid-cols-2 gap-3"
								: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
						}
					>
						{products.map((product) => (
							<ProductCard
								key={product.product_id}
								product={product}
								layout={
									config.layout === "carousel"
										? "grid"
										: isMobile
										? "grid"
										: viewLayout
								}
								showAddToCart={config.cartIntegration.enabled}
								onAddToCart={handleAddToCart}
								className={
									config.layout === "carousel"
										? "flex-shrink-0 w-64 snap-center"
										: ""
								}
								isMobile={isMobile}
								isLoading={addingToCart === product.product_id}
								theme={theme}
							/>
						))}
					</div>

					{/* Pagination */}
					{totalPages > 1 && config.layout !== "carousel" && (
						<div
							className={`flex items-center justify-center gap-2 mt-8 ${
								isMobile ? "px-4" : ""
							}`}
						>
							<button
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1}
								className={`px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
									isMobile ? "min-w-[80px]" : ""
								}`}
							>
								{isMobile ? "Prev" : "Previous"}
							</button>

							{/* Show fewer page numbers on mobile */}
							{Array.from(
								{ length: Math.min(isMobile ? 3 : 5, totalPages) },
								(_, i) => {
									let pageNum;
									const maxPages = isMobile ? 3 : 5;
									if (totalPages <= maxPages) {
										pageNum = i + 1;
									} else if (currentPage <= Math.floor(maxPages / 2) + 1) {
										pageNum = i + 1;
									} else if (
										currentPage >=
										totalPages - Math.floor(maxPages / 2)
									) {
										pageNum = totalPages - maxPages + 1 + i;
									} else {
										pageNum = currentPage - Math.floor(maxPages / 2) + i;
									}

									return (
										<button
											key={pageNum}
											onClick={() => handlePageChange(pageNum)}
											className={`px-3 py-2 text-sm border rounded-md ${
												isMobile ? "min-w-[40px]" : ""
											} ${
												currentPage === pageNum
													? "bg-blue-600 text-white border-blue-600"
													: "border-gray-300 hover:bg-gray-50"
											}`}
										>
											{pageNum}
										</button>
									);
								}
							)}

							<button
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={currentPage === totalPages}
								className={`px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
									isMobile ? "min-w-[80px]" : ""
								}`}
							>
								{isMobile ? "Next" : "Next"}
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
