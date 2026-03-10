import React, { useMemo, useCallback, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	X,
	Minus,
	Plus,
	ShoppingBag,
	Trash2,
	ChevronDown,
	ChevronUp,
	Check,
	Heart,
} from "lucide-react";

interface FarfetchProductCardProps {
	product: Product;
	onWishlistToggle?: (id: string) => void;
	isInWishlist?: boolean;
}

import { calculateCustomerPrice, calculateFinalPrice } from "@/lib/priceUtils";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTranslatedText } from "@/lib/i18n/useTranslatedText";
import { Product } from "@/types";
import Price, { DiscountedPrice } from "../common/Price";

// Farfetch-style Product Card Component - Memoized for performance
export const FarfetchProductCard = React.memo(
	({ product, onWishlistToggle, isInWishlist }: FarfetchProductCardProps) => {
		const router = useRouter();
		const { userCountry } = useCurrency();
		const { addItem } = useCart();
		const { t } = useLanguage();
		const translatedTitle = useTranslatedText(product.title);
		const [isAdding, setIsAdding] = useState(false);
		const [justAdded, setJustAdded] = useState(false);

		const { basePrice, discountedPrice, currency } = useMemo(() => {
			const base =
				typeof product.price === "number" ? product.price : product.price.base;
			const curr =
				typeof product.price === "object" ? product.price.currency : "USD";

			// Calculate prices using utility functions to ensure commission (20%) + duty (where applicable) are applied
			// This fixes the issue where NGN orders were missing the platform commission
			const priceWithDuty = calculateCustomerPrice(base, userCountry);
			const finalPrice =
				product.discount > 0
					? calculateFinalPrice(base, product.discount, userCountry)
					: priceWithDuty;

			return {
				basePrice: priceWithDuty,
				discountedPrice: finalPrice,
				currency: curr,
			};
		}, [product.price, product.discount, userCountry]);

		const handleClick = useCallback(() => {
			router.push(`/shops/products/${product.product_id}`);
		}, [router, product.product_id]);

		const handleWishlistClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				onWishlistToggle?.(product.product_id);
			},
			[onWishlistToggle, product.product_id],
		);

		const handleAddToCart = useCallback(
			async (e: React.MouseEvent) => {
				e.stopPropagation();
				e.preventDefault();

				if (isAdding || justAdded) return;

				setIsAdding(true);
				try {
					// addItem is async, so we should await it
					await addItem(product, 1, {});

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

		return (
			<div className="group cursor-pointer" onClick={handleClick}>
				{/* Image Container with Luxury Hover Effects */}
				<div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-lg bg-gray-100">
					<Image
						src={product.images?.[0] || "/placeholder-product.svg"}
						alt={product.title}
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-500"
						sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
						loading="lazy"
					/>

					{/* Action Icons - Top Right */}
					<div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
						{/* Wishlist Button */}
						<button
							onClick={handleWishlistClick}
							className="p-2.5 bg-white/90 bg-white! border-0! backdrop-blur-sm rounded-full shadow-lg transition-all duration-300 hover:scale-110"
							aria-label="Add to wishlist"
						>
							<Heart
								className={`w-4 h-4 ${isInWishlist ? "fill-red-500 text-red-500" : "text-gray-700"}`}
							/>
						</button>

						{/* Add to Cart Icon with Tooltip */}
						<div className="relative group/cart">
							<button
								onClick={handleAddToCart}
								disabled={isAdding || justAdded}
								className={`p-2.5 rounded-full border-0! bg-white! text-black! shadow-lg transition-all duration-300 hover:scale-110 ${
									justAdded
										? "bg-green-500 text-white"
										: "bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700"
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

					{/* Discount Badge */}
					{product.discount > 0 && (
						<div className="absolute top-3 left-3 bg-black text-white px-3 py-1.5 text-xs font-medium rounded-full z-10">
							-{product.discount}%
						</div>
					)}
				</div>

				{/* Product Information - Luxury Typography */}
				<div className="space-y-2">
					<p className="text-xs text-gray-500 uppercase tracking-widest font-light">
						New Season
					</p>
					<h3 className="font-medium text-sm text-gray-900 line-clamp-1">
						{product.tailor || "Designer"}
					</h3>
					<p className="text-sm text-gray-600 line-clamp-2 font-light leading-relaxed">
						{translatedTitle}
					</p>
					<div className="flex items-center space-x-2 pt-1">
						{product.discount > 0 ? (
							<DiscountedPrice
								originalPrice={basePrice}
								salePrice={discountedPrice}
								originalCurrency={currency}
								size="sm"
								className="flex items-baseline gap-2"
							/>
						) : (
							<Price
								price={basePrice}
								originalCurrency={currency}
								size="sm"
								variant="default"
								className="font-semibold text-gray-900"
							/>
						)}
					</div>
				</div>
			</div>
		);
	},
);

FarfetchProductCard.displayName = "FarfetchProductCard";
