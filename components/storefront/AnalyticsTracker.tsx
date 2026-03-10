'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsTrackerProps {
  storefrontId: string;
  userId?: string;
  productId?: string;
  className?: string;
  storefrontName?: string;
}

// Generate or get session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('storefront_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('storefront_session_id', sessionId);
  }
  return sessionId;
};

// Generate or get unique visitor ID
const getVisitorId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let visitorId = localStorage.getItem('storefront_visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('storefront_visitor_id', visitorId);
  }
  return visitorId;
};

// Track analytics event
const trackEvent = async (
  storefrontId: string,
  eventType: string,
  sessionId: string,
  visitorId: string,
  userId?: string,
  productId?: string,
  metadata?: Record<string, any>
) => {
  try {
    console.log('📊 Tracking storefront event:', {
      storefrontId,
      eventType,
      sessionId,
      visitorId,
      userId,
      productId
    });

    const response = await fetch('/api/storefront/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storefrontId,
        eventType,
        sessionId,
        visitorId,
        userId,
        productId,
        metadata: {
          ...metadata,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          deviceType: getDeviceType()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Event tracked successfully:', result);
    return result;
  } catch (error) {
    console.warn('❌ Analytics tracking failed:', error);
    // Store failed events for retry
    storeFailedEvent(storefrontId, eventType, sessionId, visitorId, userId, productId, metadata);
  }
};

// Get device type
const getDeviceType = (): string => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Store failed events for retry
const storeFailedEvent = (
  storefrontId: string,
  eventType: string,
  sessionId: string,
  visitorId: string,
  userId?: string,
  productId?: string,
  metadata?: Record<string, any>
) => {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const failedEvents = JSON.parse(localStorage.getItem('failed_storefront_events') || '[]');
    failedEvents.push({
      storefrontId,
      eventType,
      sessionId,
      visitorId,
      userId,
      productId,
      metadata,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 failed events
    if (failedEvents.length > 50) {
      failedEvents.splice(0, failedEvents.length - 50);
    }
    
    localStorage.setItem('failed_storefront_events', JSON.stringify(failedEvents));
  } catch (error) {
    console.warn('Failed to store failed event:', error);
  }
};

// Retry failed events
const retryFailedEvents = async () => {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const failedEvents = JSON.parse(localStorage.getItem('failed_storefront_events') || '[]');
    if (failedEvents.length === 0) return;
    
    console.log(`🔄 Retrying ${failedEvents.length} failed events`);
    
    const stillFailed = [];
    
    for (const event of failedEvents) {
      try {
        await trackEvent(
          event.storefrontId,
          event.eventType,
          event.sessionId,
          event.visitorId,
          event.userId,
          event.productId,
          event.metadata
        );
      } catch (error) {
        stillFailed.push(event);
      }
    }
    
    localStorage.setItem('failed_storefront_events', JSON.stringify(stillFailed));
    
    if (stillFailed.length < failedEvents.length) {
      console.log(`✅ Successfully retried ${failedEvents.length - stillFailed.length} events`);
    }
  } catch (error) {
    console.warn('Failed to retry events:', error);
  }
};

export function AnalyticsTracker({ 
  storefrontId, 
  userId, 
  productId,
  className,
  storefrontName
}: AnalyticsTrackerProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const sessionId = useRef<string>('');
  const visitorId = useRef<string>('');
  const pageViewTracked = useRef<boolean>(false);
  const storefrontViewTracked = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionId.current = getSessionId();
      visitorId.current = getVisitorId();
      
      // Retry failed events on component mount
      retryFailedEvents();
    }
  }, []);

  // Track storefront visit (once per session)
  useEffect(() => {
    if (sessionId.current && visitorId.current && !storefrontViewTracked.current) {
      console.log('🏪 Tracking storefront visit:', {
        storefrontId,
        storefrontName,
        userId: user?.uid || userId,
        sessionId: sessionId.current,
        visitorId: visitorId.current
      });
      
      trackEvent(
        storefrontId,
        'storefront_visit',
        sessionId.current,
        visitorId.current,
        user?.uid || userId,
        undefined,
        {
          storefrontName,
          pathname,
          isNewSession: !sessionStorage.getItem('storefront_visited_' + storefrontId),
          visitTimestamp: new Date().toISOString()
        }
      ).then(() => {
        console.log('✅ Storefront visit tracked successfully');
        sessionStorage.setItem('storefront_visited_' + storefrontId, 'true');
      }).catch((error) => {
        console.warn('❌ Failed to track storefront visit:', error);
      });
      
      storefrontViewTracked.current = true;
    }
  }, [storefrontId, storefrontName, user?.uid, userId]);

  // Track page view
  useEffect(() => {
    if (sessionId.current && visitorId.current && !pageViewTracked.current) {
      const eventType = productId ? 'product_view' : 'page_view';
      
      console.log('📊 AnalyticsTracker tracking:', {
        storefrontId,
        eventType,
        userId: user?.uid || userId,
        productId,
        pathname
      });
      
      trackEvent(
        storefrontId,
        eventType,
        sessionId.current,
        visitorId.current,
        user?.uid || userId,
        productId,
        {
          pathname,
          pageTitle: typeof document !== 'undefined' ? document.title : '',
          timestamp: new Date().toISOString()
        }
      ).then(() => {
        console.log('✅ Page view tracked successfully');
      }).catch((error) => {
        console.warn('❌ Failed to track page view:', error);
      });
      
      pageViewTracked.current = true;
    }
  }, [storefrontId, user?.uid, userId, productId, pathname]);

  // Reset page view tracking when pathname changes
  useEffect(() => {
    pageViewTracked.current = false;
  }, [pathname]);

  return null; // This component doesn't render anything
}

