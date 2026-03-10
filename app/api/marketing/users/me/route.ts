/**
 * Marketing Users "Me" API Route
 * Returns the current authenticated user's profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

/**
 * GET /api/marketing/users/me
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, permissions } = authResult;

    return NextResponse.json({
      success: true,
      user,
      permissions
    });

  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
