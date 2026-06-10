/**
 * Unit tests for lib/reviews/reviewService.ts
 * Covers the required (non-optional) pure functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/firestore so serverTimestamp() works without a real Firebase connection
vi.mock('firebase/firestore', () => ({
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
  Timestamp: class {
    constructor(public seconds: number, public nanoseconds: number) {}
  },
}));

import {
  getReviewDocId,
  buildReviewPayload,
  buildReviewUpdatePayload,
  computeAverageRating,
  resolveDisplayName,
} from '@/lib/reviews/reviewService';
import type { ProductReview } from '@/types/reviews';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReview(rating: number): ProductReview {
  return {
    id: 'p1_u1',
    product_id: 'p1',
    user_id: 'u1',
    display_name: 'Alice',
    rating,
    comment: '',
    verified_purchase: true,
    createdAt: { seconds: 0, nanoseconds: 0 } as any,
  };
}

// ---------------------------------------------------------------------------
// getReviewDocId
// ---------------------------------------------------------------------------

describe('getReviewDocId', () => {
  it('is deterministic — same inputs always return the same ID', () => {
    const id1 = getReviewDocId('prod-abc', 'user-xyz');
    const id2 = getReviewDocId('prod-abc', 'user-xyz');
    expect(id1).toBe(id2);
  });

  it('returns the expected format: {productId}_{userId}', () => {
    expect(getReviewDocId('prod-1', 'user-2')).toBe('prod-1_user-2');
  });

  it('produces distinct IDs for distinct (productId, userId) pairs', () => {
    const a = getReviewDocId('p1', 'u1');
    const b = getReviewDocId('p1', 'u2');
    const c = getReviewDocId('p2', 'u1');
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });
});

// ---------------------------------------------------------------------------
// computeAverageRating
// ---------------------------------------------------------------------------

describe('computeAverageRating', () => {
  it('returns null for an empty array', () => {
    expect(computeAverageRating([])).toBeNull();
  });

  it('returns the single rating for a one-element array', () => {
    expect(computeAverageRating([makeReview(4)])).toBe(4);
  });

  it('computes the correct arithmetic mean rounded to 1 decimal', () => {
    // (1 + 2 + 3 + 4 + 5) / 5 = 3.0
    const reviews = [1, 2, 3, 4, 5].map(makeReview);
    expect(computeAverageRating(reviews)).toBe(3.0);
  });

  it('rounds to 1 decimal place', () => {
    // (1 + 2) / 2 = 1.5
    expect(computeAverageRating([makeReview(1), makeReview(2)])).toBe(1.5);
    // (1 + 1 + 2) / 3 = 1.333... → 1.3
    expect(
      computeAverageRating([makeReview(1), makeReview(1), makeReview(2)])
    ).toBe(1.3);
  });

  it('handles all-same ratings', () => {
    const reviews = [5, 5, 5].map(makeReview);
    expect(computeAverageRating(reviews)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// resolveDisplayName
// ---------------------------------------------------------------------------

describe('resolveDisplayName', () => {
  it('returns the displayName when it is a non-empty string', () => {
    expect(resolveDisplayName('Alice', 'uid-1234')).toBe('Alice');
  });

  it('trims whitespace from displayName', () => {
    expect(resolveDisplayName('  Bob  ', 'uid-1234')).toBe('Bob');
  });

  it('falls back to "Customer #<first4>" when displayName is null', () => {
    expect(resolveDisplayName(null, 'abcd1234')).toBe('Customer #abcd');
  });

  it('falls back when displayName is an empty string', () => {
    expect(resolveDisplayName('', 'abcd1234')).toBe('Customer #abcd');
  });

  it('falls back when displayName is only whitespace', () => {
    expect(resolveDisplayName('   ', 'abcd1234')).toBe('Customer #abcd');
  });

  it('falls back when displayName is undefined', () => {
    expect(resolveDisplayName(undefined, 'abcd1234')).toBe('Customer #abcd');
  });

  it('uses the first 4 characters of the uid in the fallback', () => {
    const result = resolveDisplayName(null, 'xyz9876');
    expect(result).toBe('Customer #xyz9');
  });
});

// ---------------------------------------------------------------------------
// buildReviewPayload
// ---------------------------------------------------------------------------

describe('buildReviewPayload', () => {
  it('contains all required fields', () => {
    const payload = buildReviewPayload('prod-1', 'user-1', 5, 'Great product!');
    expect(payload).toHaveProperty('product_id', 'prod-1');
    expect(payload).toHaveProperty('user_id', 'user-1');
    expect(payload).toHaveProperty('rating', 5);
    expect(payload).toHaveProperty('comment', 'Great product!');
    expect(payload).toHaveProperty('verified_purchase', true);
    expect(payload).toHaveProperty('createdAt');
  });

  it('sets verified_purchase to true', () => {
    const payload = buildReviewPayload('p', 'u', 3, '');
    expect(payload.verified_purchase).toBe(true);
  });

  it('includes a createdAt server timestamp', () => {
    const payload = buildReviewPayload('p', 'u', 3, '');
    // serverTimestamp() is mocked to return { _type: 'serverTimestamp' }
    expect(payload.createdAt).toBeDefined();
  });

  it('does NOT include an updatedAt field', () => {
    const payload = buildReviewPayload('p', 'u', 3, '');
    expect(payload).not.toHaveProperty('updatedAt');
  });
});

// ---------------------------------------------------------------------------
// buildReviewUpdatePayload
// ---------------------------------------------------------------------------

describe('buildReviewUpdatePayload', () => {
  it('contains rating, comment, and updatedAt', () => {
    const payload = buildReviewUpdatePayload(4, 'Updated comment');
    expect(payload).toHaveProperty('rating', 4);
    expect(payload).toHaveProperty('comment', 'Updated comment');
    expect(payload).toHaveProperty('updatedAt');
  });

  it('does NOT include product_id, user_id, or createdAt', () => {
    const payload = buildReviewUpdatePayload(4, 'Updated comment');
    expect(payload).not.toHaveProperty('product_id');
    expect(payload).not.toHaveProperty('user_id');
    expect(payload).not.toHaveProperty('createdAt');
  });

  it('includes an updatedAt server timestamp', () => {
    const payload = buildReviewUpdatePayload(2, '');
    expect(payload.updatedAt).toBeDefined();
  });
});
