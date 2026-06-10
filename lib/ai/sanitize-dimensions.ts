/**
 * Normalizes and bounds AI/rule dimension outputs for single fashion parcels.
 */

import type { DimensionEstimate } from "@/lib/ai/estimateDimensions";
import { buildDimensionEstimate } from "@/lib/ai/estimateDimensions";

/** Hard limits for one ready-to-wear / bespoke garment parcel. */
export const FASHION_LIMITS = {
  lengthCm: { min: 15, max: 70 },
  widthCm: { min: 10, max: 50 },
  heightCm: { min: 2, max: 30 },
  actualWeightKg: { min: 0.1, max: 12 },
  chargeableWeightKg: { max: 20 },
} as const;

export interface RawDimensionNumbers {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  confidenceScore?: number;
  matchedCategory?: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Fixes common AI mistakes (grams as kg, mm as cm, metres as cm).
 */
export function normalizeWeightKg(weight: number): number {
  if (!Number.isFinite(weight) || weight <= 0) return NaN;

  let kg = weight;

  // e.g. 4000 → 4 kg (grams mislabeled as kg)
  if (kg >= 500) {
    const fromGrams = kg / 1000;
    if (fromGrams >= FASHION_LIMITS.actualWeightKg.min && fromGrams <= 30) {
      return fromGrams;
    }
  }

  // e.g. 1800 g written as 1800
  if (kg > FASHION_LIMITS.actualWeightKg.max && kg < 500) {
    const fromGrams = kg / 1000;
    if (fromGrams >= FASHION_LIMITS.actualWeightKg.min) {
      return fromGrams;
    }
  }

  return kg;
}

export function normalizeLengthCm(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return NaN;

  let cm = value;

  // Millimetres reported as cm (e.g. 600 mm coat → 600 "cm")
  if (cm > 250) {
    const fromMm = cm / 10;
    if (fromMm >= FASHION_LIMITS.lengthCm.min && fromMm <= 200) {
      cm = fromMm;
    }
  }

  // Metres reported as cm (e.g. 0.5 m → 0.5)
  if (cm > 0 && cm < 3) {
    cm = cm * 100;
  }

  return cm;
}

export function normalizeRawDimensions(raw: RawDimensionNumbers): RawDimensionNumbers | null {
  const lengthCm = normalizeLengthCm(raw.lengthCm);
  const widthCm = normalizeLengthCm(raw.widthCm);
  const heightCm = normalizeLengthCm(raw.heightCm);
  const actualWeightKg = normalizeWeightKg(raw.actualWeightKg);

  if (
    !Number.isFinite(lengthCm) ||
    !Number.isFinite(widthCm) ||
    !Number.isFinite(heightCm) ||
    !Number.isFinite(actualWeightKg)
  ) {
    return null;
  }

  return {
    ...raw,
    lengthCm,
    widthCm,
    heightCm,
    actualWeightKg,
  };
}

export function boundFashionDimensions(
  raw: RawDimensionNumbers
): DimensionEstimate {
  const lengthCm = Math.round(
    clamp(raw.lengthCm, FASHION_LIMITS.lengthCm.min, FASHION_LIMITS.lengthCm.max)
  );
  const widthCm = Math.round(
    clamp(raw.widthCm, FASHION_LIMITS.widthCm.min, FASHION_LIMITS.widthCm.max)
  );
  const heightCm = Math.round(
    clamp(raw.heightCm, FASHION_LIMITS.heightCm.min, FASHION_LIMITS.heightCm.max)
  );
  const actualWeightKg =
    Math.round(
      clamp(
        raw.actualWeightKg,
        FASHION_LIMITS.actualWeightKg.min,
        FASHION_LIMITS.actualWeightKg.max
      ) * 100
    ) / 100;

  let confidence = clamp(raw.confidenceScore ?? 0.75, 0, 1);

  const estimate = buildDimensionEstimate(
    lengthCm,
    widthCm,
    heightCm,
    actualWeightKg,
    confidence,
    raw.matchedCategory?.trim().slice(0, 40) || "ai-estimate"
  );

  if (estimate.chargeableWeight > FASHION_LIMITS.chargeableWeightKg.max) {
    confidence = Math.min(confidence, 0.6);
    return {
      ...estimate,
      volumetricWeight: Math.min(
        estimate.volumetricWeight,
        FASHION_LIMITS.chargeableWeightKg.max
      ),
      chargeableWeight: FASHION_LIMITS.chargeableWeightKg.max,
      confidenceScore: confidence,
    };
  }

  return estimate;
}

export function sanitizeToFashionEstimate(
  raw: RawDimensionNumbers
): DimensionEstimate | null {
  const normalized = normalizeRawDimensions(raw);
  if (!normalized) return null;

  const estimate = boundFashionDimensions(normalized);

  if (estimate.chargeableWeight > FASHION_LIMITS.chargeableWeightKg.max * 2) {
    return null;
  }

  return estimate;
}
