/**
 * Search service for handling product searches with history.
 *
 * Relevance order (highest first): brand → title → tags → category → sub-categories (wear_category).
 * Within each field, stronger “letter” matches (exact / prefix / word-start / earlier substring) score higher.
 */

import { productRepository, tailorRepository } from "./firestore";
import type { Product, Tailor } from "@/types";

/** Split stored Firestore `wear_category` (comma- or semicolon-separated) into parts. */
function parseStoredWearCategories(wear: string | undefined): string[] {
	if (!wear || typeof wear !== "string") return [];
	return wear
		.split(/[,;]+/)
		.map((p) => p.trim())
		.filter(Boolean);
}

export interface SearchResult {
	enableMultiplePricing: any;
	individualItems: any;
	id: string;
	title: string;
	brandName?: string;
	productType: string;
	price: number | { base: number; currency?: string };
	images: string[];
	description?: string;
	category?: string;
	/** Sub-category stored as wear_category in Firestore */
	wear_category?: string;
	tags?: string[];
	keywords?: string[];
	tailor?: string;
}

export interface SearchHistory {
	id: string;
	query: string;
	timestamp: Date;
	resultsCount: number;
}

export interface SearchFilters {
	brandName?: string;
	productType?: string;
	category?: string;
	/** Filter by wear_category / sub-category (case-insensitive partial match). */
	wear_category?: string;
	minPrice?: number;
	maxPrice?: number;
}

/** Base scores — must stay ordered so brand > title > tags > category > sub-category */
const SCORE_BRAND = 50_000_000;
const SCORE_TITLE = 40_000_000;
const SCORE_TAG = 30_000_000;
const SCORE_CATEGORY = 20_000_000;
const SCORE_WEAR = 10_000_000;

export class SearchService {
	private static readonly SEARCH_HISTORY_KEY = "stitches_search_history";
	private static readonly MAX_HISTORY_ITEMS = 20;

	/** Prefer enriched vendor profile over stale `tailor` string on the product doc. */
	private static getProductBrandName(product: Product): string {
		const fromVendor = product.vendor?.name?.trim();
		if (fromVendor) return fromVendor;
		return (product.tailor || "").trim();
	}

	private static tailorProfileMatchesQuery(
		tailor: Tailor,
		searchQueryLower: string,
	): boolean {
		if (!searchQueryLower) return false;
		const bn = (tailor.brandName || "").toLowerCase().trim();
		if (bn.includes(searchQueryLower)) return true;
		const fn = (tailor.first_name || "").toLowerCase().trim();
		const ln = (tailor.last_name || "").toLowerCase().trim();
		const full = `${fn} ${ln}`.trim();
		if (full.includes(searchQueryLower)) return true;
		if (fn.includes(searchQueryLower)) return true;
		if (ln.includes(searchQueryLower)) return true;
		return false;
	}

	/**
	 * Vendor ids whose `tailors` profile matches the query; all their products inherit brand-tier relevance.
	 */
	private static async getTailorIdsMatchingBrandDirectory(
		searchQueryLower: string,
	): Promise<Set<string>> {
		if (!searchQueryLower) return new Set();
		try {
			const tailors = await tailorRepository.getAll();
			const ids = new Set<string>();
			for (const t of tailors as Tailor[]) {
				if (!t?.id) continue;
				if (this.tailorProfileMatchesQuery(t, searchQueryLower)) {
					ids.add(t.id);
				}
			}
			return ids;
		} catch (e) {
			console.warn("SearchService: tailors lookup failed", e);
			return new Set();
		}
	}

