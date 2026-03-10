"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/shops/products/ProductGrid";
import { productRepository, collectionRepository } from "@/lib/firestore";
import { Product } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Loading component for Suspense
const ProductsLoading = () => (
	<div className="min-h-screen bg-white">
		<div className="container-responsive py-6 sm:py-8">
			<div className="mb-6 sm:mb-8">
				<div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
				<div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
			</div>
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
	</div>
);

// Main products component
const ProductsContent = () => {
	const searchParams = useSearchParams();
	const { t } = useLanguage();
	const [products, setProducts] = useState<Product[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [collectionName, setCollectionName] = useState<string | null>(null);

	// Pagination State - Cursor based with page tracking
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [pageCursors, setPageCursors] = useState<Map<number, any>>(new Map());
	const PAGE_SIZE = 20;

	useEffect(() => {
		// Reset pagination on params change
		setCurrentPage(1);
		setPageCursors(new Map());
		loadProducts(1, null);
	}, [searchParams]);

	const loadProducts = async (page: number, cursor: any) => {
		try {
			setIsLoading(true);
			setError(null);

			const collectionId = searchParams.get("collection");
			console.log(
				"ProductsPage: Loading products...",
				collectionId ? `for collection: ${collectionId}` : "all products",
				`page: ${page}`
			);

			// If collection parameter is present, load products from that collection
			if (collectionId) {
				try {
					const collection = await collectionRepository.getById(collectionId);
					if (!collection) {
						setError(t.productPage.collectionNotFound);
						return;
					}
					setCollectionName(collection.title || collection.name);
					const collectionProducts: Product[] = [];
					const productIds = collection.productIds || [];

					if (productIds.length === 0) {
						setError(t.productPage.noProductsInCollection);
						return;
					}

					// Pagination for collections
					const startIndex = (page - 1) * PAGE_SIZE;
					const endIndex = startIndex + PAGE_SIZE;
					const paginatedIds = productIds.slice(startIndex, endIndex);

					for (const productIdWithPrefix of paginatedIds) {
						let product: Product | null = null;
						let idToFetch = productIdWithPrefix;

						if (productIdWithPrefix.startsWith("marketplace:")) {
							idToFetch = productIdWithPrefix.replace("marketplace:", "");
							product = await productRepository.getByIdWithTailorInfo(idToFetch);
						} else if (productIdWithPrefix.startsWith("collection:")) {
							idToFetch = productIdWithPrefix.replace("collection:", "");
							const colProd = await collectionRepository.getCollectionProductById(
								idToFetch,
								collection.createdBy
							);
							if (colProd) {
								product = {
									product_id: colProd.id || idToFetch,
									title: colProd.title || "",
									price: { base: colProd.price || 0, currency: "USD" },
									images: colProd.images || [],
									tailor_id: colProd.owner?.email || "",
									vendor: {
										id: colProd.owner?.email || "",
										name: colProd.brandName || "Collection",
									},
								} as Product;
							}
						} else {
							product = await productRepository.getByIdWithTailorInfo(idToFetch);
						}

						if (product) collectionProducts.push(product);
					}

					if (collectionProducts.length === 0 && page === 1)
						setError(t.productPage.noProductsInCollection);
					
					setProducts(collectionProducts);
					setTotalCount(productIds.length);
					setTotalPages(Math.ceil(productIds.length / PAGE_SIZE));
					setCurrentPage(page);
				} catch (err) {
					console.error(err);
					setError(t.productPage.collectionLoadError);
				}
			} else {
				// Cursor-based pagination for "All Products"
				const result = await productRepository.getPaginatedProductsWithTailorInfo(
					PAGE_SIZE,
					cursor
				);
				
				setProducts(result.products);
				setTotalCount(result.totalCount);
				setTotalPages(Math.ceil(result.totalCount / PAGE_SIZE));
				setCurrentPage(page);
				
				// Store cursor for next page
				if (result.lastDoc) {
					setPageCursors(prev => {
						const newMap = new Map(prev);
						newMap.set(page + 1, result.lastDoc);
						return newMap;
					});
				}
			}
		} catch (error) {
			console.error("ProductsPage: Error loading products:", error);
			setError(t.productPage.loadError);
		} finally {
			setIsLoading(false);
		}
	};

	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || newPage > totalPages || newPage === currentPage || isLoading) return;
		
		// Get cursor for the target page
		const cursor = newPage > currentPage ? pageCursors.get(newPage) : null;
		loadProducts(newPage, cursor);
		
		// Scroll to top of products
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxVisible = 5;
		
		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			if (currentPage <= 3) {
				for (let i = 1; i <= 4; i++) pages.push(i);
				pages.push('...');
				pages.push(totalPages);
			} else if (currentPage >= totalPages - 2) {
				pages.push(1);
				pages.push('...');
				for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
			} else {
				pages.push(1);
				pages.push('...');
				pages.push(currentPage - 1);
				pages.push(currentPage);
				pages.push(currentPage + 1);
				pages.push('...');
				pages.push(totalPages);
			}
		}
		return pages;
	};

	if (error) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 text-lg mb-4">{error}</p>
					<button
						onClick={() => loadProducts(1, null)}
						className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
					>
						{t.productPage.tryAgain}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			{/* Luxury Header Section */}
			<div className="bg-white border-b border-gray-100">
				<div className="container-responsive py-8 lg:py-12">
					<div className="max-w-4xl mx-auto text-center">
						<h1 className="text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight text-gray-900 mb-4">
							{collectionName ? collectionName : t.productPage.allProducts}
						</h1>
						<p className="text-lg lg:text-xl text-gray-600 font-light leading-relaxed">
							{collectionName
								? t.productPage.browseCollection
								: t.productPage.browseAll}
						</p>
						
						{/* Product Count */}
						<div className="mt-4 text-sm text-gray-500">
							{totalCount > 0 && (
								<span>{totalCount} products</span>
							)}
						</div>
						
						{/* Decorative Divider */}
						<div className="flex items-center justify-center gap-3 mt-8">
							<div className="w-12 h-px bg-gray-300"></div>
							<div className="w-2 h-2 rounded-full bg-gray-400"></div>
							<div className="w-12 h-px bg-gray-300"></div>
						</div>
					</div>
				</div>
			</div>

			{/* Products Grid Section */}
			<div className="py-8 lg:py-12">
				<div className="container-responsive">
					<ProductGrid
						products={products}
						showFilters={!searchParams.get("collection")}
						totalItems={totalCount}
						isLoading={isLoading}
					/>
					
					{/* Beautiful Pagination */}
					{totalPages > 1 && (
						<div className="mt-12 flex flex-col items-center gap-4">
							{/* Page Info */}
							<div className="text-sm text-gray-500">
								Showing {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} products
							</div>
							
							{/* Pagination Controls */}
							<div className="flex items-center gap-2">
								{/* Previous Button */}
								<button
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage === 1 || isLoading}
									className={`flex items-center gap-1 px-4 py-2 rounded-lg border transition-all duration-200 ${
										currentPage === 1 || isLoading
											? 'border-gray-200 text-gray-300 cursor-not-allowed'
											: 'border-gray-300 text-gray-700  hover:border-black hover:text-black hover:bg-gray-50'
									}`}
								>
									<ChevronLeft className="w-4 h-4" />
									<span className="hidden sm:inline">Previous</span>
								</button>
								
								{/* Page Numbers */}
								<div className="flex items-center gap-1">
									{getPageNumbers().map((page, index) => (
										page === '...' ? (
											<span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
												...
											</span>
										) : (
											<button
												key={page}
												onClick={() => handlePageChange(page as number)}
												disabled={isLoading}
												className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all duration-200 ${
													currentPage === page
														? 'bg-black text-white shadow-lg'
														: 'border border-gray-300 text-gray-700 hover:border-black hover:text-black hover:bg-gray-50'
												}`}
											>
												{page}
											</button>
										)
									))}
								</div>
								
								{/* Next Button */}
								<button
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={currentPage === totalPages || isLoading}
									className={`flex items-center gap-1 px-4 py-2 rounded-lg border transition-all duration-200 ${
										currentPage === totalPages || isLoading
											? 'border-gray-200 text-gray-300 cursor-not-allowed'
											: 'border-gray-300 text-gray-700 hover:border-black hover:text-black hover:bg-gray-50'
									}`}
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

// Main export with Suspense wrapper
export default function ProductsPage() {
	return (
		<Suspense fallback={<ProductsLoading />}>
			<ProductsContent />
		</Suspense>
	);
}
