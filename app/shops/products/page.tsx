"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/shops/products/ProductCard";
import { ProductFilters } from "@/components/shops/products/ProductFilters";
import { productRepository, collectionRepository } from "@/lib/firestore";
import { Product } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import
	{
		parseUrlFilters,
		applyAllFilters,
		FilterState,
		createDefaultFilterState,
	} from "@/lib/utils/filter-utils";

const PAGE_SIZE = 20;

const ProductsLoading = () => (
	<div className="min-h-screen bg-white">
		<div className="container-responsive py-6 sm:py-8">
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
				{Array.from({ length: 20 }).map((_, i) => (
					<div key={i} className="animate-pulse">
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
	</div>
);

const ProductsContent = () =>
{
	const searchParams = useSearchParams();
	const { t } = useLanguage();

	// All verified storefront listings from Firestore (used for client-side filters + UI pagination)
	const [allProducts, setAllProducts] = useState<Product[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [collectionName, setCollectionName] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Applied filters (grid + URL sync); draft = in-progress UI until Apply
	const [filters, setFilters] = useState<FilterState>(() =>
		parseUrlFilters(searchParams)
	);
	const [draftFilters, setDraftFilters] = useState<FilterState>(() =>
		parseUrlFilters(searchParams)
	);

	// Pagination (client-side over filtered products)
	const [currentPage, setCurrentPage] = useState(1);

	// Apply client-side filters to the loaded products
	const filteredProducts = React.useMemo(
		() => applyAllFilters(allProducts, filters),
		[allProducts, filters]
	);

	const draftFilteredCount = React.useMemo(
		() => applyAllFilters(allProducts, draftFilters).length,
		[allProducts, draftFilters]
	);

	const hasPendingFilterChanges = React.useMemo(
		() => JSON.stringify(filters) !== JSON.stringify(draftFilters),
		[filters, draftFilters]
	);

	const handleApplyFilters = useCallback(() =>
	{
		setFilters(draftFilters);
		setCurrentPage(1);
	}, [draftFilters]);

	const handleClearAllFilters = useCallback(() =>
	{
		const d = createDefaultFilterState();
		setDraftFilters(d);
		setFilters(d);
		setCurrentPage(1);
	}, []);

	// Paginate the filtered results
	const paginatedProducts = React.useMemo(() =>
	{
		const start = (currentPage - 1) * PAGE_SIZE;
		return filteredProducts.slice(start, start + PAGE_SIZE);
	}, [filteredProducts, currentPage]);

	const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);

	// Reset to page 1 when filters change
	useEffect(() =>
	{
		setCurrentPage(1);
	}, [filters]);

	// Sync filters from URL params
	useEffect(() =>
	{
		const f = parseUrlFilters(searchParams);
		setFilters(f);
		setDraftFilters(f);
	}, [searchParams]);

	const loadProducts = useCallback(async () =>
	{
		try
		{
			setIsLoading(true);
			setError(null);

			const collectionId = searchParams.get("collection");

			if (collectionId)
			{
				const col = await collectionRepository.getById(collectionId);
				if (!col) { setError(t.productPage.collectionNotFound); return; }
				setCollectionName(col.title || col.name);

				const productIds = col.productIds || [];
				if (productIds.length === 0) { setError(t.productPage.noProductsInCollection); return; }

				const fetched: Product[] = [];
				for (const idWithPrefix of productIds)
				{
					let product: Product | null = null;
					if (idWithPrefix.startsWith("marketplace:"))
					{
						product = await productRepository.getByIdWithTailorInfo(idWithPrefix.replace("marketplace:", ""));
					} else if (idWithPrefix.startsWith("collection:"))
					{
						const colProd = await collectionRepository.getCollectionProductById(
							idWithPrefix.replace("collection:", ""), col.createdBy
						);
						if (colProd)
						{
							product = {
								product_id: colProd.id || idWithPrefix,
								title: colProd.title || "",
								price: { base: colProd.price || 0, currency: "USD" },
								images: colProd.images || [],
								tailor_id: colProd.owner?.email || "",
								vendor: { id: colProd.owner?.email || "", name: colProd.brandName || "Collection" },
							} as Product;
						}
					} else
					{
						product = await productRepository.getByIdWithTailorInfo(idWithPrefix);
					}
					if (product) fetched.push(product);
				}

				setAllProducts(fetched);
			} else
			{
				// Paginate until exhausted so wear_category / subcategory filters apply to the full storefront catalog,
				// not only the first ~100 verified rows.
				const products = await productRepository.getVerifiedShopListingProducts();
				setAllProducts(products);
			}
		} catch (err)
		{
			console.error("ProductsPage: Error loading products:", err);
			setError(t.productPage.loadError);
		} finally
		{
			setIsLoading(false);
		}
	}, [searchParams, t]);

	// Initial load
	useEffect(() =>
	{
		setCurrentPage(1);
		void loadProducts();
	}, [loadProducts]);

	const handlePageChange = (newPage: number) =>
	{
		if (newPage < 1 || newPage > totalPages || newPage === currentPage || isLoading) return;
		setCurrentPage(newPage);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const getPageNumbers = (): (number | string)[] =>
	{
		const pages: (number | string)[] = [];
		if (totalPages <= 5)
		{
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else if (currentPage <= 3)
		{
			pages.push(1, 2, 3, 4, "...", totalPages);
		} else if (currentPage >= totalPages - 2)
		{
			pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
		} else
		{
			pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
		}
		return pages;
	};

	if (error)
	{
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 text-lg mb-4">{error}</p>
					<button onClick={() => void loadProducts()} className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800">
						{t.productPage.tryAgain}
					</button>
				</div>
			</div>
		);
	}

	const showFilters = !searchParams.get("collection");

	/** Mirrors active category filter (URL + UI), not only the raw query string */
	const categoryForTitle = filters.category?.toLowerCase().trim() ?? "";
	const subForTitle = filters.subCategory?.trim() ?? "";
	const pageTitle = collectionName
		? collectionName
		: categoryForTitle === "women"
			? "For Women"
			: categoryForTitle === "men"
				? "For Men"
				: subForTitle && subForTitle.toLowerCase() !== "all"
					? subForTitle
					: t.productPage.allProducts;

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			{/* Header */}
			<div className="bg-white border-b border-gray-100">
				<div className="container-responsive py-8 lg:py-12">
					<div className="max-w-4xl mx-auto text-center">
						<h1 className="text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight text-gray-900 mb-4">
							{pageTitle}
						</h1>
						<p className="text-lg lg:text-xl text-gray-600 font-light leading-relaxed">
							{collectionName ? t.productPage.browseCollection : t.productPage.browseAll}
						</p>
						<div className="mt-4 text-sm text-gray-500">
							{filteredProducts.length > 0 && <span>{filteredProducts.length} products</span>}
						</div>
						<div className="flex items-center justify-center gap-3 mt-8">
							<div className="w-12 h-px bg-gray-300"></div>
							<div className="w-2 h-2 rounded-full bg-gray-400"></div>
							<div className="w-12 h-px bg-gray-300"></div>
						</div>
					</div>
				</div>
			</div>

			{/* Products */}
			<div className="py-8 lg:py-12">
				<div className="container-responsive">
					{/* Filters */}
					{showFilters && (
						<ProductFilters
							filters={draftFilters}
							onFiltersChange={setDraftFilters}
							onApply={handleApplyFilters}
							hasPendingChanges={hasPendingFilterChanges}
							onClearAll={handleClearAllFilters}
							products={allProducts}
							resultCount={draftFilteredCount}
						/>
					)}

					{/* Grid */}
					{isLoading ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
							{Array.from({ length: PAGE_SIZE }).map((_, i) => (
								<div key={i} className="animate-pulse">
									<div className="bg-gray-200 aspect-[3/4] rounded-lg mb-4"></div>
									<div className="space-y-2">
										<div className="h-4 bg-gray-200 rounded w-3/4"></div>
										<div className="h-3 bg-gray-200 rounded w-1/2"></div>
									</div>
								</div>
							))}
						</div>
					) : paginatedProducts.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500 text-lg">No products found matching your criteria.</p>
						</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
							{paginatedProducts.map((product) => (
								<ProductCard key={product.product_id} product={product} />
							))}
						</div>
					)}

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="mt-12 flex flex-col items-center gap-4">
							<div className="text-sm text-gray-500">
								Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length} products
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage === 1 || isLoading}
									className={`flex items-center gap-1 px-4 py-2 rounded-lg border transition-all duration-200 ${currentPage === 1 || isLoading ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:border-black hover:text-black hover:bg-gray-50"}`}
								>
									<ChevronLeft className="w-4 h-4" />
									<span className="hidden sm:inline">Previous</span>
								</button>

								<div className="flex items-center gap-1">
									{getPageNumbers().map((page, idx) =>
										page === "..." ? (
											<span key={`e-${idx}`} className="px-3 py-2 text-gray-400">...</span>
										) : (
											<button
												key={page}
												onClick={() => handlePageChange(page as number)}
												disabled={isLoading}
												className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all duration-200 ${currentPage === page ? "bg-black text-white shadow-lg" : "border border-gray-300 text-gray-700 hover:border-black hover:text-black hover:bg-gray-50"}`}
											>
												{page}
											</button>
										)
									)}
								</div>

								<button
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={currentPage === totalPages || isLoading}
									className={`flex items-center gap-1 px-4 py-2 rounded-lg border transition-all duration-200 ${currentPage === totalPages || isLoading ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:border-black hover:text-black hover:bg-gray-50"}`}
								>
									<span className="hidden sm:inline">Next</span>
									<ChevronRight className="w-4 h-4" />
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default function ProductsPage()
{
	return (
		<Suspense fallback={<ProductsLoading />}>
			<ProductsContent />
		</Suspense>
	);
}