	/**
	 * How strongly `text` matches query `q` (lowercase). Higher = more relevant.
	 * Rewards same-string, prefix, word-start, then substring with earlier offset.
	 */
	private static letterMatchStrength(text: string, q: string): number {
		if (!text?.trim() || !q) return 0;
		const t = text.toLowerCase();
		const query = q.toLowerCase();
		if (t === query) return 9_000;
		if (t.startsWith(query)) return 8_000;
		const words = t.split(/\s+/).filter(Boolean);
		if (words.some((w) => w.startsWith(query))) return 7_000;
		const idx = t.indexOf(query);
		if (idx >= 0) return Math.max(1, 5_000 - Math.min(idx, 4_999));
		return 0;
	}

	/**
	 * Combined relevance: max of tiered field scores (brand first, then title, tags, category, wear).
	 */
	private static computeRelevance(
		product: Product,
		q: string,
		tailorIdsFromBrandMatch: Set<string>,
	): number {
		if (!q) return 0;

		let best = 0;

		const brandLine = this.getProductBrandName(product);
		const brandStrength = this.letterMatchStrength(brandLine, q);
		if (brandStrength > 0) {
			best = Math.max(best, SCORE_BRAND + brandStrength);
		}

		const tid = String(product.tailor_id || "").trim();
		if (tid && tailorIdsFromBrandMatch.has(tid)) {
			// Entire catalogue for matching vendors — strong brand signal (below explicit brand-string prefix)
			best = Math.max(best, SCORE_BRAND + 7_500);
		}

		const titleS = this.letterMatchStrength(product.title || "", q);
		if (titleS > 0) {
			best = Math.max(best, SCORE_TITLE + titleS);
		}

		const tags = Array.isArray(product.tags) ? product.tags : [];
		for (const tag of tags) {
			const s = this.letterMatchStrength(String(tag), q);
			if (s > 0) best = Math.max(best, SCORE_TAG + s);
		}

		const catS = this.letterMatchStrength(String(product.category || ""), q);
		if (catS > 0) {
			best = Math.max(best, SCORE_CATEGORY + catS);
		}

		const wearParts = parseStoredWearCategories(product.wear_category ?? "");
		for (const part of wearParts) {
			const s = this.letterMatchStrength(part, q);
			if (s > 0) best = Math.max(best, SCORE_WEAR + s);
		}

		return best;
	}

