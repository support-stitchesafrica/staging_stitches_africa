import { Product } from "@/types";
import {
	calculateFinalPrice,
	getCurrency,
	getDiscount,
	getPriceValue,
} from "@/lib/priceUtils";
import { convertUsdToCurrencySync } from "@/lib/utils/currency";

/** Shop home tabs: surface products priced ₦0–₦120,000 first. */
export const SHOP_PRIORITY_MAX_NGN = 120_000;

/** Max times the same brand / category / sub-category may appear when alternatives exist in-band. */
const MAX_REPEAT_PER_KEY = 2;

type ProductLike = Pick<Product, "price" | "discount">;

export type ShopHomeProductFields = ProductLike &
	Pick<
		Product,
		"product_id" | "vendor" | "tailor" | "category" | "wear_category"
	>;

export interface OrderShopHomeProductsOptions {
	/** Cap how many products are returned (e.g. trending carousel). */
	limit?: number;
	/**
	 * Shuffle picks within each price band (Fisher–Yates) while keeping
	 * ₦0–₦120k priority and brand/category diversity caps.
	 */
	randomize?: boolean;
}

/** In-place Fisher–Yates shuffle (returns the same array reference). */
function shuffleInPlace<T>(items: T[]): T[] {
	for (let i = items.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[items[i], items[j]] = [items[j], items[i]];
	}
	return items;
}

function normalizeKey(value: string | undefined): string {
	const trimmed = (value ?? "").trim().toLowerCase();
	return trimmed || "__unknown__";
}

function parseWearCategoryParts(wear: string | undefined): string[] {
	if (!wear || typeof wear !== "string") return [];
	return wear
		.split(/[,;]+/)
		.map((p) => p.trim())
		.filter(Boolean);
}

export function getProductBrandKey(
	product: Pick<Product, "vendor" | "tailor">,
): string {
	return normalizeKey(product.vendor?.name || product.tailor);
}

export function getProductCategoryKey(
	product: Pick<Product, "category">,
): string {
	return normalizeKey(product.category);
}

export function getProductSubCategoryKey(
	product: Pick<Product, "wear_category">,
): string {
	const parts = parseWearCategoryParts(product.wear_category);
	return normalizeKey(parts[0]);
}

function getProductId(product: ShopHomeProductFields): string {
	return product.product_id || "";
}

/** Customer-facing final price in NGN (for sorting only). */
export function getProductFinalPriceNgn(product: ProductLike): number {
	const base = getPriceValue(product.price);
	const currency = getCurrency(product.price, "USD").toUpperCase();
	const discount = getDiscount(product.price, product.discount);
	const finalInListing = calculateFinalPrice(base, discount);

	if (currency === "NGN") {
		return finalInListing;
	}
	return convertUsdToCurrencySync(finalInListing, "NGN");
}

export function isInShopPriorityPriceBand(ngnPrice: number): boolean {
	return ngnPrice >= 0 && ngnPrice <= SHOP_PRIORITY_MAX_NGN;
}

function isUnderDiversityCap(
	product: ShopHomeProductFields,
	brandCount: Map<string, number>,
	categoryCount: Map<string, number>,
	subCategoryCount: Map<string, number>,
): boolean {
	const brand = getProductBrandKey(product);
	const category = getProductCategoryKey(product);
	const sub = getProductSubCategoryKey(product);
	return (
		(brandCount.get(brand) ?? 0) < MAX_REPEAT_PER_KEY &&
		(categoryCount.get(category) ?? 0) < MAX_REPEAT_PER_KEY &&
		(subCategoryCount.get(sub) ?? 0) < MAX_REPEAT_PER_KEY
	);
}

function recordProduct(
	product: ShopHomeProductFields,
	brandCount: Map<string, number>,
	categoryCount: Map<string, number>,
	subCategoryCount: Map<string, number>,
): void {
	const brand = getProductBrandKey(product);
	const category = getProductCategoryKey(product);
	const sub = getProductSubCategoryKey(product);
	brandCount.set(brand, (brandCount.get(brand) ?? 0) + 1);
	categoryCount.set(category, (categoryCount.get(category) ?? 0) + 1);
	subCategoryCount.set(sub, (subCategoryCount.get(sub) ?? 0) + 1);
}

/**
 * Round-robin across brand buckets so consecutive items rarely share a vendor.
 */
function diversifyRoundRobinByBrand<T extends ShopHomeProductFields>(
	pool: T[],
	maxItems: number,
	randomize = false,
): T[] {
	if (pool.length === 0 || maxItems <= 0) return [];

	const buckets = new Map<string, T[]>();
	for (const product of pool) {
		const key = getProductBrandKey(product);
		const list = buckets.get(key) ?? [];
		list.push(product);
		buckets.set(key, list);
	}

	let queues = [...buckets.values()];
	if (randomize) {
		for (const queue of queues) {
			shuffleInPlace(queue);
		}
		shuffleInPlace(queues);
	}
	const result: T[] = [];
	const seen = new Set<string>();

	while (result.length < maxItems && queues.some((q) => q.length > 0)) {
		for (const queue of queues) {
			if (result.length >= maxItems) break;
			while (queue.length > 0) {
				const next = queue.shift()!;
				const id = getProductId(next);
				if (!id || !seen.has(id)) {
					if (id) seen.add(id);
					result.push(next);
					break;
				}
			}
		}
	}

	return result;
}

