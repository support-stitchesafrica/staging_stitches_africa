import { describe, it, expect, vi, beforeEach } from "vitest";
import { estimateProductDimensions } from "../dimension-estimator";
import * as openaiAnalyzer from "../openai-dimension-analyzer";

vi.mock("../openai-dimension-analyzer", () => ({
  analyzeDimensionsWithOpenAI: vi.fn(),
  isOpenAIUnavailableError: vi.fn(),
}));

describe("estimateProductDimensions", () => {
  beforeEach(() => {
    vi.mocked(openaiAnalyzer.analyzeDimensionsWithOpenAI).mockReset();
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
  });

  it("returns OpenAI estimate when available", async () => {
    const aiResult = {
      lengthCm: 40,
      widthCm: 30,
      heightCm: 8,
      actualWeightKg: 1.5,
      volumetricWeight: 1.92,
      chargeableWeight: 1.92,
      confidenceScore: 0.9,
      matchedCategory: "dress",
    };
    vi.mocked(openaiAnalyzer.analyzeDimensionsWithOpenAI).mockResolvedValue(
      aiResult
    );

    const result = await estimateProductDimensions({
      title: "Ankara Dress",
      imageUrls: ["https://example.com/img.jpg"],
    });

    expect(result.estimate).toEqual(aiResult);
    expect(result.source).toBe("openai");
    expect(openaiAnalyzer.analyzeDimensionsWithOpenAI).toHaveBeenCalledOnce();
  });

  it("falls back to rule-based estimate when OpenAI returns null", async () => {
    vi.mocked(openaiAnalyzer.analyzeDimensionsWithOpenAI).mockResolvedValue(null);

    const result = await estimateProductDimensions({
      title: "Ankara Dress",
    });

    expect(result.source).toBe("rule-based");
    expect(result.estimate.matchedCategory).toBe("dress");
    expect(result.estimate.lengthCm).toBeGreaterThan(0);
  });

  it("uses wear category in rule fallback (Footwear)", async () => {
    vi.mocked(openaiAnalyzer.analyzeDimensionsWithOpenAI).mockResolvedValue(null);

    const result = await estimateProductDimensions({
      title: "Leather item",
      wearCategories: ["Footwear"],
    });

    expect(result.estimate.matchedCategory).toBe("footwear");
  });
});
