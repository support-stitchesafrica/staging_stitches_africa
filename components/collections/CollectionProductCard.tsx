"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, CheckSquare, Square } from "lucide-react";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { useCollectionsTracking } from "@/hooks/useCollectionsTracking";
import { Price, DiscountedPrice } from "@/components/common/Price";
import { CollectionProductPrice } from "@/components/collections/CollectionProductPrice";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTranslatedText } from "@/lib/i18n/useTranslatedText";

interface CollectionProductCardProps {
	product: Product;
	collectionId: string;
	collectionName: string;
	isSelected: boolean;
	onToggleSelect: () => void;
	onAddToCart: () => void;
	isAdding: boolean;
	onAddIndividualItem?: (product: Product, item: any) => void; // Callback to add individual item to cart
	className?: string;
}

import { useCurrency } from "@/contexts/CurrencyContext";
import { calculateCustomerPrice, calculateFinalPrice } from "@/lib/priceUtils";

export function CollectionProductCard({
	product,
	collectionId,
	collectionName,
	isSelected,
	onToggleSelect,
	onAddToCart,
	isAdding,
	onAddIndividualItem,
	className,
}: CollectionProductCardProps) {
	const [hasTrackedView, setHasTrackedView] = useState(false);
	const { trackProductView, trackAddToCart } = useCollectionsTracking();
	const { userCountry } = useCurrency();
	const { t } = useLanguage();
	const translatedTitle = useTranslatedText(product.title);

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(price);
	};

	const basePrice =
		typeof product.price === "number" ? product.price : product.price.base;
	const currency =
		typeof product.price === "object" ? product.price.currency : "NGN";
	const hasDiscount = product.discount > 0;

	// Check if product has multiple pricing enabled
	const hasMultiplePricing =
		product.enableMultiplePricing &&
		product.individualItems &&
		product.individualItems.length > 0;

	// Apply platform commission and duty using utility functions
	const customerBasePrice = calculateCustomerPrice(basePrice, userCountry);
	const discountedPrice = hasDiscount
		? calculateFinalPrice(basePrice, product.discount, userCountry)
		: customerBasePrice;

	// Track product view when user interacts with the card
	const handleProductView = async () => {
		if (!hasTrackedView) {
			setHasTrackedView(true);
			await trackProductView(
				collectionId,
				collectionName,
				product.product_id,
				product.title,
				{
					price: discountedPrice,
					originalPrice: basePrice,
					hasDiscount,
					discount: product.discount,
					category: product.category,
					vendor: product.vendor?.name || product.tailor,
					availability: product.availability,
				},
			);
		}
	};

	// Track add to cart event
	const handleAddToCartClick = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// Track the add to cart event
		await trackAddToCart(
			collectionId,
			collectionName,
			product.product_id,
			product.title,
			discountedPrice,
			1,
			{
				originalPrice: basePrice,
				hasDiscount,
				discount: product.discount,
				category: product.category,
				vendor: product.vendor?.name || product.tailor,
				availability: product.availability,
			},
		);

		// Call the original onAddToCart function
		onAddToCart();
	};

	// Handle adding individual item to cart
	const handleAddIndividualItemClick = async (item: any) => {
		// Track the add to cart event for individual item
		await trackAddToCart(
			collectionId,
			collectionName,
			product.product_id,
			`${product.title} - ${item.name}`,
			item.price,
			1,
			{
				originalPrice: item.price,
				hasDiscount: false,
				discount: 0,
				category: product.category,
				vendor: product.vendor?.name || product.tailor,
				availability: product.availability,
				itemName: item.name,
				isIndividualItem: true,
			},
		);

		// Call the callback to add individual item to cart
		if (onAddIndividualItem) {
			onAddIndividualItem(product, item);
		}
	};

	// Handle adding all items to cart
	const handleAddAllItemsClick = async () => {
		// Track the add to cart event for all items
		await trackAddToCart(
			collectionId,
			collectionName,
			product.product_id,
			product.title,
			discountedPrice,
			1,
			{
				originalPrice: basePrice,
				hasDiscount,
				discount: product.discount,
				category: product.category,
				vendor: product.vendor?.name || product.tailor,
				availability: product.availability,
				isAllItems: true,
			},
		);

		// Call the original onAddToCart function
		onAddToCart();
	};

	return (
		<div
			className={cn(
				"group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-2 flex flex-col h-full",
				isSelected ? "border-black" : "border-gray-200 hover:border-gray-300",
				className,
			)}
		>
			{/* Image Container */}
			<div
				className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer"
				onClick={handleProductView}
			>
				{product.images && product.images.length > 0 ? (
					<Image
						src={product.images[0]}
						alt={product.title}
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-300"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-gray-400">
						No Image
					</div>
				)}

				{/* Selection Checkbox - Top Left */}
				<button
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onToggleSelect();
					}}
					className="absolute top-3 left-3 z-10 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-all"
					aria-label={isSelected ? "Deselect product" : "Select product"}
				>
					{isSelected ? (
						<CheckSquare className="w-5 h-5 text-black" />
					) : (
						<Square className="w-5 h-5 text-gray-400" />
					)}
				</button>

				{/* Discount Badge - Top Right */}
				{hasDiscount && (
					<div className="absolute top-3 right-3 z-10 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
						{Math.round(product.discount)}% OFF
					</div>
				)}

				{/* Multiple Pricing Badge - Bottom Right */}
				{hasMultiplePricing && (
					<div className="absolute bottom-3 right-3 z-10 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
						Multiple Options
					</div>
				)}
			</div>

			{/* Content */}
			<div className="p-3 sm:p-4 space-y-3 flex-1 flex flex-col">
				{/* Title */}
				<Link
					href={`/shops/products/${encodeURIComponent(product.product_id)}`}
					className="block"
					onClick={handleProductView}
				>
					<h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-black transition-colors text-sm sm:text-base">
						{translatedTitle}
					</h3>
				</Link>

				{/* Vendor */}
				{(product.vendor?.name || product.tailor) && (
					<p className="text-xs sm:text-sm text-gray-700 font-medium">
						by {product.vendor?.name || product.tailor}
					</p>
				)}

				{/* Prices */}
				<div className="space-y-1 flex-1">
					{hasMultiplePricing ? (
						<CollectionProductPrice
							product={product}
							onAddIndividualItem={handleAddIndividualItemClick}
							onAddAllItems={handleAddAllItemsClick}
						/>
					) : hasDiscount ? (
						<DiscountedPrice
							originalPrice={customerBasePrice}
							salePrice={discountedPrice}
							originalCurrency={currency}
							size="lg"
						/>
					) : (
						<Price
							price={customerBasePrice}
							originalCurrency={currency}
							size="lg"
							variant="accent"
						/>
					)}
				</div>

				{/* Add to Cart Button - Only show for single pricing products */}
				{!hasMultiplePricing && (
					<button
						onClick={handleAddToCartClick}
						disabled={isAdding || product.availability === "out_of_stock"}
						className={cn(
							"w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm",
							product.availability === "out_of_stock" &&
								"opacity-50 cursor-not-allowed",
						)}
					>
						<ShoppingCart className="w-4 h-4" />
						{isAdding ? t.collectionGrid.adding : "Add Collection to Cart"}
					</button>
				)}

				{/* Category & Availability */}
				<div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 mt-auto">
					{product.category && (
						<span className="capitalize">
							{t.categories[
								product.category.toLowerCase() as keyof typeof t.categories
							] || product.category}
						</span>
					)}
					{product.availability && (
						<span
							className={cn(
								"px-2 py-0.5 rounded-full font-medium text-xs",
								product.availability === "in_stock"
									? "bg-green-100 text-green-700"
									: product.availability === "pre_order"
										? "bg-blue-100 text-blue-700"
										: "bg-gray-100 text-gray-700",
							)}
						>
							{product.availability === "in_stock"
								? t.productPage.inStock
								: product.availability === "pre_order"
									? "Pre-Order"
									: t.productPage.outOfStock}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
