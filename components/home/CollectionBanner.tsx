"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProductCollection } from "@/types/collections";
import { collectionRepository } from "@/lib/firestore";
import {
	ChevronLeft,
	ChevronRight,
	Sparkles,
	Tag,
	TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTranslatedText } from "@/lib/i18n/useTranslatedText";

export const CollectionBanner: React.FC = () => {
	const [collections, setCollections] = useState<ProductCollection[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isAutoPlaying, setIsAutoPlaying] = useState(true);

	const router = useRouter();
	const { t } = useLanguage();

	const currentCollection =
		collections.length > 0 ? collections[currentIndex] : undefined;
	const translatedTitle = useTranslatedText(
		currentCollection?.title || currentCollection?.name,
	);
	const translatedDescription = useTranslatedText(
		currentCollection?.description,
	);

	useEffect(() => {
		loadPublishedCollections();
	}, []);

	// Auto-slide functionality
	useEffect(() => {
		if (!isAutoPlaying || collections.length <= 1) return;

		const interval = setInterval(() => {
			setCurrentIndex((prev) =>
				prev === collections.length - 1 ? 0 : prev + 1,
			);
		}, 5000); // Change slide every 5 seconds

		return () => clearInterval(interval);
	}, [collections.length, isAutoPlaying]);

	const loadPublishedCollections = async () => {
		try {
			setLoading(true);
			setError(null);

			// Add timeout to prevent hanging (10 seconds)
			const timeoutPromise = new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("Request timeout")), 10000),
			);

			// Use the dedicated method to get published collections with timeout
			const publishedCollections = await Promise.race([
				collectionRepository.getPublishedCollections(),
				timeoutPromise,
			]);

			// Filter out collections without thumbnails
			const validCollections = publishedCollections.filter((c) => {
				const hasThumb = c.thumbnail && c.thumbnail.trim() !== "";
				if (!hasThumb) {
					console.warn(
						"[CollectionBanner] Collection missing thumbnail:",
						c.id,
						c.name,
					);
				}
				return hasThumb;
			});

			if (validCollections.length === 0) {
				// Don't set error if there are just no collections - this is valid
				setCollections([]);
			} else {
				setCollections(validCollections);
			}
		} catch (err: any) {
			console.error(
				"[CollectionBanner] Error loading published collections:",
				err,
			);
			const errorMessage = err?.message || "Unknown error";
			const errorCode = err?.code || "unknown";

			// Check if it's a permission error
			if (
				errorCode === "permission-denied" ||
				errorMessage.includes("permission")
			) {
				setError(
					`Permission denied: Please check Firestore security rules for product_collections collection. Error: ${errorMessage}`,
				);
			} else if (errorMessage.includes("timeout")) {
				setError(`Request timeout: Collections took too long to load`);
			} else {
				setError(`Failed to load collection banners: ${errorMessage}`);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleShopNow = useCallback(
		(collectionId: string) => {
			// Navigate to collection page instead of adding to cart
			router.push(`/shops/collections/${collectionId}`);
		},
		[router],
	);

	const handlePrevious = () => {
		setIsAutoPlaying(false); // Stop auto-play when user interacts
		setCurrentIndex((prev) => (prev === 0 ? collections.length - 1 : prev - 1));
		// Resume auto-play after 10 seconds
		setTimeout(() => setIsAutoPlaying(true), 10000);
	};

	const handleNext = () => {
		setIsAutoPlaying(false); // Stop auto-play when user interacts
		setCurrentIndex((prev) => (prev === collections.length - 1 ? 0 : prev + 1));
		// Resume auto-play after 10 seconds
		setTimeout(() => setIsAutoPlaying(true), 10000);
	};

	const handleIndicatorClick = (index: number) => {
		setIsAutoPlaying(false); // Stop auto-play when user interacts
		setCurrentIndex(index);
		// Resume auto-play after 10 seconds
		setTimeout(() => setIsAutoPlaying(true), 10000);
	};

	// Don't render anything if loading
	if (loading) {
		return null;
	}

	// Don't render if there's an error
	if (error) {
		console.error("[CollectionBanner] Error:", error);
		return null;
	}

	// Don't render if no collections
	if (collections.length === 0) {
		return null;
	}

	// Validate current collection has required data
	if (!currentCollection || !currentCollection.thumbnail) {
		console.warn(
			"[CollectionBanner] Current collection missing thumbnail:",
			currentCollection,
		);
		return null;
	}

	// Calculate aspect ratio from canvas dimensions
	const getAspectRatio = (collection: ProductCollection): string => {
		if (
			collection.canvasState?.dimensions?.width &&
			collection.canvasState?.dimensions?.height
		) {
			const width = collection.canvasState.dimensions.width;
			const height = collection.canvasState.dimensions.height;
			// Return aspect ratio as "width/height"
			return `${width}/${height}`;
		}
		// Default fallback aspect ratio
		return "3/2";
	};

	const aspectRatio = getAspectRatio(currentCollection);

	return (
		<section className="relative py-12 md:py-16 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-100/30 to-pink-100/30 rounded-full blur-3xl animate-pulse"></div>
				<div
					className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-100/30 to-indigo-100/30 rounded-full blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				></div>
			</div>

			<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
				{/* Single Collection Slide */}
				<div className="relative">
					{/* Desktop: Two-grid layout */}
					<div className="hidden md:grid md:grid-cols-2 gap-8 lg:gap-12 relative items-center">
						{/* Left side - Content */}
						<div className="flex flex-col justify-center space-y-6 lg:space-y-8">
							{/* Badge with sparkle icon */}
							{currentCollection.badge && (
								<div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-black via-gray-900 to-black text-white rounded-full font-bold text-sm w-fit shadow-lg hover:shadow-xl transition-all hover:scale-105 group">
									<Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
									<span>{currentCollection.badge}</span>
									<Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
								</div>
							)}

							{/* Title with gradient */}
							<h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-black to-gray-800 bg-clip-text text-transparent leading-tight">
								{translatedTitle}
							</h2>

							{/* Description */}
							{translatedDescription && (
								<p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
									{translatedDescription}
								</p>
							)}

							{/* Collection Stats */}
							<div className="flex items-center gap-6 text-sm text-gray-600">
								<div className="flex items-center gap-2">
									<Tag className="w-4 h-4 text-purple-600" />
									<span className="font-medium">
										{currentCollection.productIds?.length || 0}{" "}
										{t.collection.items}
									</span>
								</div>
								{currentCollection.badge && (
									<div className="flex items-center gap-2">
										<TrendingUp className="w-4 h-4 text-green-600" />
										<span className="font-medium">{t.collection.trending}</span>
									</div>
								)}
							</div>

							{/* Shop Now Button with modern gradient */}
							<div className="pt-2">
								<button
									onClick={() => handleShopNow(currentCollection.id)}
									className="group relative px-10 py-4 bg-gradient-to-r from-black via-gray-900 to-black text-white font-bold rounded-xl hover:shadow-2xl transition-all duration-300 text-lg overflow-hidden"
								>
									<span className="relative z-10 flex items-center gap-3">
										{t.collection.shopCollection}
										<ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
									</span>
									{/* Animated gradient overlay */}
									<div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</button>
							</div>

							{/* Slide Indicators - Modern style */}
							{collections.length > 1 && (
								<div className="flex gap-3 pt-4">
									{collections.map((_, index) => (
										<button
											key={index}
											onClick={() => handleIndicatorClick(index)}
											className={`h-1.5 rounded-full transition-all duration-300 ${
												index === currentIndex
													? "w-12 bg-gradient-to-r from-black via-gray-800 to-black shadow-md"
													: "w-8 bg-gray-300 hover:bg-gray-400"
											}`}
											aria-label={`Go to slide ${index + 1}`}
										/>
									))}
								</div>
							)}

							{/* Auto-play indicator */}
							{/* {collections.length > 1 && (
								<div className="flex items-center gap-2 text-xs text-gray-500">
									<div className={`w-2 h-2 rounded-full ${isAutoPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
									<span>{isAutoPlaying ? 'Auto-playing' : 'Paused'}</span>
								</div>
							)} */}
						</div>

						{/* Right side - Image with enhanced design */}
						<div className="relative group">
							{/* Glow effect behind image */}
							<div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-blue-400/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500 -z-10 group-hover:scale-110"></div>

							<div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5] lg:aspect-[3/4] transform group-hover:scale-[1.02] transition-transform duration-500">
								{currentCollection.thumbnail ? (
									<Image
										src={currentCollection.thumbnail}
										alt={translatedTitle || "Collection"}
										fill
										className="object-cover"
										priority
										sizes="(max-width: 768px) 100vw, 50vw"
										onError={(e) => {
											console.error(
												"Failed to load collection image:",
												currentCollection.thumbnail,
											);
											const target = e.target as HTMLImageElement;
											target.style.display = "none";
										}}
									/>
								) : (
									<div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
										<span>{t.collection.noDesign}</span>
									</div>
								)}

								{/* Gradient overlay on hover */}
								<div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

								{/* Navigation Buttons - Enhanced style */}
								{collections.length > 1 && (
									<>
										<button
											onClick={handlePrevious}
											className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/95 backdrop-blur-sm hover:bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-10 hover:scale-110"
											aria-label="Previous collection"
										>
											<ChevronLeft className="w-6 h-6 text-gray-200" />
										</button>
										<button
											onClick={handleNext}
											className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/95 backdrop-blur-sm hover:bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-10 hover:scale-110"
											aria-label="Next collection"
										>
											<ChevronRight className="w-6 h-6 text-gray-200" />
										</button>
									</>
								)}
							</div>
						</div>
					</div>

					{/* Mobile: Single column layout with modern design */}
					<div className="md:hidden space-y-6">
						{/* Image with enhanced design */}
						<div className="relative group">
							{/* Glow effect behind image */}
							<div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-blue-400/20 rounded-2xl blur-2xl -z-10"></div>

							<div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5]">
								{currentCollection.thumbnail ? (
									<Image
										src={currentCollection.thumbnail}
										alt={translatedTitle || "Collection"}
										fill
										className="object-cover"
										priority
										sizes="100vw"
										onError={(e) => {
											console.error(
												"Failed to load collection image:",
												currentCollection.thumbnail,
											);
											const target = e.target as HTMLImageElement;
											target.style.display = "none";
										}}
									/>
								) : (
									<div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
										<span>{t.collection.noDesign}</span>
									</div>
								)}

								{/* Gradient overlay */}
								<div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

								{/* Navigation Buttons - Enhanced style */}
								{collections.length > 1 && (
									<>
										<button
											onClick={handlePrevious}
											className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/95 backdrop-blur-sm hover:bg-white rounded-full shadow-xl transition-all z-10 hover:scale-110"
											aria-label="Previous collection"
										>
											<ChevronLeft className="w-5 h-5 text-gray-800" />
										</button>
										<button
											onClick={handleNext}
											className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/95 backdrop-blur-sm hover:bg-white rounded-full shadow-xl transition-all z-10 hover:scale-110"
											aria-label="Next collection"
										>
											<ChevronRight className="w-5 h-5 text-gray-800" />
										</button>
									</>
								)}
							</div>
						</div>

						{/* Content */}
						<div className="space-y-5">
							{/* Badge with sparkles */}
							{currentCollection.badge && (
								<div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-black via-gray-900 to-black text-white rounded-full font-bold text-sm w-fit shadow-lg">
									<Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
									<span>{currentCollection.badge}</span>
									<Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
								</div>
							)}

							{/* Title with gradient */}
							<h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-black to-gray-800 bg-clip-text text-transparent leading-tight">
								{translatedTitle}
							</h2>

							{/* Description */}
							{translatedDescription && (
								<p className="text-base text-gray-600 leading-relaxed">
									{translatedDescription}
								</p>
							)}

							{/* Collection Stats */}
							<div className="flex items-center gap-5 text-sm text-gray-600">
								<div className="flex items-center gap-2">
									<Tag className="w-4 h-4 text-purple-600" />
									<span className="font-medium">
										{currentCollection.productIds?.length || 0}{" "}
										{t.collection.items}
									</span>
								</div>
								{currentCollection.badge && (
									<div className="flex items-center gap-2">
										<TrendingUp className="w-4 h-4 text-green-600" />
										<span className="font-medium">{t.collection.trending}</span>
									</div>
								)}
							</div>

							{/* Shop Now Button with modern gradient */}
							<div className="pt-2">
								<button
									onClick={() => handleShopNow(currentCollection.id)}
									className="group relative w-full px-8 py-4 bg-gradient-to-r from-black via-gray-900 to-black text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
								>
									<span className="relative z-10 flex items-center justify-center gap-3">
										{t.collection.shopCollection}
										<ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
									</span>
									{/* Animated gradient overlay */}
									<div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</button>
							</div>

							{/* Slide Indicators - Modern style */}
							{collections.length > 1 && (
								<div className="flex gap-3 pt-2 justify-center">
									{collections.map((_, index) => (
										<button
											key={index}
											onClick={() => handleIndicatorClick(index)}
											className={`h-1.5 rounded-full transition-all duration-300 ${
												index === currentIndex
													? "w-12 bg-gradient-to-r from-black via-gray-800 to-black shadow-md"
													: "w-8 bg-gray-300"
											}`}
											aria-label={`Go to slide ${index + 1}`}
										/>
									))}
								</div>
							)}

							{/* Auto-play indicator */}
							{collections.length > 1 && (
								<div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
									<div
										className={`w-2 h-2 rounded-full ${isAutoPlaying ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
									></div>
									<span>{isAutoPlaying ? "Auto-playing" : "Paused"}</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
