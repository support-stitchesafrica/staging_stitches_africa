/**
 * VVIP Orders API Routes Property-Based Tests
 * 
 * Tests universal properties for VVIP order management endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { NextRequest } from 'next/server';
import { VvipErrorCode, PaymentStatus, VvipOrderStatus } from '@/types/vvip';
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

// Generators for property-based testing
const userIdArb = fc.uuid();
const orderIdArb = fc.uuid();
const emailArb = fc.emailAddress();
const roleArb = fc.constantFrom('super_admin', 'bdm', 'team_lead', 'team_member');
const paymentStatusArb = fc.constantFrom<PaymentStatus>('pending_verification', 'approved', 'rejected');
const orderStatusArb = fc.constantFrom<VvipOrderStatus>('pending', 'processing', 'payment_failed', 'shipped', 'delivered');
const amountArb = fc.float({ min: 1000, max: 1000000 });
const referenceArb = fc.option(fc.string({ minLength: 5, maxLength: 20 }));
const noteArb = fc.option(fc.string({ minLength: 10, maxLength: 500 }));

// Date generator with Firestore Timestamp constraints
// Firestore Timestamp valid range: [-62135596800, 253402300799] seconds
const validDateArb = fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime()));

// Generator for VVIP order
const vvipOrderArb = fc.record({
  orderId: orderIdArb,
  userId: userIdArb,
  user_email: emailArb,
  user_name: fc.string({ minLength: 3, maxLength: 50 }),
  payment_method: fc.constant('manual_transfer' as const),
  isVvip: fc.constant(true as const),
  payment_status: paymentStatusArb,
  payment_proof_url: fc.webUrl(),
  amount_paid: amountArb.filter(n => !isNaN(n) && isFinite(n)),
  payment_reference: referenceArb,
  payment_date: validDateArb,
  order_status: orderStatusArb,
  admin_note: noteArb,
  payment_verified_by: fc.option(userIdArb),
  payment_verified_at: fc.option(validDateArb),
  created_at: validDateArb,
  updated_at: fc.option(validDateArb),
  items: fc.array(fc.record({
    productId: fc.uuid(),
    title: fc.string(),
    quantity: fc.integer({ min: 1, max: 10 }),
    price: fc.float({ min: 100, max: 10000 }).filter(n => !isNaN(n) && isFinite(n)),
  })),
  total: amountArb.filter(n => !isNaN(n) && isFinite(n)),
  shipping_address: fc.record({
    street: fc.string(),
    city: fc.string(),
    country: fc.string(),
    postalCode: fc.string(),
  }),
});

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

// Helper to convert Date to Timestamp for mocking
function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

describe('VVIP Orders API Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 17: VVIP Order Response Contains All Required Fields', () => {
    /**
     * Feature: vvip-shopper-program, Property 17: VVIP Order Response Contains All Required Fields
     * Validates: Requirements 5.5, 5.6, 5.7, 5.8, 5.9
     * 
     * For any VVIP order in the list, the response should include payment_proof_url, 
     * amount_paid, payment_reference, payment_date, and all standard order details.
     */
    it('should include all required fields in order response', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          roleArb,
          fc.array(vvipOrderArb, { minLength: 1, maxLength: 10 }),
          async (adminId, role, orders) => {
            // Setup: Mock authentication
            vi.mocked(authenticateRequest).mockResolvedValue({
              authenticated: true,
              userId: adminId,
              user: {
                uid: adminId,
                email: 'admin@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission check
            vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);
            vi.mocked(vvipPermissionService.getUserRole).mockResolvedValue(role);

            // Convert dates to Timestamps for mock orders
            const mockOrders = orders.map(order => ({
              ...order,
              payment_date: dateToTimestamp(order.payment_date),
              created_at: dateToTimestamp(order.created_at),
              updated_at: order.updated_at ? dateToTimestamp(order.updated_at) : undefined,
              payment_verified_at: order.payment_verified_at ? dateToTimestamp(order.payment_verified_at) : undefined,
            }));

            // Mock order service
            vi.mocked(vvipOrderService.getVvipOrders).mockResolvedValue(mockOrders as any);

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/orders',
              'GET'
            );

            // Execute: Get orders
            const response = await getOrders(request);
            const data = await response.json();

            // Verify: Response is successful
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.orders).toBeDefined();
            expect(Array.isArray(data.orders)).toBe(true);

            // Verify: Each order contains all required fields (Requirements 5.5, 5.6, 5.7, 5.8, 5.9)
            data.orders.forEach((order: any, index: number) => {
              const originalOrder = orders[index];

              // Required fields from Requirements 5.5, 5.6, 5.7, 5.8, 5.9
              expect(order.orderId).toBeDefined();
              expect(order.userId).toBeDefined();
              expect(order.payment_proof_url).toBeDefined(); // Requirement 5.5
              expect(order.amount_paid).toBeDefined(); // Requirement 5.6
              expect(order.payment_date).toBeDefined(); // Requirement 5.8
              expect(order.order_status).toBeDefined(); // Requirement 5.9
              expect(order.payment_status).toBeDefined();
              
              // Payment reference is optional but should be included if present
              if (originalOrder.payment_reference !== null && originalOrder.payment_reference !== undefined) {
                expect(order.payment_reference).toBeDefined(); // Requirement 5.7
              }

              // Standard order fields
              expect(order.items).toBeDefined();
              expect(order.total).toBeDefined();
              expect(order.shipping_address).toBeDefined();
              expect(order.created_at).toBeDefined();

              // User information
              expect(order.user_email).toBeDefined();
              expect(order.user_name).toBeDefined();

              // Verify field types
              expect(typeof order.orderId).toBe('string');
              expect(typeof order.userId).toBe('string');
              expect(typeof order.payment_proof_url).toBe('string');
              expect(typeof order.amount_paid).toBe('number');
              expect(typeof order.payment_date).toBe('string'); // ISO string
              expect(typeof order.payment_status).toBe('string');
              expect(typeof order.order_status).toBe('string');
              expect(Array.isArray(order.items)).toBe(true);
              expect(typeof order.total).toBe('number');
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should include payment_reference when present', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          roleArb,
          vvipOrderArb.filter(order => order.payment_reference !== null && order.payment_reference !== undefined),
          async (adminId, role, order) => {
            // Setup: Mock authentication
            vi.mocked(authenticateRequest).mockResolvedValue({
              authenticated: true,
              userId: adminId,
              user: {
                uid: adminId,
                email: 'admin@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission check
            vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);
            vi.mocked(vvipPermissionService.getUserRole).mockResolvedValue(role);

            // Convert dates to Timestamps
            const mockOrder = {
              ...order,
              payment_date: dateToTimestamp(order.payment_date),
              created_at: dateToTimestamp(order.created_at),
              updated_at: order.updated_at ? dateToTimestamp(order.updated_at) : undefined,
              payment_verified_at: order.payment_verified_at ? dateToTimestamp(order.payment_verified_at) : undefined,
            };

            // Mock order service
            vi.mocked(vvipOrderService.getVvipOrders).mockResolvedValue([mockOrder as any]);

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/orders',
              'GET'
            );

            // Execute: Get orders
            const response = await getOrders(request);
            const data = await response.json();

            // Verify: Response includes payment_reference (Requirement 5.7)
            expect(response.status).toBe(200);
            expect(data.orders).toHaveLength(1);
            expect(data.orders[0].payment_reference).toBeDefined();
            expect(data.orders[0].payment_reference).toBe(order.payment_reference);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should include all order items with complete details', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          roleArb,
          vvipOrderArb.filter(order => order.items.length > 0),
          async (adminId, role, order) => {
            // Setup: Mock authentication
            vi.mocked(authenticateRequest).mockResolvedValue({
              authenticated: true,
              userId: adminId,
              user: {
                uid: adminId,
                email: 'admin@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission check
            vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);
            vi.mocked(vvipPermissionService.getUserRole).mockResolvedValue(role);

            // Convert dates to Timestamps
            const mockOrder = {
              ...order,
              payment_date: dateToTimestamp(order.payment_date),
              created_at: dateToTimestamp(order.created_at),
              updated_at: order.updated_at ? dateToTimestamp(order.updated_at) : undefined,
              payment_verified_at: order.payment_verified_at ? dateToTimestamp(order.payment_verified_at) : undefined,
            };

            // Mock order service
            vi.mocked(vvipOrderService.getVvipOrders).mockResolvedValue([mockOrder as any]);

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/orders',
              'GET'
            );

            // Execute: Get orders
            const response = await getOrders(request);
            const data = await response.json();

            // Verify: Response includes all order items
            expect(response.status).toBe(200);
            expect(data.orders).toHaveLength(1);
            expect(data.orders[0].items).toBeDefined();
            expect(Array.isArray(data.orders[0].items)).toBe(true);
            expect(data.orders[0].items.length).toBe(order.items.length);

            // Verify each item has required fields
            data.orders[0].items.forEach((item: any) => {
              expect(item.productId).toBeDefined();
              expect(item.title).toBeDefined();
              expect(item.quantity).toBeDefined();
              expect(item.price).toBeDefined();
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should include shipping address with all details', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          roleArb,
          vvipOrderArb,
          async (adminId, role, order) => {
            // Setup: Mock authentication
            vi.mocked(authenticateRequest).mockResolvedValue({
              authenticated: true,
              userId: adminId,
              user: {
                uid: adminId,
                email: 'admin@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission check
            vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);
            vi.mocked(vvipPermissionService.getUserRole).mockResolvedValue(role);

            // Convert dates to Timestamps
            const mockOrder = {
              ...order,
              payment_date: dateToTimestamp(order.payment_date),
              created_at: dateToTimestamp(order.created_at),
              updated_at: order.updated_at ? dateToTimestamp(order.updated_at) : undefined,
              payment_verified_at: order.payment_verified_at ? dateToTimestamp(order.payment_verified_at) : undefined,
            };

            // Mock order service
            vi.mocked(vvipOrderService.getVvipOrders).mockResolvedValue([mockOrder as any]);

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/orders',
              'GET'
            );

            // Execute: Get orders
            const response = await getOrders(request);
            const data = await response.json();

            // Verify: Response includes shipping address
            expect(response.status).toBe(200);
            expect(data.orders).toHaveLength(1);
            expect(data.orders[0].shipping_address).toBeDefined();
            expect(typeof data.orders[0].shipping_address).toBe('object');

            // Verify shipping address fields
            const address = data.orders[0].shipping_address;
            expect(address.street).toBeDefined();
            expect(address.city).toBeDefined();
            expect(address.country).toBeDefined();
            expect(address.postalCode).toBeDefined();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 10: Role-Based UI Elements Are Included', () => {
    /**
     * Feature: vvip-shopper-program, Property 10: Role-Based UI Elements Are Included
     * Validates: Requirements 2.12, 2.13, 2.14, 5.10, 5.11, 5.12
     * 
     * For any user with role "super_admin" or "bdm", responses for VVIP shoppers and orders 
     * should include action buttons and editable fields, while responses for "team_member" 
     * should not include these elements.
     */
    it('should include action buttons for super_admin and bdm roles', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.constantFrom('super_admin', 'bdm'),
          fc.array(vvipOrderArb, { minLength: 1, maxLength: 5 }),
          async (adminId, role, orders) => {
            // Setup: Mock authentication with authorized role
            vi.mocked(authenticateRequest).mockResolvedValue({
              authenticated: true,
              userId: adminId,
              user: {
                uid: adminId,
                email: 'admin@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission check
            vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);
            vi.mocked(vvipPermissionService.getUserRole).mockResolvedValue(role);

            // Convert dates to Timestamps for mock orders
            const mockOrders = orders.map(order => ({
              ...order,
              payment_date: dateToTimestamp(order.payment_date),
              created_at: dateToTimestamp(order.created_at),
              updated_at: order.updated_at ? dateToTimestamp(order.updated_at) : undefined,
              payment_verified_at: order.payment_verified_at ? dateToTimestamp(order.payment_verified_at) : undefined,
              payment_status: 'pending_verification' as const, // Set to pending for action buttons
            }));

            // Mock order service
            vi.mocked(vvipOrderService.getVvipOrders).mockResolvedValue(mockOrders as any);

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/orders',
              'GET'
            );

            // Execute: Get orders
            const response = await getOrders(request);
            const data = await response.json();

            // Verify: Response is successful
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            // Verify: Each order includes action buttons (Requirements 5.10, 5.11, 5.12)
            data.orders.forEach((order: any) => {
              // Super admin and BDM should have action buttons
              expect(order.canApprove).toBeDefined();
              expect(order.canReject).toBeDefined();
              expect(order.canAddNote).toBeDefined();

              // For pending orders, buttons should be enabled
              if (order.payment_status === 'pending_verification') {
                expect(order.canApprove).toBe(true);
                expect(order.canReject).toBe(true);
              }

              // Should always be able to add notes
              expect(order.canAddNote).toBe(true);

              // Should include admin-specific fields
              expect(order).toHaveProperty('admin_note');
              expect(order).toHaveProperty('payment_verified_by');
              // payment_verified_at may be undefined for pending orders
              if (order.payment_verified_at !== undefined) {
                expect(typeof order.payment_verified_at).toBe('string');
              }
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should exclude action buttons for team_lead role', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.array(vvipOrderArb, { minLength: 1, maxLength: 5 }),
          async (adminId, orders) => {
            // Setup: Mock authentication with team_lead role
            vi.mocked(authenticateRequest).mockResolvedValue({
              authenticated: true,
              userId: adminId,
              user: {
                uid: adminId,
                email: 'teamlead@example.com',
                role: 'team_lead' as any,
              },
            } as any);

            // Mock permission check
            vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);
            vi.mocked(vvipPermissionService.getUserRole).mockResolvedValue('team_lead');

            // Convert dates to Timestamps for mock orders
            const mockOrders = orders.map(order => ({
              ...order,
              payment_date: dateToTimestamp(order.payment_date),
              created_at: dateToTimestamp(order.created_at),
              updated_at: order.updated_at ? dateToTimestamp(order.updated_at) : undefined,
              payment_verified_at: order.payment_verified_at ? dateToTimestamp(order.payment_verified_at) : undefined,
            }));

            // Mock order service
            vi.mocked(vvipOrderService.getVvipOrders).mockResolvedValue(mockOrders as any);

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/orders',
              'GET'
            );

            // Execute: Get orders
            const response = await getOrders(request);
            const data = await response.json();

            // Verify: Response is successful
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            // Verify: Team leads can see admin fields but cannot perform actions
            data.orders.forEach((order: any) => {
              // Should have action button flags but set to false
              expect(order.canApprove).toBe(false);
              expect(order.canReject).toBe(false);
              expect(order.canAddNote).toBe(false);

              // Should still see admin fields (read-only)
              expect(order).toHaveProperty('admin_note');
              expect(order).toHaveProperty('payment_verified_by');
              // payment_verified_at may be undefined for pending orders
              if (order.payment_verified_at !== undefined) {
                expect(typeof order.payment_verified_at).toBe('string');
              }
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should exclude action buttons and admin fields for team_member role', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.array(vvipOrderArb, { minLength: 1, maxLength: 5 }),
          async (adminId, orders) => {
            // Setup: Mock authentication with team_member role
            vi.mocked(authenticateRequest).mockResolvedValue({
              authenticated: true,
              userId: adminId,
              user: {
                uid: adminId,
                email: 'member@example.com',
                role: 'team_member' as any,
              },
            } as any);

            // Mock permission check
            vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);
            vi.mocked(vvipPermissionService.getUserRole).mockResolvedValue('team_member');

            // Convert dates to Timestamps for mock orders
            const mockOrders = orders.map(order => ({
              ...order,
              payment_date: dateToTimestamp(order.payment_date),
              created_at: dateToTimestamp(order.created_at),
              updated_at: order.updated_at ? dateToTimestamp(order.updated_at) : undefined,
              payment_verified_at: order.payment_verified_at ? dateToTimestamp(order.payment_verified_at) : undefined,
            }));

            // Mock order service
            vi.mocked(vvipOrderService.getVvipOrders).mockResolvedValue(mockOrders as any);

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/orders',
              'GET'
            );

            // Execute: Get orders
            const response = await getOrders(request);
            const data = await response.json();

            // Verify: Response is successful
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            // Verify: Team members get read-only view (Requirements 2.14)
            data.orders.forEach((order: any) => {
              // Should have action button flags set to false
              expect(order.canApprove).toBe(false);
              expect(order.canReject).toBe(false);
              expect(order.canAddNote).toBe(false);

              // Should NOT include admin-specific fields
              expect(order.admin_note).toBeUndefined();
              expect(order.payment_verified_by).toBeUndefined();
              expect(order.payment_verified_at).toBeUndefined();
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should disable action buttons for non-pending orders', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.constantFrom('super_admin', 'bdm'),
          fc.constantFrom<PaymentStatus>('approved', 'rejected'),
          fc.array(vvipOrderArb, { minLength: 1, maxLength: 5 }),
          async (adminId, role, paymentStatus, orders) => {
            // Setup: Mock authentication
            vi.mocked(authenticateRequest).mockResolvedValue({
              authenticated: true,
              userId: adminId,
              user: {
                uid: adminId,
                email: 'admin@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission check
            vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);
            vi.mocked(vvipPermissionService.getUserRole).mockResolvedValue(role);

            // Convert dates to Timestamps and set payment status
            const mockOrders = orders.map(order => ({
              ...order,
              payment_status: paymentStatus,
              payment_date: dateToTimestamp(order.payment_date),
              created_at: dateToTimestamp(order.created_at),
              updated_at: order.updated_at ? dateToTimestamp(order.updated_at) : undefined,
              payment_verified_at: order.payment_verified_at ? dateToTimestamp(order.payment_verified_at) : undefined,
            }));

            // Mock order service
            vi.mocked(vvipOrderService.getVvipOrders).mockResolvedValue(mockOrders as any);

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/orders',
              'GET'
            );

            // Execute: Get orders
            const response = await getOrders(request);
            const data = await response.json();

            // Verify: Response is successful
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            // Verify: Action buttons are disabled for non-pending orders
            data.orders.forEach((order: any) => {
              // For approved/rejected orders, action buttons should be disabled
              expect(order.canApprove).toBe(false);
              expect(order.canReject).toBe(false);

              // Can still add notes
              expect(order.canAddNote).toBe(true);
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
