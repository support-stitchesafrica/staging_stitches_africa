import type { SizeRegion } from '@/types/size-guide';

// ─── Static Conversion Tables ────────────────────────────────────────────────
// Requirements: 3.2, 3.3

/**
 * UK shoe size → EU equivalent (standard conversion).
 * Used to validate and suggest EU values when a UK size is entered.
 */
const UK_TO_EU: Record<number, number> = {
  1: 33, 2: 34, 3: 36, 4: 37, 5: 38, 6: 39, 7: 40,
  8: 42, 9: 43, 10: 44, 11: 45, 12: 46, 13: 47, 14: 48,
};

/**
 * UK shoe size → US men's equivalent.
 */
const UK_TO_US_MENS: Record<number, number> = {
  1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8,
  8: 9, 9: 10, 10: 11, 11: 12, 12: 13, 13: 14, 14: 15,
};

/**
 * UK shoe size → AU equivalent (same as US mens for most sizes).
 */
const UK_TO_AU: Record<number, number> = UK_TO_US_MENS;

/**
 * UK shoe size → JP equivalent (approximate, in mm).
 */
const UK_TO_JP: Record<number, number> = {
  1: 210, 2: 215, 3: 220, 4: 225, 5: 235, 6: 240, 7: 245,
  8: 255, 9: 260, 10: 265, 11: 270, 12: 275, 13: 280, 14: 285,
};

/**
 * UK shoe size → CN equivalent (same scale as EU for most purposes).
 */
const UK_TO_CN: Record<number, number> = UK_TO_EU;

// ─── Clothing Size Conversions ───────────────────────────────────────────────

/**
 * Clothing label → EU numeric equivalent.
 * Covers standard XS–5XL range.
 */
const CLOTHING_LABEL_TO_EU: Record<string, number> = {
  XS: 32, S: 36, M: 38, L: 40, XL: 42, XXL: 44, '2XL': 44,
  XXXL: 46, '3XL': 46, '4XL': 48, '5XL': 50,
};

/**
 * EU clothing size → US equivalent.
 */
const EU_CLOTHING_TO_US: Record<number, number> = {
  32: 2, 34: 4, 36: 6, 38: 8, 40: 10, 42: 12, 44: 14,
  46: 16, 48: 18, 50: 20,
};

/**
 * EU clothing size → UK equivalent.
 */
const EU_CLOTHING_TO_UK: Record<number, number> = {
  32: 4, 34: 6, 36: 8, 38: 10, 40: 12, 42: 14, 44: 16,
  46: 18, 48: 20, 50: 22,
};

/**
 * EU clothing size → AU equivalent (same as UK for women's; +2 for men's).
 * Using women's standard here as the common case.
 */
const EU_CLOTHING_TO_AU: Record<number, number> = EU_CLOTHING_TO_UK;

// ─── Public Helper ───────────────────────────────────────────────────────────

export interface RegionSuggestion {
  region: SizeRegion;
  suggestedValue: string;
}

/**
 * Given a source region and a size value, returns suggested equivalent values
 * for all other regions based on standard conversion tables.
 *
 * For shoes: `value` should be the numeric UK size (as a string or number).
 * For clothing: `value` should be a label like 'S', 'M', or a numeric EU size.
 *
 * Returns an empty array when no conversion is available.
 *
 * Requirements: 3.2
 */
export function suggestRegionConversions(
  sourceRegion: SizeRegion,
  value: string | number,
): RegionSuggestion[] {
  const suggestions: RegionSuggestion[] = [];

  // ── Shoe conversions (source = UK numeric size) ──────────────────────────
  if (sourceRegion === 'UK') {
    const ukSize = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(ukSize)) {
      if (UK_TO_EU[ukSize] !== undefined)
        suggestions.push({ region: 'EU', suggestedValue: String(UK_TO_EU[ukSize]) });
      if (UK_TO_US_MENS[ukSize] !== undefined)
        suggestions.push({ region: 'US', suggestedValue: String(UK_TO_US_MENS[ukSize]) });
      if (UK_TO_AU[ukSize] !== undefined)
        suggestions.push({ region: 'AU', suggestedValue: String(UK_TO_AU[ukSize]) });
      if (UK_TO_JP[ukSize] !== undefined)
        suggestions.push({ region: 'JP', suggestedValue: String(UK_TO_JP[ukSize]) });
      if (UK_TO_CN[ukSize] !== undefined)
        suggestions.push({ region: 'CN', suggestedValue: String(UK_TO_CN[ukSize]) });
    }
    return suggestions;
  }

  // ── Clothing conversions (source = EU numeric size or label) ────────────
  let euSize: number | undefined;

  if (sourceRegion === 'EU') {
    euSize = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(euSize)) euSize = undefined;
  } else if (sourceRegion === 'US') {
    // Reverse-lookup US → EU
    const usVal = typeof value === 'string' ? parseFloat(value) : value;
    const found = Object.entries(EU_CLOTHING_TO_US).find(([, us]) => us === usVal);
    if (found) euSize = Number(found[0]);
  } else if (sourceRegion === 'AU') {
    // Reverse-lookup AU → EU (AU uses same table as UK for clothing)
    const auVal = typeof value === 'string' ? parseFloat(value) : value;
    const found = Object.entries(EU_CLOTHING_TO_AU).find(([, au]) => au === auVal);
    if (found) euSize = Number(found[0]);
  }

  // Also handle label-based input (e.g. 'S', 'M')
  if (euSize === undefined && typeof value === 'string') {
    euSize = CLOTHING_LABEL_TO_EU[value.toUpperCase()];
  }

  if (euSize !== undefined && !isNaN(euSize)) {
    if (sourceRegion !== 'EU')
      suggestions.push({ region: 'EU', suggestedValue: String(euSize) });
    if (sourceRegion !== 'US' && EU_CLOTHING_TO_US[euSize] !== undefined)
      suggestions.push({ region: 'US', suggestedValue: String(EU_CLOTHING_TO_US[euSize]) });
    // UK clothing suggestions (always included here since UK shoe path returned early)
    if (EU_CLOTHING_TO_UK[euSize] !== undefined)
      suggestions.push({ region: 'UK', suggestedValue: String(EU_CLOTHING_TO_UK[euSize]) });
    if (sourceRegion !== 'AU' && EU_CLOTHING_TO_AU[euSize] !== undefined)
      suggestions.push({ region: 'AU', suggestedValue: String(EU_CLOTHING_TO_AU[euSize]) });
  }

  return suggestions;
}

/**
 * Returns the standard EU equivalent for a given UK shoe size.
 * Used by the validation engine to check ±2 tolerance (Requirement 3.3, Property 9).
 */
export function getStandardEUForUKShoe(ukSize: number): number | undefined {
  return UK_TO_EU[ukSize];
}
