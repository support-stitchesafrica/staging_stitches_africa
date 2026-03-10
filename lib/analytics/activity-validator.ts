/**
 * Activity Data Validation and Cleaning Service
 * 
 * Provides comprehensive validation, bot filtering, duplicate detection,
 * and data consistency checks for shop activity tracking.
 * 
 * Validates Requirements: 21.6, 22.7
 */

import type { ShopActivity, ActivityType, DeviceType, TrafficSource } from '@/types/shop-activities';
import { Timestamp } from 'firebase/firestore';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedActivity?: ShopActivity;
}

/**
 * Bot detection result
 */
export interface BotDetectionResult {
  isBot: boolean;
  confidence: number; // 0-1
  reasons: string[];
}

/**
 * Duplicate detection result
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateId?: string;
  timeSinceLastActivity?: number; // milliseconds
}

/**
 * Activity Validator Service
 * Handles all validation, cleaning, and filtering of activity data
 */
export class ActivityValidator {
  // Bot detection patterns (lowercase for case-insensitive matching)
  private static readonly BOT_USER_AGENTS = [
    'googlebot', 'bingbot', 'bot', 'crawler', 'spider', 'scraper', 
    'curl', 'wget', 'python-requests', 'java/', 'go-http-client', 
    'axios', 'okhttp', 'headless', 'headlesschrome', 'phantom', 
    'selenium', 'puppeteer', 'playwright'
  ];

  // Suspicious patterns
  private static readonly SUSPICIOUS_PATTERNS = {
    minTimeBetweenActivities: 100, // milliseconds - too fast to be human
    maxActivitiesPerMinute: 60, // unrealistic activity rate
    maxSearchLength: 500, // characters
    minSearchLength: 1,
    maxQuantity: 1000,
    minPrice: 0,
    maxPrice: 1000000,
  };

  // Recent activities cache for duplicate detection
  private recentActivities: Map<string, { activity: ShopActivity; timestamp: number }> = new Map();
  private readonly DUPLICATE_WINDOW_MS = 5000; // 5 seconds

  // Activity rate tracking for bot detection
  private activityRates: Map<string, number[]> = new Map();
  private readonly RATE_WINDOW_MS = 60000; // 1 minute

