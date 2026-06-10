/**
 * OpenAI Vision + structured JSON for product shipping dimensions.
 * Pattern aligned with lib/ai/brand-analyzer.ts and lib/ai-assistant/config.ts.
 */

import OpenAI from "openai";
import { aiAssistantConfig } from "@/lib/ai-assistant/config";
import type { DimensionEstimate } from "@/lib/ai/estimateDimensions";
import type { DimensionAnalysisInput } from "@/lib/ai/types";
import { countVisionImageUrls, isVisionImageUrl } from "@/lib/ai/vision-image-urls";
import { sanitizeToFashionEstimate } from "@/lib/ai/sanitize-dimensions";

const MAX_IMAGES = 3;
const DIMENSION_MODEL = "gpt-4o-mini";

interface OpenAIDimensionPayload {
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  actualWeightKg?: number;
  confidenceScore?: number;
  matchedCategory?: string;
}

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/** True when OpenAI should not be retried and rule-based logic should run. */
export function isOpenAIUnavailableError(error: unknown): boolean {
  const err = error as { status?: number; code?: string; type?: string };
  const code = err?.code ?? "";
  const status = err?.status;

  if (status === 401 || status === 403) return true;
  if (status === 402) return true;
  if (status === 429) return true;
  if (status === 503 || status === 500) return true;

  const unavailableCodes = new Set([
    "insufficient_quota",
    "billing_hard_limit_reached",
    "rate_limit_exceeded",
    "server_error",
    "timeout",
  ]);
  if (unavailableCodes.has(code)) return true;

  if (err?.type === "insufficient_quota") return true;

  return false;
}

function parseJsonContent(content: string): OpenAIDimensionPayload | null {
  let clean = content.trim();
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(clean) as OpenAIDimensionPayload;
  } catch {
    return null;
  }
}

function validatePayload(
  payload: OpenAIDimensionPayload | null
): DimensionEstimate | null {
  if (!payload) return null;

  const lengthCm = payload.lengthCm;
  const widthCm = payload.widthCm;
  const heightCm = payload.heightCm;
  const actualWeightKg = payload.actualWeightKg;

  if (
    typeof lengthCm !== "number" ||
    typeof widthCm !== "number" ||
    typeof heightCm !== "number" ||
    typeof actualWeightKg !== "number" ||
    !Number.isFinite(lengthCm) ||
    !Number.isFinite(widthCm) ||
    !Number.isFinite(heightCm) ||
    !Number.isFinite(actualWeightKg)
  ) {
    return null;
  }

  const sanitized = sanitizeToFashionEstimate({
    lengthCm,
    widthCm,
    heightCm,
    actualWeightKg,
    confidenceScore:
      typeof payload.confidenceScore === "number" ? payload.confidenceScore : 0.75,
    matchedCategory:
      typeof payload.matchedCategory === "string" && payload.matchedCategory.trim()
        ? payload.matchedCategory.trim()
        : "ai-estimate",
  });

  if (!sanitized) {
    console.warn("[dimensions] OpenAI values out of range after sanitize", {
      lengthCm,
      widthCm,
      heightCm,
      actualWeightKg,
    });
  }

  return sanitized;
}

