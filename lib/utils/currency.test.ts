/**
 * Tests for currency utility functions
 * Includes property-based tests and unit tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatUSD, formatUSDCompact, parseUSD } from './currency';

describe('Currency Utilities', () => {
  describe('Unit Tests', () => {
    describe('formatUSD', () => {
      it('should format positive amounts correctly', () => {
        expect(formatUSD(12345.67)).toBe('$12,345.67');
        expect(formatUSD(1000)).toBe('$1,000.00');
        expect(formatUSD(0.99)).toBe('$0.99');
      });

      it('should format zero correctly', () => {
        expect(formatUSD(0)).toBe('$0.00');
      });

      it('should format negative amounts correctly', () => {
        expect(formatUSD(-500.5)).toBe('-$500.50');
        expect(formatUSD(-1234.56)).toBe('-$1,234.56');
      });

      it('should always show two decimal places', () => {
        expect(formatUSD(100)).toBe('$100.00');
        expect(formatUSD(100.5)).toBe('$100.50');
        expect(formatUSD(100.123)).toBe('$100.12'); // Rounds down
        expect(formatUSD(100.999)).toBe('$101.00'); // Rounds up
      });

      it('should handle large amounts', () => {
        expect(formatUSD(1000000)).toBe('$1,000,000.00');
        expect(formatUSD(9999999.99)).toBe('$9,999,999.99');
      });
    });

    describe('formatUSDCompact', () => {
      it('should format amounts under 1000 without suffix', () => {
        expect(formatUSDCompact(500)).toBe('$500');
        expect(formatUSDCompact(999)).toBe('$999');
        expect(formatUSDCompact(0)).toBe('$0');
      });

      it('should format thousands with K suffix', () => {
        expect(formatUSDCompact(1000)).toBe('$1.0K');
        expect(formatUSDCompact(1234)).toBe('$1.2K');
        expect(formatUSDCompact(5500)).toBe('$5.5K');
        expect(formatUSDCompact(999999)).toBe('$1000.0K');
      });

      it('should format millions with M suffix', () => {
        expect(formatUSDCompact(1000000)).toBe('$1.0M');
        expect(formatUSDCompact(1234567)).toBe('$1.2M');
        expect(formatUSDCompact(5500000)).toBe('$5.5M');
      });

      it('should handle negative amounts', () => {
        expect(formatUSDCompact(-500)).toBe('-$500');
        expect(formatUSDCompact(-1234)).toBe('-$1.2K');
        expect(formatUSDCompact(-1234567)).toBe('-$1.2M');
      });
    });

    describe('parseUSD', () => {
      it('should parse formatted USD strings', () => {
        expect(parseUSD('$12,345.67')).toBe(12345.67);
        expect(parseUSD('$1,000')).toBe(1000);
        expect(parseUSD('$0.99')).toBe(0.99);
      });

      it('should parse negative amounts', () => {
        expect(parseUSD('-$500.50')).toBe(-500.50);
        expect(parseUSD('-$1,234.56')).toBe(-1234.56);
      });

      it('should handle strings without dollar sign', () => {
        expect(parseUSD('12345.67')).toBe(12345.67);
        expect(parseUSD('1,000')).toBe(1000);
      });

      it('should handle compact format strings', () => {
        expect(parseUSD('$1.2K')).toBeCloseTo(1.2, 1);
        expect(parseUSD('$5.5M')).toBeCloseTo(5.5, 1);
      });
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Property 45: USD currency formatting consistency
     * Validates: Requirements 23.1, 23.2, 23.4
     * 
     * For any valid monetary amount:
     * 1. formatUSD should always produce a string starting with $ or -$
     * 2. formatUSD should always include exactly 2 decimal places
     * 3. Round-trip (format then parse) should preserve the value within rounding tolerance
     * 4. formatUSDCompact should always produce a valid compact format
     */
    it('Property 45: USD currency formatting consistency', () => {
      fc.assert(
        fc.property(
          // Generate reasonable monetary amounts (-1M to 1M)
          fc.double({ min: -1000000, max: 1000000, noNaN: true }),
          (amount) => {
            // Test formatUSD consistency
            const formatted = formatUSD(amount);
            
            // Should start with $ or -$
            expect(formatted.startsWith('$') || formatted.startsWith('-$')).toBe(true);
            
            // Should contain exactly 2 decimal places
            const decimalMatch = formatted.match(/\.\d+$/);
            if (decimalMatch) {
              expect(decimalMatch[0].length).toBe(3); // . plus 2 digits
            }
            
            // Round-trip should preserve value (within rounding tolerance)
            const parsed = parseUSD(formatted);
            expect(Math.abs(parsed - amount)).toBeLessThan(0.01);
            
            // Test formatUSDCompact consistency
            const compact = formatUSDCompact(amount);
            
            // Should start with $ or -$
            expect(compact.startsWith('$') || compact.startsWith('-$')).toBe(true);
            
            // Should not contain commas (compact format)
            expect(compact.includes(',')).toBe(false);
            
            // Should contain K, M, or be a plain number
            const hasValidFormat = 
              compact.includes('K') || 
              compact.includes('M') || 
              /^\-?\$\d+$/.test(compact);
            expect(hasValidFormat).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Property 46: USD export consistency
     * Validates: Requirements 23.5
     * 
     * For any array of monetary amounts:
     * 1. All formatted values should use consistent USD format
     * 2. All values should be parseable back to numbers
     * 3. The sum of parsed values should equal the sum of original values (within tolerance)
     */
    it('Property 46: USD export consistency', () => {
      fc.assert(
        fc.property(
          // Generate array of monetary amounts (simulating export data)
          fc.array(
            fc.double({ min: 0, max: 100000, noNaN: true }),
            { minLength: 1, maxLength: 50 }
          ),
          (amounts) => {
            // Format all amounts
            const formatted = amounts.map(formatUSD);
            
            // All should use consistent format (start with $)
            formatted.forEach(f => {
              expect(f.startsWith('$')).toBe(true);
            });
            
            // All should be parseable
            const parsed = formatted.map(parseUSD);
            parsed.forEach(p => {
              expect(isNaN(p)).toBe(false);
            });
            
            // Sum should be preserved (within rounding tolerance)
            const originalSum = amounts.reduce((sum, a) => sum + a, 0);
            const parsedSum = parsed.reduce((sum, p) => sum + p, 0);
            
            // Allow for small rounding errors (0.01 per item)
            const tolerance = amounts.length * 0.01;
            expect(Math.abs(parsedSum - originalSum)).toBeLessThan(tolerance);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
