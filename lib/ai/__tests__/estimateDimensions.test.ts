import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { estimateDimensions } from '../estimateDimensions';
import { extractKeywords } from '../extractKeywords';

// Feature: ai-dimension-weight-generation
describe('estimateDimensions', () => {
  describe('unit tests — 1.6', () => {
    it('returns default medium tier when no keywords match', () => {
      const result = estimateDimensions([]);
      expect(result.lengthCm).toBe(30);
      expect(result.widthCm).toBe(25);
      expect(result.heightCm).toBe(10);
      expect(result.actualWeightKg).toBe(2.5);
      expect(result.matchedCategory).toBe('default');
      expect(result.confidenceScore).toBe(0.40);
    });

    it('maps "dress" keyword to dress category', () => {
      const result = estimateDimensions(['dress']);
      expect(result.matchedCategory).toBe('dress');
      expect(result.lengthCm).toBe(40);
      expect(result.widthCm).toBe(30);
      expect(result.heightCm).toBe(8);
      expect(result.actualWeightKg).toBe(1.5);
    });

    it('maps "shirt" keyword to top category', () => {
      const result = estimateDimensions(['shirt']);
      expect(result.matchedCategory).toBe('top');
    });

    it('maps "agbada" keyword to agbada category', () => {
      const result = estimateDimensions(['agbada']);
      expect(result.matchedCategory).toBe('agbada');
      expect(result.lengthCm).toBe(55);
      expect(result.actualWeightKg).toBe(4.0);
    });

    it('maps "belt" keyword to accessory category', () => {
      const result = estimateDimensions(['belt']);
      expect(result.matchedCategory).toBe('accessory');
    });

    it('maps "ankara" keyword to fabric category', () => {
      const result = estimateDimensions(['ankara']);
      expect(result.matchedCategory).toBe('fabric');
    });

    it('maps "set" keyword to two-piece category', () => {
      const result = estimateDimensions(['set']);
      expect(result.matchedCategory).toBe('two-piece');
    });

    it('calculates volumetricWeight correctly', () => {
      const result = estimateDimensions(['dress']);
      const expected = (40 * 30 * 8) / 5000;
      expect(result.volumetricWeight).toBeCloseTo(expected, 5);
    });

    it('calculates chargeableWeight as max of actual and volumetric', () => {
      const result = estimateDimensions(['dress']);
      expect(result.chargeableWeight).toBe(Math.max(result.actualWeightKg, result.volumetricWeight));
    });

    it('returns first match in priority order (accessory before top)', () => {
      // "scarf" is accessory, "shirt" is top — accessory comes first in map
      const result = estimateDimensions(['scarf', 'shirt']);
      expect(result.matchedCategory).toBe('accessory');
    });
  });

  describe('Property 1: Text-to-estimate round trip — 1.4', () => {
    // Feature: ai-dimension-weight-generation, Property 1: Text-to-estimate round trip
    it('for any title and description, extractKeywords → estimateDimensions returns valid DimensionEstimate', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (title, description) => {
          const keywords = extractKeywords(title, description);
          const result = estimateDimensions(keywords);

          expect(result.lengthCm).toBeGreaterThan(0);
          expect(result.widthCm).toBeGreaterThan(0);
          expect(result.heightCm).toBeGreaterThan(0);
          expect(result.actualWeightKg).toBeGreaterThan(0);
          expect(result.volumetricWeight).toBeGreaterThan(0);
          expect(result.chargeableWeight).toBeGreaterThan(0);
          expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
          expect(result.confidenceScore).toBeLessThanOrEqual(1);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Weight calculations invariant — 1.5', () => {
    // Feature: ai-dimension-weight-generation, Property 2: Weight calculations invariant
    it('volumetricWeight and chargeableWeight satisfy their formulas for any estimate', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (title, description) => {
          const keywords = extractKeywords(title, description);
          const result = estimateDimensions(keywords);

          const expectedVolumetric = (result.lengthCm * result.widthCm * result.heightCm) / 5000;
          const expectedChargeable = Math.max(result.actualWeightKg, expectedVolumetric);

          expect(result.volumetricWeight).toBeCloseTo(expectedVolumetric, 10);
          expect(result.chargeableWeight).toBeCloseTo(expectedChargeable, 10);
        }),
        { numRuns: 100 }
      );
    });
  });
});
