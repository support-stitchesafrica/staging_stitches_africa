/**
 * Unified product availability / stock resolution for shop listing and PDP.
 * Listing cards previously only read `availability`; PDP also used `in_stock` and per-size qty.
 */

import type { Product } from "@/types";

export type ProductAvailabilityStatus =
	| "in_stock"
	| "pre_order"
	| "out_of_stock";

function normalizeAvailabilityToken(
	value: unknown,
): ProductAvailabilityStatus | null {
	if (value == null || value === "") return null;
	const s = String(value)
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "_");
	if (s === "in_stock" || s === "instock") return "in_stock";
	if (s === "pre_order" || s === "preorder") return "pre_order";
	if (s === "out_of_stock" || s === "outofstock") return "out_of_stock";
	return null;
}

function getSizeRowLabel(row: unknown): string | undefined {
	if (typeof row !== "object" || row === null) return undefined;
	const o = row as Record<string, unknown>;
	const v = o.label ?? o.size ?? o.name;
	const s = v === undefined || v === null ? "" : String(v).trim();
	return s || undefined;
}

function qtyFromSizeRow(row: unknown): number | undefined {
	if (typeof row === "string") return undefined;
	if (typeof row !== "object" || row === null) return undefined;
	const q = (row as { quantity?: unknown }).quantity;
	if (q === undefined || q === null) return undefined;
	return Number(q) || 0;
}

/** Sum quantities across all size rows when size-level inventory exists. */
export function getTotalSizeStock(product: Product): number | null {
	const p = product as Product & {
		inventory?: Record<string, number>;
		stock?: Record<string, number>;
	};

	const sizeArrays: unknown[] = [
		product.sizes,
		product.rtwOptions?.sizes,
		p.userSizes,
		p.userCustomSizes,
		p.customSizes,
	].filter(Boolean);

	let total = 0;
	let foundSizeRows = false;

	for (const arr of sizeArrays) {
		if (!Array.isArray(arr)) continue;
		for (const row of arr) {
			const qty = qtyFromSizeRow(row);
			if (qty !== undefined) {
				foundSizeRows = true;
				total += qty;
			}
		}
	}

	if (foundSizeRows) return total;

	if (p.inventory && typeof p.inventory === "object") {
		const values = Object.values(p.inventory).map((v) => Number(v) || 0);
		if (values.length > 0) return values.reduce((a, b) => a + b, 0);
	}

	if (p.stock && typeof p.stock === "object" && !Array.isArray(p.stock)) {
		const values = Object.values(p.stock).map((v) => Number(v) || 0);
		if (values.length > 0) return values.reduce((a, b) => a + b, 0);
	}

	return null;
}

/**
 * Single source of truth for shop availability badges and filters.
 */
export function resolveProductAvailability(
	product: Product,
): ProductAvailabilityStatus {
	const p = product as Product & { in_stock?: unknown; skipStockCheck?: boolean };

	if (p.skipStockCheck) return "in_stock";

	const fromAvailability = normalizeAvailabilityToken(product.availability);
	const fromInStock = normalizeAvailabilityToken(p.in_stock);

	const sizeTotal = getTotalSizeStock(product);
	if (sizeTotal !== null) {
		if (sizeTotal > 0) {
			if (
				fromAvailability === "pre_order" ||
				fromInStock === "pre_order"
			) {
				return "pre_order";
			}
			return "in_stock";
		}
		if (fromAvailability === "pre_order" || fromInStock === "pre_order") {
			return "pre_order";
		}
		return "out_of_stock";
	}

	if (product.wear_quantity !== undefined && product.wear_quantity !== null) {
		const wq = Number(product.wear_quantity);
		if (wq > 0) {
			if (
				fromAvailability === "pre_order" ||
				fromInStock === "pre_order"
			) {
				return "pre_order";
			}
			return "in_stock";
		}
		if (wq === 0) {
			if (fromAvailability === "pre_order" || fromInStock === "pre_order") {
				return "pre_order";
			}
			return "out_of_stock";
		}
	}

	return fromInStock ?? fromAvailability ?? "in_stock";
}

/** PDP badge: honors legacy `low_stock` on `in_stock` when present. */
export function getProductStockDisplayStatus(
	product: Product,
): ProductAvailabilityStatus | "low_stock" {
	const p = product as Product & { in_stock?: unknown };
	const raw = String(p.in_stock ?? product.availability ?? "")
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "_");
	if (raw === "low_stock" || raw === "lowstock") {
		return "low_stock";
	}
	return resolveProductAvailability(product);
}

export function isProductInStock(product: Product): boolean {
	return resolveProductAvailability(product) === "in_stock";
}
