/**
 * Authentication and Authorization Middleware for Vendor Waitlist APIs
 * 
 * Provides authentication verification and vendor authorization for waitlist endpoints
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export interface AuthContext {
  userId: string;
  email: string;
  isVendor: boolean;
  vendorId?: string;
}

/**
 * Verify Firebase ID token from request headers
 */
export async function verifyAuthToken(request: NextRequest): Promise<AuthContext | null> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    // Extract token
    const token = authHeader.substring(7);
    
    // Verify token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user is a vendor
    const userDoc = await adminDb
      .collection('users')
      .doc(decodedToken.uid)
      .get();
    
    const userData = userDoc.data();
    const isVendor = userData?.role === 'vendor' || userData?.userType === 'vendor';
    
    return {
      userId: decodedToken.uid,
      email: decodedToken.email || '',
      isVendor,
      vendorId: isVendor ? decodedToken.uid : undefined
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authContext = await verifyAuthToken(request);
  
  if (!authContext) {
    return NextResponse.json(
      { error: 'Unauthorized. Please provide a valid authentication token.' },
      { status: 401 }
    );
  }
  
  return authContext;
}

/**
 * Middleware to require vendor role
 */
export async function requireVendor(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authResult = await requireAuth(request);
  
  // If requireAuth returned an error response, pass it through
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const authContext = authResult as AuthContext;
  
  if (!authContext.isVendor) {
    return NextResponse.json(
      { error: 'Forbidden. Vendor access required.' },
      { status: 403 }
    );
  }
  
  return authContext;
}

/**
 * Verify that the authenticated vendor owns the specified collection
 */
export async function verifyCollectionOwnership(
  collectionId: string,
  vendorId: string
): Promise<boolean> {
  try {
    const collectionDoc = await adminDb
      .collection('collection_waitlists')
      .doc(collectionId)
      .get();
    
    if (!collectionDoc.exists) {
      return false;
    }
    
    const collection = collectionDoc.data();
    return collection?.vendorId === vendorId;
  } catch (error) {
    console.error('Error verifying collection ownership:', error);
    return false;
  }
}

/**
 * Middleware to require collection ownership
 */
export async function requireCollectionOwnership(
  request: NextRequest,
  collectionId: string
): Promise<AuthContext | NextResponse> {
  const authResult = await requireVendor(request);
  
  // If requireVendor returned an error response, pass it through
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const authContext = authResult as AuthContext;
  
  // Verify ownership
  const isOwner = await verifyCollectionOwnership(collectionId, authContext.vendorId!);
  
  if (!isOwner) {
    return NextResponse.json(
      { error: 'Forbidden. You do not have access to this collection.' },
      { status: 403 }
    );
  }
  
  return authContext;
}