  /**
   * Validates activity data with comprehensive checks
   * Validates: Requirements 21.6
   */
  validateActivity(activity: ShopActivity): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!activity.id || typeof activity.id !== 'string' || activity.id.trim() === '') {
      errors.push('Activity ID is required and must be a non-empty string');
    }

    if (!activity.type || !this.isValidActivityType(activity.type)) {
      errors.push(`Invalid activity type: ${activity.type}. Must be one of: view, add_to_cart, remove_from_cart, purchase, search`);
    }

    if (!activity.userId || typeof activity.userId !== 'string' || activity.userId.trim() === '') {
      errors.push('User ID is required and must be a non-empty string');
    }

    if (!activity.sessionId || typeof activity.sessionId !== 'string' || activity.sessionId.trim() === '') {
      errors.push('Session ID is required and must be a non-empty string');
    }

    if (!activity.vendorId || typeof activity.vendorId !== 'string') {
      // vendorId can be empty for search activities
      if (activity.type !== 'search') {
        errors.push('Vendor ID is required for non-search activities');
      }
    }

    if (!activity.timestamp) {
      errors.push('Timestamp is required');
    } else if (!this.isValidTimestamp(activity.timestamp)) {
      errors.push('Timestamp is invalid or in the future');
    }

    // Product ID validation
    if (activity.type !== 'search' && (!activity.productId || activity.productId.trim() === '')) {
      errors.push('Product ID is required for non-search activities');
    }

    // Metadata validation
    const metadataValidation = this.validateMetadata(activity);
    errors.push(...metadataValidation.errors);
    warnings.push(...metadataValidation.warnings);

    // Type-specific validation
    const typeValidation = this.validateByType(activity);
    errors.push(...typeValidation.errors);
    warnings.push(...typeValidation.warnings);

    // Data consistency checks
    const consistencyValidation = this.checkDataConsistency(activity);
    errors.push(...consistencyValidation.errors);
    warnings.push(...consistencyValidation.warnings);

    // Clean the activity if valid
    let cleanedActivity: ShopActivity | undefined;
    if (errors.length === 0) {
      cleanedActivity = this.cleanActivity(activity);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedActivity
    };
  }

  /**
   * Validates activity metadata
   */
  private validateMetadata(activity: ShopActivity): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata = activity.metadata;

    if (!metadata) {
      errors.push('Metadata is required');
      return { errors, warnings };
    }

    // Device type validation
    if (!metadata.deviceType || !this.isValidDeviceType(metadata.deviceType)) {
      errors.push(`Invalid device type: ${metadata.deviceType}. Must be one of: mobile, tablet, desktop`);
    }

    // User agent validation
    if (!metadata.userAgent || typeof metadata.userAgent !== 'string') {
      errors.push('User agent is required');
    } else if (metadata.userAgent.length > 500) {
      warnings.push('User agent string is unusually long');
    }

    // Price validation (for cart/purchase activities)
    if (metadata.price !== undefined) {
      const price = Number(metadata.price);
      if (typeof metadata.price !== 'number' && typeof metadata.price !== 'string') {
        errors.push('Price must be a valid number');
      } else if (isNaN(price)) {
        errors.push('Price must be a valid number');
      } else if (price < ActivityValidator.SUSPICIOUS_PATTERNS.minPrice) {
        errors.push('Price cannot be negative');
      } else if (price > ActivityValidator.SUSPICIOUS_PATTERNS.maxPrice) {
        warnings.push('Price is unusually high');
      }
    }

    // Quantity validation
    if (metadata.quantity !== undefined) {
      const quantity = Number(metadata.quantity);
      if (typeof metadata.quantity !== 'number' && typeof metadata.quantity !== 'string') {
        errors.push('Quantity must be an integer');
      } else if (isNaN(quantity) || !Number.isInteger(quantity)) {
        errors.push('Quantity must be an integer');
      } else if (quantity <= 0) {
        errors.push('Quantity must be positive');
      } else if (quantity > ActivityValidator.SUSPICIOUS_PATTERNS.maxQuantity) {
        warnings.push('Quantity is unusually high');
      }
    }

    // Currency validation
    if (metadata.currency !== undefined && metadata.currency !== 'USD') {
      warnings.push('Currency should be USD');
    }

    // Search query validation
    if (metadata.searchQuery !== undefined) {
      if (typeof metadata.searchQuery !== 'string') {
        errors.push('Search query must be a string');
      } else if (metadata.searchQuery.length < ActivityValidator.SUSPICIOUS_PATTERNS.minSearchLength) {
        warnings.push('Search query is empty');
      } else if (metadata.searchQuery.length > ActivityValidator.SUSPICIOUS_PATTERNS.maxSearchLength) {
        warnings.push('Search query is unusually long');
      }
    }

    // Results count validation
    if (metadata.resultsCount !== undefined) {
      if (typeof metadata.resultsCount !== 'number' || !Number.isInteger(metadata.resultsCount)) {
        errors.push('Results count must be an integer');
      } else if (metadata.resultsCount < 0) {
        errors.push('Results count cannot be negative');
      }
    }

    // Traffic source validation
    if (metadata.source && !this.isValidTrafficSource(metadata.source)) {
      warnings.push(`Invalid traffic source: ${metadata.source}`);
    }

    return { errors, warnings };
  }

  /**
   * Validates activity based on its type
   */
  private validateByType(activity: ShopActivity): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (activity.type) {
      case 'add_to_cart':
      case 'purchase':
        // These require price and quantity
        if (activity.metadata.price === undefined) {
          errors.push(`${activity.type} activity requires price in metadata`);
        }
        if (activity.metadata.quantity === undefined) {
          errors.push(`${activity.type} activity requires quantity in metadata`);
        }
        break;

      case 'search':
        // Search requires query
        if (!activity.metadata.searchQuery) {
          errors.push('Search activity requires searchQuery in metadata');
        }
        if (activity.metadata.resultsCount === undefined) {
          warnings.push('Search activity should include resultsCount');
        }
        break;

      case 'view':
      case 'remove_from_cart':
        // These don't require additional fields
        break;

      default:
        errors.push(`Unknown activity type: ${activity.type}`);
    }

    return { errors, warnings };
  }

  /**
   * Checks data consistency
   * Validates: Requirements 21.6, 22.7
   */
  private checkDataConsistency(activity: ShopActivity): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if IDs have valid format (reject malicious patterns)
    if (activity.userId && !this.isValidIdFormat(activity.userId)) {
      errors.push('User ID contains invalid or suspicious characters');
    }

    if (activity.productId && !this.isValidIdFormat(activity.productId)) {
      errors.push('Product ID contains invalid or suspicious characters');
    }

    if (activity.vendorId && !this.isValidIdFormat(activity.vendorId)) {
      errors.push('Vendor ID contains invalid or suspicious characters');
    }

    // Check for suspicious patterns
    if (activity.metadata.userAgent && activity.metadata.userAgent.length < 10) {
      warnings.push('User agent is suspiciously short');
    }

    // Check timestamp is not too far in the past
    if (activity.timestamp) {
      const now = Date.now();
      const activityTime = activity.timestamp.toMillis();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (now - activityTime > dayInMs) {
        warnings.push('Activity timestamp is more than 24 hours old');
      }
    }

    return { errors, warnings };
  }

  /**
   * Detects bot traffic
   * Validates: Requirements 21.6, 22.7
   */
  detectBot(activity: ShopActivity): BotDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Check user agent for bot patterns
    const userAgent = activity.metadata.userAgent.toLowerCase();
    for (const pattern of ActivityValidator.BOT_USER_AGENTS) {
      if (userAgent.includes(pattern)) {
        reasons.push(`User agent contains bot pattern: ${pattern}`);
        confidence += 0.4;
      }
    }

    // Check for missing or suspicious user agent
    if (!activity.metadata.userAgent || activity.metadata.userAgent === 'unknown') {
      reasons.push('Missing or unknown user agent');
      confidence += 0.2;
    }

    // Check activity rate for this user
    const userRate = this.checkActivityRate(activity.userId);
    if (userRate > ActivityValidator.SUSPICIOUS_PATTERNS.maxActivitiesPerMinute) {
      reasons.push(`Activity rate too high: ${userRate} activities per minute`);
      confidence += 0.3;
    }

    // Check for headless browser indicators
    if (typeof navigator !== 'undefined' && (navigator as any).webdriver) {
      reasons.push('Headless browser detected');
      confidence += 0.5;
    }

    // Check for missing referrer on non-direct traffic
    if (activity.metadata.source !== 'direct' && !activity.metadata.referrer) {
      reasons.push('Missing referrer for non-direct traffic');
      confidence += 0.1;
    }

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return {
      isBot: confidence >= 0.5,
      confidence,
      reasons
    };
  }

  /**
   * Checks for duplicate activities
   * Validates: Requirements 22.7
   */
  checkDuplicate(activity: ShopActivity): DuplicateCheckResult {
    const key = this.generateActivityKey(activity);
    const cached = this.recentActivities.get(key);

    if (cached) {
      const timeSince = Date.now() - cached.timestamp;
      
      // If same activity within duplicate window, it's a duplicate
      if (timeSince < this.DUPLICATE_WINDOW_MS) {
        return {
          isDuplicate: true,
          duplicateId: cached.activity.id,
          timeSinceLastActivity: timeSince
        };
      }
    }

    // Store this activity for future duplicate checks
    this.recentActivities.set(key, {
      activity,
      timestamp: Date.now()
    });

    // Clean up old entries
    this.cleanupRecentActivities();

    return {
      isDuplicate: false
    };
  }

  /**
   * Cleans and sanitizes activity data
   */
  private cleanActivity(activity: ShopActivity): ShopActivity {
    return {
      ...activity,
      id: activity.id.trim(),
      userId: activity.userId.trim(),
      sessionId: activity.sessionId.trim(),
      vendorId: activity.vendorId.trim(),
      productId: activity.productId?.trim(),
      metadata: {
        ...activity.metadata,
        userAgent: activity.metadata.userAgent.trim(),
        searchQuery: activity.metadata.searchQuery?.trim(),
        currency: activity.metadata.currency || 'USD',
        // Ensure numeric values are properly typed
        price: activity.metadata.price !== undefined ? Number(activity.metadata.price) : undefined,
        quantity: activity.metadata.quantity !== undefined ? Number(activity.metadata.quantity) : undefined,
        resultsCount: activity.metadata.resultsCount !== undefined ? Number(activity.metadata.resultsCount) : undefined
      }
    };
  }

  /**
   * Tracks activity rate for bot detection
   */
  private checkActivityRate(userId: string): number {
    const now = Date.now();
    const userActivities = this.activityRates.get(userId) || [];
    
    // Filter activities within the rate window
    const recentActivities = userActivities.filter(
      timestamp => now - timestamp < ActivityValidator.RATE_WINDOW_MS
    );
    
    // Add current activity
    recentActivities.push(now);
    
    // Update cache
    this.activityRates.set(userId, recentActivities);
    
    // Clean up old entries periodically
    if (Math.random() < 0.1) { // 10% chance
      this.cleanupActivityRates();
    }
    
    return recentActivities.length;
  }

  /**
   * Generates a unique key for duplicate detection
   */
  private generateActivityKey(activity: ShopActivity): string {
    return `${activity.userId}:${activity.type}:${activity.productId || 'search'}:${activity.sessionId}`;
  }

  /**
   * Cleans up old entries from recent activities cache
   */
  private cleanupRecentActivities(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.recentActivities.forEach((value, key) => {
      if (now - value.timestamp > this.DUPLICATE_WINDOW_MS * 2) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.recentActivities.delete(key));
  }

  /**
   * Cleans up old entries from activity rates cache
   */
  private cleanupActivityRates(): void {
    const now = Date.now();
    
    this.activityRates.forEach((timestamps, userId) => {
      const recentTimestamps = timestamps.filter(
        timestamp => now - timestamp < ActivityValidator.RATE_WINDOW_MS * 2
      );
      
      if (recentTimestamps.length === 0) {
        this.activityRates.delete(userId);
      } else {
        this.activityRates.set(userId, recentTimestamps);
      }
    });
  }

  // ============================================================================
  // Type Guards and Validators
  // ============================================================================

  private isValidActivityType(type: any): type is ActivityType {
    return ['view', 'add_to_cart', 'remove_from_cart', 'purchase', 'search'].includes(type);
  }

  private isValidDeviceType(type: any): type is DeviceType {
    return ['mobile', 'tablet', 'desktop'].includes(type);
  }

  private isValidTrafficSource(source: any): source is TrafficSource {
    return ['direct', 'search', 'social', 'referral'].includes(source);
  }

  private isValidTimestamp(timestamp: Timestamp): boolean {
    try {
      const now = Date.now();
      const activityTime = timestamp.toMillis();
      
      // Timestamp should not be in the future (with 1 minute tolerance for clock skew)
      if (activityTime > now + 60000) {
        return false;
      }
      
      // Timestamp should not be too old (more than 7 days)
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (now - activityTime > sevenDaysInMs) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  private isValidIdFormat(id: string): boolean {
    // IDs should be non-empty and not contain suspicious characters
    if (!id || id.trim() === '') return false;
    
    // Check for SQL injection patterns
    const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i;
    if (sqlPatterns.test(id)) return false;
    
    // Check for script injection patterns (XSS)
    const scriptPatterns = /<script|<\/script|javascript:|onerror=|onload=|onclick=/i;
    if (scriptPatterns.test(id)) return false;
    
    return true;
  }

  /**
   * Clears all caches (useful for testing)
   */
  clearCaches(): void {
    this.recentActivities.clear();
    this.activityRates.clear();
  }
}

// Export singleton instance
let validatorInstance: ActivityValidator | null = null;

export function getActivityValidator(): ActivityValidator {
  if (!validatorInstance) {
    validatorInstance = new ActivityValidator();
  }
  return validatorInstance;
}
