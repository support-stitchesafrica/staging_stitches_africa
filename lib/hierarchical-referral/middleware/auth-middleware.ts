/**
 * Authentication Middleware for Hierarchical Referral API Routes
 * Handles session validation, user context extraction, and role-based access control
 * Requirements: 1.1, 1.2, 1.4, 2.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../firebase-admin';
import { Influencer } from '../../../types/hierarchical-referral';

export interface HierarchicalAuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
  influencerType?: 'mother' | 'mini';
  influencerId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface HierarchicalAuthContext {
  user: HierarchicalAuthenticatedUser;
  influencer?: Influencer;
}

export interface HierarchicalAuthMiddlewareOptions {
  requiredInfluencerType?: 'mother' | 'mini';
  requireInfluencerProfile?: boolean;
  skipAuth?: boolean;
  allowInactiveUsers?: boolean;
}

/**
 * Extracts and validates Firebase ID token from request headers
 */
async function extractIdToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Validates Firebase ID token and returns decoded token
 */
async function validateIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
}

/**
 * Fetches influencer profile from Firestore
 */
async function fetchInfluencerProfile(uid: string): Promise<Influencer | null> {
  try {
    const influencerDoc = await adminDb
      .collection('hierarchical_influencers')
      .doc(uid)
      .get();
    
    if (!influencerDoc.exists) {
      return null;
    }

    return { id: influencerDoc.id, ...influencerDoc.data() } as Influencer;
  } catch (error) {
    console.error('Failed to fetch influencer profile:', error);
    return null;
  }
}

/**
 * Creates authenticated user object from Firebase user and influencer data
 */
function createAuthenticatedUser(
  firebaseUser: any,
  influencer?: Influencer
): HierarchicalAuthenticatedUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.name || firebaseUser.display_name,
    influencerType: influencer?.type,
    influencerId: influencer?.id,
    isActive: influencer?.status === 'active' || !influencer,
    lastLoginAt: undefined
  };
}

/**
 * Main authentication middleware function for hierarchical referral system
 */
export async function authenticateHierarchicalRequest(
  request: NextRequest,
  options: HierarchicalAuthMiddlewareOptions = {}
): Promise<HierarchicalAuthContext | NextResponse> {
  if (options.skipAuth) {
    // Create a mock context for skipped auth (testing purposes)
    return {
      user: {
        uid: 'test-user',
        email: 'test@example.com',
        influencerType: 'mother',
        influencerId: 'test-influencer',
        isActive: true
      } as HierarchicalAuthenticatedUser
    };
  }

  // Extract ID token from request
  const idToken = await extractIdToken(request);
  if (!idToken) {
    return NextResponse.json(
      { 
        error: 'Authentication required',
        code: 'MISSING_TOKEN'
      },
      { status: 401 }
    );
  }

  // Validate ID token
  const decodedToken = await validateIdToken(idToken);
  if (!decodedToken) {
    return NextResponse.json(
      { 
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      },
      { status: 401 }
    );
  }

  // Fetch influencer profile if required
  let influencer: Influencer | undefined;
  if (options.requireInfluencerProfile) {
    influencer = await fetchInfluencerProfile(decodedToken.uid);
    if (!influencer) {
      return NextResponse.json(
        { 
          error: 'Influencer profile not found',
          code: 'INFLUENCER_NOT_FOUND'
        },
        { status: 404 }
      );
    }
  } else {
    // Try to fetch influencer profile but don't require it
    influencer = await fetchInfluencerProfile(decodedToken.uid);
  }

  // Create authenticated user
  const user = createAuthenticatedUser(decodedToken, influencer);

  // Check if user is active
  if (!user.isActive && !options.allowInactiveUsers) {
    return NextResponse.json(
      { 
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      },
      { status: 403 }
    );
  }

  // Check required influencer type
  if (options.requiredInfluencerType && user.influencerType !== options.requiredInfluencerType) {
    return NextResponse.json(
      { 
        error: 'Insufficient influencer type permissions',
        code: 'INSUFFICIENT_INFLUENCER_TYPE',
        required: options.requiredInfluencerType,
        current: user.influencerType
      },
      { status: 403 }
    );
  }

  return {
    user,
    influencer
  };
}

/**
 * Higher-order function to wrap API route handlers with hierarchical authentication
 */
export function withHierarchicalAuth(
  handler: (request: NextRequest, context: HierarchicalAuthContext, params?: any) => Promise<NextResponse>,
  options: HierarchicalAuthMiddlewareOptions = {}
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const authResult = await authenticateHierarchicalRequest(request, options);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    return handler(request, authResult, params);
  };
}

/**
 * Middleware for Mother Influencer only access
 */
export function requireMotherInfluencer(options: HierarchicalAuthMiddlewareOptions = {}): HierarchicalAuthMiddlewareOptions {
  return {
    ...options,
    requiredInfluencerType: 'mother',
    requireInfluencerProfile: true
  };
}

/**
 * Middleware for Mini Influencer only access
 */
export function requireMiniInfluencer(options: HierarchicalAuthMiddlewareOptions = {}): HierarchicalAuthMiddlewareOptions {
  return {
    ...options,
    requiredInfluencerType: 'mini',
    requireInfluencerProfile: true
  };
}

/**
 * Utility function to check if user is Mother Influencer
 */
export function isMotherInfluencer(user: HierarchicalAuthenticatedUser): boolean {
  return user.influencerType === 'mother';
}

/**
 * Utility function to check if user is Mini Influencer
 */
export function isMiniInfluencer(user: HierarchicalAuthenticatedUser): boolean {
  return user.influencerType === 'mini';
}