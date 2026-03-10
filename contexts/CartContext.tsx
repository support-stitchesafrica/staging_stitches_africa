"use client";

import React, {
	createContext,
	useContext,
	useReducer,
	useEffect,
	useCallback,
	useMemo,
} from "react";
import { CartItem, Product } from "@/types";
import { useAuth } from "./AuthContext";
import { cartRepository } from "@/lib/firestore";
import { loadModuleWithRetry } from "@/lib/utils/module-helpers";
import HMRErrorBoundary from "@/components/shops/error-boundaries/HMRErrorBoundary";
import { FreeProductSelectionModal } from "@/components/bogo/FreeProductSelectionModal";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { BogoCartService, bogoCartService } from "@/lib/bogo/cart-service";
import {
	calculateCustomerPrice,
	calculateFinalPrice,
	calculateDutyAmount,
	getEffectiveDutyRate,
	DUTY_RATE,
	calculatePlatformCommission,
	PLATFORM_COMMISSION_RATE,
} from "@/lib/priceUtils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { calculateCartShipping } from "@/lib/utils/shipping-utils";
import { currencyService } from "@/lib/services/currencyService";

// BogoCartService is a singleton, use the exported instance
// const bogoCartService = new BogoCartService(); // Private constructor

interface CartState {
	items: CartItem[];
	totalAmount: number;
	itemCount: number;
	shippingCost: number;
	totalWithShipping: number;
	loading: boolean;
	cartType: "regular" | "collection" | "mixed" | null;
	collections: Map<
		string,
		{ id: string; name: string; itemCount: number; totalAmount: number }
	>; // Track multiple collections
	// BOGO state
	showFreeProductModal: boolean;
	freeProductModalData: {
		mainProductId: string;
		mainProductName: string;
		freeProducts: Array<{
			productId: string;
			name: string;
			thumbnail: string;
			availability: "in_stock" | "low_stock" | "out_of_stock";
			description?: string;
			originalPrice?: number;
		}>;
	} | null;
	// Coupon state (optional - primarily managed at checkout)
	appliedCouponCode: string | null;
	couponDiscount: number;
}

type CartAction =
	| { type: "SET_LOADING"; payload: boolean }
	| { type: "SET_CART"; payload: CartItem[] }
	| { type: "ADD_ITEM"; payload: CartItem }
	| {
			type: "UPDATE_ITEM";
			payload: {
				productId: string;
				quantity: number;
				size?: string;
				color?: string;
			};
	  }
	| { type: "REMOVE_ITEM"; payload: string }
	| { type: "REMOVE_BOGO_PAIR"; payload: string[] } // Remove multiple items (BOGO pair)
	| { type: "CLEAR_CART" }
	| {
			type: "ADD_COLLECTION";
			payload: {
				items: CartItem[];
				collectionId: string;
				collectionName: string;
			};
	  }
	| { type: "REMOVE_COLLECTION"; payload?: { collectionId: string } }
	| {
			type: "UPDATE_COLLECTION_ITEM";
			payload: { productId: string; size?: string; color?: string };
	  }
	| { type: "EXEMPT_COLLECTION_ITEM"; payload: string }
	| { type: "ADD_BOGO_ITEM"; payload: CartItem }
	| { type: "REMOVE_BOGO_PAIR"; payload: string }
	| {
			type: "UPDATE_BOGO_QUANTITY";
			payload: { mainProductId: string; quantity: number };
	  }
	| {
			type: "SHOW_FREE_PRODUCT_MODAL";
			payload: {
				mainProductId: string;
				mainProductName: string;
				freeProducts: Array<{
					productId: string;
					name: string;
					thumbnail: string;
					availability: "in_stock" | "low_stock" | "out_of_stock";
					description?: string;
					originalPrice?: number;
				}>;
			};
	  }
	| { type: "HIDE_FREE_PRODUCT_MODAL" }
	| { type: "CLEANUP_EXPIRED_BOGO"; payload: string[] }
	| { type: "APPLY_COUPON"; payload: { code: string; discount: number } }
	| { type: "REMOVE_COUPON" };