/**
 * Prefer items under brand/category/sub caps; relax only when needed to fill the slot.
 */
function diversifyWithCaps<T extends ShopHomeProductFields>(
	pool: T[],
	maxItems: number,
	enforceCapsWhileAlternativesExist: boolean,
	randomize = false,
): T[] {
	if (pool.length === 0 || maxItems <= 0) return [];

	const brandCount = new Map<string, number>();
	const categoryCount = new Map<string, number>();
	const subCategoryCount = new Map<string, number>();
	const remaining = [...pool];
	if (randomize) {
		shuffleInPlace(remaining);
	}
	const result: T[] = [];
	const seen = new Set<string>();

	const hasAlternativeUnderCap = (product: T): boolean => {
		return remaining.some((other) => {
			if (other === product) return false;
			const id = getProductId(other);
			if (id && seen.has(id)) return false;
			return isUnderDiversityCap(
				other,
				brandCount,
				categoryCount,
				subCategoryCount,
			);
		});
	};

	const takeNext = (enforce: boolean): boolean => {
		for (let i = 0; i < remaining.length; i++) {
			const candidate = remaining[i];
			const id = getProductId(candidate);
			if (id && seen.has(id)) {
				remaining.splice(i, 1);
				i--;
				continue;
			}

			const underCap = isUnderDiversityCap(
				candidate,
				brandCount,
				categoryCount,
				subCategoryCount,
			);

			if (enforce && !underCap && hasAlternativeUnderCap(candidate)) {
				continue;
			}

			remaining.splice(i, 1);
			if (id) seen.add(id);
			recordProduct(candidate, brandCount, categoryCount, subCategoryCount);
			result.push(candidate);
			return true;
		}
		return false;
	};

	while (result.length < maxItems && remaining.length > 0) {
		if (!takeNext(enforceCapsWhileAlternativesExist)) {
			if (!takeNext(false)) break;
		}
	}

	return result;
}

/**
 * ₦0–₦120k first, then diversify brand / category / sub-category, then fill from outside band.
 */
export function orderShopHomeProducts<T extends ShopHomeProductFields>(
	products: T[],
	options: OrderShopHomeProductsOptions = {},
): T[] {
	const limit = options.limit ?? products.length;
	const randomize = options.randomize ?? false;
	if (products.length === 0 || limit <= 0) return [];

	const priceSorted = [...products].sort((a, b) => {
		const priceA = getProductFinalPriceNgn(a);
		const priceB = getProductFinalPriceNgn(b);
		const aInBand = isInShopPriorityPriceBand(priceA);
		const bInBand = isInShopPriorityPriceBand(priceB);
		if (aInBand !== bInBand) return aInBand ? -1 : 1;
		return priceA - priceB;
	});

	const inBand: T[] = [];
	const outOfBand: T[] = [];
	for (const product of priceSorted) {
		if (isInShopPriorityPriceBand(getProductFinalPriceNgn(product))) {
			inBand.push(product);
		} else {
			outOfBand.push(product);
		}
	}

	if (randomize) {
		shuffleInPlace(inBand);
		shuffleInPlace(outOfBand);
	}

	const diversifiedInBand = diversifyRoundRobinByBrand(inBand, limit, randomize);
	const slotsLeft = limit - diversifiedInBand.length;

	let result = diversifiedInBand;
	if (slotsLeft > 0) {
		const seen = new Set(
			diversifiedInBand.map((p) => getProductId(p)).filter(Boolean),
		);
		const inBandRemainder = inBand.filter((p) => {
			const id = getProductId(p);
			return !id || !seen.has(id);
		});
		const extraFromBand = diversifyWithCaps(
			inBandRemainder,
			slotsLeft,
			true,
			randomize,
		);
		result = [...result, ...extraFromBand];
	}

	const slotsAfterBand = limit - result.length;
	if (slotsAfterBand > 0 && outOfBand.length > 0) {
		const seen = new Set(result.map((p) => getProductId(p)).filter(Boolean));
		const outsidePool = outOfBand.filter((p) => {
			const id = getProductId(p);
			return !id || !seen.has(id);
		});
		result = [
			...result,
			...diversifyWithCaps(outsidePool, slotsAfterBand, false, randomize),
		];
	}

	return result.slice(0, limit);
}

/** @deprecated Use `orderShopHomeProducts` for price band + diversity. */
export function sortProductsByNgnPricePriority<T extends ShopHomeProductFields>(
	products: T[],
): T[] {
	return orderShopHomeProducts(products);
}