	/**
	 * Search products by query with filters
	 */
	static async searchProducts(
		query: string,
		filters: SearchFilters = {},
	): Promise<SearchResult[]> {
		try {
			// Same verified + image-enriched catalog as /shops (not unfiltered getAll)
			const products = await productRepository.getVerifiedShopListingProducts();

			const searchQueryNormalized = query.toLowerCase().trim();
			const tailorIdsFromBrandMatch =
				searchQueryNormalized.length > 0
					? await this.getTailorIdsMatchingBrandDirectory(
							searchQueryNormalized,
						)
					: new Set<string>();

			type Scored = { product: Product; relevance: number };

			const scored: Scored[] = [];

			for (const product of products) {
				if (product.availability) {
					const availability = product.availability.toLowerCase();
					if (
						availability === "out_of_stock" ||
						availability === "out of stock"
					)
						continue;
				}

				const brandFilterOk =
					!filters.brandName ||
					this.getProductBrandName(product)
						.toLowerCase()
						.includes(filters.brandName.toLowerCase());

				const typeMatch =
					!filters.productType || product.type === filters.productType;

				const categoryMatch =
					!filters.category ||
					product.category?.toLowerCase() === filters.category.toLowerCase();

				const wcFilter = filters.wear_category?.trim().toLowerCase();
				const wearCategoryMatch =
					!wcFilter ||
					(typeof product.wear_category === "string" &&
						product.wear_category.toLowerCase().includes(wcFilter));

				const productPrice =
					typeof product.price === "number"
						? product.price
						: product.price &&
							  typeof product.price === "object" &&
							  product.price.base
							? product.price.base
							: 0;

				const priceMatch =
					(!filters.minPrice || productPrice >= filters.minPrice) &&
					(!filters.maxPrice || productPrice <= filters.maxPrice);

				if (
					!brandFilterOk ||
					!typeMatch ||
					!categoryMatch ||
					!wearCategoryMatch ||
					!priceMatch
				)
					continue;

				let relevance = 0;
				if (!searchQueryNormalized) {
					relevance = 0;
				} else {
					relevance = this.computeRelevance(
						product,
						searchQueryNormalized,
						tailorIdsFromBrandMatch,
					);
					if (relevance <= 0) continue;
				}

				scored.push({ product, relevance });
			}

			const searchResults: SearchResult[] = scored
				.sort((a, b) => {
					if (searchQueryNormalized && b.relevance !== a.relevance) {
						return b.relevance - a.relevance;
					}
					const ap =
						typeof a.product.price === "number"
							? a.product.price
							: a.product.price &&
								  typeof a.product.price === "object" &&
								  a.product.price.base
								? a.product.price.base
								: 0;
					const bp =
						typeof b.product.price === "number"
							? b.product.price
							: b.product.price &&
								  typeof b.product.price === "object" &&
								  b.product.price.base
								? b.product.price.base
								: 0;
					return ap - bp;
				})
				.map(({ product }) => {
					let priceValue: number | { base: number; currency?: string };
					if (typeof product.price === "number") {
						priceValue = product.price;
					} else if (product.price && typeof product.price === "object") {
						priceValue = {
							base: product.price.base || 0,
							currency: product.price.currency || "USD",
						};
					} else {
						priceValue = 0;
					}

					return {
						enableMultiplePricing: product.enableMultiplePricing,
						individualItems: product.individualItems,
						id: product.product_id,
						title: product.title || "Untitled Product",
						brandName: this.getProductBrandName(product) || "Unknown Brand",
						productType: product.type || "unknown",
						price: priceValue,
						images: product.images || [],
						description: product.description || "",
						category: product.category || "",
						wear_category: product.wear_category || "",
						tags: product.tags || [],
						keywords: product.keywords || [],
						tailor: this.getProductBrandName(product),
					};
				});

			if (query.trim()) {
				this.saveSearchToHistory(query, searchResults.length);
			}

			return searchResults;
		} catch (error) {
			console.error("Search error:", error);
			return [];
		}
	}

	/**
	 * Suggestions: brand (tailors + listing), titles, tags, category, sub-categories — ordered loosely by priority in UI (Set order not guaranteed).
	 */
	static async getSearchSuggestions(query: string): Promise<string[]> {
		if (!query || query.length < 2) return [];

		try {
			const [products, tailors] = await Promise.all([
				productRepository.getVerifiedShopListingProducts(),
				tailorRepository.getAll(),
			]);

			const suggestions: string[] = [];
			const seen = new Set<string>();
			const push = (s: string) => {
				const t = s.trim();
				if (!t || seen.has(t.toLowerCase())) return;
				seen.add(t.toLowerCase());
				suggestions.push(t);
			};

			const searchQuery = query.toLowerCase();

			(tailors as Tailor[]).forEach((tailor) => {
				if (this.tailorProfileMatchesQuery(tailor, searchQuery)) {
					const brand = (tailor.brandName || "").trim();
					if (brand) push(brand);
				}
			});

			products.forEach((product) => {
				if (product.title && this.letterMatchStrength(product.title, searchQuery) > 0) {
					push(product.title);
				}
				const listingBrand = this.getProductBrandName(product);
				if (
					listingBrand &&
					this.letterMatchStrength(listingBrand, searchQuery) > 0
				) {
					push(listingBrand);
				}
				if (product.tags && Array.isArray(product.tags)) {
					product.tags.forEach((tag) => {
						if (this.letterMatchStrength(String(tag), searchQuery) > 0)
							push(String(tag));
					});
				}
				if (product.category && this.letterMatchStrength(product.category, searchQuery) > 0) {
					push(product.category);
				}
				if (product.wear_category) {
					parseStoredWearCategories(product.wear_category).forEach(
						(part: string) => {
							if (this.letterMatchStrength(part, searchQuery) > 0) push(part);
						},
					);
				}
			});

			return suggestions.slice(0, 8);
		} catch (error) {
			console.error("Error getting search suggestions:", error);
			const fallbackSuggestions = [
				"Ankara dress",
				"Agbada",
				"Kente cloth",
				"Dashiki",
				"Traditional wear",
				"Ready to wear",
				"Bespoke tailoring",
				"Wedding dress",
			];

			return fallbackSuggestions
				.filter((suggestion) =>
					suggestion.toLowerCase().includes(query.toLowerCase()),
				)
				.slice(0, 8);
		}
	}

