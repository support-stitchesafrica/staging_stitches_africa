/**
 * Unit tests for POST /api/marketing/vendor-transactions/approve
 *
 * Covers: 400, 401, 403, 404, 409, 200 response scenarios.
 * Dependencies (firebase-admin, auth-middleware) are fully mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock firebase-admin/firestore FieldValue
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => '__SERVER_TIMESTAMP__',
  },
}));

// Shared Firestore mock state — mutated per test
const mockUpdate = vi.fn();
const mockTxDoc = {
  exists: true,
  data: () => ({ payment_status: 'unpaid', amount: 100 }),
};
const mockTxRef = {
  get: vi.fn().mockResolvedValue(mockTxDoc),
  update: mockUpdate,
};

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    // users_orders -> doc(userId) -> user_orders -> doc(orderId)
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue(mockTxRef),
        }),
      }),
    }),
  },
}));

// Mock auth middleware — default returns an authorized team_lead user
const mockAuthenticateRequest = vi.fn();
vi.mock('@/lib/marketing/auth-middleware', () => ({
  authenticateRequest: (...args: unknown[]) => mockAuthenticateRequest(...args),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/marketing/vendor-transactions/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}
function authorizedUser(role = 'team_lead') {
  return {
    user: {
      uid: 'user-123',
      email: 'lead@example.com',
      role,
      isActive: true,
    },
    permissions: {},
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/marketing/vendor-transactions/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset tx doc to default unpaid state
    mockTxDoc.exists = true;
    mockTxDoc.data = () => ({ payment_status: 'unpaid', amount: 100 });
    mockTxRef.get.mockResolvedValue(mockTxDoc);
    mockUpdate.mockResolvedValue(undefined);
    // Default: authenticated as team_lead
    mockAuthenticateRequest.mockResolvedValue(authorizedUser('team_lead'));
  });

  // ── 7.1 — HTTP 400 ──────────────────────────────────────────────────────

  describe('7.1 — HTTP 400: missing body fields', () => {
    it('returns 400 when userId is missing', async () => {
      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({ orderId: 'order-1' });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/userId/i);
    });

    it('returns 400 when orderId is missing', async () => {
      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({ userId: 'user-1' });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/orderId/i);
    });

    it('returns 400 when both userId and orderId are missing', async () => {
      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({});
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('returns 400 when body is not valid JSON', async () => {
      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = new NextRequest('http://localhost/api/marketing/vendor-transactions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  // ── 7.2 — HTTP 401 ──────────────────────────────────────────────────────

  describe('7.2 — HTTP 401: missing or invalid Authorization header', () => {
    it('returns 401 when Authorization header is absent', async () => {
      const { NextResponse } = await import('next/server');
      mockAuthenticateRequest.mockResolvedValue(
        NextResponse.json({ success: false, error: 'Missing authorization token' }, { status: 401 })
      );

      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({ userId: 'user-1', orderId: 'order-1' });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('returns 401 when token is invalid or expired', async () => {
      const { NextResponse } = await import('next/server');
      mockAuthenticateRequest.mockResolvedValue(
        NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
      );

      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest(
        { userId: 'user-1', orderId: 'order-1' },
        { Authorization: 'Bearer expired-token' }
      );
      const res = await POST(req);

      expect(res.status).toBe(401);
    });
  });

  // ── 7.3 — HTTP 403 ──────────────────────────────────────────────────────

  describe('7.3 — HTTP 403: team_member role is rejected, no Firestore write', () => {
    it('returns 403 when user role is team_member', async () => {
      mockAuthenticateRequest.mockResolvedValue(authorizedUser('team_member'));

      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({ userId: 'user-1', orderId: 'order-1' });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('does not write to Firestore when role is team_member', async () => {
      mockAuthenticateRequest.mockResolvedValue(authorizedUser('team_member'));

      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({ userId: 'user-1', orderId: 'order-1' });
      await POST(req);

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ── 7.4 — HTTP 404 ──────────────────────────────────────────────────────

  describe('7.4 — HTTP 404: transaction document does not exist', () => {
    it('returns 404 when transaction doc is not found', async () => {
      mockTxDoc.exists = false;
      mockTxRef.get.mockResolvedValue({ exists: false, data: () => undefined });

      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({ userId: 'user-1', orderId: 'order-missing' });
      const res = await POST(req);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/not found/i);
    });
  });

  // ── 7.5 — HTTP 409 ──────────────────────────────────────────────────────

  describe('7.5 — HTTP 409: transaction already paid, no Firestore write', () => {
    it('returns 409 when payment_status is already "paid"', async () => {
      mockTxRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ payment_status: 'paid', amount: 100 }),
      });

      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({ userId: 'user-1', orderId: 'order-paid' });
      const res = await POST(req);

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/already approved/i);
    });

    it('does not write to Firestore when transaction is already paid', async () => {
      mockTxRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ payment_status: 'paid', amount: 100 }),
      });

      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({ userId: 'user-1', orderId: 'order-paid' });
      await POST(req);

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ── 7.6 — HTTP 200 ──────────────────────────────────────────────────────

  describe('7.6 — HTTP 200: valid authorized request', () => {
    it('returns 200 with success payload', async () => {
      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({ userId: 'user-1', orderId: 'order-1' });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.orderId).toBe('order-1');
      expect(body.data.userId).toBe('user-1');
      expect(body.data.approved_at).toBeDefined();
    });

    it('updates Firestore with payment_status "paid", approved_at, and approved_by', async () => {
      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({ userId: 'user-1', orderId: 'order-1' });
      await POST(req);

      expect(mockUpdate).toHaveBeenCalledOnce();
      const updateArg = mockUpdate.mock.calls[0][0];
      expect(updateArg.payment_status).toBe('paid');
      expect(updateArg.approved_at).toBe('__SERVER_TIMESTAMP__');
      expect(updateArg.approved_by).toBe('user-123');
    });

    it('only modifies payment_status, approved_at, and approved_by — no extra fields', async () => {
      const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
      const req = makeRequest({ userId: 'user-1', orderId: 'order-1' });
      await POST(req);

      const updateArg = mockUpdate.mock.calls[0][0];
      const updatedKeys = Object.keys(updateArg);
      expect(updatedKeys).toHaveLength(3);
      expect(updatedKeys).toContain('payment_status');
      expect(updatedKeys).toContain('approved_at');
      expect(updatedKeys).toContain('approved_by');
    });

    it.each(['team_lead', 'bdm', 'super_admin'])(
      'returns 200 for authorized role: %s',
      async (role) => {
        mockAuthenticateRequest.mockResolvedValue(authorizedUser(role));

        const { POST } = await import('@/app/api/marketing/vendor-transactions/approve/route');
        const req = makeRequest({ userId: 'user-1', orderId: 'order-1' });
        const res = await POST(req);

        expect(res.status).toBe(200);
      }
    );
  });
});
