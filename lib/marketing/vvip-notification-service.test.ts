// lib/marketing/vvip-notification-service.test.ts

/**
 * VVIP Notification Service Property-Based Tests
 * 
 * Tests universal properties for VVIP notification operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { VvipNotificationService } from './vvip-notification-service';
import { VvipNotificationEvent } from '@/types/vvip';

// Mock fetch globally
global.fetch = vi.fn();

// Arbitraries for property-based testing
const userIdArb = fc.uuid();
const emailArb = fc.emailAddress();
// Generate realistic names (alphanumeric with spaces, no whitespace-only strings)
const nameArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim());
const orderIdArb = fc.uuid();
const currencyArb = fc.constantFrom('USD', 'EUR', 'NGN');
const amountArb = fc.float({ min: 1000, max: 1000000, noNaN: true });
const dateStringArb = fc.date().map(d => d.toISOString());
const urlArb = fc.webUrl();
const noteArb = fc.option(
  fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  { nil: undefined }
);

const orderItemArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  quantity: fc.integer({ min: 1, max: 10 }),
  price: fc.float({ min: 10, max: 10000, noNaN: true }),
  image: fc.option(urlArb, { nil: undefined }),
});

describe('VvipNotificationService Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 22: Event Notifications Are Triggered', () => {
    /**
     * Feature: vvip-shopper-program, Property 22: Event Notifications Are Triggered
     * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
     * 
     * For any VVIP event (creation, order placement, payment approval, payment rejection, order shipment),
     * the notification service should be called with the correct event type and recipient information.
     */

    it('should trigger notification for vvip_created event', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          emailArb,
          nameArb,
          async (userId, userEmail, userName) => {
            // Setup: Clear previous mocks and mock successful email send
            vi.clearAllMocks();
            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({ success: true }),
            });

            // Execute: Send VVIP created notification
            const result = await VvipNotificationService.sendVvipCreatedEmail({
              userId,
              userEmail,
              userName,
            });

            // Verify: Notification was triggered
            expect(result.success).toBe(true);
            expect(result.event).toBe('vvip_created');
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(
              '/api/email/send',
              expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              })
            );

            // Verify: Email contains correct recipient and structure
            const fetchCall = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.to).toBe(userEmail);
            expect(body.subject).toContain('VVIP');
            expect(body.html).toBeDefined();
            expect(typeof body.html).toBe('string');
            expect(body.html.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should trigger notification for order_placed event', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          emailArb,
          nameArb,
          orderIdArb,
          dateStringArb,
          fc.array(orderItemArb, { minLength: 1, maxLength: 5 }),
          amountArb,
          currencyArb,
          dateStringArb,
          fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: undefined }),
          async (userId, userEmail, userName, orderId, orderDate, items, amountPaid, currency, paymentDate, paymentReference) => {
            // Setup: Clear previous mocks and mock successful email send
            vi.clearAllMocks();
            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({ success: true }),
            });

            const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Execute: Send order placed notification
            const result = await VvipNotificationService.sendOrderPlacedEmail({
              userId,
              userEmail,
              userName,
              orderId,
              orderDate,
              items,
              total,
              currency,
              amountPaid,
              paymentReference,
              paymentDate,
            });

            // Verify: Notification was triggered
            expect(result.success).toBe(true);
            expect(result.event).toBe('order_placed');
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Verify: Email contains order information
            const fetchCall = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.to).toBe(userEmail);
            expect(body.subject).toContain(orderId);
            expect(body.html).toBeDefined();
            expect(typeof body.html).toBe('string');
            expect(body.html.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should trigger notification for payment_approved event', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          emailArb,
          nameArb,
          orderIdArb,
          amountArb,
          currencyArb,
          fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: undefined }),
          noteArb,
          async (userId, userEmail, userName, orderId, amountPaid, currency, paymentReference, adminNote) => {
            // Setup: Clear previous mocks and mock successful email send
            vi.clearAllMocks();
            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({ success: true }),
            });

            // Execute: Send payment approved notification
            const result = await VvipNotificationService.sendPaymentApprovedEmail({
              userId,
              userEmail,
              userName,
              orderId,
              amountPaid,
              currency,
              paymentReference,
              adminNote,
            });

            // Verify: Notification was triggered
            expect(result.success).toBe(true);
            expect(result.event).toBe('payment_approved');
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Verify: Email contains approval information
            const fetchCall = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.to).toBe(userEmail);
            expect(body.subject).toContain('Approved');
            expect(body.subject).toContain(orderId);
            expect(body.html).toBeDefined();
            expect(typeof body.html).toBe('string');
            expect(body.html.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should trigger notification for payment_rejected event', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          emailArb,
          nameArb,
          orderIdArb,
          amountArb,
          currencyArb,
          fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: undefined }),
          fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 10),
          noteArb,
          async (userId, userEmail, userName, orderId, amountPaid, currency, paymentReference, rejectionReason, adminNote) => {
            // Setup: Clear previous mocks and mock successful email send
            vi.clearAllMocks();
            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({ success: true }),
            });

            // Execute: Send payment rejected notification
            const result = await VvipNotificationService.sendPaymentRejectedEmail({
              userId,
              userEmail,
              userName,
              orderId,
              amountPaid,
              currency,
              paymentReference,
              rejectionReason,
              adminNote,
            });

            // Verify: Notification was triggered
            expect(result.success).toBe(true);
            expect(result.event).toBe('payment_rejected');
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Verify: Email contains rejection information
            const fetchCall = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.to).toBe(userEmail);
            expect(body.subject).toContain('Issue');
            expect(body.subject).toContain(orderId);
            expect(body.html).toBeDefined();
            expect(typeof body.html).toBe('string');
            expect(body.html.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should trigger notification for order_shipped event', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          emailArb,
          nameArb,
          orderIdArb,
          fc.option(fc.string({ minLength: 10, maxLength: 30 }), { nil: undefined }),
          fc.option(fc.constantFrom('DHL', 'FedEx', 'UPS', 'USPS'), { nil: undefined }),
          fc.option(dateStringArb, { nil: undefined }),
          fc.option(urlArb, { nil: undefined }),
          async (userId, userEmail, userName, orderId, trackingNumber, carrier, estimatedDelivery, trackingUrl) => {
            // Setup: Clear previous mocks and mock successful email send
            vi.clearAllMocks();
            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({ success: true }),
            });

            // Execute: Send order shipped notification
            const result = await VvipNotificationService.sendOrderShippedEmail({
              userId,
              userEmail,
              userName,
              orderId,
              trackingNumber,
              carrier,
              estimatedDelivery,
              trackingUrl,
            });

            // Verify: Notification was triggered
            expect(result.success).toBe(true);
            expect(result.event).toBe('order_shipped');
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Verify: Email contains shipping information
            const fetchCall = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.to).toBe(userEmail);
            expect(body.subject).toContain('Shipped');
            expect(body.subject).toContain(orderId);
            expect(body.html).toBeDefined();
            expect(typeof body.html).toBe('string');
            expect(body.html.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle notification failures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          emailArb,
          nameArb,
          async (userId, userEmail, userName) => {
            // Setup: Mock failed email send
            (global.fetch as any).mockResolvedValue({
              ok: false,
              json: async () => ({ error: 'Email service unavailable' }),
            });

            // Execute and Verify: Should throw error
            await expect(
              VvipNotificationService.sendVvipCreatedEmail({
                userId,
                userEmail,
                userName,
              })
            ).rejects.toThrow();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 22: Notification Service Routes to Correct Event Handler', () => {
    /**
     * For any notification event type, the sendNotification method should route
     * to the correct event-specific handler
     */

    it('should route to correct handler for each event type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<VvipNotificationEvent>(
            'vvip_created',
            'order_placed',
            'payment_approved',
            'payment_rejected',
            'order_shipped'
          ),
          async (eventType) => {
            // Setup: Mock successful email send
            (global.fetch as any).mockResolvedValue({
              ok: true,
              json: async () => ({ success: true }),
            });

            // Create minimal valid data for each event type
            const eventData: any = {
              userId: 'test-user-id',
              userEmail: 'test@example.com',
              userName: 'Test User',
              orderId: 'test-order-id',
              amountPaid: 1000,
              currency: 'USD',
              orderDate: new Date().toISOString(),
              items: [{ title: 'Test Item', quantity: 1, price: 1000 }],
              total: 1000,
              paymentDate: new Date().toISOString(),
              rejectionReason: 'Test reason',
            };

            // Execute: Send notification via generic method
            const result = await VvipNotificationService.sendNotification(eventType, eventData);

            // Verify: Correct event type is returned
            expect(result.success).toBe(true);
            expect(result.event).toBe(eventType);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
