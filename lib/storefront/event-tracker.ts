/**
 * Storefront Event Tracker
 * Centralized service for tracking analytics events in storefronts
 * 
 * **Feature: merchant-storefront-upgrade, Property 4: Analytics Tracking and Visualization**
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

export interface EventMetadata {
  pathname?: string;
  userAgent?: string;
  referrer?: string;
  productName?: string;
  price?: number;
  cartItems?: any[];
  cartValue?: number;
  orderId?: string;
  orderValue?: number;
  items?: any[];
  timestamp: string;
  [key: string]: any;
}

export interface TrackingEvent {
  storefrontId: string;
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_start' | 'purchase';
  sessionId: string;
  userId?: string;
  productId?: string;
  metadata?: EventMetadata;
}

/**
 * Generate or retrieve session ID from sessionStorage
 */
export const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('storefront_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('storefront_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Track an analytics event
 */
export const trackEvent = async (event: TrackingEvent): Promise<void> => {
  try {
    await fetch('/api/storefront/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    });
  } catch (error) {
    // Silently fail to avoid disrupting user experience
    console.warn('Analytics tracking failed:', error);
  }
};

/**
 * Track page view event
 */
export const trackPageView = async (
  storefrontId: string,
  sessionId: string,
  userId?: string,
  metadata?: Partial<EventMetadata>
): Promise<void> => {
  const event: TrackingEvent = {
    storefrontId,
    eventType: 'page_view',
    sessionId,
    userId,
    metadata: {
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };

  await trackEvent(event);
};

/**
 * Track product view event
 */
export const trackProductView = async (
  storefrontId: string,
  sessionId: string,
  productId: string,
  userId?: string,
  metadata?: Partial<EventMetadata>
): Promise<void> => {
  const event: TrackingEvent = {
    storefrontId,
    eventType: 'product_view',
    sessionId,
    userId,
    productId,
    metadata: {
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };

  await trackEvent(event);
};

/**
 * Track add to cart event
 */
export const trackAddToCart = async (
  storefrontId: string,
  sessionId: string,
  productId: string,
  userId?: string,
  metadata?: Partial<EventMetadata>
): Promise<void> => {
  const event: TrackingEvent = {
    storefrontId,
    eventType: 'add_to_cart',
    sessionId,
    userId,
    productId,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };

  await trackEvent(event);
};

/**
 * Track checkout start event
 */
export const trackCheckoutStart = async (
  storefrontId: string,
  sessionId: string,
  userId?: string,
  metadata?: Partial<EventMetadata>
): Promise<void> => {
  const event: TrackingEvent = {
    storefrontId,
    eventType: 'checkout_start',
    sessionId,
    userId,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };

  await trackEvent(event);
};

/**
 * Track purchase event
 */
export const trackPurchase = async (
  storefrontId: string,
  sessionId: string,
  userId?: string,
  metadata?: Partial<EventMetadata>
): Promise<void> => {
  const event: TrackingEvent = {
    storefrontId,
    eventType: 'purchase',
    sessionId,
    userId,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };

  await trackEvent(event);
};

/**
 * Event Tracker Class for more structured usage
 */
export class StorefrontEventTracker {
  private storefrontId: string;
  private sessionId: string;
  private userId?: string;

  constructor(storefrontId: string, userId?: string) {
    this.storefrontId = storefrontId;
    this.sessionId = getSessionId();
    this.userId = userId;
  }

  /**
   * Track page view
   */
  async trackPageView(metadata?: Partial<EventMetadata>): Promise<void> {
    await trackPageView(this.storefrontId, this.sessionId, this.userId, metadata);
  }

  /**
   * Track product view
   */
  async trackProductView(productId: string, metadata?: Partial<EventMetadata>): Promise<void> {
    await trackProductView(this.storefrontId, this.sessionId, productId, this.userId, metadata);
  }

  /**
   * Track add to cart
   */
  async trackAddToCart(productId: string, metadata?: Partial<EventMetadata>): Promise<void> {
    await trackAddToCart(this.storefrontId, this.sessionId, productId, this.userId, metadata);
  }

  /**
   * Track checkout start
   */
  async trackCheckoutStart(metadata?: Partial<EventMetadata>): Promise<void> {
    await trackCheckoutStart(this.storefrontId, this.sessionId, this.userId, metadata);
  }

  /**
   * Track purchase
   */
  async trackPurchase(metadata?: Partial<EventMetadata>): Promise<void> {
    await trackPurchase(this.storefrontId, this.sessionId, this.userId, metadata);
  }

  /**
   * Update user ID for the tracker
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current storefront ID
   */
  getStorefrontId(): string {
    return this.storefrontId;
  }
}