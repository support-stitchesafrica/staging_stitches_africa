"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Product } from "@/types";
import { productRepository, collectionRepository } from "@/lib/firestore";
import { generateProductMetadata } from "@/lib/utils/product-metadata";
import { ProductImageGallery } from "@/components/shops/products/ProductImageGallery";
import { formatPrice, calculateDiscountedPrice } from "@/lib/utils";
import { calculateCustomerPrice, calculateFinalPrice } from "@/lib/priceUtils";
import { Price, DiscountedPrice } from "@/components/common/Price";
import { CollectionProductPrice } from "@/components/collections/CollectionProductPrice";
import {
	generateBlurDataURL,
	RESPONSIVE_SIZES,
	IMAGE_DIMENSIONS,
} from "@/lib/utils/image-utils";
import { SafeImage } from "@/components/shops/ui/SafeImage";
import { Heart, Loader2, MessageCircle } from "lucide-react";
import { AddToCartButton } from "@/components/shops/cart/AddToCartButton";
import { ProductCard } from "@/components/shops/products/ProductCard";
import { TypeSpecificContent } from "@/components/shops/products/TypeSpecificContent";
import { ProductParameters } from "@/components/shops/products/ProductParameters";
import { SocialShareButton } from "@/components/shops/products/SocialShareButton";
import { ConsultationChatWidget } from "@/components/shops/products/ConsultationChatWidget";
import {
	ProductLayout,
	ProductSection,
} from "@/components/shops/products/ProductLayout";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { getActivityTracker } from "@/lib/analytics/activity-tracker";

import { ProductSearchService } from "@/lib/ai-assistant/product-search-service";
import type { FormattedProduct as ServiceFormattedProduct } from "@/lib/ai-assistant/product-search-service";
import { BogoProductIndicator } from "@/components/bogo/BogoProductIndicator";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslatedText } from "@/lib/i18n/useTranslatedText";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useConsultationWidget } from "@/contexts/ConsultationWidgetContext";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { SizeGuide } from "@/types";

