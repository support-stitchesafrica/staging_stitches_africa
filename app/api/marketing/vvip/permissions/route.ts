import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { vvipPermissionService } from '@/lib/marketing/vvip-permission-service';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request using Firebase Auth
    const authResult = await authenticateRequest(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return authentication error
    }

    const { user } = authResult;

    // Get user permissions
    const permissions = {
      canCreateVvip: await vvipPermissionService.canCreateVvip(user.uid),
      canRevokeVvip: await vvipPermissionService.canRevokeVvip(user.uid),
      canApprovePayment: await vvipPermissionService.canApprovePayment(user.uid),
      canViewVvipOrders: await vvipPermissionService.canViewVvipOrders(user.uid),
      userRole: await vvipPermissionService.getUserRole(user.uid)
    };

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('VVIP Permissions API Error:', error);
    return NextResponse.json(
      { error: 'VVIP_DATABASE_ERROR', message: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}