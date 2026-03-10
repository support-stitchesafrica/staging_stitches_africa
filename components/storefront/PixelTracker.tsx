'use client';

import { useEffect, useRef } from 'react';
import { SocialPixelConfig } from '@/types/storefront';
import { pixelService, PixelEvent } from '@/lib/storefront/pixel-service';

interface PixelTrackerProps {
  config: SocialPixelConfig;
  vendorId: string;
  storefrontHandle: string;
}

// Internal analytics tracking function
const trackInternalAnalytics = async (eventType: string, metadata: any) => {
  try {
    const sessionId = sessionStorage.getItem('storefront_session_id') || 
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!sessionStorage.getItem('storefront_session_id')) {
      sessionStorage.setItem('storefront_session_id', sessionId);
    }

    const response = await fetch('/api/storefront/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storefrontId: (window as any).vendorId || 'unknown', // Use vendorId instead of storefrontId
        eventType,
        sessionId,
        userId: (window as any).userId || undefined,
        productId: metadata.productId || undefined,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          pathname: window.location.pathname,
          userAgent: navigator.userAgent,
          referrer: document.referrer
        }
      })
    });

    if (!response.ok) {
      console.warn('Analytics tracking failed:', response.statusText);
    }
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

interface PixelTrackerProps {
  config: SocialPixelConfig;
  vendorId: string;
  storefrontHandle: string;
}

export default function PixelTracker({ config, vendorId, storefrontHandle }: PixelTrackerProps) {
  const initialized = useRef(false);

  useEffect(() => {
    // Set global storefront context for analytics
    if (typeof window !== 'undefined') {
      (window as any).vendorId = vendorId; // Use vendorId as the key identifier
      (window as any).storefrontHandle = storefrontHandle;
    }
  }, [vendorId, storefrontHandle]);

  useEffect(() => {
    // Only initialize once per page load
    if (initialized.current) return;
    initialized.current = true;

    // Initialize pixels
    pixelService.initializePixels(config);

    // Fire initial page view event
    const pageViewEvent: PixelEvent = {
      eventType: 'PageView',
      eventData: {
        content_type: 'storefront',
        content_name: storefrontHandle,
      }
    };

    // Small delay to ensure pixels are loaded
    setTimeout(() => {
      pixelService.fireEvent(config, pageViewEvent);
      
      // Also track page view in internal analytics
      trackInternalAnalytics('page_view', {
        storefrontHandle,
        content_type: 'storefront'
      });
    }, 100);

    // Track page visibility changes (for SPA navigation)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pixelService.fireEvent(config, pageViewEvent);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [config, vendorId, storefrontHandle]);

  // Set up global event tracking functions
  useEffect(() => {
    // Make pixel tracking available globally for other components
    (window as any).trackPixelEvent = (eventType: string, eventData?: any) => {
      const event: PixelEvent = {
        eventType: eventType as PixelEvent['eventType'],
        eventData
      };
      pixelService.fireEvent(config, event);
    };

    // Track product views
    (window as any).trackProductView = (productId: string, productName: string, price?: number) => {
      const event: PixelEvent = {
        eventType: 'ViewContent',
        eventData: {
          content_type: 'product',
          content_ids: [productId],
          content_name: productName,
          value: price,
          currency: 'USD'
        }
      };
      pixelService.fireEvent(config, event);
      
      // Also track in internal analytics
      trackInternalAnalytics('product_view', {
        productId,
        productName,
        price
      });
    };

    // Track add to cart
    (window as any).trackAddToCart = (productId: string, productName: string, price: number, quantity: number = 1) => {
      const event: PixelEvent = {
        eventType: 'AddToCart',
        eventData: {
          content_type: 'product',
          content_ids: [productId],
          content_name: productName,
          value: price * quantity,
          currency: 'USD',
          num_items: quantity
        }
      };
      pixelService.fireEvent(config, event);
      
      // Also track in internal analytics
      trackInternalAnalytics('add_to_cart', {
        productId,
        productName,
        price,
        quantity
      });
    };

    // Track checkout initiation
    (window as any).trackCheckoutStart = (items: Array<{id: string, name: string, price: number, quantity: number}>) => {
      const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      
      const event: PixelEvent = {
        eventType: 'InitiateCheckout',
        eventData: {
          content_type: 'product',
          content_ids: items.map(item => item.id),
          value: totalValue,
          currency: 'USD',
          num_items: totalItems
        }
      };
      pixelService.fireEvent(config, event);
      
      // Also track in internal analytics
      trackInternalAnalytics('checkout_start', {
        items,
        totalValue,
        totalItems
      });
    };

    // Track purchase completion
    (window as any).trackPurchase = (orderId: string, items: Array<{id: string, name: string, price: number, quantity: number}>) => {
      const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      
      const event: PixelEvent = {
        eventType: 'Purchase',
        eventData: {
          content_type: 'product',
          content_ids: items.map(item => item.id),
          value: totalValue,
          currency: 'USD',
          num_items: totalItems
        }
      };
      pixelService.fireEvent(config, event);
      
      // Also track in internal analytics
      trackInternalAnalytics('purchase', {
        orderId,
        items,
        totalValue,
        totalItems
      });
    };

    // Cleanup function
    return () => {
      delete (window as any).trackPixelEvent;
      delete (window as any).trackProductView;
      delete (window as any).trackAddToCart;
      delete (window as any).trackCheckoutStart;
      delete (window as any).trackPurchase;
    };
  }, [config]);

  // This component doesn't render anything visible
  return null;
}

// Hook for easy pixel tracking in React components
export function usePixelTracking() {
  const trackProductView = (productId: string, productName: string, price?: number) => {
    if (typeof window !== 'undefined' && (window as any).trackProductView) {
      (window as any).trackProductView(productId, productName, price);
    }
  };

  const trackAddToCart = (productId: string, productName: string, price: number, quantity: number = 1) => {
    if (typeof window !== 'undefined' && (window as any).trackAddToCart) {
      (window as any).trackAddToCart(productId, productName, price, quantity);
    }
  };

  const trackCheckoutStart = (items: Array<{id: string, name: string, price: number, quantity: number}>) => {
    if (typeof window !== 'undefined' && (window as any).trackCheckoutStart) {
      (window as any).trackCheckoutStart(items);
    }
  };

  const trackPurchase = (orderId: string, items: Array<{id: string, name: string, price: number, quantity: number}>) => {
    if (typeof window !== 'undefined' && (window as any).trackPurchase) {
      (window as any).trackPurchase(orderId, items);
    }
  };

  const trackCustomEvent = (eventType: string, eventData?: any) => {
    if (typeof window !== 'undefined' && (window as any).trackPixelEvent) {
      (window as any).trackPixelEvent(eventType, eventData);
    }
  };

  return {
    trackProductView,
    trackAddToCart,
    trackCheckoutStart,
    trackPurchase,
    trackCustomEvent
  };
}