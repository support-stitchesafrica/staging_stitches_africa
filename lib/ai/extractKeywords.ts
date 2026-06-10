/**
 * Extracts product category keywords from free-form title and description text.
 * Lowercases and tokenizes input, then matches against a predefined fashion vocabulary.
 */

/** Maps vendor sub-category presets to keyword tokens used by the rule engine. */
const WEAR_CATEGORY_KEYWORDS: Record<string, string[]> = {
  Accessories: ["scarf", "belt", "bag"],
  Dresses: ["dress"],
  Fabrics: ["fabric", "ankara"],
  Footwear: ["shoe", "footwear"],
  Tops: ["top", "shirt"],
  Shirts: ["shirt", "blouse"],
  Jacket: ["jacket", "coat"],
  Bags: ["bag"],
  Suits: ["suit", "set"],
  "Co-ords": ["set", "coord"],
  "Bubus and Kaftans": ["boubou", "kaftan"],
};

const FASHION_VOCABULARY = new Set([
  // footwear
  "shoe", "shoes", "sandal", "boot", "slipper", "footwear",
  // accessory
  "scarf", "belt", "tie", "cap", "hat", "bag", "purse",
  // top / outerwear
  "shirt", "blouse", "top", "polo", "tee",
  "jacket", "coat", "blazer", "leather", "parka",
  // dress
  "dress", "gown", "kaftan", "boubou",
  // two-piece
  "two-piece", "set", "suit", "coord",
  // agbada
  "agbada", "senator", "babariga",
  // fabric
  "fabric", "material", "yard", "ankara", "aso-oke",
]);

/**
 * Extracts matched fashion category keywords from product title and description.
 * @param title - Product title
 * @param description - Product description
 * @returns Array of matched category keywords
 */
export function extractKeywords(
  title: string,
  description: string,
  wearCategories: string[] = []
): string[] {
  const combined = `${title} ${description}`.toLowerCase();

  // Tokenize: split on whitespace and common punctuation, also handle hyphenated terms
  const tokens = combined.split(/[\s,./\\|;:!?()[\]{}"']+/).filter(Boolean);

  // Also check for multi-word tokens like "two-piece" and "aso-oke"
  const hyphenatedTerms = combined.match(/\b[\w]+-[\w]+\b/g) ?? [];

  const allTokens = [...tokens, ...hyphenatedTerms];

  const matched: string[] = [];
  const seen = new Set<string>();

  for (const token of allTokens) {
    if (FASHION_VOCABULARY.has(token) && !seen.has(token)) {
      matched.push(token);
      seen.add(token);
    }
  }

  for (const wear of wearCategories) {
    const mapped = WEAR_CATEGORY_KEYWORDS[wear];
    if (!mapped) continue;
    for (const kw of mapped) {
      if (!seen.has(kw)) {
        matched.push(kw);
        seen.add(kw);
      }
    }
  }

  return matched;
}
