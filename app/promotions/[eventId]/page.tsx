"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Tag, ShoppingCart } from "lucide-react";
import { CustomerPromotionalService } from "@/lib/promotionals/customer-service";
import { PromotionalEvent, ProductWithDiscount } from "@/types/promotionals";
import { CountdownTimer } from "@/components/promotions/CountdownTimer";
import { PromotionalProductsGrid } from "@/components/promotions/PromotionalProductsGrid";
import { useCart } from "@/contexts/CartContext";
import { promotionalCache } from "@/lib/promotionals/promotional-cache";
import { toDate } from "@/lib/utils/timestamp-helpers";

export default function PromotionalProductsPage() {
	const params = useParams();
	const router = useRouter();
	const cart = useCart();
	const itemCount = cart.itemCount;
	const eventId = params.eventId as string;
	const [displayItemCount, setDisplayItemCount] = useState(itemCount);

	const [event, setEvent] = useState<PromotionalEvent | null>(null);
	const [products, setProducts] = useState<ProductWithDiscount[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showBackToTop, setShowBackToTop] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [totalProducts, setTotalProducts] = useState<number | null>(null); // null = loading, number = loaded
	const [isLoadingTotal, setIsLoadingTotal] = useState(true);

	const PRODUCTS_PER_PAGE = 20; // Products to show per page
	const INITIAL_FETCH_SIZE = 20; // Initial fetch for fast first paint

	// Update display whenever itemCount changes
	useEffect(() => {
		setDisplayItemCount(itemCount);
	}, [itemCount]);

	useEffect(() => {
		const loadPromotionalData = async () => {
			try {
				setLoading(true);
				setError(null);

				// CACHING: Try to load from cache first for instant display
				const cachedEvent = promotionalCache.getEvent(eventId);
				// Check for cached sorted products (stored with offset -1 as a special marker)
				const cachedSortedProducts = promotionalCache.getProducts(eventId, -1);

				// Show cached data immediately if available
				if (cachedEvent) {
					setEvent(cachedEvent);
				}
				if (cachedSortedProducts) {
					// Use cached sorted products
					setProducts(cachedSortedProducts.products);
					setTotalProducts(cachedSortedProducts.total);
					setHasMore(cachedSortedProducts.hasMore);
					setIsLoadingTotal(false);
					setLoading(false);
				}

				// Check if cache is stale (needs refresh)
				const isStale = cachedEvent
					? promotionalCache.isStale(eventId, 0)
					: true;

				// OPTIMIZATION: Fetch event first
				const eventResult = await Promise.allSettled([
					CustomerPromotionalService.getPromotionalEvent(eventId),
				]);

				// Handle event fetch
				let eventData: PromotionalEvent | null = null;
				if (eventResult[0].status === "fulfilled") {
					eventData = eventResult[0].value;
				} else {
					console.error("Error fetching event:", eventResult[0].reason);
					// Fallback to cache if available
					if (cachedEvent) {
						eventData = cachedEvent;
					} else {
						router.push("/shops");
						return;
					}
				}

				if (!eventData) {
					// Event not found or expired - redirect to shops
					router.push("/shops");
					return;
				}

				// Cache and set event
				promotionalCache.setEvent(eventId, eventData);
				setEvent(eventData);

				// OPTIMIZED STRATEGY: Load first page immediately, then fetch more in background
				// Check cache first
				const cachedFirstPage = promotionalCache.getProducts(eventId, 0);
				
				if (cachedFirstPage && !promotionalCache.isStale(eventId, 0)) {
					// Use cached first page for instant display
					setProducts(cachedFirstPage.products);
					setTotalProducts(cachedFirstPage.total);
					setHasMore(cachedFirstPage.hasMore);
					setIsLoadingTotal(false);
					setLoading(false);
					
					// Preload next page in background if there's more
					if (cachedFirstPage.hasMore) {
						CustomerPromotionalService.getPromotionalProductsPaginated(
							eventId,
							PRODUCTS_PER_PAGE,
							INITIAL_FETCH_SIZE
						).then(nextPage => {
							promotionalCache.setProducts(
								eventId,
								INITIAL_FETCH_SIZE,
								nextPage.products,
								nextPage.total,
								nextPage.hasMore
							);
						}).catch(err => console.log('Background preload failed:', err));
					}
				} else {
					// Fetch first page from network
					try {
						const firstPage = await CustomerPromotionalService.getPromotionalProductsPaginated(
							eventId,
							INITIAL_FETCH_SIZE,
							0
						);
						
						// Cache and display immediately
						promotionalCache.setProducts(
							eventId,
							0,
							firstPage.products,
							firstPage.total,
							firstPage.hasMore
						);
						
						setProducts(firstPage.products);
						setTotalProducts(firstPage.total);
						setHasMore(firstPage.hasMore);
						setIsLoadingTotal(false);
						setLoading(false);
						
						// Preload next page in background if there's more
						if (firstPage.hasMore) {
							CustomerPromotionalService.getPromotionalProductsPaginated(
								eventId,
								PRODUCTS_PER_PAGE,
								INITIAL_FETCH_SIZE
							).then(nextPage => {
								promotionalCache.setProducts(
									eventId,
									INITIAL_FETCH_SIZE,
									nextPage.products,
									nextPage.total,
									nextPage.hasMore
								);
							}).catch(err => console.log('Background preload failed:', err));
						}
					} catch (error) {
						console.error("Error fetching first page:", error);
						setError("Failed to load products");
						setLoading(false);
						return;
					}
				}
			} catch (err) {
				console.error("Error loading promotional data:", err);
				setError("Failed to load promotional products. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		if (eventId) {
			loadPromotionalData();
		}
	}, [eventId, router]);

	// Load more products when scrolling - OPTIMIZED with pagination
	const loadMoreProducts = useCallback(async () => {
		if (loadingMore || !hasMore || !eventId) return;

		try {
			setLoadingMore(true);
			const currentOffset = products.length;

			// Check cache first
			const cachedBatch = promotionalCache.getProducts(eventId, currentOffset);
			
			if (cachedBatch && !promotionalCache.isStale(eventId, currentOffset)) {
				// Use cached data
				setProducts((prev) => [...prev, ...cachedBatch.products]);
				setHasMore(cachedBatch.hasMore);
			} else {
				// Fetch from network
				const nextBatch = await CustomerPromotionalService.getPromotionalProductsPaginated(
					eventId,
					PRODUCTS_PER_PAGE,
					currentOffset
				);
				
				// Cache the batch
				promotionalCache.setProducts(
					eventId,
					currentOffset,
					nextBatch.products,
					nextBatch.total,
					nextBatch.hasMore
				);
				
				// Remove duplicates
				const existingIds = new Set(products.map(p => p.productId));
				const newProducts = nextBatch.products.filter(p => !existingIds.has(p.productId));
				
				setProducts((prev) => [...prev, ...newProducts]);
				setHasMore(nextBatch.hasMore);
				setTotalProducts(nextBatch.total);
			}
		} catch (error) {
			console.error("Error loading more products:", error);
			setError("Failed to load more products. Please try again.");
		} finally {
			setLoadingMore(false);
		}
	}, [loadingMore, hasMore, eventId, products.length]);

	// Handle promotion expiration
	const handleExpire = () => {
		router.push("/shops");
	};

	// Handle scroll for back to top button and infinite scroll - OPTIMIZED with throttling
	useEffect(() => {
		let ticking = false;

		const handleScroll = () => {
			if (!ticking) {
				window.requestAnimationFrame(() => {
					setShowBackToTop(window.scrollY > 400);

					// Infinite scroll: load more when near bottom
					// OPTIMIZATION: Use requestAnimationFrame for smoother performance
					if (
						!loadingMore &&
						hasMore &&
						window.innerHeight + window.scrollY >=
							document.documentElement.scrollHeight - 1000
					) {
						loadMoreProducts();
					}

					ticking = false;
				});
				ticking = true;
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [loadingMore, hasMore, loadMoreProducts]);

	// Scroll to top function
	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				{/* Header Skeleton with Pattern Background */}
				<div 
					className="relative text-white bg-cover bg-center bg-no-repeat"
					style={{
						backgroundImage: "url('/Pattern Landscape.jpg')",
						backgroundSize: "cover",
						backgroundPosition: "center"
					}}
				>
					{/* Darker overlay */}
					<div className="absolute inset-0 bg-black/70"></div>
					
					<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
						<div className="h-8 bg-white/30 rounded w-32 mb-6 animate-pulse"></div>
						<div className="h-12 bg-white/30 rounded w-3/4 mb-4 animate-pulse"></div>
						<div className="h-6 bg-white/30 rounded w-1/2 mb-6 animate-pulse"></div>
					</div>
				</div>
				{/* Products Skeleton Grid */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{Array.from({ length: 12 }).map((_, i) => (
							<div
								key={i}
								className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
							>
								<div className="aspect-square bg-gray-200 animate-pulse"></div>
								<div className="p-4 space-y-3">
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
									<div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
									<div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
									<div className="h-10 bg-gray-200 rounded animate-pulse"></div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error || !event) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4">
				<div className="text-center max-w-md">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
						<Tag className="w-8 h-8 text-red-600" />
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Promotion Not Available
					</h2>
					<p className="text-gray-600 mb-6">
						{error || "This promotion has ended or is no longer available."}
					</p>
					<button
						onClick={() => router.push("/shops")}
						className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
					>
						Browse All Products
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header Section with Pattern Background */}
			<div 
				className="relative text-white bg-cover bg-center bg-no-repeat"
				style={{
					backgroundImage: "url('/Pattern Landscape.jpg')",
					backgroundSize: "cover",
					backgroundPosition: "center"
				}}
			>
				{/* Darker overlay for better text readability */}
				<div className="absolute inset-0 bg-black/70"></div>
				
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
					{/* Header Actions */}
					<div className="flex items-center justify-between mb-6">
						<span
							onClick={() => router.push("/")}
							className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to Home
						</span>

						{/* Cart Icon */}
						<span
							onClick={() => router.push("/shops/cart")}
							className="relative flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-colors"
						>
							<ShoppingCart className="w-5 h-5" />
							<span className="font-medium">Cart</span>
							{displayItemCount > 0 && (
								<span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
									{displayItemCount}
								</span>
							)}
						</span>
					</div>

					{/* Event Info */}
					<div className="space-y-4">
						<div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
							<Tag className="w-4 h-4" />
							Limited Time Offer
						</div>

						<h1 className="text-4xl md:text-5xl font-bold">{event.name}</h1>

						{event.banner?.description && (
							<p className="text-xl text-white/90 max-w-2xl">
								{event.banner.description}
							</p>
						)}

						{/* Countdown Timer */}
						<div className="pt-4">
							<CountdownTimer
								endDate={toDate(event.endDate)}
								size="lg"
								onExpire={handleExpire}
							/>
						</div>

						{/* Stats */}
						<div className="flex flex-wrap gap-6 pt-4">
							<div>
								<p className="text-white/80 text-sm">Products on Sale</p>
								<p className="text-2xl font-bold">
									{totalProducts !== null ? (
										totalProducts.toLocaleString()
									) : (
										<span className="text-white/60">Loading...</span>
									)}
								</p>
							</div>
							{event.banner?.displayPercentage && (
								<div>
									<p className="text-white/80 text-sm">Up to</p>
									<p className="text-2xl font-bold">
										{event.banner.displayPercentage}% OFF
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Products Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{products.length > 0 ? (
					<>
						<PromotionalProductsGrid
							products={products}
							eventId={eventId}
							eventName={event.name}
							eventEndDate={toDate(event.endDate)}
							totalProducts={totalProducts}
							isLoadingTotal={isLoadingTotal}
						/>
						{/* Loading More Indicator */}
						{loadingMore && (
							<div className="flex justify-center items-center py-8">
								<Loader2 className="w-8 h-8 animate-spin text-red-600" />
								<span className="ml-3 text-gray-600">
									Loading more products...
								</span>
							</div>
						)}
						{/* Load More Button (fallback if scroll doesn't trigger) */}
						{hasMore && !loadingMore && (
							<div className="flex justify-center py-8">
								<button
									onClick={loadMoreProducts}
									className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
								>
									Load More Products
								</button>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-16">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
							<Tag className="w-8 h-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							No Products Available
						</h3>
						<p className="text-gray-600 mb-6">
							This promotion doesn't have any products yet.
						</p>
						<button
							onClick={() => router.push("/shops")}
							className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
						>
							Browse All Products
						</button>
					</div>
				)}
			</div>

			{/* Back to Top Button */}
			{showBackToTop && (
				<button
					onClick={scrollToTop}
					className="fixed bottom-8 right-8 p-4 bg-black text-white rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-110 z-50"
					aria-label="Back to top"
				>
					<ArrowLeft className="w-6 h-6 rotate-90" />
				</button>
			)}
		</div>
	);
}
 