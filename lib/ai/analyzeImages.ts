import type { DimensionEstimate } from "./estimateDimensions";

/**
 * Analyzes product image URLs to optionally refine a base dimension estimate.
 * Uses lightweight heuristics (aspect ratio analysis) as a secondary signal.
 * Always returns a valid estimate — never throws.
 */
export async function analyzeImages(
  imageUrls: string[],
  baseEstimate: DimensionEstimate
): Promise<DimensionEstimate> {
  try {
    if (!imageUrls || imageUrls.length === 0) {
      return baseEstimate;
    }

    // Lightweight heuristic: attempt to infer aspect ratio from the first image URL.
    // In the absence of a server-side image processing library, we rely on URL patterns
    // or metadata hints. If analysis is inconclusive, return the base estimate unchanged.
    const firstUrl = imageUrls[0];
    if (!firstUrl || typeof firstUrl !== "string") {
      return baseEstimate;
    }

    // Heuristic: check for common portrait/landscape URL hints (e.g. Cloudinary transforms)
    // Portrait images (tall) suggest garments; landscape/square suggest accessories or fabric.
    // This is intentionally conservative — only adjust when signal is clear.
    const isLikelyPortrait = /[_-](portrait|tall|h\d{3,4}[_x]w\d{2,3})[_-]/i.test(firstUrl);
    const isLikelyLandscape = /[_-](landscape|wide|w\d{3,4}[_x]h\d{2,3})[_-]/i.test(firstUrl);

    if (isLikelyPortrait || isLikelyLandscape) {
      // Signal is present but not strong enough to override keyword-based estimate.
      // Return base estimate — image analysis is a future extension point.
      return baseEstimate;
    }

    // Inconclusive — return base estimate unchanged
    return baseEstimate;
  } catch {
    // Never throw — always return a valid estimate
    return baseEstimate;
  }
}
