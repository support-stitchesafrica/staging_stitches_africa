"use client";

/**
 * Storefront Cart Component
 * Shows cart items with quantity controls and checkout functionality
 */

import React, { useState, useEffect } from "react";
import { StorefrontConfig } from "@/types/storefront";
import { useStorefrontCart } from "@/contexts/StorefrontCartContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { Price } from "@/components/common/Price";
import { useCurrency } from "@/contexts/CurrencyContext";
import Link from "next/link";
import Image from "next/image";
import {
	GuestCheckoutModal,
	GuestCheckoutData,
} from "@/components/shops/checkout/GuestCheckoutModal";
import {
	processGuestCheckout,
	cleanupGuestPassword,
} from "@/lib/services/guestCheckoutService";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StorefrontCartProps {
	storefront: StorefrontConfig;
}

export default function StorefrontCart({ storefront }: StorefrontCartProps) {
	const {
		items,
		updateItemQuantity,
		removeItem,
		totalAmount,
		itemCount,
		clearCart,
		setStorefrontContext,
		initiateCheckout,
	} = useStorefrontCart();
	const { user } = useAuth();
	const { userCurrency } = useCurrency();
	const router = useRouter();
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [showGuestModal, setShowGuestModal] = useState(false);

	// Calculate source total if all items have the same source currency (Fix for price discrepancy)
	const uniqueSourceCurrencies = new Set(
		items.filter((i) => i.sourceCurrency).map((i) => i.sourceCurrency),
	);

	const hasUniformSourceCurrency = uniqueSourceCurrencies.size === 1;
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

	// Set storefront context when component mounts
	useEffect(() => {
		setStorefrontContext({
			storefrontId: storefront.id,
			storefrontHandle: storefront.handle,
		});
	}, [storefront.id, storefront.handle, setStorefrontContext]);

	const handleCheckout = async () => {
		if (!user) {
			// Show guest checkout modal instead of redirecting immediately
			setShowGuestModal(true);
		} else {
			// User is logged in, proceed to checkout
			setIsCheckingOut(true);
			try {
				router.push(`/store/${storefront.handle}/checkout`);
			} catch (error) {
				console.error("Checkout error:", error);
				alert("Failed to proceed to checkout. Please try again.");
			} finally {
				setIsCheckingOut(false);
			}
		}
	};

	const handleSignIn = () => {
		// Redirect to auth with return URL to cart page
		const currentUrl = `/store/${storefront.handle}/cart`;
		router.push(`/shops/auth?redirect=${encodeURIComponent(currentUrl)}`);
	};

	const handleGuestCheckout = async (guestData: GuestCheckoutData) => {
		console.log(
			"[StorefrontCart] handleGuestCheckout called with data:",
			guestData,
		);

		try {
			// Convert storefront cart items to the format expected by processGuestCheckout
			const cartItems = items.map((item) => ({
				product_id: item.product_id,
				title: item.title,
				description: item.description || "",
				price: item.price,
				discount: item.discount || 0,
				quantity: item.quantity,
				images: item.images || [],
				tailor_id: item.tailor_id || "",
				tailor: item.tailor || "",
				user_id: "",
				createdAt: item.createdAt || new Date(),
				updatedAt: item.updatedAt || new Date(),
				isCollectionItem: false,
				isRemovable: true,
				type: "ready-to-wear" as const, // Storefront items are typically ready-to-wear
				color: item.color || null,
				size: item.size || null,
				sizes: item.sizes || null,
				originalPrice: item.price,
				dutyCharge: 0,
			}));

			// Create guest user account
			const result = await processGuestCheckout(guestData, cartItems);

			console.log("[StorefrontCart] Guest checkout result:", result);

			// Close the modal before redirect
			setShowGuestModal(false);

			toast.success(
				"Account created successfully! Check your email for login credentials.",
			);

			// Redirect to checkout
			router.push(`/store/${storefront.handle}/checkout`);

			// Clean up guest password from database after a delay
			setTimeout(() => {
				cleanupGuestPassword(result.uid).catch(console.error);
			}, 5000);
		} catch (error: any) {
			console.error("[StorefrontCart] Error during guest checkout:", error);
			toast.error(error.message || "Failed to process guest checkout");
			throw error;
		}
	};

	const handleQuantityChange = async (
		productId: string,
		newQuantity: number,
	) => {
		try {
			if (newQuantity <= 0) {
				await removeItem(productId);
			} else {
				await updateItemQuantity(productId, newQuantity);
			}
		} catch (error) {
			console.error("Error updating quantity:", error);
		}
	};

	return (
		<>
			<GuestCheckoutModal
				isOpen={showGuestModal}
				onClose={() => setShowGuestModal(false)}
				onSignIn={handleSignIn}
				onGuestCheckout={handleGuestCheckout}
			/>
			<div
				className="min-h-screen"
				style={{
					backgroundColor: storefront.theme.colors.background,
					color: storefront.theme.colors.text,
					fontFamily: storefront.theme.typography.bodyFont,
				}}
			>
				{/* Header */}
				<header
					className="shadow-sm border-b sticky top-0 z-10"
					style={{
						backgroundColor: storefront.theme.colors.background,
						borderColor: storefront.theme.colors.secondary + "20",
					}}
				>
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between h-16">
							<Link
								href={`/store/${storefront.handle}`}
								className="flex items-center gap-3 hover:opacity-80 transition-opacity"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10 19l-7-7m0 0l7-7m-7 7h18"
									/>
								</svg>
								<span className="font-medium">Continue Shopping</span>
							</Link>

							<div className="flex items-center gap-4">
								{/* Language & Currency Selector */}
								<LanguageSelector />

								<div className="flex items-center gap-2">
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
										/>
									</svg>
									<span className="font-semibold">Shopping Cart</span>
								</div>
							</div>
						</div>
					</div>
				</header>

				{/* Cart Content */}
				<main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{items.length === 0 ? (
						/* Empty Cart */
						<div className="text-center py-16">
							<div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
								<svg
									className="w-12 h-12 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
									/>
								</svg>
							</div>
							<h2
								className="text-2xl font-bold mb-4"
								style={{
									color: storefront.theme.colors.primary,
									fontFamily: storefront.theme.typography.headingFont,
								}}
							>
								Your cart is empty
							</h2>
							<p className="text-gray-600 mb-8">
								Looks like you haven't added any items to your cart yet.
							</p>
							<Link
								href={`/store/${storefront.handle}`}
								className="inline-flex items-center px-6 py-3 text-white rounded-lg hover:shadow-lg transition-all duration-200"
								style={{ backgroundColor: storefront.theme.colors.primary }}
							>
								<svg
									className="w-5 h-5 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
									/>
								</svg>
								Start Shopping
							</Link>
						</div>
					) : (
						/* Cart Items */
						<div className="space-y-8">
							{/* Cart Header */}
							<div className="flex items-center justify-between">
								<h1
									className="text-3xl font-bold"
									style={{
										color: storefront.theme.colors.primary,
										fontFamily: storefront.theme.typography.headingFont,
									}}
								>
									Shopping Cart ({itemCount}{" "}
									{itemCount === 1 ? "item" : "items"})
								</h1>
								<button
									onClick={clearCart}
									className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
								>
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
									Clear Cart
								</button>
							</div>

							{/* Cart Items */}
							<div className="space-y-4">
								{items.map((item) => (
									<div
										key={item.product_id}
										className="flex gap-4 p-4 bg-white rounded-lg shadow-sm border"
										style={{
											borderColor: storefront.theme.colors.secondary + "20",
										}}
									>
										{/* Product Image */}
										<div className="relative w-20 h-20 flex-shrink-0">
											<Image
												src={item.images?.[0] || "/placeholder-product.svg"}
												alt={item.title}
												fill
												className="object-cover rounded-lg"
												sizes="80px"
											/>
										</div>

										{/* Product Details */}
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-lg mb-1 truncate">
												{item.title}
											</h3>
											<p className="text-gray-600 text-sm mb-2 line-clamp-2">
												{item.description}
											</p>
											<div className="flex items-center gap-2">
												<span
													className="text-lg font-bold"
													style={{ color: storefront.theme.colors.primary }}
												>
													<Price
														price={item.price}
														size="lg"
														variant="accent"
														originalCurrency="USD"
													/>
												</span>
												<span className="text-gray-500">each</span>
											</div>
										</div>

										{/* Quantity Controls */}
										<div className="flex flex-col items-end gap-3">
											<button
												onClick={() => removeItem(item.product_id)}
												className="text-red-600 hover:text-red-700 p-1"
												title="Remove item"
											>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>

											<div className="flex items-center border border-gray-300 rounded-lg">
												<button
													onClick={() =>
														handleQuantityChange(
															item.product_id,
															item.quantity - 1,
														)
													}
													className="px-3 py-1 hover:bg-gray-100 transition-colors"
												>
													-
												</button>
												<span className="px-3 py-1 border-x border-gray-300 min-w-[3rem] text-center">
													{item.quantity}
												</span>
												<button
													onClick={() =>
														handleQuantityChange(
															item.product_id,
															item.quantity + 1,
														)
													}
													className="px-3 py-1 hover:bg-gray-100 transition-colors"
												>
													+
												</button>
											</div>

											<div className="text-right">
												<div
													className="text-lg font-bold"
													style={{ color: storefront.theme.colors.primary }}
												>
													<Price
														price={item.price * item.quantity}
														size="lg"
														variant="accent"
														originalCurrency="USD"
													/>
												</div>
												<div className="text-sm text-gray-500">
													{item.quantity} ×{" "}
													<Price
														price={item.price}
														size="sm"
														originalCurrency="USD"
													/>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>

							{/* Cart Summary */}
							<div className="bg-gray-50 rounded-lg p-6 space-y-4">
								<h3 className="text-xl font-semibold">Order Summary</h3>

								<div className="space-y-2">
									<div className="flex justify-between">
										<span>Subtotal ({itemCount} items)</span>
										<span>
											<Price price={totalAmount} originalCurrency="USD" />
										</span>
									</div>
									<div className="flex justify-between text-sm text-gray-600">
										<span>Shipping</span>
										<span>Calculated at checkout</span>
									</div>
									<div className="flex justify-between text-xl font-bold">
										<span>Subtotal</span>
										<span style={{ color: storefront.theme.colors.primary }}>
											<Price
												price={totalAmount}
												size="lg"
												variant="accent"
												originalCurrency="USD"
											/>
										</span>
									</div>
								</div>

								{/* Checkout Button */}
								<button
									onClick={handleCheckout}
									disabled={isCheckingOut}
									className="w-full px-6 py-4 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
									style={{ backgroundColor: storefront.theme.colors.primary }}
								>
									{isCheckingOut ? "Redirecting..." : "Proceed to Checkout"}
								</button>

								<p className="text-sm text-gray-600 text-center">
									🔒 You will be redirected to Stitches Africa for secure
									checkout
								</p>
							</div>
						</div>
					)}
				</main>
			</div>
		</>
	);
}
