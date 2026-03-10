/**
 * VVIP Order Service Property-Based Tests
 * 
 * Tests universal properties for VVIP order management operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { VvipOrderService } from './vvip-order-service';
import { VvipErrorCode, PaymentStatus } from '@/types/vvip';
import { Timestamp } from 'firebase-admin/firestore';

// Mock firebase-admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

// Mock permission service
vi.mock('./vvip-permission-service', () => ({
  vvipPermissionService: {
    validatePermission: vi.fn(async () => {}),
  },
}));

// Mock audit service
vi.mock('./vvip-audit-service', () => ({
  vvipAuditService: {
    logVvipAction: vi.fn(async () => 'log-id-123'),
  },
}));

import { adminDb } from '@/lib/firebase-admin';
import { vvipPermissionService } from './vvip-permission-service';
import { vvipAuditService } from './vvip-audit-service';

// Helper to create mock Firestore document
function createMockDoc(exists: boolean, id: string, data?: any) {
  return {
    exists,
    id,
    data: () => data,
  };
}

// Helper to create mock Firestore query snapshot
function createMockSnapshot(docs: any[]) {
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
  };
}

// Generators for property-based testing
const orderIdArb = fc.uuid();
const userIdArb = fc.uuid();
const adminIdArb = fc.uuid();
const paymentStatusArb = fc.constantFrom<PaymentStatus>(
  'pending_verification',
  'approved',
  'rejected'
);
const amountArb = fc.float({ min: 1000, max: 1000000 });
const noteArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);

// Constrained date generator for valid Firestore timestamps
// Firestore valid range: [-62135596800, 253402300799] seconds
// This translates to approximately: 1902-01-01 to 9999-12-31
const validDateArb = fc.date({
  min: new Date('1902-01-01T00:00:00.000Z'),
  max: new Date('9999-12-31T23:59:59.999Z'),
}).filter(d => !isNaN(d.getTime()));

const vvipOrderDataArb = fc.record({
  userId: userIdArb,
  payment_method: fc.constant('manual_transfer'),
  isVvip: fc.constant(true),
  payment_status: paymentStatusArb,
  payment_proof_url: fc.webUrl(),
  amount_paid: amountArb,
  payment_reference: fc.option(fc.string({ minLength: 5, maxLength: 20 })),
  payment_date: validDateArb,
  order_status: fc.constantFrom('pending', 'processing', 'payment_failed'),
  admin_note: fc.option(noteArb),
  created_at: fc.constant(Timestamp.now()),
});

describe('VvipOrderService Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 16: VVIP Order Filters Work Correctly', () => {
    /**
     * Feature: vvip-shopper-program, Property 16: VVIP Order Filters Work Correctly
     * Validates: Requirements 5.2, 5.3, 5.4
     * 
     * For any payment status filter, the filtered order list should return 
     * all and only orders with the specified payment_status value.
     */
    it('should filter orders by payment status correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentStatusArb,
          fc.array(vvipOrderDataArb, { minLength: 0, maxLength: 10 }),
          async (filterStatus, orders) => {
            // Setup: Create orders with various payment statuses
            const matchingOrders = orders.filter(
              o => o.payment_status === filterStatus
            );
            const nonMatchingOrders = orders.filter(
              o => o.payment_status !== filterStatus
            );

            // Create mock documents for matching orders only
            const mockDocs = matchingOrders.map((order, idx) =>
              createMockDoc(true, `order-${idx}`, {
                ...order,
                payment_date: Timestamp.fromDate(order.payment_date),
              })
            );

            const mockQuery = {
              where: vi.fn().mockReturnThis(),
              orderBy: vi.fn().mockReturnThis(),
              get: vi.fn(async () => createMockSnapshot(mockDocs)),
            };

            const mockCollectionFn = vi.fn(() => mockQuery);
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Get VVIP orders with payment status filter
            const results = await VvipOrderService.getVvipOrders({
              payment_status: filterStatus,
            });

            // Verify: All results match the filter status
            expect(results.length).toBe(matchingOrders.length);
            results.forEach(result => {
              expect(result.payment_status).toBe(filterStatus);
            });

            // Verify: No non-matching statuses in results
            const resultStatuses = results.map(r => r.payment_status);
            nonMatchingOrders.forEach(order => {
              if (order.payment_status !== filterStatus) {
                expect(resultStatuses.filter(s => s === order.payment_status).length)
                  .toBeLessThanOrEqual(0);
              }
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return all VVIP orders when no filter is applied', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(vvipOrderDataArb, { minLength: 0, maxLength: 10 }),
          async (orders) => {
            // Setup: Create mock documents for all orders
            const mockDocs = orders.map((order, idx) =>
              createMockDoc(true, `order-${idx}`, {
                ...order,
                payment_date: Timestamp.fromDate(order.payment_date),
              })
            );

            const mockQuery = {
              where: vi.fn().mockReturnThis(),
              orderBy: vi.fn().mockReturnThis(),
              get: vi.fn(async () => createMockSnapshot(mockDocs)),
            };

            const mockCollectionFn = vi.fn(() => mockQuery);
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Get VVIP orders without filter
            const results = await VvipOrderService.getVvipOrders();

            // Verify: All orders are returned
            expect(results.length).toBe(orders.length);
            results.forEach(result => {
              expect(result.isVvip).toBe(true);
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should filter by user ID correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.array(vvipOrderDataArb, { minLength: 0, maxLength: 10 }),
          async (filterUserId, orders) => {
            // Setup: Create orders with various user IDs
            const matchingOrders = orders.filter(o => o.userId === filterUserId);

            const mockDocs = matchingOrders.map((order, idx) =>
              createMockDoc(true, `order-${idx}`, {
                ...order,
                userId: filterUserId,
                payment_date: Timestamp.fromDate(order.payment_date),
              })
            );

            const mockQuery = {
              where: vi.fn().mockReturnThis(),
              orderBy: vi.fn().mockReturnThis(),
              get: vi.fn(async () => createMockSnapshot(mockDocs)),
            };

            const mockCollectionFn = vi.fn(() => mockQuery);
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Get VVIP orders with user ID filter
            const results = await VvipOrderService.getVvipOrders({
              userId: filterUserId,
            });

            // Verify: All results match the filter user ID
            results.forEach(result => {
              expect(result.userId).toBe(filterUserId);
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 18: Payment Approval Updates Status Correctly', () => {
    /**
     * Feature: vvip-shopper-program, Property 18: Payment Approval Updates Status Correctly
     * Validates: Requirements 5.13, 5.14
     * 
     * For any order with payment_status="pending_verification", when an authorized 
     * admin approves the payment, the order should be updated with 
     * payment_status="approved" and order_status="processing".
     */
    it('should update payment and order status when approving payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          orderIdArb,
          adminIdArb,
          userIdArb,
          amountArb,
          fc.option(noteArb),
          async (orderId, adminId, userId, amountPaid, note) => {
            // Setup: Mock permission check to pass
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Mock order exists with pending_verification status
            const orderData = {
              userId,
              isVvip: true,
              payment_status: 'pending_verification',
              order_status: 'pending',
              amount_paid: amountPaid,
              payment_proof_url: 'https://example.com/proof.jpg',
              payment_date: Timestamp.now(),
              created_at: Timestamp.now(),
            };

            const mockDoc = createMockDoc(true, orderId, orderData);

            let updatedFields: any = null;

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
                update: vi.fn(async (fields) => {
                  updatedFields = fields;
                }),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Approve payment
            const result = await VvipOrderService.approvePayment(orderId, adminId, note);

            // Verify: Result indicates success
            expect(result.success).toBe(true);
            expect(result.orderId).toBe(orderId);

            // Verify: Status fields are updated correctly
            expect(updatedFields).not.toBeNull();
            expect(updatedFields.payment_status).toBe('approved');
            expect(updatedFields.order_status).toBe('processing');
            expect(updatedFields.payment_verified_by).toBe(adminId);
            expect(updatedFields.payment_verified_at).toBeInstanceOf(Timestamp);

            // Verify: Admin note is added if provided
            if (note) {
              expect(updatedFields.admin_note).toBe(note);
            }

            // Verify: Audit log was created
            expect(vvipAuditService.logVvipAction).toHaveBeenCalledWith(
              expect.objectContaining({
                action_type: 'payment_approved',
                performed_by: adminId,
                affected_user: userId,
              })
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject approval for non-pending orders', async () => {
      await fc.assert(
        fc.asyncProperty(
          orderIdArb,
          adminIdArb,
          userIdArb,
          fc.constantFrom<PaymentStatus>('approved', 'rejected'),
          async (orderId, adminId, userId, currentStatus) => {
            // Setup: Mock permission check to pass
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Mock order exists with non-pending status
            const orderData = {
              userId,
              isVvip: true,
              payment_status: currentStatus,
              order_status: currentStatus === 'approved' ? 'processing' : 'payment_failed',
              amount_paid: 10000,
              payment_proof_url: 'https://example.com/proof.jpg',
              payment_date: Timestamp.now(),
              created_at: Timestamp.now(),
            };

            const mockDoc = createMockDoc(true, orderId, orderData);

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute and Verify: Should throw error
            await expect(
              VvipOrderService.approvePayment(orderId, adminId)
            ).rejects.toThrow();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 19: Payment Rejection Updates Status Correctly', () => {
    /**
     * Feature: vvip-shopper-program, Property 19: Payment Rejection Updates Status Correctly
     * Validates: Requirements 5.15, 5.16
     * 
     * For any order with payment_status="pending_verification", when an authorized 
     * admin rejects the payment, the order should be updated with 
     * payment_status="rejected" and order_status="payment_failed".
     */
    it('should update payment and order status when rejecting payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          orderIdArb,
          adminIdArb,
          userIdArb,
          amountArb,
          noteArb,
          async (orderId, adminId, userId, amountPaid, note) => {
            // Setup: Mock permission check to pass
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Mock order exists with pending_verification status
            const orderData = {
              userId,
              isVvip: true,
              payment_status: 'pending_verification',
              order_status: 'pending',
              amount_paid: amountPaid,
              payment_proof_url: 'https://example.com/proof.jpg',
              payment_date: Timestamp.now(),
              created_at: Timestamp.now(),
            };

            const mockDoc = createMockDoc(true, orderId, orderData);

            let updatedFields: any = null;

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
                update: vi.fn(async (fields) => {
                  updatedFields = fields;
                }),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Reject payment
            const result = await VvipOrderService.rejectPayment(orderId, adminId, note);

            // Verify: Result indicates success
            expect(result.success).toBe(true);
            expect(result.orderId).toBe(orderId);

            // Verify: Status fields are updated correctly
            expect(updatedFields).not.toBeNull();
            expect(updatedFields.payment_status).toBe('rejected');
            expect(updatedFields.order_status).toBe('payment_failed');
            expect(updatedFields.payment_verified_by).toBe(adminId);
            expect(updatedFields.payment_verified_at).toBeInstanceOf(Timestamp);

            // Verify: Admin note is required and stored
            expect(updatedFields.admin_note).toBe(note);

            // Verify: Audit log was created
            expect(vvipAuditService.logVvipAction).toHaveBeenCalledWith(
              expect.objectContaining({
                action_type: 'payment_rejected',
                performed_by: adminId,
                affected_user: userId,
              })
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should require admin note when rejecting payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          orderIdArb,
          adminIdArb,
          userIdArb,
          async (orderId, adminId, userId) => {
            // Setup: Mock permission check to pass
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Mock order exists with pending_verification status
            const orderData = {
              userId,
              isVvip: true,
              payment_status: 'pending_verification',
              order_status: 'pending',
              amount_paid: 10000,
              payment_proof_url: 'https://example.com/proof.jpg',
              payment_date: Timestamp.now(),
              created_at: Timestamp.now(),
            };

            const mockDoc = createMockDoc(true, orderId, orderData);

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute and Verify: Should throw error for empty note
            await expect(
              VvipOrderService.rejectPayment(orderId, adminId, '')
            ).rejects.toThrow('Admin note is required');

            await expect(
              VvipOrderService.rejectPayment(orderId, adminId, '   ')
            ).rejects.toThrow('Admin note is required');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 20: Admin Notes Are Persisted', () => {
    /**
     * Feature: vvip-shopper-program, Property 20: Admin Notes Are Persisted
     * Validates: Requirements 5.17
     * 
     * For any admin note added during payment review, the note should be 
     * stored in the order document's admin_note field.
     */
    it('should persist admin note when approving payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          orderIdArb,
          adminIdArb,
          userIdArb,
          noteArb,
          async (orderId, adminId, userId, note) => {
            // Setup: Mock permission check to pass
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Mock order exists
            const orderData = {
              userId,
              isVvip: true,
              payment_status: 'pending_verification',
              order_status: 'pending',
              amount_paid: 10000,
              payment_proof_url: 'https://example.com/proof.jpg',
              payment_date: Timestamp.now(),
              created_at: Timestamp.now(),
            };

            const mockDoc = createMockDoc(true, orderId, orderData);

            let updatedFields: any = null;

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
                update: vi.fn(async (fields) => {
                  updatedFields = fields;
                }),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Approve payment with note
            await VvipOrderService.approvePayment(orderId, adminId, note);

            // Verify: Admin note is persisted
            expect(updatedFields).not.toBeNull();
            expect(updatedFields.admin_note).toBe(note);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should persist admin note when rejecting payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          orderIdArb,
          adminIdArb,
          userIdArb,
          noteArb,
          async (orderId, adminId, userId, note) => {
            // Setup: Mock permission check to pass
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Mock order exists
            const orderData = {
              userId,
              isVvip: true,
              payment_status: 'pending_verification',
              order_status: 'pending',
              amount_paid: 10000,
              payment_proof_url: 'https://example.com/proof.jpg',
              payment_date: Timestamp.now(),
              created_at: Timestamp.now(),
            };

            const mockDoc = createMockDoc(true, orderId, orderData);

            let updatedFields: any = null;

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
                update: vi.fn(async (fields) => {
                  updatedFields = fields;
                }),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Reject payment with note
            await VvipOrderService.rejectPayment(orderId, adminId, note);

            // Verify: Admin note is persisted
            expect(updatedFields).not.toBeNull();
            expect(updatedFields.admin_note).toBe(note);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should persist admin note when updating note directly', async () => {
      await fc.assert(
        fc.asyncProperty(
          orderIdArb,
          adminIdArb,
          userIdArb,
          noteArb,
          async (orderId, adminId, userId, note) => {
            // Setup: Mock permission check to pass
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Mock order exists
            const orderData = {
              userId,
              isVvip: true,
              payment_status: 'pending_verification',
              order_status: 'pending',
              amount_paid: 10000,
              payment_proof_url: 'https://example.com/proof.jpg',
              payment_date: Timestamp.now(),
              created_at: Timestamp.now(),
            };

            const mockDoc = createMockDoc(true, orderId, orderData);

            let updatedFields: any = null;

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
                update: vi.fn(async (fields) => {
                  updatedFields = fields;
                }),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Update admin note
            await VvipOrderService.updateAdminNote(orderId, adminId, note);

            // Verify: Admin note is persisted
            expect(updatedFields).not.toBeNull();
            expect(updatedFields.admin_note).toBe(note);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 21: Payment Status Changes Generate Audit Logs', () => {
    /**
     * Feature: vvip-shopper-program, Property 21: Payment Status Changes Generate Audit Logs
     * Validates: Requirements 5.18
     * 
     * For any payment approval or rejection, the system should create an audit log 
     * entry with the appropriate action_type, performing admin's ID, and affected order ID.
     */
    it('should create audit log when approving payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          orderIdArb,
          adminIdArb,
          userIdArb,
          amountArb,
          fc.option(noteArb),
          async (orderId, adminId, userId, amountPaid, note) => {
            // Setup: Mock permission check to pass
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Mock order exists
            const orderData = {
              userId,
              isVvip: true,
              payment_status: 'pending_verification',
              order_status: 'pending',
              amount_paid: amountPaid,
              payment_proof_url: 'https://example.com/proof.jpg',
              payment_date: Timestamp.now(),
              created_at: Timestamp.now(),
            };

            const mockDoc = createMockDoc(true, orderId, orderData);

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
                update: vi.fn(async () => {}),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Approve payment
            await VvipOrderService.approvePayment(orderId, adminId, note);

            // Verify: Audit log was created with correct action type
            expect(vvipAuditService.logVvipAction).toHaveBeenCalledWith(
              expect.objectContaining({
                action_type: 'payment_approved',
                performed_by: adminId,
                affected_user: userId,
                metadata: expect.objectContaining({
                  orderId,
                  previous_status: 'pending_verification',
                  new_status: 'approved',
                }),
              })
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should create audit log when rejecting payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          orderIdArb,
          adminIdArb,
          userIdArb,
          amountArb,
          noteArb,
          async (orderId, adminId, userId, amountPaid, note) => {
            // Setup: Mock permission check to pass
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Mock order exists
            const orderData = {
              userId,
              isVvip: true,
              payment_status: 'pending_verification',
              order_status: 'pending',
              amount_paid: amountPaid,
              payment_proof_url: 'https://example.com/proof.jpg',
              payment_date: Timestamp.now(),
              created_at: Timestamp.now(),
            };

            const mockDoc = createMockDoc(true, orderId, orderData);

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
                update: vi.fn(async () => {}),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Reject payment
            await VvipOrderService.rejectPayment(orderId, adminId, note);

            // Verify: Audit log was created with correct action type
            expect(vvipAuditService.logVvipAction).toHaveBeenCalledWith(
              expect.objectContaining({
                action_type: 'payment_rejected',
                performed_by: adminId,
                affected_user: userId,
                metadata: expect.objectContaining({
                  orderId,
                  admin_note: note,
                  previous_status: 'pending_verification',
                  new_status: 'rejected',
                }),
              })
            );
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
