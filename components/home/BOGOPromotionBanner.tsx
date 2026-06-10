"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import {
	ChevronLeft,
	ChevronRight,
	Gift,
	ShoppingBag,
	Sparkles,
} from "lucide-react";
import {
	SPECIFIC_BOGO_MAPPINGS,
	PRODUCT_ID_MAPPINGS,
} from "@/lib/bogo/configure-specific-mappings";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { trackBogoView } from "@/lib/bogo/client-analytics";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTranslatedText } from "@/lib/i18n/useTranslatedText";

interface BOGOProduct {
	id: string;
	title: string;
	price: number;
	image: string;
	vendor?: string;
}

interface BOGOMapping {
	id: string;
	mainProduct: BOGOProduct;
	freeProducts: BOGOProduct[];
	promotionName: string;
	description: string;
	badge: string;
}

// Utility function to safely extract price from Firestore data
const extractPrice = (priceData: any): number => {
	if (typeof priceData === "number") {
		return priceData;
	}
	if (typeof priceData === "object" && priceData !== null) {
		return priceData.base || priceData.amount || 0;
	}
	return 0;
};

// Calculate countdown timer
const calculateTimeLeft = (endDate: Date) => {
	const now = new Date().getTime();
	const targetTime = endDate.getTime();
	const difference = targetTime - now;

	if (difference > 0) {
		return {
			days: Math.floor(difference / (1000 * 60 * 60 * 24)),
			hours: Math.floor(
				(difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
			),
			minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
			seconds: Math.floor((difference % (1000 * 60)) / 1000),
		};
	}

	return { days: 0, hours: 0, minutes: 0, seconds: 0 };
};

// Optimized image component with error handling
const OptimizedImage = React.memo(
	({
		src,
		alt,
		className,
		fill,
		sizes,
		priority = false,
		onFailure,
	}: {
		src: string;
		alt: string;
		className?: string;
		fill?: boolean;
		sizes?: string;
		priority?: boolean;
		onFailure?: (src: string) => void;
	}) => {
		const [imgSrc, setImgSrc] = useState(src);

		useEffect(() => {
			setImgSrc(src);
		}, [src]);

		const handleError = useCallback(() => {
			if (imgSrc !== "/images/placeholder-product.svg") {
				setImgSrc("/images/placeholder-product.svg");
				if (onFailure) {
					onFailure(src);
				}
			}
		}, [imgSrc, src, onFailure]);

		return (
			<NextImage
				src={imgSrc}
				alt={alt}
				fill={fill}
				className={className}
				sizes={sizes}
				priority={priority}
				onError={handleError}
				loading={priority ? "eager" : "lazy"}
			/>
		);
	},
);

// Separated Countdown Timer Component to prevent re-renders of the main banner
// Separated Countdown Timer Component to prevent re-renders of the main banner
const CountdownTimer = React.memo(({ endDate }: { endDate: Date }) => {
	const { t } = useLanguage();
	const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endDate));

	useEffect(() => {
		// Update immediately
		setTimeLeft(calculateTimeLeft(endDate));

		const timer = setInterval(() => {
			setTimeLeft(calculateTimeLeft(endDate));
		}, 1000);

		return () => clearInterval(timer);
	}, [endDate]);

	const isPromotionEnded =
		timeLeft.days === 0 &&
		timeLeft.hours === 0 &&
		timeLeft.minutes === 0 &&
		timeLeft.seconds === 0;

	return (
		<div
			className={`mt-8 inline-flex items-center gap-4 px-8 py-4 backdrop-blur-sm rounded-2xl shadow-2xl border transition-all duration-300 ${
				timeLeft.days === 0 && timeLeft.hours < 24
					? "bg-red-100/90 border-red-300 animate-pulse"
					: "bg-white/90 border-white/30 hover:shadow-3xl"
			}`}
		>
			<span
				className={`text-sm font-semibold ${
					isPromotionEnded
						? "text-gray-500"
						: timeLeft.days === 0 && timeLeft.hours < 24
							? "text-red-700"
							: "text-gray-700"
				}`}
			>
				{isPromotionEnded
					? `⏰ ${t.promotion.expired}`
					: timeLeft.days === 0 && timeLeft.hours < 24
						? `🔥 Hurry! ${t.promotion.endsIn}`
						: `🔥 ${t.promotion.endsIn}`}
			</span>
			<div className="flex gap-3">
				{isPromotionEnded ? (
					<div className="text-center">
						<div className="text-2xl md:text-3xl font-black text-gray-500">
							EXPIRED
						</div>
						<div className="text-xs text-gray-400 font-medium">
							Check back for new offers!
						</div>
					</div>
				) : (
					<>
						{timeLeft.days > 0 && (
							<>
								<div className="text-center">
									<div
										className={`text-2xl md:text-3xl font-black transition-colors duration-300 ${
											timeLeft.days === 0 && timeLeft.hours < 24
												? "text-red-700 animate-bounce"
												: "text-red-600 animate-pulse"
										}`}
									>
										{timeLeft.days.toString().padStart(2, "0")}
									</div>
									<div className="text-xs text-gray-500 font-medium">DAYS</div>
								</div>
								<div className="text-red-600 font-bold text-xl animate-pulse">
									:
								</div>
							</>
						)}
						<div className="text-center">
							<div
								className={`text-2xl md:text-3xl font-black transition-colors duration-300 ${
									timeLeft.days === 0 && timeLeft.hours < 24
										? "text-red-700 animate-bounce"
										: "text-red-600 animate-pulse"
								}`}
							>
								{timeLeft.hours.toString().padStart(2, "0")}
							</div>
							<div className="text-xs text-gray-500 font-medium">HRS</div>
						</div>
						<div className="text-red-600 font-bold text-xl animate-pulse">
							:
						</div>
						<div className="text-center">
							<div
								className={`text-2xl md:text-3xl font-black transition-colors duration-300 ${
									timeLeft.days === 0 && timeLeft.hours < 24
										? "text-red-700 animate-bounce"
										: "text-red-600 animate-pulse"
								}`}
							>
								{timeLeft.minutes.toString().padStart(2, "0")}
							</div>
							<div className="text-xs text-gray-500 font-medium">MIN</div>
						</div>
						<div className="text-red-600 font-bold text-xl animate-pulse">
							:
						</div>
						<div className="text-center">
							<div
								className={`text-2xl md:text-3xl font-black transition-colors duration-300 ${
									timeLeft.days === 0 && timeLeft.hours < 24
										? "text-red-700 animate-bounce"
										: "text-red-600 animate-pulse"
								}`}
							>
								{timeLeft.seconds.toString().padStart(2, "0")}
							</div>
							<div className="text-xs text-gray-500 font-medium">SEC</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
});

export const BOGOPromotionBanner: React.FC = () => {
	const { t } = useLanguage();
	const [bogoMappings, setBogoMappings] = useState<BOGOMapping[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
		new Set(),
	);

	const currentMappingForTranslation =
		bogoMappings.length > 0 ? bogoMappings[currentIndex] : undefined;
	const translatedMainTitle = useTranslatedText(
		currentMappingForTranslation?.mainProduct?.title,
	);
	const translatedDescription = useTranslatedText(
		currentMappingForTranslation?.description,
	);

	// Memoize the BOGO mappings to avoid unnecessary re-renders
	const memoizedMappings = React.useMemo(() => bogoMappings, [bogoMappings]);

	const router = useRouter();

	useEffect(() => {
		loadBOGOProducts();
	}, []);

	// Handle image load errors
	// Handle image load errors
	const handleImageError = useCallback((imageUrl: string) => {
		setImageLoadErrors((prev) => new Set(prev).add(imageUrl));
	}, []);

	const loadBOGOProducts = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			console.log("[BOGOPromotionBanner] Loading BOGO products...");

			// Filter active mappings first to reduce API calls
			const now = new Date();
			const activeMappings = SPECIFIC_BOGO_MAPPINGS.filter((mapping) => {
				const startDate =
					mapping.promotionStartDate instanceof Date
						? mapping.promotionStartDate
						: new Date(mapping.promotionStartDate as any);
				const endDate =
					mapping.promotionEndDate instanceof Date
						? mapping.promotionEndDate
						: new Date(mapping.promotionEndDate as any);

				console.log(
					`[BOGOPromotionBanner] Checking mapping ${mapping.mainProductId}:`,
					{
						startDate: startDate.toISOString(),
						endDate: endDate.toISOString(),
						now: now.toISOString(),
						isActive: now >= startDate && now <= endDate,
					},
				);

				return now >= startDate && now <= endDate;
			});

			if (activeMappings.length === 0) {
				console.log("[BOGOPromotionBanner] No active BOGO promotions");
				setBogoMappings([]);
				return;
			}

			// Batch fetch products to improve performance
			const productIds = new Set<string>();
			activeMappings.forEach((mapping) => {
				productIds.add(mapping.mainProductId);
				mapping.freeProductIds.forEach((id) => productIds.add(id));
			});

			// Fetch all products in parallel with timeout
			const FETCH_TIMEOUT = 10000; // 10 seconds timeout
			const productPromises = Array.from(productIds).map(async (productId) => {
				try {
					const timeoutPromise = new Promise<never>((_, reject) =>
						setTimeout(
							() => reject(new Error(`Timeout fetching ${productId}`)),
							FETCH_TIMEOUT,
						),
					);

					const productDoc = await Promise.race([
						getDoc(doc(db, "tailor_works", productId)),
						timeoutPromise,
					]);

					if (productDoc.exists()) {
						return { id: productId, data: productDoc.data() };
					}
				} catch (error) {
					console.error(`Error fetching product ${productId}:`, error);
				}
				return null;
			});

			const productResults = await Promise.all(productPromises);
			const productMap = new Map();
			productResults.forEach((result) => {
				if (result) {
					productMap.set(result.id, result.data);
				}
			});

			// Build mappings using cached product data
			const mappings: BOGOMapping[] = [];
			for (const mapping of activeMappings) {
				try {
					const mainProductData = productMap.get(mapping.mainProductId);
					if (!mainProductData) {
						console.warn(`Main product not found: ${mapping.mainProductId}`);
						continue;
					}

					const mainProduct: BOGOProduct = {
						id: mapping.mainProductId,
						title: mainProductData.title || "Unknown Product",
						price: extractPrice(mainProductData.price),
						image:
							mainProductData.images?.[0] || "/images/placeholder-product.svg",
						// Handle vendor name - check multiple possible fields
						...(mainProductData.vendor_name ||
						mainProductData.tailor_name ||
						mainProductData.brand_name ||
						mainProductData.vendor?.name
							? {
									vendor:
										mainProductData.vendor_name ||
										mainProductData.tailor_name ||
										mainProductData.brand_name ||
										mainProductData.vendor?.name,
								}
							: {}),
					};

					// Build free products from cached data
					const freeProducts: BOGOProduct[] = [];
					for (const freeProductId of mapping.freeProductIds) {
						const freeProductData = productMap.get(freeProductId);
						if (freeProductData) {
							freeProducts.push({
								id: freeProductId,
								title: freeProductData.title || "Unknown Product",
								price: extractPrice(freeProductData.price),
								image:
									freeProductData.images?.[0] ||
									"/images/placeholder-product.svg",
								// Handle vendor name - check multiple possible fields
								...(freeProductData.vendor_name ||
								freeProductData.tailor_name ||
								freeProductData.brand_name ||
								freeProductData.vendor?.name
									? {
											vendor:
												freeProductData.vendor_name ||
												freeProductData.tailor_name ||
												freeProductData.brand_name ||
												freeProductData.vendor?.name,
										}
									: {}),
							});
						}
					}

					if (freeProducts.length > 0) {
						mappings.push({
							id: mapping.mainProductId,
							mainProduct,
							freeProducts,
							promotionName: mapping.promotionName || "BOGO Promotion",
							description: mapping.description || "Buy one, get one free!",
							badge: "BOGO",
						});
					}
				} catch (err) {
					console.error(
						`Error processing mapping ${mapping.mainProductId}:`,
						err,
					);
				}
			}

			console.log(
				`[BOGOPromotionBanner] Loaded ${mappings.length} BOGO mappings`,
			);
			setBogoMappings(mappings);
		} catch (err: any) {
			console.error("[BOGOPromotionBanner] Error loading BOGO products:", err);
			setError(`Failed to load BOGO promotions: ${err.message}`);
		} finally {
			setLoading(false);
		}
	}, []);

	const handleShopNow = useCallback(
		(productId: string, mappingId?: string) => {
			// Track BOGO view when user clicks to shop
			if (mappingId) {
				trackBogoView(mappingId, productId, {
					metadata: {
						source: "bogo_banner",
						action: "shop_now_click",
					},
				});
			}
			router.push(`/shops/products/${productId}`);
		},
		[router],
	);

	const handlePrevious = () => {
		setCurrentIndex((prev) =>
			prev === 0 ? bogoMappings.length - 1 : prev - 1,
		);
	};

	const handleNext = () => {
		setCurrentIndex((prev) =>
			prev === bogoMappings.length - 1 ? 0 : prev + 1,
		);
	};

	// Auto-slide functionality with memoized mappings
	useEffect(() => {
		if (memoizedMappings.length <= 1) return;

		const interval = setInterval(() => {
			setCurrentIndex((prev) =>
				prev === memoizedMappings.length - 1 ? 0 : prev + 1,
			);
		}, 5000); // Change slide every 5 seconds

		return () => clearInterval(interval);
	}, [memoizedMappings.length]);

	// Don't render anything if loading
	if (loading) {
		return (
			<section className="py-8 md:py-12 bg-gradient-to-br from-red-50 via-pink-50 to-purple-50">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 rounded w-1/3 mb-4 mx-auto"></div>
						<div className="h-4 bg-gray-200 rounded w-1/2 mb-8 mx-auto"></div>
						<div className="bg-gray-200 rounded-xl h-96"></div>
					</div>
				</div>
			</section>
		);
	}

	// Don't render if there's an error or no mappings
	if (error) {
		console.error("BOGOPromotionBanner error:", error);
		return null;
	}

	if (bogoMappings.length === 0) {
		console.log("BOGOPromotionBanner: No BOGO mappings to display");
		return null;
	}

	const currentMapping = bogoMappings[currentIndex];

	// Additional safety check
	if (
		!currentMapping ||
		!currentMapping.mainProduct ||
		!currentMapping.freeProducts
	) {
		console.warn("BOGOPromotionBanner: Invalid mapping data", currentMapping);
		return null;
	}

	return (
		<section className="relative py-12 md:py-20 lg:py-24 overflow-hidden">
			{/* Advanced Background with Multiple Layers */}
			<div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50"></div>

			{/* Animated Background Pattern */}
			<div className="absolute inset-0 opacity-30">
				<div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-100/20 via-transparent to-pink-100/20 animate-pulse"></div>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.1),transparent_50%)]"></div>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.1),transparent_50%)]"></div>
			</div>

			{/* Floating Elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-red-200/40 to-pink-200/40 rounded-full blur-xl animate-float"></div>
				<div className="absolute top-1/3 -left-12 w-40 h-40 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-2xl animate-float-delayed"></div>
				<div className="absolute -bottom-10 right-1/3 w-28 h-28 bg-gradient-to-br from-purple-200/40 to-red-200/40 rounded-full blur-xl animate-float-slow"></div>

				{/* Sparkle Effects */}
				<div className="absolute top-20 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-twinkle"></div>
				<div className="absolute top-40 right-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full animate-twinkle-delayed"></div>
				<div className="absolute bottom-32 left-1/3 w-2.5 h-2.5 bg-red-400 rounded-full animate-twinkle-slow"></div>
			</div>

			<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
				{/* Enhanced Header with Advanced Typography */}
				<div className="text-center mb-12 md:mb-16 lg:mb-20 relative">
					{/* Animated Badge with Glow Effect */}
					<div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white rounded-full font-bold text-sm md:text-base mb-8 shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group">
						{/* Badge background animation */}
						<div className="absolute inset-0 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						<Gift className="w-5 h-5 animate-pulse relative z-10" />
						<span className="tracking-wide relative z-10">
							{t.bogo.limitedOffer}
						</span>
						<Sparkles className="w-5 h-5 animate-spin-slow relative z-10" />
						{/* Shine effect */}
						<div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
					</div>

					{/* Main Title with 3D Effect */}
					<div className="relative mb-8">
						<h2 className="text-xl md:text-2xl lg:text-3xl xl:text-3xl font-black text-gray-900 leading-tight relative">
							<span className="block mb-2 transform hover:scale-105 transition-transform duration-300">
								Buy One,
							</span>
							<span className="block relative">
								Get One{" "}
								<span className="relative inline-block group">
									<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 animate-gradient-x font-extrabold">
										FREE
									</span>
									{/* 3D shadow effect */}
									<span className="absolute top-1 left-1 text-red-200 -z-10 font-extrabold">
										FREE
									</span>
									{/* Decorative underline */}
									<div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
								</span>
							</span>
						</h2>

						{/* Floating decorative elements around title */}
						<div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 rounded-full animate-float opacity-70 shadow-lg"></div>
						<div className="absolute -top-2 -right-6 w-6 h-6 bg-pink-400 rounded-full animate-float-delayed opacity-60 shadow-lg"></div>
						<div className="absolute -bottom-4 left-1/4 w-4 h-4 bg-red-400 rounded-full animate-float-slow opacity-80 shadow-lg"></div>
					</div>

					{/* Enhanced Subtitle with Rich Content */}
					<div className="max-w-4xl mx-auto space-y-4">
						<p className="text-xl md:text-xl lg:text-xl text-gray-700 font-medium leading-relaxed">
							🎄{" "}
							<span className="font-bold text-green-600">
								December Special:
							</span>{" "}
							Purchase any featured item and get a
							<span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mx-2">
								premium gift
							</span>
							absolutely free!
						</p>
						<p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
							Discover amazing deals with our exclusive Buy One Get One Free
							promotion.
							<span className="font-semibold text-red-600 animate-pulse">
								Limited quantities available!
							</span>
						</p>
					</div>

					{/* Real-time Countdown Timer */}
					{(() => {
						const currentPromotion = SPECIFIC_BOGO_MAPPINGS.find(
							(mapping) =>
								mapping.mainProductId === currentMapping.mainProduct.id,
						);
						if (!currentPromotion) return null;

						const endDate =
							currentPromotion.promotionEndDate instanceof Date
								? currentPromotion.promotionEndDate
								: new Date(currentPromotion.promotionEndDate as any);

						return <CountdownTimer endDate={endDate} />;
					})()}
				</div>

				{/* Desktop: Advanced Two-grid layout */}
				<div className="hidden md:grid md:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
					{/* Left side - Enhanced Product showcase */}
					<div className="relative group">
						{/* Glowing background effect */}
						<div className="absolute -inset-6 bg-gradient-to-r from-red-200/50 via-pink-200/50 to-purple-200/50 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
						<div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/30 transform hover:scale-[1.02] transition-all duration-500 hover:shadow-3xl overflow-hidden">
							{/* Card background pattern */}
							<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-50 to-pink-50 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
							{/* Enhanced Main Product */}
							<div className="mb-8 relative z-10">
								<div className="flex items-center gap-3 mb-6">
									<div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg">
										<ShoppingBag className="w-5 h-5 text-white" />
									</div>
									<div>
										<span className="text-sm font-bold text-gray-800 uppercase tracking-wider block">
											{t.bogo.youBuy}
										</span>
										<span className="text-xs text-gray-500">Main Product</span>
									</div>
								</div>

								<div className="relative group/image mb-6">
									{/* Product image with advanced effects */}
									<div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-xl">
										<OptimizedImage
											src={currentMapping.mainProduct.image}
											alt={currentMapping.mainProduct.title}
											fill
											className="object-cover group-hover/image:scale-110 transition-all duration-700 ease-out"
											sizes="(max-width: 768px) 100vw, 50vw"
											priority={true}
											onFailure={handleImageError}
										/>
										{/* Overlay effects */}
										<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"></div>

										{/* Enhanced badges */}
										<div className="absolute top-4 left-4">
											<span className="px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white text-sm font-bold rounded-full shadow-xl backdrop-blur-sm border border-white/20">
												{t.bogo.mainItem}
											</span>
										</div>

										{/* Quality indicator */}
										<div className="absolute top-4 right-4">
											<div className="flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-full shadow-xl border border-white/30">
												<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
												<span className="text-xs font-semibold text-gray-700">
													Premium
												</span>
											</div>
										</div>

										{/* Hover overlay with quick view */}
										<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-300">
											<button className="px-8 py-3 bg-white/95 backdrop-blur-sm text-gray-900 font-bold rounded-full shadow-2xl transform translate-y-4 group-hover/image:translate-y-0 transition-all duration-300 hover:bg-white border border-white/30">
												Quick View
											</button>
										</div>
									</div>
								</div>

								{/* Enhanced product details */}
								<div className="space-y-4">
									<h3 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight line-clamp-2 hover:text-red-600 transition-colors duration-300">
										{translatedMainTitle}
									</h3>

									<div className="flex items-center gap-4 flex-wrap">
										<p className="text-3xl lg:text-4xl font-black text-gray-900">
											$
											{typeof currentMapping.mainProduct.price === "number"
												? currentMapping.mainProduct.price.toFixed(2)
												: "0.00"}
										</p>
										<div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm font-bold rounded-full shadow-lg border border-green-200">
											Best Value
										</div>
									</div>

									{currentMapping.mainProduct.vendor && (
										<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
											<div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
												<span className="text-white text-sm font-bold">
													{currentMapping.mainProduct.vendor.charAt(0)}
												</span>
											</div>
											<div>
												<p className="text-sm text-gray-600 font-medium">
													by{" "}
													<span className="font-bold text-gray-800">
														{currentMapping.mainProduct.vendor}
													</span>
												</p>
												<p className="text-xs text-gray-500">Verified Seller</p>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Enhanced Plus Icon with Advanced Animation */}
							<div className="flex justify-center mb-8 relative">
								<div className="relative group">
									{/* Multiple pulsing backgrounds */}
									<div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping opacity-20 scale-150"></div>
									<div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full animate-pulse opacity-30 scale-125"></div>
									<div className="absolute inset-0 bg-gradient-to-r from-red-300 to-pink-300 rounded-full animate-bounce opacity-20 scale-110"></div>

									{/* Main plus icon */}
									<div className="relative w-20 h-20 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-3xl shadow-2xl transform hover:scale-110 transition-all duration-300 border-4 border-white group-hover:rotate-90">
										<span className="animate-bounce-gentle">+</span>
									</div>

									{/* Decorative floating elements */}
									<div className="absolute -top-3 -right-3 w-6 h-6 bg-yellow-400 rounded-full animate-bounce shadow-lg"></div>
									<div className="absolute -bottom-3 -left-3 w-4 h-4 bg-green-400 rounded-full animate-bounce delay-150 shadow-lg"></div>
									<div className="absolute -top-2 -left-4 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-300 shadow-lg"></div>
								</div>
							</div>

							{/* Enhanced Free Product(s) */}
							<div className="relative z-10">
								<div className="flex items-center gap-3 mb-6">
									<div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg">
										<Gift className="w-5 h-5 text-white" />
									</div>
									<div className="flex-1">
										<span className="text-sm font-bold text-green-700 uppercase tracking-wider block">
											{t.bogo.youGetFree}
										</span>
										<span className="text-xs text-green-600">
											Premium Gifts
										</span>
									</div>
									<div className="ml-auto">
										<span className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-bold rounded-full animate-pulse shadow-lg border border-green-200">
											100% FREE
										</span>
									</div>
								</div>
								<div className="grid grid-cols-1 gap-4">
									{currentMapping.freeProducts.length > 1 ? (
										<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
											<p className="text-sm font-medium text-blue-800 mb-2">
												Choose from {currentMapping.freeProducts.length} free
												options:
											</p>
											<div className="grid grid-cols-2 gap-2">
												{currentMapping.freeProducts.map((freeProduct) => (
													<div
														key={freeProduct.id}
														className="flex items-center gap-2 p-2 bg-white rounded border"
													>
														<div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
															<OptimizedImage
																src={freeProduct.image}
																alt={freeProduct.title}
																fill
																className="object-cover"
																sizes="32px"
																onFailure={handleImageError}
															/>
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-xs font-medium text-gray-900 truncate">
																{freeProduct.title}
															</p>
															<p className="text-xs text-green-600 font-bold">
																FREE
															</p>
														</div>
													</div>
												))}
											</div>
											<p className="text-xs text-blue-600 mt-2">
												You'll choose your preferred item when adding to cart
											</p>
										</div>
									) : (
										currentMapping.freeProducts.map((freeProduct) => (
											<div
												key={freeProduct.id}
												className="flex items-center gap-4 p-3 bg-green-50 rounded-lg"
											>
												<div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
													<OptimizedImage
														src={freeProduct.image}
														alt={freeProduct.title}
														fill
														className="object-cover"
														sizes="64px"
														onFailure={handleImageError}
													/>
													<div className="absolute -top-1 -right-1">
														<span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
															FREE
														</span>
													</div>
												</div>
												<div className="flex-1 min-w-0">
													<h4 className="font-semibold text-gray-900 truncate">
														{freeProduct.title}
													</h4>
													<p className="text-sm text-gray-500 line-through">
														$
														{typeof freeProduct.price === "number"
															? freeProduct.price.toFixed(2)
															: "0.00"}
													</p>
													<p className="text-sm font-bold text-green-600">
														FREE
													</p>
												</div>
											</div>
										))
									)}
								</div>
							</div>
						</div>

						{/* Navigation Buttons - Only show if multiple mappings */}
						{bogoMappings.length > 1 && (
							<>
								<button
									onClick={handlePrevious}
									className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white hover:bg-gray-50 rounded-full shadow-lg transition-all z-10 -ml-6"
									aria-label="Previous offer"
								>
									<ChevronLeft className="w-6 h-6 text-gray-800" />
								</button>
								<button
									onClick={handleNext}
									className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white hover:bg-gray-50 rounded-full shadow-lg transition-all z-10 -mr-6"
									aria-label="Next offer"
								>
									<ChevronRight className="w-6 h-6 text-gray-800" />
								</button>
							</>
						)}
					</div>

					{/* Right side - Content */}
					<div className="space-y-6">
						<div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full font-bold text-sm">
							{currentMapping.badge}
						</div>

						<h3 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
							{currentMapping.promotionName.replace("December BOGO - ", "")}
						</h3>

						<p className="text-lg text-gray-700 leading-relaxed">
							{currentMapping.description}
						</p>

						<div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500 bogo-savings">
							<h4 className="font-bold text-gray-900 mb-2">
								🎁 What You Save:
							</h4>
							<div className="space-y-2">
								{currentMapping.freeProducts.map((freeProduct) => (
									<div
										key={freeProduct.id}
										className="flex justify-between items-center"
									>
										<span className="text-gray-600">{freeProduct.title}</span>
										<span className="font-bold text-green-600">
											+$
											{typeof freeProduct.price === "number"
												? freeProduct.price.toFixed(2)
												: "0.00"}
										</span>
									</div>
								))}
								<div className="border-t pt-2 mt-2">
									<div className="flex justify-between items-center font-bold text-lg">
										<span>Total Savings:</span>
										<span className="text-green-600">
											$
											{currentMapping.freeProducts
												.reduce(
													(sum, product) =>
														sum +
														(typeof product.price === "number"
															? product.price
															: 0),
													0,
												)
												.toFixed(2)}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Enhanced Shop Now Button */}
						<div className="pt-8">
							<button
								onClick={() =>
									handleShopNow(
										currentMapping.mainProduct.id,
										currentMapping.id,
									)
								}
								className="group relative w-full md:w-auto px-12 py-5 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white font-black rounded-2xl text-lg md:text-xl shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden border-2 border-white/20"
							>
								{/* Button background animation */}
								<div className="absolute inset-0 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

								{/* Button content */}
								<div className="relative flex items-center justify-center gap-4">
									<ShoppingBag className="w-6 h-6 group-hover:animate-bounce" />
									<span className="tracking-wide">
										Shop Now & Get FREE Gift
									</span>
									<Sparkles className="w-6 h-6 group-hover:animate-spin" />
								</div>

								{/* Shine effect */}
								<div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
							</button>

							{/* Additional CTA info */}
							<div className="mt-6 text-center">
								<div className="flex items-center justify-center gap-6 text-sm text-gray-600 flex-wrap">
									<div className="flex items-center gap-2">
										<Gift className="w-4 h-4 text-red-500" />
										<span className="font-semibold">Free shipping</span>
									</div>
									<div className="flex items-center gap-2">
										<Sparkles className="w-4 h-4 text-red-500" />
										<span className="font-semibold">30-day returns</span>
									</div>
									<div className="flex items-center gap-2">
										<ShoppingBag className="w-4 h-4 text-red-500" />
										<span className="font-semibold">Secure checkout</span>
									</div>
								</div>
							</div>
						</div>

						{/* Slide Indicators - Only show if multiple mappings */}
						{bogoMappings.length > 1 && (
							<div className="flex gap-2 pt-4">
								{bogoMappings.map((_, index) => (
									<button
										key={index}
										onClick={() => setCurrentIndex(index)}
										className={`h-2 rounded-full transition-all ${
											index === currentIndex
												? "w-8 bg-red-500"
												: "w-2 bg-gray-300 hover:bg-gray-400"
										}`}
										aria-label={`Go to offer ${index + 1}`}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Mobile: Enhanced Single column layout */}
				<div className="md:hidden">
					<div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 mb-8 relative overflow-hidden border border-white/30">
						{/* Mobile card background pattern */}
						<div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-50 to-pink-50 rounded-full -translate-y-12 translate-x-12 opacity-50"></div>
						{/* Mobile Product Showcase */}
						<div className="space-y-6">
							{/* Main Product */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<ShoppingBag className="w-4 h-4 text-gray-600" />
									<span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
										You Buy
									</span>
								</div>
								<div className="relative aspect-square rounded-xl overflow-hidden mb-3">
									<OptimizedImage
										src={currentMapping.mainProduct.image}
										alt={currentMapping.mainProduct.title}
										fill
										className="object-cover"
										sizes="100vw"
									/>
									<div className="absolute top-2 left-2">
										<span className="px-2 py-1 bg-black text-white text-xs font-bold rounded-full">
											MAIN ITEM
										</span>
									</div>
								</div>
								<h3 className="text-lg font-bold text-gray-900 mb-1">
									{currentMapping.mainProduct.title}
								</h3>
								<p className="text-xl font-bold text-gray-900">
									$
									{typeof currentMapping.mainProduct.price === "number"
										? currentMapping.mainProduct.price.toFixed(2)
										: "0.00"}
								</p>
							</div>

							{/* Enhanced Mobile Plus Icon */}
							<div className="flex justify-center relative">
								<div className="relative group">
									{/* Pulsing backgrounds */}
									<div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping opacity-20 scale-125"></div>
									<div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full animate-pulse opacity-30 scale-110"></div>

									{/* Main plus icon */}
									<div className="relative w-14 h-14 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-xl border-3 border-white group-hover:rotate-90 transition-all duration-300">
										<span className="animate-bounce-gentle">+</span>
									</div>

									{/* Decorative elements */}
									<div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce shadow-lg"></div>
									<div className="absolute -bottom-2 -left-2 w-3 h-3 bg-green-400 rounded-full animate-bounce delay-150 shadow-lg"></div>
								</div>
							</div>

							{/* Free Products */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<Gift className="w-4 h-4 text-green-600" />
									<span className="text-xs font-medium text-green-600 uppercase tracking-wide">
										You Get FREE
									</span>
								</div>
								{currentMapping.freeProducts.length > 1 ? (
									<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
										<p className="text-xs font-medium text-blue-800 mb-2">
											Choose from {currentMapping.freeProducts.length} free
											options:
										</p>
										<div className="space-y-2">
											{currentMapping.freeProducts.map((freeProduct) => (
												<div
													key={freeProduct.id}
													className="flex items-center gap-2 p-2 bg-white rounded border"
												>
													<div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
														<OptimizedImage
															src={freeProduct.image}
															alt={freeProduct.title}
															fill
															className="object-cover"
															sizes="32px"
															onFailure={handleImageError}
														/>
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-xs font-medium text-gray-900 truncate">
															{freeProduct.title}
														</p>
														<p className="text-xs text-green-600 font-bold">
															FREE
														</p>
													</div>
												</div>
											))}
										</div>
										<p className="text-xs text-blue-600 mt-2">
											Choose when adding to cart
										</p>
									</div>
								) : (
									<div className="space-y-3">
										{currentMapping.freeProducts.map((freeProduct) => (
											<div
												key={freeProduct.id}
												className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
											>
												<div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
													<OptimizedImage
														src={freeProduct.image}
														alt={freeProduct.title}
														fill
														className="object-cover"
														sizes="48px"
														onFailure={handleImageError}
													/>
													<div className="absolute -top-1 -right-1">
														<span className="px-1 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
															FREE
														</span>
													</div>
												</div>
												<div className="flex-1 min-w-0">
													<h4 className="font-semibold text-gray-900 text-sm truncate">
														{freeProduct.title}
													</h4>
													<p className="text-xs text-gray-500 line-through">
														$
														{typeof freeProduct.price === "number"
															? freeProduct.price.toFixed(2)
															: "0.00"}
													</p>
													<p className="text-xs font-bold text-green-600">
														FREE
													</p>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Navigation Buttons - Only show if multiple mappings */}
						{bogoMappings.length > 1 && (
							<>
								<button
									onClick={handlePrevious}
									className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
									aria-label="Previous offer"
								>
									<ChevronLeft className="w-5 h-5 text-gray-800" />
								</button>
								<button
									onClick={handleNext}
									className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
									aria-label="Next offer"
								>
									<ChevronRight className="w-5 h-5 text-gray-800" />
								</button>
							</>
						)}
					</div>

					{/* Mobile Content */}
					<div className="space-y-4 px-2">
						<div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold text-xs">
							{currentMapping.badge}
						</div>

						<h3 className="text-2xl font-bold text-gray-900 leading-tight">
							{currentMapping.promotionName.replace("December BOGO - ", "")}
						</h3>

						<p className="text-base text-gray-700 leading-relaxed">
							{currentMapping.description}
						</p>

						<div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-red-500">
							<h4 className="font-bold text-gray-900 mb-2 text-sm">
								🎁 What You Save:
							</h4>
							<div className="space-y-2">
								{currentMapping.freeProducts.map((freeProduct) => (
									<div
										key={freeProduct.id}
										className="flex justify-between items-center text-sm"
									>
										<span className="text-gray-600 truncate">
											{freeProduct.title}
										</span>
										<span className="font-bold text-green-600">
											+$
											{typeof freeProduct.price === "number"
												? freeProduct.price.toFixed(2)
												: "0.00"}
										</span>
									</div>
								))}
								<div className="border-t pt-2 mt-2">
									<div className="flex justify-between items-center font-bold">
										<span>Total Savings:</span>
										<span className="text-green-600">
											$
											{currentMapping.freeProducts
												.reduce(
													(sum, product) =>
														sum +
														(typeof product.price === "number"
															? product.price
															: 0),
													0,
												)
												.toFixed(2)}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Enhanced Mobile Shop Now Button */}
						<div className="pt-6">
							<button
								onClick={() =>
									handleShopNow(
										currentMapping.mainProduct.id,
										currentMapping.id,
									)
								}
								className="group relative w-full px-8 py-4 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white font-black rounded-2xl text-lg shadow-2xl transform active:scale-95 transition-all duration-300 overflow-hidden border-2 border-white/20"
							>
								{/* Button background animation */}
								<div className="absolute inset-0 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 opacity-0 group-active:opacity-100 transition-opacity duration-200"></div>

								{/* Button content */}
								<div className="relative flex items-center justify-center gap-3">
									<ShoppingBag className="w-5 h-5 group-active:animate-bounce" />
									<span className="tracking-wide">
										Shop Now & Get FREE Gift
									</span>
									<Sparkles className="w-5 h-5 group-active:animate-spin" />
								</div>

								{/* Shine effect */}
								<div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transform translate-x-[-100%] group-active:translate-x-[100%] transition-transform duration-500"></div>
							</button>

							{/* Mobile CTA info */}
							<div className="mt-4 text-center">
								<div className="flex items-center justify-center gap-4 text-xs text-gray-600 flex-wrap">
									<span className="flex items-center gap-1">
										<Gift className="w-3 h-3 text-red-500" />
										<span className="font-semibold">Free shipping</span>
									</span>
									<span className="flex items-center gap-1">
										<Sparkles className="w-3 h-3 text-red-500" />
										<span className="font-semibold">30-day returns</span>
									</span>
								</div>
							</div>
						</div>

						{/* Slide Indicators - Only show if multiple mappings */}
						{bogoMappings.length > 1 && (
							<div className="flex gap-2 pt-4 justify-center">
								{bogoMappings.map((_, index) => (
									<button
										key={index}
										onClick={() => setCurrentIndex(index)}
										className={`h-2 rounded-full transition-all ${
											index === currentIndex
												? "w-8 bg-red-500"
												: "w-2 bg-gray-300 hover:bg-gray-400"
										}`}
										aria-label={`Go to offer ${index + 1}`}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Enhanced Additional BOGO Offers Grid */}
				{bogoMappings.length > 1 && (
					<div className="mt-16 md:mt-20 lg:mt-24">
						<div className="text-center mb-12">
							<h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
								More{" "}
								<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">
									BOGO
								</span>{" "}
								Deals
							</h3>
							<p className="text-lg text-gray-600 max-w-2xl mx-auto">
								Discover even more amazing Buy One Get One Free offers
							</p>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
							{bogoMappings
								.filter((_, index) => index !== currentIndex)
								.slice(0, 3)
								.map((mapping, index) => (
									<div
										key={mapping.id}
										className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden cursor-pointer transform hover:-translate-y-2"
										onClick={() => {
											const mappingIndex = bogoMappings.findIndex(
												(m) => m.id === mapping.id,
											);
											setCurrentIndex(mappingIndex);
											window.scrollTo({ top: 0, behavior: "smooth" });
										}}
									>
										{/* Card Image */}
										<div className="relative h-48 overflow-hidden">
											<OptimizedImage
												src={mapping.mainProduct.image}
												alt={mapping.mainProduct.title}
												fill
												className="object-cover group-hover:scale-110 transition-transform duration-500"
												sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
												onFailure={handleImageError}
											/>
											<div className="absolute top-3 left-3">
												<span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
													{mapping.badge}
												</span>
											</div>
											<div className="absolute top-3 right-3">
												<span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
													+FREE GIFT
												</span>
											</div>
										</div>

										{/* Card Content */}
										<div className="p-4">
											<h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
												{mapping.mainProduct.title}
											</h4>
											<p className="text-sm text-gray-600 line-clamp-2 mb-3">
												Get{" "}
												{mapping.freeProducts.map((p) => p.title).join(" + ")}{" "}
												FREE
											</p>
											<div className="flex justify-between items-center">
												<div>
													<span className="text-lg font-bold text-gray-900">
														$
														{typeof mapping.mainProduct.price === "number"
															? mapping.mainProduct.price.toFixed(2)
															: "0.00"}
													</span>
													<span className="text-sm text-green-600 ml-2">
														+$
														{mapping.freeProducts
															.reduce(
																(sum, p) =>
																	sum +
																	(typeof p.price === "number" ? p.price : 0),
																0,
															)
															.toFixed(2)}{" "}
														FREE
													</span>
												</div>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleShopNow(mapping.mainProduct.id);
													}}
													className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
												>
													Shop Now →
												</button>
											</div>
										</div>
									</div>
								))}
						</div>
					</div>
				)}

				{/* Enhanced Promotion Details */}
				<div className="mt-16 md:mt-20 text-center">
					<div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-3xl p-8 md:p-10 shadow-2xl max-w-4xl mx-auto border border-gray-200 relative overflow-hidden">
						{/* Background decoration */}
						<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100 to-pink-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
						<div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>

						<div className="relative z-10">
							<h4 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
								🎄{" "}
								<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
									December
								</span>{" "}
								BOGO Special
							</h4>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
								<div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
									<div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full">
										<Gift className="w-6 h-6 text-white" />
									</div>
									<span className="font-semibold text-gray-800">
										Free shipping included
									</span>
									<span className="text-sm text-gray-600">
										On all BOGO orders
									</span>
								</div>

								<div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
									<div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full">
										<Sparkles className="w-6 h-6 text-white animate-pulse" />
									</div>
									<span className="font-semibold text-gray-800">
										Limited time only
									</span>
									<span className="text-sm text-gray-600">Don't miss out!</span>
								</div>

								<div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
									<div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
										<ShoppingBag className="w-6 h-6 text-white" />
									</div>
									<span className="font-semibold text-gray-800">
										While supplies last
									</span>
									<span className="text-sm text-gray-600">
										Premium quality guaranteed
									</span>
								</div>
							</div>

							<div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl p-6 border border-gray-200">
								<p className="text-sm text-gray-600 leading-relaxed">
									<span className="font-semibold text-gray-800">
										*Terms & Conditions:
									</span>{" "}
									Offer valid until December 31st, 2025. Free items
									automatically added to cart when eligible main product is
									purchased. Cannot be combined with other offers. Limited to
									one free item per main product purchased. While supplies last.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

// Export memoized component for better performance
export default memo(BOGOPromotionBanner);

// Add custom CSS for advanced animations
if (typeof document !== "undefined") {
	const style = document.createElement("style");
	style.textContent = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(3deg); }
    }
    @keyframes float-delayed {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-18px) rotate(-3deg); }
    }
    @keyframes float-slow {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(2deg); }
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.3); }
    }
    @keyframes twinkle-delayed {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.4); }
    }
    @keyframes twinkle-slow {
      0%, 100% { opacity: 0.2; transform: scale(1); }
      50% { opacity: 0.9; transform: scale(1.2); }
    }
    @keyframes bounce-gentle {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    @keyframes gradient-x {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    @keyframes scale-x {
      0% { transform: scaleX(0); }
      100% { transform: scaleX(1); }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
      50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.6); }
    }
    
    .animate-float { animation: float 4s ease-in-out infinite; }
    .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite; }
    .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
    .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
    .animate-twinkle-delayed { animation: twinkle-delayed 2.5s ease-in-out infinite; }
    .animate-twinkle-slow { animation: twinkle-slow 3s ease-in-out infinite; }
    .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
    .animate-gradient-x { 
      background-size: 200% 200%;
      animation: gradient-x 4s ease infinite;
    }
    .animate-scale-x { 
      animation: scale-x 1s ease-out 0.5s forwards;
    }
    .animate-spin-slow { animation: spin-slow 4s linear infinite; }
    .animate-shimmer { animation: shimmer 2s infinite; }
    .animate-glow { animation: glow 2s ease-in-out infinite; }
    
    .shadow-3xl {
      box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
    }
    .shadow-4xl {
      box-shadow: 0 45px 80px -15px rgba(0, 0, 0, 0.3);
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .border-3 {
      border-width: 3px;
    }
    
    /* Responsive enhancements */
    @media (max-width: 640px) {
      .animate-float { animation-duration: 3s; }
      .animate-float-delayed { animation-duration: 4s; }
      .animate-float-slow { animation-duration: 5s; }
    }
    
    /* Reduced motion preferences */
    @media (prefers-reduced-motion: reduce) {
      .animate-float,
      .animate-float-delayed,
      .animate-float-slow,
      .animate-bounce-gentle,
      .animate-spin-slow {
        animation: none;
      }
    }
  `;
	document.head.appendChild(style);
}
