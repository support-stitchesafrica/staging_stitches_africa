"use client";

/**
 * Cart Widget Component for Storefront
 * Shows cart status and provides checkout functionality
 *
 * Validates: Requirements 7.4, 7.5
 */

import React, { useState } from "react";
import { useStorefrontCart } from "@/contexts/StorefrontCartContext";
import { formatPrice } from "@/lib/utils";

interface CartWidgetProps {
	className?: string;
	showDetails?: boolean;
}

export default function CartWidget({
	className = "",
	showDetails = false,
}: CartWidgetProps) {
	const {
		items,
		itemCount,
		total,
		loading,
		initiateCheckout,
		removeItem,
		updateItemQuantity,
	} = useStorefrontCart();

	const [isOpen, setIsOpen] = useState(false);
	const [checkingOut, setCheckingOut] = useState(false);

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

	const handleCheckout = async () => {
		try {
			setCheckingOut(true);
			const checkoutUrl = await initiateCheckout();
			if (checkoutUrl) {
				window.location.href = checkoutUrl;
			}
		} catch (error) {
			console.error("Checkout error:", error);
			// You could add error toast notification here
		} finally {
			setCheckingOut(false);
		}
	};

	const handleQuantityChange = (productId: string, newQuantity: number) => {
		if (newQuantity <= 0) {
			removeItem(productId);
		} else {
			updateItemQuantity(productId, newQuantity);
		}
	};

	if (itemCount === 0 && !showDetails) {
		return null;
	}

	return (
		<div className={`relative ${className}`}>
			{/* Cart Button */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="relative flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
				disabled={loading}
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
						d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z"
					/>
				</svg>
				<span>Cart</span>
				{itemCount > 0 && (
					<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
						{itemCount > 99 ? "99+" : itemCount}
					</span>
				)}
			</button>

			{/* Cart Dropdown */}
			{isOpen && (
				<div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
					<div className="p-4">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold">Shopping Cart</h3>
							<button
								onClick={() => setIsOpen(false)}
								className="text-gray-400 hover:text-gray-600"
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
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

						{items.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								<svg
									className="w-12 h-12 mx-auto mb-4 text-gray-300"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15"
									/>
								</svg>
								<p>Your cart is empty</p>
							</div>
						) : (
							<>
								{/* Cart Items */}
								<div className="space-y-3 max-h-64 overflow-y-auto">
									{items.map((item) => (
										<div
											key={`${item.product_id}-${item.size}-${item.color}`}
											className="flex items-center gap-3 p-2 border border-gray-100 rounded"
										>
											<img
												src={item.images?.[0] || "/placeholder-product.svg"}
												alt={item.title}
												className="w-12 h-12 object-cover rounded"
											/>
											<div className="flex-1 min-w-0">
												<h4 className="text-sm font-medium truncate">
													{item.title}
												</h4>
												<p className="text-xs text-gray-500">
													{formatPrice(
														item.sourcePrice || item.price,
														item.sourceCurrency || "NGN",
													)}
													{item.size && ` • Size: ${item.size}`}
													{item.color && ` • Color: ${item.color}`}
												</p>
												<div className="flex items-center gap-2 mt-1">
													<button
														onClick={() =>
															handleQuantityChange(
																item.product_id,
																item.quantity - 1,
															)
														}
														className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
													>
														-
													</button>
													<span className="text-sm font-medium">
														{item.quantity}
													</span>
													<button
														onClick={() =>
															handleQuantityChange(
																item.product_id,
																item.quantity + 1,
															)
														}
														className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
													>
														+
													</button>
												</div>
											</div>
											<button
												onClick={() => removeItem(item.product_id)}
												className="text-red-500 hover:text-red-700 p-1"
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
											</button>
										</div>
									))}
								</div>

								{/* Cart Total */}
								<div className="border-t border-gray-200 pt-4 mt-4">
									<div className="flex items-center justify-between text-lg font-semibold">
										<span>Total:</span>
										<span>
											{formatPrice(
												sourceSubtotal || total,
												sourceCurrency || "NGN",
											)}
										</span>
									</div>
								</div>

								{/* Checkout Button */}
								<button
									onClick={handleCheckout}
									disabled={checkingOut || loading}
									className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
								>
									{checkingOut ? (
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									) : (
										"Proceed to Checkout"
									)}
								</button>
							</>
						)}
					</div>
				</div>
			)}

			{/* Backdrop */}
			{isOpen && (
				<div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
			)}
		</div>
	);
}
