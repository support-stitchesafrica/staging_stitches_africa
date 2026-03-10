import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { productRepository } from "@/lib/firestore";
import { ProductCardSkeleton } from "@/components/ui/optimized-loader";
import { FarfetchProductCard } from "@/components/home/FarfetchProductCard";

interface TrendingSectionProps {
	onWishlistToggle: (productId: string) => void;
	wishlistItems: Set<string>;
}

// Trending Section Component - Uses same data as FeaturedProducts
export const TrendingSection = React.memo(
	({ onWishlistToggle, wishlistItems }: TrendingSectionProps) => {
		const [products, setProducts] = useState<Product[]>([]);
		const [loading, setLoading] = useState(true);

		// Featured vendor names - same as FeaturedProducts component
		const FEATURED_VENDOR_NAMES = [
			"trax apparel",
			"sade oni",
			"LOLA SIGNATURES",
			"Nancy Hanson",
			"Beads by Iccon",
			"Beckianahz gallery",
		];

		useEffect(() => {
			let isMounted = true;
			loadFeaturedProducts(isMounted);

			return () => {
				isMounted = false;
			};
		}, []);

		const loadFeaturedProducts = async (isMounted: boolean = true) => {
			try {
				if (isMounted) {
					setLoading(true);
				}

				// Use the same data fetching logic as FeaturedProducts
				let allProducts: Product[];
				try {
					// Direct Firestore query
					const db = await import("@/firebase").then((m) => m.db);
					const { collection, getDocs } = await import("firebase/firestore");

					const querySnapshot = await getDocs(collection(db, "tailor_works"));

					allProducts = [];
					querySnapshot.forEach((doc) => {
						const data = doc.data();
						// Only include products with images and basic validation
						if (data.images && data.images.length > 0 && data.title) {
							allProducts.push({
								product_id: doc.id,
								title: data.title,
								description: data.description || "",
								type: data.type || "ready-to-wear",
								category: data.category || "",
								availability: data.availability || "in_stock",
								status: data.status || "verified",
								price:
									typeof data.price === "object"
										? data.price
										: { base: data.price || 0, currency: "USD" },
								discount: data.discount || 0,
								deliveryTimeline: data.deliveryTimeline || "",
								returnPolicy: data.returnPolicy || "",
								rtwOptions: data.rtwOptions || { sizes: [], colors: [] },
								images: data.images || [],
								tailor_id: data.tailor_id || "",
								tailor:
									data.tailor ||
									data.vendor_name ||
									data.brand_name ||
									"Unknown Vendor",
								vendor: {
									id: data.tailor_id || "",
									name:
										data.vendor_name ||
										data.tailor ||
										data.brand_name ||
										"Unknown Vendor",
									email: data.email || "",
									phone: data.phone || "",
								},
								tags: data.tags || [],
								createdAt:
									data.createdAt?.toDate?.()?.toISOString() ||
									new Date().toISOString(),
								updatedAt:
									data.updatedAt?.toDate?.()?.toISOString() ||
									new Date().toISOString(),
							} as Product);
						}
					});
				} catch (directError) {
					// Fallback to repository method if direct query fails
					allProducts = await productRepository.getAll();
				}

				if (!isMounted) return;

				// Filter products from featured vendors (same logic as FeaturedProducts)
				const featuredProducts = allProducts.filter((product) => {
					// Only include products with images
					if (!product.images || product.images.length === 0) {
						return false;
					}
					const vendorName = product.vendor?.name || product.tailor || "";
					return FEATURED_VENDOR_NAMES.some(
						(featuredName) =>
							vendorName.toLowerCase().trim() ===
							featuredName.toLowerCase().trim(),
					);
				});

				// Shuffle and get random products for trending
				const shuffled = [...featuredProducts].sort(() => 0.5 - Math.random());
				const trendingProducts = shuffled.slice(0, 10);

				if (isMounted) {
					setProducts(trendingProducts);
				}
			} catch (err) {
				console.error("Error loading trending products:", err);
				if (isMounted) {
					setProducts([]);
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		if (loading) {
			return (
				<section className="py-8">
					<div className="container mx-auto px-4">
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
							{Array.from({ length: 10 }).map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					</div>
				</section>
			);
		}

		return (
			<section className="py-8">
				<div className="container mx-auto px-4">
					{products.length > 0 ? (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
							{products.map((product) => (
								<FarfetchProductCard
									key={product.product_id}
									product={product}
									onWishlistToggle={onWishlistToggle}
									isInWishlist={wishlistItems.has(product.product_id)}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-8">
							<p className="text-gray-500">No trending products available</p>
						</div>
					)}

					{/* View All Button */}
					{products.length > 0 && (
						<div className="text-center mt-8">
							<Link
								href="/shops/products"
								className="inline-block border border-gray-900 px-8 py-3 text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors"
							>
								View All Products
							</Link>
						</div>
					)}
				</div>
			</section>
		);
	},
);

TrendingSection.displayName = "TrendingSection";
