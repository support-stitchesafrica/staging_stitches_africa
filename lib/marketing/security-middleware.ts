/**
 * Security Middleware for Marketing Dashboard API Routes
 * Integrates input validation, rate limiting, and security headers
 * Requirements: All requirements - security aspect
 */

import { NextRequest, NextResponse } from 'next/server';
import { InputValidator, FormValidator } from './input-validator';

export interface SecurityOptions {
  validateInput?: boolean;
  sanitizeOutput?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  requireSecureHeaders?: boolean;
}

/**
 * Rate Limiter
 * Simple in-memory rate limiter for API endpoints
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if request should be rate limited
   */
  isRateLimited(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Filter out old requests outside the window
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return true;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return false;
  }

  /**
   * Clean up old entries
   */
  cleanup(windowMs: number): void {
    const now = Date.now();
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

// Cleanup rate limiter every 5 minutes
setInterval(() => {
  rateLimiter.cleanup(60 * 60 * 1000); // 1 hour window
}, 5 * 60 * 1000);

/**
 * Security Middleware Class
 */
export class SecurityMiddleware {
  /**
   * Add security headers to response
   */
  static addSecurityHeaders(response: NextResponse): NextResponse {
    // Prevent XSS attacks
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Content Security Policy
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self';"
    );
    
    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    response.headers.set(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );
    
    return response;
  }

  /**
   * Validate request body
   */
  static async validateRequestBody(
    request: NextRequest,
    validationType?: 'user' | 'invitation' | 'vendor'
  ): Promise<{ isValid: boolean; errors?: string[]; data?: any }> {
    try {
      const body = await request.json();
      
      // Sanitize the entire object
      const sanitizedBody = InputValidator.sanitizeObject(body);
      
      // Validate based on type
      let validationResult;
      
      switch (validationType) {
        case 'user':
          validationResult = FormValidator.validateUserCreation(sanitizedBody);
          break;
        case 'invitation':
          validationResult = FormValidator.validateInvitationCreation(sanitizedBody);
          break;
        case 'vendor':
          validationResult = FormValidator.validateVendorAssignment(sanitizedBody);
          break;
        default:
          // Generic validation - just sanitize
          return {
            isValid: true,
            data: sanitizedBody
          };
      }
      
      if (!validationResult.isValid) {
        return {
          isValid: false,
          errors: validationResult.errors
        };
      }
      
      return {
        isValid: true,
        data: validationResult.sanitizedValue
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid request body format']
      };
    }
  }

  /**
   * Check rate limit
   */
  static checkRateLimit(
    request: NextRequest,
    maxRequests: number = 100,
    windowMs: number = 60 * 60 * 1000 // 1 hour
  ): boolean {
    // Use IP address as identifier
    const ip = this.getClientIp(request);
    const identifier = `${ip}:${request.nextUrl.pathname}`;
    
    return rateLimiter.isRateLimited(identifier, maxRequests, windowMs);
  }

  /**
   * Get client IP address
   */
  private static getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }

    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    return 'unknown';
  }

  /**
   * Sanitize response data
   */
  static sanitizeResponse(data: any): any {
    if (typeof data === 'object' && data !== null) {
      // Remove sensitive fields
      const sanitized = { ...data };
      delete sanitized.password;
      delete sanitized.passwordHash;
      delete sanitized.token;
      delete sanitized.secret;
      delete sanitized.apiKey;
      
      // Recursively sanitize nested objects
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          sanitized[key] = this.sanitizeResponse(sanitized[key]);
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Create error response with security headers
   */
  static createErrorResponse(
    message: string,
    statusCode: number = 400,
    code?: string
  ): NextResponse {
    const response = NextResponse.json(
      {
        error: message,
        code: code || 'ERROR',
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
    
    return this.addSecurityHeaders(response);
  }

  /**
   * Create success response with security headers
   */
  static createSuccessResponse(
    data: any,
    statusCode: number = 200,
    sanitize: boolean = true
  ): NextResponse {
    const responseData = sanitize ? this.sanitizeResponse(data) : data;
    
    const response = NextResponse.json(responseData, { status: statusCode });
    
    return this.addSecurityHeaders(response);
  }
}

/**
 * Higher-order function to wrap API handlers with security middleware
 */
export function withSecurity(
  handler: (request: NextRequest, validatedData?: any, params?: any) => Promise<NextResponse>,
  options: SecurityOptions = {}
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    try {
      // Check rate limit
      if (options.rateLimit) {
        const isRateLimited = SecurityMiddleware.checkRateLimit(
          request,
          options.rateLimit.maxRequests,
          options.rateLimit.windowMs
        );
        
        if (isRateLimited) {
          return SecurityMiddleware.createErrorResponse(
            'Too many requests. Please try again later.',
            429,
            'RATE_LIMIT_EXCEEDED'
          );
        }
      }

      // Validate input for POST, PUT, PATCH requests
      let validatedData;
      if (options.validateInput && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const validation = await SecurityMiddleware.validateRequestBody(request);
        
        if (!validation.isValid) {
          return SecurityMiddleware.createErrorResponse(
            validation.errors?.join(', ') || 'Validation failed',
            400,
            'VALIDATION_ERROR'
          );
        }
        
        validatedData = validation.data;
      }

      // Call the handler
      const response = await handler(request, validatedData, params);

      // Add security headers if required
      if (options.requireSecureHeaders !== false) {
        return SecurityMiddleware.addSecurityHeaders(response);
      }

      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      return SecurityMiddleware.createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      );
    }
  };
}

/**
 * Validate specific field types
 */
export const validateField = {
  email: (email: string) => InputValidator.validateEmail(email),
  name: (name: string) => InputValidator.validateName(name),
  phone: (phone: string) => InputValidator.validatePhoneNumber(phone),
  url: (url: string) => InputValidator.validateURL(url),
  role: (role: string) => InputValidator.validateRole(role),
  id: (id: string) => InputValidator.validateId(id)
};

/**
 * Sanitize functions
 */
export const sanitize = {
  string: (input: string) => InputValidator.sanitizeString(input),
  html: (input: string) => InputValidator.sanitizeHTML(input),
  object: (obj: any) => InputValidator.sanitizeObject(obj)
};

// Export rate limiter for custom usage
export { rateLimiter };
