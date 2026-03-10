/**
 * Centralized Token Validator Utility
 * 
 * Provides comprehensive JWT token validation with detailed logging
 * for invitation tokens across all systems (Collections, Atlas, Marketing)
 */

import { verify, JwtPayload } from 'jsonwebtoken';
import { getJWTSecret } from '@/lib/config/jwt-config';

/**
 * Result of token validation with detailed error information
 */
export interface TokenValidationResult {
  success: boolean;
  payload?: JwtPayload & {
    inviteId: string;
    email: string;
    role: string;
    system: string;
    jti: string;
  };
  error?: string;
  errorType?: 'MALFORMED' | 'EXPIRED' | 'INVALID_SIGNATURE' | 'MISSING_FIELDS' | 'WRONG_SYSTEM';
}

/**
 * Validates an invitation JWT token with comprehensive logging
 * 
 * @param token - The JWT token to validate
 * @param expectedSystem - The expected system value ('atlas', 'collections', or 'marketing')
 * @returns TokenValidationResult with success status and payload or error details
 */
export function validateInvitationToken(
  token: string,
  expectedSystem: 'atlas' | 'collections' | 'marketing'
): TokenValidationResult {
  // Log token metadata (without exposing the actual token)
  console.log('[Token Validation] Starting validation', {
    tokenLength: token?.length || 0,
    tokenPrefix: token ? token.substring(0, 20) + '...' : 'undefined',
    expectedSystem,
    timestamp: new Date().toISOString()
  });

  // Check if token is empty or undefined
  if (!token || token.trim() === '') {
    console.error('[Token Validation] Token is empty or undefined');
    return {
      success: false,
      error: 'Token is required',
      errorType: 'MALFORMED'
    };
  }

  try {
    const secret = getJWTSecret();
    
    console.log('[Token Validation] Attempting to verify token with JWT secret');
    
    // Verify token signature and decode payload
    const decoded = verify(token, secret, {
      algorithms: ['HS256']
    }) as JwtPayload & {
      inviteId: string;
      email: string;
      role: string;
      system: string;
      jti: string;
    };

    console.log('[Token Validation] Token decoded successfully', {
      inviteId: decoded.inviteId,
      email: decoded.email,
      system: decoded.system,
      role: decoded.role,
      hasExpiration: !!decoded.exp,
      hasJti: !!decoded.jti,
      issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'unknown',
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'unknown'
    });

    // Verify required fields are present
    if (!decoded.inviteId || !decoded.email || !decoded.role || !decoded.system) {
      console.error('[Token Validation] Missing required fields in token payload', {
        hasInviteId: !!decoded.inviteId,
        hasEmail: !!decoded.email,
        hasRole: !!decoded.role,
        hasSystem: !!decoded.system
      });
      return {
        success: false,
        error: 'Token missing required fields',
        errorType: 'MISSING_FIELDS'
      };
    }

    // Verify system field matches expected value
    if (decoded.system !== expectedSystem) {
      console.error('[Token Validation] System field mismatch - token is for different system', {
        expected: expectedSystem,
        actual: decoded.system,
        inviteId: decoded.inviteId,
        email: decoded.email
      });
      return {
        success: false,
        error: `This invitation is for ${decoded.system} system, not ${expectedSystem}. Please use the correct invitation link.`,
        errorType: 'WRONG_SYSTEM'
      };
    }

    console.log('[Token Validation] Validation successful', {
      inviteId: decoded.inviteId,
      email: decoded.email,
      system: decoded.system,
      role: decoded.role
    });

    return {
      success: true,
      payload: decoded
    };

  } catch (error: any) {
    // Detailed error logging for debugging
    console.error('[Token Validation] Verification failed', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack?.split('\n')[0], // First line of stack trace only
      timestamp: new Date().toISOString()
    });

    // Categorize error type for appropriate handling
    let errorType: TokenValidationResult['errorType'] = 'MALFORMED';
    let errorMessage = 'Invalid or malformed token';

    if (error.name === 'TokenExpiredError') {
      errorType = 'EXPIRED';
      errorMessage = 'Token has expired';
      console.error('[Token Validation] Token expired - invitation link is no longer valid', {
        expiredAt: error.expiredAt ? new Date(error.expiredAt * 1000).toISOString() : 'unknown',
        currentTime: new Date().toISOString()
      });
    } else if (error.name === 'JsonWebTokenError') {
      errorType = 'INVALID_SIGNATURE';
      errorMessage = 'Invalid token signature';
      console.error('[Token Validation] JWT signature verification failed - possible tampering or wrong secret', {
        reason: error.message,
        hint: 'Verify JWT_SECRET is correctly configured'
      });
    } else if (error.name === 'NotBeforeError') {
      errorType = 'MALFORMED';
      errorMessage = 'Token not yet valid';
      console.error('[Token Validation] Token used before valid time', {
        notBefore: error.date ? new Date(error.date * 1000).toISOString() : 'unknown',
        currentTime: new Date().toISOString()
      });
    } else {
      console.error('[Token Validation] Unexpected error during validation', {
        errorType: typeof error,
        errorString: String(error),
        hint: 'This may indicate a configuration or system issue'
      });
    }

    return {
      success: false,
      error: errorMessage,
      errorType
    };
  }
}
