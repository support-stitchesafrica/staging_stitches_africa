"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productRepository } from "@/lib/firestore";
import { useCachedData } from "@/lib/utils/cache-utils";
import { ProductCardSkeleton } from "@/components/ui/optimized-loader";
import Link from "next/link";
import Image from "next/image";

// Category Card Component
const CategoryCard = ({ category, productCount, sampleImage }: {
	category: string;
	productCount: number;
	sampleImage?: string;
}) => {
	const router = useRouter();

	return (
		<div 
			className="group cursor-pointer"
			onClick={() => router.push(`/shops/products?category=${encodeURIComponent(category)}`)}
		>
			<div className="relative aspect-[4/5] mb-4 overflow-hidden bg-gray-100">
				{sampleImage ? (
					<Image
						src={sampleImage}
						alt={category}
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-300"
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
						<span className="text-2xl font-light text-gray-600 text-center px-4">
							{category}
						</span>
					</div>
				)}
				<div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300" />
				<div className="absolute bottom-4 left-4 right-4">
					<h3 className="text-lg font-medium text-white mb-1">
						{category}
					</h3>
					<p className="text-sm text-white opacity-90">
						{productCount} {productCount === 1 ? 'item' : 'items'}
					</p>
				</div>
			</div>
		</div>
	);
};

export default function CategoriesPage() {
	const router = useRouter();

	// Fetch categories data
	const {
		data: categoriesRaw = [],
		loading: categoriesLoading,
	} = useCachedData(
		'categories-list',
		() => productRepository.getCategories(),
		10 * 60 * 1000 // 10 minutes cache
	);

	// Fetch sample products for category images
	const {
		data: productsRaw = [],
		loading: productsLoading,
	} = useCachedData(
		'products-for-categories',
		() => productRepository.getAllWithTailorInfo(),
		5 * 60 * 1000 // 5 minutes cache
	);

	const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];
	const products = Array.isArray(productsRaw) ? productsRaw : [];

	// Create category data with product counts and sample images
	const categoryData = categories.map(category => {
		const categoryProducts = products.filter(product => 
			product.category?.toLowerCase() === category.toLowerCase()
		);
		
		return {
			name: category,
			productCount: categoryProducts.length,
			sampleImage: categoryProducts[0]?.images?.[0] || undefined
		};
	}).filter(cat => cat.productCount > 0); // Only show categories with products

	const loading = categoriesLoading || productsLoading;

	return (
		<div className="min-h-screen bg-white">
			{/* Header */}
			<div className="border-b border-gray-200 py-8">
				<div className="container mx-auto px-4">
					<h1 className="text-3xl font-light text-center mb-4">Categories</h1>
					<p className="text-gray-600 text-center max-w-2xl mx-auto">
						Explore our diverse collection of African fashion across different categories. 
						From traditional wear to contemporary designs, find exactly what you're looking for.
					</p>
				</div>
			</div>

			{/* Categories Grid */}
			<div className="py-12">
				<div className="container mx-auto px-4">
					{loading ? (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{Array.from({ length: 12 }).map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					) : categoryData.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500 text-lg">No categories found</p>
						</div>
					) : (
						<>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
								{categoryData.map((category) => (
									<CategoryCard
										key={category.name}
										category={category.name}
										productCount={category.productCount}
										sampleImage={category.sampleImage}
									/>
								))}
							</div>

							{/* Stats */}
							<div className="mt-12 text-center">
								<p className="text-gray-500">
									{categoryData.length} categories available
								</p>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}