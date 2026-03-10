"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Product } from "@/types";
import { productRepository } from "@/lib/firestore";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCachedData } from "@/lib/utils/cache-utils";
import { ProductCardSkeleton } from "@/components/ui/optimized-loader";
import { Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Farfetch-style Product Card Component
const FarfetchProductCard = ({ product, onWishlistToggle, isInWishlist }: {
	product: Product;
	onWishlistToggle?: (id: string) => void;
	isInWishlist?: boolean;
}) => {
	const router = useRouter();
	const basePrice = typeof product.price === 'number' ? product.price : product.price.base;
	const discountedPrice = product.discount > 0 ? basePrice * (1 - product.discount / 100) : basePrice;

	return (
		<div className="group cursor-pointer" onClick={() => router.push(`/shops/products/${product.product_id}`)}>
			<div className="relative aspect-[3/4] mb-3 overflow-hidden">
				<Image
					src={product.images?.[0] || '/placeholder-product.svg'}
					alt={product.title}
					fill
					className="object-cover group-hover:scale-105 transition-transform duration-300"
				/>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onWishlistToggle?.(product.product_id);
					}}
					className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
				</button>
				{product.discount > 0 && (
					<div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-xs font-medium">
						{product.discount}% off
					</div>
				)}
			</div>
			<div className="space-y-1">
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
};

export default function CategoryPage() {
	const params = useParams();
	const router = useRouter();
	const { toggleItem, isInWishlist } = useWishlist();
	const category = decodeURIComponent(params.category as string);

	// Fetch products for this category
	const {
		data: productsRaw = [],
		loading: productsLoading,
	} = useCachedData(
		`category-products-${category}`,
		() => productRepository.getProductsByCategory(category),
		5 * 60 * 1000 // 5 minutes cache
	);

	const products = Array.isArray(productsRaw) ? productsRaw : [];

	const handleWishlistToggle = async (productId: string) => {
		try {
			await toggleItem(productId);
		} catch (error) {
			console.error("Error toggling wishlist item:", error);
		}
	};

	return (
		<div className="min-h-screen bg-white">
			{/* Header */}
			<div className="border-b border-gray-200 py-8">
				<div className="container mx-auto px-4">
					<div className="flex items-center mb-4">
						<button
							onClick={() => router.back()}
							className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
						>
							<ArrowLeft className="w-5 h-5 mr-2" />
							Back
						</button>
					</div>
					<h1 className="text-3xl font-light mb-4 capitalize">{category}</h1>
					<p className="text-gray-600 max-w-2xl">
						Discover our collection of {category.toLowerCase()} from talented African designers and brands.
					</p>
				</div>
			</div>

			{/* Products Grid */}
			<div className="py-12">
				<div className="container mx-auto px-4">
					{productsLoading ? (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{Array.from({ length: 12 }).map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					) : products.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500 text-lg mb-4">
								No products found in {category.toLowerCase()}
							</p>
							<Link
								href="/shops/categories"
								className="text-black hover:underline"
							>
								Browse all categories
							</Link>
						</div>
					) : (
						<>
							<div className="flex items-center justify-between mb-8">
								<p className="text-gray-600">
									{products.length} {products.length === 1 ? 'item' : 'items'} found
								</p>
							</div>

							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
								{products.map((product) => (
									<FarfetchProductCard
										key={product.product_id}
										product={product}
										onWishlistToggle={handleWishlistToggle}
										isInWishlist={isInWishlist(product.product_id)}
									/>
								))}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}