/**
 * Event Tracker Tests
 * Tests for storefront analytics event tracking functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getSessionId, 
  trackEvent, 
  trackPageView,
  trackProductView,
  trackAddToCart,
  StorefrontEventTracker 
} from './event-tracker';

// Mock fetch
global.fetch = vi.fn();

// Mock window and sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

Object.defineProperty(window, 'location', {
  value: {
    pathname: '/store/test-handle'
  }
});

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent'
  }
});

Object.defineProperty(window, 'document', {
  value: {
    referrer: 'https://example.com'
  }
});

describe('Event Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSessionId', () => {
    it('should generate new session ID if none exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      
      const sessionId = getSessionId();
      
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'storefront_session_id',
        sessionId
      );
    });

    it('should return existing session ID', () => {
      const existingSessionId = 'session_123_abc';
      mockSessionStorage.getItem.mockReturnValue(existingSessionId);
      
      const sessionId = getSessionId();
      
      expect(sessionId).toBe(existingSessionId);
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('trackEvent', () => {
    it('should send event to analytics API', async () => {
      const event = {
        storefrontId: 'test-storefront',
        eventType: 'page_view' as const,
        sessionId: 'test-session',
        userId: 'test-user',
        metadata: { test: 'data' }
      };

      await trackEvent(event);

      expect(fetch).toHaveBeenCalledWith('/api/storefront/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    });

    it('should handle fetch errors gracefully', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const event = {
        storefrontId: 'test-storefront',
        eventType: 'page_view' as const,
        sessionId: 'test-session'
      };

      await expect(trackEvent(event)).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Analytics tracking failed:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('trackPageView', () => {
    it('should track page view with correct data', async () => {
      mockSessionStorage.getItem.mockReturnValue('test-session');
      
      await trackPageView('test-storefront', 'test-session', 'test-user');

      expect(fetch).toHaveBeenCalledWith('/api/storefront/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"eventType":"page_view"')
      });

      // Verify the body contains expected data
      const callArgs = (fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.storefrontId).toBe('test-storefront');
      expect(body.eventType).toBe('page_view');
      expect(body.sessionId).toBe('test-session');
      expect(body.userId).toBe('test-user');
      expect(body.metadata.pathname).toBe('/store/test-handle');
      expect(body.metadata.userAgent).toBe('test-user-agent');
      expect(body.metadata.referrer).toBe('https://example.com');
      expect(body.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('trackProductView', () => {
    it('should track product view with product ID', async () => {
      await trackProductView('test-storefront', 'test-session', 'product-123', 'test-user');

      expect(fetch).toHaveBeenCalledWith('/api/storefront/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"eventType":"product_view"')
      });

      // Verify the body contains expected data
      const callArgs = (fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.storefrontId).toBe('test-storefront');
      expect(body.eventType).toBe('product_view');
      expect(body.sessionId).toBe('test-session');
      expect(body.userId).toBe('test-user');
      expect(body.productId).toBe('product-123');
      expect(body.metadata.pathname).toBe('/store/test-handle');
      expect(body.metadata.userAgent).toBe('test-user-agent');
      expect(body.metadata.referrer).toBe('https://example.com');
      expect(body.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('trackAddToCart', () => {
    it('should track add to cart event', async () => {
      await trackAddToCart('test-storefront', 'test-session', 'product-123', 'test-user', {
        productName: 'Test Product',
        price: 29.99
      });

      expect(fetch).toHaveBeenCalledWith('/api/storefront/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"eventType":"add_to_cart"')
      });

      // Verify the body contains expected data
      const callArgs = (fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.storefrontId).toBe('test-storefront');
      expect(body.eventType).toBe('add_to_cart');
      expect(body.sessionId).toBe('test-session');
      expect(body.userId).toBe('test-user');
      expect(body.productId).toBe('product-123');
      expect(body.metadata.productName).toBe('Test Product');
      expect(body.metadata.price).toBe(29.99);
      expect(body.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('StorefrontEventTracker', () => {
    it('should initialize with storefront ID and generate session ID', () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      
      const tracker = new StorefrontEventTracker('test-storefront', 'test-user');
      
      expect(tracker.getStorefrontId()).toBe('test-storefront');
      expect(tracker.getSessionId()).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should track page view using class method', async () => {
      mockSessionStorage.getItem.mockReturnValue('test-session');
      
      const tracker = new StorefrontEventTracker('test-storefront', 'test-user');
      await tracker.trackPageView({ customData: 'test' });

      expect(fetch).toHaveBeenCalledWith('/api/storefront/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"eventType":"page_view"')
      });

      // Verify the body contains expected data
      const callArgs = (fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.storefrontId).toBe('test-storefront');
      expect(body.eventType).toBe('page_view');
      expect(body.sessionId).toBe('test-session');
      expect(body.userId).toBe('test-user');
      expect(body.metadata.pathname).toBe('/store/test-handle');
      expect(body.metadata.userAgent).toBe('test-user-agent');
      expect(body.metadata.referrer).toBe('https://example.com');
      expect(body.metadata.customData).toBe('test');
      expect(body.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should update user ID', () => {
      const tracker = new StorefrontEventTracker('test-storefront');
      tracker.setUserId('new-user');
      
      // Access private property for testing
      expect((tracker as any).userId).toBe('new-user');
    });
  });
});