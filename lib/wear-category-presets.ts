/**
 * Fixed sub-category options stored on products as `wear_category`
 * (aligned with vendor product create flow).
 */
export const WEAR_CATEGORY_PRESETS = [
	{
		value: "Accessories",
		hint: "Jewelry, shoes, key holder, caps, belts, underwear, scarves",
	},
	{ value: "Dresses", hint: "Bubu, corporate, prom" },
	{
		value: "Fabrics",
		hint: "Aso-oke, Ankara, cotton, linen, crochet, brocade",
	},
	{
		value: "Footwear",
		hint: "Shoes, sandals, boots, slippers",
	},
	{ value: "Tops", hint: "" },
	{ value: "Shorts", hint: "" },
	{ value: "Shirts", hint: "shirts, blouses, t-shirts, polo shirts, hoodies, sweaters, cardigans" },
	{ value: "Bags", hint: "leather bags, beaded bags, travelling bags" },
	{ value: "Pants", hint: "underwear, tights, leggings" },
	{ value: "Jacket", hint: "Kimonos" },
	{ value: "Suits", hint: "" },
	{ value: "Skirts", hint: "" },
	{ value: "Bubus and Kaftans", hint: "" },
	{ value: "Jumpsuits", hint: "" },
	{ value: "Co-ords", hint: "" },
] as const;

export const WEAR_CATEGORY_PRESET_VALUES = new Set<string>(
	WEAR_CATEGORY_PRESETS.map((p) => p.value),
);

export const WEAR_CATEGORY_CUSTOM_SENTINEL = "__custom_sub_category__" as const;

/** Split vendor-stored lists: comma or semicolon, optional whitespace */
const WEAR_CAT_SPLIT = /\s*[,;]\s*/;

function dedupePreserveOrder(parts: string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const p of parts) {
		if (seen.has(p)) continue;
		seen.add(p);
		out.push(p);
	}
	return out;
}

/** Parse `wear_category` from Firestore (string, comma-separated, or string[]). */
export function parseStoredWearCategories(raw: unknown): string[] {
	if (raw == null) return [];
	if (Array.isArray(raw)) {
		const parts = raw.flatMap((x) => {
			if (typeof x !== "string") return [];
			return x
				.split(WEAR_CAT_SPLIT)
				.map((s) => s.trim())
				.filter(Boolean);
		});
		return dedupePreserveOrder(parts);
	}
	if (typeof raw === "string") {
		return dedupePreserveOrder(
			raw
				.split(WEAR_CAT_SPLIT)
				.map((s) => s.trim())
				.filter(Boolean),
		);
	}
	return [];
}

const PRESET_ORDER = new Map(
	WEAR_CATEGORY_PRESETS.map((p, i) => [p.value, i] as const),
);

/** Sort presets in catalog order; unknown labels sort last. */
export function sortWearCategories(cats: string[]): string[] {
	return [...cats].sort(
		(a, b) => (PRESET_ORDER.get(a) ?? 999) - (PRESET_ORDER.get(b) ?? 999),
	);
}

/** Serialize multiple sub-categories for `wear_category` (comma-separated). */
export function serializeWearCategories(cats: string[]): string {
	return dedupePreserveOrder(cats).join(", ");
}

/** Stable string for comparisons (sorted preset order; deduped). */
export function canonicalWearCategoriesString(raw: unknown): string {
	const parsed = parseStoredWearCategories(raw);
	return serializeWearCategories(sortWearCategories(parsed));
}

/** Checked preset subset for admin multi-select UI. */
export function presetSelectionFromStored(stored: string): string[] {
	return sortWearCategories(
		parseStoredWearCategories(stored).filter((s) =>
			WEAR_CATEGORY_PRESET_VALUES.has(s),
		),
	);
}

export function storedHasNonPresetWearCategories(stored: string): boolean {
	return parseStoredWearCategories(stored).some(
		(s) => !WEAR_CATEGORY_PRESET_VALUES.has(s),
	);
}
