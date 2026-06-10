/**
 * Maps extracted product keywords to dimension estimates using a category keyword map.
 */

export interface DimensionEstimate {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  volumetricWeight: number;
  chargeableWeight: number;
  confidenceScore: number;
  matchedCategory: string;
}

interface CategoryEntry {
  keywords: string[];
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  confidenceScore: number;
  category: string;
}

// Priority-ordered category keyword map
const CATEGORY_MAP: CategoryEntry[] = [
  {
    category: "footwear",
    keywords: ["shoe", "shoes", "sandal", "boot", "slipper", "footwear"],
    lengthCm: 35,
    widthCm: 25,
    heightCm: 15,
    actualWeightKg: 1.2,
    confidenceScore: 0.85,
  },
  {
    category: "accessory",
    keywords: ["scarf", "belt", "tie", "cap", "hat", "bag", "purse"],
    lengthCm: 20, widthCm: 15, heightCm: 5,
    actualWeightKg: 0.5,
    confidenceScore: 0.85,
  },
  {
    category: "top",
    keywords: ["shirt", "blouse", "top", "polo", "tee"],
    lengthCm: 30, widthCm: 25, heightCm: 5,
    actualWeightKg: 0.8,
    confidenceScore: 0.85,
  },
  {
    category: "jacket",
    keywords: ["jacket", "coat", "blazer", "leather", "parka", "bomber"],
    lengthCm: 50,
    widthCm: 40,
    heightCm: 12,
    actualWeightKg: 2.2,
    confidenceScore: 0.85,
  },
  {
    category: "dress",
    keywords: ["dress", "gown", "kaftan", "boubou"],
    lengthCm: 40, widthCm: 30, heightCm: 8,
    actualWeightKg: 1.5,
    confidenceScore: 0.85,
  },
  {
    category: "two-piece",
    keywords: ["two-piece", "set", "suit", "coord"],
    lengthCm: 45, widthCm: 35, heightCm: 10,
    actualWeightKg: 2.5,
    confidenceScore: 0.85,
  },
  {
    category: "agbada",
    keywords: ["agbada", "senator", "babariga"],
    lengthCm: 55, widthCm: 45, heightCm: 15,
    actualWeightKg: 4.0,
    confidenceScore: 0.80,
  },
  {
    category: "fabric",
    keywords: ["fabric", "material", "yard", "ankara", "aso-oke"],
    lengthCm: 50, widthCm: 40, heightCm: 10,
    actualWeightKg: 3.0,
    confidenceScore: 0.80,
  },
];

const DEFAULT_ESTIMATE: Omit<DimensionEstimate, "volumetricWeight" | "chargeableWeight"> = {
  lengthCm: 30,
  widthCm: 25,
  heightCm: 10,
  actualWeightKg: 2.5,
  confidenceScore: 0.40,
  matchedCategory: "default",
};

export function buildDimensionEstimate(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  actualWeightKg: number,
  confidenceScore: number,
  matchedCategory: string
): DimensionEstimate {
  const volumetricWeight =
    Math.round(((lengthCm * widthCm * heightCm) / 5000) * 100) / 100;
  const chargeableWeight =
    Math.round(Math.max(actualWeightKg, volumetricWeight) * 100) / 100;
  return { lengthCm, widthCm, heightCm, actualWeightKg, volumetricWeight, chargeableWeight, confidenceScore, matchedCategory };
}

/**
 * Maps extracted keywords to a DimensionEstimate.
 * Iterates the category map in priority order and returns the first match.
 * Falls back to the medium default tier if no keyword matches.
 */
export function estimateDimensions(keywords: string[]): DimensionEstimate {
  const keywordSet = new Set(keywords);

  for (const entry of CATEGORY_MAP) {
    const matched = entry.keywords.some((kw) => keywordSet.has(kw));
    if (matched) {
      return buildDimensionEstimate(
        entry.lengthCm,
        entry.widthCm,
        entry.heightCm,
        entry.actualWeightKg,
        entry.confidenceScore,
        entry.category
      );
    }
  }

  // Default fallback — medium tier
  return buildDimensionEstimate(
    DEFAULT_ESTIMATE.lengthCm,
    DEFAULT_ESTIMATE.widthCm,
    DEFAULT_ESTIMATE.heightCm,
    DEFAULT_ESTIMATE.actualWeightKg,
    DEFAULT_ESTIMATE.confidenceScore,
    DEFAULT_ESTIMATE.matchedCategory
  );
}