interface CartContextType extends CartState {
	addItem: (
		product: Product,
		quantity: number,
		selectedOptions?: Record<string, string>,
	) => void;
	updateItemQuantity: (productId: string, quantity: number) => void;
	removeItem: (productId: string) => void;
	clearCart: () => void;
	getItemQuantity: (productId: string) => number;
	// Promotional product methods
	addPromotionalProduct: (
		product: Product,
		quantity: number,
		eventId: string,
		eventName: string,
		discountPercentage: number,
		promotionalEndDate: Date,
	) => void;
	// Collection cart methods
	addCollectionToCart: (
		collectionId: string,
		collectionName: string,
		products: Product[],
	) => void;
	addIndividualItemToCart: (
		product: Product,
		individualItem: any,
		selectedOptions?: { size?: string; color?: string },
	) => void;
	removeCollection: (collectionId?: string) => void; // Remove specific collection or all if no ID
	updateCollectionItemSelection: (
		productId: string,
		size?: string,
		color?: string,
	) => void;
	exemptCollectionItem: (productId: string) => void;
	validateCollectionCart: (collectionId?: string) => {
		isValid: boolean;
		missingSelections: Array<{
			productId: string;
			productName: string;
			missing: string[];
		}>;
	};
	isCollectionCart: () => boolean;
	getCollectionItems: (collectionId: string) => CartItem[];
	getRegularItems: () => CartItem[];
	getCollectionSummary: (
		collectionId: string,
	) => { name: string; itemCount: number; totalAmount: number } | null;
	getAllCollections: () => Array<{
		id: string;
		name: string;
		itemCount: number;
		totalAmount: number;
	}>;
	// BOGO methods
	addItemWithBogo: (
		product: Product,
		quantity: number,
		selectedOptions?: Record<string, string>,
	) => Promise<void>;
	handleFreeProductSelection: (
		mainProductId: string,
		freeProductId: string,
	) => Promise<void>;
	removeBogoPair: (mainProductId: string) => Promise<void>;
	updateBogoQuantity: (
		mainProductId: string,
		quantity: number,
	) => Promise<void>;
	calculateBogoShipping: (items?: CartItem[]) => number;
	validateBogoCart: () => Promise<{ isValid: boolean; errors: string[] }>;
	cleanupExpiredBogoItems: () => Promise<void>;
	getBogoCartSummary: () => {
		hasBogoItems: boolean;
		bogoSavings: number;
		freeShipping: boolean;
		bogoItemsCount: number;
	};
	// BOGO UI state
	showFreeProductModal: boolean;
	freeProductModalData: {
		mainProductId: string;
		mainProductName: string;
		freeProducts: Array<{
			productId: string;
			name: string;
			thumbnail: string;
			availability: "in_stock" | "low_stock" | "out_of_stock";
			description?: string;
			originalPrice?: number;
		}>;
	} | null;
	setShowFreeProductModal: (show: boolean) => void;
	// Storefront integration
	mergeStorefrontCart: (storefrontItems: CartItem[]) => Promise<void>;
	// Coupon methods (optional - primarily managed at checkout)
	applyCoupon: (code: string, discount: number) => void;
	removeCoupon: () => void;
	getTotalWithCoupon: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
	switch (action.type) {
		case "SET_LOADING":
			return { ...state, loading: action.payload };

		case "SET_CART": {
			// Deduplicate items by product_id, size, and color combination
			// Keep the item with the most recent updatedAt or the one with an id (from Firebase)
			const deduplicatedItems = action.payload.reduce(
				(acc: CartItem[], item: CartItem) => {
					const itemKey = `${item.product_id}-${item.size || "no-size"}-${
						item.color || "no-color"
					}-${item.individualItemId || "no-individual-id"}`;
					const existingIndex = acc.findIndex((existing) => {
						const existingKey = `${existing.product_id}-${
							existing.size || "no-size"
						}-${existing.color || "no-color"}-${
							existing.individualItemId || "no-individual-id"
						}`;
						return existingKey === itemKey;
					});

					if (existingIndex === -1) {
						// Item doesn't exist, add it
						acc.push(item);
					} else {
						// Item exists, keep the one with an id (from Firebase) or the more recent one
						const existing = acc[existingIndex];
						if (item.id && !existing.id) {
							// New item has id (from Firebase), replace
							acc[existingIndex] = item;
						} else if (!item.id && existing.id) {
							// Existing has id, keep it
							// Do nothing
						} else {
							// Both or neither have id, keep the one with higher quantity or more recent
							const itemDate =
								item.updatedAt instanceof Date
									? item.updatedAt
									: new Date(item.updatedAt);
							const existingDate =
								existing.updatedAt instanceof Date
									? existing.updatedAt
									: new Date(existing.updatedAt);
							if (
								itemDate > existingDate ||
								(itemDate.getTime() === existingDate.getTime() &&
									item.quantity > existing.quantity)
							) {
								acc[existingIndex] = item;
							}
						}
					}
					return acc;
				},
				[],
			);

			const totalAmount = deduplicatedItems.reduce(
				(sum, item) => sum + (item.isExempted ? 0 : item.price * item.quantity),
				0,
			);
			const itemCount = deduplicatedItems.reduce(
				(sum, item) => sum + (item.isExempted ? 0 : item.quantity),
				0,
			);
			const shippingCost = bogoCartService.calculateShippingWithBogo(
				deduplicatedItems.filter((item) => !item.isExempted),
			);
			const totalWithShipping = totalAmount + shippingCost;

			// Determine cart type from items
			const hasCollectionItems = deduplicatedItems.some(
				(item) => item.isCollectionItem,
			);
			const hasRegularItems = deduplicatedItems.some(
				(item) => !item.isCollectionItem,
			);
			const cartType =
				hasCollectionItems && hasRegularItems
					? "mixed"
					: hasCollectionItems
						? "collection"
						: deduplicatedItems.length > 0
							? "regular"
							: null;

			// Build collections map
			const collections = new Map<
				string,
				{ id: string; name: string; itemCount: number; totalAmount: number }
			>();
			deduplicatedItems.forEach((item) => {
				if (item.isCollectionItem && item.collectionId && !item.isExempted) {
					const existing = collections.get(item.collectionId);
					if (existing) {
						existing.itemCount += item.quantity;
						existing.totalAmount += item.price * item.quantity;
					} else {
						collections.set(item.collectionId, {
							id: item.collectionId,
							name: item.collectionName || "Collection",
							itemCount: item.quantity,
							totalAmount: item.price * item.quantity,
						});
					}
				}
			});

			return {
				...state,
				items: deduplicatedItems,
				totalAmount,
				itemCount,
				shippingCost,
				totalWithShipping,
				cartType,
				collections,
				loading: false,
			};
		}

		case "ADD_ITEM": {
			const existingItemIndex = state.items.findIndex(
				(item) =>
					item.product_id === action.payload.product_id &&
					item.size === action.payload.size &&
					item.color === action.payload.color &&
					!item.isCollectionItem && // Regular items only
					!item.isIndividualItem && // Individual items should always be separate
					!action.payload.isIndividualItem && // New item is not individual
					// For individual items, also match the individual item ID
					((!item.isIndividualItem && !action.payload.isIndividualItem) ||
						(item.isIndividualItem &&
							action.payload.isIndividualItem &&
							item.individualItemId === action.payload.individualItemId)),
			);

			let newItems: CartItem[];
			if (existingItemIndex >= 0 && !action.payload.isIndividualItem) {
				// Only combine quantities for non-individual items
				newItems = state.items.map((item, index) =>
					index === existingItemIndex
						? { ...item, quantity: item.quantity + action.payload.quantity }
						: item,
				);
			} else {
				// Always add individual items as separate entries
				newItems = [...state.items, action.payload];
			}

			const newTotalAmount = newItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.price * i.quantity),
				0,
			);
			const newItemCount = newItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.quantity),
				0,
			);
			const newShippingCost = bogoCartService.calculateShippingWithBogo(
				newItems.filter((item) => !item.isExempted),
			);
			const newTotalWithShipping = newTotalAmount + newShippingCost;

			// Update cart type
			const hasCollectionItems = newItems.some((item) => item.isCollectionItem);
			const hasRegularItems = newItems.some((item) => !item.isCollectionItem);
			const newCartType =
				hasCollectionItems && hasRegularItems
					? "mixed"
					: hasCollectionItems
						? "collection"
						: newItems.length > 0
							? "regular"
							: null;

			// Update collections map
			const newCollections = new Map(state.collections);
			newItems.forEach((item) => {
				if (item.isCollectionItem && item.collectionId && !item.isExempted) {
					const existing = newCollections.get(item.collectionId);
					if (existing) {
						existing.itemCount = newItems
							.filter(
								(i) => i.collectionId === item.collectionId && !i.isExempted,
							)
							.reduce((sum, i) => sum + i.quantity, 0);
						existing.totalAmount = newItems
							.filter(
								(i) => i.collectionId === item.collectionId && !i.isExempted,
							)
							.reduce((sum, i) => sum + i.price * i.quantity, 0);
					}
				}
			});

			return {
				...state,
				items: newItems,
				totalAmount: newTotalAmount,
				itemCount: newItemCount,
				shippingCost: newShippingCost,
				totalWithShipping: newTotalWithShipping,
				cartType: newCartType,
				collections: newCollections,
			};
		}

		case "UPDATE_ITEM":
			const updatedItems = state.items
				.map((item) => {
					// For collection items, we need to be more specific to avoid updating wrong items
					if (item.isCollectionItem) {
						// Only update if it's the exact same item (same product_id, size, color, collectionId)
						if (
							item.product_id === action.payload.productId &&
							(item.size === action.payload.size ||
								(!item.size && !action.payload.size)) &&
							(item.color === action.payload.color ||
								(!item.color && !action.payload.color))
						) {
							return {
								...item,
								quantity: action.payload.quantity,
								updatedAt: new Date(),
							};
						}
						return item;
					} else if (item.isIndividualItem) {
						// For individual items, match by product_id and individualItemId
						if (item.product_id === action.payload.productId) {
							return {
								...item,
								quantity: action.payload.quantity,
								updatedAt: new Date(),
							};
						}
						return item;
					} else {
						// For regular items, update by product_id
						if (item.product_id === action.payload.productId) {
							return {
								...item,
								quantity: action.payload.quantity,
								updatedAt: new Date(),
							};
						}
						return item;
					}
				})
				.filter((item) => item.quantity > 0);

			const updatedTotalAmount = updatedItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.price * i.quantity),
				0,
			);
			const updatedItemCount = updatedItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.quantity),
				0,
			);
			const updatedShippingCost = bogoCartService.calculateShippingWithBogo(
				updatedItems.filter((item) => !item.isExempted),
			);
			const updatedTotalWithShipping = updatedTotalAmount + updatedShippingCost;

			// Update collections map for UPDATE_ITEM
			const updatedItemCollectionsMap = new Map(state.collections);
			updatedItems.forEach((item) => {
				if (item.isCollectionItem && item.collectionId && !item.isExempted) {
					const collectionItems = updatedItems.filter(
						(i) =>
							i.isCollectionItem &&
							i.collectionId === item.collectionId &&
							!i.isExempted,
					);
					const collectionTotal = collectionItems.reduce(
						(sum, i) => sum + i.price * i.quantity,
						0,
					);
					const collectionCount = collectionItems.reduce(
						(sum, i) => sum + i.quantity,
						0,
					);

					updatedItemCollectionsMap.set(item.collectionId, {
						id: item.collectionId,
						name: item.collectionName || "Collection",
						itemCount: collectionCount,
						totalAmount: collectionTotal,
					});
				}
			});

			return {
				...state,
				items: updatedItems,
				totalAmount: updatedTotalAmount,
				itemCount: updatedItemCount,
				shippingCost: updatedShippingCost,
				totalWithShipping: updatedTotalWithShipping,
				collections: updatedItemCollectionsMap,
			};

		case "REMOVE_ITEM": {
			// Handle individual items - action.payload might be in format "productId-individualItemId"
			let itemToRemove = state.items.find(
				(item) => item.product_id === action.payload,
			);

			// If not found, check for individual items
			if (!itemToRemove) {
				itemToRemove = state.items.find((item) => {
					if (item.isIndividualItem) {
						const combinedId = `${item.product_id}-${item.individualItemId}`;
						return combinedId === action.payload;
					}
					return false;
				});
			}

			// Allow removing individual collection items - users can now remove items from collections
			const filteredItems = state.items.filter((item) => {
				if (item.isIndividualItem) {
					const combinedId = `${item.product_id}-${item.individualItemId}`;
					return combinedId !== action.payload;
				}
				return item.product_id !== action.payload;
			});
			const filteredTotalAmount = filteredItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.price * i.quantity),
				0,
			);
			const filteredItemCount = filteredItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.quantity),
				0,
			);
			const filteredShippingCost = bogoCartService.calculateShippingWithBogo(
				filteredItems.filter((item) => !item.isExempted),
			);
			const filteredTotalWithShipping =
				filteredTotalAmount + filteredShippingCost;

			// Update cart type
			const hasCollectionItems = filteredItems.some((i) => i.isCollectionItem);
			const hasRegularItems = filteredItems.some((i) => !i.isCollectionItem);
			const filteredCartType =
				filteredItems.length === 0
					? null
					: hasCollectionItems && hasRegularItems
						? "mixed"
						: hasCollectionItems
							? "collection"
							: "regular";

			// Update collections map
			const filteredCollections = new Map<
				string,
				{ id: string; name: string; itemCount: number; totalAmount: number }
			>();
			filteredItems.forEach((item) => {
				if (item.isCollectionItem && item.collectionId && !item.isExempted) {
					const existing = filteredCollections.get(item.collectionId);
					if (existing) {
						existing.itemCount += item.quantity;
						existing.totalAmount += item.price * item.quantity;
					} else {
						filteredCollections.set(item.collectionId, {
							id: item.collectionId,
							name: item.collectionName || "Collection",
							itemCount: item.quantity,
							totalAmount: item.price * item.quantity,
						});
					}
				}
			});

			// Force state update by creating new object references
			return {
				...state,
				items: [...filteredItems],
				totalAmount: filteredTotalAmount,
				itemCount: filteredItemCount,
				shippingCost: filteredShippingCost,
				totalWithShipping: filteredTotalWithShipping,
				cartType: filteredCartType,
				collections: new Map(filteredCollections),
			};
		}

		case "REMOVE_BOGO_PAIR": {
			// Remove multiple items (for BOGO pairs - main + free products)
			const productIdsToRemove = action.payload;
			const filteredItems = state.items.filter(
				(item) => !productIdsToRemove.includes(item.product_id),
			);

			const filteredTotalAmount = filteredItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.price * i.quantity),
				0,
			);
			const filteredItemCount = filteredItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.quantity),
				0,
			);
			const filteredShippingCost = bogoCartService.calculateShippingWithBogo(
				filteredItems.filter((item) => !item.isExempted),
			);
			const filteredTotalWithShipping =
				filteredTotalAmount + filteredShippingCost;

			// Update cart type
			const hasCollectionItems = filteredItems.some((i) => i.isCollectionItem);
			const hasRegularItems = filteredItems.some((i) => !i.isCollectionItem);
			const filteredCartType =
				hasCollectionItems && hasRegularItems
					? "mixed"
					: hasCollectionItems
						? "collection"
						: hasRegularItems
							? "regular"
							: null;

			// Update collections
			const filteredCollections = new Map(state.collections);
			(Array.isArray(productIdsToRemove)
				? productIdsToRemove
				: [productIdsToRemove]
			).forEach((productId) => {
				const item = state.items.find((i) => i.product_id === productId);
				if (item?.isCollectionItem && item.collectionId) {
					const collectionItems = filteredItems.filter(
						(i) => i.collectionId === item.collectionId,
					);
					if (collectionItems.length === 0) {
						filteredCollections.delete(item.collectionId);
					} else {
						const summary = {
							id: item.collectionId,
							name: item.collectionName || "",
							itemCount: collectionItems.length,
							totalAmount: collectionItems.reduce(
								(sum, i) => sum + i.price * i.quantity,
								0,
							),
						};
						filteredCollections.set(item.collectionId, summary);
					}
				}
			});

			// Force state update by creating new object references
			return {
				...state,
				items: [...filteredItems],
				totalAmount: filteredTotalAmount,
				itemCount: filteredItemCount,
				shippingCost: filteredShippingCost,
				totalWithShipping: filteredTotalWithShipping,
				cartType: filteredCartType,
				collections: new Map(filteredCollections),
			};
		}

		case "CLEAR_CART":
			return {
				...state,
				items: [],
				totalAmount: 0,
				itemCount: 0,
				shippingCost: 0,
				totalWithShipping: 0,
				cartType: null,
				collections: new Map(),
			};

		case "ADD_COLLECTION": {
			let newItems = [...state.items];

			action.payload.items.forEach((newItem) => {
				// Check if item exists (by product_id, size, color, collectionId)
				const existingIndex = newItems.findIndex(
					(existing) =>
						existing.product_id === newItem.product_id &&
						existing.size === newItem.size &&
						existing.color === newItem.color &&
						existing.collectionId === action.payload.collectionId,
				);

				if (existingIndex >= 0) {
					// Update quantity
					newItems[existingIndex] = {
						...newItems[existingIndex],
						quantity: newItems[existingIndex].quantity + newItem.quantity,
						updatedAt: new Date(),
					};
				} else {
					// Add new item
					newItems.push({
						...newItem,
						isCollectionItem: true,
						collectionId: action.payload.collectionId,
						collectionName: action.payload.collectionName,
						isRemovable: true, // Ensure removable
						createdAt: new Date(),
						updatedAt: new Date(),
					});
				}
			});

			// Recalculate totals
			const totalAmount = newItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.price * i.quantity),
				0,
			);
			const itemCount = newItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.quantity),
				0,
			);
			const shippingCost = bogoCartService.calculateShippingWithBogo(
				newItems.filter((item) => !item.isExempted),
			);
			const totalWithShipping = totalAmount + shippingCost;

			// Update cart type
			const hasCollectionItems = newItems.some((item) => item.isCollectionItem);
			const hasRegularItems = newItems.some((item) => !item.isCollectionItem);
			const cartType =
				hasCollectionItems && hasRegularItems
					? "mixed"
					: hasCollectionItems
						? "collection"
						: newItems.length > 0
							? "regular"
							: null;

			// Update collections map
			const collections = new Map(state.collections);

			// Recalculate summary for the modified collection
			const targetItems = newItems.filter(
				(item) =>
					item.collectionId === action.payload.collectionId && !item.isExempted,
			);

			if (targetItems.length > 0) {
				const summary = {
					id: action.payload.collectionId,
					name: action.payload.collectionName,
					itemCount: targetItems.reduce((sum, item) => sum + item.quantity, 0),
					totalAmount: targetItems.reduce(
						(sum, item) => sum + item.price * item.quantity,
						0,
					),
				};
				collections.set(action.payload.collectionId, summary);
			}

			// Force state update by creating new object references
			return {
				...state,
				items: [...newItems],
				totalAmount,
				itemCount,
				shippingCost,
				totalWithShipping,
				cartType,
				collections: new Map(collections),
			};
		}

		case "REMOVE_COLLECTION": {
			// If collectionId provided, remove only that collection; otherwise remove all collections
			const collectionId = action.payload?.collectionId;
			const itemsAfterCollectionRemoval = collectionId
				? state.items.filter(
						(item) =>
							!item.isCollectionItem || item.collectionId !== collectionId,
					)
				: state.items.filter((item) => !item.isCollectionItem);

			const afterRemovalTotalAmount = itemsAfterCollectionRemoval.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.price * i.quantity),
				0,
			);
			const afterRemovalItemCount = itemsAfterCollectionRemoval.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.quantity),
				0,
			);
			const afterRemovalShippingCost = calculateCartShipping(
				itemsAfterCollectionRemoval.filter((item) => !item.isExempted),
			);
			const afterRemovalTotalWithShipping =
				afterRemovalTotalAmount + afterRemovalShippingCost;

			// Update cart type
			const hasCollectionItemsAfter = itemsAfterCollectionRemoval.some(
				(i) => i.isCollectionItem,
			);
			const hasRegularItemsAfter = itemsAfterCollectionRemoval.some(
				(i) => !i.isCollectionItem,
			);
			const afterRemovalCartType =
				itemsAfterCollectionRemoval.length === 0
					? null
					: hasCollectionItemsAfter && hasRegularItemsAfter
						? "mixed"
						: hasCollectionItemsAfter
							? "collection"
							: "regular";

			// Update collections map
			const afterRemovalCollections = new Map<
				string,
				{ id: string; name: string; itemCount: number; totalAmount: number }
			>();
			if (collectionId) {
				// Remove specific collection from map
				state.collections.forEach((collection, id) => {
					if (id !== collectionId) {
						afterRemovalCollections.set(id, collection);
					}
				});
			}
			// If no collectionId, map is already empty (all collections removed)

			return {
				...state,
				items: itemsAfterCollectionRemoval,
				totalAmount: afterRemovalTotalAmount,
				itemCount: afterRemovalItemCount,
				shippingCost: afterRemovalShippingCost,
				totalWithShipping: afterRemovalTotalWithShipping,
				cartType: afterRemovalCartType,
				collections: afterRemovalCollections,
			};
		}

		case "UPDATE_COLLECTION_ITEM":
			const updatedCollectionItems = state.items.map((item) =>
				item.product_id === action.payload.productId && item.isCollectionItem
					? {
							...item,
							size:
								action.payload.size !== undefined
									? action.payload.size
									: item.size,
							color:
								action.payload.color !== undefined
									? action.payload.color
									: item.color,
							updatedAt: new Date(),
						}
					: item,
			);

			const updatedCollectionTotalAmount = updatedCollectionItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.price * i.quantity),
				0,
			);
			const updatedCollectionItemCount = updatedCollectionItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.quantity),
				0,
			);
			const updatedCollectionShippingCost = calculateCartShipping(
				updatedCollectionItems.filter((item) => !item.isExempted),
			);
			const updatedCollectionTotalWithShipping =
				updatedCollectionTotalAmount + updatedCollectionShippingCost;

			// Update collections map
			const updatedCollectionsMap = new Map(state.collections);
			updatedCollectionItems.forEach((item) => {
				if (item.isCollectionItem && item.collectionId && !item.isExempted) {
					const collectionItems = updatedCollectionItems.filter(
						(i) =>
							i.isCollectionItem &&
							i.collectionId === item.collectionId &&
							!i.isExempted,
					);
					const collectionTotal = collectionItems.reduce(
						(sum, i) => sum + i.price * i.quantity,
						0,
					);
					const collectionCount = collectionItems.reduce(
						(sum, i) => sum + i.quantity,
						0,
					);

					updatedCollectionsMap.set(item.collectionId, {
						id: item.collectionId,
						name: item.collectionName || "Collection",
						itemCount: collectionCount,
						totalAmount: collectionTotal,
					});
				}
			});

			return {
				...state,
				items: updatedCollectionItems,
				totalAmount: updatedCollectionTotalAmount,
				itemCount: updatedCollectionItemCount,
				shippingCost: updatedCollectionShippingCost,
				totalWithShipping: updatedCollectionTotalWithShipping,
				collections: updatedCollectionsMap,
			};

		case "EXEMPT_COLLECTION_ITEM":
			const exemptedItems = state.items.map((item) =>
				item.product_id === action.payload && item.isCollectionItem
					? { ...item, isExempted: true, updatedAt: new Date() }
					: item,
			);

			const exemptedTotalAmount = exemptedItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.price * i.quantity),
				0,
			);
			const exemptedItemCount = exemptedItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.quantity),
				0,
			);
			const exemptedShippingCost = calculateCartShipping(
				exemptedItems.filter((item) => !item.isExempted),
			);
			const exemptedTotalWithShipping =
				exemptedTotalAmount + exemptedShippingCost;

			// Update collections map (recalculate for affected collection)
			const exemptedCollectionsMap = new Map(state.collections);
			const exemptedItem = state.items.find(
				(item) => item.product_id === action.payload,
			);
			if (exemptedItem?.collectionId) {
				const collectionItems = exemptedItems.filter(
					(i) =>
						i.isCollectionItem &&
						i.collectionId === exemptedItem.collectionId &&
						!i.isExempted,
				);
				const collectionTotal = collectionItems.reduce(
					(sum, i) => sum + i.price * i.quantity,
					0,
				);
				const collectionCount = collectionItems.reduce(
					(sum, i) => sum + i.quantity,
					0,
				);

				exemptedCollectionsMap.set(exemptedItem.collectionId, {
					id: exemptedItem.collectionId,
					name: exemptedItem.collectionName || "Collection",
					itemCount: collectionCount,
					totalAmount: collectionTotal,
				});
			}

			return {
				...state,
				items: exemptedItems,
				totalAmount: exemptedTotalAmount,
				itemCount: exemptedItemCount,
				shippingCost: exemptedShippingCost,
				totalWithShipping: exemptedTotalWithShipping,
				collections: exemptedCollectionsMap,
			};

		case "ADD_BOGO_ITEM": {
			const newBogoItems = [...state.items, action.payload];
			const newBogoTotalAmount = newBogoItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.price * i.quantity),
				0,
			);
			const newBogoItemCount = newBogoItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.quantity),
				0,
			);
			// BOGO items get free shipping
			const hasBogoItems = newBogoItems.some(
				(item) =>
					item.isBogoFree ||
					newBogoItems.some(
						(otherItem) => otherItem.bogoMainProductId === item.product_id,
					),
			);
			const newBogoShippingCost = hasBogoItems
				? 0
				: calculateCartShipping(
						newBogoItems.filter((item) => !item.isExempted),
					);
			const newBogoTotalWithShipping = newBogoTotalAmount + newBogoShippingCost;

			return {
				...state,
				items: newBogoItems,
				totalAmount: newBogoTotalAmount,
				itemCount: newBogoItemCount,
				shippingCost: newBogoShippingCost,
				totalWithShipping: newBogoTotalWithShipping,
			};
		}

		case "UPDATE_BOGO_QUANTITY": {
			const updatedBogoItems = state.items
				.map((item) => {
					// Update main product quantity
					if (item.product_id === action.payload.mainProductId) {
						return { ...item, quantity: action.payload.quantity };
					}
					// Update associated free product quantity (1:1 ratio)
					if (item.bogoMainProductId === action.payload.mainProductId) {
						return { ...item, quantity: action.payload.quantity };
					}
					return item;
				})
				.filter((item) => item.quantity > 0); // Remove items with 0 quantity

			const updatedBogoTotalAmount = updatedBogoItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.price * i.quantity),
				0,
			);
			const updatedBogoItemCount = updatedBogoItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.quantity),
				0,
			);
			const hasBogoItems = updatedBogoItems.some(
				(item) =>
					item.isBogoFree ||
					updatedBogoItems.some(
						(otherItem) => otherItem.bogoMainProductId === item.product_id,
					),
			);
			const updatedBogoShippingCost = hasBogoItems
				? 0
				: calculateCartShipping(
						updatedBogoItems.filter((item) => !item.isExempted),
					);
			const updatedBogoTotalWithShipping =
				updatedBogoTotalAmount + updatedBogoShippingCost;

			return {
				...state,
				items: updatedBogoItems,
				totalAmount: updatedBogoTotalAmount,
				itemCount: updatedBogoItemCount,
				shippingCost: updatedBogoShippingCost,
				totalWithShipping: updatedBogoTotalWithShipping,
			};
		}

		case "SHOW_FREE_PRODUCT_MODAL":
			return {
				...state,
				showFreeProductModal: true,
				freeProductModalData: action.payload,
			};

		case "HIDE_FREE_PRODUCT_MODAL":
			return {
				...state,
				showFreeProductModal: false,
				freeProductModalData: null,
			};

		case "CLEANUP_EXPIRED_BOGO": {
			const cleanedItems = state.items.filter(
				(item) => !action.payload.includes(item.product_id),
			);
			const cleanedTotalAmount = cleanedItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.price * i.quantity),
				0,
			);
			const cleanedItemCount = cleanedItems.reduce(
				(sum, i) => sum + (i.isExempted ? 0 : i.quantity),
				0,
			);
			const hasBogoItems = cleanedItems.some(
				(item) =>
					item.isBogoFree ||
					cleanedItems.some(
						(otherItem) => otherItem.bogoMainProductId === item.product_id,
					),
			);
			const cleanedShippingCost = hasBogoItems
				? 0
				: calculateCartShipping(
						cleanedItems.filter((item) => !item.isExempted),
					);
			const cleanedTotalWithShipping = cleanedTotalAmount + cleanedShippingCost;

			return {
				...state,
				items: cleanedItems,
				totalAmount: cleanedTotalAmount,
				itemCount: cleanedItemCount,
				shippingCost: cleanedShippingCost,
				totalWithShipping: cleanedTotalWithShipping,
			};
		}

		case "APPLY_COUPON": {
			// Note: Coupon discount is applied at checkout, not in cart
			// This is just for tracking purposes
			return {
				...state,
				appliedCouponCode: action.payload.code,
				couponDiscount: action.payload.discount,
			};
		}

		case "REMOVE_COUPON": {
			return {
				...state,
				appliedCouponCode: null,
				couponDiscount: 0,
			};
		}

		default:
			return state;
	}
};

