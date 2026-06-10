import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import {
	mintsoftGetStockLevels,
	mintsoftGetStockLevelsUpdatedSince,
} from "@/lib/integrations/mintsoft/api";
import type { MintsoftStockLevel } from "@/lib/integrations/mintsoft/types-api";
import { readMintsoftSkuFromData } from "@/lib/integrations/mintsoft/mintsoft-fields";
import { UNITY_CUP_VENDOR_IDS } from "@/lib/integrations/mintsoft/unityCup";

const TAILOR_WORKS = "tailor_works";
const SYNC_STATE_DOC = "integrations/mintsoft";

function sellableQuantity(level: MintsoftStockLevel): number {
	const qty = level.TotalStockLevel ?? level.Level ?? 0;
	return Math.max(0, Number(qty) || 0);
}

function availabilityFromQty(qty: number): "in_stock" | "out_of_stock" {
	return qty > 0 ? "in_stock" : "out_of_stock";
}

async function loadUnityCupProducts(): Promise<
	{
		id: string;
		product_id: string;
		mintsoft_sku: string;
		data: FirebaseFirestore.DocumentData;
	}[]
> {
	const byId = new Map<
		string,
		{
			id: string;
			product_id: string;
			mintsoft_sku: string;
			data: FirebaseFirestore.DocumentData;
		}
	>();

	for (const vendorId of UNITY_CUP_VENDOR_IDS) {
		const snap = await adminDb
			.collection(TAILOR_WORKS)
			.where("tailor_id", "==", vendorId)
			.get();
		for (const doc of snap.docs) {
			const data = doc.data();
			const mintsoft_sku = readMintsoftSkuFromData(data);
			if (!mintsoft_sku) continue;

			byId.set(doc.id, {
				id: doc.id,
				product_id: String(data.product_id || doc.id),
				mintsoft_sku,
				data,
			});
		}
	}

	return [...byId.values()];
}

async function stockBySku(skus: string[]): Promise<Map<string, number>> {
	const map = new Map<string, number>();
	await Promise.all(
		skus.map(async (sku) => {
			try {
				const levels = await mintsoftGetStockLevels({ sku });
				const total = levels.reduce((sum, l) => sum + sellableQuantity(l), 0);
				map.set(sku, total);
			} catch (err) {
				console.warn("[Mintsoft] stock lookup failed for SKU", sku, err);
			}
		}),
	);
	return map;
}

async function updateProductStock(
	docId: string,
	productData: FirebaseFirestore.DocumentData,
	qty: number,
): Promise<boolean> {
	const availability = availabilityFromQty(qty);
	const updates: Record<string, unknown> = {
		wear_quantity: qty,
		availability,
		mintsoft_stock_level: qty,
		mintsoft_stock_synced_at: FieldValue.serverTimestamp(),
		updated_at: FieldValue.serverTimestamp(),
	};

	const rtwSizes = productData.rtwOptions?.sizes;
	if (Array.isArray(rtwSizes) && rtwSizes.length > 0) {
		const first = rtwSizes[0];
		if (typeof first === "object" && first !== null) {
			const clone = rtwSizes.map(
				(s: { label?: string; size?: string; quantity?: number }, i: number) =>
					i === 0
						? { ...s, quantity: qty }
						: { ...s, quantity: 0 },
			);
			updates["rtwOptions.sizes"] = clone;
		}
	}

	const sizes = productData.sizes;
	if (Array.isArray(sizes) && sizes.length > 0) {
		const clone = sizes.map(
			(
				s: string | { label?: string; size?: string; quantity?: number },
				i: number,
			) => {
				if (typeof s === "string") return i === 0 ? s : s;
				return i === 0 ? { ...s, quantity: qty } : { ...s, quantity: 0 };
			},
		);
		updates.sizes = clone;
	}

	await adminDb.collection(TAILOR_WORKS).doc(docId).update(updates);
	return true;
}

export type InventorySyncResult = {
	updated: number;
	skipped: number;
	errors: string[];
};

/** Pull Mintsoft stock levels and update merch `tailor_works` with a `mintsoft_sku` field set. */
export async function syncUnityCupInventoryFromMintsoft(options?: {
	sinceIso?: string;
}): Promise<InventorySyncResult> {
	const products = await loadUnityCupProducts();
	const result: InventorySyncResult = { updated: 0, skipped: 0, errors: [] };

	if (products.length === 0) {
		return result;
	}

	let skusToSync = products.map((p) => p.mintsoft_sku);

	if (options?.sinceIso) {
		try {
			const changedIds = await mintsoftGetStockLevelsUpdatedSince(
				options.sinceIso,
			);
			if (changedIds.length > 0) {
				const allLevels = await mintsoftGetStockLevels();
				const changedSkus = new Set(
					allLevels
						.filter((l) => l.ProductId && changedIds.includes(l.ProductId))
						.map((l) => l.SKU)
						.filter(Boolean) as string[],
				);
				skusToSync = products
					.map((p) => p.mintsoft_sku)
					.filter((sku) => changedSkus.has(sku));
			}
		} catch (err) {
			console.warn(
				"[Mintsoft] UpdatedSince failed, syncing all Unity SKUs:",
				err,
			);
		}
	}

	const stockMap = await stockBySku(skusToSync);

	for (const product of products) {
		if (!skusToSync.includes(product.mintsoft_sku)) {
			result.skipped += 1;
			continue;
		}
		if (!stockMap.has(product.mintsoft_sku)) {
			result.skipped += 1;
			continue;
		}
		try {
			const qty = stockMap.get(product.mintsoft_sku) ?? 0;
			await updateProductStock(product.id, product.data, qty);
			result.updated += 1;
		} catch (err) {
			result.errors.push(
				`${product.mintsoft_sku} (${product.product_id}): ${err instanceof Error ? err.message : "update failed"}`,
			);
		}
	}

	await adminDb.doc(SYNC_STATE_DOC).set(
		{
			lastInventorySyncAt: FieldValue.serverTimestamp(),
			lastInventorySyncSince: options?.sinceIso ?? null,
			lastInventorySyncUpdated: result.updated,
		},
		{ merge: true },
	);

	return result;
}
