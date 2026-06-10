"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
	Search,
	Clock,
	X,
	TrendingUp,
	SlidersHorizontal,
	ArrowLeft,
	Grid3x3,
	List as ListIcon,
	ArrowDownUp,
} from "lucide-react";
import {
	SearchService,
	SearchResult,
	SearchHistory,
	SearchFilters,
} from "@/lib/search-service";
import {
	generateBlurDataURL,
	RESPONSIVE_SIZES,
	IMAGE_DIMENSIONS,
} from "@/lib/utils/image-utils";
import { SafeImage } from "@/components/shops/ui/SafeImage";
import { useAuth } from "@/contexts/AuthContext";
import { getActivityTracker } from "@/lib/analytics/activity-tracker";
import { calculateCustomerPrice } from "@/lib/priceUtils";
import { Price } from "@/components/common/Price";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function SearchPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialQuery = searchParams.get("q") || "";
	const { user } = useAuth();
	const { userCountry } = useCurrency();
	const { t } = useLanguage();

	const [query, setQuery] = useState(initialQuery);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [history, setHistory] = useState<SearchHistory[]>([]);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [bottomSheet, setBottomSheet] = useState<"none" | "filter" | "sort">(
		"none",
	);
	const [sortBy, setSortBy] = useState<
		"relevance" | "price_asc" | "price_desc" | "title_asc"
	>("relevance");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [filters, setFilters] = useState<SearchFilters>({});

	const priceBase = useCallback((product: SearchResult) => {
		if (typeof product.price === "number") return product.price;
		return product.price?.base ?? 0;
	}, []);

	const displayedResults = useMemo(() => {
		const list = [...results];
		switch (sortBy) {
			case "price_asc":
				return list.sort((a, b) => priceBase(a) - priceBase(b));
			case "price_desc":
				return list.sort((a, b) => priceBase(b) - priceBase(a));
			case "title_asc":
				return list.sort((a, b) =>
					a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
				);
			default:
				return list;
		}
	}, [results, sortBy, priceBase]);

	// Load search history on mount
	useEffect(() => {
		setHistory(SearchService.getSearchHistory());
	}, []);

	// Keep input in sync when navigating from Header / MobileSearchModal (?q= changes)
	useEffect(() => {
		setQuery(initialQuery);
	}, [initialQuery]);

	// Perform search when URL q= changes
	useEffect(() => {
		if (initialQuery) {
			performSearch(initialQuery);
		}
	}, [initialQuery]);

	// Update suggestions when query changes
	useEffect(() => {
		const getSuggestions = async () => {
			if (query.length >= 2) {
				const newSuggestions = await SearchService.getSearchSuggestions(query);
				setSuggestions(newSuggestions);
			} else {
				setSuggestions([]);
			}
		};

		getSuggestions();
	}, [query]);

	const performSearch = useCallback(
		async (searchQuery: string) => {
			if (!searchQuery.trim()) {
				setResults([]);
				return;
			}

			setIsLoading(true);
			setShowSuggestions(false);
			console.log(
				"Performing search for:",
				searchQuery,
				"with filters:",
				filters,
			);

			try {
				const searchResults = await SearchService.searchProducts(
					searchQuery,
					filters,
				);
				console.log("Search completed. Results:", searchResults.length);
				setResults(searchResults);

				// Track search activity for vendor analytics
				// Validates: Requirements 21.5
				const activityTracker = getActivityTracker();
				activityTracker
					.trackSearch(searchQuery, searchResults.length, user?.uid)
					.catch((err) =>
						console.warn("Could not track search for analytics:", err),
					);

				// Update URL
				const params = new URLSearchParams();
				params.set("q", searchQuery);
				router.push(`/shops/search?${params.toString()}`, { scroll: false });

				// Refresh history
				setHistory(SearchService.getSearchHistory());
			} catch (error) {
				console.error("Search failed:", error);
				setResults([]);
			} finally {
				setIsLoading(false);
			}
		},
		[filters, router, user],
	);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (query.trim()) {
			performSearch(query.trim());
		}
	};

	const handleSuggestionClick = (suggestion: string) => {
		setQuery(suggestion);
		performSearch(suggestion);
	};

	const handleHistoryClick = (historyItem: SearchHistory) => {
		setQuery(historyItem.query);
		performSearch(historyItem.query);
	};

	const removeFromHistory = (searchId: string) => {
		SearchService.removeSearchFromHistory(searchId);
		setHistory(SearchService.getSearchHistory());
	};

	const clearAllHistory = () => {
		SearchService.clearSearchHistory();
		setHistory([]);
	};

	const popularSearches = SearchService.getPopularSearches();
	const categories = SearchService.getSearchCategories();

	const sortOptions: {
		id: "relevance" | "price_asc" | "price_desc" | "title_asc";
		label: string;
	}[] = [
		{ id: "relevance", label: t.collectionGrid.defaultSort },
		{ id: "price_asc", label: t.collectionGrid.priceAsc },
		{ id: "price_desc", label: t.collectionGrid.priceDesc },
		{ id: "title_asc", label: t.collectionGrid.nameAsc },
	];

	const renderFilterForm = () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<div>
					<label className="mb-1 block text-sm font-medium text-gray-700">
						{t.search.productType}
					</label>
					<select
						value={filters.productType || ""}
						onChange={(e) =>
							setFilters({
								...filters,
								productType: e.target.value || undefined,
							})
						}
						className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">{t.search.allTypes}</option>
						<option value="ready-to-wear">Ready-to-Wear</option>
						<option value="bespoke">Bespoke</option>
					</select>
				</div>

				<div>
					<label className="mb-1 block text-sm font-medium text-gray-700">
						{t.search.category}
					</label>
					<select
						value={filters.category || ""}
						onChange={(e) =>
							setFilters({
								...filters,
								category: e.target.value || undefined,
							})
						}
						className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">{t.search.allCategories}</option>
						{categories.map((category: any) => (
							<option key={category.id} value={category.id}>
								{category.name}
							</option>
						))}
					</select>
				</div>

				<div className="sm:col-span-2">
					<label className="mb-1 block text-sm font-medium text-gray-700">
						{t.search.subCategory}
					</label>
					<input
						type="text"
						value={filters.wear_category ?? ""}
						onChange={(e) =>
							setFilters({
								...filters,
								wear_category: e.target.value || undefined,
							})
						}
						className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder={t.search.subCategoryPlaceholder}
					/>
				</div>

				<div>
					<label className="mb-1 block text-sm font-medium text-gray-700">
						{t.search.minPrice}
					</label>
					<input
						type="number"
						value={filters.minPrice ?? ""}
						onChange={(e) =>
							setFilters({
								...filters,
								minPrice: e.target.value
									? Number(e.target.value)
									: undefined,
							})
						}
						className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="0"
					/>
				</div>

				<div>
					<label className="mb-1 block text-sm font-medium text-gray-700">
						{t.search.maxPrice}
					</label>
					<input
						type="number"
						value={filters.maxPrice ?? ""}
						onChange={(e) =>
							setFilters({
								...filters,
								maxPrice: e.target.value
									? Number(e.target.value)
									: undefined,
							})
						}
						className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="1000"
					/>
				</div>
			</div>

			<div className="flex justify-end gap-3 pt-2">
				<button
					type="button"
					onClick={() => {
						setFilters({});
						if (query) performSearch(query);
					}}
					className="rounded-lg border border-gray-300 px-6 py-2.5 text-gray-600 transition-colors hover:bg-gray-50"
				>
					{t.search.clearFilters}
				</button>
				<button
					type="button"
					onClick={() => {
						if (query) performSearch(query.trim());
						setBottomSheet("none");
					}}
					className="rounded-lg bg-blue-600 px-6 py-2.5 text-white shadow-sm transition-colors hover:bg-blue-700"
				>
					{t.search.applyFilters}
				</button>
			</div>
		</div>
	);

	const renderSortForm = () => (
		<div className="space-y-2">
			{sortOptions.map((opt) => (
				<button
					key={opt.id}
					type="button"
					onClick={() => {
						setSortBy(opt.id);
						setBottomSheet("none");
					}}
					className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
						sortBy === opt.id
							? "border-blue-600 bg-blue-50 text-blue-900"
							: "border-gray-200 text-gray-800 hover:bg-gray-50"
					}`}
				>
					{opt.label}
					{sortBy === opt.id && (
						<span className="text-xs font-semibold text-blue-600">✓</span>
					)}
				</button>
			))}
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Page header area (search field when uncommented) — scrolls away */}
			{/* <div className="container mx-auto px-4">
				<div className="flex items-end space-x-4">
					<button
							onClick={() => router.back()}
							className="p-2 hover:bg-white/50 rounded-lg transition-colors"
						>
							<ArrowLeft size={20} />
						</button> 
					
						<div className="flex-1 relative">
							<form onSubmit={handleSearch}>
								<input
									type="text"
									placeholder="Search by brand, product type, or title..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
								{query && (
									<button
										type="button"
										onClick={() => setQuery('')}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
									>
										<X className="w-5 h-5" />
									</button>
								)}
							</form>
						</div>
				</div>
			</div> */}

			{/* Sticky below global Header only (top/z); your visual design unchanged */}
			<div className="sticky top-14 z-30 lg:top-[5.75rem] bg-white">
				<div className="container mx-auto px-4">
					<div className="flex w-full justify-start">
						<div className="flex w-full items-stretch border-b border-b-gray-300 border-t border-t-gray-500 p-1">
						<div
							onClick={() => {
								setShowSuggestions(false);
								setBottomSheet((prev) =>
									prev === "filter" ? "none" : "filter",
								);
							}}
							className={`flex min-h-11 flex-1 items-center justify-center gap-2 border-r border-r-gray-300 px-3 py-2 text-sm font-medium lg:flex-none lg:px-5 ${
								bottomSheet === "filter"
									? "bg-black text-white shadow-sm"
									: "text-gray-700 hover:bg-gray-100"
							}`}
						>
							<SlidersHorizontal className="h-4 w-4 shrink-0" />
							<span className="truncate">Filter</span>
						</div>
						<div
							onClick={() => {
								setShowSuggestions(false);
								setBottomSheet((prev) =>
									prev === "sort" ? "none" : "sort",
								);
							}}
							className={`flex min-h-11 flex-1 items-center justify-center gap-2 border-r border-r-gray-300 px-3 py-2 text-sm font-medium transition-colors lg:flex-none lg:px-5 ${
								bottomSheet === "sort"
									? "bg-black text-white shadow-sm"
									: "text-gray-700 hover:bg-gray-100"
							}`}
						>
							<ArrowDownUp className="h-4 w-4 shrink-0" />
							<span className="truncate">Sort</span>
						</div>
						<div
							onClick={() =>
								setViewMode((v) => (v === "grid" ? "list" : "grid"))
							}
							className="flex h-auto w-14 shrink-0 items-center justify-center rounded-lg transition-colors"
							aria-label={
								viewMode === "grid"
									? "Switch to list view"
									: "Switch to grid view"
							}
						>
							{viewMode === "grid" ? (
								<Grid3x3 className="h-5 w-5" />
							) : (
								<ListIcon className="h-5 w-5" />
							)}
						</div>
						</div>
					</div>

					{/* Desktop: filter/sort panels inline below the tabs (no slide-up) */}
					{bottomSheet !== "none" && (
						<div className="mt-3 hidden w-full max-w-3xl rounded-lg border border-gray-200 bg-gray-50/90 p-4 shadow-sm lg:block">
							<div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
								<h3 className="text-sm font-semibold text-gray-900">
									{bottomSheet === "filter"
										? t.search.filterResults
										: "Sort"}
								</h3>
								<button
									type="button"
									onClick={() => setBottomSheet("none")}
									className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
									aria-label="Close"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
							{bottomSheet === "filter" && renderFilterForm()}
							{bottomSheet === "sort" && renderSortForm()}
						</div>
					)}
				</div>

				{/* Suggestions Dropdown */}
				{showSuggestions && (query.length >= 2 || history.length > 0) && (
					<div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-xl z-50 max-h-96 overflow-y-auto">
						<div className="container mx-auto px-6 py-6">
							{/* Suggestions */}
							{suggestions.length > 0 && (
								<div className="mb-4">
									<h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
										<Search size={16} className="mr-2" />
										{t.search.suggestions}
									</h3>
									<div className="space-y-1">
										{suggestions.map((suggestion, index) => (
											<button
												key={index}
												onClick={() => handleSuggestionClick(suggestion)}
												className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
											>
												{suggestion}
											</button>
										))}
									</div>
								</div>
							)}

							{/* Search History */}
							{history.length > 0 && (
								<div className="mb-4">
									<div className="flex items-center justify-between mb-2">
										<h3 className="text-sm font-medium text-gray-700 flex items-center">
											<Clock size={16} className="mr-2" />
											{t.search.recentSearches}
										</h3>
										<button
											onClick={clearAllHistory}
											className="text-xs text-gray-500 hover:text-gray-700"
										>
											{t.search.clearAll}
										</button>
									</div>
									<div className="space-y-1">
										{history.slice(0, 5).map((item) => (
											<div
												key={item.id}
												className="flex items-center justify-between group"
											>
												<button
													onClick={() => handleHistoryClick(item)}
													className="flex-1 text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
												>
													<div className="flex items-center justify-between">
														<span>{item.query}</span>
														<span className="text-xs text-gray-500">
															{item.resultsCount} results
														</span>
													</div>
												</button>
												<button
													onClick={() => removeFromHistory(item.id)}
													className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
												>
													<X size={14} />
												</button>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Popular Searches */}
							{!query && (
								<div>
									<h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
										<TrendingUp size={16} className="mr-2" />
										{t.search.popularSearches}
									</h3>
									<div className="flex flex-wrap gap-2">
										{popularSearches.map((search: string, index: number) => (
											<button
												key={index}
												onClick={() => handleSuggestionClick(search)}
												className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
											>
												{search}
											</button>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Results */}
			<div className="container mx-auto px-4 py-8">
				{query && (
					<div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
						<div>
							<h1 className="md:text-2xl text-base font-bold text-gray-900 mb-1">
								{t.search.searchResultsFor} "{query}"
							</h1>
							<div className="text-gray-600 md:text-base text-sm flex items-center">
								{isLoading ? (
									<>
										<span
											className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2"
											aria-hidden
										/>
										{t.search.searching}
									</>
								) : (
									`${results.length} ${t.search.productsFound}`
								)}
							</div>
						</div>

					</div>
				)}

				{/* Loading State */}
				{isLoading && (
					<div className="flex justify-center items-center py-12">
						<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
					</div>
				)}

				{/* Results Grid */}
				{!isLoading && results.length > 0 && (
					<div
						className={`grid gap-6 ${
							viewMode === "grid"
								? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
								: "grid-cols-1"
						}`}
					>
						{displayedResults.map((product) => (
							<Link
								key={product.id}
								href={`/shops/products/${product.id}`}
								className={`group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-200 hover:-translate-y-1 ${
									viewMode === "list" ? "flex space-x-6 p-6" : ""
								}`}
							>
								<div
									className={`relative overflow-hidden ${
										viewMode === "list"
											? "w-32 h-32 flex-shrink-0 rounded-lg"
											: "aspect-square rounded-t-xl"
									}`}
								>
									<SafeImage
										src={
											product.images && product.images.length > 0
												? product.images[0]
												: "/placeholder-product.svg"
										}
										alt={product.title}
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-300"
										sizes={
											viewMode === "list"
												? "128px"
												: RESPONSIVE_SIZES.productCard
										}
										placeholder="blur"
										blurDataURL={generateBlurDataURL(
											viewMode === "list"
												? 128
												: IMAGE_DIMENSIONS.productCard.width,
											viewMode === "list"
												? 128
												: IMAGE_DIMENSIONS.productCard.height,
										)}
										fallbackSrc="/placeholder-product.svg"
									/>
									<div className="absolute top-2 right-2">
										<span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full text-gray-700 capitalize">
											{product.productType.replace("-", " ")}
										</span>
									</div>
								</div>

								<div className={viewMode === "list" ? "flex-1" : "p-5"}>
									<div className="mb-2">
										<h3 className="font-semibold text-gray-900 text-lg line-clamp-2 break-words group-hover:text-blue-600 transition-colors">
											{product.title}
										</h3>
										{product.brandName && (
											<p className="text-sm text-blue-600 font-medium break-words mt-0.5">
												by {product.brandName}
											</p>
										)}
									</div>

									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
										<div className="text-xl font-bold text-gray-900">
											{(() => {
												// Check if product is priced in NGN
												const productCurrency =
													typeof product.price === "number"
														? "USD"
														: product.price.currency || "USD";
																							
												// Determine base price - use minimum individual item price if multiple pricing is enabled
												let basePrice: number;
												if (product.enableMultiplePricing && product.individualItems && product.individualItems.length > 0) {
													// Get the minimum price from individual items
													basePrice = Math.min(...product.individualItems.map((item: any) => item.price));
												} else {
													basePrice = typeof product.price === "number" ? product.price : product.price.base;
												}
									
												// USD products get duty calculation, NGN products get commission only (handled by utils)
												return (
													<Price
														price={calculateCustomerPrice(
															basePrice,
															userCountry,
														)}
														originalCurrency={productCurrency}
														size="lg"
														variant="default"
													/>
												);
											})()}
										</div>
										{product.tags && product.tags.length > 0 && (
											<div className="flex flex-wrap gap-1">
												{product.tags.slice(0, 2).map((tag, index) => (
													<span
														key={index}
														className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
													>
														{tag}
													</span>
												))}
											</div>
										)}
									</div>

									{viewMode === "list" && product.description && (
										<p className="text-sm text-gray-600 mt-3 line-clamp-2">
											{product.description}
										</p>
									)}
								</div>
							</Link>
						))}
					</div>
				)}

				{/* No Results */}
				{!isLoading && query && results.length === 0 && (
					<div className="text-center py-12">
						<Search size={48} className="mx-auto text-gray-400 mb-4" />
						<h2 className="md:text-2xl text-base font-semibold text-gray-900 mb-2">
							{t.search.noResults} "{query}"
						</h2>
						<p className="text-gray-600 md:text-base text-sm mb-8">{t.search.adjustFilters}</p>
						<div className="space-y-2">
							<p className="md:text-base text-sm text-gray-500">{t.search.suggestions}:</p>
							<div className="flex flex-wrap justify-center gap-2">
								{popularSearches
									.slice(0, 4)
									.map((search: string, index: number) => (
										<button
											key={index}
											onClick={() => handleSuggestionClick(search)}
											className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
										>
											{search}
										</button>
									))}
							</div>
						</div>
					</div>
				)}

				{/* Empty State */}
				{!query && !isLoading && (
					<div className="text-center py-16">
						<div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
							<Search size={48} className="text-blue-600" />
						</div>
						<h2 className="md:text-3xl text-base font-bold text-gray-900 mb-3">
							{t.search.title}
						</h2>
						<p className="md:text-xl text-base text-gray-500 mb-12 max-w-2xl mx-auto">
							{t.search.searchBy}
						</p>

						{/* Popular Searches */}
						<div className="mb-12">
							<h3 className="md:text-lg text-base font-semibold text-gray-900 mb-4">
								{t.search.popularSearches}
							</h3>
							<div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
								{popularSearches.map((search: string, index: number) => (
									<button
										key={index}
										onClick={() => handleSuggestionClick(search)}
										className="px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-sm"
									>
										{search}
									</button>
								))}
							</div>
						</div>

						{/* Categories */}
						<div className="max-w-4xl mx-auto">
							<h3 className="md:text-lg text-base font-semibold text-gray-900 mb-6 text-left">
								{t.search.browseCategories}
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{categories.map((category: any) => (
									<button
										key={category.id}
										onClick={() => {
											setFilters({ category: category.id });
											setQuery("");
											performSearch("");
										}}
										className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left shadow-sm hover:shadow-md"
									>
										<div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
											{category.name}
										</div>
										{category.count && (
											<div className="text-sm text-gray-500 mt-1">
												{category.count} {t.search.itemsAvailable}
											</div>
										)}
									</button>
								))}
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Click outside to close suggestions */}
			{showSuggestions && (
				<div
					className="fixed inset-0 z-30"
					onClick={() => setShowSuggestions(false)}
				/>
			)}

			{/* Slide-up: filter or sort (mobile / tablet only; desktop uses inline panel above) */}
			{bottomSheet !== "none" && (
				<div className="lg:hidden">
					<div
						className="fixed inset-0 z-[55] bg-black/40 animate-in fade-in duration-200"
						aria-hidden
						onClick={() => setBottomSheet("none")}
					/>
					<div
						className="fixed inset-x-0 bottom-0 z-[60] max-h-[85vh] overflow-y-auto border-t border-gray-200 bg-white shadow-2xl animate-in slide-in-from-bottom duration-300"
						role="dialog"
						aria-modal="true"
						aria-labelledby="search-sheet-title"
					>
						<div className="mx-auto w-full max-w-lg px-4 pb-8 pt-3 sm:px-6">
							<div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200" />
							<div className="mb-4 flex items-center justify-between">
								<h2
									id="search-sheet-title"
									className="text-lg font-semibold text-gray-900"
								>
									{bottomSheet === "filter"
										? t.search.filterResults
										: "Sort"}
								</h2>
								<button
									type="button"
									onClick={() => setBottomSheet("none")}
									className="rounded-full p-2 bg-transparent! border-none! text-black! hover:bg-gray-100 hover:text-gray-800"
									aria-label="Close"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							{bottomSheet === "filter" && renderFilterForm()}
							{bottomSheet === "sort" && renderSortForm()}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default function SearchPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gray-50 flex items-center justify-center">
					<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
				</div>
			}
		>
			<SearchPageContent />
		</Suspense>
	);
}
