/**
 * Tests for GET /api/track-order
 *
 * These tests verify the HTTP-level behaviour of the route:
 * - 400 for empty / invalid input
 * - 404 for not-found orders
 * - 429 for rate-limit exceeded
 * - 200 with a SanitisedResponse for a found order
 * - PII fields are never present in the response
 *
 * Firebase Admin (adminDb) is mocked so no real Firestore connection is needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Hoist mock functions so they are available when vi.mock factory runs
// ---------------------------------------------------------------------------

const { mockGet, mockLimit, mockWhere, mockCollectionGroup } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockLimit = vi.fn(() => ({ get: mockGet }));
  const mockWhere = vi.fn();
  const mockCollectionGroup = vi.fn();

  // Wire up the chain: collectionGroup().where().where().limit().get()
  mockWhere.mockReturnValue({ where: mockWhere, limit: mockLimit });
  mockCollectionGroup.mockReturnValue({ where: mockWhere });

  return { mockGet, mockLimit, mockWhere, mockCollectionGroup };
});

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collectionGroup: mockCollectionGroup,
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

import { GET } from './route';
import { resetStore } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(params: Record<string, string> = {}, ip = '127.0.0.1') {
  const url = new URL('http://localhost/api/track-order');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString(), {
    headers: { 'x-forwarded-for': ip },
  }) as any;
}

/** Build a minimal Firestore doc snapshot that looks like a found order */
function makeDocSnap(overrides: Record<string, any> = {}) {
  const data = {
    order_id: 'STITCH-2026-001',
    order_status: 'in_transit',
    shipping: { carrier: 'DHL', trackingNumber: 'JD014600006281230' },
    packages: [{ trackingNumber: 'JD014600006281230' }],
    timeline: [
      {
        occurredAt: '2026-01-10T10:00:00Z',
        typeCode: 'PU',
        status: 'picked_up',
        description: 'Shipment picked up',
        location: 'Lagos, NG',
      },
    ],
    delivery_date: '2026-01-15',
    last_update: { toDate: () => new Date('2026-01-10T10:00:00Z') },
    // PII fields — must never appear in the response
    user_email: 'customer@example.com',
    user_address: '123 Main St',
    phone_number: '+2348012345678',
    payment_provider: 'paystack',
    amount_paid: 15000,
    coupon_code: 'SAVE10',
    payout_status: 'pending',
    payout_amount: 12000,
    payout_reference: 'PAY-REF-001',
    user_measurement: { chest: 40 },
    ...overrides,
  };

  return {
    empty: false,
    docs: [
      {
        data: () => data,
        ref: { path: 'users_orders/uid123/user_orders/STITCH-2026-001' },
      },
    ],
  };
}

function makeEmptySnap() {
  return { empty: true, docs: [] };
}

// ---------------------------------------------------------------------------
// Unit tests — HTTP status codes
// ---------------------------------------------------------------------------