	/**
	 * Save search query to history
	 */
	static saveSearchToHistory(query: string, resultsCount: number): void {
		if (typeof window === "undefined") return;

		try {
			const history = this.getSearchHistory();

			const filteredHistory = history.filter(
				(item) => item.query.toLowerCase() !== query.toLowerCase(),
			);

			const newEntry: SearchHistory = {
				id: Date.now().toString(),
				query: query.trim(),
				timestamp: new Date(),
				resultsCount,
			};

			const updatedHistory = [newEntry, ...filteredHistory].slice(
				0,
				this.MAX_HISTORY_ITEMS,
			);

			localStorage.setItem(
				this.SEARCH_HISTORY_KEY,
				JSON.stringify(updatedHistory),
			);
		} catch (error) {
			console.error("Error saving search history:", error);
		}
	}

	/**
	 * Get search history
	 */
	static getSearchHistory(): SearchHistory[] {
		if (typeof window === "undefined") return [];

		try {
			const stored = localStorage.getItem(this.SEARCH_HISTORY_KEY);
			if (!stored) return [];

			const history = JSON.parse(stored);
		return history.map((item: any) => ({
			...item,
			timestamp: new Date(item.timestamp),
		}));
		} catch (error) {
			console.error("Error loading search history:", error);
			return [];
		}
	}

	/**
	 * Clear search history
	 */
	static clearSearchHistory(): void {
		if (typeof window === "undefined") return;

		try {
			localStorage.removeItem(this.SEARCH_HISTORY_KEY);
		} catch (error) {
			console.error("Error clearing search history:", error);
		}
	}

	/**
	 * Remove specific search from history
	 */
	static removeSearchFromHistory(searchId: string): void {
		if (typeof window === "undefined") return;

		try {
			const history = this.getSearchHistory();
			const updatedHistory = history.filter((item) => item.id !== searchId);

			localStorage.setItem(
				this.SEARCH_HISTORY_KEY,
				JSON.stringify(updatedHistory),
			);
		} catch (error) {
			console.error("Error removing search from history:", error);
		}
	}

	/**
	 * Get popular searches (mock data)
	 */
	static getPopularSearches(): string[] {
		return [
			"Ankara dress",
			"Traditional wear",
			"Wedding attire",
			"Casual African wear",
			"Bespoke suits",
			"Kente accessories",
			"Modern African fashion",
			"Ready to wear",
		];
	}

	/**
	 * Get search categories
	 */
	static getSearchCategories(): Array<{ id: string; name: string; count?: number }> {
		return [
			{ id: "dresses", name: "Dresses", count: 45 },
			{ id: "traditional", name: "Traditional Wear", count: 32 },
			{ id: "casual", name: "Casual Wear", count: 28 },
			{ id: "formal", name: "Formal Wear", count: 19 },
			{ id: "accessories", name: "Accessories", count: 15 },
			{ id: "footwear", name: "Footwear", count: 12 },
		];
	}

	/**
	 * Format search query for display
	 */
	static formatSearchQuery(query: string): string {
		return query.trim().replace(/\s+/g, " ");
	}

	/**
	 * Check if query is valid
	 */
	static isValidQuery(query: string): boolean {
		return query.trim().length >= 2;
	}
}
