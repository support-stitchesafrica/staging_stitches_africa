/**
 * Vendor Assignment API Route
 * Handles vendor assignment to users
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamAssignmentService, TeamManagementUtils, type CreateVendorAssignmentData } from '@/lib/marketing/team-assignment-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get current user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult.user;
    const assignmentData: CreateVendorAssignmentData = await request.json();

    // Validate required fields
    if (!assignmentData.vendorId || !assignmentData.assignedToUserId || !assignmentData.assignedByUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: vendorId, assignedToUserId, assignedByUserId' 
        },
        { status: 400 }
      );
    }

    // Validate permissions
    if (!TeamManagementUtils.canAssignVendors(currentUser.role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions to assign vendors' 
        },
        { status: 403 }
      );
    }

    // Assign vendor
    const assignment = await TeamAssignmentService.assignVendor(assignmentData);

    return NextResponse.json({
      success: true,
      message: 'Vendor assigned successfully',
      data: assignment
    });

  } catch (error) {
    console.error('Error assigning vendor:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('user not found')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User not found' 
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to assign vendor' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate and get current user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult.user;
    
    // Validate permissions
    if (!TeamManagementUtils.canAssignVendors(currentUser.role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions to view vendor assignments' 
        },
        { status: 403 }
      );
    }

    const assignments = await TeamAssignmentService.getAllVendorAssignments();

    return NextResponse.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    console.error('Error getting vendor assignments:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve vendor assignments' 
      },
      { status: 500 }
    );
  }
}