"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { productRepository, collectionRepository } from "@/lib/firestore";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AppDownloadSection } from "@/components/AppDownloadSection";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { analytics, useAnalytics } from "@/lib/analytics";
import { useCachedData } from "@/lib/utils/cache-utils";
import { ShopSectionTabs } from "@/components/home/ShopSectionTabs";
import React from "react";

// Lazy load below-the-fold components with minimal loading states
const PromotionalEventHomeBanner = dynamic(
	() =>
		import("@/components/home/PromotionalEventHomeBanner").then((mod) => ({
			default: mod.PromotionalEventHomeBanner,
		})),
	{
		ssr: false,
		loading: () => <div className="h-24 bg-gray-50 animate-pulse" />,
	},
);

const CollectionBanner = dynamic(
	() =>
		import("@/components/home/CollectionBanner").then((mod) => ({
			default: mod.CollectionBanner,
		})),
	{
		ssr: false,
		loading: () => <div className="h-24 bg-gray-50 animate-pulse" />,
	},
);

const TailorStoryboardBanner = dynamic(
	() =>
		import("@/components/home/TailorStoryboardBanner").then((mod) => ({
			default: mod.TailorStoryboardBanner,
		})),
	{
		ssr: false,
		loading: () => <div className="h-24 bg-gray-50 animate-pulse" />,
	},
);

const BOGOPromotionBanner = dynamic(
	() =>
		import("@/components/home/BOGOPromotionBanner").then((mod) => ({
			default: mod.BOGOPromotionBanner,
		})),
	{
		ssr: false,
		loading: () => <div className="h-24 bg-gray-50 animate-pulse" />,
	},
);

const ReferAndEarnBanner = dynamic(
	() =>
		import("@/components/ReferAndEarnBanner").then((mod) => ({
			default: mod.default,
		})),
	{
		ssr: false,
		loading: () => <div className="h-24 bg-gray-50 animate-pulse" />,
	},
);

// Hero Banner Component - Memoized for performance
const HeroBanner = React.memo(() => {
	const { t } = useLanguage();
	const handleShopNowClick = useCallback(() => {
		// Add navigation logic here if needed
		console.log("Shop Now clicked");
	}, []);

	return (
		<section className="relative h-[60vh] flex items-center justify-center bg-gradient-to-r from-gray-900 to-gray-700">
			{/* Placeholder for banner logic if needed */}
			<div className="relative z-10 text-center text-white">
				<h1 className="text-4xl md:text-5xl font-light mb-4">
					{t.home.hero.backToBusiness}
				</h1>
				<p className="text-lg mb-8 max-w-md mx-auto">{t.home.hero.subtitle}</p>
				<button
					onClick={handleShopNowClick}
					className="border border-white px-8 py-3 text-sm font-medium hover:bg-white hover:text-black transition-colors"
				>
					{t.home.hero.shopNow}
				</button>
			</div>
		</section>
	);
});

HeroBanner.displayName = "HeroBanner";

