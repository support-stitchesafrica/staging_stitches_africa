import type { CartItem } from "@/types";

/** Vendor (tailor) ids for Mission Logix warehouse merchandise (Unity Cup + merch). */
export const UNITY_CUP_VENDOR_IDS = [
	"lG1WTWgAQSQ0V1pxAknB5qgXs9k2",
	"nBWsfFJcXnTUrXikQn8UmQJJtPX2",
] as const;

/** @deprecated Prefer `UNITY_CUP_VENDOR_IDS` — first vendor id kept for compatibility. */
export const UNITY_CUP_VENDOR_ID = UNITY_CUP_VENDOR_IDS[0];

export function isUnityCupVendorId(vendorId: string): boolean {
	const id = vendorId.trim();
	return (UNITY_CUP_VENDOR_IDS as readonly string[]).includes(id);
}

/** Shown when the cart has Unity Cup items but the shipping address is not in `EUROPE_COUNTRIES`. */
export const UNITY_CUP_NON_EU_SHIPPING_MESSAGE =
	"Unity Cup merchandise ships from our European warehouse and can only be delivered to supported European countries. Please choose a European shipping address or remove Unity Cup items from your cart to calculate shipping and continue checkout.";

export type CartLikeForUnity = Pick<CartItem, "tailor_id" | "product_id" | "price" | "quantity"> & {
	/** Warehouse SKU — set on cart from `tailor_works.mintsoft_sku` when present. */
	mintsoft_sku?: string;
	product?: { tailor_id?: string; mintsoft_sku?: string } | null;
	title?: string;
};

export function getCartItemVendorId(item: CartLikeForUnity): string {
	const id = item.product?.tailor_id || item.tailor_id;
	return typeof id === "string" ? id.trim() : "";
}

export function isUnityCupCartItem(item: CartLikeForUnity): boolean {
	return isUnityCupVendorId(getCartItemVendorId(item));
}

export function filterUnityCupCartItems<T extends CartLikeForUnity>(items: T[]): T[] {
	return items.filter(isUnityCupCartItem);
}

/** Lines that use the normal Stitches / DHL shipping quote (not Mission Logix merchandise). */
export function filterNonUnityCupCartItems<T extends CartLikeForUnity>(
	items: T[],
): T[] {
	return items.filter((i) => !isUnityCupCartItem(i));
}

/** Fixed USD shipping add-on when Unity Cup merchandise is in the cart (applied in calculateShipping only). */
export const UNITY_CUP_MERCHANDISE_SHIPPING_USD = 4;

const NGN_PER_USD_FOR_MERCH_SHIPPING = 1500;

/** Adds merchandise shipping to a quoted amount (silent — no separate UI line). */
export function applyUnityCupMerchandiseShippingAddon(
	amount: number,
	currency: string,
	hasMerchInCart: boolean,
): number {
	if (!hasMerchInCart) return amount;
	const addon =
		currency.toUpperCase() === "NGN"
			? UNITY_CUP_MERCHANDISE_SHIPPING_USD * NGN_PER_USD_FOR_MERCH_SHIPPING
			: UNITY_CUP_MERCHANDISE_SHIPPING_USD;
	return amount + addon;
}

/** Unity Cup lines and at least one other vendor in the same cart. */
export function isMixedUnityAndRegularCart(items: CartLikeForUnity[]): boolean {
	if (items.length < 2) return false;
	const hasUnity = items.some(isUnityCupCartItem);
	const hasNonUnity = items.some((i) => !isUnityCupCartItem(i));
	return hasUnity && hasNonUnity;
}

export function getShippingCountryCodeFromAddress(address: {
	country_code?: string;
	countryCode?: string;
} | null | undefined): string {
	if (!address) return "";
	return String(address.country_code || address.countryCode || "")
		.trim()
		.toUpperCase();
}

type AddressForMintsoft = {
	first_name?: string;
	firstName?: string;
	last_name?: string;
	lastName?: string;
	street_address?: string;
	streetAddress?: string;
	city?: string;
	state?: string;
	post_code?: string;
	postalCode?: string;
	postal_code?: string;
	country_code?: string;
	countryCode?: string;
	phone_number?: string;
	phoneNumber?: string;
};

/** Body shape accepted by `normalizeMintsoftRequestBody` — Unity lines only. */
export function buildMintsoftBodyForUnityItems(args: {
	orderId: string;
	email: string;
	phone: string;
	currency: string;
	address: AddressForMintsoft;
	unityItems: { item: CartLikeForUnity; mintsoftSku: string }[];
}): Record<string, unknown> {
	const { orderId, email, phone, currency, address, unityItems } = args;
	const a = address;
	const unityTotal = unityItems.reduce(
		(sum, { item }) =>
			sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
		0,
	);
	const total = unityTotal > 0 ? unityTotal : 0.01;

	return {
		orderId,
		email,
		phone: phone || "",
		currency,
		total,
		shipping: {
			first_name: a.first_name || a.firstName,
			last_name: a.last_name || a.lastName,
			street_address: a.street_address || a.streetAddress,
			city: a.city,
			state: a.state,
			post_code: a.post_code || a.postalCode || a.postal_code,
			country_code: getShippingCountryCodeFromAddress(a),
		},
		items: unityItems.map(({ item, mintsoftSku }) => ({
			product_id: item.product_id,
			mintsoft_sku: mintsoftSku,
			sku: mintsoftSku,
			quantity: item.quantity,
			price: item.price,
		})),
	};
}
