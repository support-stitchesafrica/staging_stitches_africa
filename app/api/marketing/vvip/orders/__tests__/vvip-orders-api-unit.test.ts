/**
 * VVIP Orders API Routes Unit Tests
 * 
 * Tests specific examples and edge cases for VVIP order management endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { VvipErrorCode, PaymentStatus } from '@/types/vvip';
import { Timestamp } from 'firebase-admin/firestore';

// Mock dependencies
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock('@/lib/marketing/auth-middleware', () => ({
  authenticateRequest: vi.fn(),
}));

vi.mock('@/lib/marketing/vvip-order-service', () => ({
  vvipOrderService: {
    getVvipOrders: vi.fn(),
    approvePayment: vi.fn(),
    rejectPayment: vi.fn(),
  },
}));

vi.mock('@/lib/marketing/vvip-permission-service', () => ({
  vvipPermissionService: {
    getUserRole: vi.fn(),
    canViewVvipOrders: vi.fn(),
    canApprovePayment: vi.fn(),
    validatePermission: vi.fn(),
  },
}));

import { GET as getOrders } from '../route';
import { POST as approvePayment } from '../approve/route';
import { POST as rejectPayment } from '../reject/route';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { vvipOrderService } from '@/lib/marketing/vvip-order-service';
import { vvipPermissionService } from '@/lib/marketing/vvip-permission-service';
import { VvipError } from '@/types/vvip';

// Helper to create mock NextRequest
function createMockRequest(url: string, method: string, body?: any): NextRequest {
  const request = new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return request;
}

describe('VVIP Orders API Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/marketing/vvip/orders', () => {
    /**
     * Test order filtering by payment status
     * Requirement: 5.2
     */
    it('should filter orders by pending_verification status', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        authenticated: true,
        userId: 'admin-123',
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin' as any,
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);
      vi.mocked(vvipPermissionService.getUserRole).mockResolvedValue('super_admin');

      // Mock order service with pending orders
      const mockOrders = [
        {
          orderId: 'order-1',
          userId: 'user-1',
          payment_status: 'pending_verification' as const,
          payment_proof_url: 'https://example.com/proof.jpg',
          amount_paid: 50000,
          payment_date: Timestamp.now(),
          order_status: 'pending' as const,
          created_at: Timestamp.now(),
          items: [],
          total: 50000,
        },
      ];

      vi.mocked(vvipOrderService.getVvipOrders).mockResolvedValue(mockOrders as any);

      // Create request with payment_status filter
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/orders?payment_status=pending_verification',
        'GET'
      );

      // Execute: Get orders
      const response = await getOrders(request);
      const data = await response.json();

      // Verify: Response is successful
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.orders).toHaveLength(1);
      expect(data.orders[0].payment_status).toBe('pending_verification');

      // Verify: Service was called with correct filter
      expect(vvipOrderService.getVvipOrders).toHaveBeenCalledWith({
        payment_status: 'pending_verification',
      });
    });

    /**
     * Test order filtering by approved status
     * Requirement: 5.3
     */
    it('should filter orders by approved status', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        authenticated: true,
        userId: 'admin-123',
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin' as any,
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);
      vi.mocked(vvipPermissionService.getUserRole).mockResolvedValue('super_admin');

      // Mock order service with approved orders
      const mockOrders = [
        {
          orderId: 'order-2',
          userId: 'user-2',
          payment_status: 'approved' as const,
          payment_proof_url: 'https://example.com/proof2.jpg',
          amount_paid: 75000,
          payment_date: Timestamp.now(),
          order_status: 'processing' as const,
          created_at: Timestamp.now(),
          items: [],
          total: 75000,
        },
      ];

      vi.mocked(vvipOrderService.getVvipOrders).mockResolvedValue(mockOrders as any);

      // Create request with payment_status filter
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/orders?payment_status=approved',
        'GET'
      );

      // Execute: Get orders
      const response = await getOrders(request);
      const data = await response.json();

      // Verify: Response is successful
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.orders).toHaveLength(1);
      expect(data.orders[0].payment_status).toBe('approved');
    });

    /**
     * Test order filtering by rejected status
     * Requirement: 5.4
     */
    it('should filter orders by rejected status', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        authenticated: true,
        userId: 'admin-123',
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin' as any,
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);
      vi.mocked(vvipPermissionService.getUserRole).mockResolvedValue('super_admin');

      // Mock order service with rejected orders
      const mockOrders = [
        {
          orderId: 'order-3',
          userId: 'user-3',
          payment_status: 'rejected' as const,
          payment_proof_url: 'https://example.com/proof3.jpg',
          amount_paid: 30000,
          payment_date: Timestamp.now(),
          order_status: 'payment_failed' as const,
          admin_note: 'Invalid payment proof',
          created_at: Timestamp.now(),
          items: [],
          total: 30000,
        },
      ];

      vi.mocked(vvipOrderService.getVvipOrders).mockResolvedValue(mockOrders as any);

      // Create request with payment_status filter
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/orders?payment_status=rejected',
        'GET'
      );

      // Execute: Get orders
      const response = await getOrders(request);
      const data = await response.json();

      // Verify: Response is successful
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.orders).toHaveLength(1);
      expect(data.orders[0].payment_status).toBe('rejected');
      expect(data.orders[0].admin_note).toBe('Invalid payment proof');
    });

    it('should return 400 for invalid payment_status value', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        authenticated: true,
        userId: 'admin-123',
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin' as any,
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);

      // Create request with invalid payment_status
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/orders?payment_status=invalid_status',
        'GET'
      );

      // Execute: Get orders
      const response = await getOrders(request);
      const data = await response.json();

      // Verify: Response is error
      expect(response.status).toBe(400);
      expect(data.error).toBe(VvipErrorCode.VALIDATION_ERROR);
      expect(data.message).toContain('Invalid payment_status value');
    });
  });

  describe('POST /api/marketing/vvip/orders/approve', () => {
    /**
     * Test payment approval
     * Requirement: 5.13
     */
    it('should approve payment successfully', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        authenticated: true,
        userId: 'admin-123',
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin' as any,
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canApprovePayment).mockResolvedValue(true);

      // Mock order service
      vi.mocked(vvipOrderService.approvePayment).mockResolvedValue({
        success: true,
        message: 'Payment approved successfully',
        orderId: 'order-123',
        data: {
          payment_status: 'approved',
          order_status: 'processing',
          payment_verified_at: new Date().toISOString(),
        },
      });

      // Create request
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/orders/approve',
        'POST',
        {
          orderId: 'order-123',
          admin_note: 'Payment verified',
        }
      );

      // Execute: Approve payment
      const response = await approvePayment(request);
      const data = await response.json();

      // Verify: Response is successful
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.orderId).toBe('order-123');
      expect(data.payment_status).toBe('approved');
      expect(data.order_status).toBe('processing');

      // Verify: Service was called with correct parameters
      expect(vvipOrderService.approvePayment).toHaveBeenCalledWith(
        'order-123',
        'admin-123',
        'Payment verified'
      );
    });

    it('should return 400 when orderId is missing', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        authenticated: true,
        userId: 'admin-123',
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin' as any,
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canApprovePayment).mockResolvedValue(true);

      // Create request without orderId
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/orders/approve',
        'POST',
        {
          admin_note: 'Payment verified',
        }
      );

      // Execute: Approve payment
      const response = await approvePayment(request);
      const data = await response.json();

      // Verify: Response is error
      expect(response.status).toBe(400);
      expect(data.error).toBe(VvipErrorCode.VALIDATION_ERROR);
      expect(data.message).toContain('Order ID is required');
    });

    it('should return 403 for unauthorized user', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        authenticated: true,
        userId: 'team-member-123',
        user: {
          uid: 'team-member-123',
          email: 'member@example.com',
          role: 'team_member' as any,
        },
      } as any);

      // Mock permission check to deny access
      vi.mocked(vvipPermissionService.canApprovePayment).mockResolvedValue(false);

      // Create request
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/orders/approve',
        'POST',
        {
          orderId: 'order-123',
        }
      );

      // Execute: Approve payment
      const response = await approvePayment(request);
      const data = await response.json();

      // Verify: Response is error
      expect(response.status).toBe(403);
      expect(data.error).toBe(VvipErrorCode.UNAUTHORIZED);
      expect(data.message).toContain('Insufficient permissions');
    });
  });

  describe('POST /api/marketing/vvip/orders/reject', () => {
    /**
     * Test payment rejection
     * Requirement: 5.15
     */
    it('should reject payment successfully', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        authenticated: true,
        userId: 'admin-123',
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin' as any,
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canApprovePayment).mockResolvedValue(true);

      // Mock order service
      vi.mocked(vvipOrderService.rejectPayment).mockResolvedValue({
        success: true,
        message: 'Payment rejected successfully',
        orderId: 'order-123',
        data: {
          payment_status: 'rejected',
          order_status: 'payment_failed',
          payment_verified_at: new Date().toISOString(),
          admin_note: 'Invalid payment proof',
        },
      });

      // Create request
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/orders/reject',
        'POST',
        {
          orderId: 'order-123',
          admin_note: 'Invalid payment proof',
        }
      );

      // Execute: Reject payment
      const response = await rejectPayment(request);
      const data = await response.json();

      // Verify: Response is successful
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.orderId).toBe('order-123');
      expect(data.payment_status).toBe('rejected');
      expect(data.order_status).toBe('payment_failed');
      expect(data.admin_note).toBe('Invalid payment proof');

      // Verify: Service was called with correct parameters
      expect(vvipOrderService.rejectPayment).toHaveBeenCalledWith(
        'order-123',
        'admin-123',
        'Invalid payment proof'
      );
    });

    /**
     * Test admin note storage
     * Requirement: 5.17
     */
    it('should require admin note when rejecting payment', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        authenticated: true,
        userId: 'admin-123',
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin' as any,
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canApprovePayment).mockResolvedValue(true);

      // Create request without admin_note
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/orders/reject',
        'POST',
        {
          orderId: 'order-123',
        }
      );

      // Execute: Reject payment
      const response = await rejectPayment(request);
      const data = await response.json();

      // Verify: Response is error
      expect(response.status).toBe(400);
      expect(data.error).toBe(VvipErrorCode.VALIDATION_ERROR);
      expect(data.message).toContain('Admin note is required');
      expect(data.field).toBe('admin_note');
    });

    it('should reject empty admin note', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        authenticated: true,
        userId: 'admin-123',
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin' as any,
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canApprovePayment).mockResolvedValue(true);

      // Create request with empty admin_note
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/orders/reject',
        'POST',
        {
          orderId: 'order-123',
          admin_note: '   ',
        }
      );

      // Execute: Reject payment
      const response = await rejectPayment(request);
      const data = await response.json();

      // Verify: Response is error
      expect(response.status).toBe(400);
      expect(data.error).toBe(VvipErrorCode.VALIDATION_ERROR);
      expect(data.message).toContain('Admin note is required');
    });

    it('should return 403 for unauthorized user', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        authenticated: true,
        userId: 'team-member-123',
        user: {
          uid: 'team-member-123',
          email: 'member@example.com',
          role: 'team_member' as any,
        },
      } as any);

      // Mock permission check to deny access
      vi.mocked(vvipPermissionService.canApprovePayment).mockResolvedValue(false);

      // Create request
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/orders/reject',
        'POST',
        {
          orderId: 'order-123',
          admin_note: 'Invalid payment proof',
        }
      );

      // Execute: Reject payment
      const response = await rejectPayment(request);
      const data = await response.json();

      // Verify: Response is error
      expect(response.status).toBe(403);
      expect(data.error).toBe(VvipErrorCode.UNAUTHORIZED);
      expect(data.message).toContain('Insufficient permissions');
    });
  });
});
