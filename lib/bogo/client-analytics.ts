/**
 * Client-side BOGO Analytics Tracking Utility
 * 
 * This utility provides easy-to-use methods for tracking BOGO promotion
 * interactions from the client side.
 */

export interface BogoTrackingOptions {
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export class BogoClientAnalytics {
  private static instance: BogoClientAnalytics;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): BogoClientAnalytics {
    if (!BogoClientAnalytics.instance) {
      BogoClientAnalytics.instance = new BogoClientAnalytics();
    }
    return BogoClientAnalytics.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendTrackingEvent(eventData: any): Promise<void> {
    try {
      const response = await fetch('/api/bogo/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track',
          ...eventData,
          sessionId: this.sessionId,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to track BOGO analytics event:', response.statusText);
      }
    } catch (error) {
      console.warn('Failed to track BOGO analytics event:', error);
      // Don't throw errors to avoid disrupting user experience
    }
  }

  /**
   * Track when a user views a BOGO promotion
   */
  async trackView(
    mappingId: string,
    mainProductId: string,
    options: BogoTrackingOptions = {}
  ): Promise<void> {
    await this.sendTrackingEvent({
      eventType: 'view',
      mappingId,
      mainProductId,
      userId: options.userId,
      metadata: {
        ...options.metadata,
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      },
    });
  }

  /**
   * Track when a user adds BOGO items to cart
   */
  async trackAddToCart(
    mappingId: string,
    mainProductId: string,
    freeProductId: string,
    cartTotal?: number,
    options: BogoTrackingOptions = {}
  ): Promise<void> {
    await this.sendTrackingEvent({
      eventType: 'add_to_cart',
      mappingId,
      mainProductId,
      freeProductId,
      userId: options.userId,
      metadata: {
        ...options.metadata,
        cartTotal,
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      },
    });
  }

  /**
   * Track when a user completes a BOGO redemption/purchase
   */
  async trackRedemption(
    mappingId: string,
    mainProductId: string,
    freeProductId: string,
    orderValue?: number,
    savings?: number,
    options: BogoTrackingOptions = {}
  ): Promise<void> {
    await this.sendTrackingEvent({
      eventType: 'redemption',
      mappingId,
      mainProductId,
      freeProductId,
      userId: options.userId,
      metadata: {
        ...options.metadata,
        orderValue,
        productSavings: savings,
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      },
    });
  }

  /**
   * Track custom BOGO event
   */
  async trackCustomEvent(
    eventType: string,
    mappingId: string,
    mainProductId: string,
    freeProductId?: string,
    options: BogoTrackingOptions = {}
  ): Promise<void> {
    await this.sendTrackingEvent({
      eventType,
      mappingId,
      mainProductId,
      freeProductId,
      userId: options.userId,
      metadata: {
        ...options.metadata,
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      },
    });
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Reset session (useful for new user sessions)
   */
  resetSession(): void {
    this.sessionId = this.generateSessionId();
  }
}

// Export singleton instance
export const bogoClientAnalytics = BogoClientAnalytics.getInstance();

// Convenience functions for direct use
export const trackBogoView = (
  mappingId: string,
  mainProductId: string,
  options?: BogoTrackingOptions
) => bogoClientAnalytics.trackView(mappingId, mainProductId, options);

export const trackBogoAddToCart = (
  mappingId: string,
  mainProductId: string,
  freeProductId: string,
  cartTotal?: number,
  options?: BogoTrackingOptions
) => bogoClientAnalytics.trackAddToCart(mappingId, mainProductId, freeProductId, cartTotal, options);

export const trackBogoRedemption = (
  mappingId: string,
  mainProductId: string,
  freeProductId: string,
  orderValue?: number,
  savings?: number,
  options?: BogoTrackingOptions
) => bogoClientAnalytics.trackRedemption(mappingId, mainProductId, freeProductId, orderValue, savings, options);