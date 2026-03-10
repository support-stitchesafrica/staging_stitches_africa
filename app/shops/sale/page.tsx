"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Product } from "@/types";
import { productRepository } from "@/lib/firestore";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCachedData } from "@/lib/utils/cache-utils";
import { ProductCardSkeleton } from "@/components/ui/optimized-loader";
import { Heart, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React from "react";

// Sale Product Card Component
const SaleProductCard = React.memo(({ product, onWishlistToggle, isInWishlist }: {
	product: Product;
	onWishlistToggle?: (id: string) => void;
	isInWishlist?: boolean;
}) => {
	const router = useRouter();
	
	const { basePrice, discountedPrice, discountPercentage } = useMemo(() => {
		const base = typeof product.price === 'number' ? product.price : product.price.base;
		const discount = product.discount || 0;
		const discounted = discount > 0 ? base * (1 - discount / 100) : base;
		return { 
			basePrice: base, 
			discountedPrice: discounted, 
			discountPercentage: discount 
		};
	}, [product.price, product.discount]);

	const handleClick = () => {
		router.push(`/shops/products/${product.product_id}`);
	};

	const handleWishlistClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onWishlistToggle?.(product.product_id);
	};

	return (
		<div className="group cursor-pointer" onClick={handleClick}>
			<div className="relative aspect-[3/4] mb-3 overflow-hidden">
				<Image
					src={product.images?.[0] || '/placeholder-product.svg'}
					alt={product.title}
					fill
					className="object-cover group-hover:scale-105 transition-transform duration-300"
					sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
					loading="lazy"
				/>
				<button
					onClick={handleWishlistClick}
					className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
				</button>
				{discountPercentage > 0 && (
					<div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-xs font-medium">
						{discountPercentage}% off applied
					</div>
				)}
			</div>
			<div className="space-y-1">
				<h3 className="font-medium text-sm text-gray-900 line-clamp-2">{product.tailor || 'Designer'}</h3>
				<p className="text-sm text-gray-600 line-clamp-1">{product.title}</p>
				<div className="flex items-center space-x-2">
					{discountPercentage > 0 ? (
						<>
							<span className="text-sm font-medium text-gray-900">${discountedPrice.toFixed(0)}</span>
							<span className="text-sm text-gray-500 line-through">${basePrice.toFixed(0)}</span>
						</>
					) : (
						<span className="text-sm font-medium text-gray-900">${basePrice.toFixed(0)}</span>
					)}
				</div>
			</div>
		</div>
	);
});

SaleProductCard.displayName = 'SaleProductCard';

// Filter Button Component
const FilterButton = ({ active, onClick, children }: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) => (
	<button
		onClick={onClick}
		className={`px-4 py-2 text-sm border rounded-full transition-colors ${
			active 
				? 'bg-black text-white border-black' 
				: 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
		}`}
	>
		{children}
	</button>
);

