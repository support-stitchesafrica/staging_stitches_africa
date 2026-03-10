/**
 * Client-side BOGO Analytics Tracking Service
 * 
 * This service handles real-time tracking of BOGO promotion interactions
 * from the client side, including location data, device info, and user behavior.
 */

interface TrackingEvent {
  eventType: 'view' | 'add_to_cart' | 'redemption' | 'checkout' | 'conversion';
  mappingId: string;
  mainProductId: string;
  freeProductId?: string;
  userId?: string;
  userInfo?: {
    email?: string;
    name?: string;
    preferences?: any;
  };
  metadata?: {
    cartTotal?: number;
    orderValue?: number;
    productSavings?: number;
    shippingSavings?: number;
    pageUrl?: string;
    sessionId?: string;
    conversionPath?: string[];
    [key: string]: any;
  };
}

interface LocationData {
  country?: string;
  state?: string;
  city?: string;
  ip?: string;
  timezone?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browserName: string;
  osName: string;
  screenResolution: string;
  userAgent: string;
}

class BogoClientTrackingService {
  private static instance: BogoClientTrackingService;
  private sessionId: string;
  private locationData: LocationData | null = null;
  private deviceInfo: DeviceInfo;
  private eventQueue: TrackingEvent[] = [];
  private isOnline: boolean = navigator.onLine;
  private retryAttempts: number = 0;
  private maxRetryAttempts: number = 3;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.deviceInfo = this.getDeviceInfo();
    this.initializeLocationTracking();
    this.setupEventListeners();
    this.startPeriodicFlush();
  }

  public static getInstance(): BogoClientTrackingService {
    if (!BogoClientTrackingService.instance) {
      BogoClientTrackingService.instance = new BogoClientTrackingService();
    }
    return BogoClientTrackingService.instance;
  }

  /**
   * Track a BOGO promotion view
   */
  async trackView(
    mappingId: string, 
    mainProductId: string, 
    userId?: string, 
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'view',
      mappingId,
      mainProductId,
      userId,
      metadata: {
        ...metadata,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Track add to cart event
   */
  async trackAddToCart(
    mappingId: string,
    mainProductId: string,
    freeProductId: string,
    userId?: string,
    cartTotal?: number,
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'add_to_cart',
      mappingId,
      mainProductId,
      freeProductId,
      userId,
      metadata: {
        ...metadata,
        cartTotal,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Track redemption/conversion
   */
  async trackRedemption(
    mappingId: string,
    mainProductId: string,
    freeProductId: string,
    userId?: string,
    orderValue?: number,
    savings?: number,
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'redemption',
      mappingId,
      mainProductId,
      freeProductId,
      userId,
      metadata: {
        ...metadata,
        orderValue,
        productSavings: savings,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Track checkout event
   */
  async trackCheckout(
    mappingId: string,
    mainProductId: string,
    freeProductId: string,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'checkout',
      mappingId,
      mainProductId,
      freeProductId,
      userId,
      metadata: {
        ...metadata,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Track generic event
   */
  private async trackEvent(event: TrackingEvent): Promise<void> {
    try {
      // Add location and device info to the event
      const enhancedEvent = {
        ...event,
        location: this.locationData,
        deviceInfo: this.deviceInfo,
        metadata: {
          ...event.metadata,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      if (this.isOnline) {
        await this.sendEvent(enhancedEvent);
        this.retryAttempts = 0;
      } else {
        // Queue event for later when online
        this.eventQueue.push(enhancedEvent);
      }
    } catch (error) {
      console.warn('Failed to track BOGO event:', error);
      // Queue event for retry
      this.eventQueue.push(event);
    }
  }

  /**
   * Send event to analytics API
   */
  private async sendEvent(event: TrackingEvent): Promise<void> {
    try {
      const response = await fetch('/api/bogo/analytics/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to track event');
      }
    } catch (error) {
      console.error('Error sending analytics event:', error);
      throw error;
    }
  }

  /**
   * Initialize location tracking
   */
  private async initializeLocationTracking(): Promise<void> {
    try {
      // Try to get location from browser geolocation API
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.locationData = {
              ...this.locationData,
              coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              },
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
          },
          (error) => {
            console.warn('Geolocation not available:', error.message);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 600000 // 10 minutes
          }
        );
      }

      // Try to get location from IP-based service
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const ipLocation = await response.json();
          this.locationData = {
            country: ipLocation.country_name,
            state: ipLocation.region,
            city: ipLocation.city,
            ip: ipLocation.ip,
            timezone: ipLocation.timezone,
            ...this.locationData // Keep coordinates if available
          };
        }
      } catch (error) {
        console.warn('IP-based location service unavailable:', error);
      }
    } catch (error) {
      console.warn('Location tracking initialization failed:', error);
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    
    return {
      deviceType: this.getDeviceType(userAgent),
      browserName: this.getBrowserName(userAgent),
      osName: this.getOSName(userAgent),
      screenResolution: `${screen.width}x${screen.height}`,
      userAgent
    };
  }

  private getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  private getOSName(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Setup event listeners for online/offline status
   */
  private setupEventListeners(): void {
    // Only setup event listeners in browser environment
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushEventQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Track page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushEventQueue();
        }
      });
    }

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flushEventQueue();
    });
  }

  /**
   * Start periodic flush of queued events
   */
  private startPeriodicFlush(): void {
    setInterval(() => {
      if (this.isOnline && this.eventQueue.length > 0) {
        this.flushEventQueue();
      }
    }, 30000); // Flush every 30 seconds
  }

  /**
   * Flush queued events
   */
  private async flushEventQueue(): Promise<void> {
    if (!this.isOnline || this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of eventsToSend) {
      try {
        await this.sendEvent(event);
      } catch (error) {
        // Re-queue failed events if we haven't exceeded retry limit
        if (this.retryAttempts < this.maxRetryAttempts) {
          this.eventQueue.push(event);
          this.retryAttempts++;
        } else {
          console.error('Max retry attempts reached for event:', event);
        }
      }
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `bogo_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current location data
   */
  getLocationData(): LocationData | null {
    return this.locationData;
  }

  /**
   * Get device information
   */
  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  /**
   * Update user information for tracking
   */
  setUserInfo(userId: string, userInfo: any): void {
    // Store user info for future events
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bogo_user_id', userId);
      sessionStorage.setItem('bogo_user_info', JSON.stringify(userInfo));
    }
  }

  /**
   * Get stored user information
   */
  getUserInfo(): { userId?: string; userInfo?: any } {
    if (typeof window === 'undefined') return {};
    
    const userId = sessionStorage.getItem('bogo_user_id');
    const userInfoStr = sessionStorage.getItem('bogo_user_info');
    
    return {
      userId: userId || undefined,
      userInfo: userInfoStr ? JSON.parse(userInfoStr) : undefined
    };
  }

  /**
   * Clear user information
   */
  clearUserInfo(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bogo_user_id');
      sessionStorage.removeItem('bogo_user_info');
    }
  }
}

// Export singleton instance
export const bogoClientTracker = BogoClientTrackingService.getInstance();

// Export types for use in other components
export type { TrackingEvent, LocationData, DeviceInfo };