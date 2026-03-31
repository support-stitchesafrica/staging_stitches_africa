/**
 * Authentication Middleware for Marketing Dashboard API Routes
 * Handles session validation, user context extraction, and role-based access control
 * Requirements: 6.1, 7.1, 8.1, 9.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../firebase-admin';
import { validateDomainForFirebase } from './domain-middleware';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
  role: 'super_admin' | 'team_lead' | 'bdm' | 'team_member';
  teamId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface AuthContext {
  user: AuthenticatedUser;
  permissions: UserPermissions;
}

export interface UserPermissions {
  canManageUsers: boolean;
  canInviteUsers: boolean;
  canManageTeams: boolean;
  canAssignVendors: boolean;
  canViewAllVendors: boolean;
  canViewAllAnalytics: boolean;
  canManageRoles: boolean;
  canViewAuditLogs: boolean;
  canExportData: boolean;
  // Waitlist permissions
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canViewSignups: boolean;
  canExportSignups: boolean;
}

export interface AuthMiddlewareOptions {
  requiredRole?: 'super_admin' | 'team_lead' | 'bdm' | 'team_member';
  requiredPermissions?: (keyof UserPermissions)[];
  skipAuth?: boolean;
  allowInactiveUsers?: boolean;
}

/**
 * Extracts and validates Firebase ID token from request headers
 * @param request - Next.js request object
 * @returns Firebase ID token or null if not found/invalid
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
 * @param idToken - Firebase ID token
 * @returns Decoded token or null if invalid
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
 * Fetches user profile from Firestore
 * @param uid - User ID
 * @returns User profile or null if not found
 */
