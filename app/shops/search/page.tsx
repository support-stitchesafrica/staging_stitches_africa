"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
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
	const [showFilters, setShowFilters] = useState(false);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [filters, setFilters] = useState<SearchFilters>({});

	// Load search history on mount
	useEffect(() => {
		setHistory(SearchService.getSearchHistory());
	}, []);

	// Perform search when query changes
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

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm">
				<div className="container mx-auto px-4 py-6">
					<div className="flex items-center space-x-4">
						<button
							onClick={() => router.back()}
							className="p-2 hover:bg-white/50 rounded-lg transition-colors"
						>
							<ArrowLeft size={20} />
						</button>

						<div className="flex-1">
							<h1 className="text-lg font-semibold text-gray-900 mb-2">
								{t.search.title}
							</h1>
							<form onSubmit={handleSearch} className="relative">
								<input
									type="text"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									onFocus={() => setShowSuggestions(true)}
									placeholder={t.search.placeholder}
									className="w-full pl-12 pr-12 py-4 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm text-lg"
									autoFocus
								/>
								<Search
									className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
									size={24}
								/>

								{query && (
									<button
										type="button"
										onClick={() => {
											setQuery("");
											setResults([]);
											setShowSuggestions(false);
										}}
										className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
									>
										<X size={20} />
									</button>
								)}
							</form>
						</div>

						<button
							onClick={() => setShowFilters(!showFilters)}
							className={`p-3 rounded-lg transition-colors ${showFilters ? "bg-blue-100 text-blue-600" : "hover:bg-white/50"}`}
						>
							<SlidersHorizontal size={20} />
						</button>
					</div>

					{/* Filters */}
					{showFilters && (
						<div className="mt-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								{t.search.filterResults}
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
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
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
									>
										<option value="">{t.search.allTypes}</option>
										<option value="ready-to-wear">Ready-to-Wear</option>
										<option value="bespoke">Bespoke</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
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
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
									>
										<option value="">{t.search.allCategories}</option>
										{categories.map((category: any) => (
											<option key={category.id} value={category.id}>
												{category.name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										{t.search.minPrice}
									</label>
									<input
										type="number"
										value={filters.minPrice || ""}
										onChange={(e) =>
											setFilters({
												...filters,
												minPrice: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
										placeholder="0"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										{t.search.maxPrice}
									</label>
									<input
										type="number"
										value={filters.maxPrice || ""}
										onChange={(e) =>
											setFilters({
												...filters,
												maxPrice: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
										placeholder="1000"
									/>
								</div>
							</div>

							<div className="mt-6 flex justify-end space-x-3">
								<button
									onClick={() => {
										setFilters({});
										if (query) performSearch(query);
									}}
									className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
								>
									{t.search.clearFilters}
								</button>
								<button
									onClick={() => {
										if (query) performSearch(query);
										setShowFilters(false);
									}}
									className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
								>
									{t.search.applyFilters}
								</button>
							</div>
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
							<h1 className="text-2xl font-bold text-gray-900 mb-1">
								{t.search.searchResultsFor} "{query}"
							</h1>
							<p className="text-gray-600 flex items-center">
								{isLoading ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
										{t.search.searching}
									</>
								) : (
									`${results.length} ${t.search.productsFound}`
								)}
							</p>
						</div>

						<div className="flex items-center space-x-3 bg-white rounded-lg p-1 shadow-sm border">
							<button
								onClick={() => setViewMode("grid")}
								className={`p-2 rounded-md transition-colors ${
									viewMode === "grid"
										? "bg-blue-100 text-blue-600 shadow-sm"
										: "text-gray-600 hover:bg-gray-100"
								}`}
							>
								<Grid3x3 size={20} />
							</button>
							<button
								onClick={() => setViewMode("list")}
								className={`p-2 rounded-md transition-colors ${
									viewMode === "list"
										? "bg-blue-100 text-blue-600 shadow-sm"
										: "text-gray-600 hover:bg-gray-100"
								}`}
							>
								<ListIcon size={20} />
							</button>
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
						{results.map((product) => (
							<Link
								key={product.id}
								href={`/shops/products/${product.id}`}
								className={`group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-200 hover:-translate-y-1 ${
									viewMode === "list" ? "flex space-x-6 p-6" : "overflow-hidden"
								}`}
							>
								<div
									className={`relative ${
										viewMode === "list"
											? "w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden"
											: "aspect-square"
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

								<div className={viewMode === "list" ? "flex-1 min-w-0" : "p-5"}>
									<div className="mb-2">
										<h3 className="font-semibold text-gray-900 truncate text-lg group-hover:text-blue-600 transition-colors">
											{product.title}
										</h3>
										{product.brandName && (
											<p className="text-sm text-blue-600 font-medium truncate">
												by {product.brandName}
											</p>
										)}
									</div>

									<div className="flex items-center justify-between">
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
						<h2 className="text-xl font-semibold text-gray-900 mb-2">
							{t.search.noResults} "{query}"
						</h2>
						<p className="text-gray-600 mb-8">{t.search.adjustFilters}</p>
						<div className="space-y-2">
							<p className="text-sm text-gray-500">{t.search.suggestions}:</p>
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
						<h2 className="text-3xl font-bold text-gray-900 mb-3">
							{t.search.title}
						</h2>
						<p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
							{t.search.searchBy}
						</p>

						{/* Popular Searches */}
						<div className="mb-12">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
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
							<h3 className="text-lg font-semibold text-gray-900 mb-6 text-left">
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
