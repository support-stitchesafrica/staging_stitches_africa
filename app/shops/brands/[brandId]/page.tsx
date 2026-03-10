"use client";

import { useParams, useRouter } from "next/navigation";
import { productRepository } from "@/lib/firestore";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCachedData } from "@/lib/utils/cache-utils";
import { ProductCardSkeleton } from "@/components/ui/optimized-loader";
import { ArrowLeft, MapPin, Mail, Phone, Share2, Instagram, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { FarfetchProductCard } from "@/components/home/FarfetchProductCard";

export default function BrandPage() {
	const params = useParams();
	const router = useRouter();
	const { t } = useLanguage();
	const { toggleItem, isInWishlist } = useWishlist();
	const brandId = decodeURIComponent(params.brandId as string);

	// Fetch products for this brand
	const { data: productsRaw = [], loading: productsLoading } = useCachedData(
		`brand-products-${brandId}`,
		() => productRepository.getProductsByVendor(brandId),
		5 * 60 * 1000, // 5 minutes cache
	);

	const products = Array.isArray(productsRaw) ? productsRaw : [];
	const brandInfo = products[0]?.vendor; // Get brand info from first product

	const handleWishlistToggle = async (productId: string) => {
		try {
			await toggleItem(productId);
		} catch (error) {
			console.error("Error toggling wishlist item:", error);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			{/* Elegant Header with Back Button */}
			<div className="bg-white border-b border-gray-100">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<span
						onClick={() => router.back()}
						className="group flex items-center text-sm text-gray-600 hover:text-black transition-colors"
					>
						<ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
						{t.brandPage.backToBrands}
					</span>
				</div>
			</div>

			{/* Luxury Hero Section */}
			<div className="relative bg-white">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
					<div className="max-w-6xl mx-auto">
						<div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-16">
							{/* Brand Logo - Luxury Style */}
							<div className="relative group">
								<div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
								<div className="relative w-32 h-32 lg:w-40 lg:h-40 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border border-gray-100">
									{brandInfo?.logo ? (
										<Image
											src={brandInfo.logo}
											alt={brandInfo.name || "Brand"}
											width={160}
											height={160}
											className="object-contain p-4"
										/>
									) : (
										<span className="text-5xl font-light text-gray-400">
											{brandInfo?.name?.charAt(0) || "B"}
										</span>
									)}
								</div>
							</div>

							{/* Brand Information - Elegant Typography */}
							<div className="flex-1 text-center lg:text-left">
								<h1 className="text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight text-gray-900 mb-4">
									{brandInfo?.name || "Brand"}
								</h1>
								
								<p className="text-lg lg:text-xl text-gray-600 font-light leading-relaxed mb-8 max-w-2xl">
									Discover the latest collection from{" "}
									<span className="text-gray-900 font-normal">{brandInfo?.name || "this brand"}</span>, 
									featuring unique African-inspired designs and exceptional craftsmanship.
								</p>

								{/* Brand Contact Details - Refined */}
								

								{/* Action Buttons - Luxury Style */}
								
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Divider with Decorative Element */}
			<div className="relative py-8">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-gray-200"></div>
				</div>
				<div className="relative flex justify-center">
					<span className="bg-white px-6 text-sm text-gray-500 font-light tracking-widest uppercase">
						Collection
					</span>
				</div>
			</div>

			{/* Products Section - Luxury Grid */}
			<div className="py-12 lg:py-16">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8">
					{productsLoading ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
							{Array.from({ length: 12 }).map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					) : products.length === 0 ? (
						<div className="text-center py-20">
							<div className="max-w-md mx-auto">
								<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
									<span className="text-3xl">🎨</span>
								</div>
								<h3 className="text-2xl font-light text-gray-900 mb-3">
									No Products Yet
								</h3>
								<p className="text-gray-600 mb-8">
									This brand hasn't added any products to their collection yet.
								</p>
								<Link 
									href="/shops/brands" 
									className="inline-flex items-center px-6 py-3 bg-black text-white rounded-full hover:bg-gray-900 transition-all hover:shadow-lg"
								>
									<ArrowLeft className="w-4 h-4 mr-2" />
									{t.brandPage.backToBrands}
								</Link>
							</div>
						</div>
					) : (
						<>
							{/* Collection Header */}
							<div className="flex items-center justify-between mb-8 lg:mb-12">
								<div>
									<h2 className="text-2xl lg:text-3xl font-light text-gray-900 mb-2">
										{t.brandPage.productsTitle}
									</h2>
									<p className="text-sm text-gray-500 font-light">
										{products.length} {products.length === 1 ? 'piece' : 'pieces'} in this collection
									</p>
								</div>
								
								{/* Sort/Filter Options */}
								<div className="hidden md:flex items-center gap-4">
									<select className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-black transition-colors bg-white">
										<option>Sort by: Featured</option>
										<option>Price: Low to High</option>
										<option>Price: High to Low</option>
										<option>Newest First</option>
									</select>
								</div>
							</div>

							{/* Luxury Product Grid */}
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
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

			{/* Bottom CTA Section - Elegant */}
			{products.length > 0 && (
				<div className="bg-gradient-to-br from-gray-50 to-gray-100 py-16 lg:py-24">
					<div className="container mx-auto px-4 sm:px-6 lg:px-8">
						<div className="max-w-3xl mx-auto text-center">
							<h3 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
								Discover More Brands
							</h3>
							<p className="text-lg text-gray-600 font-light mb-8">
								Explore our curated selection of African designers and artisans
							</p>
							<Link 
								href="/shops/brands"
								className="inline-flex items-center px-8 py-4 bg-black text-white rounded-full hover:bg-gray-900 transition-all hover:shadow-xl text-sm font-medium"
							>
								Browse All Brands
								<ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
							</Link>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
