"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import {
	ArrowLeft,
	ShoppingCart,
	Trash2,
	Plus,
	Minus,
	Tag,
	Package,
} from "lucide-react";
import { Price } from "@/components/common/Price";
import Image from "next/image";
import { useState } from "react";
import {
	GuestCheckoutModal,
	GuestCheckoutData,
} from "@/components/shops/checkout/GuestCheckoutModal";
import {
	processGuestCheckout,
	cleanupGuestPassword,
} from "@/lib/services/guestCheckoutService";
import { toast } from "sonner";
import { getActivityTracker } from "@/lib/analytics/activity-tracker";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function CartPage() {
	const router = useRouter();
	const { t } = useLanguage();
	const {
		items,
		totalAmount,
		shippingCost,
		totalWithShipping,
		removeItem,
		updateItemQuantity,
		itemCount,
		getBogoCartSummary,
		removeBogoPair,
		updateBogoQuantity,
		clearCart,
	} = useCart();
	const { user } = useAuth();
	const [removingItem, setRemovingItem] = useState<string | null>(null);
	const [showGuestModal, setShowGuestModal] = useState(false);

	// Removed local formatPrice in favor of Price component

	// Calculate source total if all items have the same source currency
	// This prevents rounding errors when converting back and forth
	const uniqueSourceCurrencies = new Set(
		items.filter((i) => i.sourceCurrency).map((i) => i.sourceCurrency),
	);

	const hasUniformSourceCurrency = uniqueSourceCurrencies.size === 1;
	// Also check if all items actually have a source price
	const allItemsHaveSourcePrice = items.every(
		(i) => i.sourcePrice !== undefined,
	);

	const sourceCurrency =
		hasUniformSourceCurrency && allItemsHaveSourcePrice
			? items[0].sourceCurrency
			: undefined;

	const sourceSubtotal =
		hasUniformSourceCurrency && allItemsHaveSourcePrice && sourceCurrency
			? items.reduce(
					(sum, item) => sum + (item.sourcePrice || 0) * item.quantity,
					0,
				)
			: undefined;

	const handleCheckout = () => {
		if (!user) {
			// Show guest checkout modal instead of redirecting immediately
			setShowGuestModal(true);
		} else {
			router.push("/shops/checkout");
		}
	};

	const handleSignIn = () => {
		// Redirect to auth with return URL to cart page
		const currentUrl =
			typeof window !== "undefined"
				? window.location.pathname + window.location.search
				: "/shops/cart";
		router.push("/shops/auth?redirect=" + encodeURIComponent(currentUrl));
	};

	const handleGuestCheckout = async (guestData: GuestCheckoutData) => {
		console.log("[CartPage] handleGuestCheckout called with data:", guestData);
		console.log("[CartPage] Current cart items:", items);

		try {
			console.log("[CartPage] Calling processGuestCheckout...");
			// Create guest user account
			const result = await processGuestCheckout(guestData, items);

			console.log("[CartPage] Guest checkout result:", result);

			// Close the modal before redirect
			setShowGuestModal(false);

			toast.success(t.common.accountCreated);

			// Check if user has bespoke items
			if (result.hasBespokeItems) {
				console.log(
					"[CartPage] Cart has bespoke items, redirecting to measurements...",
				);
				// Redirect to measurements page
				toast.info(t.common.measurementsRequired);
				router.push("/shops/measurements");
			} else {
				console.log("[CartPage] No bespoke items, redirecting to checkout...");
				// Redirect directly to checkout
				router.push("/shops/checkout");
			}

			// Clean up guest password from database after a delay
			setTimeout(() => {
				cleanupGuestPassword(result.uid).catch(console.error);
			}, 5000);
		} catch (error: any) {
			console.error("[CartPage] Error during guest checkout:", error);
			toast.error(error.message || t.common.guestCheckoutError);
			throw error;
		}
	};

	const handleRemoveItem = async (productId: string) => {
		setRemovingItem(productId);

		// Track remove from cart activity
		// Validates: Requirements 21.3
		const item = items.find((i) => i.product_id === productId);
		if (item) {
			const vendorId = item.tailor_id || item.product?.tailor_id;
			if (vendorId) {
				const activityTracker = getActivityTracker();
				activityTracker
					.trackRemoveFromCart(productId, vendorId, user?.uid)
					.catch((err) =>
						console.warn("Could not track remove from cart:", err),
					);
			}
		}
		setTimeout(() => {
			removeItem(productId);
			window.dispatchEvent(new Event("cart-updated"));
			setRemovingItem(null);
		}, 300);
	};

	const handleClearCart = () => {
		if (
			window.confirm(
				t.cart.clearConfirmation || "Are you sure you want to clear your cart?",
			)
		) {
			clearCart();
		}
	};

	const handleUpdateQuantity = async (
		productId: string,
		newQuantity: number,
	) => {
		await updateItemQuantity(productId, newQuantity);
		window.dispatchEvent(new Event("cart-updated"));
	};

	if (items.length === 0) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
				<div className="text-center max-w-md animate-fade-in">
					<div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6 shadow-lg">
						<ShoppingCart className="w-12 h-12 text-gray-400" />
					</div>
					<h2 className="text-3xl font-bold text-gray-900 mb-3">
						{t.cart.empty}
					</h2>
					<p className="text-gray-600 mb-8 text-lg">{t.cart.discover}</p>
					<button
						onClick={() => router.push("/shops")}
						className="px-8 py-4 bg-gradient-to-r from-black to-gray-800 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 transform"
					>
						{t.cart.startShopping}
					</button>
				</div>
			</div>
		);
	}

	return (
		<>
			<GuestCheckoutModal
				isOpen={showGuestModal}
				onClose={() => setShowGuestModal(false)}
				onSignIn={handleSignIn}
				onGuestCheckout={handleGuestCheckout}
			/>
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
				{/* Header */}
				<div className="bg-white border-b shadow-sm backdrop-blur-sm bg-white/90 sticky top-0 z-30">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
						<div className="flex items-center justify-between gap-3">
							<button
								onClick={() => router.back()}
								className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 group"
							>
								<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
								<span className="hidden sm:inline">
									{t.cart.continueShopping}
								</span>
							</button>
							<div className="flex items-center gap-3">
								<div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
									<Package className="w-4 h-4 text-gray-600" />
									<span className="text-sm font-medium text-gray-700">
										{itemCount} {t.cart.items}
									</span>
								</div>
								<h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
									{t.cart.title}
								</h1>
								{itemCount > 0 && (
									<button
										onClick={handleClearCart}
										className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-2"
										title={t.cart.clearCart || "Clear Cart"}
									>
										<Trash2 className="w-4 h-4" />
										<span className="hidden sm:inline">
											{t.cart.clearCart || "Clear Cart"}
										</span>
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Cart Content */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
						{/* Cart Items */}
						<div className="lg:col-span-2 space-y-4">
							{items.map((item, index) => {
								const itemKey =
									item.id ||
									`${item.product_id}-${item.size || "no-size"}-${item.color || "no-color"}-${index}`;
								const isRemoving = removingItem === item.product_id;

								return (
									<div
										key={itemKey}
										className={`bg-white rounded-xl shadow-sm hover:shadow-xl p-4 sm:p-6 flex gap-4 transition-all duration-300 border border-gray-100 hover:border-gray-200 group ${
											isRemoving
												? "opacity-0 scale-95"
												: "opacity-100 scale-100"
										}`}
									>
										{/* Product Image */}
										<div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-md">
											{item.images?.[0] || item.product?.images?.[0] ? (
												<Image
													src={
														item.images?.[0] || item.product?.images?.[0] || ""
													}
													alt={item.title || item.product?.title || "Product"}
													fill
													className="object-cover group-hover:scale-110 transition-transform duration-500"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-gray-400">
													<Package className="w-8 h-8" />
												</div>
											)}
										</div>

										{/* Product Details */}
										<div className="flex-1 min-w-0">
											<h3 className="font-bold text-gray-900 truncate text-base sm:text-lg group-hover:text-black transition-colors">
												{item.title || item.product?.title || "Product"}
											</h3>
											<p className="text-sm text-gray-500 mt-1 font-medium">
												{item.tailor || item.product?.tailor || "Vendor"}
											</p>
											{/* Product Description */}
											{(item.description || item.product?.description) && (
												<p className="text-xs text-gray-400 mt-1 line-clamp-2">
													{item.description || item.product?.description}
												</p>
											)}

											{/* BOGO Badge */}
											{item.isBogoFree && (
												<div className="mt-2">
													<span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-md">
														<Tag className="w-3 h-3" />
														{t.cart.freeBogoItem}
													</span>
												</div>
											)}

											{/* BOGO Main Product Badge */}
											{!item.isBogoFree &&
												items.some(
													(otherItem) =>
														otherItem.bogoMainProductId === item.product_id,
												) && (
													<div className="mt-2">
														<span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-md">
															<Tag className="w-3 h-3" />
															{t.cart.bogoPromotion}
														</span>
													</div>
												)}

											{/* Promotional Badge */}
											{item.promotionalEventId && (
												<div className="mt-2 animate-pulse">
													<span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-md">
														<Tag className="w-3 h-3" />
														{item.discountPercentage}% {t.cart.off} -{" "}
														{item.promotionalEventName}
													</span>
												</div>
											)}

											{/* Price */}
											<div className="mt-3 flex items-baseline gap-2">
												{item.isBogoFree ? (
													<>
														<span className="text-xl font-bold text-green-600">
															{t.cart.free}
														</span>
														{item.bogoOriginalPrice && (
															<div className="text-sm text-gray-400 line-through font-medium">
																<Price
																	price={item.bogoOriginalPrice}
																	originalCurrency="USD"
																/>
															</div>
														)}
													</>
												) : (
													<>
														<div className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
															<Price
																price={item.sourcePrice || item.price}
																originalCurrency={item.sourceCurrency || "USD"}
															/>
														</div>
														{item.originalPrice &&
															item.originalPrice > item.price && (
																<div className="text-sm text-gray-400 line-through font-medium">
																	<Price
																		price={item.originalPrice!}
																		originalCurrency="USD"
																	/>
																</div>
															)}
													</>
												)}
											</div>

											{/* Quantity Controls */}
											<div className="flex items-center gap-3 mt-4">
												{item.isBogoFree ? (
													// Free BOGO items - quantity controlled by main product
													<div className="flex items-center gap-2">
														<span className="text-sm text-gray-600">
															{t.cart.quantityMatchesMain}
														</span>
														<span className="px-3 py-1 bg-gray-100 rounded-lg font-bold text-gray-900">
															{item.quantity}
														</span>
													</div>
												) : (
													// Regular items or BOGO main products
													<div className="flex items-center gap-0 border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-gray-300 transition-colors bg-white">
														<button
															onClick={() => {
																const newQuantity = Math.max(
																	1,
																	item.quantity - 1,
																);
																// Check if this is a BOGO main product
																const isBogoMain = items.some(
																	(otherItem) =>
																		otherItem.bogoMainProductId ===
																		item.product_id,
																);
																if (isBogoMain && updateBogoQuantity) {
																	updateBogoQuantity(
																		item.product_id,
																		newQuantity,
																	);
																} else {
																	handleUpdateQuantity(
																		item.product_id,
																		newQuantity,
																	);
																}
															}}
															className="p-2 sm:p-2.5 hover:bg-gray-100 active:bg-gray-200 transition-all flex items-center justify-center group/btn"
															disabled={item.quantity <= 1}
														>
															<Minus className="w-4 h-4 text-gray-100 group-hover/btn:text-black transition-colors" />
														</button>
														<span className="px-4 sm:px-5 text-base sm:text-lg font-bold text-gray-900 min-w-[3rem] text-center">
															{item.quantity}
														</span>
														<button
															onClick={() => {
																const newQuantity = item.quantity + 1;
																// Check if this is a BOGO main product
																const isBogoMain = items.some(
																	(otherItem) =>
																		otherItem.bogoMainProductId ===
																		item.product_id,
																);
																if (isBogoMain && updateBogoQuantity) {
																	updateBogoQuantity(
																		item.product_id,
																		newQuantity,
																	);
																} else {
																	handleUpdateQuantity(
																		item.product_id,
																		newQuantity,
																	);
																}
															}}
															className="p-2 sm:p-2.5 hover:bg-gray-100 active:bg-gray-200 transition-all flex items-center justify-center group/btn"
														>
															<Plus className="w-4 h-4 text-gray-100 group-hover/btn:text-black transition-colors" />
														</button>
													</div>
												)}

												<button
													onClick={() => {
														// Check if this is a BOGO main product or free product
														const isBogoMain = items.some(
															(otherItem) =>
																otherItem.bogoMainProductId === item.product_id,
														);
														const isBogoFree = item.isBogoFree;

														if ((isBogoMain || isBogoFree) && removeBogoPair) {
															// Remove the entire BOGO pair
															const mainProductId = isBogoFree
																? item.bogoMainProductId
																: item.product_id;
															if (mainProductId) {
																removeBogoPair(mainProductId);
															}
														} else {
															// Remove individual item
															handleRemoveItem(item.product_id);
														}
													}}
													className="p-2 sm:p-2.5 text-red-600 hover:text-white hover:bg-red-600 transition-all flex items-center gap-2 rounded-xl border-2 border-red-200 hover:border-red-600 shadow-sm group/remove"
												>
													<Trash2 className="w-4 h-4" />
													<span className="hidden sm:inline text-sm font-semibold">
														{item.isBogoFree ||
														items.some(
															(otherItem) =>
																otherItem.bogoMainProductId === item.product_id,
														)
															? t.cart.removePair
															: t.cart.remove}
													</span>
												</button>
											</div>
										</div>

										{/* Item Total */}
										<div className="text-right flex-shrink-0 hidden sm:block">
											<p className="text-sm text-gray-500 mb-1 font-medium">
												Total
											</p>
											{item.isBogoFree ? (
												<p className="text-xl font-bold text-green-600">
													{t.cart.free}
												</p>
											) : (
												<div className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
													<Price
														price={
															(item.sourcePrice || item.price) * item.quantity
														}
														originalCurrency={item.sourceCurrency || "USD"}
													/>
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>

						{/* Order Summary */}
						<div className="lg:col-span-1">
							<div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 sticky top-24 border border-gray-200">
								<h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
									<ShoppingCart className="w-5 h-5" />
									{t.checkout.orderSummary}
								</h2>

								{/* BOGO Summary */}
								{(() => {
									const bogoSummary = getBogoCartSummary
										? getBogoCartSummary()
										: {
												hasBogoItems: false,
												bogoSavings: 0,
												freeShipping: false,
												bogoItemsCount: 0,
											};

									if (bogoSummary.hasBogoItems) {
										return (
											<div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
												<div className="flex items-center gap-2 mb-3">
													<Tag className="w-5 h-5 text-green-600" />
													<h3 className="font-bold text-green-800">
														{t.cart.bogoActive}
													</h3>
												</div>
												<div className="space-y-2 text-sm">
													<div className="flex justify-between">
														<span className="text-green-700">
															{t.cart.freeItems} ({bogoSummary.bogoItemsCount}):
														</span>
														<div className="font-bold text-green-800">
															<Price
																price={bogoSummary.bogoSavings}
																originalCurrency="USD"
															/>
														</div>
													</div>
													{bogoSummary.freeShipping && (
														<div className="flex justify-between">
															<span className="text-green-700">
																{t.cart.freeShipping}:
															</span>
															<span className="font-bold text-green-800">
																{t.cart.included}
															</span>
														</div>
													)}
													<div className="pt-2 border-t border-green-200">
														<div className="flex justify-between">
															<span className="font-bold text-green-800">
																{t.cart.totalSavings}:
															</span>
															<div className="font-bold text-green-800">
																<Price
																	price={
																		bogoSummary.bogoSavings +
																		(bogoSummary.freeShipping
																			? shippingCost
																			: 0)
																	}
																	originalCurrency="USD"
																/>
															</div>
														</div>
													</div>
												</div>
											</div>
										);
									}
									return null;
								})()}

								<div className="space-y-4 mb-6">
									<div className="flex justify-between text-base text-gray-600 pb-3 border-b border-gray-200">
										<span className="font-medium">Subtotal</span>
										<div className="font-semibold text-gray-900">
											<Price
												price={sourceSubtotal || totalAmount}
												originalCurrency={sourceCurrency || "USD"}
											/>
										</div>
									</div>
									<div className="flex justify-between text-base text-gray-600 pb-3 border-b border-gray-200">
										<span className="font-medium">{t.cart.shipping}</span>
										<span className="font-medium text-gray-500">
											{t.cart.shippingAtCheckout}
										</span>
									</div>
									<div className="flex justify-between text-xl font-bold pt-2">
										<span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
											{t.cart.subtotal}
										</span>
										<div className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
											<Price
												price={sourceSubtotal || totalAmount}
												originalCurrency={sourceCurrency || "USD"}
											/>
										</div>
									</div>
								</div>

								<button
									onClick={handleCheckout}
									className="w-full px-6 py-4 bg-gradient-to-r from-black to-gray-800 text-white font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform mb-3 text-base"
								>
									{t.cart.checkout}
								</button>

								<button
									onClick={() => router.push("/shops")}
									className="w-full px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 text-base"
								>
									{t.cart.continueShopping}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
