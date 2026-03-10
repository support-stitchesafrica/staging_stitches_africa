/**
 * Activity Tracker Service
 * Tracks user interactions in the /shops section for vendor analytics
 * 
 * Validates Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7
 */

import { db } from '@/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import type { 
  ShopActivity, 
  ActivityMetadata, 
  DeviceType, 
  TrafficSource 
} from '@/types/shop-activities';
import { getActivityValidator } from './activity-validator';

export class ActivityTracker {
  private db = db;
  private sessionId: string;
  private updateQueue: Map<string, NodeJS.Timeout> = new Map();
  private retryQueue: ShopActivity[] = [];
  private readonly UPDATE_DEBOUNCE_MS = 30000; // 30 seconds
  private validator = getActivityValidator();

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Tracks product view in shops section
   * Validates: Requirements 21.1
   */
  async trackProductView(
    productId: string,
    vendorId: string,
    userId?: string
  ): Promise<void> {
    const activity: ShopActivity = {
      id: this.generateId(),
      type: 'view',
      userId: userId || this.getAnonymousUserId(),
      sessionId: this.sessionId,
      vendorId,
      productId,
      timestamp: Timestamp.now(),
      metadata: {
        deviceType: this.getDeviceType(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        location: await this.getLocation(),
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        source: this.getTrafficSource()
      }
    };

    await this.logActivity(activity);
  }

  /**
   * Tracks add to cart action
   * Validates: Requirements 21.2
   */
  async trackAddToCart(
    productId: string,
    vendorId: string,
    quantity: number,
    price: number,
    userId?: string
  ): Promise<void> {
    const activity: ShopActivity = {
      id: this.generateId(),
      type: 'add_to_cart',
      userId: userId || this.getAnonymousUserId(),
      sessionId: this.sessionId,
      vendorId,
      productId,
      timestamp: Timestamp.now(),
      metadata: {
        price,
        currency: 'USD',
        quantity,
        deviceType: this.getDeviceType(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        source: this.getTrafficSource()
      }
    };

    await this.logActivity(activity);
  }

  /**
   * Tracks remove from cart action
   * Validates: Requirements 21.3
   */
  async trackRemoveFromCart(
    productId: string,
    vendorId: string,
    userId?: string
  ): Promise<void> {
    const activity: ShopActivity = {
      id: this.generateId(),
      type: 'remove_from_cart',
      userId: userId || this.getAnonymousUserId(),
      sessionId: this.sessionId,
      vendorId,
      productId,
      timestamp: Timestamp.now(),
      metadata: {
        deviceType: this.getDeviceType(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        source: this.getTrafficSource()
      }
    };

    await this.logActivity(activity);
  }

  /**
   * Tracks purchase completion
   * Validates: Requirements 21.4
   */
  async trackPurchase(
    orderId: string,
    productId: string,
    vendorId: string,
    amount: number,
    quantity: number,
    userId?: string
  ): Promise<void> {
    const activity: ShopActivity = {
      id: this.generateId(),
      type: 'purchase',
      userId: userId || this.getAnonymousUserId(),
      sessionId: this.sessionId,
      vendorId,
      productId,
      timestamp: Timestamp.now(),
      metadata: {
        price: amount,
        currency: 'USD',
        quantity,
        deviceType: this.getDeviceType(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        location: await this.getLocation(),
        source: this.getTrafficSource()
      }
    };

    await this.logActivity(activity);
  }

  /**
   * Tracks search query
   * Validates: Requirements 21.5
   */
  async trackSearch(
    query: string,
    resultsCount: number,
    userId?: string
  ): Promise<void> {
    const activity: ShopActivity = {
      id: this.generateId(),
      type: 'search',
      userId: userId || this.getAnonymousUserId(),
      sessionId: this.sessionId,
      vendorId: '', // Search is not vendor-specific
      timestamp: Timestamp.now(),
      metadata: {
        searchQuery: query,
        resultsCount,
        deviceType: this.getDeviceType(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        source: this.getTrafficSource()
      }
    };

    await this.logActivity(activity);
  }

  /**
   * Tracks vendor profile view
   * Writes to a separate collection 'vendor_visits' for direct analytics
   * Validates: Requirements 1.2
   */
  async trackVendorView(
    vendorId: string,
    vendorName: string, // Store name for redundancy/easier querying
    userId?: string
  ): Promise<void> {
    const timestamp = Timestamp.now();
    
    // We write directly to vendor_visits to match the dashboard's expectation
    // This is distinct from shop_activities which tracks product interactions
    try {
      const visitData = {
        vendor_id: vendorId,
        vendor_name: vendorName,
        visitor_id: userId || this.getAnonymousUserId(),
        session_id: this.sessionId,
        timestamp: timestamp,
        source: this.getTrafficSource(),
        metadata: {
          deviceType: this.getDeviceType(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          location: await this.getLocation()
        }
      };

      await addDoc(collection(this.db, "staging_vendor_visits"), visitData);
      console.log(`Tracked visit for vendor: ${vendorName} (${vendorId})`);
      
      // Also trigger an analytics update
      this.scheduleAnalyticsUpdate(vendorId);
    } catch (error) {
      console.error('Failed to track vendor view:', error);
      // We don't queue this for retry in the main queue to avoid polluting shop_activities logic
      // silently fail to avoid disrupting user experience
    }
  }

  /**
   * Logs activity to Firestore with validation and filtering
   * Validates: Requirements 21.6, 21.7, 22.7
   */
  private async logActivity(activity: ShopActivity): Promise<void> {
    try {
      // Step 1: Validate activity data
      const validationResult = this.validator.validateActivity(activity);
      
      if (!validationResult.isValid) {
        console.error('Activity validation failed:', {
          activityId: activity.id,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        });
        
        // Log validation failures for monitoring
        this.logValidationFailure(activity, validationResult.errors);
        return;
      }

      // Log warnings if any
      if (validationResult.warnings.length > 0) {
        console.warn('Activity validation warnings:', {
          activityId: activity.id,
          warnings: validationResult.warnings
        });
      }

      // Use cleaned activity
      const cleanedActivity = validationResult.cleanedActivity!;

      // Step 2: Check for bot traffic
      const botDetection = this.validator.detectBot(cleanedActivity);
      
      if (botDetection.isBot) {
        console.warn('Bot traffic detected:', {
          activityId: cleanedActivity.id,
          confidence: botDetection.confidence,
          reasons: botDetection.reasons
        });
        
        // Log bot detection for monitoring
        this.logBotDetection(cleanedActivity, botDetection);
        return;
      }

      // Step 3: Check for duplicates
      const duplicateCheck = this.validator.checkDuplicate(cleanedActivity);
      
      if (duplicateCheck.isDuplicate) {
        console.warn('Duplicate activity detected:', {
          activityId: cleanedActivity.id,
          duplicateId: duplicateCheck.duplicateId,
          timeSince: duplicateCheck.timeSinceLastActivity
        });
        
        // Don't log duplicate activities
        return;
      }

      // Step 4: Log to Firestore
      await addDoc(collection(this.db, "staging_shop_activities"), {
        ...cleanedActivity,
        timestamp: cleanedActivity.timestamp
      });

      // Trigger real-time analytics update (within 30 seconds)
      if (cleanedActivity.vendorId) {
        this.scheduleAnalyticsUpdate(cleanedActivity.vendorId);
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
      
      // Store in local queue for retry
      this.queueForRetry(activity);
      
      // Log error for monitoring
      this.logActivityError(activity, error);
    }
  }

  /**
   * Schedules analytics update for vendor
   * Validates: Requirements 21.7
   */
  private scheduleAnalyticsUpdate(vendorId: string): void {
    // Debounce updates to avoid excessive processing
    // Updates will be processed within 30 seconds
    if (this.updateQueue.has(vendorId)) {
      // Clear existing timeout
      clearTimeout(this.updateQueue.get(vendorId)!);
    }

    const timeout = setTimeout(() => {
      this.processAnalyticsUpdate(vendorId);
      this.updateQueue.delete(vendorId);
    }, this.UPDATE_DEBOUNCE_MS);

    this.updateQueue.set(vendorId, timeout);
  }

  /**
   * Processes analytics update for vendor
   * This would trigger the analytics processing service
   */
  private async processAnalyticsUpdate(vendorId: string): Promise<void> {
    try {
      // In a real implementation, this would call an API endpoint
      // or trigger a Cloud Function to process the analytics
      console.log(`Processing analytics update for vendor: ${vendorId}`);
      
      // For now, we'll just log it
      // The actual processing will be handled by the analytics-processor service
    } catch (error) {
      console.error('Failed to process analytics update:', error);
    }
  }

  /**
   * Queues activity for retry on failure
   */
  private queueForRetry(activity: ShopActivity): void {
    this.retryQueue.push(activity);
    
    // Store in localStorage for persistence
    if (typeof localStorage !== 'undefined') {
      try {
        const existing = localStorage.getItem('activity_retry_queue');
        const queue = existing ? JSON.parse(existing) : [];
        queue.push(activity);
        localStorage.setItem('activity_retry_queue', JSON.stringify(queue));
      } catch (error) {
        console.error('Failed to queue activity for retry:', error);
      }
    }
  }

  /**
   * Retries failed activities from queue
   */
  async retryFailedActivities(): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    try {
      const queueData = localStorage.getItem('activity_retry_queue');
      if (!queueData) return;

      const queue: ShopActivity[] = JSON.parse(queueData);
      const failedActivities: ShopActivity[] = [];

      for (const activity of queue) {
        try {
          await addDoc(collection(this.db, "staging_shop_activities"), activity);
        } catch (error) {
          failedActivities.push(activity);
        }
      }

      // Update queue with only failed activities
      if (failedActivities.length > 0) {
        localStorage.setItem('activity_retry_queue', JSON.stringify(failedActivities));
      } else {
        localStorage.removeItem('activity_retry_queue');
      }
    } catch (error) {
      console.error('Failed to retry activities:', error);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Gets or creates session ID
   */
  private getOrCreateSessionId(): string {
    if (typeof sessionStorage === 'undefined') {
      return this.generateId();
    }

    let sessionId = sessionStorage.getItem('shop_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('shop_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Gets or creates anonymous user ID
   */
  private getAnonymousUserId(): string {
    if (typeof localStorage === 'undefined') {
      return `anon_${this.generateId()}`;
    }

    let anonId = localStorage.getItem('anonymous_user_id');
    if (!anonId) {
      anonId = `anon_${this.generateId()}`;
      localStorage.setItem('anonymous_user_id', anonId);
    }
    return anonId;
  }

  /**
   * Detects device type based on screen width
   * Validates: Requirements 21.6
   */
  private getDeviceType(): DeviceType {
    if (typeof window === 'undefined') {
      return 'desktop';
    }

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Gets user location (placeholder implementation)
   * Validates: Requirements 21.6
   */
  private async getLocation(): Promise<ActivityMetadata['location']> {
    // In a real implementation, this would use:
    // 1. IP geolocation service (e.g., ipapi.co, ipinfo.io)
    // 2. Browser geolocation API (with user permission)
    // 3. Cloudflare headers (if available)
    
    // For now, return a default location
    // This should be replaced with actual geolocation logic
    return {
      country: 'Nigeria',
      state: 'Lagos',
      city: 'Lagos'
    };
  }

  /**
   * Determines traffic source from referrer
   * Validates: Requirements 21.6
   */
  private getTrafficSource(): TrafficSource {
    if (typeof document === 'undefined') {
      return 'direct';
    }

    const referrer = document.referrer;
    if (!referrer) return 'direct';
    
    // Check for search engines
    if (referrer.includes('google') || referrer.includes('bing') || referrer.includes('yahoo')) {
      return 'search';
    }
    
    // Check for social media
    if (
      referrer.includes('facebook') || 
      referrer.includes('twitter') || 
      referrer.includes('instagram') ||
      referrer.includes('linkedin') ||
      referrer.includes('tiktok')
    ) {
      return 'social';
    }
    
    return 'referral';
  }

  /**
   * Generates unique ID for activities
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Logs validation failures for monitoring
   * Validates: Requirements 21.6, 22.7
   */
  private logValidationFailure(activity: ShopActivity, errors: string[]): void {
    try {
      // In production, this would send to a monitoring service
      // For now, we'll store in a separate collection for analysis
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'activity_validation_failed', {
          activity_type: activity.type,
          error_count: errors.length,
          errors: errors.join(', ')
        });
      }
    } catch (error) {
      console.error('Failed to log validation failure:', error);
    }
  }

  /**
   * Logs bot detection for monitoring
   * Validates: Requirements 21.6, 22.7
   */
  private logBotDetection(
    activity: ShopActivity, 
    detection: { isBot: boolean; confidence: number; reasons: string[] }
  ): void {
    try {
      // In production, this would send to a monitoring service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'bot_traffic_detected', {
          activity_type: activity.type,
          confidence: detection.confidence,
          reasons: detection.reasons.join(', ')
        });
      }
    } catch (error) {
      console.error('Failed to log bot detection:', error);
    }
  }

  /**
   * Logs activity errors for monitoring
   * Validates: Requirements 22.7
   */
  private logActivityError(activity: ShopActivity, error: any): void {
    try {
      // In production, this would send to an error tracking service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'activity_logging_error', {
          activity_type: activity.type,
          error_message: error?.message || 'Unknown error'
        });
      }
    } catch (err) {
      console.error('Failed to log activity error:', err);
    }
  }

  /**
   * Cleanup method to clear timeouts
   */
  destroy(): void {
    // Clear all pending timeouts
    this.updateQueue.forEach((timeout) => clearTimeout(timeout));
    this.updateQueue.clear();
    
    // Clear validator caches
    this.validator.clearCaches();
  }
}

// Export singleton instance for convenience
let trackerInstance: ActivityTracker | null = null;

export function getActivityTracker(): ActivityTracker {
  if (!trackerInstance) {
    trackerInstance = new ActivityTracker();
  }
  return trackerInstance;
}