export default function Home() {
	const router = useRouter();
	const [initialLoad, setInitialLoad] = useState(true);
	const { toggleItem, isInWishlist } = useWishlist();
	const { addCollectionToCart } = useCart();
	const { trackInteraction } = useAnalytics("ShopsHomePage");

	// Use cached data for better performance
	const { data: discountedProductsRaw = [], loading: discountedLoading } =
		useCachedData(
			"discounted-products",
			() =>
				productRepository
					.getDiscountedProductsWithTailorInfo()
					.then((products) => products.slice(0, 8)),
			5 * 60 * 1000, // 5 minutes cache
		);

	const { data: newArrivalsRaw = [], loading: arrivalsLoading } = useCachedData(
		"new-arrivals",
		() => productRepository.getNewArrivalsWithTailorInfo(15),
		5 * 60 * 1000, // 5 minutes cache
	);

	const { data: featuredProductsRaw = [], loading: featuredLoading } =
		useCachedData(
			"featured-products",
			() => productRepository.getFeaturedProducts(12),
			5 * 60 * 1000, // 5 minutes cache
		);

	// Ensure arrays are always valid and memoize them
	const discountedProducts = useMemo(
		() => (Array.isArray(discountedProductsRaw) ? discountedProductsRaw : []),
		[discountedProductsRaw],
	);
	const newArrivals = useMemo(
		() => (Array.isArray(newArrivalsRaw) ? newArrivalsRaw : []),
		[newArrivalsRaw],
	);
	const featuredProducts = useMemo(
		() => (Array.isArray(featuredProductsRaw) ? featuredProductsRaw : []),
		[featuredProductsRaw],
	);

	const loading = discountedLoading || arrivalsLoading || featuredLoading;

	// Track page view only once
	useEffect(() => {
		analytics.trackPageView("/shops", "Shops Home");
		setInitialLoad(false);
	}, []);

	// Memoize wishlist items to prevent infinite loops
	const wishlistItems = useMemo((): Set<string> => {
		const wishlistSet = new Set<string>();
		const allProducts = [
			...discountedProducts,
			...newArrivals,
			...featuredProducts,
		];
		allProducts.forEach((product) => {
			if (product && isInWishlist(product.product_id)) {
				wishlistSet.add(product.product_id);
			}
		});
		return wishlistSet;
	}, [discountedProducts, newArrivals, featuredProducts, isInWishlist]);

	// Optimized intersection observer hook
	const useIntersectionObserver = useCallback(
		(
			ref: React.RefObject<HTMLElement | null>,
			options: IntersectionObserverInit = {},
		) => {
			const [isIntersecting, setIsIntersecting] = useState(false);

			useEffect(() => {
				if (!ref.current) return;

				const observer = new IntersectionObserver(
					([entry]) => {
						if (entry.isIntersecting) {
							setIsIntersecting(true);
							observer.disconnect();
						}
					},
					{ threshold: 0.1, rootMargin: "300px", ...options },
				);

				observer.observe(ref.current);
				return () => observer.disconnect();
			}, [options]);

			return isIntersecting;
		},
		[],
	);

	// Optimized lazy section with lighter fallback
	const LazySection = useCallback(
		({
			children,
			fallback = <div className="h-32 bg-gray-50 animate-pulse" />,
		}: {
			children: React.ReactNode;
			fallback?: React.ReactNode;
		}) => {
			const ref = useRef<HTMLDivElement>(null);
			const isIntersecting = useIntersectionObserver(ref);

			return (
				<div ref={ref}>
					{isIntersecting ? (
						<Suspense fallback={fallback}>{children}</Suspense>
					) : (
						fallback
					)}
				</div>
			);
		},
		[useIntersectionObserver],
	);

	// Optimized pending collection handler - defer to avoid blocking initial render
	useEffect(() => {
		if (initialLoad) return; // Don't run on initial load

		const handlePendingCollection = async () => {
			const pendingCollectionId = sessionStorage.getItem("pendingCollectionId");
			if (!pendingCollectionId) return;

			try {
				sessionStorage.removeItem("pendingCollectionId");
				const collection =
					await collectionRepository.getById(pendingCollectionId);

				if (!collection) {
					toast.error("Collection not found");
					return;
				}

				const collectionProducts: Product[] = [];
				const productIds = collection.productIds || [];
				const userId = collection.createdBy || (collection as any).createdBy;

				// Batch process products in smaller chunks for better performance
				const chunkSize = 5;
				for (let i = 0; i < productIds.length; i += chunkSize) {
					const chunk = productIds.slice(i, i + chunkSize);
					const chunkPromises = chunk.map(async (productIdWithPrefix) => {
						try {
							if (productIdWithPrefix.startsWith("marketplace:")) {
								const actualProductId = productIdWithPrefix.replace(
									"marketplace:",
									"",
								);
								return await productRepository.getByIdWithTailorInfo(
									actualProductId,
								);
							} else if (productIdWithPrefix.startsWith("collection:")) {
								const actualProductId = productIdWithPrefix.replace(
									"collection:",
									"",
								);
								const collectionProduct =
									await collectionRepository.getCollectionProductById(
										actualProductId,
										userId,
									);

								if (collectionProduct) {
									return {
										product_id: collectionProduct.id || actualProductId,
										title: collectionProduct.title || "",
										description: collectionProduct.description || "",
										type: "ready-to-wear" as const,
										category: "",
										availability:
											collectionProduct.quantity > 0
												? ("in_stock" as const)
												: ("out_of_stock" as const),
										status: "verified" as const,
										price: {
											base: collectionProduct.price || 0,
											currency: "USD",
										},
										discount: 0,
										deliveryTimeline: "",
										returnPolicy: "",
										rtwOptions: {
											sizes: collectionProduct.size
												? [collectionProduct.size]
												: [],
											colors: collectionProduct.color
												? [collectionProduct.color]
												: [],
										},
										images: collectionProduct.images || [],
										tailor_id: collectionProduct.owner?.email || "",
										tailor: collectionProduct.brandName || "Collection Product",
										vendor: {
											id: collectionProduct.owner?.email || "",
											name: collectionProduct.brandName || "Collection Product",
											email: collectionProduct.owner?.email || "",
											phone: collectionProduct.owner?.phoneNumber || "",
										},
										tags: [],
										createdAt:
											collectionProduct.createdAt?.toDate?.()?.toISOString() ||
											new Date().toISOString(),
										updatedAt:
											collectionProduct.updatedAt?.toDate?.()?.toISOString() ||
											new Date().toISOString(),
									} as Product;
								}
								return null;
							} else {
								return await productRepository.getByIdWithTailorInfo(
									productIdWithPrefix,
								);
							}
						} catch (productError) {
							console.warn(
								`Failed to load product ${productIdWithPrefix}:`,
								productError,
							);
							return null;
						}
					});

					const chunkResults = await Promise.all(chunkPromises);
					chunkResults.forEach((product) => {
						if (product) collectionProducts.push(product);
					});
				}

				if (collectionProducts.length === 0) {
					toast.error("No products found in this collection");
					return;
				}

				const collectionName = collection.title || collection.name;
				addCollectionToCart(
					pendingCollectionId,
					collectionName,
					collectionProducts,
				);
				toast.success(`Added ${collectionName} to cart`);
				router.push("/shops/cart/collection");
			} catch (error: any) {
				console.error("Error processing collection:", error);
				toast.error(error?.message || "Failed to add collection to cart");
			}
		};

		// Defer collection handling to avoid blocking initial render
		const timeoutId = setTimeout(handlePendingCollection, 100);
		return () => clearTimeout(timeoutId);
	}, [initialLoad, router, addCollectionToCart]);

	const handleWishlistToggle = useCallback(
		async (productId: string) => {
			try {
				trackInteraction("wishlist-toggle", "click");
				await toggleItem(productId);
			} catch (error) {
				console.error("Error toggling wishlist item:", error);
			}
		},
		[toggleItem, trackInteraction],
	);

	return (
		<div className="min-h-screen bg-white">
			<CollectionBanner />

			{/* Replaced individual sections with ShopSectionTabs */}
			<ShopSectionTabs
				newArrivals={newArrivals}
				discountedProducts={discountedProducts}
				wishlistItems={wishlistItems}
				onWishlistToggle={handleWishlistToggle}
				loading={loading}
			/>

			{/* Promotional Events Banner Section - Lazy loaded */}
			<LazySection>
				<PromotionalEventHomeBanner />
			</LazySection>

			{/* BOGO Promotion Banner Section - Lazy loaded */}
			<LazySection>
				<BOGOPromotionBanner />
			</LazySection>

			{/* Tailor Storyboard Banner Section */}
			<LazySection>
				<TailorStoryboardBanner />
			</LazySection>

			{/* Below-the-fold content - Lazy loaded for performance */}
			<LazySection>
				<ReferAndEarnBanner />
			</LazySection>

			{/* App Download Section */}
			<AppDownloadSection />
		</div>
	);
}