async function fetchUserProfile(uid: string): Promise<AuthenticatedUser | null> {
  try {
    // Check if adminDb is properly initialized
    if (!adminDb) {
      console.error('Firebase Admin DB is not initialized');
      return null;
    }
    
    const userDoc = await adminDb.collection("staging_marketing_users").doc(uid).get();
    
    if (!userDoc.exists) {
      // User document doesn't exist — auto-create for valid domain users
      try {
        const firebaseUser = await adminAuth.getUser(uid);
        if (firebaseUser.email) {
          const validDomains = ['@stitchesafrica.com', '@stitchesafrica.pro'];
          const isValidDomain = validDomains.some(domain => firebaseUser.email!.endsWith(domain));

          if (!isValidDomain) {
            console.error('Invalid email domain:', firebaseUser.email);
            return null;
          }

          // Check if a super_admin already exists in staging_marketing_users
          const superAdminsSnapshot = await adminDb
            .collection('staging_marketing_users')
            .where('role', '==', 'super_admin')
            .limit(1)
            .get();

          const role = superAdminsSnapshot.empty ? 'super_admin' : 'team_member';

          const userProfile = {
            uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            role,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await adminDb.collection('staging_marketing_users').doc(uid).set(userProfile);

          return {
            uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            role: role as AuthenticatedUser['role'],
            isActive: true,
          };
        }
      } catch (creationError) {
        console.error('Error creating user profile:', creationError);
      }

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

/**
 * Generates user permissions based on role
 * @param role - User role
 * @returns User permissions object
 */
function generatePermissions(role: string): UserPermissions {
  switch (role) {
    case 'super_admin':
      return {
        canManageUsers: true,
        canInviteUsers: true,
        canManageTeams: true,
        canAssignVendors: true,
        canViewAllVendors: true,
        canViewAllAnalytics: true,
        canManageRoles: true,
        canViewAuditLogs: true,
        canExportData: true,
        // Waitlist permissions
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canPublish: true,
        canViewSignups: true,
        canExportSignups: true
      };
    
    case 'team_lead':
      return {
        canManageUsers: false,
        canInviteUsers: false,
        canManageTeams: true, // Only their own team
        canAssignVendors: true, // Within their team
        canViewAllVendors: false, // Only team vendors
        canViewAllAnalytics: false, // Only team analytics
        canManageRoles: false,
        canViewAuditLogs: false,
        canExportData: true, // Team data only
        // Waitlist permissions
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canPublish: true,
        canViewSignups: true,
        canExportSignups: true
      };
    
    case 'bdm':
      return {
        canManageUsers: true,
        canInviteUsers: true,
        canManageTeams: true,
        canAssignVendors: true,
        canViewAllVendors: true,
        canViewAllAnalytics: true,
        canManageRoles: false,
        canViewAuditLogs: true,
        canExportData: true,
        // Waitlist permissions
        canCreate: true,
        canEdit: false,
        canDelete: false,
        canPublish: false,
        canViewSignups: true,
        canExportSignups: false
      };
    
    case 'team_member':
      return {
        canManageUsers: false,
        canInviteUsers: false,
        canManageTeams: false,
        canAssignVendors: false,
        canViewAllVendors: false, // Only assigned vendors
        canViewAllAnalytics: false, // Only assigned vendor analytics
        canManageRoles: false,
        canViewAuditLogs: false,
        canExportData: false,
        // Waitlist permissions
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canPublish: false,
        canViewSignups: false,
        canExportSignups: false
      };
    
    default:
      return {
        canManageUsers: false,
        canInviteUsers: false,
        canManageTeams: false,
        canAssignVendors: false,
        canViewAllVendors: false,
        canViewAllAnalytics: false,
        canManageRoles: false,
        canViewAuditLogs: false,
        canExportData: false,
        // Waitlist permissions
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canPublish: false,
        canViewSignups: false,
        canExportSignups: false
      };
  }
}

/**
 * Checks if user has required permissions
 * @param userPermissions - User's permissions
 * @param requiredPermissions - Required permissions
 * @returns boolean indicating if user has all required permissions
 */
function hasRequiredPermissions(
  userPermissions: UserPermissions,
  requiredPermissions: (keyof UserPermissions)[]
): boolean {
  return requiredPermissions.every(permission => userPermissions[permission]);
}

/**
 * Updates user's last login timestamp
 * @param uid - User ID
 */
async function updateLastLogin(uid: string): Promise<void> {
  try {
    // Check if adminDb is properly initialized
    if (!adminDb) {
      console.error('Firebase Admin DB is not initialized');
      return;
    }
    
    await adminDb.collection("staging_marketing_users").doc(uid).update({
      lastLoginAt: new Date()
    });
  } catch (error) {
    console.error('Failed to update last login:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  }
}

/**
 * Main authentication middleware function
 * @param request - Next.js request object
 * @param options - Authentication options
 * @returns AuthContext if authenticated, NextResponse with error if not
 */
export async function authenticateRequest(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<AuthContext | NextResponse> {
  if (options.skipAuth) {
    // Create a mock context for skipped auth (testing purposes)
    return {
      user: {
        uid: 'test-user',
        email: 'test@stitchesafrica.com',
        role: 'super_admin',
        isActive: true
      } as AuthenticatedUser,
      permissions: generatePermissions('super_admin')
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

  // Validate domain
  try {
    await validateDomainForFirebase(decodedToken.email || '');
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Invalid email domain',
        code: 'INVALID_DOMAIN'
      },
      { status: 403 }
    );
  }

  // Fetch user profile
  const user = await fetchUserProfile(decodedToken.uid);
  if (!user) {
    return NextResponse.json(
      { 
        error: 'User profile not found',
        code: 'USER_NOT_FOUND'
      },
      { status: 404 }
    );
  }

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

  // Check required role
  if (options.requiredRole && user.role !== options.requiredRole) {
    return NextResponse.json(
      { 
        error: 'Insufficient role permissions',
        code: 'INSUFFICIENT_ROLE',
        required: options.requiredRole,
        current: user.role
      },
      { status: 403 }
    );
  }

  // Generate permissions
  const permissions = generatePermissions(user.role);

  // Check required permissions
  if (options.requiredPermissions && !hasRequiredPermissions(permissions, options.requiredPermissions)) {
    return NextResponse.json(
      { 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: options.requiredPermissions
      },
      { status: 403 }
    );
  }

  // Update last login (fire and forget)
  updateLastLogin(user.uid).catch(console.error);

  return {
    user,
    permissions
  };
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * @param handler - The original API route handler
 * @param options - Authentication options
 * @returns Wrapped handler with authentication
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext, params?: any) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const authResult = await authenticateRequest(request, options);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    return handler(request, authResult, params);
  };
}

/**
 * Middleware for role-based access control
 * @param allowedRoles - Array of allowed roles
 * @returns Middleware function
 */
export function requireRole(...allowedRoles: ('super_admin' | 'team_lead' | 'bdm' | 'team_member')[]) {
  return (options: AuthMiddlewareOptions = {}): AuthMiddlewareOptions => ({
    ...options,
    requiredRole: allowedRoles.length === 1 ? allowedRoles[0] : undefined,
    // For multiple roles, we'll need to check in the handler
  });
}

/**
 * Middleware for permission-based access control
 * @param requiredPermissions - Array of required permissions
 * @returns Middleware function
 */
export function requirePermissions(...requiredPermissions: (keyof UserPermissions)[]) {
  return (options: AuthMiddlewareOptions = {}): AuthMiddlewareOptions => ({
    ...options,
    requiredPermissions
  });
}

/**
 * Utility function to check if user has specific role
 * @param user - Authenticated user
 * @param roles - Roles to check
 * @returns boolean indicating if user has any of the specified roles
 */
export function hasRole(user: AuthenticatedUser, ...roles: string[]): boolean {
  return roles.includes(user.role);
}

/**
 * Utility function to check if user has specific permission
 * @param permissions - User permissions
 * @param permission - Permission to check
 * @returns boolean indicating if user has the permission
 */
export function hasPermission(permissions: UserPermissions, permission: keyof UserPermissions): boolean {
  return permissions[permission];
}