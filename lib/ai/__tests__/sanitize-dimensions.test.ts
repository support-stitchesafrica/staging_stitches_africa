import { describe, it, expect } from "vitest";
import {
  normalizeWeightKg,
  sanitizeToFashionEstimate,
} from "../sanitize-dimensions";

describe("sanitize-dimensions", () => {
  it("converts grams mislabeled as kg (4000 -> 4 kg)", () => {
    expect(normalizeWeightKg(4000)).toBe(4);
  });

  it("bounds leather-jacket-like AI mistake to realistic parcel", () => {
    const estimate = sanitizeToFashionEstimate({
      lengthCm: 200,
      widthCm: 200,
      heightCm: 500,
      actualWeightKg: 4000,
      confidenceScore: 0.9,
      matchedCategory: "jacket",
    });

    expect(estimate).not.toBeNull();
    expect(estimate!.actualWeightKg).toBeLessThanOrEqual(12);
    expect(estimate!.chargeableWeight).toBeLessThanOrEqual(20);
    expect(estimate!.lengthCm).toBeLessThanOrEqual(70);
    expect(estimate!.volumetricWeight).toBeLessThanOrEqual(20);
  });

  it("produces sensible defaults for a typical jacket parcel", () => {
    const estimate = sanitizeToFashionEstimate({
      lengthCm: 52,
      widthCm: 38,
      heightCm: 11,
      actualWeightKg: 2.1,
      confidenceScore: 0.88,
      matchedCategory: "jacket",
    });

    expect(estimate).not.toBeNull();
    expect(estimate!.actualWeightKg).toBeGreaterThanOrEqual(1);
    expect(estimate!.actualWeightKg).toBeLessThanOrEqual(5);
    expect(estimate!.chargeableWeight).toBeLessThanOrEqual(10);
  });
});
