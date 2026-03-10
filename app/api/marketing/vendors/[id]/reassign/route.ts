/**
 * Vendor Reassignment API Route
 * Handles reassignment of a specific vendor to a different user
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamAssignmentService, TeamManagementUtils, type VendorTransferData } from '@/lib/marketing/team-assignment-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { NotificationService } from '@/lib/marketing/notification-service';
import { getTailorById } from '@/admin-services/useTailors';

export async function PUT(
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
    const { fromUserId, toUserId, reason } = await request.json();

    // Validate required fields
    if (!fromUserId || !toUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: fromUserId, toUserId' 
        },
        { status: 400 }
      );
    }

    // Validate that from and to users are different
    if (fromUserId === toUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot reassign vendor to the same user' 
        },
        { status: 400 }
      );
    }

    // Validate permissions
    if (!TeamManagementUtils.canTransferVendors(currentUser.role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions to reassign vendors' 
        },
        { status: 403 }
      );
    }

    // Create transfer data
    const transferData: VendorTransferData = {
      fromUserId,
      toUserId,
      transferredByUserId: currentUser.uid,
      reason
    };

    // Transfer vendor
    const newAssignment = await TeamAssignmentService.transferVendor(vendorId, transferData);

    // Send notifications
    try {
      // Get vendor name for the notification
      let vendorName = 'Unknown Vendor';
      try {
        const vendor = await getTailorById(vendorId);
        vendorName = vendor.brand_name || vendor.brandName || vendorId;
      } catch (vendorError) {
        console.error('Error getting vendor name:', vendorError);
      }

      // Notify the new assignee
      await NotificationService.sendVendorReassignmentNotification({
        assignmentId: newAssignment.id,
        vendorId,
        vendorName,
        fromUserId,
        toUserId,
        reassignedByUserId: currentUser.uid,
        reassignedByName: currentUser.name || currentUser.email || 'Unknown User',
        reason
      });
    } catch (notificationError) {
      console.error('Failed to send reassignment notification:', notificationError);
      // Don't fail the reassignment if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor reassigned successfully',
      data: newAssignment
    });

  } catch (error) {
    console.error('Error reassigning vendor:', error);
    
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
        error: 'Failed to reassign vendor' 
      },
      { status: 500 }
    );
  }
}