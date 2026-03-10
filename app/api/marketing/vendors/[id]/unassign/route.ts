/**
 * Vendor Unassignment API Route
 * Handles cancellation of vendor assignment
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamAssignmentService, TeamManagementUtils } from '@/lib/marketing/team-assignment-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and get current user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult.user;
    const vendorId = params.id;

    // Parse request body
    const { userId, reason } = await request.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: userId' 
        },
        { status: 400 }
      );
    }

    // Validate permissions
    if (!TeamManagementUtils.canAssignVendors(currentUser.role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions to unassign vendors' 
        },
        { status: 403 }
      );
    }

    // Unassign vendor
    await TeamAssignmentService.unassignVendor(
      vendorId,
      userId,
      currentUser.uid,
      reason
    );

    return NextResponse.json({
      success: true,
      message: 'Vendor unassigned successfully'
    });

  } catch (error) {
    console.error('Error unassigning vendor:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No active assignment found')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No active assignment found for this vendor and user' 
          },
          { status: 404 }
        );
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { 
            success: false, 
            error: error.message 
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to unassign vendor' 
      },
      { status: 500 }
    );
  }
}