const CartProviderComponent: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { user } = useAuth();
	// Get user country for duty exemption (Nigerian users are exempt)
	const { userCountry } = useCurrency();
	const [state, dispatch] = useReducer(cartReducer, {
		items: [],
		totalAmount: 0,
		itemCount: 0,
		shippingCost: 0,
		totalWithShipping: 0,
		loading: true,
		cartType: null,
		collections: new Map(),
		showFreeProductModal: false,
		freeProductModalData: null,
		appliedCouponCode: null,
		couponDiscount: 0,
	});
	// Helper function to deserialize cart items from localStorage
	const deserializeCartItems = (items: any[]): CartItem[] => {
		return items.map((item) => ({
			...item,
			createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
			updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
			promotionalEndDate: item.promotionalEndDate
				? new Date(item.promotionalEndDate)
				: undefined,
		}));
	};

	// Helper function to serialize cart items for localStorage
	const serializeCartItems = (items: CartItem[]): any[] => {
		return items.map((item) => {
			// Helper to safely convert Date to ISO string
			const toISOString = (
				date: Date | string | undefined,
			): string | undefined => {
				if (!date) return undefined;
				if (typeof date === "string") return date; // Already a string
				if (date instanceof Date) return date.toISOString();
				return undefined;
			};

			return {
				...item,
				createdAt:
					toISOString(item.createdAt as any) || new Date().toISOString(),
				updatedAt:
					toISOString(item.updatedAt as any) || new Date().toISOString(),
				promotionalEndDate: toISOString(item.promotionalEndDate as any),
			};
		});
	};

	// Migrate localStorage cart to Firebase when user logs in
	const migrateLocalCartToFirebase = useCallback(
		async (userId: string, localCartItems: CartItem[]) => {
			if (localCartItems.length === 0) return;

			try {
				console.log(
					`[CartContext] Migrating ${localCartItems.length} items from localStorage to Firebase`,
				);

				// Get existing Firebase cart to avoid duplicates
				const existingCartItems = await cartRepository.getByUserId(userId);

				// Create a set of existing items by product_id, size, and color combination
				// This ensures we don't duplicate items with the same variant
				const existingItemKeys = new Set(
					existingCartItems.map(
						(item) =>
							`${item.product_id}-${item.size || "no-size"}-${
								item.color || "no-color"
							}`,
					),
				);

				let migratedCount = 0;
				// Migrate items that don't already exist in Firebase cart
				for (const item of localCartItems) {
					const itemKey = `${item.product_id}-${item.size || "no-size"}-${
						item.color || "no-color"
					}`;

					// Skip if item already exists in Firebase cart
					if (existingItemKeys.has(itemKey)) {
						console.log(`[CartContext] Skipping duplicate item: ${itemKey}`);
						continue;
					}

					// Prepare item for Firebase (remove id and user_id if present, Firebase will generate new one)
					const { id, user_id, createdAt, updatedAt, ...itemWithoutId } = item;
					await cartRepository.addItem(userId, itemWithoutId);
					migratedCount++;
				}

				// Clear localStorage after successful migration
				localStorage.removeItem("cart");
				console.log(
					`[CartContext] Cart migration completed: ${migratedCount} items migrated, ${
						localCartItems.length - migratedCount
					} duplicates skipped`,
				);
			} catch (error) {
				console.error("[CartContext] Error migrating cart to Firebase:", error);
				// Don't throw - allow user to continue with their cart
			}
		},
		[],
	);

	const loadCart = useCallback(async () => {
		dispatch({ type: "SET_LOADING", payload: true });
		try {
			if (user) {
				// Check if user is an admin - admins don't have carts
				// This prevents permission errors when admins try to access cart
				try {
					const { doc, getDoc } = await import("firebase/firestore");
					const { db } = await import("@/firebase");
					const adminDoc = await getDoc(doc(db, "staging_admins", user.uid));
					if (adminDoc.exists()) {
						const adminData = adminDoc.data();
						if (
							adminData?.role === "admin" ||
							adminData?.role === "superadmin"
						) {
							console.log("[CartContext] User is an admin, skipping cart load");
							dispatch({ type: "SET_CART", payload: [] });
							dispatch({ type: "SET_LOADING", payload: false });
							return;
						}
					}
				} catch (adminError: any) {
					// If admin check fails with permission error, user might be admin but rules not deployed
					// Skip cart load to avoid permission error
					if (
						adminError?.code === "permission-denied" ||
						adminError?.message?.includes("permission") ||
						adminError?.message?.includes("insufficient permissions")
					) {
						console.log(
							"[CartContext] Admin check permission denied - user may be admin, skipping cart load",
						);
						dispatch({ type: "SET_CART", payload: [] });
						dispatch({ type: "SET_LOADING", payload: false });
						return;
					}
					// For other errors, continue with Collections check
					console.log(
						"[CartContext] Admin check failed (non-critical), continuing with normal flow",
					);
				}

				// Check if user is a Collections user - Collections users don't have carts
				// This prevents permission errors when Collections users try to access cart
				try {
					const { CollectionsAuthService } =
						await import("@/lib/collections/auth-service");
					const isCollectionsUser =
						await CollectionsAuthService.validateCollectionsAccess(user.uid);
					if (isCollectionsUser) {
						console.log(
							"[CartContext] User is a Collections user, skipping cart load",
						);
						dispatch({ type: "SET_CART", payload: [] });
						dispatch({ type: "SET_LOADING", payload: false });
						return;
					}
				} catch (error) {
					// If check fails (e.g., permission error), assume user is not a Collections user
					// and continue with normal flow - errors will be handled by try/catch below
					console.log(
						"[CartContext] Collections user check failed (non-critical), continuing with normal flow",
					);
				}

				// Check for localStorage cart to migrate (only once per login)
				const savedCart = localStorage.getItem("cart");
				if (savedCart) {
					try {
						const localCartItems = deserializeCartItems(JSON.parse(savedCart));
						// Migrate localStorage cart to Firebase
						await migrateLocalCartToFirebase(user.uid, localCartItems);
						// Clear localStorage immediately after migration to prevent re-migration
						// (migrateLocalCartToFirebase also clears it, but this is a safety measure)
						localStorage.removeItem("cart");
					} catch (migrationError) {
						console.error(
							"[CartContext] Error during cart migration:",
							migrationError,
						);
						// Even if migration fails, clear localStorage to prevent infinite retries
						// User can still see their Firebase cart
						localStorage.removeItem("cart");
					}
				}

				// Always load from Firebase after migration attempt (or if no migration needed)
				try {
					const cartItems = await cartRepository.getByUserId(user.uid);
					dispatch({ type: "SET_CART", payload: cartItems });

					// Check for storefront cart items to merge
					try {
						const { StorefrontCartSyncService } =
							await import("@/lib/storefront/cart-sync-service");
						await StorefrontCartSyncService.autoMergeStorefrontCart(
							async (storefrontItems) => {
								// Add storefront items to existing cart
								for (const item of storefrontItems) {
									dispatch({ type: "ADD_ITEM", payload: item });
									await cartRepository.addItem(user.uid, item);
								}
							},
						);
					} catch (syncError) {
						console.warn(
							"[CartContext] Storefront cart sync failed:",
							syncError,
						);
					}
				} catch (cartError) {
					// If cart load fails, it might be a permission issue for Collections users
					// or other reasons - just log and set empty cart
					console.warn(
						"[CartContext] Failed to load cart, setting empty cart",
						cartError,
					);
					dispatch({ type: "SET_CART", payload: [] });
				}
			} else {
				const savedCart = localStorage.getItem("cart");
				if (savedCart) {
					try {
						const localCartItems = deserializeCartItems(JSON.parse(savedCart));
						dispatch({ type: "SET_CART", payload: localCartItems });
					} catch (error) {
						console.error(
							"[CartContext] Error parsing localStorage cart:",
							error,
						);
						dispatch({ type: "SET_CART", payload: [] });
					}
				} else {
					dispatch({ type: "SET_CART", payload: [] });
				}
			}
		} catch (error) {
			console.error("Error loading cart:", error);
			dispatch({ type: "SET_CART", payload: [] });
		} finally {
			dispatch({ type: "SET_LOADING", payload: false });
		}
	}, [user, migrateLocalCartToFirebase]);

	const saveCart = useCallback(async () => {
		try {
			if (!user) {
				// Serialize cart items for localStorage (convert dates to ISO strings)
				const serializedItems = serializeCartItems(state.items);
				localStorage.setItem("cart", JSON.stringify(serializedItems));
			}
		} catch (error) {
			console.error("Error saving cart:", error);
		}
	}, [user, state.items]);
	useEffect(() => {
		loadCart();
	}, [user, loadCart]);

	useEffect(() => {
		if (!state.loading) saveCart();
	}, [state.items, user, state.loading, saveCart]);

	// Listen for cart updates from AI Assistant
	useEffect(() => {
		const handleCartUpdate = () => {
			console.log(
				"[CartContext] Cart updated event received, reloading cart...",
			);
			loadCart();
		};

		window.addEventListener("cart-updated", handleCartUpdate);

		return () => {
			window.removeEventListener("cart-updated", handleCartUpdate);
		};
	}, [loadCart]);

	const addItem = useCallback(
		async (
			product: Product,
			quantity: number,
			selectedOptions?: Record<string, string>,
		) => {
			// Allow adding regular items even when collections exist (mixed cart)

			const basePrice =
				typeof product.price === "number" ? product.price : product.price.base;
			const productCurrency =
				typeof product.price === "object" ? product.price.currency : "USD";

			// Convert to USD using real-time rates (cart stores everything in USD)
			// Using currencyService ensures we use consistent rates with the display logic
			const conversionResult = await currencyService.convertPrice(
				basePrice,
				productCurrency,
				"USD",
				false, // Skip rounding for high precision in cart
			);
			const priceInUSD = conversionResult.convertedPrice;

			const originalPrice = priceInUSD;
			const discountPercentage = product.discount || 0;

			// Calculate final price with duty (exempt for Nigerian users)
			// Explicitly using PLATFORM_COMMISSION_RATE to ensure it's added
			// Formula: Original * (1 - Discount) * (1 + Duty + Commission)
			const price = calculateFinalPrice(
				originalPrice,
				discountPercentage,
				userCountry,
			);
			const dutyCharge = calculateDutyAmount(
				originalPrice,
				discountPercentage,
				userCountry,
			);
			const platform_commission = calculatePlatformCommission(
				originalPrice,
				discountPercentage,
			);

			const cartItem: CartItem = {
				product_id: product.product_id,
				title: product.title,
				description: product.description,
				platform_commission, // Add platform commission
				price, // Duty-inclusive (or not if Nigeria)
				originalPrice, // Always in USD
				dutyCharge,
				discount: product.discount,
				quantity,
				color: selectedOptions?.color || null,
				size: selectedOptions?.size || null,
				sizes: null,
				images: product.images,
				tailor_id: product.tailor_id,
				tailor: product.tailor || product.vendor?.name || "",
				user_id: user?.uid || "",
				createdAt: new Date(),
				updatedAt: new Date(),
				isCollectionItem: false,
				isRemovable: true,
				sourcePrice: calculateFinalPrice(
					basePrice,
					discountPercentage,
					userCountry,
				), // Store original price with commission
				sourceCurrency: productCurrency, // Store original currency
				sourcePlatformCommission: calculatePlatformCommission(
					basePrice,
					discountPercentage,
				), // Platform commission in source currency
				sourceOriginalPrice: basePrice, // Original vendor price in source currency
			};

			dispatch({ type: "ADD_ITEM", payload: cartItem });

			if (user) {
				await cartRepository.addItem(user.uid, cartItem);
			} else {
				// Save to localStorage for unauthenticated users
				// Note: state.items will be updated by reducer, but we need to get the updated state
				// For now, we'll rely on the saveCart effect to handle this
			}
		},
		[user, userCountry],
	);

	const addPromotionalProduct = useCallback(
		async (
			product: Product,
			quantity: number,
			eventId: string,
			eventName: string,
			discountPercentage: number,
			promotionalEndDate: Date,
		) => {
			const basePrice =
				typeof product.price === "number" ? product.price : product.price.base;

			const productCurrency =
				typeof product.price === "object" ? product.price.currency : "USD";

			// Convert to USD using real-time rates
			const conversionResult = await currencyService.convertPrice(
				basePrice,
				productCurrency,
				"USD",
				false, // Skip rounding for high precision in cart
			);
			const priceInUSD = conversionResult.convertedPrice;

			// Get current price after applying existing product discount (if any)
			const existingDiscount = product.discount || product.price?.discount || 0;
			const currentPrice =
				existingDiscount > 0
					? priceInUSD * (1 - existingDiscount / 100)
					: priceInUSD;

			// Apply promotional discount on top of current price
			const priceAfterDiscount = currentPrice * (1 - discountPercentage / 100);

			// Add duty charge and commission to the final discounted price (exempt for Nigerian users)
			const effectiveDutyRate = getEffectiveDutyRate(userCountry);
			const dutyCharge = priceAfterDiscount * effectiveDutyRate;
			const platform_commission = priceAfterDiscount * PLATFORM_COMMISSION_RATE;
			const priceWithDuty =
				priceAfterDiscount * (1 + effectiveDutyRate + PLATFORM_COMMISSION_RATE);

			// const roundedPrice = Math.round(priceWithDuty * 100) / 100;
			const roundedPrice = priceWithDuty; // Use exact price for cart

			const cartItem: CartItem = {
				product_id: product.product_id,
				title: product.title,
				description: product.description,
				platform_commission,
				price: roundedPrice, // Final discounted price with duty + commission
				discount: product.discount || 0, // Keep existing discount for reference
				quantity,
				color: null,
				size: null,
				sizes: null,
				images: product.images,
				tailor_id: product.tailor_id,
				tailor: product.tailor || product.vendor?.name || "",
				user_id: user?.uid || "",
				createdAt: new Date(),
				updatedAt: new Date(),
				isCollectionItem: false,
				isRemovable: true,
				sourcePrice: calculateFinalPrice(
					basePrice,
					discountPercentage,
					userCountry,
				), // Store original price with commission
				sourceCurrency: productCurrency, // Store original currency
				sourcePlatformCommission: calculatePlatformCommission(
					basePrice,
					discountPercentage,
				), // Platform commission in source currency
				sourceOriginalPrice: basePrice, // Original vendor price in source currency
				// Promotional fields
				isPromotional: true,
				promotionalEventId: eventId,
				promotionalEventName: eventName,
				originalPrice: priceInUSD,
				dutyCharge: dutyCharge,
				discountPercentage: discountPercentage,
				discountedPrice: roundedPrice,
				promotionalEndDate: promotionalEndDate,
			};

			dispatch({ type: "ADD_ITEM", payload: cartItem });

			if (user) {
				await cartRepository.addItem(user.uid, cartItem);
			}
			// Note: For unauthenticated users, saveCart effect will handle localStorage save
		},
		[user, userCountry],
	);

	const updateItemQuantity = useCallback(
		async (
			productId: string,
			quantity: number,
			size?: string,
			color?: string,
		) => {
			// Handle individual items - productId might be in format "productId-individualItemId"
			let actualProductId = productId;
			let individualItemId: string | undefined;

			// Check if this is an individual item identifier
			const item = state.items.find((i) => {
				if (i.isIndividualItem) {
					const combinedId = `${i.product_id}-${i.individualItemId}`;
					return combinedId === productId;
				}
				return i.product_id === productId;
			});

			if (item?.isIndividualItem) {
				actualProductId = item.product_id;
				individualItemId = item.individualItemId;
			}

			dispatch({
				type: "UPDATE_ITEM",
				payload: { productId: actualProductId, quantity, size, color },
			});

			if (user && item?.id) {
				await cartRepository.updateItem(user.uid, item.id, { quantity });
			}
			// Note: For unauthenticated users, saveCart effect will handle localStorage save
		},
		[user, state.items],
	);

	const removeItem = useCallback(
		async (productId: string) => {
			// Handle individual items - productId might be in format "productId-individualItemId"
			let actualProductId = productId;
			let targetItem = state.items.find((i) => i.product_id === productId);

			// Check if this is an individual item identifier
			if (!targetItem) {
				targetItem = state.items.find((i) => {
					if (i.isIndividualItem) {
						const combinedId = `${i.product_id}-${i.individualItemId}`;
						return combinedId === productId;
					}
					return false;
				});

				if (targetItem) {
					actualProductId = targetItem.product_id;
				}
			}

			// Check if this is a BOGO main product or free product
			const isBOGOMainProduct = state.items.some(
				(i) => i.bogoMainProductId === actualProductId,
			);
			const isBOGOFreeProduct = targetItem?.isBogoFree;

			if (isBOGOMainProduct) {
				// This is a BOGO main product - remove the pair
				const bogoResult = await bogoCartService.removeBogoPair(
					productId,
					state.items,
				);

				if (bogoResult.success && bogoResult.itemsToRemove) {
					// Remove all items in the BOGO pair
					dispatch({
						type: "REMOVE_BOGO_PAIR",
						payload: bogoResult.itemsToRemove,
					});

					if (user) {
						// Remove all items from Firestore using removeItemsByProduct
						for (const itemId of bogoResult.itemsToRemove) {
							const cartItem = state.items.find((i) => i.product_id === itemId);
							if (cartItem) {
								try {
									await cartRepository.removeItemsByProduct(
										user.uid,
										cartItem.product_id,
										{
											size: cartItem.size,
											color: cartItem.color,
											individualItemId: cartItem.individualItemId,
										},
									);
								} catch (error) {
									console.error(
										`Error removing BOGO item ${itemId} from Firestore:`,
										error,
									);
								}
							}
						}
					}
				}
			} else if (isBOGOFreeProduct) {
				// This is a free BOGO product - remove the whole pair
				const mainProductId = targetItem?.bogoMainProductId;
				if (mainProductId) {
					const bogoResult = await bogoCartService.removeBogoPair(
						mainProductId,
						state.items,
					);

					if (bogoResult.success && bogoResult.itemsToRemove) {
						dispatch({
							type: "REMOVE_BOGO_PAIR",
							payload: bogoResult.itemsToRemove,
						});

						if (user) {
							for (const itemId of bogoResult.itemsToRemove) {
								const cartItem = state.items.find(
									(i) => i.product_id === itemId,
								);
								if (cartItem) {
									try {
										await cartRepository.removeItemsByProduct(
											user.uid,
											cartItem.product_id,
											{
												size: cartItem.size,
												color: cartItem.color,
												individualItemId: cartItem.individualItemId,
											},
										);
									} catch (error) {
										console.error(
											`Error removing free BOGO item ${itemId} from Firestore:`,
											error,
										);
									}
								}
							}
						}
					}
				}
			} else {
				// Regular item - remove normally
				// For individual items, use the original productId format for the dispatch
				const removeId = targetItem?.isIndividualItem
					? productId
					: actualProductId;
				dispatch({ type: "REMOVE_ITEM", payload: removeId });

				if (user) {
					if (targetItem) {
						try {
							// Use removeItemsByProduct to ensure all matching documents (even duplicates) are deleted
							await cartRepository.removeItemsByProduct(
								user.uid,
								targetItem.product_id,
								{
									size: targetItem.size,
									color: targetItem.color,
									individualItemId: targetItem.individualItemId,
								},
							);
						} catch (error) {
							console.error(
								`Error removing item ${targetItem.product_id} from Firestore:`,
								error,
							);
						}
					}
				}
			}
			// Note: For unauthenticated users, saveCart effect will handle localStorage save
		},
		[user, state.items],
	);

	const clearCart = useCallback(async () => {
		dispatch({ type: "CLEAR_CART" });
		if (user) {
			await cartRepository.clearUserCart(user.uid);
		} else {
			// Clear localStorage for unauthenticated users
			localStorage.removeItem("cart");
		}
	}, [user]);

	const getItemQuantity = useCallback(
		(productId: string): number => {
			const item = state.items.find((i) => i.product_id === productId);
			return item ? item.quantity : 0;
		},
		[state.items],
	);

	// Collection cart methods
	const addCollectionToCart = useCallback(
		async (
			collectionId: string,
			collectionName: string,
			products: Product[],
		) => {
			// Allow mixing collections with regular items and adding more items to existing collections

			const collectionItemsProms = products.map(async (product) => {
				const basePrice =
					typeof product.price === "number"
						? product.price
						: product.price.base;

				const productCurrency =
					typeof product.price === "object" ? product.price.currency : "USD";

				// Convert to USD using real-time rates (cart stores everything in USD)
				const conversionResult = await currencyService.convertPrice(
					basePrice,
					productCurrency,
					"USD",
					false, // Skip rounding for high precision in cart
				);
				const priceInUSD = conversionResult.convertedPrice;

				const originalPrice = priceInUSD;
				const discountPercentage = product.discount || 0;

				// Calculate final price with duty (exempt for Nigerian users)
				// Explicitly using PLATFORM_COMMISSION_RATE to ensure it's added
				// Formula: Original * (1 - Discount) * (1 + Duty + Commission)
				const price = calculateFinalPrice(
					originalPrice,
					discountPercentage,
					userCountry,
				);
				const dutyCharge = calculateDutyAmount(
					originalPrice,
					discountPercentage,
					userCountry,
				);
				const platform_commission = calculatePlatformCommission(
					originalPrice,
					discountPercentage,
				);

				// Extract available sizes and colors
				const availableSizes =
					product.rtwOptions?.sizes?.map((s) =>
						typeof s === "string" ? s : s.label,
					) || [];
				const availableColors = product.rtwOptions?.colors || [];

				// Check if out of stock
				const isOutOfStock = product.availability === "out_of_stock";

				return {
					product_id: product.product_id,
					title: product.title,
					description: product.description,
					type: product.type,
					price, // Now duty-inclusive
					originalPrice,
					dutyCharge,
					platform_commission, // Add platform commission
					discount: product.discount,
					quantity: 1, // Always 1 for collection items
					color: null, // To be selected in cart
					size: null, // To be selected in cart
					sizes: null,
					images: product.images,
					sourcePrice: calculateFinalPrice(
						basePrice,
						discountPercentage,
						userCountry,
					), // Store original price with commission
					sourceCurrency: productCurrency, // Store original currency
					tailor_id: product.tailor_id,
					tailor: product.tailor || product.vendor?.name || "",
					user_id: user?.uid || "",
					createdAt: new Date(),
					updatedAt: new Date(),
					isCollectionItem: true,
					collectionId,
					collectionName,
					isRemovable: true, // Allow users to remove individual items from collections
					isExempted: isOutOfStock, // Auto-exempt if out of stock
					availableSizes,
					availableColors,
					product, // Store full product for reference
				} as CartItem;
			});

			const collectionItems = await Promise.all(collectionItemsProms);

			dispatch({
				type: "ADD_COLLECTION",
				payload: { items: collectionItems, collectionId, collectionName },
			});

			if (user) {
				// Save collection items to cart repository
				for (const item of collectionItems) {
					await cartRepository.addItem(user.uid, item);
				}
			}
		},
		[user, state.collections, userCountry],
	);

	// Add individual item from collection to cart
	const addIndividualItemToCart = useCallback(
		async (
			product: Product,
			individualItem: any,
			selectedOptions?: { size?: string; color?: string },
		) => {
			// Create a cart item based on the individual item
			const basePrice =
				typeof product.price === "number" ? product.price : product.price.base;

			const productCurrency =
				typeof product.price === "object" ? product.price.currency : "USD";

			// Convert NGN to USD if needed
			const NGN_TO_USD_RATE = 0.000606;
			let priceInUSD = individualItem.price || basePrice;
			if (productCurrency === "NGN") {
				priceInUSD =
					individualItem.price * NGN_TO_USD_RATE || basePrice * NGN_TO_USD_RATE;
			}

			const originalPrice = priceInUSD;
			const discountPercentage = product.discount || 0;

			// Calculate final price with duty (exempt for Nigerian users)
			const price = calculateFinalPrice(
				originalPrice,
				discountPercentage,
				userCountry,
			);
			const dutyCharge = calculateDutyAmount(
				originalPrice,
				discountPercentage,
				userCountry,
			);

			const sourcePrice = calculateFinalPrice(
				individualItem.price || basePrice,
				discountPercentage,
				userCountry,
			);

			// Extract available sizes and colors
			const availableSizes = product.rtwOptions?.sizes
				? product.rtwOptions.sizes.map((s) =>
						typeof s === "string" ? s : s.label,
					)
				: [];
			const availableColors = product.rtwOptions?.colors || [];

			// Check if out of stock
			const isOutOfStock = product.availability === "out_of_stock";

			// Use quantity from individual item, defaulting to 1
			const itemQuantity = individualItem.quantity || 1;

			const individualCartItem: CartItem = {
				product_id: product.product_id, // Keep original product ID
				title: `${product.title} - ${individualItem.name}`,
				description: individualItem.name,
				type: product.type,
				price, // Use individual item price
				originalPrice,
				dutyCharge,
				discount: product.discount,
				quantity: itemQuantity, // Use quantity from individual item
				color: selectedOptions?.color || null, // Use selected color
				size: selectedOptions?.size || null, // Use selected size
				sizes: null,
				images: product.images,
				tailor_id: product.tailor_id,
				tailor: product.tailor || product.vendor?.name || "",
				user_id: user?.uid || "",
				createdAt: new Date(),
				updatedAt: new Date(),
				isCollectionItem: false, // Not a collection item
				collectionId: undefined,
				collectionName: undefined,
				isRemovable: true,
				isExempted: isOutOfStock, // Auto-exempt if out of stock
				availableSizes,
				availableColors,
				product, // Store full product for reference
				// Store individual item information
				individualItemId: individualItem.id,
				individualItemName: individualItem.name,
				isIndividualItem: true,
				// Source pricing fields
				sourcePrice: sourcePrice,
				sourceCurrency: productCurrency,
				sourcePlatformCommission: calculatePlatformCommission(
					individualItem.price || basePrice,
					discountPercentage,
				),
				sourceOriginalPrice: individualItem.price || basePrice,
			};

			dispatch({ type: "ADD_ITEM", payload: individualCartItem });

			if (user) {
				// Save individual item to cart repository
				await cartRepository.addItem(user.uid, individualCartItem);
			}
		},
		[user, userCountry],
	);

	const removeCollection = useCallback(
		async (collectionId?: string) => {
			dispatch({
				type: "REMOVE_COLLECTION",
				payload: collectionId ? { collectionId } : undefined,
			});

			if (user) {
				if (collectionId) {
					// Remove only items from this collection
					const collectionItems = state.items.filter(
						(item) =>
							item.isCollectionItem && item.collectionId === collectionId,
					);
					for (const item of collectionItems) {
						if (item.id) {
							await cartRepository.removeItem(user.uid, item.id);
						}
					}
				} else {
					// Remove all collection items
					const collectionItems = state.items.filter(
						(item) => item.isCollectionItem,
					);
					for (const item of collectionItems) {
						if (item.id) {
							await cartRepository.removeItem(user.uid, item.id);
						}
					}
				}
			} else {
				// For non-logged in users, update localStorage
				const remainingItems = collectionId
					? state.items.filter(
							(item) =>
								!item.isCollectionItem || item.collectionId !== collectionId,
						)
					: state.items.filter((item) => !item.isCollectionItem);
				localStorage.setItem("cart", JSON.stringify(remainingItems));
			}
		},
		[user, state.items],
	);

	const updateCollectionItemSelection = useCallback(
		async (productId: string, size?: string, color?: string) => {
			dispatch({
				type: "UPDATE_COLLECTION_ITEM",
				payload: { productId, size, color },
			});

			if (user) {
				const item = state.items.find((i) => i.product_id === productId);
				if (item && item.id) {
					// Only include defined values, convert undefined to null for Firestore
					const updates: Partial<CartItem> = {};
					if (size !== undefined) {
						updates.size = size || null;
					}
					if (color !== undefined) {
						updates.color = color || null;
					}
					await cartRepository.updateItem(user.uid, item.id, updates);
				}
			}
		},
		[user, state.items],
	);

	const exemptCollectionItem = useCallback(
		async (productId: string) => {
			dispatch({ type: "EXEMPT_COLLECTION_ITEM", payload: productId });

			if (user) {
				const item = state.items.find((i) => i.product_id === productId);
				if (item && item.id) {
					await cartRepository.updateItem(user.uid, item.id, {
						isExempted: true,
					});
				}
			}
		},
		[user, state.items],
	);

	const validateCollectionCart = useCallback(
		(collectionId?: string) => {
			// If collectionId provided, validate only that collection; otherwise validate all collections
			const itemsToValidate = collectionId
				? state.items.filter(
						(item) =>
							item.isCollectionItem && item.collectionId === collectionId,
					)
				: state.items.filter((item) => item.isCollectionItem);

			if (itemsToValidate.length === 0) {
				return { isValid: true, missingSelections: [] };
			}

			const missingSelections: Array<{
				productId: string;
				productName: string;
				missing: string[];
			}> = [];

			for (const item of itemsToValidate) {
				if (item.isExempted) continue; // Skip exempted items

				const missing: string[] = [];

				// Check if size is required and selected
				if (
					item.availableSizes &&
					item.availableSizes.length > 0 &&
					!item.size
				) {
					missing.push("size");
				}

				// Check if color is required and selected
				if (
					item.availableColors &&
					item.availableColors.length > 0 &&
					!item.color
				) {
					missing.push("color");
				}

				if (missing.length > 0) {
					missingSelections.push({
						productId: item.product_id,
						productName: item.title,
						missing,
					});
				}
			}

			// Check if at least one non-exempted item exists
			const hasNonExemptedItems = itemsToValidate.some(
				(item) => !item.isExempted,
			);
			const isValid = missingSelections.length === 0 && hasNonExemptedItems;

			return { isValid, missingSelections };
		},
		[state.items],
	);

	const isCollectionCart = useCallback(() => {
		return state.cartType === "collection" || state.cartType === "mixed";
	}, [state.cartType]);

	const getCollectionItems = useCallback(
		(collectionId: string): CartItem[] => {
			return state.items.filter(
				(item) => item.isCollectionItem && item.collectionId === collectionId,
			);
		},
		[state.items],
	);

	const getRegularItems = useCallback((): CartItem[] => {
		return state.items.filter((item) => !item.isCollectionItem);
	}, [state.items]);

	const getCollectionSummary = useCallback(
		(collectionId: string) => {
			return state.collections.get(collectionId) || null;
		},
		[state.collections],
	);

	const getAllCollections = useCallback(() => {
		return Array.from(state.collections.values());
	}, [state.collections]);

	// BOGO methods
	const addItemWithBogo = useCallback(
		async (
			product: Product,
			quantity: number,
			selectedOptions?: Record<string, string>,
		) => {
			try {
				// Import BOGO service dynamically to avoid circular dependencies
				const { bogoCartService } = await import("@/lib/bogo/cart-service");
				// Import tracking service
				const { bogoClientTracker } =
					await import("@/lib/bogo/client-tracking-service");

				// Check for BOGO mapping
				const result = await bogoCartService.addProductWithBogo(
					product,
					quantity,
					state.items,
				);

				if (!result.success) {
					throw new Error(result.error || "Failed to add product with BOGO");
				}

				// Add the main product first
				await addItem(product, quantity, selectedOptions);

				// TRACKING: Track main product add to cart
				if (result.mappingId) {
					const mainProductPrice =
						typeof product.price === "number"
							? product.price
							: product.price?.base || 0;

					bogoClientTracker.trackAddToCart(
						result.mappingId,
						product.product_id,
						result.freeProductId || "", // Optional
						user?.uid || undefined,
						mainProductPrice * quantity, // Estimate value
						{
							quantity,
							isMainProduct: true,
						},
					);
				}

				if (result.freeProductAdded && result.freeProductId) {
					// Single free product - fetch actual product data and add automatically
					const freeProductDoc = await getDoc(
						doc(db, "staging_tailor_works", result.freeProductId),
					);

					if (!freeProductDoc.exists()) {
						throw new Error("Free product not found");
					}

					const freeProductData = freeProductDoc.data();
					const originalPrice =
						typeof freeProductData.price === "number"
							? freeProductData.price
							: freeProductData.price?.base || 0;

					const freeProduct: Product = {
						product_id: result.freeProductId,
						title: freeProductData.title || "Free Product",
						description: freeProductData.description || "",
						type: freeProductData.type || product.type || "ready-to-wear",
						category: freeProductData.category || product.category,
						availability: freeProductData.availability || "in_stock",
						status: freeProductData.status || "verified",
						price: { base: 0, currency: "USD" },
						discount: 0,
						deliveryTimeline:
							freeProductData.deliveryTimeline ||
							product.deliveryTimeline ||
							"",
						returnPolicy:
							freeProductData.returnPolicy || product.returnPolicy || "",
						images: freeProductData.images || ["/placeholder-product.svg"],
						tailor_id: freeProductData.tailor_id || product.tailor_id,
						tailor:
							freeProductData.tailor_name ||
							freeProductData.vendor_name ||
							product.tailor ||
							"",
						vendor: freeProductData.vendor || product.vendor,
						tags: freeProductData.tags || [],
						created_at: freeProductData.created_at || new Date(),
						updated_at: freeProductData.updated_at || new Date(),
					};

					const freeCartItem: CartItem = {
						product_id: result.freeProductId,
						title: freeProduct.title,
						description: freeProduct.description,
						price: 0,
						discount: 0,
						quantity: quantity,
						color: selectedOptions?.color || null,
						size: selectedOptions?.size || null,
						sizes: null,
						images: freeProduct.images,
						tailor_id: freeProduct.tailor_id,
						tailor: freeProduct.tailor || freeProduct.vendor?.name || "",
						user_id: user?.uid || "",
						createdAt: new Date(),
						updatedAt: new Date(),
						isBogoFree: true,
						bogoMainProductId: product.product_id,
						bogoOriginalPrice: originalPrice,
						// Duty fields for free item
						originalPrice: 0,
						dutyCharge: 0,
						platform_commission: 0,
					};

					dispatch({ type: "ADD_BOGO_ITEM", payload: freeCartItem });

					if (user) {
						await cartRepository.addItem(user.uid, freeCartItem);
					}

					// TRACKING: Track free product add to cart
					if (result.mappingId) {
						bogoClientTracker.trackAddToCart(
							result.mappingId,
							product.product_id,
							result.freeProductId,
							user?.uid || undefined,
							0, // Free product value in cart is 0
							{
								quantity,
								isFreeProduct: true,
								savings: originalPrice * quantity,
							},
						);
					}
				} else if (result.requiresSelection && result.availableFreeProducts) {
					// Multiple free products - fetch actual product data and show selection modal
					const freeProducts = await Promise.all(
						result.availableFreeProducts.map(async (productId) => {
							try {
								const productDoc = await getDoc(
									doc(db, "staging_tailor_works", productId),
								);
								if (productDoc.exists()) {
									const productData = productDoc.data();
									const price =
										typeof productData.price === "number"
											? productData.price
											: productData.price?.base || 0;

									return {
										productId,
										name: productData.title || "Free Product",
										thumbnail:
											productData.images?.[0] || "/placeholder-product.svg",
										availability:
											productData.availability || ("in_stock" as const),
										originalPrice: price,
										description: productData.description || "",
									};
								}
							} catch (error) {
								console.error(
									`Error fetching free product ${productId}:`,
									error,
								);
							}

							// Fallback for failed fetches
							return {
								productId,
								name: "Free Product",
								thumbnail: "/placeholder-product.svg",
								availability: "in_stock" as const,
								originalPrice: 0,
							};
						}),
					);

					dispatch({
						type: "SHOW_FREE_PRODUCT_MODAL",
						payload: {
							mainProductId: product.product_id,
							mainProductName: product.title,
							freeProducts,
						},
					});
				}
			} catch (error) {
				console.error("Error adding item with BOGO:", error);
				// Fallback to regular add if BOGO fails
				await addItem(product, quantity, selectedOptions);
			}
		},
		[user, state.items, addItem],
	);

	const handleFreeProductSelection = useCallback(
		async (mainProductId: string, freeProductId: string) => {
			try {
				const { bogoCartService } = await import("@/lib/bogo/cart-service");
				// Import tracking service
				const { bogoClientTracker } =
					await import("@/lib/bogo/client-tracking-service");

				const result = await bogoCartService.handleFreeProductSelection(
					mainProductId,
					freeProductId,
					state.items,
				);

				if (result.success && result.freeProductAdded) {
					// Find the main product to get quantity
					const mainProduct = state.items.find(
						(item) => item.product_id === mainProductId,
					);
					const quantity = mainProduct?.quantity || 1;

					// Fetch actual free product data
					const freeProductDoc = await getDoc(
						doc(db, "staging_tailor_works", freeProductId),
					);

					if (!freeProductDoc.exists()) {
						throw new Error("Selected free product not found");
					}

					const freeProductData = freeProductDoc.data();
					const originalPrice =
						typeof freeProductData.price === "number"
							? freeProductData.price
							: freeProductData.price?.base || 0;

					const freeProductCurrency =
						typeof freeProductData.price === "object"
							? freeProductData.price.currency
							: "USD";

					let freeProductOriginalPrice = originalPrice;
					if (freeProductCurrency === "NGN") {
						const conversion = await currencyService.convertPrice(
							originalPrice,
							"NGN",
							"USD",
						);
						freeProductOriginalPrice = conversion.convertedPrice;
					}

					// Create free product cart item with actual product data
					const freeCartItem: CartItem = {
						product_id: freeProductId,
						title: freeProductData.title || "Free Product",
						description:
							freeProductData.description || "Free item from BOGO promotion",
						price: 0,
						discount: 0,
						quantity: quantity,
						color: null,
						size: null,
						sizes: null,
						images: freeProductData.images || ["/placeholder-product.svg"],
						tailor_id:
							freeProductData.tailor_id || mainProduct?.tailor_id || "",
						tailor:
							freeProductData.tailor_name ||
							freeProductData.vendor_name ||
							mainProduct?.tailor ||
							"",
						user_id: user?.uid || "",
						createdAt: new Date(),
						updatedAt: new Date(),
						isRemovable: true,
						originalPrice: freeProductOriginalPrice, // Added (in USD)
						dutyCharge: 0, // No duty on free items
						platform_commission: 0,
						isBogoFree: true,
						bogoMainProductId: mainProductId,
						bogoOriginalPrice: freeProductOriginalPrice,
					};

					dispatch({ type: "ADD_BOGO_ITEM", payload: freeCartItem });

					if (user) {
						await cartRepository.addItem(user.uid, freeCartItem);
					}

					// TRACKING: Track free product selection
					if (result.mappingId) {
						bogoClientTracker.trackAddToCart(
							result.mappingId,
							mainProductId,
							freeProductId,
							user?.uid || undefined,
							0,
							{
								quantity,
								isFreeProduct: true,
								savings: originalPrice * quantity,
								source: "modal_selection",
							},
						);
					}
				}

				// Hide the modal
				dispatch({ type: "HIDE_FREE_PRODUCT_MODAL" });
			} catch (error) {
				console.error("Error handling free product selection:", error);
				dispatch({ type: "HIDE_FREE_PRODUCT_MODAL" });
			}
		},
		[user, state.items],
	);

	const removeBogoPair = useCallback(
		async (mainProductId: string) => {
			try {
				const { bogoCartService } = await import("@/lib/bogo/cart-service");

				const result = await bogoCartService.removeBogoPair(
					mainProductId,
					state.items,
				);

				if (result.success && result.itemsToRemove) {
					dispatch({ type: "REMOVE_BOGO_PAIR", payload: result.itemsToRemove });

					if (user) {
						// Remove all items in the BOGO pair from Firebase
						for (const productId of result.itemsToRemove) {
							const item = state.items.find((i) => i.product_id === productId);
							if (item?.id) {
								await cartRepository.removeItem(user.uid, item.id);
							}
						}
					}
				} else {
					throw new Error(result.error || "Failed to remove BOGO pair");
				}
			} catch (error) {
				console.error("Error removing BOGO pair:", error);
				// Show user-friendly error message
			}
		},
		[user, state.items],
	);

	const updateBogoQuantity = useCallback(
		async (mainProductId: string, quantity: number) => {
			try {
				const { bogoCartService } = await import("@/lib/bogo/cart-service");

				const result = await bogoCartService.updateBogoQuantity(
					mainProductId,
					quantity,
					state.items,
				);

				if (result.success) {
					// Synchronize quantities using the service
					const synchronizedItems =
						await bogoCartService.synchronizeBogoQuantities(
							mainProductId,
							quantity,
							state.items,
						);

					// Update the cart state with synchronized quantities
					dispatch({ type: "SET_CART", payload: synchronizedItems });

					if (user) {
						// Update in Firebase - handle both main and free products
						const itemsToUpdate = state.items.filter(
							(item) =>
								item.product_id === mainProductId ||
								(item as any).bogoMainProductId === mainProductId,
						);

						for (const item of itemsToUpdate) {
							if (item.id) {
								if (quantity > 0) {
									await cartRepository.updateItem(user.uid, item.id, {
										quantity,
									});
								} else {
									// Remove items with 0 quantity
									await cartRepository.removeItem(user.uid, item.id);
								}
							}
						}
					}
				} else {
					throw new Error(result.error || "Failed to update BOGO quantity");
				}
			} catch (error) {
				console.error("Error updating BOGO quantity:", error);
				// Show user-friendly error message
				// This would integrate with a toast/notification system
			}
		},
		[user, state.items],
	);

	const calculateBogoShipping = useCallback(
		(items?: CartItem[]) => {
			const cartItems = items || state.items;
			// Use the BOGO cart service for consistent logic
			const { bogoCartService } = require("@/lib/bogo/cart-service");
			return bogoCartService.calculateShippingWithBogo(cartItems);
		},
		[state.items],
	);

	const validateBogoCart = useCallback(async () => {
		try {
			const { bogoCartService } = await import("@/lib/bogo/cart-service");

			// Validate basic BOGO cart structure
			const basicValidation = await bogoCartService.validateBogoCart(
				state.items,
			);

			// Validate multiple BOGO pairs independence
			const multipleBogoValidation =
				await bogoCartService.handleMultipleBogoPairs(state.items);

			return {
				isValid: basicValidation.isValid && multipleBogoValidation.isValid,
				errors: [
					...basicValidation.errors,
					...multipleBogoValidation.conflicts,
				],
			};
		} catch (error) {
			console.error("Error validating BOGO cart:", error);
			return { isValid: false, errors: ["Failed to validate cart"] };
		}
	}, [state.items]);

	const cleanupExpiredBogoItems = useCallback(async () => {
		try {
			const { bogoCartService } = await import("@/lib/bogo/cart-service");
			const expiredItems = await bogoCartService.cleanupExpiredBogoItems(
				state.items,
			);

			if (expiredItems.length > 0) {
				dispatch({ type: "CLEANUP_EXPIRED_BOGO", payload: expiredItems });

				if (user) {
					// Remove expired items from Firebase
					for (const productId of expiredItems) {
						const item = state.items.find((i) => i.product_id === productId);
						if (item?.id) {
							await cartRepository.removeItem(user.uid, item.id);
						}
					}
				}
			}
		} catch (error) {
			console.error("Error cleaning up expired BOGO items:", error);
		}
	}, [user, state.items]);

	const getBogoCartSummary = useCallback(() => {
		const { bogoCartService } = require("@/lib/bogo/cart-service");
		const summary = bogoCartService.getBogoCartSummary(state.items);

		// Add shipping message for BOGO items
		const shippingMessage = summary.hasBogoItems
			? "December BOGO Promo – Free Shipping"
			: null;

		return {
			...summary,
			shippingMessage,
		};
	}, [state.items]);

	/**
	 * Merge storefront cart items into main cart
	 * This handles the case where users add items from storefront and then navigate to main site
	 */
	const mergeStorefrontCart = useCallback(
		async (storefrontItems: CartItem[]) => {
			if (!storefrontItems || storefrontItems.length === 0) return;

			try {
				// Filter out items that already exist in main cart
				const existingProductIds = new Set(
					state.items.map(
						(item) =>
							`${item.product_id}-${item.size || "no-size"}-${
								item.color || "no-color"
							}`,
					),
				);

				const newItems = storefrontItems.filter((item) => {
					const itemKey = `${item.product_id}-${item.size || "no-size"}-${
						item.color || "no-color"
					}`;
					return !existingProductIds.has(itemKey);
				});

				// Add new items to cart
				for (const item of newItems) {
					dispatch({ type: "ADD_ITEM", payload: item });

					// Sync to Firebase if user is logged in
					if (user) {
						await cartRepository.addItem(user.uid, item);
					}
				}

				console.log(
					`[CartContext] Merged ${newItems.length} storefront items into main cart`,
				);
			} catch (error) {
				console.error("[CartContext] Error merging storefront cart:", error);
			}
		},
		[user, state.items],
	);

	/**
	 * Apply a coupon to the cart
	 * Note: This is primarily for tracking. Actual discount calculation happens at checkout.
	 */
	const applyCoupon = useCallback((code: string, discount: number) => {
		dispatch({ type: "APPLY_COUPON", payload: { code, discount } });
	}, []);

	/**
	 * Remove applied coupon from cart
	 */
	const removeCoupon = useCallback(() => {
		dispatch({ type: "REMOVE_COUPON" });
	}, []);

	/**
	 * Get total amount with coupon discount applied
	 * Note: This is a helper method. Actual checkout uses its own calculation.
	 */
	const getTotalWithCoupon = useCallback(() => {
		if (!state.appliedCouponCode || state.couponDiscount === 0) {
			return state.totalWithShipping;
		}
		return Math.max(0, state.totalWithShipping - state.couponDiscount);
	}, [state.appliedCouponCode, state.couponDiscount, state.totalWithShipping]);

	const setShowFreeProductModal = useCallback((show: boolean) => {
		if (show) {
			// This should not be called directly - modal is shown via addItemWithBogo
			console.warn(
				"setShowFreeProductModal(true) should not be called directly",
			);
		} else {
			dispatch({ type: "HIDE_FREE_PRODUCT_MODAL" });
		}
	}, []);

	// Memoize context value to prevent unnecessary re-renders
	const contextValue = useMemo(
		() => ({
			...state,
			addItem,
			addPromotionalProduct,
			updateItemQuantity,
			removeItem,
			clearCart,
			getItemQuantity,
			addCollectionToCart,
			addIndividualItemToCart,
			removeCollection,
			updateCollectionItemSelection,
			exemptCollectionItem,
			validateCollectionCart,
			isCollectionCart,
			getCollectionItems,
			getRegularItems,
			getCollectionSummary,
			getAllCollections,
			// BOGO methods
			addItemWithBogo,
			handleFreeProductSelection,
			removeBogoPair,
			updateBogoQuantity,
			calculateBogoShipping,
			validateBogoCart,
			cleanupExpiredBogoItems,
			getBogoCartSummary,
			setShowFreeProductModal,
			mergeStorefrontCart,
			// Coupon methods
			applyCoupon,
			removeCoupon,
			getTotalWithCoupon,
		}),
		[
			state,
			addItem,
			addPromotionalProduct,
			updateItemQuantity,
			removeItem,
			clearCart,
			getItemQuantity,
			addCollectionToCart,
			addIndividualItemToCart,
			removeCollection,
			updateCollectionItemSelection,
			exemptCollectionItem,
			validateCollectionCart,
			isCollectionCart,
			getCollectionItems,
			getRegularItems,
			getCollectionSummary,
			getAllCollections,
			addItemWithBogo,
			handleFreeProductSelection,
			removeBogoPair,
			updateBogoQuantity,
			calculateBogoShipping,
			validateBogoCart,
			cleanupExpiredBogoItems,
			getBogoCartSummary,
			setShowFreeProductModal,
			mergeStorefrontCart,
			applyCoupon,
			removeCoupon,
			getTotalWithCoupon,
		],
	);

	return (
		<CartContext.Provider value={contextValue}>
			{children}
			{/* BOGO Free Product Selection Modal */}
			{state.showFreeProductModal && state.freeProductModalData && (
				<FreeProductSelectionModal
					isOpen={state.showFreeProductModal}
					onClose={() => dispatch({ type: "HIDE_FREE_PRODUCT_MODAL" })}
					mainProductId={state.freeProductModalData.mainProductId}
					mainProductName={state.freeProductModalData.mainProductName}
					freeProducts={state.freeProductModalData.freeProducts}
					onSelect={(productId) =>
						handleFreeProductSelection(
							state.freeProductModalData!.mainProductId,
							productId,
						)
					}
					onCancel={() => dispatch({ type: "HIDE_FREE_PRODUCT_MODAL" })}
				/>
			)}
		</CartContext.Provider>
	);
};

export const useCart = () => {
	const context = useContext(CartContext);
	if (!context) throw new Error("useCart must be used within a CartProvider");
	return context;
};

// Export CartProvider wrapped with HMR error boundary for runtime stability
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => (
	<HMRErrorBoundary>
		<CartProviderComponent>{children}</CartProviderComponent>
	</HMRErrorBoundary>
);
