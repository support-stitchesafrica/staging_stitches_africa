/**
 * React Hook for BOGO Analytics Tracking
 * 
 * Provides easy-to-use methods for tracking BOGO promotion interactions
 * with automatic session management and error handling.
 */

import React, { useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { bogoClientTracker } from '@/lib/bogo/client-tracking-service';

interface UseBogoTrackingOptions {
  userId?: string;
  userInfo?: {
    email?: string;
    name?: string;
    preferences?: any;
  };
  autoTrackPageViews?: boolean;
  sessionTimeout?: number; // in minutes
}

interface BogoTrackingMethods {
  trackView: (mappingId: string, mainProductId: string, metadata?: any) => Promise<void>;
  trackAddToCart: (mappingId: string, mainProductId: string, freeProductId: string, cartTotal?: number, metadata?: any) => Promise<void>;
  trackRedemption: (mappingId: string, mainProductId: string, freeProductId: string, orderValue?: number, savings?: number, metadata?: any) => Promise<void>;
  trackCheckout: (mappingId: string, mainProductId: string, freeProductId: string, metadata?: any) => Promise<void>;
  getSessionId: () => string;
  setUserInfo: (userId: string, userInfo: any) => void;
  clearUserInfo: () => void;
}

export const useBogoTracking = (options: UseBogoTrackingOptions = {}): BogoTrackingMethods => {
  const {
    userId,
    userInfo,
    autoTrackPageViews = false,
    sessionTimeout = 30
  } = options;

  const lastActivityRef = useRef<number>(Date.now());
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update user info when provided
  useEffect(() => {
    if (userId && userInfo) {
      bogoClientTracker.setUserInfo(userId, userInfo);
    }
  }, [userId, userInfo]);

  // Setup session timeout
  useEffect(() => {
    const resetSessionTimeout = () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }

      sessionTimeoutRef.current = setTimeout(() => {
        // Clear user info after session timeout
        bogoClientTracker.clearUserInfo();
      }, sessionTimeout * 60 * 1000);
    };

    // Reset timeout on user activity
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      resetSessionTimeout();
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timeout setup
    resetSessionTimeout();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [sessionTimeout]);

  // Auto-track page views for BOGO promotions
  useEffect(() => {
    if (!autoTrackPageViews) return;

    const trackPageView = () => {
      // Check if current page is a BOGO promotion page
      const url = window.location.href;
      const pathname = window.location.pathname;
      
      // Look for BOGO promotion indicators in URL
      if (pathname.includes('/promotions/') || url.includes('bogo') || url.includes('buy-one-get-one')) {
        // Extract promotion details from URL or page content
        const urlParams = new URLSearchParams(window.location.search);
        const mappingId = urlParams.get('mappingId') || urlParams.get('promoId');
        const productId = urlParams.get('productId') || urlParams.get('mainProduct');
        
        if (mappingId && productId) {
          bogoClientTracker.trackView(mappingId, productId, userId, {
            autoTracked: true,
            pageType: 'promotion_page'
          });
        }
      }
    };

    // Track initial page view
    trackPageView();

    // Track page views on navigation (for SPAs)
    const handlePopState = () => {
      setTimeout(trackPageView, 100); // Small delay to ensure page is updated
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [autoTrackPageViews, userId]);

  // Tracking methods
  const trackView = useCallback(async (
    mappingId: string, 
    mainProductId: string, 
    metadata?: any
  ): Promise<void> => {
    try {
      const { userId: storedUserId } = bogoClientTracker.getUserInfo();
      await bogoClientTracker.trackView(
        mappingId, 
        mainProductId, 
        userId || storedUserId, 
        {
          ...metadata,
          trackingSource: 'useBogoTracking_hook'
        }
      );
    } catch (error) {
      console.error('Failed to track BOGO view:', error);
    }
  }, [userId]);

  const trackAddToCart = useCallback(async (
    mappingId: string,
    mainProductId: string,
    freeProductId: string,
    cartTotal?: number,
    metadata?: any
  ): Promise<void> => {
    try {
      const { userId: storedUserId } = bogoClientTracker.getUserInfo();
      await bogoClientTracker.trackAddToCart(
        mappingId,
        mainProductId,
        freeProductId,
        userId || storedUserId,
        cartTotal,
        {
          ...metadata,
          trackingSource: 'useBogoTracking_hook'
        }
      );
    } catch (error) {
      console.error('Failed to track BOGO add to cart:', error);
    }
  }, [userId]);

  const trackRedemption = useCallback(async (
    mappingId: string,
    mainProductId: string,
    freeProductId: string,
    orderValue?: number,
    savings?: number,
    metadata?: any
  ): Promise<void> => {
    try {
      const { userId: storedUserId } = bogoClientTracker.getUserInfo();
      await bogoClientTracker.trackRedemption(
        mappingId,
        mainProductId,
        freeProductId,
        userId || storedUserId,
        orderValue,
        savings,
        {
          ...metadata,
          trackingSource: 'useBogoTracking_hook'
        }
      );
    } catch (error) {
      console.error('Failed to track BOGO redemption:', error);
    }
  }, [userId]);

  const trackCheckout = useCallback(async (
    mappingId: string,
    mainProductId: string,
    freeProductId: string,
    metadata?: any
  ): Promise<void> => {
    try {
      const { userId: storedUserId } = bogoClientTracker.getUserInfo();
      await bogoClientTracker.trackCheckout(
        mappingId,
        mainProductId,
        freeProductId,
        userId || storedUserId,
        {
          ...metadata,
          trackingSource: 'useBogoTracking_hook'
        }
      );
    } catch (error) {
      console.error('Failed to track BOGO checkout:', error);
    }
  }, [userId]);

  const getSessionId = useCallback((): string => {
    return bogoClientTracker.getSessionId();
  }, []);

  const setUserInfo = useCallback((userId: string, userInfo: any): void => {
    bogoClientTracker.setUserInfo(userId, userInfo);
  }, []);

  const clearUserInfo = useCallback((): void => {
    bogoClientTracker.clearUserInfo();
  }, []);

  return {
    trackView,
    trackAddToCart,
    trackRedemption,
    trackCheckout,
    getSessionId,
    setUserInfo,
    clearUserInfo
  };
};

// Higher-order component for automatic BOGO tracking
export function withBogoTracking<P extends object>(
  Component: React.ComponentType<P>,
  trackingOptions: UseBogoTrackingOptions = {}
) {
  const WrappedComponent = (props: P) => {
    const tracking = useBogoTracking(trackingOptions);
    
    return React.createElement(Component, { ...props, bogoTracking: tracking } as P & { bogoTracking: BogoTrackingMethods });
  };
  
  return WrappedComponent;
}

// Context for BOGO tracking (optional, for complex apps)
const BogoTrackingContext = createContext<BogoTrackingMethods | null>(null);

export const BogoTrackingProvider: React.FC<{
  children: React.ReactNode;
  options?: UseBogoTrackingOptions;
}> = ({ children, options = {} }) => {
  const tracking = useBogoTracking(options);
  
  return React.createElement(
    BogoTrackingContext.Provider,
    { value: tracking },
    children
  );
};

export const useBogoTrackingContext = (): BogoTrackingMethods => {
  const context = useContext(BogoTrackingContext);
  if (!context) {
    throw new Error('useBogoTrackingContext must be used within a BogoTrackingProvider');
  }
  return context;
};