describe('GET /api/track-order — HTTP status codes', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    // Re-wire chains after clearAllMocks
    mockWhere.mockReturnValue({ where: mockWhere, limit: mockLimit });
    mockCollectionGroup.mockReturnValue({ where: mockWhere });
    mockLimit.mockReturnValue({ get: mockGet });
  });

  it('returns 400 when no query params are provided', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when orderId is an empty string', async () => {
    const res = await GET(makeRequest({ orderId: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when orderId is only whitespace', async () => {
    const res = await GET(makeRequest({ orderId: '   ' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when orderId contains only special characters (sanitises to empty)', async () => {
    const res = await GET(makeRequest({ orderId: '!@#$%^&*()' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when no Firestore document matches the orderId', async () => {
    mockGet.mockResolvedValueOnce(makeEmptySnap());
    const res = await GET(makeRequest({ orderId: 'STITCH-9999-999' }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it('returns 200 with a SanitisedResponse when the order is found', async () => {
    mockGet.mockResolvedValueOnce(makeDocSnap());
    const res = await GET(makeRequest({ orderId: 'STITCH-2026-001' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orderId).toBe('STITCH-2026-001');
    expect(body.status).toBe('in_transit');
    expect(body.carrier).toBe('DHL');
  });

  it('returns 429 after 30 requests from the same IP', async () => {
    const ip = '203.0.113.1';
    // Exhaust the rate limit
    for (let i = 0; i < 30; i++) {
      mockGet.mockResolvedValueOnce(makeDocSnap());
      await GET(makeRequest({ orderId: 'STITCH-2026-001' }, ip));
    }
    // 31st request should be rate-limited (no Firestore call needed)
    const res = await GET(makeRequest({ orderId: 'STITCH-2026-001' }, ip));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/too many requests/i);
  });

  it('returns 500 when Firestore throws an error', async () => {
    mockGet.mockRejectedValueOnce(new Error('Firestore unavailable'));
    const res = await GET(makeRequest({ orderId: 'STITCH-2026-001' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    // Must not expose raw error details
    expect(body.error).not.toMatch(/Firestore unavailable/i);
  });

  it('accepts trackingNumber param and queries by shipping.trackingNumber', async () => {
    mockGet.mockResolvedValueOnce(makeDocSnap());
    const res = await GET(makeRequest({ trackingNumber: 'JD014600006281230' }));
    expect(res.status).toBe(200);
    // Verify the collectionGroup query used the trackingNumber field
    expect(mockWhere).toHaveBeenCalledWith(
      'shipping.trackingNumber',
      '==',
      'JD014600006281230'
    );
  });

  it('prefers orderId over trackingNumber when both are provided', async () => {
    mockGet.mockResolvedValueOnce(makeDocSnap());
    const res = await GET(
      makeRequest({ orderId: 'STITCH-2026-001', trackingNumber: 'JD014600006281230' })
    );
    expect(res.status).toBe(200);
    expect(mockWhere).toHaveBeenCalledWith('order_id', '==', 'STITCH-2026-001');
  });
});

// ---------------------------------------------------------------------------
// Unit tests — SanitisedResponse shape
// ---------------------------------------------------------------------------

describe('GET /api/track-order — SanitisedResponse shape', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    mockWhere.mockReturnValue({ where: mockWhere, limit: mockLimit });
    mockCollectionGroup.mockReturnValue({ where: mockWhere });
    mockLimit.mockReturnValue({ get: mockGet });
  });

  it('response contains all required SanitisedResponse fields', async () => {
    mockGet.mockResolvedValueOnce(makeDocSnap());
    const res = await GET(makeRequest({ orderId: 'STITCH-2026-001' }));
    const body = await res.json();

    expect(body).toHaveProperty('orderId');
    expect(body).toHaveProperty('trackingNumber');
    expect(body).toHaveProperty('carrier');
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('events');
    expect(body).toHaveProperty('estimatedDelivery');
    expect(body).toHaveProperty('lastUpdated');
  });

  it('events array contains TrackingEvent objects with required fields', async () => {
    mockGet.mockResolvedValueOnce(makeDocSnap());
    const res = await GET(makeRequest({ orderId: 'STITCH-2026-001' }));
    const body = await res.json();

    expect(Array.isArray(body.events)).toBe(true);
    const event = body.events[0];
    expect(event).toHaveProperty('occurredAt');
    expect(event).toHaveProperty('typeCode');
    expect(event).toHaveProperty('status');
    expect(event).toHaveProperty('description');
    expect(event).toHaveProperty('location');
  });

  it('response does not contain PII fields', async () => {
    mockGet.mockResolvedValueOnce(makeDocSnap());
    const res = await GET(makeRequest({ orderId: 'STITCH-2026-001' }));
    const body = await res.json();

    const piiFields = [
      'user_address',
      'user_email',
      'phone_number',
      'payment_provider',
      'amount_paid',
      'coupon_code',
      'payout_status',
      'payout_amount',
      'payout_reference',
      'user_measurement',
    ];

    for (const field of piiFields) {
      expect(body).not.toHaveProperty(field);
    }
  });

  it('error responses never expose raw Firestore error messages', async () => {
    mockGet.mockRejectedValueOnce(new Error('INTERNAL: quota exceeded'));
    const res = await GET(makeRequest({ orderId: 'STITCH-2026-001' }));
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('INTERNAL');
    expect(JSON.stringify(body)).not.toContain('quota exceeded');
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// Property 1: Sanitised response never contains PII fields
// Validates: Requirements 2.3, 8.1, 8.2
// ---------------------------------------------------------------------------

describe('GET /api/track-order — Property 1: Sanitised response never contains PII fields', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    mockWhere.mockReturnValue({ where: mockWhere, limit: mockLimit });
    mockCollectionGroup.mockReturnValue({ where: mockWhere });
    mockLimit.mockReturnValue({ get: mockGet });
  });

  it('response never contains PII fields for any Firestore document shape', async () => {
    /**
     * **Validates: Requirements 2.3, 8.1, 8.2**
     *
     * For any Firestore user_orders document, the SanitisedResponse
     * constructed from it must not contain any PII fields.
     */
    const piiFields = [
      'user_address',
      'user_email',
      'phone_number',
      'payment_provider',
      'amount_paid',
      'coupon_code',
      'payout_status',
      'payout_amount',
      'payout_reference',
      'user_measurement',
    ];

    // Arbitrary Firestore doc generator
    const arbitraryDoc = fc.record({
      order_id: fc.constantFrom(
        'STITCH-2026-001',
        'STITCH-2026-002',
        'ORDER-ABC',
        'ORD-123'
      ),
      order_status: fc.constantFrom('processing', 'in_transit', 'delivered', 'unknown'),
      user_email: fc.emailAddress(),
      user_address: fc.string(),
      phone_number: fc.string(),
      payment_provider: fc.constantFrom('paystack', 'stripe', 'flutterwave'),
      amount_paid: fc.integer({ min: 0, max: 1_000_000 }),
      coupon_code: fc.string(),
      payout_status: fc.constantFrom('pending', 'paid'),
      payout_amount: fc.integer({ min: 0 }),
      payout_reference: fc.string(),
      user_measurement: fc.record({ chest: fc.integer() }),
      shipping: fc.record({
        carrier: fc.constant('DHL'),
        trackingNumber: fc.string({ minLength: 1, maxLength: 20 }),
      }),
      timeline: fc.array(
        fc.record({
          occurredAt: fc.constant('2026-01-10T10:00:00Z'),
          typeCode: fc.option(fc.string({ maxLength: 5 })),
          status: fc.string({ maxLength: 20 }),
          description: fc.string({ maxLength: 100 }),
          location: fc.string({ maxLength: 50 }),
        }),
        { maxLength: 5 }
      ),
    });

    await fc.assert(
      fc.asyncProperty(arbitraryDoc, async (doc) => {
        resetStore();
        vi.clearAllMocks();
        mockWhere.mockReturnValue({ where: mockWhere, limit: mockLimit });
        mockCollectionGroup.mockReturnValue({ where: mockWhere });
        mockLimit.mockReturnValue({ get: mockGet });

        const snap = {
          empty: false,
          docs: [
            {
              data: () => ({
                ...doc,
                last_update: { toDate: () => new Date() },
              }),
              ref: { path: `users_orders/uid/user_orders/${doc.order_id}` },
            },
          ],
        };
        mockGet.mockResolvedValueOnce(snap);

        const res = await GET(makeRequest({ orderId: doc.order_id }));
        const body = await res.json();

        return piiFields.every((field) => !(field in body));
      }),
      { numRuns: 100 }
    );
  });
});
