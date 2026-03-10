"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Product } from "@/types";
import { productRepository } from "@/lib/firestore";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCachedData } from "@/lib/utils/cache-utils";
import { ProductCardSkeleton } from "@/components/ui/optimized-loader";
import { Heart, Filter } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React from "react";

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

// Product Card Component
const NewInProductCard = React.memo(({ product, onWishlistToggle, isInWishlist }: {
	product: Product;
	onWishlistToggle?: (id: string) => void;
	isInWishlist?: boolean;
}) => {
	const router = useRouter();
	
	const { basePrice, discountedPrice } = useMemo(() => {
		const base = typeof product.price === 'number' ? product.price : product.price.base;
		const discounted = product.discount > 0 ? base * (1 - product.discount / 100) : base;
		return { basePrice: base, discountedPrice: discounted };
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
				{product.discount > 0 && (
					<div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-xs font-medium">
						{product.discount}% off
					</div>
				)}
				<div className="absolute top-3 left-3 bg-black text-white px-2 py-1 text-xs font-medium">
					NEW
				</div>
			</div>
			<div className="space-y-1">
				<p className="text-xs text-gray-500 uppercase tracking-wide">New Season</p>
				<h3 className="font-medium text-sm text-gray-900 line-clamp-2">{product.tailor || 'Designer'}</h3>
				<p className="text-sm text-gray-600 line-clamp-1">{product.title}</p>
				<div className="flex items-center space-x-2">
					{product.discount > 0 ? (
						<>
							<span className="text-sm font-medium text-gray-900">${discountedPrice.toFixed(0)}</span>
							<span className="text-sm text-gray-500 line-through">${basePrice.toFixed(0)}</span>
							<span className="text-xs text-red-600 font-medium">-{product.discount}%</span>
						</>
					) : (
						<span className="text-sm font-medium text-gray-900">${basePrice.toFixed(0)}</span>
					)}
				</div>
			</div>
		</div>
	);
});

NewInProductCard.displayName = 'NewInProductCard';

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
function NewInPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toggleItem, isInWishlist } = useWishlist();
	
	// Filter states
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [selectedType, setSelectedType] = useState<string>('all');
	const [sortBy, setSortBy] = useState<string>('newest');
	const [mounted, setMounted] = useState(false);

	// Handle client-side mounting
	useEffect(() => {
		setMounted(true);
	}, []);

	// Fetch new arrivals with enhanced fallback (last 30 days)
	const {
		data: newProductsRaw = [],
		loading: newProductsLoading,
	} = useCachedData(
		mounted ? 'new-arrivals-extended' : 'disabled',
		async () => {
			if (!mounted) return [];
			
			try {
				// First try the dedicated new arrivals method
				let products = await productRepository.getNewArrivalsWithTailorInfo(50);
				
				// If no results, get recent products from all products
				if (products.length === 0) {
					const allProducts = await productRepository.getAllWithTailorInfo();
					// Sort by creation date and take the most recent ones
					products = allProducts
						.sort((a, b) => {
							const dateA = new Date(a.createdAt || a.created_at || 0);
							const dateB = new Date(b.createdAt || b.created_at || 0);
							return dateB.getTime() - dateA.getTime();
						})
						.slice(0, 50);
				}
				
				return products;
			} catch (error) {
				console.error('Error fetching new arrivals:', error);
				return [];
			}
		},
		5 * 60 * 1000 // 5 minutes cache
	);

	const newProducts = Array.isArray(newProductsRaw) ? newProductsRaw : [];

	// Get unique categories from new products
	const categories = useMemo(() => {
		const cats = new Set<string>();
		newProducts.forEach(product => {
			if (product.category && product.category.trim()) {
				cats.add(product.category.trim());
			}
		});
		return Array.from(cats).sort();
	}, [newProducts]);

	// Filter and sort products
	const filteredProducts = useMemo(() => {
		let filtered = [...newProducts];

		// Filter by category
		if (selectedCategory !== 'all') {
			filtered = filtered.filter(product => 
				product.category?.toLowerCase() === selectedCategory.toLowerCase()
			);
		}

		// Filter by type
		if (selectedType !== 'all') {
			filtered = filtered.filter(product => product.type === selectedType);
		}

		// Sort products
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'newest':
					const dateA = new Date(a.createdAt || a.created_at || 0);
					const dateB = new Date(b.createdAt || b.created_at || 0);
					return dateB.getTime() - dateA.getTime();
				case 'price-asc':
					const priceA = typeof a.price === 'number' ? a.price : a.price.base;
					const priceB = typeof b.price === 'number' ? b.price : b.price.base;
					return priceA - priceB;
				case 'price-desc':
					const priceA2 = typeof a.price === 'number' ? a.price : a.price.base;
					const priceB2 = typeof b.price === 'number' ? b.price : b.price.base;
					return priceB2 - priceA2;
				case 'discount':
					return (b.discount || 0) - (a.discount || 0);
				default:
					return 0;
			}
		});

		return filtered;
	}, [newProducts, selectedCategory, selectedType, sortBy]);

	const handleWishlistToggle = async (productId: string) => {
		try {
			await toggleItem(productId);
		} catch (error) {
			console.error("Error toggling wishlist item:", error);
		}
	};

	// Show loading state until mounted
	if (!mounted) {
		return (
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
		);
	}

	return (
		<div className="min-h-screen bg-white">
			{/* Breadcrumb */}
			<div className="border-b border-gray-200 py-4">
				<div className="container mx-auto px-4">
					<div className="flex items-center text-sm text-gray-600">
						<Link href="/shops" className="hover:text-gray-900">Home</Link>
						<span className="mx-2">›</span>
						<span className="text-gray-900">New in</span>
					</div>
				</div>
			</div>

			{/* Hero Section */}
			<div className="py-12 bg-gray-50">
				<div className="container mx-auto px-4 text-center">
					<h1 className="text-4xl font-light mb-4">
						New in: handpicked daily from the world's best brands and boutiques
					</h1>
					<p className="text-gray-600 mb-8 max-w-2xl mx-auto">
						Discover the latest arrivals from our curated selection of African designers and international brands. 
						Fresh styles added daily to keep your wardrobe current.
					</p>
				</div>
			</div>

			{/* Filters */}
			<div className="border-b border-gray-200 py-6">
				<div className="container mx-auto px-4">
					<div className="flex flex-wrap items-center gap-4 mb-4">
						<div className="flex items-center space-x-2">
							<Filter className="w-4 h-4" />
							<span className="text-sm font-medium">Filters</span>
						</div>
						
						{/* Type Filters */}
						<FilterButton
							active={selectedType === 'bespoke'}
							onClick={() => setSelectedType(selectedType === 'bespoke' ? 'all' : 'bespoke')}
						>
							Bespoke
						</FilterButton>
						
						<FilterButton
							active={selectedType === 'ready-to-wear'}
							onClick={() => setSelectedType(selectedType === 'ready-to-wear' ? 'all' : 'ready-to-wear')}
						>
							Ready-to-Wear
						</FilterButton>

						{/* Category Filters */}
						{categories.slice(0, 6).map(category => (
							<FilterButton
								key={category}
								active={selectedCategory === category}
								onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
							>
								{category}
							</FilterButton>
						))}
					</div>

					{/* Sort and Results Count */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<p className="text-sm text-gray-600">
							{filteredProducts.length} new {filteredProducts.length === 1 ? 'item' : 'items'}
							{selectedCategory !== 'all' && ` in ${selectedCategory}`}
							{selectedType !== 'all' && ` (${selectedType})`}
						</p>
						<div className="flex items-center space-x-2">
							<span className="text-sm">Sort by</span>
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
							>
								<option value="newest">Newest First</option>
								<option value="price-asc">Price: Low to High</option>
								<option value="price-desc">Price: High to Low</option>
								<option value="discount">Highest Discount</option>
							</select>
						</div>
					</div>

					{/* Active Filters Display */}
					{(selectedCategory !== 'all' || selectedType !== 'all') && (
						<div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
							<span className="text-sm text-gray-600">Active filters:</span>
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
							{selectedType !== 'all' && (
								<span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-black text-white">
									{selectedType}
									<button
										onClick={() => setSelectedType('all')}
										className="ml-2 hover:text-gray-300"
									>
										×
									</button>
								</span>
							)}
							<button
								onClick={() => {
									setSelectedCategory('all');
									setSelectedType('all');
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
					{newProductsLoading ? (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{Array.from({ length: 12 }).map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					) : filteredProducts.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500 text-lg mb-4">
								No new items found matching your filters
							</p>
							<button
								onClick={() => {
									setSelectedCategory('all');
									setSelectedType('all');
								}}
								className="text-black hover:underline"
							>
								Clear all filters
							</button>
						</div>
					) : (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{filteredProducts.map((product) => (
								<NewInProductCard
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

export default function NewInPage() {
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
			<NewInPageContent />
		</Suspense>
	);
}