export default function ProductDetailPage() {
	const params = useParams();
	const productId = params.id as string;
	const { user } = useAuth();
	const { userCountry } = useCurrency();
	const { addItem, addIndividualItemToCart, addCollectionToCart } = useCart();
	const { t } = useLanguage();
	const { isConsultationOpen, setIsConsultationOpen } = useConsultationWidget();

	const [product, setProduct] = useState<Product | null>(null);

	// Dynamic Translations
	const translatedTitle = useTranslatedText(product?.title);
	const translatedDescription = useTranslatedText(product?.description);
	const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, string>
	>({});
	const [quantity, setQuantity] = useState(1);
	const [isInWishlist, setIsInWishlist] = useState(false);
	const [hasRequiredMeasurements] = useState(true);
	const [selectedSize, setSelectedSize] = useState<string>("");
	const [selectedColor, setSelectedColor] = useState<string>("");
	const [selectedMultipleItems, setSelectedMultipleItems] = useState<string[]>(
		[],
	); // For multiple pricing
	const [showReturnPolicyDialog, setShowReturnPolicyDialog] = useState(false);
	const [showSizeGuide, setShowSizeGuide] = useState(false);
	const [fetchingSizeGuide, setFetchingSizeGuide] = useState(false);
	const [vendorSizeGuide, setVendorSizeGuide] = useState<SizeGuide | null>(
		null,
	);
	const [vendorSizeGuideImages, setVendorSizeGuideImages] = useState<string[]>(
		[],
	);
	const [hasFetchedSizeGuide, setHasFetchedSizeGuide] = useState(false);
	const [loadingRelated, setLoadingRelated] = useState(false);
	const [addingToCart, setAddingToCart] = useState(false);
	const [addingMultipleToCart, setAddingMultipleToCart] = useState(false);

	// Multiple pricing state
	// const [selectedMultipleItems, setSelectedMultipleItems] = useState<string[]>([]);

	useEffect(() => {
		if (productId) loadProduct();
	}, [productId]);

	// Update page metadata when product loads
	useEffect(() => {
		if (product) {
			updatePageMetadata(product, productId);
		}
	}, [product, productId]);

	const updatePageMetadata = (product: Product, productId: string) => {
		const baseUrl =
			typeof window !== "undefined"
				? window.location.origin
				: "https://www.stitchesafrica.com";
		const productUrl = `${baseUrl}/shops/products/${productId}`;

		const basePrice =
			typeof product.price === "number" ? product.price : product.price.base;
		const currency =
			typeof product.price === "object" ? product.price.currency : "USD";
		const discountedPrice = calculateFinalPrice(
			basePrice,
			product.discount || 0,
		);

		const image =
			product.images && product.images.length > 0
				? product.images[0]
				: `${baseUrl}/placeholder-product.svg`;

		// Update document title
		document.title = `${product.title} - Stitches Africa`;

		// Update or create meta tags
		const updateMetaTag = (
			property: string,
			content: string,
			isProperty = true,
		) => {
			const attribute = isProperty ? "property" : "name";
			let meta = document.querySelector(`meta[${attribute}="${property}"]`);
			if (!meta) {
				meta = document.createElement("meta");
				meta.setAttribute(attribute, property);
				document.head.appendChild(meta);
			}
			meta.setAttribute("content", content);
		};

		// Open Graph tags
		updateMetaTag("og:title", `${product.title} - Stitches Africa`);
		updateMetaTag(
			"og:description",
			product.description ||
				`${product.title} by ${product.vendor?.name || "Stitches Africa"}`,
		);
		updateMetaTag("og:image", image);
		updateMetaTag("og:url", productUrl);
		updateMetaTag("og:type", "product");
		updateMetaTag("og:site_name", "Stitches Africa");
		updateMetaTag("og:price:amount", discountedPrice.toString());
		updateMetaTag("og:price:currency", currency);

		// Twitter Card tags
		updateMetaTag("twitter:card", "summary_large_image", false);
		updateMetaTag("twitter:title", `${product.title} - Stitches Africa`, false);
		updateMetaTag(
			"twitter:description",
			product.description ||
				`${product.title} by ${product.vendor?.name || "Stitches Africa"}`,
			false,
		);
		updateMetaTag("twitter:image", image, false);
		updateMetaTag("twitter:site", "@StitchesAfrica", false);

		// Product-specific meta tags
		updateMetaTag("product:price:amount", discountedPrice.toString());
		updateMetaTag("product:price:currency", currency);
		updateMetaTag(
			"product:availability",
			product.availability === "out_of_stock" ? "out of stock" : "in stock",
		);
		updateMetaTag("product:brand", product.vendor?.name || "Stitches Africa");
		updateMetaTag("product:category", product.category || "Fashion");
	};

	const loadProduct = async () => {
		try {
			setLoading(true);
			// ✅ Fetch product with tailor/vendor info (with caching)
			let productData =
				await productRepository.getByIdWithTailorInfo(productId);

			// If product not found in main collection, try to fetch from collection products
			if (!productData) {
				// Try to get from collection products (for user-created products)
				try {
					const collectionProductData =
						await collectionRepository.getCollectionProductById(
							productId,
							user?.uid || "",
						);
					if (collectionProductData) {
						// Convert collection product to standard Product format
						productData = {
							product_id: collectionProductData.id || productId,
							title: collectionProductData.title || "Untitled Product",
							description: collectionProductData.description || "",
							type: "ready-to-wear" as const,
							category: collectionProductData.category || "General",
							availability: "in_stock", // Collection products bypass stock checks
							skipStockCheck: true, // Flag to bypass stock validation downstream
							status: "verified",
							price: {
								base: collectionProductData.price || 0,
								currency: "NGN",
							},
							discount: 0,
							deliveryTimeline: "7-10 business days",
							returnPolicy: "30 days return policy",
							rtwOptions: {
								sizes: collectionProductData.size
									? collectionProductData.size
											.split(",")
											.map((s: string) => s.trim())
											.filter(Boolean)
									: [],
								colors: collectionProductData.color
									? collectionProductData.color
											.split(",")
											.map((c: string) => c.trim())
											.filter(Boolean)
									: [],
							},
							images: collectionProductData.images || [],
							tailor_id: collectionProductData.createdBy || user?.uid || "",
							tailor: collectionProductData.brandName || "Collection Product",
							vendor: {
								id: collectionProductData.createdBy || user?.uid || "",
								name: collectionProductData.brandName || "Collection Vendor",
								email: "",
								phone: "",
							},
							tags: [],
							// Add multiple pricing data if available
							enableMultiplePricing:
								collectionProductData.enableMultiplePricing || false,
							individualItems: collectionProductData.individualItems || [],
							createdAt:
								collectionProductData.createdAt?.toDate?.()?.toISOString() ||
								new Date().toISOString(),
							updatedAt:
								collectionProductData.updatedAt?.toDate?.()?.toISOString() ||
								new Date().toISOString(),
						};
					}
				} catch (collectionError) {
					console.warn("Could not fetch collection product:", collectionError);
				}
			}

			if (!productData) {
				setProduct(null);
				setLoading(false);
				return;
			}

			// Set product immediately to show the page
			setProduct(productData);
			setLoading(false);

			// Load related products in background (non-blocking)
			loadRelatedProducts(productData).catch((err) =>
				console.error("Error loading related products:", err),
			);

			// Track product view for AI recommendations (existing)
			trackProductView(productId).catch((err) =>
				console.warn("Could not track product view:", err),
			);

			// Track product view for vendor analytics (new)
			// Validates: Requirements 21.1
			if (productData.tailor_id) {
				const activityTracker = getActivityTracker();
				activityTracker
					.trackProductView(productId, productData.tailor_id, user?.uid)
					.catch((err) =>
						console.warn("Could not track product view for analytics:", err),
					);
			}

			// Track BOGO view if applicable
			try {
				const { bogoMappingService } =
					await import("@/lib/bogo/mapping-service");
				const mapping = await bogoMappingService.getActiveMapping(productId);

				if (mapping) {
					const { bogoClientTracker } =
						await import("@/lib/bogo/client-tracking-service");
					bogoClientTracker.trackView(mapping.id, productId, user?.uid);
				}
			} catch (err) {
				console.warn("Could not track BOGO view:", err);
			}
		} catch (error) {
			console.error("Error loading product:", error);
			setLoading(false);
		}
	};

	// Track product view for AI recommendations
	const trackProductView = async (productId: string) => {
		try {
			// Get unique user identifier
			const uniqueUserId =
				localStorage.getItem("ai-chat-unique-user-id") ||
				`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Track the view interaction
			await fetch("/api/ai-assistant/user-preferences", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: uniqueUserId,
					productId: productId,
					interactionType: "view",
				}),
			});

			// Also track this as a general interest indicator
			await fetch("/api/ai-assistant/recommended-products", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productIds: [productId],
					userId: uniqueUserId,
					sessionId: `session_${Date.now()}`,
					interactionType: "view",
				}),
			});
		} catch (error) {
			console.warn("Could not track product view:", error);
		}
	};

	// Update the loadRelatedProducts function to use AI recommendations
	const loadRelatedProducts = async (currentProduct: Product) => {
		try {
			setLoadingRelated(true);
			// Use AI recommendations with the current product
			await loadAIRecommendations(currentProduct.product_id, currentProduct);
		} finally {
			setLoadingRelated(false);
		}
	};

	// Update the loadAIRecommendations function to use cross-vendor recommendations
	const loadAIRecommendations = async (
		currentProductId: string,
		currentProduct: Product,
	) => {
		try {
			// Get cross-vendor recommendations immediately (fastest path)
			let serviceProducts =
				await ProductSearchService.getCrossVendorRecommendations(
					currentProductId,
					8,
				);

			// If we don't have enough, fall back to similar products
			if (serviceProducts.length < 4) {
				const similarProducts = await ProductSearchService.getSimilarProducts(
					currentProductId,
					8,
				);
				serviceProducts = [
					...serviceProducts,
					...similarProducts.slice(0, 8 - serviceProducts.length),
				];
			}

			// Convert and set products immediately
			const formattedProducts = serviceProducts.map((p) => ({
				product_id: p.id,
				title: p.title,
				description: p.description || "",
				price: {
					base: p.price,
					currency: p.currency || "USD",
					discount: p.discount,
				},
				discount: p.discount,
				images: p.images,
				category: p.category || "",
				type: p.type as "ready-to-wear" | "bespoke",
				availability: p.availability || "in_stock",
				tailor_id: p.vendor.id,
				tailor: p.vendor.name,
				vendor: {
					id: p.vendor.id,
					name: p.vendor.name,
					logo: p.vendor.logo,
				},
				tags: p.tags || [],
				deliveryTimeline: p.deliveryTimeline,
			})) as Product[];

			setRelatedProducts(formattedProducts);

			// Optionally enhance with user preferences in background (non-blocking)
			const userId =
				localStorage.getItem("ai-chat-unique-user-id") ||
				`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			enhanceWithUserPreferences(currentProductId, userId).catch(() => {
				// Silently fail - we already have recommendations
			});
		} catch (error) {
			console.error("Error loading AI recommendations:", error);
			// Fallback to the original related products logic
			loadRelatedProductsFallback(currentProduct);
		}
	};

	// Background enhancement with user preferences (non-blocking)
	const enhanceWithUserPreferences = async (
		currentProductId: string,
		uniqueUserId: string,
	) => {
		try {
			// Get user ID for personalized recommendations
			const userId =
				uniqueUserId ||
				localStorage.getItem("ai-chat-unique-user-id") ||
				`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Get user preferences to understand their interests
			const response = await fetch(
				`/api/ai-assistant/user-preferences?userId=${userId}&limit=20`,
				{
					signal: AbortSignal.timeout(3000), // 3 second timeout
				},
			);

			if (!response.ok) {
				return; // Silently fail
			}

			const data = await response.json();

			// If we have preferences, potentially update recommendations
			// This is optional enhancement - we already have recommendations showing
			if (data.preferences && data.preferences.length > 0) {
				// Could enhance recommendations here, but not critical
				console.log("User preferences loaded for future enhancement");
			}
		} catch (error) {
			// Silently fail - we already have recommendations
			console.log("Could not enhance with user preferences");
		}
	};

	// Rename the original function to use as fallback with enhanced vendor diversity
	const loadRelatedProductsFallback = async (currentProduct: Product) => {
		try {
			const allProducts = await productRepository.getAllWithTailorInfo();
			const scoredProducts = allProducts
				.filter((p) => p.product_id !== currentProduct.product_id)
				.map((p) => {
					let score = 0;

					// Higher score for products from different vendors (to promote diversity)
					if (p.tailor_id !== currentProduct.tailor_id) score += 15;
					else score += 5; // Still include same vendor products but with lower priority

					// Similarity scoring based on attributes
					if (p.category === currentProduct.category) score += 10;
					if (p.type === currentProduct.type) score += 8;

					// Tag similarity
					if (currentProduct.tags && p.tags) {
						const commonTags = currentProduct.tags.filter((tag) =>
							p.tags.includes(tag),
						);
						score += commonTags.length * 4; // Increased weight for tag similarity
					}

					// Price similarity (within 30% range)
					const currentPrice =
						typeof currentProduct.price === "number"
							? currentProduct.price
							: currentProduct.price.base;
					const productPrice =
						typeof p.price === "number" ? p.price : p.price.base;
					if (Math.abs(currentPrice - productPrice) / currentPrice <= 0.3)
						score += 6;

					// Color/fabric similarity for fashion products
					if (currentProduct.rtwOptions?.colors && p.rtwOptions?.colors) {
						const commonColors = currentProduct.rtwOptions.colors.filter(
							(color) => p.rtwOptions?.colors?.includes(color),
						);
						score += commonColors.length * 3;
					}

					// Fabric similarity
					if (
						currentProduct.rtwOptions?.fabric &&
						p.rtwOptions?.fabric &&
						currentProduct.rtwOptions.fabric === p.rtwOptions.fabric
					) {
						score += 5;
					}

					return { product: p, score };
				})
				.filter((item) => item.score > 0) // Only include products with some similarity
				.sort((a, b) => b.score - a.score) // Sort by similarity score
				.slice(0, 8) // Limit to 8 products
				.map((item) => item.product);

			setRelatedProducts(scoredProducts);
		} catch (error) {
			console.error("Error loading related products:", error);
		}
	};

	const handleWishlistToggle = () => setIsInWishlist(!isInWishlist);

	const handleOpenSizeGuide = async () => {
		setShowSizeGuide(true);

		// If we already fetched it, or there's no tailor ID, skip
		if (hasFetchedSizeGuide || !product?.tailor_id) return;

		try {
			setFetchingSizeGuide(true);
			const vendorRef = doc(db, "staging_tailors", product.tailor_id);
			const vendorDoc = await getDoc(vendorRef);
			if (vendorDoc.exists()) {
				const data = vendorDoc.data();
				if (data?.sizeGuide) {
					setVendorSizeGuide(data.sizeGuide);
				} else {
					setVendorSizeGuide({ rows: [], columns: [] });
				}

				if (data?.sizeGuideImages) {
					setVendorSizeGuideImages(data.sizeGuideImages);
				}
			} else {
				setVendorSizeGuide({ rows: [], columns: [] });
			}
			setHasFetchedSizeGuide(true);
		} catch (err) {
			console.warn("Could not fetch vendor size guide:", err);
			setVendorSizeGuide({ rows: [], columns: [] });
			setHasFetchedSizeGuide(true);
		} finally {
			setFetchingSizeGuide(false);
		}
	};

	// Helper functions for option validation - safe implementation
	const getAvailableSizes = () => {
		const sizes: string[] = [];

		try {
			const productAny = product as any;
			if (productAny?.sizes && Array.isArray(productAny.sizes)) {
				productAny.sizes.forEach((size: any) => {
					if (size && typeof size === "object" && size.label) {
						sizes.push(String(size.label));
					} else if (typeof size === "string") {
						sizes.push(size);
					}
				});
			} else if (product?.rtwOptions?.sizes) {
				product.rtwOptions.sizes.forEach((size) => {
					if (typeof size === "object" && size.label) {
						sizes.push(String(size.label));
					} else if (typeof size === "string") {
						sizes.push(String(size));
					}
				});
			}
		} catch (error) {
			console.error("Error getting sizes:", error);
		}

		return sizes;
	};

	const getSizeStock = (sizeLabel: string): number => {
		try {
			// Collection products bypass stock checks - always show as available
			if (product?.skipStockCheck) return 999;

			const productAny = product as any;

			// First check the sizes array
			if (productAny?.sizes && Array.isArray(productAny.sizes)) {
				const sizeObj = productAny.sizes.find(
					(size: any) => size.label === sizeLabel,
				);
				if (sizeObj && sizeObj.quantity !== undefined) {
					return Number(sizeObj.quantity || 0);
				}
			}

			// Then check rtwOptions.sizes
			if (
				product?.rtwOptions?.sizes &&
				Array.isArray(product.rtwOptions.sizes)
			) {
				const sizeObj = product.rtwOptions.sizes.find((size: any) => {
					if (typeof size === "object" && size.label === sizeLabel) {
						return true;
					}
					return false;
				});
				if (
					sizeObj &&
					typeof sizeObj === "object" &&
					sizeObj.quantity !== undefined
				) {
					return Number(sizeObj.quantity || 0);
				}
			}

			// Check if there's a general stock/inventory field
			if (productAny?.inventory && typeof productAny.inventory === "object") {
				const sizeStock = productAny.inventory[sizeLabel];
				if (sizeStock !== undefined) {
					return Number(sizeStock || 0);
				}
			}

			// Check if there's a stock field with size breakdown
			if (productAny?.stock && typeof productAny.stock === "object") {
				const sizeStock = productAny.stock[sizeLabel];
				if (sizeStock !== undefined) {
					return Number(sizeStock || 0);
				}
			}

			// If no specific size stock found, return 0 instead of 1
			return 0;
		} catch (error) {
			console.error("Error getting size stock:", error);
			return 0;
		}
	};

	const getAvailableColors = () => {
		if (product?.type === "ready-to-wear" && product.rtwOptions?.colors) {
			return product.rtwOptions.colors;
		}
		return [];
	};

	// Keep old function for backward compatibility
	const getSizeQuantity = (sizeLabel: string) => getSizeStock(sizeLabel);

	const getStockStatus = () => {
		const productAny = product as any;
		return productAny?.in_stock || product?.availability || "in_stock";
	};

	const isAddToCartDisabled = () => {
		if (!product) return true;

		// Collection products skip all stock checks
		if (product.skipStockCheck) return false;

		const availableSizes = getAvailableSizes();
		const availableColors = getAvailableColors();
		const stockStatus = getStockStatus();

		// If sizes exist and none is selected, disable button
		if (availableSizes.length > 0 && !selectedSize) {
			return true;
		}

		// If colors exist and none is selected, disable button
		if (availableColors.length > 0 && !selectedColor) {
			return true;
		}

		// Check if selected size is out of stock
		if (selectedSize && getSizeQuantity(selectedSize) === 0) {
			return true;
		}

		// Check if product is out of stock
		if (stockStatus === "out_of_stock") {
			return true;
		}

		// Check wear_quantity (if exists and is 0)
		if (
			product.wear_quantity !== undefined &&
			Number(product.wear_quantity) === 0
		) {
			return true;
		}

		// For ready-to-wear, check if any sizes are available
		if (product.type === "ready-to-wear" && availableSizes.length > 0) {
			const hasStock = availableSizes.some(
				(sizeLabel: string) => getSizeStock(sizeLabel) > 0,
			);
			if (!hasStock) {
				return true;
			}
		}

		// For bespoke items, check measurements requirement
		if (product.type === "bespoke" && !hasRequiredMeasurements) {
			return true;
		}

		return false;
	};

	const handleSizeSelect = (size: string) => {
		setSelectedSize(size);
		setSelectedOptions((prev) => ({ ...prev, size }));
	};

	const handleColorSelect = (color: string) => {
		setSelectedColor(color);
		setSelectedOptions((prev) => ({ ...prev, color }));
	};

	const handleMultipleItemToggle = (itemId: string) => {
		if (selectedMultipleItems.includes(itemId)) {
			setSelectedMultipleItems([]); // Deselect if already selected
		} else {
			setSelectedMultipleItems([itemId]); // Single selection mode
		}
	};

	const getDisabledReason = () => {
		if (!product) return t.productPage.validation.unavailable;

		// Collection products skip all stock checks
		if (product.skipStockCheck) return undefined;

		const availableSizes = getAvailableSizes();
		const availableColors = getAvailableColors();
		const stockStatus = getStockStatus();

		// Check if product is out of stock
		if (stockStatus === "out_of_stock") {
			return t.productPage.validation.outOfStock;
		}

		// Check wear_quantity
		if (
			product.wear_quantity !== undefined &&
			Number(product.wear_quantity) === 0
		) {
			return t.productPage.validation.outOfStock;
		}

		// For ready-to-wear, check if any sizes are available
		if (product.type === "ready-to-wear" && availableSizes.length > 0) {
			const hasStock = availableSizes.some(
				(sizeLabel: string) => getSizeStock(sizeLabel) > 0,
			);
			if (!hasStock) {
				return t.productPage.validation.allSizesOutOfStock;
			}
		}

		// If sizes exist and none is selected
		if (availableSizes.length > 0 && !selectedSize) {
			return t.productPage.validation.selectSize;
		}

		// If colors exist and none is selected
		if (availableColors.length > 0 && !selectedColor) {
			return t.productPage.validation.selectColor;
		}

		// Check if selected size is out of stock
		if (selectedSize && getSizeQuantity(selectedSize) === 0) {
			return t.productPage.validation.sizeOutOfStock.replace(
				"{size}",
				selectedSize,
			);
		}

		// For bespoke items, check measurements requirement
		if (product.type === "bespoke" && !hasRequiredMeasurements) {
			return t.productPage.validation.measurementsRequired;
		}

		return undefined;
	};

	// Return Policy Content based on product type
	const getReturnPolicyContent = () => {
		const isBespoke = product?.type === "bespoke";

		return (
			<div className="max-h-[500px] overflow-y-auto p-4 space-y-4 text-sm">
				<div className="flex justify-center mb-4">
					<img
						src="/Stitches-Africa-Logo-06.png"
						alt="Stitches Africa Logo"
						className="h-32 w-auto"
					/>
				</div>

				<h2 className="text-xl font-bold text-center">
					Return, Refund and Cancellation Policy
				</h2>
				<p className="text-center text-gray-600">
					At Stitches Africa, we are committed to ensuring customer satisfaction
					across all purchases made through our platform.
				</p>

				<section className="space-y-2">
					<h3 className="font-semibold text-lg">1. Overview</h3>
					<p>
						This Return and Refund Policy applies to all purchases made via the
						Stitches Africa platform, whether from Ready-to-Wear (RTW)
						collections or from verified fashion vendors.
					</p>
				</section>

				{isBespoke ? (
					// Bespoke-specific content
					<>
						<section className="space-y-2 bg-purple-50 p-4 rounded-lg border border-purple-200">
							<h3 className="font-semibold text-lg text-purple-900">
								Bespoke / Made-to-Measure Items Policy
							</h3>
							<p>
								<strong>Important:</strong> Orders classified as{" "}
								<strong>
									Bespoke or Made-to-Measure are not eligible for return,
									refund, or exchange
								</strong>
								, as these are customized to individual measurements and
								specifications.
							</p>
							<p>
								However, if a{" "}
								<strong>production defect or error on the vendor's part</strong>{" "}
								is confirmed, Stitches Africa will mediate a resolution, which
								may include a remake or partial refund based on the case review.
							</p>
						</section>

						<section className="space-y-2">
							<h3 className="font-semibold text-lg">
								Order Cancellation for Bespoke Items
							</h3>
							<p className="text-red-700 font-medium">
								Once you have placed an order for a bespoke item,{" "}
								<strong>cancellations will not be accepted</strong>.
							</p>
						</section>
					</>
				) : (
					// Ready-to-Wear specific content
					<>
						<section className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
							<h3 className="font-semibold text-lg text-blue-900">
								2. Eligibility for Returns (Ready-to-Wear Items)
							</h3>
							<p>
								You may request a return or exchange within{" "}
								<strong>7 days</strong> of receiving your order, provided:
							</p>
							<ul className="list-disc pl-6 space-y-1">
								<li>
									The item is unused, unworn, unwashed, and in its original
									packaging with all tags and labels intact.
								</li>
								<li>
									Proof of purchase (order number or receipt) is provided.
								</li>
								<li>
									The return request is approved by both Stitches Africa Support
									and the Vendor after review.
								</li>
							</ul>
						</section>

						<section className="space-y-2">
							<h3 className="font-semibold text-lg">3. Return Process</h3>
							<ul className="list-disc pl-6 space-y-1">
								<li>
									Initiate a return request via your Stitches Africa account
									dashboard or by emailing{" "}
									<strong>orders@stitchesafrica.com</strong> within the return
									window.
								</li>
								<li>
									Once approved, you will receive a Return Authorization (RA)
									and shipping instructions.
								</li>
								<li>
									Return shipping costs are borne by the purchaser, except where
									the return is due to vendor error, damage, or incorrect item.
								</li>
							</ul>
						</section>

						<section className="space-y-2">
							<h3 className="font-semibold text-lg">4. Refunds</h3>
							<p>
								Refunds will be processed after the item has been received and
								inspected by the vendor or Stitches Africa Quality Team.
							</p>
							<ul className="list-disc pl-6 space-y-1">
								<li>
									Approved refunds issued within{" "}
									<strong>5–10 business days</strong> to the original payment
									method.
								</li>
								<li>
									Shipping, handling, and service fees are non-refundable.
								</li>
								<li>
									Bank/payment gateway may require an additional 7–14 working
									days to reflect the credit.
								</li>
							</ul>
						</section>

						<section className="space-y-2">
							<h3 className="font-semibold text-lg">5. Exchanges</h3>
							<p>
								We offer exchanges for Ready-to-Wear items only, where the
								desired size, color, or style is available. If unavailable, you
								may opt for a refund or store credit.
							</p>
						</section>

						<section className="space-y-2">
							<h3 className="font-semibold text-lg">
								Order Cancellation Policy
							</h3>
							<ul className="list-disc pl-6 space-y-1">
								<li>
									<strong>Before Shipment:</strong> Full refund if cancelled
									before tracking information is generated. Multiple
									cancellations may result in suspension.
								</li>
								<li>
									<strong>After Shipment:</strong> Cannot be cancelled. You must
									receive the item and initiate a return request.
								</li>
							</ul>
						</section>
					</>
				)}

				<section className="space-y-2">
					<h3 className="font-semibold text-lg">
						{isBespoke ? "7" : "6"}. Damaged, Defective, or Incorrect Items
					</h3>
					<p>
						If your order arrives damaged, defective, or incorrect, notify us
						within <strong>48 hours</strong> of delivery with supporting photos
						or videos. Once verified, Stitches Africa will facilitate a
						replacement or full refund at no additional cost.
					</p>
				</section>

				<section className="space-y-2">
					<h3 className="font-semibold text-lg">
						{isBespoke ? "8" : "7"}. Vendor Accountability
					</h3>
					<p>
						Vendors are required to maintain product accuracy and quality
						standards. Continuous violations may result in suspension from the
						platform.
					</p>
				</section>

				<section className="space-y-2 border-t pt-4">
					<h3 className="font-semibold text-lg">Contact Us</h3>
					<p>
						For all return, exchange, or refund inquiries, please visit our
						website{" "}
						<a
							href="https://www.stitchesafrica.com"
							className="text-blue-600 hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							www.stitchesafrica.com
						</a>{" "}
						or email us at <strong>orders@stitchesafrica.com</strong>
					</p>
				</section>
			</div>
		);
	};

	const handleAddIndividualItem = async (product: Product, item: any) => {
		try {
			// Use the quantity from the individual item, defaulting to 1 if not specified
			const itemQuantity = item.quantity || 1;

			// Pass selected options (size and color) if they exist
			const options = {
				size: selectedSize || undefined,
				color: selectedColor || undefined,
			};

			await addIndividualItemToCart(product, item, options);
			// Optional: Show success message
			console.log(`Added ${item.name} (quantity: ${itemQuantity}) to cart`);
		} catch (error) {
			console.error("Error adding individual item to cart:", error);
			// Optional: Show error message
		}
	};

	const handleAddAllItems = async (product: Product) => {
		try {
			// For products with multiple pricing, add all individual items
			if (product.enableMultiplePricing && product.individualItems) {
				for (const item of product.individualItems) {
					await addIndividualItemToCart(product, item);
				}
			} else {
				// For regular products, use the existing add to cart functionality
				// This would be handled by the regular AddToCartButton
				console.log("Adding regular product to cart");
			}
			// Optional: Show success message
			console.log("Added all items to cart");
		} catch (error) {
			console.error("Error adding all items to cart:", error);
			// Optional: Show error message
		}
	};

	if (loading)
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
					<div className="aspect-square bg-gray-200 rounded-lg"></div>
					<div className="space-y-4">
						<div className="h-8 bg-gray-200 rounded w-3/4"></div>
						<div className="h-4 bg-gray-200 rounded w-1/2"></div>
						<div className="h-6 bg-gray-200 rounded w-1/4"></div>
					</div>
				</div>
			</div>
		);

	if (!product)
		return (
			<div className="container mx-auto px-4 py-8 text-center">
				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					Product Not Found
				</h1>
				<p className="text-gray-600">
					This product may have been removed or is unavailable.
				</p>
			</div>
		);

	const basePrice =
		typeof product.price === "number" ? product.price : product.price.base;
	const currency =
		typeof product.price === "object" ? product.price.currency : "USD";

	// Calculate the display price based on product type and selection
	const getDisplayPrice = () => {
		if (
			product.enableMultiplePricing &&
			product.individualItems &&
			selectedMultipleItems.length > 0
		) {
			// For multiple pricing, show selected item price
			const selectedItem = product.individualItems.find((item) =>
				selectedMultipleItems.includes(item.id),
			);
			return selectedItem ? selectedItem.price : basePrice;
		}
		return basePrice; // Default to base price
	};

	const displayPrice = getDisplayPrice();

	// Apply platform commission (20%) and duty (if applicable) for all products
	const customerBasePrice = calculateCustomerPrice(displayPrice, userCountry);
	const discountedPrice =
		(product.discount || 0) > 0
			? calculateFinalPrice(displayPrice, product.discount || 0, userCountry)
			: customerBasePrice;

	// Generate structured data for SEO
	const structuredData = {
		"@context": "https://schema.org/",
		"@type": "Product",
		name: product.title,
		image: product.images || [],
		description: product.description,
		brand: {
			"@type": "Brand",
			name: product.vendor?.name || "Stitches Africa",
		},
		offers: {
			"@type": "Offer",
			url:
				typeof window !== "undefined"
					? window.location.href
					: `https://www.stitchesafrica.com/shops/products/${productId}`,
			priceCurrency: currency,
			price: discountedPrice,
			priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0],
			availability:
				product.availability === "out_of_stock"
					? "https://schema.org/OutOfStock"
					: "https://schema.org/InStock",
			seller: {
				"@type": "Organization",
				name: product.vendor?.name || "Stitches Africa",
			},
		},
		category: product.category,
		sku: productId,
	};

	return (
		<>
			{/* Structured Data for SEO */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
			/>

			<div className="container-responsive py-6 sm:py-8 bg-white">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
					<div className="space-y-4">
						<ProductImageGallery
							images={product.images}
							productTitle={product.title}
						/>

						{/* Video Content */}
						{product.videoUrl && (
							<div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
								<video
									controls
									className="w-full h-full object-cover"
									poster={product.thumbnail}
								>
									<source src={product.videoUrl} type="video/mp4" />
									Your browser does not support the video tag.
								</video>
							</div>
						)}
					</div>

					<ProductLayout product={product}>
						{/* Header & Actions */}
						<div className="flex justify-between items-center">
							<span
								className={`px-3 py-1 rounded-full text-sm font-medium ${
									product.type === "bespoke"
										? "bg-purple-100 text-purple-800"
										: "bg-blue-100 text-blue-800"
								}`}
							>
								{product.type === "bespoke" ? "Bespoke" : "Ready-to-Wear"}
							</span>
							<div className="flex items-center gap-2">
								<SocialShareButton
									url={
										typeof window !== "undefined"
											? window.location.href
											: `https://www.stitchesafrica.com/shops/products/${productId}`
									}
									title={product.title}
									description={product.description}
									image={
										product.images && product.images.length > 0
											? product.images[0]
											: undefined
									}
								/>
								<span
									onClick={handleWishlistToggle}
									className={`p-2 rounded-full ${
										isInWishlist
											? "bg-red-500 text-white"
											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
									title={
										isInWishlist ? "Remove from wishlist" : "Add to wishlist"
									}
								>
									<Heart
										size={20}
										className={isInWishlist ? "fill-current" : ""}
									/>
								</span>
							</div>
						</div>

						<h1 className="text-3xl font-bold text-gray-900">
							{translatedTitle}
						</h1>
						<p className="text-gray-600 text-lg">
							by {product.vendor?.name || "Unknown Tailor"}
						</p>

						{/* Price */}
						<div className="mb-6">
							{(() => {
								const displayPrice = getDisplayPrice();
								const customerPrice = calculateCustomerPrice(
									displayPrice,
									userCountry,
								);
								const finalPrice =
									(product.discount || 0) > 0
										? calculateFinalPrice(
												displayPrice,
												product.discount || 0,
												userCountry,
											)
										: customerPrice;

								return product.discount > 0 ? (
									<DiscountedPrice
										originalPrice={customerPrice}
										salePrice={finalPrice}
										originalCurrency={currency}
										size="lg"
									/>
								) : (
									<Price
										price={customerPrice}
										originalCurrency={currency}
										size="lg"
										variant="accent"
									/>
								);
							})()}
						</div>

						{/* Multiple Pricing Item Selection */}
						{product.enableMultiplePricing &&
							product.individualItems &&
							product.individualItems.length > 0 && (
								<div className="mb-6">
									<h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">
										SELECT ITEM
									</h3>
									<div className="flex flex-wrap gap-2">
										{product.individualItems.map((item) => {
											const isSelected = selectedMultipleItems.includes(
												item.id,
											);

											// Calculate individual item price with commission and duty
											const itemBasePrice = item.price;
											const itemCustomerPrice = calculateCustomerPrice(
												itemBasePrice,
												userCountry,
											);
											const itemFinalPrice =
												(product.discount || 0) > 0
													? calculateFinalPrice(
															itemBasePrice,
															product.discount || 0,
															userCountry,
														)
													: itemCustomerPrice;

											return (
												<button
													key={item.id}
													onClick={() => setSelectedMultipleItems([item.id])}
													className={`px-4 py-3 rounded-lg border transition-all duration-200 font-medium shadow-sm ${
														isSelected
															? "border-black !bg-black !text-white shadow-md"
															: "border-black !bg-white !text-black hover:bg-gray-50"
													}`}
												>
													<div className="text-center">
														<div className="font-semibold">{item.name}</div>
														<div className="text-sm opacity-90">
															{/* Price commented out as per request */}
															{/* <span
															className={`${isSelected ? "!text-white" : "!text-black"}`}
															>
																<Price
																	price={itemFinalPrice}
																	originalCurrency={currency}
																	size="sm"
																	variant="default"
																	className={`${isSelected ? "!text-white" : "!text-black"}`}
																/>
															</span> */}
														</div>
													</div>
												</button>
											);
										})}
										{/* Complete Set Option */}
										<button
											onClick={() => setSelectedMultipleItems([])}
											className={`px-4 py-3 rounded-lg border transition-all duration-200 font-medium shadow-sm ${
												selectedMultipleItems.length === 0
													? "border-black !bg-black !text-white shadow-md"
													: "border-black !bg-white !text-black hover:bg-gray-50"
											}`}
										>
											<div className="text-center">
												<div className="font-semibold">Complete Set</div>
												{/* Price hidden for consistency */}
											</div>
										</button>
									</div>
								</div>
							)}

						{/* Size Selection - Moved up after price for better visibility */}
						{(() => {
							const sizes = getAvailableSizes();
							if (sizes.length === 0) return null;

							return (
								<div className="mb-6">
									<h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">
										SELECT SIZE
									</h3>
									<div className="flex flex-wrap gap-2">
										{sizes.map((sizeLabel, index) => {
											// Now sizeLabel is a string, not an object
											if (!sizeLabel || typeof sizeLabel !== "string")
												return null;

											const label = String(sizeLabel);
											const qty = getSizeStock(label);

											if (!label) return null;

											const isOutOfStock = qty === 0;

											return (
												<button
													key={`size-${label}-${index}`}
													onClick={() =>
														!isOutOfStock && handleSizeSelect(label)
													}
													disabled={isOutOfStock}
													className={`px-4 py-3 text-sm font-medium rounded-lg border transition-all duration-200 relative ${
														isOutOfStock
															? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
															: selectedSize === label
																? "border-black bg-black text-white"
																: "border-black bg-white! text-black! hover:bg-gray-50"
													}`}
													title={
														isOutOfStock ? "Out of stock" : `${qty} available`
													}
												>
													<div className="text-center">
														<div className="font-semibold">{label}</div>
													</div>
													{isOutOfStock && (
														<div className="absolute inset-0 flex items-center justify-center">
															<div className="w-full h-0.5 bg-gray-400 transform rotate-45"></div>
														</div>
													)}
												</button>
											);
										})}
									</div>
									{!selectedSize && (
										<p
											className="text-sm text-gray-500 mt-2 cursor-pointer underline hover:text-gray-800"
											onClick={handleOpenSizeGuide}
										>
											Size Guide
										</p>
									)}
								</div>
							);
						})()}

						{/* Color Selection - Moved up after size for better visibility */}
						{getAvailableColors().length > 0 && (
							<div>
								<h3 className="text-lg font-semibold text-gray-900 mb-3">
									Select Color
								</h3>
								<div className="flex flex-wrap gap-4">
									{getAvailableColors().map((color) => {
										// Convert color name to a CSS color value
										const getColorValue = (colorName: string) => {
											const colorMap: Record<string, string> = {
												red: "#ef4444",
												blue: "#3b82f6",
												green: "#10b981",
												yellow: "#f59e0b",
												purple: "#8b5cf6",
												pink: "#ec4899",
												black: "#000000",
												white: "#ffffff",
												gray: "#6b7280",
												grey: "#6b7280",
												brown: "#92400e",
												orange: "#f97316",
												navy: "#1e3a8a",
												beige: "#f5f5dc",
												cream: "#fffdd0",
												maroon: "#800000",
												olive: "#808000",
												teal: "#14b8a6",
												indigo: "#6366f1",
												lime: "#84cc16",
												cyan: "#06b6d4",
												rose: "#f43f5e",
												emerald: "#059669",
												violet: "#7c3aed",
												amber: "#f59e0b",
												slate: "#64748b",
												zinc: "#71717a",
												neutral: "#737373",
												stone: "#78716c",
												ivory: "#fffff0",
												"sky blue": "#87ceeb",
												skyblue: "#87ceeb",
											};
											return colorMap[colorName.toLowerCase()] || colorName;
										};

										const colorValue = getColorValue(color);

										return (
											<div
												key={color}
												onClick={() => handleColorSelect(color)}
												className={`cursor-pointer p-2 rounded-lg transition-all duration-200 ${
													selectedColor === color
														? "ring-2 ring-blue-500 ring-offset-2 bg-blue-50"
														: "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"
												}`}
												title={color}
											>
												<div className="flex flex-col items-center gap-2">
													<div
														className="w-10 h-10 rounded-full border-2 shadow-sm"
														style={{
															backgroundColor: colorValue,
															border:
																colorValue === "#ffffff"
																	? "2px solid #d1d5db"
																	: "2px solid #e5e7eb",
														}}
													/>
													<span className="text-xs font-medium text-gray-700 capitalize">
														{color}
													</span>
												</div>
											</div>
										);
									})}
								</div>
								{getAvailableColors().length > 0 && !selectedColor && (
									<p className="text-sm text-red-600 mt-2">
										Please select a color to continue
									</p>
								)}
								{selectedColor && (
									<div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
										<p className="text-sm text-green-700 font-medium">
											✓ Color {selectedColor} selected
										</p>
									</div>
								)}
							</div>
						)}

						{/* Quantity Selection - Enhanced with better UX */}
						<div className="mb-6">
							<div className="flex items-center gap-4">
								<div className="flex items-center border border-gray-300 rounded-lg">
									<button
										onClick={() => setQuantity(Math.max(1, quantity - 1))}
										disabled={quantity <= 1}
										className="px-4 py-2 text-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
									>
										−
									</button>
									<div className="px-6 py-2 text-lg font-semibold bg-gray-50 min-w-[60px] text-center">
										{quantity}
									</div>
									<button
										onClick={() => {
											const maxQuantity = selectedSize
												? getSizeQuantity(selectedSize)
												: 10;
											if (quantity < maxQuantity) {
												setQuantity(quantity + 1);
											}
										}}
										disabled={
											selectedSize
												? quantity >= getSizeQuantity(selectedSize)
												: false
										}
										className="px-4 py-2 text-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
									>
										+
									</button>
								</div>
							</div>
						</div>

						{/* BOGO Promotion Indicator */}
						<BogoProductIndicator productId={productId} />
						{/* Purchase Actions Section */}
						<div className="space-y-4">
							{/* Type-specific purchase information */}
							{product.type === "bespoke" && (
								<div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
									<p className="text-sm text-purple-700">
										<strong>Bespoke Item:</strong> This product requires custom
										measurements and has a production timeline of{" "}
										{product.bespokeOptions?.productionTime || "several weeks"}.
									</p>
									{!hasRequiredMeasurements && (
										<p className="text-sm text-red-600 mt-1">
											Please submit your measurements before adding to cart.
										</p>
									)}
								</div>
							)}

							{product.type === "ready-to-wear" && (
								<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
									<p className="text-sm text-blue-700">
										<strong>Ready-to-Wear:</strong> This item is available for
										immediate shipping and comes in standard sizes.
									</p>
								</div>
							)}

							<button
								onClick={async () => {
									try {
										setAddingToCart(true);
										// Add a small delay to ensure UI updates
										await new Promise((resolve) => setTimeout(resolve, 100));

										if (
											product.enableMultiplePricing &&
											selectedMultipleItems.length > 0
										) {
											// Add selected individual items
											for (const itemId of selectedMultipleItems) {
												const item = product.individualItems!.find(
													(i) => i.id === itemId,
												);
												if (item) {
													await handleAddIndividualItem(product, item);
												}
											}
											toast.success("Added to bag!", {
												description: `${selectedMultipleItems.length} item(s) added to your cart`,
												duration: 3000,
											});
										} else {
											// Add complete set / regular product
											// Use the addItem method from useCart
											await addItem(product, quantity, selectedOptions);
											// Show success toast
											toast.success("Added to bag!", {
												description: `${product.title} has been added to your cart`,
												duration: 3000,
											});
										}
									} catch (error) {
										console.error("Error adding to cart:", error);
										toast.error("Failed to add to cart", {
											description: "Please try again",
										});
									} finally {
										// Keep loading state for a moment so user sees feedback
										await new Promise((resolve) => setTimeout(resolve, 500));
										setAddingToCart(false);
									}
								}}
								disabled={isAddToCartDisabled() || addingToCart}
								className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
									isAddToCartDisabled() || addingToCart
										? "bg-gray-200 text-gray-500 cursor-not-allowed"
										: "bg-black text-white hover:bg-gray-800 hover:shadow-lg"
								}`}
							>
								{addingToCart ? (
									<>
										<Loader2 className="h-5 w-5 animate-spin" />
										ADDING...
									</>
								) : isAddToCartDisabled() && getDisabledReason() ? (
									getDisabledReason()
								) : (
									"ADD TO BAG"
								)}
							</button>

							{/* Wishlist and Share Actions */}
							<div className="flex items-center gap-4 mt-4">
								<span
									onClick={handleWishlistToggle}
									className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
								>
									<Heart
										size={16}
										className={isInWishlist ? "fill-current text-red-500" : ""}
									/>
									{isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
								</span>
								<SocialShareButton
									url={
										typeof window !== "undefined"
											? window.location.href
											: `https://www.stitchesafrica.com/shops/products/${productId}`
									}
									title={product.title}
									description={product.description}
									image={
										product.images && product.images.length > 0
											? product.images[0]
											: undefined
									}
								/>
							</div>

							{/* Shipping and Store Info */}
							<div className="mt-6 space-y-3 text-sm text-gray-600">
								{/* Stock Status */}
								{product.type === "ready-to-wear" && (
									<div className="flex items-center gap-2">
										{getStockStatus() === "in_stock" ? (
											<>
												<div className="w-2 h-2 bg-green-500 rounded-full"></div>
												<span>{t.productPage.inStock}</span>
											</>
										) : getStockStatus() === "out_of_stock" ? (
											<>
												<div className="w-2 h-2 bg-red-500 rounded-full"></div>
												<span>{t.productPage.outOfStock}</span>
											</>
										) : getStockStatus() === "low_stock" ? (
											<>
												<div className="w-2 h-2 bg-orange-500 rounded-full"></div>
												<span>{t.productPage.lowStock}</span>
											</>
										) : null}
									</div>
								)}

								{/* Shipping Info */}
								<div className="flex items-center gap-2">
									<span>🚚</span>
									<span>{t.productPage.calculateShipping}</span>
								</div>
							</div>

							{/* Additional Info Icons */}
							<div className="mt-6 flex items-center gap-6 text-xs text-gray-500">
								<div className="flex items-center gap-1">
									<span>📦</span>
									<span>{t.productPage.internationalShipping}</span>
								</div>
								{/* <div className="flex items-center gap-1">
									<span>📅</span>
									<span>Delivery within 3-14 days</span>
								</div> */}
							</div>
						</div>
						{/* Description */}
						<div>
							<h3 className="font-semibold text-gray-900 mb-1">
								{t.productPage.description}
							</h3>
							<p className="text-gray-600">{translatedDescription}</p>
						</div>

						{/* Product Details */}
						<div className="space-y-3">
							{product.category && (
								<div className="flex items-center gap-2 text-sm">
									<span className="font-medium text-gray-700">
										{t.productPage.category}:
									</span>
									<span className="text-gray-600 capitalize">
										{t.categories[
											product.category.toLowerCase() as keyof typeof t.categories
										] || product.category}
									</span>
								</div>
							)}

							{product.wear_category && (
								<div className="flex items-center gap-2 text-sm">
									<span className="font-medium text-gray-700">
										{t.productPage.wearCategory}:
									</span>
									<span className="text-gray-600 capitalize">
										{product.wear_category}
									</span>
								</div>
							)}

							{product.deliveryTimeline && (
								<div className="flex items-center gap-2 text-sm">
									<span className="font-medium text-gray-700">
										{t.productPage.deliveryTimeline}:
									</span>
									<span className="text-gray-600">
										{product.deliveryTimeline}
									</span>
								</div>
							)}

							<div className="flex items-center gap-2 text-sm">
								<span className="font-medium text-gray-700">
									Return Policy:
								</span>
								<span
									onClick={() => setShowReturnPolicyDialog(true)}
									className="text-blue-600 hover:text-blue-800 underline font-medium"
								>
									View{" "}
									{product.type === "bespoke" ? "Bespoke" : "Ready-to-Wear"}{" "}
									Return Policy
								</span>
							</div>
						</div>

						{/* {product.type === "ready-to-wear" &&
							(product.rtwOptions || getAvailableSizes().length > 0) && (
								<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
									<h3 className="font-semibold text-blue-900 mb-2">
										Ready-to-Wear Details
									</h3>
									<div className="space-y-2 text-sm">
										{product.rtwOptions?.fabric && (
											<div>
												<span className="font-medium text-blue-700">
													Fabric:
												</span>
												<span className="ml-2 text-blue-600">
													{product.rtwOptions.fabric}
												</span>
											</div>
										)}
										{product.rtwOptions?.season && (
											<div>
												<span className="font-medium text-blue-700">
													Season:
												</span>
												<span className="ml-2 text-blue-600 capitalize">
													{product.rtwOptions.season}
												</span>
											</div>
										)}

										{getAvailableSizes().length > 0 && (
											<div>
												<span className="font-medium text-blue-700">
													Size & Stock Summary:
												</span>
												<div className="ml-2 mt-1 flex flex-wrap gap-2">
													{getAvailableSizes()
														.map((sizeLabel: string, index: number) => {
															// Skip if no valid label
															if (!sizeLabel || typeof sizeLabel !== "string") {
																return null;
															}

															const quantity = getSizeStock(sizeLabel);

															return (
																<span
																	key={`rtw-${sizeLabel}-${index}`}
																	className={`px-2 py-1 rounded text-xs ${
																		quantity > 0
																			? "bg-green-100 text-green-700"
																			: "bg-red-100 text-red-700"
																	}`}
																>
																	{sizeLabel}: {quantity}{" "}
																	{quantity === 1 ? "item" : "items"}
																</span>
															);
														})
														.filter(Boolean)}
												</div>
											</div>
										)}
										{getStockStatus() && (
											<div>
												<span className="font-medium text-blue-700">
													Stock Status:
												</span>
												<span className="ml-2 text-green-600 capitalize">
													{getStockStatus().replace("_", " ")}
												</span>
											</div>
										)}
									</div>
								</div>
							)}
						{product.type === "bespoke" && product.bespokeOptions && (
							<div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
								<h3 className="font-semibold text-purple-900 mb-2">
									Bespoke Details
								</h3>
								<div className="space-y-2 text-sm">
									{product.bespokeOptions.productionTime && (
										<div>
											<span className="font-medium text-purple-700">
												Production Time:
											</span>
											<span className="ml-2 text-purple-600">
												{product.bespokeOptions.productionTime}
											</span>
										</div>
									)}
									{product.bespokeOptions.measurementsRequired &&
										product.bespokeOptions.measurementsRequired.length > 0 && (
											<div>
												<span className="font-medium text-purple-700">
													Required Measurements:
												</span>
												<span className="ml-2 text-purple-600">
													{product.bespokeOptions.measurementsRequired.join(
														", ",
													)}
												</span>
											</div>
										)}
									{product.bespokeOptions.customization?.fabricChoices &&
										product.bespokeOptions.customization.fabricChoices.length >
											0 && (
											<div>
												<span className="font-medium text-purple-700">
													Fabric Options:
												</span>
												<span className="ml-2 text-purple-600">
													{product.bespokeOptions.customization.fabricChoices.join(
														", ",
													)}
												</span>
											</div>
										)}
									{product.bespokeOptions.customization?.styleOptions &&
										product.bespokeOptions.customization.styleOptions.length >
											0 && (
											<div>
												<span className="font-medium text-purple-700">
													Style Options:
												</span>
												<span className="ml-2 text-purple-600">
													{product.bespokeOptions.customization.styleOptions.join(
														", ",
													)}
												</span>
											</div>
										)}
								</div>
							</div>
						)} */}

						{/* Type-specific Purchase Section */}

						{/* Enhanced Product Parameters */}
						{/* <ProductParameters product={product} /> */}

						{/* Type-Specific Content */}
						<TypeSpecificContent product={product} />

						{/* Schedule Consultation Button - Only for bespoke items */}
						{product?.type === "bespoke" && (
							<button
								onClick={() => setIsConsultationOpen(true)}
								className="w-full px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 border-2 border-black text-black hover:bg-gray-50 mt-3"
							>
								<MessageCircle className="h-5 w-5" />
								Schedule Consultation
							</button>
						)}

						{/* Shipping Information */}
						{/* {product.shipping && (
							<ProductSection
								product={product}
								title="Shipping Information"
								priority="low"
							>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
									<div>
										<span className="font-medium text-gray-700">Weight:</span>
										<span className="ml-2 text-gray-600">
											{product.shipping.actualWeightKg} kg
										</span>
									</div>
									<div>
										<span className="font-medium text-gray-700">
											Dimensions:
										</span>
										<span className="ml-2 text-gray-600">
											{product.shipping.lengthCm} × {product.shipping.widthCm} ×{" "}
											{product.shipping.heightCm} cm
										</span>
									</div>
									<div>
										<span className="font-medium text-gray-700">
											Shipping Tier:
										</span>
										<span className="ml-2 text-gray-600">
											{product.shipping.tierKey}
										</span>
									</div>
								</div>
							</ProductSection>
						)} */}

						{/* {product.vendor && (
							<ProductSection
								product={product}
								title="Vendor Information"
								priority="medium"
							>
								<div className="space-y-2 text-sm">
									<div className="flex items-center gap-3">
										{product.vendor.logo && (
											<div className="relative w-8 h-8 flex-shrink-0">
												<SafeImage
													src={product.vendor.logo}
													alt={product.vendor.name}
													fill
													className="rounded-full object-cover"
													sizes={RESPONSIVE_SIZES.vendorLogo}
													placeholder="blur"
													blurDataURL={generateBlurDataURL(
														IMAGE_DIMENSIONS.vendorLogo.width,
														IMAGE_DIMENSIONS.vendorLogo.height,
													)}
													fallbackSrc="/placeholder-product.svg"
												/>
											</div>
										)}
										<div>
											<div className="font-medium text-gray-700">
												{product.vendor.name}
											</div>
											{product.vendor.location && (
												<div className="text-gray-600">
													{product.vendor.location}
												</div>
											)}
										</div>
									</div>
								</div>
							</ProductSection>
						)}
						{(product.tags?.length > 0 ||
							(product.keywords && product.keywords.length > 0)) && (
							<ProductSection
								product={product}
								title="Tags & Keywords"
								priority="low"
							>
								{product.tags?.length > 0 && (
									<div className="mb-3">
										<span className="font-medium text-gray-700 block mb-2">
											Tags:
										</span>
										<div className="flex flex-wrap gap-2">
											{product.tags.map((tag, index) => (
												<span
													key={index}
													className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs"
												>
													{tag}
												</span>
											))}
										</div>
									</div>
								)}
								{product.keywords && product.keywords.length > 0 && (
									<div>
										<span className="font-medium text-gray-700 block mb-2">
											Keywords:
										</span>
										<div className="flex flex-wrap gap-2">
											{product.keywords.map((keyword, index) => (
												<span
													key={index}
													className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
												>
													{keyword}
												</span>
											))}
										</div>
									</div>
								)}
							</ProductSection>
						)} */}

						{/* Product Metadata */}
						{/* {(product.metaTitle ||
							product.metaDescription ||
							(product.metaKeywords && product.metaKeywords.length > 0) ||
							product.createdAt ||
							product.updatedAt) && (
							<ProductSection
								product={product}
								title="Product Metadata"
								priority="low"
							>
								<div className="space-y-2 text-sm">
									{product.metaTitle && (
										<div>
											<span className="font-medium text-gray-700">
												Meta Title:
											</span>
											<span className="ml-2 text-gray-600">
												{product.metaTitle}
											</span>
										</div>
									)}
									{product.metaDescription && (
										<div>
											<span className="font-medium text-gray-700">
												Meta Description:
											</span>
											<span className="ml-2 text-gray-600">
												{product.metaDescription}
											</span>
										</div>
									)}
									{product.metaKeywords && product.metaKeywords.length > 0 && (
										<div>
											<span className="font-medium text-gray-700 block mb-1">
												Meta Keywords:
											</span>
											<div className="flex flex-wrap gap-1">
												{product.metaKeywords.map((keyword, index) => (
													<span
														key={index}
														className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs"
													>
														{keyword}
													</span>
												))}
											</div>
										</div>
									)}
									{product.slug && (
										<div>
											<span className="font-medium text-gray-700">
												URL Slug:
											</span>
											<span className="ml-2 text-gray-600">{product.slug}</span>
										</div>
									)}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
										{product.createdAt && (
											<div>
												<span className="font-medium text-gray-700">
													Created:
												</span>
												<span className="ml-2 text-gray-600">
													{new Date(product.createdAt).toLocaleDateString()}
												</span>
											</div>
										)}
										{product.updatedAt && (
											<div>
												<span className="font-medium text-gray-700">
													Last Updated:
												</span>
												<span className="ml-2 text-gray-600">
													{new Date(product.updatedAt).toLocaleDateString()}
												</span>
											</div>
										)}
									</div>
								</div>
							</ProductSection>
						)} */}

						{/* Features */}
						{/* <div className="border-t pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Truck size={16} /> Free shipping over $100
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw size={16} /> 30-day returns
            </div>
            <div className="flex items-center gap-2">
              <Shield size={16} /> Secure checkout
            </div>
          </div> */}
					</ProductLayout>
				</div>

				{/* Related Products - Updated to horizontal scroll */}
				{(relatedProducts.length > 0 || loadingRelated) && (
					<div className="mt-12 border-t pt-8">
						<h2 className="text-2xl font-bold text-center mb-6">
							You May Also Like
						</h2>
						{loadingRelated && relatedProducts.length === 0 ? (
							<div className="flex gap-4 overflow-hidden">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="flex-shrink-0 w-64 animate-pulse">
										<div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
										<div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
										<div className="h-4 bg-gray-200 rounded w-1/2"></div>
									</div>
								))}
							</div>
						) : (
							<div className="relative">
								<div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
									{relatedProducts.map((rp) => (
										<div key={rp.product_id} className="flex-shrink-0 w-64">
											<ProductCard product={rp} />
										</div>
									))}
								</div>
								{/* Custom scrollbar styling */}
								<style jsx>{`
									.scrollbar-hide::-webkit-scrollbar {
										display: none;
									}
									.scrollbar-hide {
										-ms-overflow-style: none;
										scrollbar-width: none;
									}
								`}</style>
							</div>
						)}
					</div>
				)}

				{/* Return Policy Dialog */}
				<Dialog
					open={showReturnPolicyDialog}
					onOpenChange={setShowReturnPolicyDialog}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle className="sr-only">Return Policy</DialogTitle>
						</DialogHeader>
						{getReturnPolicyContent()}
						<DialogFooter className="flex justify-end space-x-2 mt-4">
							<Button
								variant="outline"
								onClick={() => setShowReturnPolicyDialog(false)}
							>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Size Guide Modal */}
				<Dialog open={showSizeGuide} onOpenChange={setShowSizeGuide}>
					<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="text-xl font-bold text-center mb-4">
								Size Guide
							</DialogTitle>
						</DialogHeader>

						{fetchingSizeGuide ? (
							<div className="flex justify-center p-8">
								<Loader2 className="animate-spin h-8 w-8 text-gray-500" />
							</div>
						) : (
							<div className="space-y-6">
								{vendorSizeGuideImages.length > 0 && (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										{vendorSizeGuideImages.map((img, idx) => (
											<div
												key={idx}
												className="relative aspect-[3/4] w-full border rounded-lg overflow-hidden bg-gray-50"
											>
												<img
													src={img}
													alt={`Size Guide ${idx + 1}`}
													className="w-full h-full object-contain"
													loading="lazy"
													onError={(e) => {
														const target = e.target as HTMLImageElement;
														target.src = "/placeholder-image.jpg";
													}}
												/>
											</div>
										))}
									</div>
								)}

								{vendorSizeGuide && vendorSizeGuide.rows.length > 0 && (
									<div className="overflow-x-auto">
										<table className="w-full text-sm text-left border-collapse">
											<thead className="text-xs text-gray-700 uppercase bg-gray-50">
												<tr>
													<th className="px-6 py-3 border-b">Size</th>
													{vendorSizeGuide.columns.map((col) => (
														<th key={col.id} className="px-6 py-3 border-b">
															{col.label}
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{vendorSizeGuide.rows.map((row, index) => (
													<tr
														key={index}
														className="bg-white border-b hover:bg-gray-50"
													>
														<td className="px-6 py-4 font-medium text-gray-900">
															{row.sizeLabel}
														</td>
														{vendorSizeGuide.columns.map((col) => (
															<td key={col.id} className="px-6 py-4">
																{row.values[col.id] || "-"}
															</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}

								{(!vendorSizeGuide || vendorSizeGuide.rows.length === 0) &&
									vendorSizeGuideImages.length === 0 && (
										<div className="text-center py-8 text-gray-500">
											<p>No specific size guide available for this product.</p>
											<p className="mt-2 text-sm">
												Please refer to the description or contact us for
												assistance.
											</p>
										</div>
									)}
							</div>
						)}

						<DialogFooter className="flex justify-end mt-6">
							<Button variant="outline" onClick={() => setShowSizeGuide(false)}>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Consultation Chat Widget - Only for bespoke items */}
			{product?.type === "bespoke" && (
				<ConsultationChatWidget
					isOpen={isConsultationOpen}
					onClose={() => setIsConsultationOpen(false)}
					productId={productId}
					productName={product.title}
				/>
			)}
		</>
	);
}
