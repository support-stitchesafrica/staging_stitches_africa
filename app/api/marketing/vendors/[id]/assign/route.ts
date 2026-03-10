/**
 * Individual Vendor Assignment API Route
 * Handles assignment of a specific vendor to a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamAssignmentService, TeamManagementUtils, type CreateVendorAssignmentData } from '@/lib/marketing/team-assignment-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { NotificationService } from '@/lib/marketing/notification-service';
import { getTailorById } from '@/admin-services/useTailors';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and get current user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user: currentUser } = authResult;
    const vendorId = params.id;

    // Parse request body
    const { assignedToUserId, teamId, notes } = await request.json();

    // Validate required fields
    if (!assignedToUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: assignedToUserId' 
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

    // Create assignment data
    const assignmentData: CreateVendorAssignmentData = {
      vendorId,
      assignedToUserId,
      assignedByUserId: currentUser.uid,
      teamId,
      notes
    };

    // Assign vendor
    const assignment = await TeamAssignmentService.assignVendor(assignmentData);

    // Get vendor name for notification
    let vendorName = 'Vendor';
    try {
      const vendor = await getTailorById(vendorId);
      vendorName = vendor.brand_name || vendor.brandName || 'Vendor';
    } catch (vendorError) {
      console.error('Failed to fetch vendor name:', vendorError);
    }

    // Send notification to assigned user
    try {
      await NotificationService.sendVendorAssignmentNotification({
        assignmentId: assignment.id,
        vendorId,
        vendorName,
        assignedToUserId,
        assignedByUserId: currentUser.uid,
        assignedByName: currentUser.name || currentUser.email
      });
    } catch (notificationError) {
      console.error('Failed to send assignment notification:', notificationError);
      // Don't fail the assignment if notification fails
    }

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
      
      if (error.message.includes('vendor not found')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Vendor not found' 
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