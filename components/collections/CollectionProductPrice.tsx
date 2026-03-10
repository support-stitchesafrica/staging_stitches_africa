"use client";

import { useState } from "react";
import {
	Eye,
	ShoppingCart,
	Info,
	Package,
	Palette,
	Ruler,
	Star,
	Heart,
	Share2,
} from "lucide-react";
import Image from "next/image";
import { Product } from "@/types";
import { Price, DiscountedPrice } from "@/components/common/Price";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { calculateCustomerPrice, calculateFinalPrice } from "@/lib/priceUtils";

interface CollectionProductPriceProps {
	product: Product;
	className?: string;
	onAddIndividualItem?: (product: Product, item: any) => void; // Callback to add individual item to cart
}

export function CollectionProductPrice({
	product,
	className = "",
	onAddIndividualItem,
}: CollectionProductPriceProps) {
	const [selectedItems, setSelectedItems] = useState<string[]>([]); // Track selected item IDs
	const [showModal, setShowModal] = useState(false);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const [quantity, setQuantity] = useState(1);
	const [isAddingToCart, setIsAddingToCart] = useState(false);

	// Use cart context
	const { addIndividualItemToCart } = useCart();
	const { userCountry } = useCurrency();

	// Helper to apply platform commission to any price
	const withCommission = (price: number) =>
		calculateCustomerPrice(price, userCountry);

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

	// Calculate total price of all individual items
	const getTotalPrice = () => {
		if (!hasMultiplePricing) {
			return basePrice;
		}
		return product.individualItems!.reduce((sum, item) => sum + item.price, 0);
	};

	// Get the lowest priced individual item
	const getLowestItem = () => {
		if (!hasMultiplePricing || !product.individualItems?.length) return null;
		return product.individualItems.reduce((lowest, item) =>
			item.price < lowest.price ? item : lowest,
		);
	};

	// Calculate selected items total price
	const getSelectedPrice = () => {
		if (selectedItems.length === 0) return 0;
		return product
			.individualItems!.filter((item) => selectedItems.includes(item.id))
			.reduce((sum, item) => sum + item.price, 0);
	};

	const handleItemToggle = (itemId: string) => {
		if (itemId === "both") {
			// Select all items
			setSelectedItems(product.individualItems!.map((item) => item.id));
		} else {
			setSelectedItems([itemId]); // Select only this item (single selection mode)
		}
	};

	const handleAddToCart = () => {
		if (!hasMultiplePricing || selectedItems.length === 0) return;

		setIsAddingToCart(true);

		try {
			// Add selected individual items using cart context
			for (const itemId of selectedItems) {
				const item = product.individualItems!.find((i) => i.id === itemId);
				if (item) {
					// Add the item with the specified quantity
					const itemWithQuantity = {
						...item,
						quantity: quantity,
					};

					// Use cart context to add individual item (not async)
					addIndividualItemToCart(product, itemWithQuantity);

					// Also call the callback if provided (for tracking/analytics)
					if (onAddIndividualItem) {
						onAddIndividualItem(product, itemWithQuantity);
					}
				}
			}

			// Close modal and reset
			setShowModal(false);
			setSelectedItems([]);
			setQuantity(1);
		} catch (error) {
			console.error("Error adding to cart:", error);
		} finally {
			setIsAddingToCart(false);
		}
	};

	if (!hasMultiplePricing) {
		// Single price product - display normally
		return (
			<div className={className}>
				{hasDiscount ? (
					<DiscountedPrice
						originalPrice={withCommission(basePrice)}
						salePrice={calculateFinalPrice(
							basePrice,
							product.discount,
							userCountry,
						)}
						originalCurrency={currency}
						size="lg"
					/>
				) : (
					<Price
						price={withCommission(basePrice)}
						originalCurrency={currency}
						size="lg"
						variant="accent"
					/>
				)}
			</div>
		);
	}

	// Multiple pricing product - show full price with eye icon
	const lowestItem = getLowestItem();

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Full Price Display with Eye Icon */}
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<div className="text-xs text-gray-500 font-medium">
						Full Collection
					</div>

					{hasDiscount ? (
						<DiscountedPrice
							originalPrice={withCommission(getTotalPrice())}
							salePrice={calculateFinalPrice(
								getTotalPrice(),
								product.discount,
								userCountry,
							)}
							originalCurrency={currency}
							size="lg"
						/>
					) : (
						<Price
							price={withCommission(getTotalPrice())}
							originalCurrency={currency}
							size="lg"
							variant="accent"
						/>
					)}
				</div>

				{/* Eye Icon */}
				<button
					onClick={() => setShowModal(true)}
					className="p-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
					title="View details and select items"
				>
					<Eye className="w-3.5 h-3.5 text-white" />
				</button>
			</div>

			{/* Lowest Individual Price */}
			{lowestItem && (
				<button
					// onClick={() => setShowModal(true)}
					className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-300 transition-all duration-200 group/lowest cursor-pointer"
				>
					<div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center group-hover/lowest:bg-emerald-200 transition-colors">
						<svg
							className="w-3 h-3 text-emerald-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
							/>
						</svg>
					</div>
					<div className="flex-1 min-w-0 text-left">
						<div className="flex items-baseline gap-1.5">
							<span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
								From
							</span>
							<span className="text-sm font-bold text-emerald-900">
								<Price
									price={withCommission(lowestItem.price)}
									originalCurrency={currency}
									size="sm"
									variant="default"
								/>
							</span>
						</div>
						<p className="text-[10px] text-emerald-600 truncate">
							{lowestItem.name}
						</p>
					</div>
					{/* <svg
						className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 group-hover/lowest:translate-x-0.5 transition-transform"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg> */}
				</button>
			)}

			{/* Ultra-Wide Centered Modal */}
			<Dialog open={showModal} onOpenChange={setShowModal}>
				<DialogContent
					className="!max-w-none !w-[90vw] !h-[90vh] overflow-hidden p-0 bg-white rounded-xl shadow-2xl"
					showCloseButton={false}
				>
					<div className="flex flex-col lg:flex-row h-full w-full">
						{/* Left Side - Product Images (30% width) */}
						<div className="lg:w-[30%] bg-gradient-to-br from-gray-50 to-gray-100 p-3 overflow-y-auto max-h-full">
							<div className="space-y-3">
								{/* Main Image */}
								<div className="aspect-square bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
									{product.images && product.images.length > 0 ? (
										<Image
											src={product.images[selectedImageIndex]}
											alt={product.title}
											width={350}
											height={350}
											className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center text-gray-400">
											<Package className="w-12 h-12" />
										</div>
									)}
								</div>

								{/* Image Thumbnails */}
								{product.images && product.images.length > 1 && (
									<div className="flex gap-1.5 overflow-x-auto pb-1">
										{product.images.map((image, index) => (
											<button
												key={index}
												onClick={() => setSelectedImageIndex(index)}
												className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all duration-200 ${
													selectedImageIndex === index
														? "border-blue-500 shadow-sm"
														: "border-gray-300 hover:border-gray-400"
												}`}
											>
												<Image
													src={image}
													alt={`${product.title} ${index + 1}`}
													width={48}
													height={48}
													className="w-full h-full object-cover"
												/>
											</button>
										))}
									</div>
								)}

								{/* Product Rating & Reviews */}
								<div className="bg-white rounded-lg p-2.5 shadow-sm">
									<div className="flex items-center gap-1.5 mb-1">
										<div className="flex items-center">
											{[1, 2, 3, 4, 5].map((star) => (
												<Star
													key={star}
													className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400"
												/>
											))}
										</div>
										<span className="text-xs text-gray-600">
											(4.8) • 124 reviews
										</span>
									</div>
									<p className="text-xs text-gray-500">
										Highly rated by customers
									</p>
								</div>
							</div>
						</div>

						{/* Right Side - Product Details (70% width) */}
						<div className="lg:w-[70%] flex flex-col h-full bg-white">
							{/* Fixed Header with Close Button */}
							<div className="flex-shrink-0 flex justify-between items-center p-3 border-b border-gray-200 bg-white">
								<div className="flex-1">
									<h1 className="text-lg lg:text-xl font-bold text-gray-900">
										{product.title}
									</h1>
									{product.vendor?.name && (
										<p className="text-sm text-gray-600 font-medium">
											by {product.vendor.name}
										</p>
									)}
								</div>
								<div className="flex items-center gap-1.5">
									<button className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
										<Heart className="w-3.5 h-3.5 text-gray-600" />
									</button>
									<button className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
										<Share2 className="w-3.5 h-3.5 text-gray-600" />
									</button>
									<button
										onClick={() => setShowModal(false)}
										className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ml-1"
									>
										<svg
											className="w-3.5 h-3.5 text-gray-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							</div>

							{/* Scrollable Content */}
							<div
								className="flex-1 overflow-y-auto"
								style={{ maxHeight: "calc(90vh - 120px)" }}
							>
								<div className="p-2.5 space-y-2.5">
									{/* Price Display - Dynamic based on selection */}
									<div className="p-2.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-xs text-gray-600 mb-1">
													{selectedItems.length > 0
														? "Selected Price"
														: "Total Price"}
												</p>
												<div className="text-lg font-bold text-gray-900">
													<Price
														price={withCommission(
															selectedItems.length > 0
																? getSelectedPrice()
																: getTotalPrice(),
														)}
														originalCurrency={currency}
														size="lg"
														variant="accent"
													/>
												</div>
											</div>
											{hasDiscount && (
												<div className="text-right">
													<span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
														{Math.round(product.discount)}% OFF
													</span>
												</div>
											)}
										</div>
									</div>

									{/* Product Description */}
									{product.description && (
										<div className="p-2 bg-gray-50 rounded-lg">
											<div className="flex items-center gap-1.5 mb-1.5">
												<Info className="w-3 h-3 text-blue-600" />
												<h3 className="font-medium text-gray-900 text-sm">
													Description
												</h3>
											</div>
											<p className="text-gray-700 leading-relaxed text-sm">
												{product.description}
											</p>
										</div>
									)}

									{/* Product Details Grid */}
									<div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
										{/* Category */}
										{product.category && (
											<div className="bg-white border border-gray-200 rounded-lg p-2">
												<div className="flex items-center gap-1 mb-1">
													<Package className="w-2.5 h-2.5 text-gray-600" />
													<span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
														Category
													</span>
												</div>
												<p className="font-medium text-gray-900 capitalize text-sm">
													{product.category}
												</p>
											</div>
										)}

										{/* Type */}
										<div className="bg-white border border-gray-200 rounded-lg p-2">
											<div className="flex items-center gap-1 mb-1">
												<Palette className="w-2.5 h-2.5 text-gray-600" />
												<span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
													Type
												</span>
											</div>
											<p className="font-medium text-gray-900 capitalize text-sm">
												{product.type === "bespoke"
													? "Bespoke"
													: "Ready-to-Wear"}
											</p>
										</div>

										{/* Sizes */}
										{product.rtwOptions?.sizes &&
											product.rtwOptions.sizes.length > 0 && (
												<div className="bg-white border border-gray-200 rounded-lg p-2 col-span-2">
													<div className="flex items-center gap-1 mb-1.5">
														<Ruler className="w-2.5 h-2.5 text-gray-600" />
														<span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
															Sizes
														</span>
													</div>
													<div className="flex flex-wrap gap-1">
														{product.rtwOptions.sizes
															.slice(0, 3)
															.map((size, index) => (
																<span
																	key={index}
																	className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-medium text-gray-700"
																>
																	{typeof size === "string"
																		? size
																		: size.label || "N/A"}
																</span>
															))}
														{product.rtwOptions.sizes.length > 3 && (
															<span className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-medium text-gray-700">
																+{product.rtwOptions.sizes.length - 3}
															</span>
														)}
													</div>
												</div>
											)}
									</div>

									{/* Item Selection */}
									<div className="p-2.5 bg-white border border-gray-200 rounded-lg">
										<h3 className="font-medium text-sm text-gray-900 mb-2.5 flex items-center gap-1.5">
											<ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
											Select Items to Purchase:
										</h3>

										<div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
											{/* Individual Item Buttons */}
											{product.individualItems!.map((item) => {
												const isSelected = selectedItems.includes(item.id);
												return (
													<button
														key={item.id}
														onClick={() => handleItemToggle(item.id)}
														className={`relative p-3 rounded-lg border-2 transition-all duration-200 font-medium text-left hover:shadow-md transform hover:scale-[1.02] ${
															isSelected
																? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg ring-2 ring-blue-200"
																: "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
														}`}
													>
														{/* Selection Indicator */}
														{isSelected && (
															<div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
																<svg
																	className="w-3 h-3 text-white"
																	fill="currentColor"
																	viewBox="0 0 20 20"
																>
																	<path
																		fillRule="evenodd"
																		d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																		clipRule="evenodd"
																	/>
																</svg>
															</div>
														)}

														<div className="space-y-2">
															<div>
																<div className="font-semibold text-sm text-gray-900">
																	{item.name}
																</div>
																<div className="text-xs text-gray-500">
																	Individual item
																</div>
															</div>
															<div className="flex justify-between items-center">
																<div className="text-sm font-bold text-gray-900">
																	<Price
																		price={withCommission(item.price)}
																		originalCurrency={currency}
																		size="sm"
																		variant="default"
																	/>
																</div>
																{isSelected && (
																	<div className="text-xs text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded-full">
																		SELECTED
																	</div>
																)}
															</div>
														</div>
													</button>
												);
											})}

											{/* Both Items Button - Full Width */}
											<button
												onClick={() => handleItemToggle("both")}
												className={`relative lg:col-span-2 p-3 rounded-lg border-2 transition-all duration-200 font-medium text-left hover:shadow-md transform hover:scale-[1.02] ${
													selectedItems.length ===
													product.individualItems!.length
														? "border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg ring-2 ring-green-200"
														: "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
												}`}
											>
												{/* Selection Indicator */}
												{selectedItems.length ===
													product.individualItems!.length && (
													<div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
														<svg
															className="w-3 h-3 text-white"
															fill="currentColor"
															viewBox="0 0 20 20"
														>
															<path
																fillRule="evenodd"
																d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																clipRule="evenodd"
															/>
														</svg>
													</div>
												)}

												<div className="flex justify-between items-center">
													<div className="space-y-1">
														<div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
															Both Items
															<span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
																BEST VALUE
															</span>
														</div>
														<div className="text-xs text-gray-500">
															Complete set - Save more!
														</div>
													</div>
													<div className="text-right space-y-1">
														<div className="text-sm font-bold text-gray-900">
															<Price
																price={withCommission(getTotalPrice())}
																originalCurrency={currency}
																size="sm"
																variant="default"
															/>
														</div>
														{selectedItems.length ===
															product.individualItems!.length && (
															<div className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full">
																SELECTED
															</div>
														)}
													</div>
												</div>
											</button>
										</div>
									</div>

									{/* Quantity Selector */}
									<div className="p-2 bg-gray-50 rounded-lg">
										<h4 className="font-medium text-gray-900 mb-1.5 text-sm">
											Quantity
										</h4>
										<div className="flex items-center gap-2">
											<button
												onClick={() => setQuantity(Math.max(1, quantity - 1))}
												className="w-6 h-6 rounded-md bg-white border border-gray-300 flex items-center justify-center text-sm font-medium hover:bg-gray-100 transition-colors"
											>
												−
											</button>
											<div className="w-8 h-6 rounded-md bg-white border border-gray-300 flex items-center justify-center text-sm font-medium">
												{quantity}
											</div>
											<button
												onClick={() => setQuantity(quantity + 1)}
												className="w-6 h-6 rounded-md bg-white border border-gray-300 flex items-center justify-center text-sm font-medium hover:bg-gray-100 transition-colors"
											>
												+
											</button>
										</div>
									</div>

									{/* Selected Price Summary */}
									{selectedItems.length > 0 && (
										<div className="p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
											<div className="flex justify-between items-center">
												<div>
													<p className="font-medium text-green-900 text-sm">
														Selected Total:
													</p>
													<p className="text-xs text-green-700">
														Quantity: {quantity}
													</p>
												</div>
												<div className="text-right">
													<div className="text-lg font-bold text-green-900">
														<Price
															price={withCommission(
																getSelectedPrice() * quantity,
															)}
															originalCurrency={currency}
															size="lg"
															variant="accent"
														/>
													</div>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Fixed Footer - Add to Cart Button */}
							<div className="flex-shrink-0 p-2.5 border-t border-gray-200 bg-white">
								<button
									onClick={handleAddToCart}
									disabled={selectedItems.length === 0 || isAddingToCart}
									className={`w-full px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-1.5 ${
										selectedItems.length === 0 || isAddingToCart
											? "bg-gray-300 text-gray-500 cursor-not-allowed"
											: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
									}`}
								>
									<ShoppingCart className="w-3.5 h-3.5" />
									{isAddingToCart
										? "Adding to Cart..."
										: selectedItems.length === 0
											? "Select items to add to cart"
											: selectedItems.length === product.individualItems!.length
												? `Add Both Items to Cart • ${quantity} ${quantity === 1 ? "Set" : "Sets"}`
												: `Add ${product.individualItems!.find((i) => selectedItems.includes(i.id))?.name} to Cart • ${quantity} ${quantity === 1 ? "Item" : "Items"}`}
								</button>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
