/**
 * Enhanced BOGO Tracking Service
 * 
 * This service provides enhanced tracking capabilities for BOGO promotions,
 * automatically capturing location data, user agent information, and other
 * contextual data for comprehensive analytics.
 */

import { bogoAnalyticsService } from './analytics-service';
import { GeolocationService } from '../services/geolocationService';
import type { BogoAnalyticsEvent } from './analytics-service';

interface TrackingContext {
  userId?: string;
  sessionId?: string;
  pageUrl?: string;
  referrer?: string;
}

interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browserName: string;
  osName: string;
}

export class EnhancedBogoTrackingService {
  private static instance: EnhancedBogoTrackingService;
  private locationCache: Map<string, any> = new Map();
  private deviceInfoCache: DeviceInfo | null = null;

  private constructor() {}

  public static getInstance(): EnhancedBogoTrackingService {
    if (!EnhancedBogoTrackingService.instance) {
      EnhancedBogoTrackingService.instance = new EnhancedBogoTrackingService();
    }
    return EnhancedBogoTrackingService.instance;
  }

  /**
   * Track a BOGO event with enhanced context data
   */
  async trackBogoEvent(
    eventType: 'view' | 'add_to_cart' | 'redemption' | 'checkout' | 'conversion',
    mappingId: string,
    mainProductId: string,
    context: TrackingContext = {},
    freeProductId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Get location data (cached for performance)
      const location = await this.getLocationData();
      
      // Get device information
      const deviceInfo = this.getDeviceInfo();
      
      // Get user agent
      const userAgent = this.getUserAgent();
      
      // Create enhanced event
      const event: Omit<BogoAnalyticsEvent, 'id' | 'timestamp'> = {
        eventType,
        mappingId,
        mainProductId,
        freeProductId,
        userId: context.userId,
        sessionId: context.sessionId || this.generateSessionId(),
        location,
        userAgent,
        referrer: context.referrer || (typeof document !== 'undefined' ? document.referrer : undefined),
        metadata: {
          ...metadata,
          pageUrl: context.pageUrl || (typeof window !== 'undefined' ? window.location.href : undefined),
          deviceType: deviceInfo.deviceType,
          browserName: deviceInfo.browserName,
          osName: deviceInfo.osName,
        }
      };

      // Track the event
      await bogoAnalyticsService.trackEvent(event);
      
      // Log for debugging (remove in production)
      console.log('BOGO Event Tracked:', {
        eventType,
        mappingId,
        mainProductId,
        location: location ? `${location.city || location.state}, ${location.country}` : 'Unknown',
        deviceType: deviceInfo.deviceType
      });
    } catch (error) {
      console.error('Failed to track enhanced BOGO event:', error);
      // Fallback to basic tracking
      try {
        await bogoAnalyticsService.trackEvent({
          eventType,
          mappingId,
          mainProductId,
          freeProductId,
          userId: context.userId,
          sessionId: context.sessionId || this.generateSessionId(),
          metadata
        });
      } catch (fallbackError) {
        console.error('Fallback tracking also failed:', fallbackError);
      }
    }
  }

  /**
   * Track BOGO product view
   */
  async trackView(
    mappingId: string,
    mainProductId: string,
    context: TrackingContext = {}
  ): Promise<void> {
    await this.trackBogoEvent('view', mappingId, mainProductId, context);
  }

  /**
   * Track BOGO add to cart
   */
  async trackAddToCart(
    mappingId: string,
    mainProductId: string,
    freeProductId: string,
    context: TrackingContext = {},
    metadata?: { cartTotal?: number; productSavings?: number }
  ): Promise<void> {
    await this.trackBogoEvent('add_to_cart', mappingId, mainProductId, context, freeProductId, metadata);
  }

  /**
   * Track BOGO redemption
   */
  async trackRedemption(
    mappingId: string,
    mainProductId: string,
    freeProductId: string,
    context: TrackingContext = {},
    metadata?: { 
      orderValue?: number; 
      productSavings?: number; 
      shippingSavings?: number;
      orderId?: string;
    }
  ): Promise<void> {
    await this.trackBogoEvent('redemption', mappingId, mainProductId, context, freeProductId, metadata);
  }

  /**
   * Track BOGO checkout
   */
  async trackCheckout(
    mappingId: string,
    mainProductId: string,
    freeProductId: string,
    context: TrackingContext = {},
    metadata?: { cartTotal?: number; checkoutStep?: string }
  ): Promise<void> {
    await this.trackBogoEvent('checkout', mappingId, mainProductId, context, freeProductId, metadata);
  }

  /**
   * Get location data with caching
   */
  private async getLocationData(): Promise<any> {
    try {
      // Check cache first (cache for 1 hour)
      const cacheKey = 'user_location';
      const cached = this.locationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 3600000) {
        return cached.data;
      }

      // Get fresh location data
      const location = await GeolocationService.getUserLocation();
      
      // Cache the result
      this.locationCache.set(cacheKey, {
        data: location,
        timestamp: Date.now()
      });

      return location;
    } catch (error) {
      console.warn('Failed to get location data:', error);
      return null;
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    if (this.deviceInfoCache) {
      return this.deviceInfoCache;
    }

    try {
      const userAgent = navigator.userAgent;
      
      // Detect device type
      let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        deviceType = 'mobile';
      } else if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) {
        deviceType = 'tablet';
      }

      // Detect browser
      let browserName = 'Unknown';
      if (userAgent.includes('Chrome')) browserName = 'Chrome';
      else if (userAgent.includes('Firefox')) browserName = 'Firefox';
      else if (userAgent.includes('Safari')) browserName = 'Safari';
      else if (userAgent.includes('Edge')) browserName = 'Edge';
      else if (userAgent.includes('Opera')) browserName = 'Opera';

      // Detect OS
      let osName = 'Unknown';
      if (userAgent.includes('Windows')) osName = 'Windows';
      else if (userAgent.includes('Mac')) osName = 'macOS';
      else if (userAgent.includes('Linux')) osName = 'Linux';
      else if (userAgent.includes('Android')) osName = 'Android';
      else if (userAgent.includes('iOS')) osName = 'iOS';

      this.deviceInfoCache = { deviceType, browserName, osName };
      return this.deviceInfoCache;
    } catch (error) {
      console.warn('Failed to get device info:', error);
      return { deviceType: 'desktop', browserName: 'Unknown', osName: 'Unknown' };
    }
  }

  /**
   * Get user agent string
   */
  private getUserAgent(): string {
    try {
      return navigator.userAgent;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Generate a session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize tracking for a page
   */
  async initializePageTracking(userId?: string): Promise<string> {
    const sessionId = this.generateSessionId();
    
    // Pre-load location data for faster tracking
    this.getLocationData().catch(() => {
      // Ignore errors, will fallback during tracking
    });

    return sessionId;
  }
}

// Export singleton instance
export const enhancedBogoTracking = EnhancedBogoTrackingService.getInstance();

// Export convenience functions
export const trackBogoView = (mappingId: string, mainProductId: string, context?: TrackingContext) =>
  enhancedBogoTracking.trackView(mappingId, mainProductId, context);

export const trackBogoAddToCart = (
  mappingId: string, 
  mainProductId: string, 
  freeProductId: string, 
  context?: TrackingContext,
  metadata?: { cartTotal?: number; productSavings?: number }
) => enhancedBogoTracking.trackAddToCart(mappingId, mainProductId, freeProductId, context, metadata);

export const trackBogoRedemption = (
  mappingId: string, 
  mainProductId: string, 
  freeProductId: string, 
  context?: TrackingContext,
  metadata?: { 
    orderValue?: number; 
    productSavings?: number; 
    shippingSavings?: number;
    orderId?: string;
  }
) => enhancedBogoTracking.trackRedemption(mappingId, mainProductId, freeProductId, context, metadata);

export const trackBogoCheckout = (
  mappingId: string, 
  mainProductId: string, 
  freeProductId: string, 
  context?: TrackingContext,
  metadata?: { cartTotal?: number; checkoutStep?: string }
) => enhancedBogoTracking.trackCheckout(mappingId, mainProductId, freeProductId, context, metadata);