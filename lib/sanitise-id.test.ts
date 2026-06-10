import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sanitiseId } from './sanitise-id';

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('sanitiseId — unit tests', () => {
  it('returns the input unchanged when it is already clean', () => {
    expect(sanitiseId('STITCH-2026-001')).toBe('STITCH-2026-001');
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitiseId('  STITCH-2026-001  ')).toBe('STITCH-2026-001');
  });

  it('strips special characters that are not alphanumeric or dash', () => {
    expect(sanitiseId('ORDER!@#$%^&*()')).toBe('ORDER');
  });

  it('strips spaces within the string', () => {
    expect(sanitiseId('STITCH 2026 001')).toBe('STITCH2026001');
  });

  it('strips SQL-injection-style characters', () => {
    expect(sanitiseId("'; DROP TABLE orders; --")).toBe('DROPTABLEorders--');
  });

  it('caps output at 64 characters', () => {
    const long = 'A'.repeat(100);
    expect(sanitiseId(long)).toHaveLength(64);
  });

  it('returns empty string for input that is all special characters', () => {
    expect(sanitiseId('!@#$%^&*()')).toBe('');
  });

  it('returns empty string for blank input', () => {
    expect(sanitiseId('   ')).toBe('');
  });

  it('preserves dashes', () => {
    expect(sanitiseId('ABC-123-XYZ')).toBe('ABC-123-XYZ');
  });

  it('preserves mixed case', () => {
    expect(sanitiseId('aBcDeF')).toBe('aBcDeF');
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// Property 3: Input sanitiser strips non-alphanumeric-dash characters
// Validates: Requirements 8.4
// ---------------------------------------------------------------------------

describe('sanitiseId — Property 3: Input sanitiser strips non-alphanumeric-dash characters', () => {
  it('output only contains [A-Za-z0-9-] and is at most 64 chars for any string input', () => {
    /**
     * **Validates: Requirements 8.4**
     *
     * For any string input, sanitiseId must return a string containing only
     * characters matching [A-Za-z0-9\-] and of length at most 64.
     */
    fc.assert(
      fc.property(fc.string(), (s) => {
        const result = sanitiseId(s);
        return /^[A-Za-z0-9\-]{0,64}$/.test(result);
      }),
      { numRuns: 200 }
    );
  });

  it('output length never exceeds 64 characters regardless of input length', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (s) => {
        return sanitiseId(s).length <= 64;
      }),
      { numRuns: 200 }
    );
  });

  it('output is a subset of the allowed character set for any unicode input', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'grapheme' }), (s) => {
        const result = sanitiseId(s);
        return result.split('').every((ch) => /[A-Za-z0-9\-]/.test(ch));
      }),
      { numRuns: 200 }
    );
  });
});
