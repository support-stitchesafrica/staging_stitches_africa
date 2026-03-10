/**
 * Event Tracking Integration Tests
 * Tests the complete event tracking flow from component to API to database
 * 
 * **Feature: merchant-storefront-upgrade, Property 4: Analytics Tracking and Visualization**
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackEvent, trackPageView, trackAddToCart, getSessionId } from '../event-tracker';

// Mock fetch
global.fetch = vi.fn();

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/store/test-handle'
  }
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent'
  }
});

// Mock document
Object.defineProperty(window, 'document', {
  value: {
    referrer: 'https://example.com'
  }
});

describe('Event Tracking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    mockSessionStorage.getItem.mockReturnValue('test-session-123');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should generate session ID if none exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      
      const sessionId = getSessionId();
      
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'storefront_session_id',
        sessionId
      );
    });

    it('should reuse existing session ID', () => {
      const existingSessionId = 'existing-session-456';
      mockSessionStorage.getItem.mockReturnValue(existingSessionId);
      
      const sessionId = getSessionId();
      
      expect(sessionId).toBe(existingSessionId);
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Event Tracking', () => {
    it('should track page view events correctly', async () => {
      await trackPageView('test-storefront', 'test-session', 'test-user', {
        customData: 'test'
      });

      expect(fetch).toHaveBeenCalledWith('/api/storefront/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"eventType":"page_view"')
      });

      const callArgs = (fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body).toMatchObject({
        storefrontId: 'test-storefront',
        eventType: 'page_view',
        sessionId: 'test-session',
        userId: 'test-user',
        metadata: expect.objectContaining({
          pathname: '/store/test-handle',
          userAgent: 'test-user-agent',
          referrer: 'https://example.com',
          customData: 'test',
          timestamp: expect.any(String)
        })
      });
    });

    it('should track add to cart events correctly', async () => {
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

      const callArgs = (fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body).toMatchObject({
        storefrontId: 'test-storefront',
        eventType: 'add_to_cart',
        sessionId: 'test-session',
        userId: 'test-user',
        productId: 'product-123',
        metadata: expect.objectContaining({
          productName: 'Test Product',
          price: 29.99,
          timestamp: expect.any(String)
        })
      });
    });

    it('should handle tracking errors gracefully', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await trackEvent({
        storefrontId: 'test-storefront',
        eventType: 'page_view',
        sessionId: 'test-session'
      });

      expect(consoleSpy).toHaveBeenCalledWith('Analytics tracking failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should track events with minimal required data', async () => {
      await trackEvent({
        storefrontId: 'test-storefront',
        eventType: 'page_view',
        sessionId: 'test-session'
      });

      expect(fetch).toHaveBeenCalledWith('/api/storefront/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"storefrontId":"test-storefront"')
      });
    });
  });

  describe('Event Types', () => {
    const eventTypes = ['page_view', 'product_view', 'add_to_cart', 'checkout_start', 'purchase'];

    eventTypes.forEach(eventType => {
      it(`should track ${eventType} events`, async () => {
        await trackEvent({
          storefrontId: 'test-storefront',
          eventType: eventType as any,
          sessionId: 'test-session'
        });

        expect(fetch).toHaveBeenCalledWith('/api/storefront/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining(`"eventType":"${eventType}"`)
        });
      });
    });
  });

  describe('Metadata Handling', () => {
    it('should include standard metadata for page views', async () => {
      await trackPageView('test-storefront', 'test-session');

      const callArgs = (fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.metadata).toMatchObject({
        pathname: '/store/test-handle',
        userAgent: 'test-user-agent',
        referrer: 'https://example.com',
        timestamp: expect.any(String)
      });
    });

    it('should merge custom metadata with standard metadata', async () => {
      await trackPageView('test-storefront', 'test-session', undefined, {
        customField: 'customValue',
        anotherField: 123
      });

      const callArgs = (fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.metadata).toMatchObject({
        pathname: '/store/test-handle',
        userAgent: 'test-user-agent',
        referrer: 'https://example.com',
        customField: 'customValue',
        anotherField: 123,
        timestamp: expect.any(String)
      });
    });
  });
});