// Hook for tracking cart events
export const useStorefrontAnalytics = (storefrontId: string, userId?: string) => {
  const { user } = useAuth();
  const sessionId = useRef<string>('');
  const visitorId = useRef<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionId.current = getSessionId();
      visitorId.current = getVisitorId();
    }
  }, []);

  const trackAddToCart = (productId: string, productName?: string, price?: number) => {
    if (sessionId.current && visitorId.current) {
      console.log('🛒 Tracking add to cart:', {
        storefrontId,
        productId,
        productName,
        price,
        userId: user?.uid || userId
      });
      
      trackEvent(
        storefrontId,
        'add_to_cart',
        sessionId.current,
        visitorId.current,
        user?.uid || userId,
        productId,
        {
          productName,
          price,
          timestamp: new Date().toISOString()
        }
      );
    }
  };

  const trackRemoveFromCart = (productId: string, productName?: string) => {
    if (sessionId.current && visitorId.current) {
      console.log('🗑️ Tracking remove from cart:', {
        storefrontId,
        productId,
        productName,
        userId: user?.uid || userId
      });
      
      trackEvent(
        storefrontId,
        'remove_from_cart',
        sessionId.current,
        visitorId.current,
        user?.uid || userId,
        productId,
        {
          productName,
          timestamp: new Date().toISOString()
        }
      );
    }
  };

  const trackCheckoutStart = (cartItems?: any[]) => {
    if (sessionId.current && visitorId.current) {
      const cartValue = cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
      
      console.log('💳 Tracking checkout start:', {
        storefrontId,
        cartItems: cartItems?.length || 0,
        cartValue,
        userId: user?.uid || userId
      });
      
      trackEvent(
        storefrontId,
        'checkout_start',
        sessionId.current,
        visitorId.current,
        user?.uid || userId,
        undefined,
        {
          cartItems,
          cartValue,
          itemCount: cartItems?.length || 0,
          timestamp: new Date().toISOString()
        }
      );
    }
  };

  const trackPurchase = (orderId: string, orderValue: number, items?: any[]) => {
    if (sessionId.current && visitorId.current) {
      console.log('💰 Tracking purchase:', {
        storefrontId,
        orderId,
        orderValue,
        items: items?.length || 0,
        userId: user?.uid || userId
      });
      
      trackEvent(
        storefrontId,
        'purchase',
        sessionId.current,
        visitorId.current,
        user?.uid || userId,
        undefined,
        {
          orderId,
          orderValue,
          items,
          itemCount: items?.length || 0,
          timestamp: new Date().toISOString()
        }
      );
    }
  };

  const trackProductView = (productId: string, productName?: string, price?: number) => {
    if (sessionId.current && visitorId.current) {
      console.log('👁️ Tracking product view:', {
        storefrontId,
        productId,
        productName,
        price,
        userId: user?.uid || userId
      });
      
      trackEvent(
        storefrontId,
        'product_view',
        sessionId.current,
        visitorId.current,
        user?.uid || userId,
        productId,
        {
          productName,
          price,
          timestamp: new Date().toISOString()
        }
      );
    }
  };

  return {
    trackAddToCart,
    trackRemoveFromCart,
    trackCheckoutStart,
    trackPurchase,
    trackProductView
  };
};