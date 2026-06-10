import { describe, it, expect } from 'vitest';
import { extractKeywords } from '../extractKeywords';

// Feature: ai-dimension-weight-generation
describe('extractKeywords', () => {
  describe('unit tests', () => {
    it('extracts known fashion keywords from title', () => {
      const result = extractKeywords('Beautiful Ankara Dress', '');
      expect(result).toContain('dress');
      expect(result).toContain('ankara');
    });

    it('extracts keywords from description', () => {
      const result = extractKeywords('', 'This is a lovely kaftan made from aso-oke fabric');
      expect(result).toContain('kaftan');
      expect(result).toContain('aso-oke');
      expect(result).toContain('fabric');
    });

    it('returns empty array for non-fashion text', () => {
      const result = extractKeywords('Laptop Stand', 'A sturdy aluminum stand for your computer');
      expect(result).toEqual([]);
    });

    it('normalizes mixed-case input', () => {
      const result = extractKeywords('SHIRT', 'BLOUSE');
      expect(result).toContain('shirt');
      expect(result).toContain('blouse');
    });

    it('handles empty strings', () => {
      const result = extractKeywords('', '');
      expect(result).toEqual([]);
    });

    it('deduplicates repeated keywords', () => {
      const result = extractKeywords('dress dress dress', 'dress');
      expect(result.filter((k) => k === 'dress').length).toBe(1);
    });

    it('extracts hyphenated terms like two-piece', () => {
      const result = extractKeywords('Two-Piece Coord Set', '');
      expect(result).toContain('two-piece');
    });

    it('extracts agbada category keywords', () => {
      const result = extractKeywords('Senator Agbada', 'Traditional babariga outfit');
      expect(result).toContain('senator');
      expect(result).toContain('agbada');
      expect(result).toContain('babariga');
    });

    it('extracts accessory keywords', () => {
      const result = extractKeywords('Leather Belt and Cap', 'Includes a matching purse');
      expect(result).toContain('belt');
      expect(result).toContain('cap');
      expect(result).toContain('purse');
    });
  });
});
