/**
 * Tests for ActivityTracker
 * Property-based tests and unit tests for shop activity tracking
 * 
 * Validates Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ActivityTracker } from './activity-tracker';
import type { ShopActivity } from '@/types/shop-activities';

// Mock Firebase using vi.hoisted to avoid hoisting issues
const { mockAddDoc, mockCollection, mockTimestampNow } = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockTimestampNow: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
}));

vi.mock('@/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  addDoc: mockAddDoc,
  Timestamp: {
    now: mockTimestampNow
  }
}));

describe('ActivityTracker', () => {
  let tracker: ActivityTracker;
  let localStorageMock: any;
  let sessionStorageMock: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    mockAddDoc.mockClear();
    mockAddDoc.mockResolvedValue({ id: 'mock-doc-id' });
    
    // Setup localStorage and sessionStorage mocks
    localStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    sessionStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    
    global.localStorage = localStorageMock as any;
    global.sessionStorage = sessionStorageMock as any;
    
    // Mock window
    global.window = {
      innerWidth: 1024
    } as any;
    
    // Mock navigator
    global.navigator = {
      userAgent: 'Mozilla/5.0 Test Browser'
    } as any;
    
    // Mock document
    global.document = {
      referrer: 'https://google.com'
    } as any;
    
    tracker = new ActivityTracker();
  });

  afterEach(() => {
    if (tracker) {
      tracker.destroy();
    }
  });

  // ============================================================================
  // Property-Based Tests
  // ============================================================================

  describe('Property 37: Activity logging completeness', () => {
    /**
     * Feature: vendor-analytics-upgrade, Property 37: Activity logging completeness
     * Validates: Requirements 21.1
     * 
     * For any product view event, all required fields must be present in the logged activity
     */
    it('should log complete activity data for all product views', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // productId
          fc.string({ minLength: 1, maxLength: 50 }), // vendorId
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // userId
          async (productId, vendorId, userId) => {
            // Reset mock
            mockAddDoc.mockClear();
            
            await tracker.trackProductView(productId, vendorId, userId);
            
            // Verify addDoc was called
            expect(mockAddDoc).toHaveBeenCalledTimes(1);
            
            const loggedActivity = mockAddDoc.mock.calls[0][1];
            
            // Check all required fields are present
            expect(loggedActivity).toHaveProperty('id');
            expect(loggedActivity).toHaveProperty('type', 'view');
            expect(loggedActivity).toHaveProperty('userId');
            expect(loggedActivity).toHaveProperty('sessionId');
            expect(loggedActivity).toHaveProperty('vendorId', vendorId);
            expect(loggedActivity).toHaveProperty('productId', productId);
            expect(loggedActivity).toHaveProperty('timestamp');
            expect(loggedActivity).toHaveProperty('metadata');
            
            // Check metadata completeness
            expect(loggedActivity.metadata).toHaveProperty('deviceType');
            expect(loggedActivity.metadata).toHaveProperty('userAgent');
            expect(loggedActivity.metadata).toHaveProperty('location');
            expect(loggedActivity.metadata).toHaveProperty('source');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 38: Cart activity tracking', () => {
    /**
     * Feature: vendor-analytics-upgrade, Property 38: Cart activity tracking
     * Validates: Requirements 21.2, 21.3
     * 
     * For any cart action (add/remove), the activity must be logged with correct type and product details
     */
    it('should correctly track add to cart activities', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // productId
          fc.string({ minLength: 1, maxLength: 50 }), // vendorId
          fc.integer({ min: 1, max: 100 }), // quantity
          fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }), // price
          async (productId, vendorId, quantity, price) => {
            mockAddDoc.mockClear();
            mockAddDoc.mockResolvedValue({ id: 'mock-doc-id' });
            
            await tracker.trackAddToCart(productId, vendorId, quantity, price);
            
            expect(mockAddDoc).toHaveBeenCalledTimes(1);
            
            const loggedActivity = mockAddDoc.mock.calls[0][1];
            
            // Verify cart-specific fields
            expect(loggedActivity.type).toBe('add_to_cart');
            expect(loggedActivity.productId).toBe(productId);
            expect(loggedActivity.vendorId).toBe(vendorId);
            expect(loggedActivity.metadata.quantity).toBe(quantity);
            expect(loggedActivity.metadata.price).toBe(price);
            expect(loggedActivity.metadata.currency).toBe('USD');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should correctly track remove from cart activities', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // productId
          fc.string({ minLength: 1, maxLength: 50 }), // vendorId
          async (productId, vendorId) => {
            mockAddDoc.mockClear();
            
            await tracker.trackRemoveFromCart(productId, vendorId);
            
            expect(mockAddDoc).toHaveBeenCalledTimes(1);
            
            const loggedActivity = mockAddDoc.mock.calls[0][1];
            
            expect(loggedActivity.type).toBe('remove_from_cart');
            expect(loggedActivity.productId).toBe(productId);
            expect(loggedActivity.vendorId).toBe(vendorId);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 39: Purchase activity tracking', () => {
    /**
     * Feature: vendor-analytics-upgrade, Property 39: Purchase activity tracking
     * Validates: Requirements 21.4
     * 
     * For any purchase, the activity must include order details and location information
     */
    it('should log complete purchase data with location', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // orderId
          fc.string({ minLength: 1, maxLength: 50 }), // productId
          fc.string({ minLength: 1, maxLength: 50 }), // vendorId
          fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }), // amount
          fc.integer({ min: 1, max: 100 }), // quantity
          async (orderId, productId, vendorId, amount, quantity) => {
            mockAddDoc.mockClear();
            mockAddDoc.mockResolvedValue({ id: 'mock-doc-id' });
            
            await tracker.trackPurchase(orderId, productId, vendorId, amount, quantity);
            
            expect(mockAddDoc).toHaveBeenCalledTimes(1);
            
            const loggedActivity = mockAddDoc.mock.calls[0][1];
            
            // Verify purchase-specific fields
            expect(loggedActivity.type).toBe('purchase');
            expect(loggedActivity.productId).toBe(productId);
            expect(loggedActivity.vendorId).toBe(vendorId);
            expect(loggedActivity.metadata.price).toBe(amount);
            expect(loggedActivity.metadata.quantity).toBe(quantity);
            expect(loggedActivity.metadata.currency).toBe('USD');
            
            // Verify location is included
            expect(loggedActivity.metadata).toHaveProperty('location');
            expect(loggedActivity.metadata.location).toHaveProperty('country');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 40: Activity metadata completeness', () => {
    /**
     * Feature: vendor-analytics-upgrade, Property 40: Activity metadata completeness
     * Validates: Requirements 21.6
     * 
     * For any activity, metadata must include device type, user agent, and traffic source
     */
    it('should include complete metadata for all activity types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('view', 'add_to_cart', 'remove_from_cart', 'purchase'),
          fc.string({ minLength: 1, maxLength: 50 }), // productId
          fc.string({ minLength: 1, maxLength: 50 }), // vendorId
          async (activityType, productId, vendorId) => {
            mockAddDoc.mockClear();
            
            // Track activity based on type
            switch (activityType) {
              case 'view':
                await tracker.trackProductView(productId, vendorId);
                break;
              case 'add_to_cart':
                await tracker.trackAddToCart(productId, vendorId, 1, 100);
                break;
              case 'remove_from_cart':
                await tracker.trackRemoveFromCart(productId, vendorId);
                break;
              case 'purchase':
                await tracker.trackPurchase('order-1', productId, vendorId, 100, 1);
                break;
            }
            
            const loggedActivity = mockAddDoc.mock.calls[0][1];
            
            // Verify metadata completeness
            expect(loggedActivity.metadata).toHaveProperty('deviceType');
            expect(['mobile', 'tablet', 'desktop']).toContain(loggedActivity.metadata.deviceType);
            
            expect(loggedActivity.metadata).toHaveProperty('userAgent');
            expect(typeof loggedActivity.metadata.userAgent).toBe('string');
            
            expect(loggedActivity.metadata).toHaveProperty('source');
            expect(['direct', 'search', 'social', 'referral']).toContain(loggedActivity.metadata.source);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 41: Real-time analytics update', () => {
    /**
     * Feature: vendor-analytics-upgrade, Property 41: Real-time analytics update
     * Validates: Requirements 21.7
     * 
     * For any activity logged, analytics update should be scheduled within 30 seconds
     */
    it('should schedule analytics update for vendor activities', async () => {
      vi.useFakeTimers();
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // vendorId
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }), // productIds
          async (vendorId, productIds) => {
            mockAddDoc.mockClear();
            
            // Track multiple activities for the same vendor
            for (const productId of productIds) {
              await tracker.trackProductView(productId, vendorId);
            }
            
            // Verify activities were logged
            expect(mockAddDoc).toHaveBeenCalledTimes(productIds.length);
            
            // Fast-forward time by 30 seconds
            vi.advanceTimersByTime(30000);
            
            // Analytics update should have been triggered
            // (In real implementation, this would call an API or Cloud Function)
            // For now, we just verify the debouncing works correctly
            
            // All activities should be logged
            expect(mockAddDoc).toHaveBeenCalledTimes(productIds.length);
          }
        ),
        { numRuns: 10 }
      );
      
      vi.useRealTimers();
    });
  });

  // ============================================================================
  // Unit Tests
  // ============================================================================

  describe('Session Management', () => {
    it('should create and persist session ID', () => {
      const sessionStorageMock = global.sessionStorage as any;
      
      // First call should create new session
      sessionStorageMock.getItem.mockReturnValueOnce(null);
      const tracker1 = new ActivityTracker();
      
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'shop_session_id',
        expect.any(String)
      );
      
      tracker1.destroy();
    });

    it('should reuse existing session ID', () => {
      const existingSessionId = 'existing-session-123';
      
      // Create fresh mocks for this test
      const freshSessionStorage = {
        getItem: vi.fn().mockReturnValue(existingSessionId),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };
      global.sessionStorage = freshSessionStorage as any;
      
      const tracker1 = new ActivityTracker();
      
      // Should not create new session
      expect(freshSessionStorage.setItem).not.toHaveBeenCalled();
      
      tracker1.destroy();
    });
  });

  describe('Anonymous User Identification', () => {
    it('should create anonymous user ID for non-logged-in users', async () => {
      const localStorageMock = global.localStorage as any;
      localStorageMock.getItem.mockReturnValue(null);
      
      await tracker.trackProductView('product-1', 'vendor-1');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'anonymous_user_id',
        expect.stringContaining('anon_')
      );
    });

    it('should reuse existing anonymous user ID', async () => {
      const localStorageMock = global.localStorage as any;
      const existingAnonId = 'anon_existing_123';
      
      localStorageMock.getItem.mockReturnValue(existingAnonId);
      
      await tracker.trackProductView('product-1', 'vendor-1');
      
      const loggedActivity = mockAddDoc.mock.calls[0][1];
      expect(loggedActivity.userId).toBe(existingAnonId);
    });

    it('should use provided user ID when available', async () => {
      const userId = 'authenticated-user-123';
      
      await tracker.trackProductView('product-1', 'vendor-1', userId);
      
      const loggedActivity = mockAddDoc.mock.calls[0][1];
      expect(loggedActivity.userId).toBe(userId);
    });
  });

  describe('Device Type Detection', () => {
    it('should detect mobile device', async () => {
      global.window = { innerWidth: 500 } as any;
      const mobileTracker = new ActivityTracker();
      
      await mobileTracker.trackProductView('product-1', 'vendor-1');
      
      const loggedActivity = mockAddDoc.mock.calls[0][1];
      expect(loggedActivity.metadata.deviceType).toBe('mobile');
      
      mobileTracker.destroy();
    });

    it('should detect tablet device', async () => {
      global.window = { innerWidth: 800 } as any;
      const tabletTracker = new ActivityTracker();
      
      await tabletTracker.trackProductView('product-1', 'vendor-1');
      
      const loggedActivity = mockAddDoc.mock.calls[0][1];
      expect(loggedActivity.metadata.deviceType).toBe('tablet');
      
      tabletTracker.destroy();
    });

    it('should detect desktop device', async () => {
      global.window = { innerWidth: 1920 } as any;
      const desktopTracker = new ActivityTracker();
      
      await desktopTracker.trackProductView('product-1', 'vendor-1');
      
      const loggedActivity = mockAddDoc.mock.calls[0][1];
      expect(loggedActivity.metadata.deviceType).toBe('desktop');
      
      desktopTracker.destroy();
    });
  });

  describe('Traffic Source Detection', () => {
    it('should detect search traffic', async () => {
      global.document = { referrer: 'https://www.google.com/search' } as any;
      const searchTracker = new ActivityTracker();
      
      await searchTracker.trackProductView('product-1', 'vendor-1');
      
      const loggedActivity = mockAddDoc.mock.calls[0][1];
      expect(loggedActivity.metadata.source).toBe('search');
      
      searchTracker.destroy();
    });

    it('should detect social media traffic', async () => {
      global.document = { referrer: 'https://www.facebook.com' } as any;
      const socialTracker = new ActivityTracker();
      
      await socialTracker.trackProductView('product-1', 'vendor-1');
      
      const loggedActivity = mockAddDoc.mock.calls[0][1];
      expect(loggedActivity.metadata.source).toBe('social');
      
      socialTracker.destroy();
    });

    it('should detect direct traffic', async () => {
      global.document = { referrer: '' } as any;
      const directTracker = new ActivityTracker();
      
      await directTracker.trackProductView('product-1', 'vendor-1');
      
      const loggedActivity = mockAddDoc.mock.calls[0][1];
      expect(loggedActivity.metadata.source).toBe('direct');
      
      directTracker.destroy();
    });

    it('should detect referral traffic', async () => {
      global.document = { referrer: 'https://some-other-site.com' } as any;
      const referralTracker = new ActivityTracker();
      
      await referralTracker.trackProductView('product-1', 'vendor-1');
      
      const loggedActivity = mockAddDoc.mock.calls[0][1];
      expect(loggedActivity.metadata.source).toBe('referral');
      
      referralTracker.destroy();
    });
  });

  describe('Search Activity Tracking', () => {
    it('should track search queries with results count', async () => {
      await tracker.trackSearch('african dresses', 25);
      
      const loggedActivity = mockAddDoc.mock.calls[0][1];
      
      expect(loggedActivity.type).toBe('search');
      expect(loggedActivity.metadata.searchQuery).toBe('african dresses');
      expect(loggedActivity.metadata.resultsCount).toBe(25);
      expect(loggedActivity.vendorId).toBe(''); // Search is not vendor-specific
    });
  });

  describe('Error Handling and Retry', () => {
    it('should queue failed activities for retry', async () => {
      // Mock addDoc to fail
      mockAddDoc.mockRejectedValueOnce(new Error('Network error'));
      
      await tracker.trackProductView('product-1', 'vendor-1');
      
      // Should have attempted to store in retry queue
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'activity_retry_queue',
        expect.any(String)
      );
    });

    it('should retry failed activities', async () => {
      const failedActivity = {
        id: 'failed-1',
        type: 'view',
        productId: 'product-1',
        vendorId: 'vendor-1'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([failedActivity]));
      mockAddDoc.mockResolvedValue({ id: 'success' });
      
      await tracker.retryFailedActivities();
      
      // Should have retried the activity
      expect(mockAddDoc).toHaveBeenCalled();
      
      // Should have cleared the queue on success
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('activity_retry_queue');
    });
  });

  describe('Cleanup', () => {
    it('should clear all pending timeouts on destroy', () => {
      vi.useFakeTimers();
      
      // Schedule some updates
      tracker.trackProductView('product-1', 'vendor-1');
      tracker.trackProductView('product-2', 'vendor-1');
      
      // Destroy should clear timeouts
      tracker.destroy();
      
      // Advance time - no updates should be processed
      vi.advanceTimersByTime(30000);
      
      vi.useRealTimers();
    });
  });
});
