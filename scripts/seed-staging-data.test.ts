/**
 * Unit tests for seed-staging-data.ts pure functions and idempotency guard.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks (must be defined before vi.mock calls) ─────────────────────
const mockGet = vi.hoisted(() => vi.fn());
const mockSet = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockAdd = vi.hoisted(() => vi.fn());
const mockCommit = vi.hoisted(() => vi.fn());
const mockBatchSet = vi.hoisted(() => vi.fn());

vi.mock('../lib/firebase-admin', () => ({
  adminDb: {
    batch: vi.fn(() => ({ set: mockBatchSet, commit: mockCommit })),
    doc: vi.fn(() => ({ get: mockGet, set: mockSet, update: mockUpdate })),
    collection: vi.fn(() => ({ doc: vi.fn(() => ({ get: mockGet, set: mockSet })), add: mockAdd })),
  },
}));

vi.mock('dotenv/config', () => ({}));

import {
  buildTailorFixtures,
  buildProductFixtures,
  checkSentinel,
} from './seed-staging-data';

// ── buildTailorFixtures ───────────────────────────────────────────────────────

describe('buildTailorFixtures', () => {
  it('returns exactly 5 fixtures', () => {
    const fixtures = buildTailorFixtures();
    expect(fixtures).toHaveLength(5);
  });

  it('returns 3 main tailors and 2 sub-tailors', () => {
    const fixtures = buildTailorFixtures();
    expect(fixtures.filter((f) => f.tailorData)).toHaveLength(3);
    expect(fixtures.filter((f) => !f.tailorData)).toHaveLength(2);
  });

  it('main tailors have is_tailor:true and is_sub_tailor:false', () => {
    buildTailorFixtures()
      .filter((f) => f.tailorData)
      .forEach((f) => {
        expect(f.userData.is_tailor).toBe(true);
        expect(f.userData.is_sub_tailor).toBe(false);
      });
  });

  it('sub-tailors have is_tailor:false and is_sub_tailor:true', () => {
    buildTailorFixtures()
      .filter((f) => !f.tailorData)
      .forEach((f) => {
        expect(f.userData.is_tailor).toBe(false);
        expect(f.userData.is_sub_tailor).toBe(true);
      });
  });

  it('sub-tailor roles are initiator or approver', () => {
    buildTailorFixtures()
      .filter((f) => !f.tailorData)
      .forEach((f) => {
        expect(['initiator', 'approver']).toContain(f.userData.role);
      });
  });

  it('all fixtures have status active', () => {
    buildTailorFixtures().forEach((f) => {
      expect(f.userData.status).toBe('active');
    });
  });

  it('all fixtures have required fields', () => {
    const required = [
      'first_name', 'last_name', 'email', 'is_tailor', 'is_sub_tailor',
      'role', 'tailorId', 'createdAt', 'phone', 'address', 'shop_name', 'status',
    ] as const;
    buildTailorFixtures().forEach((f) => {
      required.forEach((field) => expect(f.userData).toHaveProperty(field));
    });
  });

  it('sub-tailors reference a valid main tailor ID', () => {
    const fixtures = buildTailorFixtures();
    const mainIds = new Set(fixtures.filter((f) => f.tailorData).map((f) => f.id));
    fixtures
      .filter((f) => !f.tailorData)
      .forEach((f) => expect(mainIds.has(f.userData.tailorId)).toBe(true));
  });

  it('main tailors have tailorData mirroring userData', () => {
    buildTailorFixtures()
      .filter((f) => f.tailorData)
      .forEach((f) => expect(f.tailorData).toEqual(f.userData));
  });
});

// ── buildProductFixtures ──────────────────────────────────────────────────────

describe('buildProductFixtures', () => {
  const tailorFixtures = buildTailorFixtures();

  it('returns exactly 10 fixtures', () => {
    expect(buildProductFixtures(tailorFixtures)).toHaveLength(10);
  });

  it('all products have approvalStatus pending', () => {
    buildProductFixtures(tailorFixtures).forEach((p) => {
      expect(p.data.approvalStatus).toBe('pending');
    });
  });

  it('all products have price.currency NGN', () => {
    buildProductFixtures(tailorFixtures).forEach((p) => {
      expect(p.data.price.currency).toBe('NGN');
    });
  });

  it('has at least 4 bespoke products', () => {
    const products = buildProductFixtures(tailorFixtures);
    expect(products.filter((p) => p.data.type === 'bespoke').length).toBeGreaterThanOrEqual(4);
  });

  it('has at least 4 ready-to-wear products', () => {
    const products = buildProductFixtures(tailorFixtures);
    expect(products.filter((p) => p.data.type === 'ready-to-wear').length).toBeGreaterThanOrEqual(4);
  });

  it('covers all four categories', () => {
    const categories = new Set(buildProductFixtures(tailorFixtures).map((p) => p.data.category));
    (['men', 'women', 'kids', 'unisex'] as const).forEach((c) => expect(categories).toContain(c));
  });

  it('products span at least 3 distinct tailor IDs', () => {
    const ids = new Set(buildProductFixtures(tailorFixtures).map((p) => p.data.tailor_id));
    expect(ids.size).toBeGreaterThanOrEqual(3);
  });

  it('bespoke products have rtwOptions null and bespokeOptions populated', () => {
    buildProductFixtures(tailorFixtures)
      .filter((p) => p.data.type === 'bespoke')
      .forEach((p) => {
        expect(p.data.rtwOptions).toBeNull();
        expect(p.data.bespokeOptions).not.toBeNull();
      });
  });

  it('ready-to-wear products have bespokeOptions null and rtwOptions populated', () => {
    buildProductFixtures(tailorFixtures)
      .filter((p) => p.data.type === 'ready-to-wear')
      .forEach((p) => {
        expect(p.data.bespokeOptions).toBeNull();
        expect(p.data.rtwOptions).not.toBeNull();
      });
  });

  it('all products have product_id as empty string placeholder', () => {
    buildProductFixtures(tailorFixtures).forEach((p) => {
      expect(p.data.product_id).toBe('');
    });
  });

  it('all products have required fields', () => {
    const required = [
      'tailor_id', 'type', 'title', 'price', 'discount', 'description',
      'category', 'wear_category', 'wear_quantity', 'tags', 'keywords',
      'images', 'sizes', 'customSizes', 'userCustomSizes', 'userSizes',
      'tailor', 'status', 'availability', 'deliveryTimeline', 'createdAt',
      'approvalStatus', 'metric_size_guide', 'shipping', 'product_id',
    ] as const;
    buildProductFixtures(tailorFixtures).forEach((p) => {
      required.forEach((field) => expect(p.data).toHaveProperty(field));
    });
  });
});

// ── checkSentinel ─────────────────────────────────────────────────────────────

describe('checkSentinel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when sentinel document exists', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });
    expect(await checkSentinel()).toBe(true);
  });

  it('returns false when sentinel document does not exist', async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    expect(await checkSentinel()).toBe(false);
  });
});
