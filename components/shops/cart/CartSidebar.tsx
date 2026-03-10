"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { productRepository } from "@/lib/firestore";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { Price } from "@/components/common/Price";
import { toast } from "sonner";
import {
	X,
	Minus,
	Plus,
	ShoppingBag,
	Trash2,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import {
	generateBlurDataURL,
	RESPONSIVE_SIZES,
	IMAGE_DIMENSIONS,
} from "@/lib/utils/image-utils";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { withReactRuntimeWrapper } from "@/components/shops/wrappers/ReactRuntimeWrapper";
import {
	GuestCheckoutModal,
	GuestCheckoutData,
} from "@/components/shops/checkout/GuestCheckoutModal";
import {
	processGuestCheckout,
	cleanupGuestPassword,
} from "@/lib/services/guestCheckoutService";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CartSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

const CartSidebarComponent: React.FC<CartSidebarProps> = ({
	isOpen,
	onClose,
}) => {
	const router = useRouter();
	const { t } = useLanguage();
	const { user } = useAuth();
	const { userCurrency } = useCurrencyConversion();
	const {
		items,
		totalAmount,
		shippingCost,
		totalWithShipping,
		updateItemQuantity,
		removeItem,
		itemCount,
		getRegularItems,
		getAllCollections,
		getCollectionItems,
		getCollectionSummary,
		removeCollection,
		clearCart,
	} = useCart();
	const [products, setProducts] = useState<Record<string, Product>>({});
	const [loading, setLoading] = useState(false);
	const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
		new Set(),
	);
	const [showGuestModal, setShowGuestModal] = useState(false);

	const regularItems = getRegularItems();
	const collections = getAllCollections();

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

	useEffect(() => {
		if (isOpen && items.length > 0) {
			loadProducts();
		}
	}, [isOpen, items]);

	const loadProducts = async () => {
		setLoading(true);
		try {
			const productPromises = items.map((item) =>
				productRepository.getByIdWithTailorInfo(item.product_id),
			);
			const productResults = await Promise.all(productPromises);

			const productMap: Record<string, Product> = {};
			productResults.forEach((product) => {
				if (product) {
					productMap[product.product_id] = product;
				}
			});

			setProducts(productMap);
		} catch (error) {
			console.error("Error loading cart products:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleQuantityChange = useCallback(
		(item: any, newQuantity: number) => {
			// For individual items, we need to create a unique identifier
			const itemKey = item.isIndividualItem
				? `${item.product_id}-${item.individualItemId}`
				: item.product_id;

			if (newQuantity <= 0) {
				removeItem(itemKey);
			} else {
				updateItemQuantity(itemKey, newQuantity);
			}
		},
		[removeItem, updateItemQuantity],
	);

	const handleClearCart = useCallback(() => {
		if (
			window.confirm(
				t.cart.clearConfirmation || "Are you sure you want to clear your cart?",
			)
		) {
			clearCart();
		}
	}, [clearCart, t.cart.clearConfirmation]);

	const toggleCollectionExpansion = useCallback((collectionId: string) => {
		setExpandedCollections((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(collectionId)) {
				newSet.delete(collectionId);
			} else {
				newSet.add(collectionId);
			}
			return newSet;
		});
	}, []);

	const handleRegularCheckout = (e: React.MouseEvent) => {
		e.preventDefault();
		if (!user) {
			setShowGuestModal(true);
		} else {
			onClose();
			router.push("/shops/checkout");
		}
	};

	const handleSignIn = () => {
		onClose();
		const currentUrl =
			typeof window !== "undefined"
				? window.location.pathname + window.location.search
				: "/shops/cart";
		router.push("/shops/auth?redirect=" + encodeURIComponent(currentUrl));
	};

	const handleGuestCheckout = async (guestData: GuestCheckoutData) => {
		console.log(
			"[CartSidebar] handleGuestCheckout called with data:",
			guestData,
		);

		try {
			console.log("[CartSidebar] Calling processGuestCheckout...");
			const result = await processGuestCheckout(guestData, items);

			console.log("[CartSidebar] Guest checkout result:", result);

			// Close modal and sidebar before redirect
			setShowGuestModal(false);
			onClose();

			toast.success(
				"Account created successfully! Check your email for login credentials.",
			);

			if (result.hasBespokeItems) {
				console.log(
					"[CartSidebar] Cart has bespoke items, redirecting to measurements...",
				);
				toast.info("Please provide your measurements for bespoke items.");
				router.push("/shops/measurements");
			} else {
				console.log(
					"[CartSidebar] No bespoke items, redirecting to checkout...",
				);
				router.push("/shops/checkout");
			}

			setTimeout(() => {
				cleanupGuestPassword(result.uid).catch(console.error);
			}, 5000);
		} catch (error: any) {
			console.error("[CartSidebar] Error during guest checkout:", error);
			toast.error(error.message || "Failed to process guest checkout");
			throw error;
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

			{/* Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
					onClick={onClose}
				/>
			)}

			{/* Sidebar */}
			<div
				className={`
        fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
			>
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b">
						<div className="flex-1 flex items-center justify-between mr-4">
							<h2 className="text-lg font-semibold text-gray-900">
								{t.cart.title} ({itemCount})
							</h2>
							{itemCount > 0 && (
								<button
									onClick={handleClearCart}
									className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
								>
									<Trash2 size={14} />
									Clear
								</button>
							)}
						</div>
						<button
							onClick={onClose}
							className="p-2 hover:bg-gray-100 rounded-full"
						>
							<X size={20} />
						</button>
					</div>

					{/* Cart Items */}
					<div className="flex-1 overflow-y-auto p-4">
						{loading ? (
							<div className="space-y-4">
								{Array.from({ length: 3 }).map((_, index) => (
									<div key={index} className="animate-pulse flex space-x-4">
										<div className="bg-gray-200 w-16 h-16 rounded"></div>
										<div className="flex-1 space-y-2">
											<div className="h-4 bg-gray-200 rounded w-3/4"></div>
											<div className="h-3 bg-gray-200 rounded w-1/2"></div>
										</div>
									</div>
								))}
							</div>
						) : items.length === 0 ? (
							<div className="text-center py-8">
								<ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
								<p className="text-gray-500 mb-4">{t.cart.empty}</p>
								<button
									onClick={onClose}
									className="text-primary-600 hover:text-primary-500 font-medium"
								>
									{t.cart.continueShopping}
								</button>
							</div>
						) : (
							<div className="space-y-4">
								{items.map((item) => {
									const product = products[item.product_id];
									// Don't skip items without product lookup (e.g. collection products)

									// Create unique key for individual items
									const itemKey = item.isIndividualItem
										? `${item.product_id}-${item.individualItemId}-${item.size || ""}-${item.color || ""}`
										: `${item.product_id}-${item.size || ""}-${item.color || ""}`;

									return (
										<div
											key={itemKey}
											className="flex space-x-4 py-4 border-b border-gray-100"
										>
											<div className="relative w-16 h-16 shrink-0">
												<Image
													src={
														product?.images?.[0] ||
														item.images?.[0] ||
														"/placeholder-product.svg"
													}
													alt={item.title}
													fill
													className="object-cover rounded"
													sizes={RESPONSIVE_SIZES.orderItem}
													placeholder="blur"
													blurDataURL={generateBlurDataURL(
														IMAGE_DIMENSIONS.orderItem.width,
														IMAGE_DIMENSIONS.orderItem.height,
													)}
												/>
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<h4 className="text-sm font-medium text-gray-900 truncate">
														{item.title}
													</h4>
													{item.isBogoFree && (
														<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
															FREE
														</span>
													)}
													{item.isCollectionItem && (
														<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
															Bundle
														</span>
													)}
													{item.isIndividualItem && (
														<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
															Individual
														</span>
													)}
												</div>
												<p className="text-xs text-gray-500">
													{item.tailor || product?.vendor?.name}
												</p>

												{(item.size || item.color) && (
													<div className="mt-1">
														{item.size && (
															<span className="text-xs text-gray-500 mr-2">
																{t.checkout.size}: {item.size}
															</span>
														)}
														{item.color && (
															<span className="text-xs text-gray-500 mr-2">
																{t.checkout.color}: {item.color}
															</span>
														)}
													</div>
												)}

												<div className="flex items-center justify-between mt-2">
													<div className="flex items-center space-x-2">
														<button
															onClick={() =>
																handleQuantityChange(item, item.quantity - 1)
															}
															className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
														>
															<Minus size={12} />
														</button>
														<span className="text-sm font-medium w-8 text-center">
															{item.quantity}
														</span>
														<button
															onClick={() =>
																handleQuantityChange(item, item.quantity + 1)
															}
															className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
														>
															<Plus size={12} />
														</button>
													</div>

													<div className="text-right">
														<p className="text-sm font-semibold text-gray-900">
															{item.isBogoFree ? (
																<span className="line-through text-gray-400 mr-1">
																	<Price
																		price={item.price * item.quantity}
																		originalCurrency="USD"
																	/>
																</span>
															) : (
																<Price
																	price={
																		(item.sourcePrice || item.price) *
																		item.quantity
																	}
																	originalCurrency={
																		item.sourceCurrency || "USD"
																	}
																/>
															)}
														</p>
														<span
															onClick={() =>
																removeItem(
																	item.isIndividualItem
																		? `${item.product_id}-${item.individualItemId}`
																		: item.product_id,
																)
															}
															className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
															title={
																item.isBogoFree ||
																items.some(
																	(i) =>
																		i.bogoMainProductId === item.product_id,
																)
																	? "Removes entire BOGO pair"
																	: t.cart.remove
															}
														>
															{t.cart.remove}
														</span>
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Footer */}
					{items.length > 0 && (
						<div className="border-t p-4 space-y-4">
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600">
										{t.cart.subtotal}:
									</span>
									<span className="text-sm font-medium text-gray-900">
										<Price
											key={`subtotal-sm-${userCurrency}`}
											price={sourceSubtotal || totalAmount}
											originalCurrency={sourceCurrency || "USD"}
										/>
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600">
										{t.cart.shipping}:
									</span>
									<span className="text-sm font-medium text-gray-500">
										{t.cart.shippingAtCheckout}
									</span>
								</div>
								<div className="border-t pt-2">
									<div className="flex justify-between items-center">
										<span className="text-lg font-semibold text-gray-900">
											{t.cart.subtotal}:
										</span>
										<span className="text-lg font-bold text-gray-900">
											<Price
												key={`subtotal-lg-${userCurrency}`}
												price={sourceSubtotal || totalAmount}
												originalCurrency={sourceCurrency || "USD"}
											/>
										</span>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										+ {t.cart.shipping.toLowerCase()} at checkout
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<Link href="/shops/cart" onClick={onClose}>
									<button className="w-full mb-3 btn-secondary py-3 px-4 rounded-lg font-semibold transition-colors">
										{t.cart.viewCart}
									</button>
								</Link>

								<button
									onClick={handleRegularCheckout}
									className="w-full mb-2 py-3 px-4 rounded-lg font-semibold transition-colors bg-black text-white hover:bg-gray-800"
								>
									{t.cart.checkout}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

// Optimized comparison function for CartSidebar
const cartSidebarComparison = (
	prevProps: CartSidebarProps,
	nextProps: CartSidebarProps,
): boolean => {
	return (
		prevProps.isOpen === nextProps.isOpen &&
		prevProps.onClose === nextProps.onClose
	);
};

// Export memoized component wrapped with React runtime protection
const MemoizedCartSidebar = React.memo(
	CartSidebarComponent,
	cartSidebarComparison,
);
export const CartSidebar = withReactRuntimeWrapper(MemoizedCartSidebar, {
	enableHMRBoundary: true,
	fallback: (
		<div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex items-center justify-center">
			<div className="text-center">
				<ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
				<p className="text-gray-500">Cart temporarily unavailable</p>
			</div>
		</div>
	),
});
