/**
 * React Hook for Collections Analytics Tracking
 * 
 * Provides easy-to-use methods for tracking collection interactions
 * with automatic session management and error handling.
 */

import React, { useEffect, useCallback, useRef, createContext, useContext } from 'react';

interface UseCollectionsTrackingOptions {
  userId?: string;
  userInfo?: {
    email?: string;
    name?: string;
    preferences?: any;
  };
  autoTrackPageViews?: boolean;
  sessionTimeout?: number; // in minutes
}

interface CollectionsTrackingMethods {
  trackCollectionView: (collectionId: string, collectionName: string, metadata?: any) => Promise<void>;
  trackProductView: (collectionId: string, collectionName: string, productId: string, productName: string, metadata?: any) => Promise<void>;
  trackAddToCart: (collectionId: string, collectionName: string, productId: string, productName: string, price: number, quantity?: number, metadata?: any) => Promise<void>;
  trackPurchase: (collectionId: string, collectionName: string, productId: string, productName: string, price: number, quantity?: number, metadata?: any) => Promise<void>;
  getSessionId: () => string;
  setUserInfo: (userId: string, userInfo: any) => void;
  clearUserInfo: () => void;
}

export const useCollectionsTracking = (options: UseCollectionsTrackingOptions = {}): CollectionsTrackingMethods => {
  const {
    userId,
    userInfo,
    autoTrackPageViews = false,
    sessionTimeout = 30
  } = options;

  const lastActivityRef = useRef<number>(Date.now());
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());

  // Update user info when provided
  useEffect(() => {
    if (userId && userInfo) {
      setUserInfo(userId, userInfo);
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
        clearUserInfo();
        // Generate new session ID
        sessionIdRef.current = generateSessionId();
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

  // Auto-track page views for collection pages
  useEffect(() => {
    if (!autoTrackPageViews) return;

    const trackPageView = () => {
      const pathname = window.location.pathname;
      
      // Check if current page is a collection page
      if (pathname.includes('/collections/')) {
        const collectionId = pathname.split('/collections/')[1]?.split('/')[0];
        
        if (collectionId) {
          // Extract collection name from page title or URL
          const collectionName = document.title || `Collection ${collectionId}`;
          
          trackCollectionView(collectionId, collectionName, {
            autoTracked: true,
            pageType: 'collection_page'
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
  const trackCollectionView = useCallback(async (
    collectionId: string,
    collectionName: string,
    metadata?: any
  ): Promise<void> => {
    try {
      const { userId: storedUserId } = getUserInfo();
      
      await sendTrackingEvent({
        eventType: 'view',
        collectionId,
        collectionName,
        userId: userId || storedUserId,
        metadata: {
          ...metadata,
          trackingSource: 'useCollectionsTracking_hook',
          sessionId: sessionIdRef.current,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to track collection view:', error);
    }
  }, [userId]);

  const trackProductView = useCallback(async (
    collectionId: string,
    collectionName: string,
    productId: string,
    productName: string,
    metadata?: any
  ): Promise<void> => {
    try {
      const { userId: storedUserId } = getUserInfo();
      
      await sendTrackingEvent({
        eventType: 'product_view',
        collectionId,
        collectionName,
        productId,
        productName,
        userId: userId || storedUserId,
        metadata: {
          ...metadata,
          trackingSource: 'useCollectionsTracking_hook',
          sessionId: sessionIdRef.current,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  }, [userId]);

  const trackAddToCart = useCallback(async (
    collectionId: string,
    collectionName: string,
    productId: string,
    productName: string,
    price: number,
    quantity: number = 1,
    metadata?: any
  ): Promise<void> => {
    try {
      const { userId: storedUserId } = getUserInfo();
      
      await sendTrackingEvent({
        eventType: 'add_to_cart',
        collectionId,
        collectionName,
        productId,
        productName,
        price,
        quantity,
        userId: userId || storedUserId,
        metadata: {
          ...metadata,
          trackingSource: 'useCollectionsTracking_hook',
          sessionId: sessionIdRef.current,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to track add to cart:', error);
    }
  }, [userId]);

  const trackPurchase = useCallback(async (
    collectionId: string,
    collectionName: string,
    productId: string,
    productName: string,
    price: number,
    quantity: number = 1,
    metadata?: any
  ): Promise<void> => {
    try {
      const { userId: storedUserId } = getUserInfo();
      
      await sendTrackingEvent({
        eventType: 'purchase',
        collectionId,
        collectionName,
        productId,
        productName,
        price,
        quantity,
        userId: userId || storedUserId,
        metadata: {
          ...metadata,
          trackingSource: 'useCollectionsTracking_hook',
          sessionId: sessionIdRef.current,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to track purchase:', error);
    }
  }, [userId]);

  const getSessionId = useCallback((): string => {
    return sessionIdRef.current;
  }, []);

  const setUserInfo = useCallback((userId: string, userInfo: any): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('collections_user_id', userId);
      sessionStorage.setItem('collections_user_info', JSON.stringify(userInfo));
    }
  }, []);

  const clearUserInfo = useCallback((): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('collections_user_id');
      sessionStorage.removeItem('collections_user_info');
    }
  }, []);

  return {
    trackCollectionView,
    trackProductView,
    trackAddToCart,
    trackPurchase,
    getSessionId,
    setUserInfo,
    clearUserInfo
  };
};

// Helper functions
function generateSessionId(): string {
  return `collections_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getUserInfo(): { userId?: string; userInfo?: any } {
  if (typeof window === 'undefined') return {};
  
  const userId = sessionStorage.getItem('collections_user_id');
  const userInfoStr = sessionStorage.getItem('collections_user_info');
  
  return {
    userId: userId || undefined,
    userInfo: userInfoStr ? JSON.parse(userInfoStr) : undefined
  };
}

async function sendTrackingEvent(eventData: any): Promise<void> {
  try {
    const response = await fetch('/api/collections/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to track event');
    }
  } catch (error) {
    console.error('Error sending collections analytics event:', error);
    throw error;
  }
}

// Context for collections tracking (optional, for complex apps)

const CollectionsTrackingContext = createContext<CollectionsTrackingMethods | null>(null);

export const CollectionsTrackingProvider = ({ children, options = {} }: {
  children: React.ReactNode;
  options?: UseCollectionsTrackingOptions;
}) => {
  const tracking = useCollectionsTracking(options);
  
  return React.createElement(
    CollectionsTrackingContext.Provider,
    { value: tracking },
    children
  );
};

export const useCollectionsTrackingContext = (): CollectionsTrackingMethods => {
  const context = useContext(CollectionsTrackingContext);
  if (!context) {
    throw new Error('useCollectionsTrackingContext must be used within a CollectionsTrackingProvider');
  }
  return context;
};