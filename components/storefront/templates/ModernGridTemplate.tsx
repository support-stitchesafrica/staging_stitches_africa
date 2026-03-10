"use client";

import { useState, useMemo } from "react";
import { Product } from "@/types";
import { StorefrontConfig } from "@/types/storefront";
import Image from "next/image";
import { Heart, ChevronDown, Filter } from "lucide-react";
import StorefrontCartBadge from "../StorefrontCartBadge";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { useCurrency } from "@/contexts/CurrencyContext";
import { calculateCustomerPrice, calculateFinalPrice } from "@/lib/priceUtils";
import { Price, DiscountedPrice } from "@/components/common/Price";

interface ModernGridTemplateProps {
	config: StorefrontConfig;
	products: Product[];
	onAddToCart: (product: Product) => void;
	onToggleWishlist: (productId: string) => void;
	wishlistItems: Set<string>;
}

interface FilterOption {
	id: string;
	label: string;
	count?: number;
}

const SORT_OPTIONS = [
	{ value: "featured", label: "Featured" },
	{ value: "price-low", label: "Price: Low to High" },
	{ value: "price-high", label: "Price: High to Low" },
	{ value: "newest", label: "Newest" },
	{ value: "popular", label: "Most Popular" },
];

const CATEGORY_FILTERS: FilterOption[] = [
	{ id: "all", label: "All Items" },
	{ id: "women", label: "Women" },
	{ id: "men", label: "Men" },
	{ id: "accessories", label: "Accessories" },
	{ id: "bags", label: "Bags" },
	{ id: "shoes", label: "Shoes" },
];

const DISCOUNT_FILTERS: FilterOption[] = [
	{ id: "all", label: "All Prices" },
	{ id: "20-off", label: "20% off" },
	{ id: "30-off", label: "30% off" },
	{ id: "50-off", label: "50% off" },
];

