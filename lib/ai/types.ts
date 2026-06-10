/**
 * Input for product shipping dimension estimation (API + OpenAI).
 */
export interface DimensionAnalysisInput {
  title?: string;
  description?: string;
  imageUrls?: string[];
  productType?: "bespoke" | "ready-to-wear" | "";
  category?: "men" | "women" | "kids" | "unisex" | "";
  wearCategories?: string[];
  sizes?: string[];
  sizingApproach?: "clothing" | "footwear" | "";
}
