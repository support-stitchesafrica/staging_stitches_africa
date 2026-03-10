import { NextRequest, NextResponse } from 'next/server';
import { validateToken, ReferralJWTPayload } from './auth-service';

/**
 * Authentication middleware for protected referral routes
 * Validates JWT token from HTTP-only cookies
 */
export function withAuth(
  handler: (
    req: NextRequest,
    user: ReferralJWTPayload
  ) => Promise<Response> | Response
) {
  return async (req: NextRequest): Promise<Response> => {
    // Extract token from cookies
    const token = req.cookies.get('referral_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Validate token
    const user = await validateToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      );
    }

    // Call the handler with the authenticated user
    return handler(req, user);
  };
}

/**
 * Admin authentication middleware for admin-only routes
 * Validates JWT token and checks for admin role
 */
export function withAdminAuth(
  handler: (
    req: NextRequest,
    user: ReferralJWTPayload
  ) => Promise<Response> | Response
) {
  return async (req: NextRequest): Promise<Response> => {
    // Extract token from cookies
    const token = req.cookies.get('referral_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Validate token
    const user = await validateToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Call the handler with the authenticated admin user
    return handler(req, user);
  };
}
