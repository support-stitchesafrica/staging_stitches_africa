"use client";

import React, {
	useState,
	useEffect,
	useCallback,
	useMemo,
	Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { collectionRepository, productRepository } from "@/lib/firestore";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import {
	ShoppingBag,
	ArrowLeft,
	Trash2,
	AlertCircle,
	CheckCircle2,
} from "lucide-react";
import { SafeImage } from "@/components/shops/ui/SafeImage";
import {
	generateBlurDataURL,
	RESPONSIVE_SIZES,
	IMAGE_DIMENSIONS,
} from "@/lib/utils/image-utils";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function CollectionCartPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const collectionIdParam = searchParams.get("collectionId");
	const { t } = useLanguage();
	const { user, loading: authLoading } = useAuth();
	const {
		getCollectionItems,
		getCollectionSummary,
		removeCollection,
		removeItem,
		updateCollectionItemSelection,
		exemptCollectionItem,
		validateCollectionCart,
		addCollectionToCart,
		loading: cartLoading,
		items, // Get all items to watch for changes
	} = useCart();

	// Get collection-specific items and summary (memoized to prevent infinite loops)
	const collectionItems = useMemo(() => {
		return collectionIdParam ? getCollectionItems(collectionIdParam) : [];
	}, [collectionIdParam, items.length]);

	const collectionSummary = useMemo(() => {
		return collectionIdParam ? getCollectionSummary(collectionIdParam) : null;
	}, [collectionIdParam, items.length]);

	const collectionName = collectionSummary?.name || "Collection";
	const [validation, setValidation] = useState<{
		isValid: boolean;
		missingSelections: Array<{
			productId: string;
			productName: string;
			missing: string[];
		}>;
	}>({ isValid: false, missingSelections: [] });
	const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);
	const [isLoadingCollection, setIsLoadingCollection] = useState(false);
	const [hasTriedLoadingCollection, setHasTriedLoadingCollection] =
		useState(false);

	// Redirect to auth if not logged in
	useEffect(() => {
		if (!authLoading && !user) {
			const redirectUrl = collectionIdParam
				? `/shops/cart/collection?collectionId=${collectionIdParam}`
				: "/shops/cart/collection";
			router.push("/shops/auth?redirect=" + encodeURIComponent(redirectUrl));
		}
	}, [user, authLoading, router, collectionIdParam]);

	// Auto-load collection if not in cart (only after auth and cart have loaded)
	useEffect(() => {
		// Wait for both auth and cart to finish loading before checking
		if (authLoading || cartLoading || !user) {
			return;
		}

		// If no collectionId in URL, redirect to regular cart
		if (!collectionIdParam) {
			if (!hasTriedLoadingCollection) {
				setHasTriedLoadingCollection(true);
				setHasCheckedRedirect(true);
				router.replace("/shops/cart");
			}
			return;
		}

		// Check if collection is already in cart by checking items directly
		const hasCollectionInCart = items.some(
			(item) =>
				item.isCollectionItem && item.collectionId === collectionIdParam,
		);

		// If collection is already in cart, we're done
		if (hasCollectionInCart) {
			if (!hasTriedLoadingCollection) {
				setHasTriedLoadingCollection(true);
				setHasCheckedRedirect(true);
			}
			return;
		}

		// Only try loading once
		if (hasTriedLoadingCollection) {
			return;
		}

		// Collection not in cart, fetch and add it
		const loadAndAddCollection = async () => {
			setIsLoadingCollection(true);
			setHasTriedLoadingCollection(true);

			console.log("[CollectionCart] Loading collection:", collectionIdParam);

			try {
				// Fetch the collection
				const collection =
					await collectionRepository.getById(collectionIdParam);

				if (!collection) {
					console.error(
						"[CollectionCart] Collection not found:",
						collectionIdParam,
					);
					toast.error("Collection not found");
					router.replace("/shops/cart");
					return;
				}

				console.log(
					"[CollectionCart] Collection found:",
					collection.name || collection.title,
				);

				// Fetch all products in the collection in parallel
				const collectionProducts: Product[] = [];
				const productIds = collection.productIds || [];
				const userId = collection.createdBy || (collection as any).createdBy;

				// Create parallel promises for all products
				const productPromises = productIds.map(async (productIdWithPrefix) => {
					try {
						// Handle prefixed product IDs (marketplace:xxx or collection:xxx)
						if (productIdWithPrefix.startsWith("marketplace:")) {
							const actualProductId = productIdWithPrefix.replace(
								"marketplace:",
								"",
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
							const collectionProduct =
								await collectionRepository.getCollectionProductById(
									actualProductId,
									userId,
								);

							if (collectionProduct) {
								// Convert collection product to Product format
								return {
									product_id: collectionProduct.id || actualProductId,
									title: collectionProduct.title || "",
									description: collectionProduct.description || "",
									type: "ready-to-wear" as const,
									category: "",
									availability:
										collectionProduct.quantity > 0
											? ("in_stock" as const)
											: ("out_of_stock" as const),
									status: "verified" as const,
									price: {
										base: collectionProduct.price || 0,
										currency: "USD",
									},
									discount: 0,
									deliveryTimeline: "",
									returnPolicy: "",
									rtwOptions: {
										sizes: collectionProduct.size
											? [collectionProduct.size]
											: [],
										colors: collectionProduct.color
											? [collectionProduct.color]
											: [],
									},
									images: collectionProduct.images || [],
									tailor_id: collectionProduct.owner?.email || "",
									tailor: collectionProduct.brandName || "Collection Product",
									vendor: {
										id: collectionProduct.owner?.email || "",
										name: collectionProduct.brandName || "Collection Product",
										email: collectionProduct.owner?.email || "",
										phone: collectionProduct.owner?.phoneNumber || "",
									},
									tags: [],
									createdAt:
										collectionProduct.createdAt?.toDate?.()?.toISOString() ||
										new Date().toISOString(),
									updatedAt:
										collectionProduct.updatedAt?.toDate?.()?.toISOString() ||
										new Date().toISOString(),
								} as Product;
							}
							return null;
						} else {
							// No prefix, treat as regular marketplace product
							return await productRepository.getByIdWithTailorInfo(
								productIdWithPrefix,
							);
						}
					} catch (productError) {
						console.warn(
							`Failed to load product ${productIdWithPrefix}:`,
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

				if (collectionProducts.length === 0) {
					toast.error("No products found in this collection");
					router.replace("/shops/cart");
					return;
				}

				// Add collection to cart
				const collectionName = collection.title || collection.name;
				console.log(
					"[CollectionCart] Adding collection to cart:",
					collectionName,
					"with",
					collectionProducts.length,
					"products",
				);
				await addCollectionToCart(
					collectionIdParam,
					collectionName,
					collectionProducts,
				);

				console.log("[CollectionCart] Collection added successfully");
				toast.success(`Added ${collectionName} to cart`);
				setHasCheckedRedirect(true);
			} catch (error: any) {
				console.error("Error loading collection:", error);
				const errorMessage = error?.message || "Failed to load collection";
				toast.error(errorMessage);
				router.replace("/shops/cart");
			} finally {
				setIsLoadingCollection(false);
			}
		};

		loadAndAddCollection();
	}, [
		authLoading,
		cartLoading,
		user,
		collectionIdParam,
		items.length,
		router,
		addCollectionToCart,
		hasTriedLoadingCollection,
	]);

	// Validate cart whenever items change
	useEffect(() => {
		if (collectionItems.length > 0 && collectionIdParam) {
			const validationResult = validateCollectionCart(collectionIdParam);
			setValidation(validationResult);
		} else {
			// Reset validation if no items
			setValidation({ isValid: false, missingSelections: [] });
		}
	}, [collectionItems.length, validateCollectionCart, collectionIdParam]);

	const handleSizeChange = useCallback(
		async (productId: string, size: string) => {
			try {
				await updateCollectionItemSelection(productId, size);
				toast.success("Size updated");
			} catch (error: any) {
				toast.error(error?.message || "Failed to update size");
			}
		},
		[updateCollectionItemSelection],
	);

	const handleColorChange = useCallback(
		async (productId: string, color: string) => {
			try {
				await updateCollectionItemSelection(productId, undefined, color);
				toast.success("Color updated");
			} catch (error: any) {
				toast.error(error?.message || "Failed to update color");
			}
		},
		[updateCollectionItemSelection],
	);

	const handleExemptItem = useCallback(
		async (productId: string) => {
			try {
				await exemptCollectionItem(productId);
				toast.success("Item exempted from order");
			} catch (error: any) {
				toast.error(error?.message || "Failed to exempt item");
			}
		},
		[exemptCollectionItem],
	);

	const handleRemoveCollection = useCallback(async () => {
		if (!collectionIdParam) return;
		if (
			confirm("Are you sure you want to remove this collection from your cart?")
		) {
			try {
				await removeCollection(collectionIdParam);
				toast.success("Collection removed from cart");
				router.push("/shops/cart");
			} catch (error: any) {
				toast.error(error?.message || "Failed to remove collection");
			}
		}
	}, [removeCollection, router, collectionIdParam]);

	const handleProceedToCheckout = useCallback(() => {
		if (!collectionIdParam) return;
		if (!validation.isValid) {
			const missingList = validation.missingSelections
				.map((m) => `${m.productName} (${m.missing.join(", ")})`)
				.join(", ");
			toast.error(`Please complete selections: ${missingList}`);
			return;
		}
		router.push(`/shops/checkout/collection?collectionId=${collectionIdParam}`);
	}, [validation, router, collectionIdParam]);

	// Show loading state while fetching collection
	if (
		isLoadingCollection ||
		((authLoading || cartLoading) && !hasTriedLoadingCollection)
	) {
		return (
			<div className="container-responsive py-12 sm:py-16 bg-white">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						{t.common.loading}
					</h1>
					<p className="text-gray-600">
						Please wait while we add the collection to your cart.
					</p>
				</div>
			</div>
		);
	}

	// Calculate totals for this collection only
	const activeItems = collectionItems.filter((item) => !item.isExempted);
	const exemptedItems = collectionItems.filter((item) => item.isExempted);
	const collectionTotalAmount = activeItems.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);

	if (!collectionIdParam || collectionItems.length === 0) {
		return (
			<div className="container-responsive py-12 sm:py-16 bg-white">
				<div className="text-center">
					<ShoppingBag size={64} className="mx-auto text-gray-300 mb-6" />
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						{t.cart.empty}
					</h1>
					<p className="text-gray-600 mb-8">{t.cart.discover}</p>
					<Link href="/shops">
						<span className="px-6 py-3 rounded-lg font-semibold transition-colors">
							{t.collection.shopCollection}
						</span>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="container-responsive py-6 sm:py-8 bg-white">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
							{t.cart.bundle}
						</span>
					</div>
					<h1 className="text-3xl font-bold text-gray-900">
						{collectionName || "Collection"}
					</h1>
					<p className="text-gray-600 mt-1">
						{activeItems.length}{" "}
						{activeItems.length !== 1 ? t.cart.items : t.cart.item}{" "}
						{t.cart.included.toLowerCase()}
					</p>
				</div>

				<div className="flex items-center gap-4">
					<button
						onClick={handleRemoveCollection}
						className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
					>
						<Trash2 size={16} />
						<span>{t.cart.remove} Collection</span>
					</button>
					<Link href="/shops">
						<span className="flex items-center space-x-2 text-primary-600 hover:text-primary-500">
							<ArrowLeft size={16} />
							<span>{t.cart.continueShopping}</span>
						</span>
					</Link>
				</div>
			</div>

			{/* Validation Errors */}
			{!validation.isValid && validation.missingSelections.length > 0 && (
				<div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
					<div className="flex items-start gap-3">
						<AlertCircle
							className="text-amber-600 flex-shrink-0 mt-0.5"
							size={20}
						/>
						<div className="flex-1">
							<h3 className="font-semibold text-amber-900 mb-2">
								Complete your selections
							</h3>
							<ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
								{validation.missingSelections.map((missing, index) => (
									<li key={index}>
										{missing.productName}: Please select{" "}
										{missing.missing.join(" and ")}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Collection Items */}
				<div className="lg:col-span-2">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200">
						<div className="p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-6">
								{t.cart.items}
							</h2>

							<div className="space-y-6">
								{collectionItems.map((item) => {
									if (item.isExempted) return null;

									const product = item.product;
									const needsSize =
										item.availableSizes && item.availableSizes.length > 0;
									const needsColor =
										item.availableColors && item.availableColors.length > 0;
									const isOutOfStock = product?.availability === "out_of_stock";

									return (
										<div
											key={item.product_id}
											className="flex space-x-4 py-6 border-b border-gray-100 last:border-b-0"
										>
											{/* Product Image */}
											<div className="relative w-24 h-24 flex-shrink-0">
												<SafeImage
													src={item.images[0] || "/placeholder-product.svg"}
													alt={item.title}
													fill
													className="object-cover rounded-lg"
													sizes={RESPONSIVE_SIZES.orderItem}
													placeholder="blur"
													blurDataURL={generateBlurDataURL(
														IMAGE_DIMENSIONS.orderItem.width,
														IMAGE_DIMENSIONS.orderItem.height,
													)}
													fallbackSrc="/placeholder-product.svg"
												/>
											</div>

											{/* Product Details */}
											<div className="flex-1 min-w-0">
												<div className="flex justify-between items-start">
													<div className="flex-1">
														<h3 className="text-lg font-medium text-gray-900">
															{item.title}
														</h3>
														<p className="text-sm text-gray-500 mt-1">
															{item.tailor}
														</p>

														{/* Size Selector */}
														{needsSize && (
															<div className="mt-4">
																<label className="block text-sm font-medium text-gray-700 mb-2">
																	{t.checkout.size}{" "}
																	<span className="text-red-500">*</span>
																</label>
																<select
																	value={item.size || ""}
																	onChange={(e) =>
																		handleSizeChange(
																			item.product_id,
																			e.target.value,
																		)
																	}
																	className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
																	required
																>
																	<option value="">
																		{t.productPage.selectSize}
																	</option>
																	{item.availableSizes?.map((size) => (
																		<option key={size} value={size}>
																			{size}
																		</option>
																	))}
																</select>
															</div>
														)}

														{/* Color Selector */}
														{needsColor && (
															<div className="mt-4">
																<label className="block text-sm font-medium text-gray-700 mb-2">
																	{t.checkout.color}{" "}
																	<span className="text-red-500">*</span>
																</label>
																<select
																	value={item.color || ""}
																	onChange={(e) =>
																		handleColorChange(
																			item.product_id,
																			e.target.value,
																		)
																	}
																	className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
																	required
																>
																	<option value="">
																		{t.productPage.selectColor}
																	</option>
																	{item.availableColors?.map((color) => (
																		<option key={color} value={color}>
																			{color}
																		</option>
																	))}
																</select>
															</div>
														)}

														{/* Selected Options Display */}
														{(item.size || item.color) && (
															<div className="mt-3 flex flex-wrap gap-2">
																{item.size && (
																	<span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
																		{t.checkout.size}: {item.size}
																	</span>
																)}
																{item.color && (
																	<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
																		{t.checkout.color}: {item.color}
																	</span>
																)}
															</div>
														)}
													</div>

													{/* Price and Remove Button */}
													<div className="flex flex-col items-end gap-2 ml-4">
														<p className="text-lg font-semibold text-gray-900">
															{formatPrice(item.price)}
														</p>
														<button
															onClick={async () => {
																if (confirm(t.cart.removeItemConfirm)) {
																	try {
																		await removeItem(item.product_id);
																		toast.success(t.cart.itemRemoved);
																		// If no items left in collection, redirect to cart
																		const remainingItems = getCollectionItems(
																			collectionIdParam || "",
																		);
																		if (remainingItems.length === 0) {
																			router.push("/shops/cart");
																		}
																	} catch (error: any) {
																		toast.error(
																			error?.message || t.common.error,
																		);
																	}
																}
															}}
															className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
															title={t.cart.remove}
														>
															<Trash2 size={16} />
														</button>
													</div>
												</div>

												{/* Out of Stock Option */}
												{isOutOfStock && (
													<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-2">
																<AlertCircle
																	className="text-red-600"
																	size={16}
																/>
																<span className="text-sm text-red-800">
																	This item is out of stock
																</span>
															</div>
															<button
																onClick={() =>
																	handleExemptItem(item.product_id)
																}
																className="text-sm text-red-600 hover:text-red-700 underline"
															>
																Exempt from order
															</button>
														</div>
													</div>
												)}
											</div>
										</div>
									);
								})}

								{/* Exempted Items Section */}
								{exemptedItems.length > 0 && (
									<div className="mt-8 pt-6 border-t border-gray-200">
										<h3 className="text-sm font-semibold text-gray-500 mb-4">
											Exempted Items
										</h3>
										<div className="space-y-4">
											{exemptedItems.map((item) => (
												<div
													key={item.product_id}
													className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-60"
												>
													<div className="relative w-16 h-16 flex-shrink-0">
														<SafeImage
															src={item.images[0] || "/placeholder-product.svg"}
															alt={item.title}
															fill
															className="object-cover rounded"
															sizes={RESPONSIVE_SIZES.orderItem}
															fallbackSrc="/placeholder-product.svg"
														/>
													</div>
													<div className="flex-1">
														<p className="text-sm font-medium text-gray-700 line-through">
															{item.title}
														</p>
														<p className="text-xs text-gray-500">
															Exempted from order
														</p>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Order Summary */}
				<div className="lg:col-span-1">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							{t.checkout.orderSummary}
						</h2>

						<div className="space-y-3 mb-6">
							<div className="flex justify-between">
								<span className="text-gray-600">
									{t.cart.subtotal} ({activeItems.length}{" "}
									{activeItems.length !== 1 ? t.cart.items : t.cart.item})
								</span>
								<span className="font-medium">
									{formatPrice(collectionTotalAmount)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">{t.cart.shipping}</span>
								<span className="font-medium text-gray-500">
									{t.cart.shippingAtCheckout}
								</span>
							</div>
							{exemptedItems.length > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-gray-500">Exempted items</span>
									<span className="text-gray-500">{exemptedItems.length}</span>
								</div>
							)}
							<div className="border-t pt-3">
								<div className="flex justify-between">
									<span className="text-lg font-semibold text-gray-900">
										{t.cart.subtotal}
									</span>
									<span className="text-lg font-bold text-gray-900">
										{formatPrice(collectionTotalAmount)}
									</span>
								</div>
								<p className="text-sm text-gray-500 mt-2">
									{t.checkout.shippingNote}
								</p>
							</div>
						</div>

						<button
							onClick={handleProceedToCheckout}
							disabled={!validation.isValid}
							className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
								validation.isValid
									? "bg-primary-600 text-white hover:bg-primary-700"
									: "bg-gray-300 text-gray-500 cursor-not-allowed"
							}`}
						>
							{validation.isValid ? (
								t.cart.checkout
							) : (
								<span className="flex items-center justify-center gap-2">
									<AlertCircle size={16} />
									{t.checkout.missingInfo}
								</span>
							)}
						</button>

						{validation.isValid && (
							<div className="mt-3 flex items-center gap-2 text-sm text-green-600">
								<CheckCircle2 size={16} />
								<span>All selections complete</span>
							</div>
						)}

						<div className="mt-4 text-center">
							<p className="text-xs text-gray-500">
								Secure checkout powered by Flutterwave
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function CollectionCartPage() {
	return (
		<Suspense
			fallback={
				<div className="container-responsive py-12 sm:py-16 bg-white">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
						<h1 className="text-2xl font-bold text-gray-900 mb-4">
							Loading collection...
						</h1>
						<p className="text-gray-600">
							Please wait while we load your collection cart.
						</p>
					</div>
				</div>
			}
		>
			<CollectionCartPageContent />
		</Suspense>
	);
}