// Main component that uses useSearchParams
function SalePageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toggleItem, isInWishlist } = useWishlist();
	
	// Filter states
	const [selectedDiscountRange, setSelectedDiscountRange] = useState<string>('all');
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [selectedGender, setSelectedGender] = useState<string>('all');
	const [sortBy, setSortBy] = useState<string>('discount-desc');

	// Fetch sale products (products with discounts)
	const {
		data: saleProductsRaw = [],
		loading: saleLoading,
	} = useCachedData(
		'sale-products',
		() => productRepository.getDiscountedProductsWithTailorInfo(),
		5 * 60 * 1000 // 5 minutes cache
	);

	const saleProducts = Array.isArray(saleProductsRaw) ? saleProductsRaw : [];

	// Get unique categories from sale products
	const categories = useMemo(() => {
		const cats = new Set<string>();
		saleProducts.forEach(product => {
			if (product.category && product.category.trim()) {
				cats.add(product.category.trim());
			}
		});
		return Array.from(cats).sort();
	}, [saleProducts]);

	// Filter and sort products
	const filteredProducts = useMemo(() => {
		let filtered = [...saleProducts];

		// Filter by discount range
		if (selectedDiscountRange !== 'all') {
			filtered = filtered.filter(product => {
				const discount = product.discount || 0;
				switch (selectedDiscountRange) {
					case '20':
						return discount >= 20 && discount < 30;
					case '30':
						return discount >= 30 && discount < 50;
					case '50':
						return discount >= 50 && discount < 70;
					case '70':
						return discount >= 70;
					default:
						return true;
				}
			});
		}

		// Filter by category
		if (selectedCategory !== 'all') {
			filtered = filtered.filter(product => 
				product.category?.toLowerCase() === selectedCategory.toLowerCase()
			);
		}

		// Filter by gender (if available in product data)
		if (selectedGender !== 'all') {
			filtered = filtered.filter(product => {
				// Assuming gender info might be in tags or category
				const productInfo = `${product.category} ${product.tags?.join(' ') || ''}`.toLowerCase();
				return productInfo.includes(selectedGender);
			});
		}

		// Sort products
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'discount-desc':
					return (b.discount || 0) - (a.discount || 0);
				case 'discount-asc':
					return (a.discount || 0) - (b.discount || 0);
				case 'price-asc':
					const priceA = typeof a.price === 'number' ? a.price : a.price.base;
					const priceB = typeof b.price === 'number' ? b.price : b.price.base;
					return priceA - priceB;
				case 'price-desc':
					const priceA2 = typeof a.price === 'number' ? a.price : a.price.base;
					const priceB2 = typeof b.price === 'number' ? b.price : b.price.base;
					return priceB2 - priceA2;
				case 'newest':
					const dateA = new Date(a.createdAt || a.created_at || 0);
					const dateB = new Date(b.createdAt || b.created_at || 0);
					return dateB.getTime() - dateA.getTime();
				default:
					return 0;
			}
		});

		return filtered;
	}, [saleProducts, selectedDiscountRange, selectedCategory, selectedGender, sortBy]);

	// Calculate discount statistics
	const discountStats = useMemo(() => {
		const stats = {
			'20': 0, // 20-29%
			'30': 0, // 30-49%
			'50': 0, // 50-69%
			'70': 0  // 70%+
		};

		saleProducts.forEach(product => {
			const discount = product.discount || 0;
			if (discount >= 20 && discount < 30) stats['20']++;
			else if (discount >= 30 && discount < 50) stats['30']++;
			else if (discount >= 50 && discount < 70) stats['50']++;
			else if (discount >= 70) stats['70']++;
		});

		return stats;
	}, [saleProducts]);

	const handleWishlistToggle = async (productId: string) => {
		try {
			await toggleItem(productId);
		} catch (error) {
			console.error("Error toggling wishlist item:", error);
		}
	};

	// Get maximum discount for hero section
	const maxDiscount = useMemo(() => {
		return Math.max(...saleProducts.map(p => p.discount || 0));
	}, [saleProducts]);

	return (
		<div className="min-h-screen bg-white">
			{/* Breadcrumb */}
			<div className="border-b border-gray-200 py-4">
				<div className="container mx-auto px-4">
					<div className="flex items-center text-sm text-gray-600">
						<Link href="/shops" className="hover:text-gray-900">Women Home</Link>
						<span className="mx-2">›</span>
						<span className="text-gray-900">Sale</span>
					</div>
				</div>
			</div>

			{/* Hero Section */}
			<div className="py-12 bg-gray-50">
				<div className="container mx-auto px-4 text-center">
					<h1 className="text-4xl font-light mb-4">
						Sale is here: up to {maxDiscount}% off
					</h1>
					<p className="text-gray-600 mb-8 max-w-2xl mx-auto">
						Your style, our unique curation. Start exploring this season's highlights with up to {maxDiscount}% off selected styles now
					</p>
					<div className="flex justify-center space-x-4">
						<button 
							onClick={() => setSelectedGender('women')}
							className={`px-6 py-2 border rounded ${selectedGender === 'women' ? 'bg-black text-white' : 'bg-white text-black border-gray-300'}`}
						>
							Shop Women
						</button>
						<button 
							onClick={() => setSelectedGender('men')}
							className={`px-6 py-2 border rounded ${selectedGender === 'men' ? 'bg-black text-white' : 'bg-white text-black border-gray-300'}`}
						>
							Shop Men
						</button>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="border-b border-gray-200 py-6">
				<div className="container mx-auto px-4">
					<div className="flex flex-wrap items-center gap-4 mb-4">
						<div className="flex items-center space-x-2">
							<span className="text-sm font-medium">All Filters</span>
							<ChevronDown className="w-4 h-4" />
						</div>
						
						{/* Discount Range Filters */}
						<FilterButton
							active={selectedDiscountRange === '20'}
							onClick={() => setSelectedDiscountRange(selectedDiscountRange === '20' ? 'all' : '20')}
						>
							20% off ({discountStats['20']})
						</FilterButton>
						
						<FilterButton
							active={selectedDiscountRange === '30'}
							onClick={() => setSelectedDiscountRange(selectedDiscountRange === '30' ? 'all' : '30')}
						>
							30% off ({discountStats['30']})
						</FilterButton>
						
						<FilterButton
							active={selectedDiscountRange === '50'}
							onClick={() => setSelectedDiscountRange(selectedDiscountRange === '50' ? 'all' : '50')}
						>
							50% off ({discountStats['50']})
						</FilterButton>
						
						<FilterButton
							active={selectedDiscountRange === '70'}
							onClick={() => setSelectedDiscountRange(selectedDiscountRange === '70' ? 'all' : '70')}
						>
							70%+ off ({discountStats['70']})
						</FilterButton>

						{/* Category Filters */}
						{categories.slice(0, 5).map(category => (
							<FilterButton
								key={category}
								active={selectedCategory === category}
								onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
							>
								{category}
							</FilterButton>
						))}

						{/* Additional Filters */}
						<FilterButton
							active={selectedGender === 'women'}
							onClick={() => setSelectedGender(selectedGender === 'women' ? 'all' : 'women')}
						>
							Women
						</FilterButton>
						
						<FilterButton
							active={selectedGender === 'men'}
							onClick={() => setSelectedGender(selectedGender === 'men' ? 'all' : 'men')}
						>
							Men
						</FilterButton>
					</div>

					{/* Sort and Results Count */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<p className="text-sm text-gray-600">
							{filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
							{selectedDiscountRange !== 'all' && ` with ${selectedDiscountRange}% off`}
							{selectedCategory !== 'all' && ` in ${selectedCategory}`}
						</p>
						<div className="flex items-center space-x-2">
							<span className="text-sm">Sort by</span>
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
							>
								<option value="discount-desc">Highest Discount</option>
								<option value="discount-asc">Lowest Discount</option>
								<option value="price-asc">Price: Low to High</option>
								<option value="price-desc">Price: High to Low</option>
								<option value="newest">Newest First</option>
							</select>
						</div>
					</div>

					{/* Active Filters Display */}
					{(selectedDiscountRange !== 'all' || selectedCategory !== 'all' || selectedGender !== 'all') && (
						<div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
							<span className="text-sm text-gray-600">Active filters:</span>
							{selectedDiscountRange !== 'all' && (
								<span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-black text-white">
									{selectedDiscountRange}% off
									<button
										onClick={() => setSelectedDiscountRange('all')}
										className="ml-2 hover:text-gray-300"
									>
										×
									</button>
								</span>
							)}
							{selectedCategory !== 'all' && (
								<span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-black text-white">
									{selectedCategory}
									<button
										onClick={() => setSelectedCategory('all')}
										className="ml-2 hover:text-gray-300"
									>
										×
									</button>
								</span>
							)}
							{selectedGender !== 'all' && (
								<span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-black text-white">
									{selectedGender}
									<button
										onClick={() => setSelectedGender('all')}
										className="ml-2 hover:text-gray-300"
									>
										×
									</button>
								</span>
							)}
							<button
								onClick={() => {
									setSelectedDiscountRange('all');
									setSelectedCategory('all');
									setSelectedGender('all');
								}}
								className="text-xs text-gray-500 hover:text-gray-700 underline"
							>
								Clear all
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Products Grid */}
			<div className="py-8">
				<div className="container mx-auto px-4">
					{saleLoading ? (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{Array.from({ length: 12 }).map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					) : filteredProducts.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500 text-lg mb-4">
								No sale items found matching your filters
							</p>
							<button
								onClick={() => {
									setSelectedDiscountRange('all');
									setSelectedCategory('all');
									setSelectedGender('all');
								}}
								className="text-black hover:underline"
							>
								Clear all filters
							</button>
						</div>
					) : (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{filteredProducts.map((product) => (
								<SaleProductCard
									key={product.product_id}
									product={product}
									onWishlistToggle={handleWishlistToggle}
									isInWishlist={isInWishlist(product.product_id)}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default function SalePage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-white">
				<div className="py-8">
					<div className="container mx-auto px-4">
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{Array.from({ length: 12 }).map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					</div>
				</div>
			</div>
		}>
			<SalePageContent />
		</Suspense>
	);
}