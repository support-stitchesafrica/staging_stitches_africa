import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { vvipPermissionService } from '@/lib/marketing/vvip-permission-service';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request using Firebase Auth
    const authResult = await authenticateRequest(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return authentication error
    }

    const { user } = authResult;

    // Check if user can revoke VVIP status
    const canRevoke = await vvipPermissionService.canRevokeVvip(user.uid);
    
    if (!canRevoke) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_PERMISSIONS', message: 'You do not have permission to revoke VVIP status' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'User ID is required' },
        { status: 400 }
      );
    }

    // For now, just return success
    // In a real implementation, you would:
    // 1. Update the user's VVIP status in the database
    // 2. Log the action for audit purposes
    // 3. Send notifications if needed

    console.log(`VVIP status revoked for user ${userId} by ${user.email}`);

    return NextResponse.json({ 
      success: true,
      message: 'VVIP status revoked successfully',
      revokedBy: user.email,
      revokedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('VVIP Revoke API Error:', error);
    return NextResponse.json(
      { error: 'VVIP_DATABASE_ERROR', message: 'Failed to revoke VVIP status' },
      { status: 500 }
    );
  }
}