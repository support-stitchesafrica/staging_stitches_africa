"use client";

import Link from "next/link";
import { Product } from "@/types";
import { formatPrice, calculateDiscountedPrice } from "@/lib/utils";
import { Price, DiscountedPrice } from "@/components/common/Price";
import { WishlistButton } from "@/components/shops/wishlist/WishlistButton";
import { withReactRuntimeWrapper } from "@/components/shops/wrappers/ReactRuntimeWrapper";
import { getImageWithFallback } from "@/lib/utils/image-validator";
import { SafeImage } from "@/components/shops/ui/SafeImage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ShoppingBag, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTranslatedText } from "@/lib/i18n/useTranslatedText";

interface ProductCardProps {
	product: Product;
	onWishlistToggle?: (productId: string) => void;
	isInWishlist?: boolean;
	priority?: boolean;
	index?: number;
}

import { calculateCustomerPrice, calculateFinalPrice } from "@/lib/priceUtils";

function ProductCardComponent({
	product,
	onWishlistToggle,
	isInWishlist = false,
	priority = false,
	index = 0,
}: ProductCardProps) {
	// Price utils imported at top level
	const { userCountry } = useCurrency();
	const { addItem } = useCart();
	const { t } = useLanguage();
	const translatedTitle = useTranslatedText(product.title);
	const [isAdding, setIsAdding] = useState(false);
	const [justAdded, setJustAdded] = useState(false);

	// Determine base price - use minimum individual item price if multiple pricing is enabled
	let basePrice: number;
	if (product.enableMultiplePricing && product.individualItems && product.individualItems.length > 0) {
		// Get the minimum price from individual items
		basePrice = Math.min(...product.individualItems.map(item => item.price));
	} else {
		basePrice = typeof product.price === "number" ? product.price : product.price.base;
	}
	
	const currency = typeof product.price === "object" ? product.price.currency : "USD";

	// Calculate customer facing prices (incorporating Platform Commission & Duty)
	// 1. Regular Price
	const customerPrice = calculateCustomerPrice(basePrice, userCountry);

	// 2. Discounted Price (if applicable)
	const discountedPrice =
		product.discount > 0
			? calculateFinalPrice(basePrice, product.discount, userCountry)
			: customerPrice;

	const handleWishlistClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onWishlistToggle?.(product.product_id);
	};

	const handleAddToCart = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();

			if (isAdding || justAdded) return;

			setIsAdding(true);
			try {
				// Call addItem - it's not async but dispatches to reducer
				addItem(product, 1);

				// Dispatch custom event to notify cart to refresh
				window.dispatchEvent(new CustomEvent("cart-updated"));

				// Show success state
				setJustAdded(true);
				toast.success("Added to cart", {
					description: `${product.title} has been added to your cart.`,
				});

				// Reset the "just added" state after 2 seconds
				setTimeout(() => {
					setJustAdded(false);
				}, 2000);
			} catch (error) {
				console.error("Error adding to cart:", error);
				toast.error("Failed to add to cart", {
					description: "Please try again.",
				});
				setJustAdded(false);
			} finally {
				setIsAdding(false);
			}
		},
		[addItem, product, isAdding, justAdded],
	);

	const imageUrl = getImageWithFallback(product.images);

	return (
		<Link href={`/shops/products/${product.product_id}`}>
			<div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100">
				{/* Product Image */}
				<div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-gray-100">
					<SafeImage
						src={imageUrl}
						alt={product.title}
						fill
						sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
						className="object-cover group-hover:scale-105 transition-transform duration-300"
						priority={priority}
						fallbackSrc="/placeholder-product.svg"
					/>

					{/* Discount Badge */}
					{product.discount > 0 && (
						<div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
							-{product.discount}%
						</div>
					)}

					{/* Action Icons - Top Right */}
					<div className="absolute top-2 right-2 flex flex-col gap-2">
						{/* Wishlist Button */}
						<WishlistButton
							productId={product.product_id}
							size={16}
							className="bg-white/90 hover:bg-white"
						/>

						{/* Add to Cart Icon with Tooltip */}
						<div className="relative group/cart">
							<button
								onClick={handleAddToCart}
								disabled={isAdding || justAdded}
								className={`p-2.5 rounded-full bg-white! text-black! border-0! shadow-lg transition-all duration-300 hover:scale-110 ${
									justAdded
										? "bg-green-500 text-white"
										: "bg-white/90 hover:bg-white text-gray-700"
								} disabled:opacity-70`}
								aria-label="Add to cart"
							>
								{justAdded ? (
									<Check className="w-4 h-4" />
								) : isAdding ? (
									<div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
								) : (
									<ShoppingBag className="w-4 h-4" />
								)}
							</button>

							{/* Tooltip */}
							{!isAdding && !justAdded && (
								<div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/cart:opacity-100 transition-opacity pointer-events-none z-10">
									Add to Cart
									<div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-gray-900"></div>
								</div>
							)}
							{justAdded && (
								<div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-green-500 text-white text-xs rounded whitespace-nowrap opacity-100 transition-opacity pointer-events-none z-10">
									{t.collectionGrid.addedToCart}
									<div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-green-500"></div>
								</div>
							)}
						</div>
					</div>

					{/* Product Type Badge */}
					<div className="absolute bottom-2 left-2">
						<span
							className={`px-2 py-1 text-xs font-medium rounded ${
								product.type === "bespoke"
									? "bg-purple-100 text-purple-800"
									: "bg-blue-100 text-blue-800"
							}`}
						>
							{product.type === "bespoke"
								? t.header.bespoke
								: t.header.readyToWear}
						</span>
					</div>
				</div>

				{/* Product Info */}
				<div className="p-2 sm:p-3">
					<div className="mb-2">
						<h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors leading-tight">
							{translatedTitle}
						</h3>
						<p className="text-xs text-gray-600 mt-1 font-medium">
							{product.vendor?.name || product.tailor || "Unknown Brand"}
						</p>
					</div>

					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<div className="flex flex-col space-y-1">
								{/* Show "From" prefix if multiple pricing is enabled */}
								{product.enableMultiplePricing && product.individualItems && product.individualItems.length > 0 && (
									<span className="text-xs text-gray-500 font-normal">From</span>
								)}
								{product.discount > 0 ? (
									<DiscountedPrice
										originalPrice={customerPrice}
										salePrice={discountedPrice}
										originalCurrency={currency}
										size="sm"
										className="flex flex-col items-start gap-0"
									/>
								) : (
									<Price
										price={customerPrice}
										originalCurrency={currency}
										size="sm"
										variant="accent"
									/>
								)}
							</div>

							{/* Availability Status */}
							<div className="flex items-center">
								<div
									className={`w-1.5 h-1.5 rounded-full mr-1 ${
										product.availability === "in_stock"
											? "bg-green-500"
											: product.availability === "pre_order"
												? "bg-yellow-500"
												: "bg-red-500"
									}`}
								/>
								<span className="text-xs text-gray-600 capitalize">
									{product.availability === "in_stock"
										? t.productPage.inStock
										: product.availability === "pre_order"
											? "Pre-Order"
											: t.productPage.outOfStock}
								</span>
							</div>
						</div>

						{/* Category */}
						<div className="mt-1">
							<span className="text-xs text-gray-500 capitalize">
								{t.categories[
									product.category.toLowerCase() as keyof typeof t.categories
								] || product.category}
							</span>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}

// Export ProductCard wrapped with React runtime protection
export const ProductCard = withReactRuntimeWrapper(ProductCardComponent, {
	enableHMRBoundary: true,
	fallback: (
		<div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 p-4">
			<div className="aspect-[4/5] bg-gray-200 rounded mb-2"></div>
			<div className="space-y-2">
				<div className="h-4 bg-gray-200 rounded"></div>
				<div className="h-3 bg-gray-200 rounded w-2/3"></div>
			</div>
		</div>
	),
});