export function ModernGridTemplate({
	config,
	products,
	onAddToCart,
	onToggleWishlist,
	wishlistItems,
}: ModernGridTemplateProps) {
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedDiscount, setSelectedDiscount] = useState("all");
	const [sortBy, setSortBy] = useState("featured");
	const [showFilters, setShowFilters] = useState(false);

	// Currency context
	const { userCountry } = useCurrency();

	// Filter and sort products
	const filteredAndSortedProducts = useMemo(() => {
		let filtered = [...products];

		// Apply category filter
		if (selectedCategory !== "all") {
			filtered = filtered.filter(
				(product) =>
					product.category?.toLowerCase().includes(selectedCategory) ||
					product.tags?.some((tag) =>
						tag.toLowerCase().includes(selectedCategory),
					),
			);
		}

		// Apply discount filter
		if (selectedDiscount !== "all") {
			const discountPercent = parseInt(selectedDiscount.split("-")[0]);
			filtered = filtered.filter(
				(product) => product.discount >= discountPercent,
			);
		}

		// Sort products
		switch (sortBy) {
			case "price-low":
				filtered.sort((a, b) => a.price.base - b.price.base);
				break;
			case "price-high":
				filtered.sort((a, b) => b.price.base - a.price.base);
				break;
			case "newest":
				filtered.sort((a, b) => {
					const dateA = a.createdAt
						? new Date(a.createdAt as string).getTime()
						: 0;
					const dateB = b.createdAt
						? new Date(b.createdAt as string).getTime()
						: 0;
					return dateB - dateA;
				});
				break;
			default:
				// Keep original order for featured
				break;
		}

		return filtered;
	}, [products, selectedCategory, selectedDiscount, sortBy]);

	const handleAddToCart = (product: Product) => {
		// Pass original product — cart/checkout handles pricing
		onAddToCart(product);
	};

	return (
		<div className="min-h-screen bg-white">
			{/* Header with logo and cart - keeping existing header */}
			<div className="border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						{/* Logo */}
						<div className="flex-shrink-0">
							{config.branding?.logo ? (
								<Image
									src={config.branding.logo}
									alt={config.businessInfo?.businessName || "Store"}
									width={120}
									height={40}
									className="h-8 w-auto"
								/>
							) : (
								<h1 className="text-xl font-bold text-gray-900">
									{config.businessInfo?.businessName || "Store"}
								</h1>
							)}
						</div>

						{/* Right Side: Language Selector & Cart */}
						<div className="flex items-center space-x-4">
							{/* Language & Currency Selector */}
							<LanguageSelector />

							{/* Cart icon - keeping existing cart functionality */}
							<button
								className="relative p-2 text-gray-600 hover:text-gray-900"
								onClick={() =>
									(window.location.href = `/store/${config.handle}/cart`)
								}
							>
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9"
									/>
								</svg>
								<StorefrontCartBadge />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Filters and Sort Bar */}
			<div className="border-b border-gray-200 bg-white sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between py-4">
						{/* Left side filters */}
						<div className="flex items-center space-x-4">
							{/* All Filters Button */}
							<button
								onClick={() => setShowFilters(!showFilters)}
								className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
							>
								<Filter className="w-4 h-4" />
								<span>All Filters</span>
								<ChevronDown className="w-4 h-4" />
							</button>

							{/* Quick Filters */}
							<div className="flex items-center space-x-2">
								{DISCOUNT_FILTERS.slice(1).map((filter) => (
									<button
										key={filter.id}
										onClick={() => setSelectedDiscount(filter.id)}
										className={`px-3 py-1 rounded-full text-sm font-medium border ${
											selectedDiscount === filter.id
												? "bg-black text-white border-black"
												: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
										}`}
									>
										{filter.label}
									</button>
								))}

								{CATEGORY_FILTERS.slice(1, 3).map((filter) => (
									<button
										key={filter.id}
										onClick={() => setSelectedCategory(filter.id)}
										className={`px-3 py-1 rounded-full text-sm font-medium border ${
											selectedCategory === filter.id
												? "bg-black text-white border-black"
												: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
										}`}
									>
										{filter.label}
									</button>
								))}
							</div>
						</div>

						{/* Sort dropdown */}
						<div className="flex items-center space-x-2">
							<span className="text-sm text-gray-700">Sort by</span>
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
							>
								{SORT_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Expanded Filters */}
					{showFilters && (
						<div className="border-t border-gray-200 py-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div>
									<h3 className="text-sm font-medium text-gray-900 mb-3">
										Category
									</h3>
									<div className="space-y-2">
										{CATEGORY_FILTERS.map((filter) => (
											<label key={filter.id} className="flex items-center">
												<input
													type="radio"
													name="category"
													value={filter.id}
													checked={selectedCategory === filter.id}
													onChange={(e) => setSelectedCategory(e.target.value)}
													className="mr-2"
												/>
												<span className="text-sm text-gray-700">
													{filter.label}
												</span>
											</label>
										))}
									</div>
								</div>

								<div>
									<h3 className="text-sm font-medium text-gray-900 mb-3">
										Discount
									</h3>
									<div className="space-y-2">
										{DISCOUNT_FILTERS.map((filter) => (
											<label key={filter.id} className="flex items-center">
												<input
													type="radio"
													name="discount"
													value={filter.id}
													checked={selectedDiscount === filter.id}
													onChange={(e) => setSelectedDiscount(e.target.value)}
													className="mr-2"
												/>
												<span className="text-sm text-gray-700">
													{filter.label}
												</span>
											</label>
										))}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Product Grid */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{filteredAndSortedProducts.map((product) => {
						const basePrice =
							typeof product.price === "number"
								? product.price
								: product.price.base;
						const currency =
							typeof product.price === "object"
								? product.price.currency
								: "USD";
						const customerPrice = calculateCustomerPrice(
							basePrice,
							userCountry,
						);
						const hasDiscount = product.discount > 0;
						const discountedPrice = hasDiscount
							? calculateFinalPrice(basePrice, product.discount, userCountry)
							: customerPrice;

						return (
							<div key={product.product_id} className="group relative">
								{/* Product Image */}
								<div
									className="aspect-square bg-gray-100 rounded-lg overflow-hidden group-hover:opacity-75 transition-opacity cursor-pointer"
									onClick={() => handleAddToCart(product)}
								>
									{product.images && product.images.length > 0 ? (
										<Image
											src={product.images[0]}
											alt={product.title}
											width={300}
											height={300}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center text-gray-400">
											No Image
										</div>
									)}

									{/* Discount Badge */}
									{hasDiscount && (
										<div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
											{product.discount}% off applied
										</div>
									)}

									{/* Wishlist Button */}
									<button
										onClick={() => onToggleWishlist(product.product_id)}
										className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
									>
										<Heart
											className={`w-4 h-4 ${
												wishlistItems.has(product.product_id)
													? "fill-red-500 text-red-500"
													: "text-gray-400"
											}`}
										/>
									</button>
								</div>

								{/* Product Info */}
								<div className="mt-4 space-y-1">
									{/* Brand/Vendor */}
									<p className="text-xs text-gray-500 uppercase tracking-wide">
										{product.tailor || "New Season"}
									</p>

									{/* Product Title */}
									<h3 className="text-sm font-medium text-gray-900 line-clamp-2">
										{product.title}
									</h3>

									{/* Price */}
									<div className="flex items-center space-x-2">
										{hasDiscount ? (
											<DiscountedPrice
												originalPrice={customerPrice}
												salePrice={discountedPrice}
												originalCurrency={currency}
												size="sm"
											/>
										) : (
											<Price
												price={customerPrice}
												originalCurrency={currency}
												size="sm"
												variant="accent"
											/>
										)}
									</div>
								</div>

								{/* Add to Cart Button (appears on hover) */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleAddToCart(product);
									}}
									className="absolute inset-x-0 bottom-0 bg-black text-white py-2 px-4 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
								>
									Add to Cart
								</button>
							</div>
						);
					})}
				</div>

				{/* Empty State */}
				{filteredAndSortedProducts.length === 0 && (
					<div className="text-center py-12">
						<p className="text-gray-500">
							No products found matching your filters.
						</p>
						<button
							onClick={() => {
								setSelectedCategory("all");
								setSelectedDiscount("all");
							}}
							className="mt-4 text-black hover:underline"
						>
							Clear all filters
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
