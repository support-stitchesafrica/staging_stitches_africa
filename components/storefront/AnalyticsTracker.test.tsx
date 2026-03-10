/**
 * AnalyticsTracker Component Tests
 * Tests for the React component that handles automatic page view tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AnalyticsTracker, useStorefrontAnalytics } from './AnalyticsTracker';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  usePathname: () => '/store/test-handle'
}));

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

describe('AnalyticsTracker', () => {
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

  it('should automatically track page view on mount', async () => {
    render(
      <AnalyticsTracker 
        storefrontId="test-storefront" 
        userId="test-user" 
      />
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/storefront/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"eventType":"page_view"')
      });
    });

    // Verify the tracking data
    const callArgs = (fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.storefrontId).toBe('test-storefront');
    expect(body.eventType).toBe('page_view');
    expect(body.sessionId).toBe('test-session-123');
    expect(body.userId).toBe('test-user');
    expect(body.metadata.pathname).toBe('/store/test-handle');
    expect(body.metadata.userAgent).toBe('test-user-agent');
    expect(body.metadata.referrer).toBe('https://example.com');
  });

  it('should track product view when productId is provided', async () => {
    render(
      <AnalyticsTracker 
        storefrontId="test-storefront" 
        userId="test-user"
        productId="product-123"
      />
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/storefront/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"eventType":"product_view"')
      });
    });

    // Verify the tracking data
    const callArgs = (fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.eventType).toBe('product_view');
    expect(body.productId).toBe('product-123');
  });

  it('should generate session ID if none exists', async () => {
    mockSessionStorage.getItem.mockReturnValue(null);

    render(
      <AnalyticsTracker 
        storefrontId="test-storefront" 
      />
    );

    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'storefront_session_id',
        expect.stringMatching(/^session_\d+_[a-z0-9]+$/)
      );
    });
  });

  it('should handle tracking errors gracefully', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <AnalyticsTracker 
        storefrontId="test-storefront" 
      />
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Analytics tracking failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should not render any visible content', () => {
    const { container } = render(
      <AnalyticsTracker 
        storefrontId="test-storefront" 
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('useStorefrontAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    mockSessionStorage.getItem.mockReturnValue('test-session-123');
  });

  it('should provide trackAddToCart function', async () => {
    let trackAddToCart: any;

    function TestComponent() {
      const analytics = useStorefrontAnalytics('test-storefront', 'test-user');
      trackAddToCart = analytics.trackAddToCart;
      return null;
    }

    render(<TestComponent />);

    await trackAddToCart('product-123', 'Test Product', 29.99);

    expect(fetch).toHaveBeenCalledWith('/api/storefront/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.stringContaining('"eventType":"add_to_cart"')
    });

    // Verify the tracking data
    const callArgs = (fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.eventType).toBe('add_to_cart');
    expect(body.productId).toBe('product-123');
    expect(body.metadata.productName).toBe('Test Product');
    expect(body.metadata.price).toBe(29.99);
  });
});