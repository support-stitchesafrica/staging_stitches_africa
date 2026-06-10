import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import {
	getMintsoftSkuFromCartItem,
	readMintsoftSkuFromData,
} from "@/lib/integrations/mintsoft/mintsoft-fields";
import type { CartLikeForUnity } from "@/lib/integrations/mintsoft/unityCup";

const TAILOR_WORKS = "tailor_works";

async function loadMintsoftSkuFromTailorWorks(
	productId: string,
): Promise<string> {
	const id = productId.trim();
	if (!id) return "";

	const byDocId = await adminDb.collection(TAILOR_WORKS).doc(id).get();
	if (byDocId.exists) {
		const sku = readMintsoftSkuFromData(byDocId.data());
		if (sku) return sku;
	}

	const byProductId = await adminDb
		.collection(TAILOR_WORKS)
		.where("product_id", "==", id)
		.limit(1)
		.get();
	if (!byProductId.empty) {
		return readMintsoftSkuFromData(byProductId.docs[0].data());
	}

	return "";
}

/** Ensures each line has `mintsoft_sku` (cart, product embed, or Firestore). Server-only. */
export async function resolveMintsoftSkusForUnityItems(
	items: CartLikeForUnity[],
): Promise<{ sku: string; item: CartLikeForUnity }[]> {
	const resolved: { sku: string; item: CartLikeForUnity }[] = [];

	for (const item of items) {
		let sku = getMintsoftSkuFromCartItem(item);
		if (!sku && item.product_id) {
			sku = await loadMintsoftSkuFromTailorWorks(item.product_id);
		}
		resolved.push({ sku, item });
	}

	return resolved;
}

/**
 * Fills missing `mintsoft_sku` / `sku` on push-order JSON items from `tailor_works`.
 * Call from API routes only.
 */
export async function enrichMintsoftRequestBodyItems(
	body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
	const itemsRaw = (body.items ??
		body.cartItems ??
		body.cart_items ??
		body.lineItems) as unknown;
	if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
		return body;
	}

	const cartLike: CartLikeForUnity[] = itemsRaw.map((raw) => {
		const row = raw as Record<string, unknown>;
		return {
			product_id: String(row.product_id ?? row.productId ?? ""),
			price: Number(row.price ?? row.unitPrice ?? 0),
			quantity: Number(row.quantity ?? row.qty ?? 1),
			tailor_id: String(row.tailor_id ?? row.tailorId ?? ""),
			mintsoft_sku:
				typeof row.mintsoft_sku === "string"
					? row.mintsoft_sku
					: typeof row.mintsoftSku === "string"
						? row.mintsoftSku
						: undefined,
		};
	});

	const resolved = await resolveMintsoftSkusForUnityItems(cartLike);
	const enrichedItems = itemsRaw.map((raw, i) => {
		const row = { ...(raw as Record<string, unknown>) };
		const sku = resolved[i]?.sku;
		if (sku) {
			row.mintsoft_sku = sku;
			row.sku = sku;
		}
		return row;
	});

	return { ...body, items: enrichedItems };
}
