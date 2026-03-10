"use client";

import { useState, useMemo, useEffect } from "react";
import { ProductWithDiscount } from "@/types/promotionals";
import { PromotionalProductCard } from "./PromotionalProductCard";
import { 
	Search, 
	SlidersHorizontal, 
	Users, 
	User, 
	UserCircle,
	ShoppingBag,
	Shirt,
	Footprints,
	Briefcase,
	Layers,
	Sparkles,
	Watch,
	Package
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PromotionalProductsGridProps {
	products: ProductWithDiscount[];
	eventId: string;
	eventName?: string; // Event name for badge display
	eventEndDate?: Date; // Event end date for cart
	className?: string;
	totalProducts?: number | null; // Total products count (null = loading)
	isLoadingTotal?: boolean; // Whether total count is still loading
}

type SortOption = "default" | "price-asc" | "price-desc" | "discount";
type MainCategory = "all" | "men" | "women";
type SubCategory = 
	| "all" 
	| "shirts" 
	| "pants"
	| "dresses" 
	| "outerwear"
	| "shoes" 
	| "bags"
	| "others";

// Helper function to categorize products by keywords in title and description
function categorizeProduct(title: string, description?: string, logDetails = false): SubCategory {
	const lowerTitle = title.toLowerCase();
	const lowerDesc = description?.toLowerCase() || "";
	const searchText = `${lowerTitle} ${lowerDesc}`;
	
	let category: SubCategory = "others";
	let matchedKeyword = "";
	
	// Shoes - check first as it's very specific
	if (
		searchText.match(/\bshoe\b/) || 
		searchText.includes("sneaker") || 
		searchText.includes("boot") || 
		searchText.includes("sandal") ||
		searchText.includes("heel") ||
		searchText.includes("loafer") ||
		searchText.includes("slipper") ||
		searchText.includes("footwear") ||
		searchText.includes("slip-on") ||
		searchText.includes("mule")
	) {
		category = "shoes";
		matchedKeyword = "footwear related";
	}
	// Bags - check early as it's specific
	else if (
		searchText.match(/\bbag\b/) || 
		searchText.includes("purse") || 
		searchText.includes("handbag") ||
		searchText.includes("backpack") ||
		searchText.includes("clutch") ||
		searchText.includes("tote") ||
		searchText.includes("briefcase") ||
		searchText.includes("leather bag") ||
		searchText.includes("pouch") ||
		searchText.includes("satchel")
	) {
		category = "bags";
		matchedKeyword = "bag related";
	}
	// Dresses & Gowns - use word boundaries and avoid false matches
	else if (
		(searchText.match(/\bdress\b/) && !searchText.includes("address") && !searchText.includes("dress code")) || 
		searchText.match(/\bgown\b/) ||
		searchText.includes("kaftan") ||
		searchText.includes("caftan") ||
		searchText.includes("maxi dress") ||
		searchText.includes("midi dress") ||
		searchText.includes("mini dress") ||
		searchText.includes("evening dress") ||
		searchText.includes("cocktail dress")
	) {
		category = "dresses";
		matchedKeyword = "dress related";
	}
	// Outerwear (Jackets, Coats, Blazers)
	else if (
		searchText.includes("jacket") || 
		searchText.includes("coat") || 
		searchText.includes("blazer") ||
		searchText.includes("cardigan") ||
		searchText.includes("outerwear") ||
		searchText.includes("bomber") ||
		searchText.includes("parka")
	) {
		category = "outerwear";
		matchedKeyword = "outerwear related";
	}
	// Shirts (Tops, Blouses, Sweaters, etc.)
	else if (
		searchText.includes("shirt") || 
		searchText.includes("blouse") || 
		searchText.match(/\btop\b/) ||
		searchText.includes("t-shirt") ||
		searchText.includes("polo") ||
		searchText.includes("tunic") ||
		searchText.includes("sweater") ||
		searchText.includes("hoodie") ||
		searchText.includes("tee") ||
		searchText.includes("cami") ||
		searchText.includes("tank")
	) {
		category = "shirts";
		matchedKeyword = "shirt/top related";
	}
	// Pants (Bottoms, Shorts, Skirts, etc.)
	else if (
		searchText.includes("pant") || 
		searchText.includes("trouser") || 
		searchText.includes("jean") ||
		searchText.includes("short") ||
		searchText.includes("legging") ||
		searchText.includes("skirt") ||
		searchText.includes("wide-leg") ||
		searchText.includes("leg trouser") ||
		searchText.includes("jogger") ||
		searchText.includes("cargo")
	) {
		category = "pants";
		matchedKeyword = "pants/bottoms related";
	}
	
	// Log categorization for debugging (only in development)
	if (logDetails && category === "others") {
		console.log(`⚠️ Product categorized as "others": "${title.substring(0, 50)}..."`);
	}
	
	return category;
}

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

// Helper function to get icon for main category
function getCategoryIcon(category: MainCategory) {
	switch (category) {
		case "all":
			return Users;
		case "men":
			return User;
		case "women":
			return UserCircle;
		default:
			return Users;
	}
}

// Helper function to get icon for subcategory
function getSubCategoryIcon(subCategory: SubCategory) {
	switch (subCategory) {
		case "all":
			return Package;
		case "shirts":
			return Shirt;
		case "pants":
			return Layers;
		case "dresses":
			return Sparkles;
		case "outerwear":
			return Briefcase;
		case "shoes":
			return Footprints;
		case "bags":
			return ShoppingBag;
		case "others":
			return Watch;
		default:
			return Package;
	}
}

export function PromotionalProductsGrid({
	products,
	eventId,
	eventName,
	eventEndDate,
	className,
	totalProducts,
	isLoadingTotal = false,
}: PromotionalProductsGridProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("default");
	const [selectedCategory, setSelectedCategory] = useState<MainCategory>("all");
	const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory>("all");
	const [selectedVendor, setSelectedVendor] = useState<string>("all");
	const [includeBespoke, setIncludeBespoke] = useState(false);
	const [randomizedProducts, setRandomizedProducts] = useState<ProductWithDiscount[]>([]);

	// Priority products to show first - check for these keywords and vendor
	const isPriorityProduct = (product: ProductWithDiscount): boolean => {
		const titleLower = product.title.toLowerCase();
		const vendorLower = product.vendor.name.toLowerCase();
		
		return (
			// Asoke/Asooke jacket from Clips Clothing only (flexible vendor matching)
			((titleLower.includes("asoke") || titleLower.includes("asooke") || titleLower.includes("aso oke")) && 
			 titleLower.includes("jacket") && 
			 (vendorLower.includes("clips") || vendorLower.includes("clip"))) ||
			// Aletor top
			titleLower.includes("aletor") ||
			// Omo eko dress
			(titleLower.includes("omo") && titleLower.includes("eko")) ||
			titleLower.includes("omo eko") ||
			// Candy
			titleLower.includes("candy") ||
			// Aso Odun layered 3 piece orange
			(titleLower.includes("aso odun") && titleLower.includes("layered")) ||
			(titleLower.includes("aso odun") && titleLower.includes("3 piece")) ||
			(titleLower.includes("aso odun") && titleLower.includes("orange")) ||
			// Wide-leg trousers
			titleLower.includes("wide-leg trouser") ||
			titleLower.includes("wide leg trouser") ||
			// Leaf leather bag
			(titleLower.includes("leaf") && titleLower.includes("leather") && titleLower.includes("bag")) ||
			// Unixes
			titleLower.includes("unixes")
		);
	};

	// Organize products with priority items first (runs once on mount and when products change)
	useEffect(() => {
		if (products.length > 0) {
			// Separate priority products (keep their order) and shuffle others
			const priorityProducts: ProductWithDiscount[] = [];
			const otherProducts: ProductWithDiscount[] = [];
			
			products.forEach(product => {
				if (isPriorityProduct(product)) {
					priorityProducts.push(product);
					console.log('Found priority product:', product.title, 'from', product.vendor.name);
				} else {
					otherProducts.push(product);
				}
			});
			
			console.log(`Total priority products found: ${priorityProducts.length}`);
			console.log('Priority products:', priorityProducts.map(p => p.title));
			
			// Shuffle only the non-priority products
			const shuffledOthers = shuffleArray(otherProducts);

			console.log(otherProducts)
			
			// Put priority products first, then shuffled others
			const organized = [...priorityProducts, ...shuffledOthers];
			console.log('First 5 products after organizing:', organized.slice(0, 5).map(p => p.title));
			setRandomizedProducts(organized);
		}
	}, [products]);

	// Get unique categories (men, women only - no unisex)
	const categories: MainCategory[] = useMemo(() => {
		const hasMen = products.some((p) => p.category?.toLowerCase() === "men");
		const hasWomen = products.some((p) => p.category?.toLowerCase() === "women");
		
		const availableCategories: MainCategory[] = ["all"];
		if (hasMen) availableCategories.push("men");
		if (hasWomen) availableCategories.push("women");
		
		return availableCategories;
	}, [products]);

	// Get subcategories based on selected main category
	const subCategories: SubCategory[] = useMemo(() => {
		if (selectedCategory === "all") return ["all"];
		
		const categoryProducts = randomizedProducts.filter((p) => {
			const cat = p.category?.toLowerCase();
			// Include products that match the category OR have no category OR are unisex
			return cat === selectedCategory.toLowerCase() || !cat || cat === "unisex";
		});
		
		// Count products per subcategory for logging
		const subCatCounts: Record<SubCategory, number> = {
			all: 0,
			shirts: 0,
			pants: 0,
			dresses: 0,
			outerwear: 0,
			shoes: 0,
			bags: 0,
			others: 0
		};
		
		const subCats = new Set<SubCategory>();
		categoryProducts.forEach((product) => {
			const subCat = categorizeProduct(product.title, product.description, true);
			subCats.add(subCat);
			subCatCounts[subCat]++;
		});
		
		console.log(`📊 Subcategory distribution for "${selectedCategory}":`, subCatCounts);
		console.log(`Total products in "${selectedCategory}": ${categoryProducts.length}`);
		
		// Filter out dresses from men's category
		const filteredSubCats = Array.from(subCats).filter(subCat => {
			if (selectedCategory === "men" && subCat === "dresses") {
				return false; // Don't show dresses under men
			}
			return true;
		});
		
		return ["all", ...filteredSubCats.sort()];
	}, [selectedCategory, randomizedProducts]);

	// Reset subcategory when main category changes
	useEffect(() => {
		setSelectedSubCategory("all");
	}, [selectedCategory]);

	// Get unique vendors
	const vendors = useMemo(() => {
		const vendorNames = new Set(
			products.map((p) => p.vendor.name).filter(Boolean)
		);
		return ["all", ...Array.from(vendorNames)];
	}, [products]);

	// Filter and sort products, removing duplicates - OPTIMIZED with Set for O(1) lookup
	const filteredProducts = useMemo(() => {
		// Use randomized products as base (which already has priority items first)
		const baseProducts = randomizedProducts.length > 0 ? randomizedProducts : products;
		
		// Remove duplicates by productId first while maintaining order
		const seenIds = new Set<string>();
		const uniqueProducts = baseProducts.filter((product) => {
			if (seenIds.has(product.productId)) {
				return false;
			}
			seenIds.add(product.productId);
			return true;
		});

		let filtered = [...uniqueProducts];
		
		console.log('First 3 products before filtering:', filtered.slice(0, 3).map(p => ({ title: p.title, vendor: p.vendor.name })));
		console.log('Total products before any filtering:', filtered.length);

		// Filter out out-of-stock items
		filtered = filtered.filter((product) => {
			const availability = product.availability?.toLowerCase() || "";
			return availability !== "out of stock" && availability !== "out-of-stock" && availability !== "out_of_stock" && availability !== "sold out";
		});
		console.log('Products after stock filtering:', filtered.length);

		// Type filter: By default, only show ready-to-wear items
		if (!includeBespoke) {
			const beforeBespokeFilter = filtered.length;
			filtered = filtered.filter(
				(product) => product.type === "ready-to-wear" || !product.type
			);
			console.log(`Products after bespoke filtering: ${filtered.length} (removed ${beforeBespokeFilter - filtered.length} bespoke items)`);
		}

		// Search filter
		if (searchQuery) {
			filtered = filtered.filter(
				(product) =>
					product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					product.vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Main category filter
		if (selectedCategory !== "all") {
			const beforeCategoryFilter = filtered.length;
			filtered = filtered.filter((product) => {
				const cat = product.category?.toLowerCase();
				// Show products that match the selected category OR have no category OR are unisex
				return cat === selectedCategory.toLowerCase() || !cat || cat === "unisex";
			});
			console.log(`Products after category filter (${selectedCategory}): ${filtered.length} (removed ${beforeCategoryFilter - filtered.length})`);
		}
		// When "all" is selected, show all products (including unisex and uncategorized)
		console.log('Final filtered products count:', filtered.length);

		// Subcategory filter
		if (selectedSubCategory !== "all") {
			filtered = filtered.filter((product) => {
				const productSubCat = categorizeProduct(product.title, product.description);
				return productSubCat === selectedSubCategory;
			});
		}

		// Vendor filter
		if (selectedVendor !== "all") {
			filtered = filtered.filter(
				(product) => product.vendor.name === selectedVendor
			);
		}

		// Sort
		switch (sortBy) {
			case "price-asc":
				filtered.sort((a, b) => a.discountedPrice - b.discountedPrice);
				break;
			case "price-desc":
				filtered.sort((a, b) => b.discountedPrice - a.discountedPrice);
				break;
			case "discount":
				filtered.sort((a, b) => b.discountPercentage - a.discountPercentage);
				break;
			default:
				// Keep randomized order for default
				break;
		}

		return filtered;
	}, [randomizedProducts, products, searchQuery, selectedCategory, selectedSubCategory, selectedVendor, sortBy, includeBespoke]);

	return (
		<div className={cn("space-y-6", className)}>
			{/* Filters and Search */}
			<div className="flex flex-col sm:flex-row gap-4">
				{/* Search */}
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						placeholder="Search products or vendors..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
					/>
				</div>

				{/* Vendor Filter Dropdown */}
				{vendors.length > 1 && (
					<div className="sm:w-48">
						<select
							value={selectedVendor}
							onChange={(e) => setSelectedVendor(e.target.value)}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white cursor-pointer text-black"
						>
							<option value="all">All Vendors</option>
							{vendors
								.filter((v) => v !== "all")
								.map((vendor) => (
									<option key={vendor} value={vendor}>
										{vendor}
									</option>
								))}
						</select>
					</div>
				)}

				{/* Sort */}
				<div className="sm:w-48">
					<div className="relative">
						<SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as SortOption)}
							className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white cursor-pointer text-black"
						>
							<option value="default">Default</option>
							<option value="price-asc">Price: Low to High</option>
							<option value="price-desc">Price: High to Low</option>
							<option value="discount">Highest Discount</option>
						</select>
					</div>
				</div>
			</div>

			{/* Main Category Filter */}
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex flex-wrap gap-2">
						{categories.map((category) => {
							const Icon = getCategoryIcon(category);
							return (
								<button
									key={category}
									onClick={() => setSelectedCategory(category)}
									className={cn(
										"flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 capitalize",
										selectedCategory === category
											? "bg-red-600 text-white shadow-lg"
											: "text-gray-700 hover:text-red-600 hover:bg-red-50"
									)}
								>
									<Icon className="w-4 h-4" />
									{category === "all" ? "All" : category}
								</button>
							);
						})}
					</div>
					
					{/* Include Bespoke Toggle */}
					<label className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer">
						<input
							type="checkbox"
							checked={includeBespoke}
							onChange={(e) => setIncludeBespoke(e.target.checked)}
							className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
						/>
						<span className="text-sm font-medium">
							Include Bespoke
						</span>
					</label>
				</div>

				{/* Subcategory Filter - Only show when a main category is selected */}
				{selectedCategory !== "all" && subCategories.length > 1 && (
					<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
						<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
							Filter by Type
						</p>
						<div className="flex flex-wrap gap-2">
							{subCategories.map((subCat) => {
								const Icon = getSubCategoryIcon(subCat);
								return (
									<button
										key={subCat}
										onClick={() => setSelectedSubCategory(subCat)}
										className={cn(
											"flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 capitalize",
											selectedSubCategory === subCat
												? "bg-red-600 text-white shadow-md"
												: "text-gray-700 hover:text-red-600 hover:bg-red-50"
										)}
									>
										<Icon className="w-4 h-4" />
										{subCat === "all" ? "All Items" : subCat}
									</button>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* Results Count */}
			<div className="flex items-center justify-between">
				<p className="text-sm text-gray-900 font-medium">
					{isLoadingTotal ||
					totalProducts === null ||
					totalProducts === undefined ? (
						<span className="text-gray-500">
							Showing {filteredProducts.length}{" "}
							{filteredProducts.length === 1 ? "product" : "products"}
							<span className="ml-2 text-xs text-gray-400">
								(Loading total...)
							</span>
						</span>
					) : (
						<>
							Showing {filteredProducts.length} of{" "}
							{totalProducts.toLocaleString()}{" "}
							{totalProducts === 1 ? "product" : "products"}
						</>
					)}
				</p>
			</div>

			{/* Products Grid */}
			{filteredProducts.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{filteredProducts.map((product, index) => (
						<PromotionalProductCard
							key={`${product.productId}-${index}`}
							product={product}
							eventId={eventId}
							eventName={eventName}
							eventEndDate={eventEndDate}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-16">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
						<Search className="w-8 h-8 text-gray-400" />
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						No products found
					</h3>
					<p className="text-gray-600">Try adjusting your search or filters</p>
				</div>
			)}
		</div>
	);
}
