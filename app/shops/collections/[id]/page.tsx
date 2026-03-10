"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { collectionRepository, productRepository } from "@/lib/firestore";
import { ProductCollection } from "@/types/collections";
import { Product } from "@/types";
import { CollectionProductsGrid } from "@/components/collections/CollectionProductsGrid";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCollectionsTracking } from "@/hooks/useCollectionsTracking";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTranslatedText } from "@/lib/i18n/useTranslatedText";

export default function CollectionProductsPage() {
	const params = useParams();
	const router = useRouter();
	const { t } = useLanguage();
	const { itemCount } = useCart();
	const { user } = useAuth();
	const collectionId = params.id as string;

	// Initialize collections tracking
	const {
		trackCollectionView,
		trackProductView,
		trackAddToCart,
		getSessionId,
	} = useCollectionsTracking({
		userId: user?.uid,
		userInfo: user
			? {
					email: user.email || undefined,
					name: user.displayName || undefined,
				}
			: undefined,
		autoTrackPageViews: true,
		sessionTimeout: 30,
	});

	const [collection, setCollection] = useState<ProductCollection | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showBackToTop, setShowBackToTop] = useState(false);

	const translatedTitle = useTranslatedText(
		collection?.title || collection?.name,
	);
	const translatedDescription = useTranslatedText(collection?.description);

	useEffect(() => {
		const loadCollectionData = async () => {
			try {
				setLoading(true);
				setError(null);

				// Fetch collection
				const collectionData = await collectionRepository.getById(collectionId);

				if (!collectionData) {
					// Collection not found - redirect to shops
					router.push("/shops");
					return;
				}

				setCollection(collectionData);

				// Track collection view
				await trackCollectionView(
					collectionId,
					collectionData.title || collectionData.name || "Untitled Collection",
					{
						collectionType: (collectionData as any).type || "general",
						productCount: collectionData.productIds?.length || 0,
						createdBy: collectionData.createdBy,
						sessionId: getSessionId(),
					},
				);

				// Fetch collection products
				const productIds = collectionData.productIds || [];
				const userId =
					collectionData.createdBy || (collectionData as any).createdBy;
				const collectionProducts: Product[] = [];

				console.log("[CollectionShopPage] Loading products for collection:", {
					collectionId,
					productCount: productIds.length,
					productIds: productIds.slice(0, 5), // Log first 5 for debugging
					userId,
				});

				// Create parallel promises for all products
				const productPromises = productIds.map(async (productIdWithPrefix) => {
					try {
						// Handle prefixed product IDs (marketplace:xxx or collection:xxx)
						if (productIdWithPrefix.startsWith("marketplace:")) {
							const actualProductId = productIdWithPrefix.replace(
								"marketplace:",
								"",
							);
							console.log(
								"[CollectionShopPage] Loading marketplace product:",
								actualProductId,
							);
							return await productRepository.getByIdWithTailorInfo(
								actualProductId,
							);
						} else if (productIdWithPrefix.startsWith("collection:")) {
							// Fetch from collectionProducts collection
							const actualProductId = productIdWithPrefix.replace(
								"collection:",
								"",
							);
							console.log("[CollectionShopPage] Loading collection product:", {
								productId: actualProductId,
								userId: userId,
								fullPrefix: productIdWithPrefix,
							});

							try {
								const collectionProduct =
									await collectionRepository.getCollectionProductById(
										actualProductId,
										userId,
									);

								console.log(
									"[CollectionShopPage] Collection product fetch result:",
									{
										found: !!collectionProduct,
										productId: actualProductId,
										hasData: !!collectionProduct?.title,
									},
								);

								if (collectionProduct) {
									console.log(
										"[CollectionShopPage] Found collection product:",
										{
											id: collectionProduct.id,
											title: collectionProduct.title,
											price: collectionProduct.price,
											images: collectionProduct.images?.length || 0,
											brandName: collectionProduct.brandName,
											owner: collectionProduct.owner,
										},
									);

									// Convert collection product to Product format
									const product: Product = {
										product_id: collectionProduct.id || actualProductId,
										title: collectionProduct.title || "",
										description: collectionProduct.description || "",
										type: "ready-to-wear" as const,
										category: collectionProduct.category || "",
										availability: "in_stock" as const, // Collection products bypass stock checks
										skipStockCheck: true, // Flag to bypass stock validation downstream
										status: "verified" as const,
										price: {
											base: collectionProduct.price || 0,
											currency: collectionProduct.currency || "NGN",
										},
										discount: 0,
										deliveryTimeline: "3-5 business days",
										returnPolicy: "30 days return policy",
										rtwOptions: {
											sizes: collectionProduct.size
												? collectionProduct.size
														.split(",")
														.map((s: string) => s.trim())
														.filter(Boolean)
												: [],
											colors: collectionProduct.color
												? collectionProduct.color
														.split(",")
														.map((c: string) => c.trim())
														.filter(Boolean)
												: [],
										},
										images: collectionProduct.images || [],
										tailor_id:
											collectionProduct.owner?.email ||
											collectionProduct.owner?.uid ||
											collectionProduct.createdBy ||
											"",
										tailor: collectionProduct.brandName || "Collection Product",
										vendor: {
											id:
												collectionProduct.owner?.email ||
												collectionProduct.owner?.uid ||
												collectionProduct.createdBy ||
												"",
											name: collectionProduct.brandName || "Collection Product",
											email: collectionProduct.owner?.email || "",
											phone: collectionProduct.owner?.phoneNumber || "",
										},
										tags: [],
										// Add multiple pricing data if available
										enableMultiplePricing:
											collectionProduct.enableMultiplePricing || false,
										individualItems: collectionProduct.individualItems || [],
										createdAt:
											collectionProduct.createdAt?.toDate?.()?.toISOString() ||
											new Date().toISOString(),
										updatedAt:
											collectionProduct.updatedAt?.toDate?.()?.toISOString() ||
											new Date().toISOString(),
									};

									console.log("[CollectionShopPage] Converted product:", {
										product_id: product.product_id,
										title: product.title,
										price: product.price,
										images: product.images?.length || 0,
									});

									return product;
								} else {
									console.warn(
										"[CollectionShopPage] Collection product not found:",
										{
											productId: actualProductId,
											userId: userId,
											message:
												"Product returned null from getCollectionProductById",
										},
									);
								}
							} catch (collectionError) {
								console.error(
									"[CollectionShopPage] Error fetching collection product:",
									{
										productId: actualProductId,
										userId: userId,
										error: collectionError,
									},
								);
							}
							return null;
						} else {
							// No prefix, treat as regular marketplace product
							console.log(
								"[CollectionShopPage] Loading product without prefix:",
								productIdWithPrefix,
							);
							return await productRepository.getByIdWithTailorInfo(
								productIdWithPrefix,
							);
						}
					} catch (productError) {
						console.error(
							`[CollectionShopPage] Failed to load product ${productIdWithPrefix}:`,
							productError,
						);
						return null;
					}
				});

				// Wait for all products to load in parallel
				const productResults = await Promise.all(productPromises);

				// Filter out null results
				productResults.forEach((product) => {
					if (product) {
						collectionProducts.push(product);
					}
				});

				console.log("[CollectionShopPage] Loaded products:", {
					total: productResults.length,
					successful: collectionProducts.length,
					failed: productResults.filter((p) => p === null).length,
					productTypes: {
						marketplace: collectionProducts.filter(
							(p) => !p.product_id.includes("collection:"),
						).length,
						collection: collectionProducts.filter((p) =>
							p.product_id.includes("collection:"),
						).length,
					},
				});

				setProducts(collectionProducts);
			} catch (err) {
				console.error("Error loading collection data:", err);
				setError("Failed to load collection products. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		if (collectionId) {
			loadCollectionData();
		}
	}, [collectionId, router, trackCollectionView, getSessionId]);

	// Handle scroll for back to top button
	useEffect(() => {
		const handleScroll = () => {
			setShowBackToTop(window.scrollY > 400);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Scroll to top function
	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-12 h-12 animate-spin text-black mx-auto mb-4" />
					<p className="text-gray-600">Loading collection products...</p>
				</div>
			</div>
		);
	}

	if (error || !collection) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4">
				<div className="text-center max-w-md">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
						<ShoppingCart className="w-8 h-8 text-gray-400" />
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Collection Not Available
					</h2>
					<p className="text-gray-600 mb-6">
						{error || "This collection is no longer available."}
					</p>
					<button
						onClick={() => router.push("/shops")}
						className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
					>
						{t.collectionPage.backToShops}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header Section with Background Image and Gradient */}
			<div className="relative bg-gray-900 text-white min-h-[40vh] flex flex-col justify-end">
				{/* Background Image */}
				{collection.thumbnail && (
					<>
						<div
							className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
							style={{
								backgroundImage: `url(${collection.thumbnail})`,
							}}
						/>
						{/* Gradient Overlay for Text Readability - blending from black bottom to transparent top */}
						<div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
					</>
				)}

				{!collection.thumbnail && (
					<div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-black to-gray-900 z-0" />
				)}

				<div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
					{/* Header Actions */}
					<div className="flex items-center justify-between mb-8">
						<span
							onClick={() => router.push("/shops")}
							className="flex items-center gap-2 text-white/90 hover:text-white transition-colors cursor-pointer backdrop-blur-md bg-black/20 px-4 py-2 rounded-full"
						>
							<ArrowLeft className="w-4 h-4" />
							{t.collectionPage.backToShops}
						</span>

						{/* Cart Icon */}
						<span
							onClick={() => router.push("/shops/cart")}
							className="relative flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-md hover:bg-black/30 rounded-full transition-colors cursor-pointer"
						>
							<ShoppingCart className="w-5 h-5" />
							<span className="font-medium">Cart</span>
							{itemCount > 0 && (
								<span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
									{itemCount}
								</span>
							)}
						</span>
					</div>

					{/* Collection Info */}
					<div className="space-y-4">
						{collection.badge && (
							<div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium border border-white/10">
								{collection.badge}
							</div>
						)}

						<h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
							{translatedTitle}
						</h1>

						{translatedDescription && (
							<p className="text-xl text-white/90 max-w-2xl drop-shadow-md">
								{translatedDescription}
							</p>
						)}

						{/* Stats */}
						<div className="flex flex-wrap gap-6 pt-4">
							<div className="backdrop-blur-md bg-black/20 px-4 py-2 rounded-lg border border-white/10">
								<p className="text-white/80 text-sm">
									{t.collectionPage.productsInCollection}
								</p>
								<p className="text-2xl font-bold">{products.length}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Products Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{products.length > 0 ? (
					<CollectionProductsGrid
						products={products}
						collectionId={collectionId}
						collectionName={collection.title || collection.name}
					/>
				) : (
					<div className="text-center py-16">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
							<ShoppingCart className="w-8 h-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							{t.collectionPage.noProducts}
						</h3>
						<p className="text-gray-600 mb-6">
							This collection doesn't have any products yet.
						</p>
						<button
							onClick={() => router.push("/shops")}
							className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
						>
							{t.collectionPage.backToShops}
						</button>
					</div>
				)}
			</div>

			{/* Back to Top Button */}
			{showBackToTop && (
				<button
					onClick={scrollToTop}
					className="fixed bottom-8 right-8 p-4 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-110 z-50"
					aria-label="Back to top"
				>
					<ArrowLeft className="w-6 h-6 rotate-90" />
				</button>
			)}
		</div>
	);
}