function buildPrompt(input: DimensionAnalysisInput): string {
  const wear =
    input.wearCategories && input.wearCategories.length > 0
      ? input.wearCategories.join(", ")
      : "not specified";
  const sizes =
    input.sizes && input.sizes.length > 0
      ? input.sizes.join(", ")
      : "not specified";

  return `Estimate shipping package dimensions for this fashion product sold on an African marketplace.

Product context:
- Title: ${input.title?.trim() || "not provided"}
- Description: ${input.description?.trim() || "not provided"}
- Product type: ${input.productType || "not specified"} (bespoke = made to order, ready-to-wear = stocked sizes)
- Gender category: ${input.category || "not specified"}
- Sub-categories: ${wear}
- Sizing approach: ${input.sizingApproach || "not specified"}
- Sizes offered: ${sizes}

Instructions:
1. Look at product images when provided — infer garment type, bulk, and typical fold/box size.
2. African fashion includes agbada, ankara sets, aso-oke, boubou, senator suits, fabrics by the yard, etc.
3. Footwear ships in a shoe box; fabrics may ship folded or rolled; formal wear is bulkier than a t-shirt.
4. Return realistic centimetres and kilograms for ONE folded/boxed garment with light packaging.
5. Units are mandatory: centimetres (cm) for size, kilograms (kg) for weight — never grams, never millimetres.
6. Typical ranges: length 25–60 cm, width 20–45 cm, height 3–20 cm, weight 0.2–4 kg (heavy leather coat up to ~3.5 kg).
7. Example leather jacket parcel: about 50×40×12 cm, 2.2 kg.
8. confidenceScore: 0.0–1.0 (how sure you are).

Respond ONLY with valid JSON (no markdown):
{
  "lengthCm": number,
  "widthCm": number,
  "heightCm": number,
  "actualWeightKg": number,
  "confidenceScore": number,
  "matchedCategory": "short label e.g. dress, footwear, fabric, agbada, jacket"
}`;
}

function buildUserContent(
  input: DimensionAnalysisInput
): OpenAI.Chat.Completions.ChatCompletionContentPart[] {
  const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: buildPrompt(input) },
  ];

  const urls = (input.imageUrls ?? [])
    .filter((u): u is string => typeof u === "string" && isVisionImageUrl(u))
    .slice(0, MAX_IMAGES);

  for (const url of urls) {
    parts.push({
      type: "image_url",
      image_url: {
        url,
        detail: url.startsWith("data:image/") ? "auto" : "high",
      },
    });
  }

  return parts;
}

/**
 * Returns a dimension estimate from OpenAI, or null to use rule-based fallback.
 */
export async function analyzeDimensionsWithOpenAI(
  input: DimensionAnalysisInput
): Promise<DimensionEstimate | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  const hasText =
    (input.title?.trim().length ?? 0) > 0 ||
    (input.description?.trim().length ?? 0) > 0;
  const hasImages = (input.imageUrls?.length ?? 0) > 0;

  if (!hasText && !hasImages) {
    console.info("[dimensions] OpenAI skipped: no title, description, or images");
    return null;
  }

  const receivedCount = input.imageUrls?.length ?? 0;
  const visionCount = countVisionImageUrls(input.imageUrls);
  if (receivedCount > 0 && visionCount === 0) {
    console.warn("[dimensions] OpenAI: images received but none usable for vision", {
      samples: (input.imageUrls ?? []).slice(0, 2).map((u) => u.slice(0, 40)),
    });
  }

  console.info("[dimensions] OpenAI request started", {
    model: DIMENSION_MODEL,
    imagesReceived: receivedCount,
    imagesAttachedToPrompt: visionCount,
    hasText,
  });

  const startedAt = Date.now();

  try {
    const response = await client.chat.completions.create({
      model: DIMENSION_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a logistics specialist for fashion e-commerce. Estimate parcel dimensions and weight. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: buildUserContent(input),
        },
      ],
      max_tokens: Math.min(aiAssistantConfig.openai.maxTokens * 2, 800),
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn("[dimensions] OpenAI returned empty content");
      return null;
    }

    const parsed = validatePayload(parseJsonContent(content));
    if (!parsed) {
      console.warn("[dimensions] OpenAI response failed validation or JSON parse");
      return null;
    }

    console.info("[dimensions] OpenAI response OK", {
      matchedCategory: parsed.matchedCategory,
      confidenceScore: parsed.confidenceScore,
      durationMs: Date.now() - startedAt,
      imagesAttachedToPrompt: visionCount,
    });
    return parsed;
  } catch (error) {
    if (isOpenAIUnavailableError(error)) {
      console.warn(
        "[dimensions] OpenAI unavailable:",
        (error as Error)?.message ?? error
      );
    } else {
      console.error("[dimensions] OpenAI analysis failed:", error);
    }
    return null;
  }
}
