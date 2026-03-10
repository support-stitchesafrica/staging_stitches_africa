/**
 * Rate Limiting Middleware for Hierarchical Referral API Routes
 * Implements rate limiting to prevent abuse and ensure fair usage
 * Requirements: 1.1, 1.2, 1.4, 2.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface RateLimitRecord {
  userId: string;
  action: string;
  count: number;
  windowStart: Timestamp;
  lastRequest: Timestamp;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowSizeMinutes: number;
}

export class HierarchicalRateLimitService {
  private static readonly COLLECTION_NAME = 'hierarchical_rate_limits';

  /**
   * Check if a user has exceeded the rate limit for a specific action
   */
  static async checkRateLimit(
    userId: string,
    action: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remainingRequests: number; resetTime: Date }> {
    const rateLimitId = `${userId}_${action}`;
    const rateLimitRef = adminDb.collection(this.COLLECTION_NAME).doc(rateLimitId);

    const windowSizeMs = config.windowSizeMinutes * 60 * 1000;
    
    try {
      const rateLimitDoc = await rateLimitRef.get();
      const now = Timestamp.now();

      if (!rateLimitDoc.exists) {
        // First request - create new rate limit record
        const newRecord: RateLimitRecord = {
          userId,
          action,
          count: 1,
          windowStart: now,
          lastRequest: now
        };

        await rateLimitRef.set(newRecord);

        const resetTime = new Date(now.toMillis() + windowSizeMs);
        return {
          allowed: true,
          remainingRequests: config.maxRequests - 1,
          resetTime
        };
      }

      const record = rateLimitDoc.data() as RateLimitRecord;
      const windowStartMs = record.windowStart.toMillis();
      const nowMs = now.toMillis();

      if (nowMs - windowStartMs < windowSizeMs) {
        // Within current window
        if (record.count >= config.maxRequests) {
          // Rate limit exceeded
          const resetTime = new Date(windowStartMs + windowSizeMs);
          return {
            allowed: false,
            remainingRequests: 0,
            resetTime
          };
        }

        // Increment count
        await rateLimitRef.update({
          count: record.count + 1,
          lastRequest: now
        });

        const resetTime = new Date(windowStartMs + windowSizeMs);
        return {
          allowed: true,
          remainingRequests: config.maxRequests - record.count - 1,
          resetTime
        };
      } else {
        // Window has expired, start new window
        const newRecord: RateLimitRecord = {
          userId,
          action,
          count: 1,
          windowStart: now,
          lastRequest: now
        };

        await rateLimitRef.set(newRecord);

        const resetTime = new Date(nowMs + windowSizeMs);
        return {
          allowed: true,
          remainingRequests: config.maxRequests - 1,
          resetTime
        };
      }
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // On error, allow the request to proceed (fail open)
      return {
        allowed: true,
        remainingRequests: config.maxRequests,
        resetTime: new Date(Date.now() + windowSizeMs)
      };
    }
  }

  /**
   * Reset rate limit for a specific user and action
   */
  static async resetRateLimit(userId: string, action: string): Promise<void> {
    const rateLimitId = `${userId}_${action}`;
    const rateLimitRef = adminDb.collection(this.COLLECTION_NAME).doc(rateLimitId);
    
    try {
      await rateLimitRef.delete();
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      throw error;
    }
  }
}

/**
 * Rate limit configurations for different actions
 */
export const HIERARCHICAL_RATE_LIMIT_CONFIGS = {
  GENERATE_MASTER_CODE: {
    maxRequests: 5,
    windowSizeMinutes: 60, // 5 requests per hour
  } as RateLimitConfig,
  
  GENERATE_SUB_CODE: {
    maxRequests: 20,
    windowSizeMinutes: 60, // 20 requests per hour
  } as RateLimitConfig,
  
  VALIDATE_CODE: {
    maxRequests: 100,
    windowSizeMinutes: 60, // 100 requests per hour
  } as RateLimitConfig,
  
  LINK_INFLUENCER: {
    maxRequests: 10,
    windowSizeMinutes: 60, // 10 requests per hour
  } as RateLimitConfig,
  
  ANALYTICS_REQUEST: {
    maxRequests: 50,
    windowSizeMinutes: 60, // 50 requests per hour
  } as RateLimitConfig,
  
  EXPORT_REQUEST: {
    maxRequests: 10,
    windowSizeMinutes: 60, // 10 requests per hour
  } as RateLimitConfig,
  
  ADMIN_ACTION: {
    maxRequests: 100,
    windowSizeMinutes: 60, // 100 requests per hour
  } as RateLimitConfig
} as const;

/**
 * Middleware function to apply rate limiting to API routes
 */
export async function applyRateLimit(
  request: NextRequest,
  userId: string,
  action: keyof typeof HIERARCHICAL_RATE_LIMIT_CONFIGS
): Promise<NextResponse | null> {
  const config = HIERARCHICAL_RATE_LIMIT_CONFIGS[action];
  const result = await HierarchicalRateLimitService.checkRateLimit(userId, action, config);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        resetTime: result.resetTime.toISOString(),
        remainingRequests: result.remainingRequests
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remainingRequests.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString()
        }
      }
    );
  }

  // Add rate limit headers to successful responses
  request.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  request.headers.set('X-RateLimit-Remaining', result.remainingRequests.toString());
  request.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000).toString());

  return null; // No rate limit exceeded
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest, params?: any) => Promise<NextResponse>,
  action: keyof typeof HIERARCHICAL_RATE_LIMIT_CONFIGS,
  getUserId: (request: NextRequest) => Promise<string>
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    try {
      const userId = await getUserId(request);
      const rateLimitResponse = await applyRateLimit(request, userId, action);
      
      if (rateLimitResponse) {
        return rateLimitResponse; // Rate limit exceeded
      }

      return handler(request, params);
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, proceed with the request (fail open)
      return handler(request, params);
    }
  };
}