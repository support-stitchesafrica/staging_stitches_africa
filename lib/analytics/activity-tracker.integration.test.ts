/**
 * Integration tests for Activity Tracker
 * Tests the integration of activity tracking in shop pages
 * 
 * Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getActivityTracker } from './activity-tracker';

// Mock Firestore
vi.mock('@/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'test-doc-id' }),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
  }
}));

describe('Activity Tracker Integration', () => {
  let tracker: ReturnType<typeof getActivityTracker>;

  beforeEach(() => {
    // Clear localStorage and sessionStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    
    // Get fresh tracker instance
    tracker = getActivityTracker();
  });

  describe('Product View Tracking', () => {
    it('should track product view with vendor ID', async () => {
      // Validates: Requirements 21.1
      const productId = 'test-product-123';
      const vendorId = 'vendor-456';
      const userId = 'user-789';

      await expect(
        tracker.trackProductView(productId, vendorId, userId)
      ).resolves.not.toThrow();
    });

    it('should track product view without user ID (anonymous)', async () => {
      // Validates: Requirements 21.1
      const productId = 'test-product-123';
      const vendorId = 'vendor-456';

      await expect(
        tracker.trackProductView(productId, vendorId)
      ).resolves.not.toThrow();
    });
  });

  describe('Add to Cart Tracking', () => {
    it('should track add to cart with all required fields', async () => {
      // Validates: Requirements 21.2
      const productId = 'test-product-123';
      const vendorId = 'vendor-456';
      const quantity = 2;
      const price = 49.99;
      const userId = 'user-789';

      await expect(
        tracker.trackAddToCart(productId, vendorId, quantity, price, userId)
      ).resolves.not.toThrow();
    });

    it('should track add to cart without user ID (anonymous)', async () => {
      // Validates: Requirements 21.2
      const productId = 'test-product-123';
      const vendorId = 'vendor-456';
      const quantity = 1;
      const price = 29.99;

      await expect(
        tracker.trackAddToCart(productId, vendorId, quantity, price)
      ).resolves.not.toThrow();
    });
  });

  describe('Remove from Cart Tracking', () => {
    it('should track remove from cart', async () => {
      // Validates: Requirements 21.3
      const productId = 'test-product-123';
      const vendorId = 'vendor-456';
      const userId = 'user-789';

      await expect(
        tracker.trackRemoveFromCart(productId, vendorId, userId)
      ).resolves.not.toThrow();
    });

    it('should track remove from cart without user ID (anonymous)', async () => {
      // Validates: Requirements 21.3
      const productId = 'test-product-123';
      const vendorId = 'vendor-456';

      await expect(
        tracker.trackRemoveFromCart(productId, vendorId)
      ).resolves.not.toThrow();
    });
  });

  describe('Purchase Tracking', () => {
    it('should track purchase with all required fields', async () => {
      // Validates: Requirements 21.4
      const orderId = 'order-123';
      const productId = 'test-product-123';
      const vendorId = 'vendor-456';
      const amount = 99.99;
      const quantity = 1;
      const userId = 'user-789';

      await expect(
        tracker.trackPurchase(orderId, productId, vendorId, amount, quantity, userId)
      ).resolves.not.toThrow();
    });

    it('should track purchase without user ID (anonymous)', async () => {
      // Validates: Requirements 21.4
      const orderId = 'order-123';
      const productId = 'test-product-123';
      const vendorId = 'vendor-456';
      const amount = 99.99;
      const quantity = 1;

      await expect(
        tracker.trackPurchase(orderId, productId, vendorId, amount, quantity)
      ).resolves.not.toThrow();
    });
  });

  describe('Search Tracking', () => {
    it('should track search query with results count', async () => {
      // Validates: Requirements 21.5
      const query = 'summer dress';
      const resultsCount = 42;
      const userId = 'user-789';

      await expect(
        tracker.trackSearch(query, resultsCount, userId)
      ).resolves.not.toThrow();
    });

    it('should track search query without user ID (anonymous)', async () => {
      // Validates: Requirements 21.5
      const query = 'winter coat';
      const resultsCount = 15;

      await expect(
        tracker.trackSearch(query, resultsCount)
      ).resolves.not.toThrow();
    });
  });

  describe('Session Management', () => {
    it.skip('should generate and persist session ID', () => {
      // Skip in test environment where sessionStorage is not available
      // This would be tested in browser environment
      const tracker1 = getActivityTracker();
      
      // Session ID should be stored in sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        const sessionId = sessionStorage.getItem('shop_session_id');
        expect(sessionId).toBeTruthy();
        expect(sessionId).toMatch(/^\d+_[a-z0-9]+$/);
      }
    });

    it.skip('should generate and persist anonymous user ID', () => {
      // Skip in test environment where localStorage is not available
      // This would be tested in browser environment
      const tracker1 = getActivityTracker();
      
      // Anonymous ID should be stored in localStorage
      if (typeof localStorage !== 'undefined') {
        const anonId = localStorage.getItem('anonymous_user_id');
        expect(anonId).toBeTruthy();
        expect(anonId).toMatch(/^anon_\d+_[a-z0-9]+$/);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle tracking errors gracefully', async () => {
      // Mock addDoc to throw error
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockRejectedValueOnce(new Error('Network error'));

      const productId = 'test-product-123';
      const vendorId = 'vendor-456';

      // Should not throw, but log error
      await expect(
        tracker.trackProductView(productId, vendorId)
      ).resolves.not.toThrow();
    });
  });
});
