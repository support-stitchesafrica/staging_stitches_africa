/**
 * Session Management for Marketing Dashboard
 * Handles session validation, user context extraction, and session lifecycle
 * Requirements: 6.1, 7.1, 8.1, 9.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../firebase-admin';
import { AuthenticatedUser } from './auth-middleware';
import { SessionTimeoutManager, SecureTokenGenerator } from './password-validator';

export interface SessionInfo {
  uid: string;
  email: string;
  sessionId: string;
  createdAt: Date;
  lastAccessAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export interface SessionValidationResult {
  isValid: boolean;
  session?: SessionInfo;
  user?: AuthenticatedUser;
  error?: string;
}

export class SessionManager {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  /**
   * Creates a new session for a user
   * @param user - Authenticated user
   * @param request - Request object for extracting session info
   * @returns Session information
   */
  static async createSession(user: AuthenticatedUser, request: NextRequest): Promise<SessionInfo> {
    const sessionId = SecureTokenGenerator.generateSessionToken();
    const now = new Date();
    const expiresAt = SessionTimeoutManager.calculateExpirationTime(now, this.SESSION_TIMEOUT);

    const sessionInfo: SessionInfo = {
      uid: user.uid,
      email: user.email,
      sessionId,
      createdAt: now,
      lastAccessAt: now,
      expiresAt,
      ipAddress: this.extractIpAddress(request),
      userAgent: request.headers.get('user-agent') || undefined,
      isActive: true
    };

    // Store session in Firestore
    await adminDb.collection('marketing_sessions').doc(sessionId).set({
      ...sessionInfo,
      createdAt: now,
      lastAccessAt: now,
      expiresAt
    });

    return sessionInfo;
  }

  /**
   * Validates an existing session
   * @param sessionId - Session ID to validate
   * @param request - Request object for updating session info
   * @returns Session validation result
   */
  static async validateSession(sessionId: string, request?: NextRequest): Promise<SessionValidationResult> {
    try {
      const sessionDoc = await adminDb.collection('marketing_sessions').doc(sessionId).get();
      
      if (!sessionDoc.exists) {
        return {
          isValid: false,
          error: 'Session not found'
        };
      }

      const sessionData = sessionDoc.data();
      if (!sessionData) {
        return {
          isValid: false,
          error: 'Invalid session data'
        };
      }

      const session: SessionInfo = {
        uid: sessionData.uid,
        email: sessionData.email,
        sessionId: sessionData.sessionId,
        createdAt: sessionData.createdAt.toDate(),
        lastAccessAt: sessionData.lastAccessAt.toDate(),
        expiresAt: sessionData.expiresAt.toDate(),
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        isActive: sessionData.isActive
      };

      // Check if session is expired
      if (SessionTimeoutManager.isSessionExpired(session.expiresAt)) {
        await this.invalidateSession(sessionId);
        return {
          isValid: false,
          error: 'Session expired'
        };
      }

      // Check if session is idle
      if (SessionTimeoutManager.isSessionIdle(session.lastAccessAt)) {
        await this.invalidateSession(sessionId);
        return {
          isValid: false,
          error: 'Session expired due to inactivity'
        };
      }

      // Check if session is active
      if (!session.isActive) {
        return {
          isValid: false,
          error: 'Session deactivated'
        };
      }

      // Update last access time if request is provided
      if (request) {
        await this.updateSessionAccess(sessionId, request);
        session.lastAccessAt = new Date();
      }

      // Fetch user profile
      const user = await this.fetchUserProfile(session.uid);
      if (!user) {
        return {
          isValid: false,
          error: 'User not found'
        };
      }

      return {
        isValid: true,
        session,
        user
      };

    } catch (error) {
      console.error('Session validation failed:', error);
      return {
        isValid: false,
        error: 'Session validation error'
      };
    }
  }

  /**
   * Updates session access time and request info
   * @param sessionId - Session ID
   * @param request - Request object
   */
  static async updateSessionAccess(sessionId: string, request: NextRequest): Promise<void> {
    try {
      const updateData: any = {
        lastAccessAt: new Date()
      };

      const ipAddress = this.extractIpAddress(request);
      if (ipAddress) {
        updateData.ipAddress = ipAddress;
      }

      const userAgent = request.headers.get('user-agent');
      if (userAgent) {
        updateData.userAgent = userAgent;
      }

      await adminDb.collection('marketing_sessions').doc(sessionId).update(updateData);
    } catch (error) {
      console.error('Failed to update session access:', error);
    }
  }

  /**
   * Invalidates a session
   * @param sessionId - Session ID to invalidate
   */
  static async invalidateSession(sessionId: string): Promise<void> {
    try {
      await adminDb.collection('marketing_sessions').doc(sessionId).update({
        isActive: false,
        invalidatedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to invalidate session:', error);
    }
  }

  /**
   * Invalidates all sessions for a user
   * @param uid - User ID
   */
  static async invalidateUserSessions(uid: string): Promise<void> {
    try {
      const sessionsQuery = await adminDb
        .collection('marketing_sessions')
        .where('uid', '==', uid)
        .where('isActive', '==', true)
        .get();

      const batch = adminDb.batch();
      sessionsQuery.docs.forEach(doc => {
        batch.update(doc.ref, {
          isActive: false,
          invalidatedAt: new Date()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to invalidate user sessions:', error);
    }
  }

  /**
   * Extends session expiration time
   * @param sessionId - Session ID
   * @param extensionTime - Time to extend in milliseconds (default: SESSION_TIMEOUT)
   */
  static async extendSession(sessionId: string, extensionTime?: number): Promise<void> {
    try {
      const sessionDoc = await adminDb.collection('marketing_sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        return;
      }

      const extension = extensionTime || this.SESSION_TIMEOUT;
      const newExpiresAt = SessionTimeoutManager.extendSession(
        sessionDoc.data()?.expiresAt?.toDate() || new Date(),
        extension
      );

      await adminDb.collection('marketing_sessions').doc(sessionId).update({
        expiresAt: newExpiresAt,
        lastAccessAt: new Date()
      });
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  }

  /**
   * Gets all active sessions for a user
   * @param uid - User ID
   * @returns Array of active sessions
   */
  static async getUserSessions(uid: string): Promise<SessionInfo[]> {
    try {
      const sessionsQuery = await adminDb
        .collection('marketing_sessions')
        .where('uid', '==', uid)
        .where('isActive', '==', true)
        .orderBy('lastAccessAt', 'desc')
        .get();

      return sessionsQuery.docs.map(doc => {
        const data = doc.data();
        return {
          uid: data.uid,
          email: data.email,
          sessionId: data.sessionId,
          createdAt: data.createdAt.toDate(),
          lastAccessAt: data.lastAccessAt.toDate(),
          expiresAt: data.expiresAt.toDate(),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          isActive: data.isActive
        };
      });
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Cleans up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date();
      const expiredSessionsQuery = await adminDb
        .collection('marketing_sessions')
        .where('expiresAt', '<', now)
        .where('isActive', '==', true)
        .get();

      if (expiredSessionsQuery.empty) {
        return;
      }

      const batch = adminDb.batch();
      expiredSessionsQuery.docs.forEach(doc => {
        batch.update(doc.ref, {
          isActive: false,
          expiredAt: now
        });
      });

      await batch.commit();
      console.log(`Cleaned up ${expiredSessionsQuery.size} expired sessions`);
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }

  /**
   * Check if session is about to expire and needs warning
   * @param sessionId - Session ID
   * @returns boolean indicating if warning should be shown
   */
  static async shouldWarnAboutExpiry(sessionId: string): Promise<boolean> {
    try {
      const sessionDoc = await adminDb.collection('marketing_sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        return false;
      }

      const expiresAt = sessionDoc.data()?.expiresAt?.toDate();
      if (!expiresAt) {
        return false;
      }

      return SessionTimeoutManager.isSessionAboutToExpire(expiresAt);
    } catch (error) {
      console.error('Failed to check session expiry warning:', error);
      return false;
    }
  }

  /**
   * Get session timeout configuration
   */
  static getTimeoutConfig() {
    return {
      sessionTimeout: this.SESSION_TIMEOUT,
      idleTimeout: this.IDLE_TIMEOUT,
      cleanupInterval: this.CLEANUP_INTERVAL
    };
  }

  /**
   * Extracts IP address from request
   * @param request - Request object
   * @returns IP address or undefined
   */
  private static extractIpAddress(request: NextRequest): string | undefined {
    // Try various headers for IP address
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

    return undefined;
  }

  /**
   * Fetches user profile from Firestore
   * @param uid - User ID
   * @returns User profile or null
   */
  private static async fetchUserProfile(uid: string): Promise<AuthenticatedUser | null> {
    try {
      const userDoc = await adminDb.collection("staging_marketing_users").doc(uid).get();
      
      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      if (!userData) {
        return null;
      }

      return {
        uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        teamId: userData.teamId,
        isActive: userData.isActive ?? true,
        lastLoginAt: userData.lastLoginAt?.toDate()
      };
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }
}

/**
 * Middleware function for session-based authentication
 * @param request - Next.js request object
 * @returns Session validation result or error response
 */
export async function validateSessionMiddleware(request: NextRequest): Promise<SessionValidationResult | NextResponse> {
  const sessionId = request.headers.get('x-session-id') || request.cookies.get('marketing-session')?.value;
  
  if (!sessionId) {
    return NextResponse.json(
      { 
        error: 'Session ID required',
        code: 'MISSING_SESSION'
      },
      { status: 401 }
    );
  }

  const result = await SessionManager.validateSession(sessionId, request);
  
  if (!result.isValid) {
    return NextResponse.json(
      { 
        error: result.error || 'Invalid session',
        code: 'INVALID_SESSION'
      },
      { status: 401 }
    );
  }

  return result;
}

/**
 * Higher-order function to wrap API handlers with session validation
 * @param handler - Original API handler
 * @returns Wrapped handler with session validation
 */
/**
 * Extracts marketing user from session
 * @param request - Next.js request object
 * @returns AuthenticatedUser or null
 */
export async function getMarketingUserFromSession(request: NextRequest): Promise<AuthenticatedUser | null> {
  const sessionResult = await validateSessionMiddleware(request);
  
  if (sessionResult instanceof NextResponse) {
    return null; // Return null for error responses
  }

  if (!sessionResult.session || !sessionResult.user) {
    return null;
  }

  return sessionResult.user;
}

/**
 * Higher-order function to wrap API handlers with session validation
 * @param handler - Original API handler
 * @returns Wrapped handler with session validation
 */
export function withSession(
  handler: (request: NextRequest, session: SessionInfo, user: AuthenticatedUser, params?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const sessionResult = await validateSessionMiddleware(request);
    
    if (sessionResult instanceof NextResponse) {
      return sessionResult; // Return error response
    }

    if (!sessionResult.session || !sessionResult.user) {
      return NextResponse.json(
        { 
          error: 'Session validation failed',
          code: 'SESSION_VALIDATION_FAILED'
        },
        { status: 401 }
      );
    }

    return handler(request, sessionResult.session, sessionResult.user, params);
  };
}