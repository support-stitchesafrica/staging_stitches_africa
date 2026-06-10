import type { CartLikeForUnity } from "@/lib/integrations/mintsoft/unityCup";

/** Firestore field on `tailor_works` — warehouse SKU (Mission Logix / Mintsoft). */
export const MINTSOFT_SKU_FIELD = "mintsoft_sku";

export function readMintsoftSkuFromData(
	data: Record<string, unknown> | null | undefined,
): string {
	if (!data) return "";
	const raw = data[MINTSOFT_SKU_FIELD] ?? data.mintsoftSku;
	return typeof raw === "string" ? raw.trim() : "";
}

/** SKU from cart line or embedded product — does not read `product_id`. */
export function getMintsoftSkuFromCartItem(item: CartLikeForUnity): string {
	const onItem = (item as { mintsoft_sku?: string }).mintsoft_sku;
	if (typeof onItem === "string" && onItem.trim()) {
		return onItem.trim();
	}
	const product = item.product as Record<string, unknown> | null | undefined;
	return readMintsoftSkuFromData(product ?? undefined);
}

export function formatMissingMintsoftSkuError(
	missing: { product_id: string; title?: string }[],
): string {
	const lines = missing.map((m) =>
		m.title?.trim() ? `${m.product_id} (${m.title})` : m.product_id,
	);
	return `Mission Logix items missing ${MINTSOFT_SKU_FIELD} on tailor_works: ${lines.join(", ")}`;
}
