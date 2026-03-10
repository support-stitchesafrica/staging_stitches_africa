"use client";

import React, {
	createContext,
	useContext,
	useReducer,
	useEffect,
	useCallback,
	useMemo,
} from "react";
import { Product } from "@/types";
import {
	StorefrontCartItem,
	StorefrontCartService,
} from "@/lib/storefront/cart-integration";
import { useAuth } from "./AuthContext";
import { useCurrency } from "./CurrencyContext";

interface StorefrontCartState {
	items: StorefrontCartItem[];
	totalAmount: number;
	itemCount: number;
	shippingCost: number;
	totalWithShipping: number;
	loading: boolean;
	storefrontContext: {
		storefrontId?: string;
		storefrontHandle?: string;
	} | null;
}

type StorefrontCartAction =
	| { type: "SET_LOADING"; payload: boolean }
	| {
			type: "SET_CART";
			payload: { items: StorefrontCartItem[]; storefrontContext: any };
	  }
	| { type: "ADD_ITEM"; payload: StorefrontCartItem }
	| {
			type: "UPDATE_QUANTITY";
			payload: {
				productId: string;
				quantity: number;
				size?: string;
				color?: string;
			};
	  }
	| {
			type: "REMOVE_ITEM";
			payload: { productId: string; size?: string; color?: string };
	  }
	| { type: "CLEAR_CART" }
	| {
			type: "SET_STOREFRONT_CONTEXT";
			payload: { storefrontId?: string; storefrontHandle?: string };
	  };

interface StorefrontCartContextType extends StorefrontCartState {
	addItem: (
		product: Product,
		quantity: number,
		selectedOptions?: Record<string, string>,
	) => Promise<void>;
	updateItemQuantity: (
		productId: string,
		quantity: number,
		size?: string,
		color?: string,
	) => Promise<void>;
	removeItem: (
		productId: string,
		size?: string,
		color?: string,
	) => Promise<void>;
	clearCart: () => void;
	getItemQuantity: (productId: string, size?: string, color?: string) => number;
	initiateCheckout: (
		returnUrl?: string,
	) => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
	setStorefrontContext: (context: {
		storefrontId?: string;
		storefrontHandle?: string;
	}) => void;
	mergeWithMainCart: () => Promise<void>;
}

const StorefrontCartContext = createContext<
	StorefrontCartContextType | undefined
>(undefined);

