/**
 * Orchestrates dimension estimation: OpenAI (with images) first, rule-based fallback.
 */

import { extractKeywords } from "@/lib/ai/extractKeywords";
import { estimateDimensions } from "@/lib/ai/estimateDimensions";
import { analyzeDimensionsWithOpenAI } from "@/lib/ai/openai-dimension-analyzer";
import type { DimensionAnalysisInput } from "@/lib/ai/types";
import type { DimensionEstimate } from "@/lib/ai/estimateDimensions";
import { countVisionImageUrls } from "@/lib/ai/vision-image-urls";
import { sanitizeToFashionEstimate } from "@/lib/ai/sanitize-dimensions";

export type DimensionEstimateSource = "openai" | "rule-based";

export interface DimensionEstimateResult {
  estimate: DimensionEstimate;
  source: DimensionEstimateSource;
  reason?: string;
}

function logContext(input: DimensionAnalysisInput) {
  return {
    title: input.title?.trim().slice(0, 80) || null,
    imagesReceived: input.imageUrls?.length ?? 0,
    imagesVisionReady: countVisionImageUrls(input.imageUrls),
    productType: input.productType || null,
    category: input.category || null,
    wearCategories: input.wearCategories ?? [],
    sizingApproach: input.sizingApproach || null,
  };
}

function inferSizingApproach(
  input: DimensionAnalysisInput
): "clothing" | "footwear" | "" {
  if (input.sizingApproach === "footwear" || input.sizingApproach === "clothing") {
    return input.sizingApproach;
  }
  const wear = input.wearCategories ?? [];
  if (wear.includes("Footwear")) return "footwear";
  return "";
}

function ruleBasedEstimate(input: DimensionAnalysisInput): DimensionEstimate {
  const wear = input.wearCategories ?? [];
  let keywords = extractKeywords(
    input.title ?? "",
    input.description ?? "",
    wear
  );

  if (inferSizingApproach(input) === "footwear" && !keywords.includes("shoe")) {
    keywords = [...keywords, "shoe"];
  }

  const raw = estimateDimensions(keywords);
  return (
    sanitizeToFashionEstimate({
      lengthCm: raw.lengthCm,
      widthCm: raw.widthCm,
      heightCm: raw.heightCm,
      actualWeightKg: raw.actualWeightKg,
      confidenceScore: raw.confidenceScore,
      matchedCategory: raw.matchedCategory,
    }) ?? raw
  );
}

/**
 * Estimates shipping dimensions. Uses OpenAI when configured; silently falls back to rules.
 */
export async function estimateProductDimensions(
  input: DimensionAnalysisInput
): Promise<DimensionEstimateResult> {
  const ctx = logContext(input);

  if (!process.env.OPENAI_API_KEY) {
    const estimate = ruleBasedEstimate(input);
    console.info("[dimensions] path=rule-based reason=no_openai_api_key", {
      ...ctx,
      matchedCategory: estimate.matchedCategory,
      confidenceScore: estimate.confidenceScore,
    });
    return { estimate, source: "rule-based", reason: "no_openai_api_key" };
  }

  const aiEstimate = await analyzeDimensionsWithOpenAI({
    ...input,
    sizingApproach: inferSizingApproach(input) || input.sizingApproach,
  });

  if (aiEstimate) {
    console.info("[dimensions] path=openai", {
      ...ctx,
      matchedCategory: aiEstimate.matchedCategory,
      confidenceScore: aiEstimate.confidenceScore,
      lengthCm: aiEstimate.lengthCm,
      widthCm: aiEstimate.widthCm,
      heightCm: aiEstimate.heightCm,
      actualWeightKg: aiEstimate.actualWeightKg,
    });
    return { estimate: aiEstimate, source: "openai" };
  }

  const estimate = ruleBasedEstimate(input);
  console.info("[dimensions] path=rule-based reason=openai_unavailable_or_invalid", {
    ...ctx,
    matchedCategory: estimate.matchedCategory,
    confidenceScore: estimate.confidenceScore,
  });
  return {
    estimate,
    source: "rule-based",
    reason: "openai_unavailable_or_invalid",
  };
}
