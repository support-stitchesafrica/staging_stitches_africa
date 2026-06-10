"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { productRepository } from "@/lib/firestore";
import { Price, DiscountedPrice } from "@/components/common/Price";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FeaturedProductsProps {
	title?: string;
	subtitle?: string;
}

// Featured vendor names to filter products
const FEATURED_VENDOR_NAMES = [
	"trax apparel",
	"sade oni",
	"LOLA SIGNATURES",
	"Nancy Hanson",
	"Beads by Iccon",
	"Beckianahz gallery",
];

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
	title = "Featured Products",
	subtitle = "Discover our curated collection from top designers",
}) => {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	const router = useRouter();

	useEffect(() => {
		let isMounted = true;
		loadFeaturedProducts(isMounted);

		return () => {
			isMounted = false;
		};
	}, []);

	// Navigation handlers - no authentication required
	const handleShopNow = useCallback(
		(productId: string) => {
			router.push(`/shops/products/${productId}`);
		},
		[router]
	);

	const handleViewAll = useCallback(() => {
		router.push("/shops/products");
	}, [router]);

	const loadFeaturedProducts = async (
		isMounted: boolean = true,
		retry: number = 0
	) => {
		try {
			if (isMounted) {
				setLoading(true);
				setError(null);
			}

			// Progressive timeout: 10 seconds for first attempt, 15 for retry
			const timeoutDuration = retry > 0 ? 15000 : 10000;
			const timeoutPromise = new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("Request timeout")), timeoutDuration)
			);

			// Use faster direct Firestore query instead of slow getAllWithTailorInfo
			let allProducts: Product[];
			try {
				console.log("FeaturedProducts: Using direct Firestore query...");
				
				// Direct Firestore query without the slow tailor enrichment
				const db = await import('@/firebase').then(m => m.db);
				const { collection, getDocs } = await import('firebase/firestore');
				
				const querySnapshot = await Promise.race([
					getDocs(collection(db, 'tailor_works')),
					timeoutPromise,
				]);

				allProducts = [];
				querySnapshot.forEach((doc) => {
					const data = doc.data();
					// Only include products with images and basic validation
					if (data.images && data.images.length > 0 && data.title) {
						allProducts.push({
							product_id: doc.id,
							title: data.title,
							description: data.description || '',
							type: data.type || 'ready-to-wear',
							category: data.category || '',
							availability: data.availability || 'in_stock',
							status: data.status || 'verified',
							price: typeof data.price === 'object' ? data.price : { base: data.price || 0, currency: 'USD' },
							discount: data.discount || 0,
							deliveryTimeline: data.deliveryTimeline || '',
							returnPolicy: data.returnPolicy || '',
							rtwOptions: data.rtwOptions || { sizes: [], colors: [] },
							images: data.images || [],
							tailor_id: data.tailor_id || '',
							tailor: data.tailor || data.vendor_name || data.brand_name || 'Unknown Vendor',
							vendor: {
								id: data.tailor_id || '',
								name: data.vendor_name || data.tailor || data.brand_name || 'Unknown Vendor',
								email: data.email || '',
								phone: data.phone || '',
							},
							tags: data.tags || [],
							createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
							updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
						} as Product);
					}
				});

				console.log(`FeaturedProducts: Loaded ${allProducts.length} products directly`);
			} catch (directError) {
				console.log("FeaturedProducts: Direct query failed, falling back to repository...");
				// Fallback to repository method if direct query fails
				try {
					allProducts = await Promise.race([
						productRepository.getAll(),
						timeoutPromise,
					]);
				} catch (fallbackError) {
					throw new Error("Failed to load products from database");
				}
			}

			if (!isMounted) return;

			// Filter products from featured vendors (case-insensitive)
			const featuredProducts = allProducts.filter((product) => {
				// Only include products with images
				if (!product.images || product.images.length === 0) {
					return false;
				}
				const vendorName = product.vendor?.name || product.tailor || "";
				return FEATURED_VENDOR_NAMES.some(
					(featuredName) =>
						vendorName.toLowerCase().trim() ===
						featuredName.toLowerCase().trim()
				);
			});

			// If no featured products found, show empty state instead of error
			if (featuredProducts.length === 0) {
				if (isMounted) {
					setProducts([]);
					setError(null);
				}
				return;
			}

			// Shuffle and get random products
			const shuffled = [...featuredProducts].sort(() => 0.5 - Math.random());
			const randomProducts = shuffled.slice(0, 10);

			if (isMounted) {
				setProducts(randomProducts);
				setRetryCount(0); // Reset retry count on success
			}
		} catch (err) {
			console.error("Error loading featured products:", err);

			if (!isMounted) return;

			// Retry logic: retry up to 2 times
			if (retry < 2) {
				setRetryCount(retry + 1);
				setTimeout(() => {
					loadFeaturedProducts(isMounted, retry + 1);
				}, 2000 * (retry + 1)); // Exponential backoff: 2s, 4s
			} else {
				setError("Failed to load featured products. Please try again.");
			}
		} finally {
			if (isMounted) {
				setLoading(false);
			}
		}
	};

	if (loading) {
		return (
			<section className="py-12 bg-white">
				<div className="container mx-auto px-4">
					<div className="text-center mb-8">
						<h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
						<p className="text-gray-600">{subtitle}</p>
					</div>
					<div className="flex gap-4 overflow-x-auto pb-4">
						{Array.from({ length: 10 }).map((_, index) => (
							<div
								key={index}
								className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md animate-pulse"
							>
								<div className="h-48 bg-gray-200 rounded-t-lg"></div>
								<div className="p-4">
									<div className="h-4 bg-gray-200 rounded mb-2"></div>
									<div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
									<div className="h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
									<div className="h-8 bg-gray-200 rounded"></div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		);
	}

	if (error) {
		return (
			<section className="py-12 bg-white">
				<div className="container mx-auto px-4 text-center">
					<div className="text-red-600 mb-4">{error}</div>
					<button
						onClick={() => {
							setRetryCount(0);
							loadFeaturedProducts(true, 0);
						}}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Try Again
					</button>
					{retryCount > 0 && (
						<p className="text-sm text-gray-500 mt-2">
							Retry attempt: {retryCount}/2
						</p>
					)}
				</div>
			</section>
		);
	}

	if (products.length === 0) {
		return (
			<section className="py-12 bg-white">
				<div className="container mx-auto px-4 text-center">
					<h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
					<p className="text-gray-600">
						No featured products available at the moment.
					</p>
				</div>
			</section>
		);
	}

	return (
		<section className="py-12 bg-white">
			<div className="container mx-auto px-4">
				{/* Section Header */}
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
					<p className="text-gray-600">{subtitle}</p>
				</div>

				{/* Products Slider */}
				<div className="relative">
					<div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
						{products.map((product) => {
							const basePrice =
								typeof product.price === "number"
									? product.price
									: product.price.base;
							const hasDiscount = product.discount > 0;

							return (
								<div
									key={product.product_id}
									className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
								>
									{/* Product Image */}
									<div className="relative h-48 overflow-hidden rounded-t-lg">
										<Image
											src={product.images[0] || "/images/no-item.PNG"}
											alt={product.title}
											fill
											className="object-cover hover:scale-105 transition-transform duration-300"
											sizes="(max-width: 768px) 256px, 256px"
										/>
										{hasDiscount && (
											<div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
												-{product.discount}%
											</div>
										)}
										<div className="absolute top-2 right-2">
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${
													product.type === "bespoke"
														? "bg-purple-100 text-purple-800"
														: "bg-blue-100 text-blue-800"
												}`}
											>
												{product.type === "bespoke" ? "Bespoke" : "RTW"}
											</span>
										</div>
									</div>

									{/* Product Info */}
									<div className="p-4">
										<h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
											{product.title}
										</h3>
										<p className="text-gray-600 text-xs mb-2">
											by{" "}
											{product.vendor?.name ||
												product.tailor ||
												"Unknown Vendor"}
										</p>

										{/* Price */}
										<div className="flex items-center gap-2 mb-3">
											{hasDiscount ? (
												<DiscountedPrice
													originalPrice={basePrice}
													salePrice={basePrice * (1 - product.discount / 100)}
													originalCurrency="USD"
													size="sm"
												/>
											) : (
												<Price
													price={basePrice}
													originalCurrency="USD"
													size="sm"
													variant="accent"
												/>
											)}
										</div>

										{/* Shop Now Button */}
										<button
											onClick={() => handleShopNow(product.product_id)}
											className="w-full bg-black text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
										>
											Shop Now
										</button>
									</div>
								</div>
							);
						})}
					</div>

					{/* Scroll Indicators */}
					<div className="flex justify-center mt-4">
						<div className="flex items-center gap-2">
							<ChevronLeft className="w-5 h-5 text-gray-400" />
							<span className="text-sm text-gray-500">Scroll to see more</span>
							<ChevronRight className="w-5 h-5 text-gray-400" />
						</div>
					</div>
				</div>

				{/* View All Products Link */}
				<div className="text-center mt-8">
					<button
						onClick={handleViewAll}
						className="px-6 py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-black hover:text-white transition-colors"
					>
						View All Products
					</button>
				</div>
			</div>
		</section>
	);
};