const storefrontCartReducer = (
	state: StorefrontCartState,
	action: StorefrontCartAction,
): StorefrontCartState => {
	switch (action.type) {
		case "SET_LOADING":
			return { ...state, loading: action.payload };

		case "SET_CART": {
			const { items, storefrontContext } = action.payload;
			const totals = StorefrontCartService.calculateCartTotals(items);

			return {
				...state,
				items,
				storefrontContext,
				totalAmount: totals.subtotal,
				itemCount: totals.itemCount,
				shippingCost: totals.shippingCost,
				totalWithShipping: totals.total,
				loading: false,
			};
		}

		case "ADD_ITEM": {
			// Check if item already exists with same product, size, and color
			const existingItemIndex = state.items.findIndex(
				(item) =>
					item.product_id === action.payload.product_id &&
					(item.size || null) === (action.payload.size || null) &&
					(item.color || null) === (action.payload.color || null),
			);

			let newItems: StorefrontCartItem[];
			if (existingItemIndex >= 0) {
				// Update existing item quantity
				newItems = state.items.map((item, index) =>
					index === existingItemIndex
						? {
								...item,
								quantity: item.quantity + action.payload.quantity,
								updatedAt: new Date(),
							}
						: item,
				);
			} else {
				// Add new item
				newItems = [...state.items, action.payload];
			}

			const totals = StorefrontCartService.calculateCartTotals(newItems);

			return {
				...state,
				items: newItems,
				totalAmount: totals.subtotal,
				itemCount: totals.itemCount,
				shippingCost: totals.shippingCost,
				totalWithShipping: totals.total,
			};
		}

		case "UPDATE_QUANTITY": {
			const { productId, quantity, size, color } = action.payload;

			let newItems: StorefrontCartItem[];
			if (quantity === 0) {
				// Remove item if quantity is 0
				newItems = state.items.filter(
					(item) =>
						!(
							item.product_id === productId &&
							(item.size || null) === (size || null) &&
							(item.color || null) === (color || null)
						),
				);
			} else {
				// Update quantity
				newItems = state.items.map((item) =>
					item.product_id === productId &&
					(item.size || null) === (size || null) &&
					(item.color || null) === (color || null)
						? { ...item, quantity, updatedAt: new Date() }
						: item,
				);
			}

			const totals = StorefrontCartService.calculateCartTotals(newItems);

			return {
				...state,
				items: newItems,
				totalAmount: totals.subtotal,
				itemCount: totals.itemCount,
				shippingCost: totals.shippingCost,
				totalWithShipping: totals.total,
			};
		}

		case "REMOVE_ITEM": {
			const { productId, size, color } = action.payload;
			const newItems = state.items.filter(
				(item) =>
					!(
						item.product_id === productId &&
						(item.size || null) === (size || null) &&
						(item.color || null) === (color || null)
					),
			);

			const totals = StorefrontCartService.calculateCartTotals(newItems);

			return {
				...state,
				items: newItems,
				totalAmount: totals.subtotal,
				itemCount: totals.itemCount,
				shippingCost: totals.shippingCost,
				totalWithShipping: totals.total,
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
			};

		case "SET_STOREFRONT_CONTEXT":
			return {
				...state,
				storefrontContext: action.payload,
			};

		default:
			return state;
	}
};

const StorefrontCartProviderComponent: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	const { user } = useAuth();
	const { userCountry } = useCurrency();
	const [state, dispatch] = useReducer(storefrontCartReducer, {
		items: [],
		totalAmount: 0,
		itemCount: 0,
		shippingCost: 0,
		totalWithShipping: 0,
		loading: true,
		storefrontContext: null,
	});

	// Load cart from localStorage on mount
	const loadCart = useCallback(() => {
		dispatch({ type: "SET_LOADING", payload: true });

		try {
			const cartData = StorefrontCartService.getCartFromLocalStorage();
			if (cartData) {
				dispatch({ type: "SET_CART", payload: cartData });
			} else {
				dispatch({ type: "SET_LOADING", payload: false });
			}
		} catch (error) {
			console.error("Error loading storefront cart:", error);
			dispatch({ type: "SET_LOADING", payload: false });
		}
	}, []);

	// Save cart to localStorage whenever items change
	const saveCart = useCallback(() => {
		if (!state.loading && state.storefrontContext) {
			StorefrontCartService.storeCartInLocalStorage(
				state.items,
				state.storefrontContext,
			);
		}
	}, [state.items, state.loading, state.storefrontContext]);

	useEffect(() => {
		loadCart();
	}, [loadCart]);

	useEffect(() => {
		saveCart();
	}, [saveCart]);

	const addItem = useCallback(
		async (
			product: Product,
			quantity: number,
			selectedOptions?: Record<string, string>,
		) => {
			try {
				if (!state.storefrontContext) {
					throw new Error("Storefront context not set");
				}

				const cartItem = await StorefrontCartService.createStorefrontCartItem(
					product,
					quantity,
					state.storefrontContext,
					selectedOptions,
					userCountry,
				);

				// Try to add via API first (for authenticated users)
				if (user) {
					const result = await StorefrontCartService.addItemToCart(
						cartItem,
						state.storefrontContext,
					);
					if (!result.success) {
						console.warn(
							"API add failed, falling back to localStorage:",
							result.error,
						);
					}
				}

				// Update local state
				dispatch({ type: "ADD_ITEM", payload: cartItem });

				// Update localStorage for guest users or as backup
				StorefrontCartService.addOrUpdateItemInLocalStorage(
					cartItem,
					state.storefrontContext,
				);
			} catch (error) {
				console.error("Error adding item to storefront cart:", error);
				throw error;
			}
		},
		[user, state.storefrontContext],
	);

	const updateItemQuantity = useCallback(
		async (
			productId: string,
			quantity: number,
			size?: string,
			color?: string,
		) => {
			try {
				// Try to update via API first (for authenticated users)
				if (user) {
					const result = await StorefrontCartService.updateItemQuantity(
						productId,
						quantity,
						size,
						color,
					);
					if (!result.success) {
						console.warn(
							"API update failed, falling back to localStorage:",
							result.error,
						);
					}
				}

				// Update local state
				dispatch({
					type: "UPDATE_QUANTITY",
					payload: { productId, quantity, size, color },
				});

				// Update localStorage for guest users or as backup
				StorefrontCartService.updateQuantityInLocalStorage(
					productId,
					quantity,
					size,
					color,
				);
			} catch (error) {
				console.error(
					"Error updating item quantity in storefront cart:",
					error,
				);
				throw error;
			}
		},
		[user],
	);

	const removeItem = useCallback(
		async (productId: string, size?: string, color?: string) => {
			try {
				// Try to remove via API first (for authenticated users)
				if (user) {
					const result = await StorefrontCartService.removeItemFromCart(
						productId,
						size,
						color,
					);
					if (!result.success) {
						console.warn(
							"API remove failed, falling back to localStorage:",
							result.error,
						);
					}
				}

				// Update local state
				dispatch({ type: "REMOVE_ITEM", payload: { productId, size, color } });

				// Update localStorage for guest users or as backup
				StorefrontCartService.updateQuantityInLocalStorage(
					productId,
					0,
					size,
					color,
				);
			} catch (error) {
				console.error("Error removing item from storefront cart:", error);
				throw error;
			}
		},
		[user],
	);

	const clearCart = useCallback(() => {
		dispatch({ type: "CLEAR_CART" });
		StorefrontCartService.clearCartFromLocalStorage();
	}, []);

	const getItemQuantity = useCallback(
		(productId: string, size?: string, color?: string): number => {
			const item = state.items.find(
				(item) =>
					item.product_id === productId &&
					(item.size || null) === (size || null) &&
					(item.color || null) === (color || null),
			);
			return item ? item.quantity : 0;
		},
		[state.items],
	);

	const initiateCheckout = useCallback(
		async (returnUrl?: string) => {
			try {
				if (!state.storefrontContext) {
					return {
						success: false,
						error: "Storefront context not set",
					};
				}

				const result = await StorefrontCartService.initiateCheckoutRedirect({
					items: state.items,
					storefrontId: state.storefrontContext.storefrontId,
					storefrontHandle: state.storefrontContext.storefrontHandle,
					returnUrl,
					userId: user?.uid,
				});

				if (result.success && result.redirectUrl) {
					// Clear cart after successful checkout initiation
					clearCart();
				}

				return result;
			} catch (error) {
				console.error("Error initiating checkout:", error);
				return {
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Failed to initiate checkout",
				};
			}
		},
		[state.items, state.storefrontContext, user, clearCart],
	);

	const setStorefrontContext = useCallback(
		(context: { storefrontId?: string; storefrontHandle?: string }) => {
			dispatch({ type: "SET_STOREFRONT_CONTEXT", payload: context });
		},
		[],
	);

	const mergeWithMainCart = useCallback(async () => {
		try {
			if (state.items.length === 0) return;

			// Trigger cart update event for main cart to pick up
			const event = new CustomEvent("cart-updated", {
				detail: {
					source: "storefront",
					items: state.items,
					storefrontContext: state.storefrontContext,
				},
			});
			window.dispatchEvent(event);

			// Clear storefront cart after merge
			clearCart();

			console.log(
				`[StorefrontCartContext] Merged ${state.items.length} items with main cart`,
			);
		} catch (error) {
			console.error("Error merging with main cart:", error);
			throw error;
		}
	}, [state.items, state.storefrontContext, clearCart]);

	// Memoize context value to prevent unnecessary re-renders
	const contextValue = useMemo(
		() => ({
			...state,
			addItem,
			updateItemQuantity,
			removeItem,
			clearCart,
			getItemQuantity,
			initiateCheckout,
			setStorefrontContext,
			mergeWithMainCart,
		}),
		[
			state,
			addItem,
			updateItemQuantity,
			removeItem,
			clearCart,
			getItemQuantity,
			initiateCheckout,
			setStorefrontContext,
			mergeWithMainCart,
		],
	);

	return (
		<StorefrontCartContext.Provider value={contextValue}>
			{children}
		</StorefrontCartContext.Provider>
	);
};

export const useStorefrontCart = () => {
	const context = useContext(StorefrontCartContext);
	if (!context) {
		throw new Error(
			"useStorefrontCart must be used within a StorefrontCartProvider",
		);
	}
	return context;
};

export const StorefrontCartProvider: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => (
	<StorefrontCartProviderComponent>{children}</StorefrontCartProviderComponent>
);
