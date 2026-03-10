// lib/atlas/rate-limit-service.ts
import { db } from "@/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  Timestamp,
  deleteDoc 
} from "firebase/firestore";

export interface RateLimitRecord {
  userId: string;
  action: string;
  count: number;
  windowStart: Timestamp;
  lastRequest: Timestamp;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowSizeHours: number;
}

export class RateLimitService {
  private static readonly COLLECTION_NAME = "rateLimits";

  /**
   * Check if a user has exceeded the rate limit for a specific action
   * @param userId - The user ID to check
   * @param action - The action being rate limited (e.g., "team_invite")
   * @param config - Rate limit configuration
   * @returns Promise<{ allowed: boolean; remainingRequests: number; resetTime: Date }>
   */
  static async checkRateLimit(
    userId: string,
    action: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remainingRequests: number; resetTime: Date }> {
    const rateLimitId = `${userId}_${action}`;
    const rateLimitRef = doc(db, this.COLLECTION_NAME, rateLimitId);
    const windowSizeMs = config.windowSizeHours * 60 * 60 * 1000;
    
    try {
      const rateLimitDoc = await getDoc(rateLimitRef);
      const now = Timestamp.now();

      if (!rateLimitDoc.exists()) {
        // First request - create new rate limit record
        const newRecord: RateLimitRecord = {
          userId,
          action,
          count: 1,
          windowStart: now,
          lastRequest: now,
        };

        await setDoc(rateLimitRef, newRecord);

        const resetTime = new Date(now.toMillis() + windowSizeMs);
        return {
          allowed: true,
          remainingRequests: config.maxRequests - 1,
          resetTime,
        };
      }

      const record = rateLimitDoc.data() as RateLimitRecord;
      const windowStartMs = record.windowStart.toMillis();
      const nowMs = now.toMillis();

      // Check if we're still within the current window
      if (nowMs - windowStartMs < windowSizeMs) {
        // Within current window
        if (record.count >= config.maxRequests) {
          // Rate limit exceeded
          const resetTime = new Date(windowStartMs + windowSizeMs);
          return {
            allowed: false,
            remainingRequests: 0,
            resetTime,
          };
        }

        // Increment count
        await updateDoc(rateLimitRef, {
          count: increment(1),
          lastRequest: now,
        });

        const resetTime = new Date(windowStartMs + windowSizeMs);
        return {
          allowed: true,
          remainingRequests: config.maxRequests - (record.count + 1),
          resetTime,
        };
      } else {
        // Window has expired, start new window
        const newRecord: RateLimitRecord = {
          userId,
          action,
          count: 1,
          windowStart: now,
          lastRequest: now,
        };

        await setDoc(rateLimitRef, newRecord);

        const resetTime = new Date(nowMs + windowSizeMs);
        return {
          allowed: true,
          remainingRequests: config.maxRequests - 1,
          resetTime,
        };
      }
    } catch (error) {
      console.error("Error checking rate limit:", error);
      // On error, allow the request to proceed (fail open)
      return {
        allowed: true,
        remainingRequests: config.maxRequests - 1,
        resetTime: new Date(Date.now() + windowSizeMs),
      };
    }
  }

  /**
   * Reset rate limit for a specific user and action
   * @param userId - The user ID
   * @param action - The action to reset
   */
  static async resetRateLimit(userId: string, action: string): Promise<void> {
    const rateLimitId = `${userId}_${action}`;
    const rateLimitRef = doc(db, this.COLLECTION_NAME, rateLimitId);
    
    try {
      await deleteDoc(rateLimitRef);
    } catch (error) {
      console.error("Error resetting rate limit:", error);
      throw error;
    }
  }

  /**
   * Get current rate limit status for a user and action
   * @param userId - The user ID
   * @param action - The action to check
   * @param config - Rate limit configuration
   * @returns Promise<{ count: number; remainingRequests: number; resetTime: Date | null }>
   */
  static async getRateLimitStatus(
    userId: string,
    action: string,
    config: RateLimitConfig
  ): Promise<{ count: number; remainingRequests: number; resetTime: Date | null }> {
    const rateLimitId = `${userId}_${action}`;
    const rateLimitRef = doc(db, this.COLLECTION_NAME, rateLimitId);
    
    try {
      const rateLimitDoc = await getDoc(rateLimitRef);
      
      if (!rateLimitDoc.exists()) {
        return {
          count: 0,
          remainingRequests: config.maxRequests,
          resetTime: null,
        };
      }

      const record = rateLimitDoc.data() as RateLimitRecord;
      const now = Timestamp.now();
      const windowSizeMs = config.windowSizeHours * 60 * 60 * 1000;
      const windowStartMs = record.windowStart.toMillis();
      const nowMs = now.toMillis();

      // Check if we're still within the current window
      if (nowMs - windowStartMs < windowSizeMs) {
        const resetTime = new Date(windowStartMs + windowSizeMs);
        return {
          count: record.count,
          remainingRequests: Math.max(0, config.maxRequests - record.count),
          resetTime,
        };
      } else {
        // Window has expired
        return {
          count: 0,
          remainingRequests: config.maxRequests,
          resetTime: null,
        };
      }
    } catch (error) {
      console.error("Error getting rate limit status:", error);
      return {
        count: 0,
        remainingRequests: config.maxRequests,
        resetTime: null,
      };
    }
  }

  /**
   * Clean up expired rate limit records
   * This should be called periodically to prevent the collection from growing indefinitely
   */
  static async cleanupExpiredRecords(config: RateLimitConfig): Promise<void> {
    // This would typically be implemented as a Cloud Function
    // For now, we'll just document the need for cleanup
    console.log("Rate limit cleanup should be implemented as a scheduled Cloud Function");
  }
}

// Rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  TEAM_INVITE: {
    maxRequests: 10,
    windowSizeHours: 1,
  } as RateLimitConfig,
} as const;