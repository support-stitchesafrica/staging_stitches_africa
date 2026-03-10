/**
 * Bulk Vendor Reassignment API Route
 * Handles bulk reassignment of multiple vendors between users
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamAssignmentService, TeamManagementUtils, type VendorTransferData } from '@/lib/marketing/team-assignment-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { NotificationService } from '@/lib/marketing/notification-service';
import { getTailorById } from '@/admin-services/useTailors';

interface BulkReassignmentRequest {
  reassignments: {
    vendorId: string;
    fromUserId: string;
    toUserId: string;
    reason?: string;
  }[];
}

interface BulkReassignmentResult {
  successful: {
    vendorId: string;
    assignmentId: string;
    fromUserId: string;
    toUserId: string;
  }[];
  failed: {
    vendorId: string;
    fromUserId: string;
    toUserId: string;
    error: string;
  }[];
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate and get current user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult.user;

    // Parse request body
    const { reassignments }: BulkReassignmentRequest = await request.json();

    // Validate request
    if (!reassignments || !Array.isArray(reassignments) || reassignments.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing or invalid reassignments array' 
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

    // Validate each reassignment has required fields
    for (const reassignment of reassignments) {
      if (!reassignment.vendorId || !reassignment.fromUserId || !reassignment.toUserId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Each reassignment must have vendorId, fromUserId, and toUserId' 
          },
          { status: 400 }
        );
      }

      if (reassignment.fromUserId === reassignment.toUserId) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Cannot reassign vendor ${reassignment.vendorId} to the same user` 
          },
          { status: 400 }
        );
      }
    }

    const result: BulkReassignmentResult = {
      successful: [],
      failed: []
    };

    // Process each reassignment
    for (const reassignmentRequest of reassignments) {
      try {
        const transferData: VendorTransferData = {
          fromUserId: reassignmentRequest.fromUserId,
          toUserId: reassignmentRequest.toUserId,
          transferredByUserId: currentUser.uid,
          reason: reassignmentRequest.reason
        };

        const newAssignment = await TeamAssignmentService.transferVendor(
          reassignmentRequest.vendorId, 
          transferData
        );

        result.successful.push({
          vendorId: reassignmentRequest.vendorId,
          assignmentId: newAssignment.id,
          fromUserId: reassignmentRequest.fromUserId,
          toUserId: reassignmentRequest.toUserId
        });

        // Send notification (don't fail bulk operation if notification fails)
        try {
          // Get vendor name for the notification
          let vendorName = 'Unknown Vendor';
          try {
            const vendor = await getTailorById(reassignmentRequest.vendorId);
            vendorName = vendor.brand_name || vendor.brandName || reassignmentRequest.vendorId;
          } catch (vendorError) {
            console.error(`Error getting vendor name for ${reassignmentRequest.vendorId}:`, vendorError);
          }

          await NotificationService.sendVendorReassignmentNotification({
            assignmentId: newAssignment.id,
            vendorId: reassignmentRequest.vendorId,
            vendorName,
            fromUserId: reassignmentRequest.fromUserId,
            toUserId: reassignmentRequest.toUserId,
            reassignedByUserId: currentUser.uid,
            reassignedByName: currentUser.name || currentUser.email,
            reason: reassignmentRequest.reason
          });
        } catch (notificationError) {
          console.error(`Failed to send notification for vendor ${reassignmentRequest.vendorId}:`, notificationError);
        }

      } catch (error) {
        console.error(`Failed to reassign vendor ${reassignmentRequest.vendorId}:`, error);
        
        result.failed.push({
          vendorId: reassignmentRequest.vendorId,
          fromUserId: reassignmentRequest.fromUserId,
          toUserId: reassignmentRequest.toUserId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Send bulk reassignment summary notification
    if (result.successful.length > 0) {
      try {
        await NotificationService.sendBulkReassignmentSummaryNotification({
          reassignedByUserId: currentUser.uid,
          reassignedByName: currentUser.name || currentUser.email,
          successfulCount: result.successful.length,
          failedCount: result.failed.length,
          totalCount: reassignments.length
        });
      } catch (notificationError) {
        console.error('Failed to send bulk reassignment summary notification:', notificationError);
      }
    }

    const statusCode = result.failed.length === 0 ? 200 : 207; // 207 Multi-Status for partial success

    return NextResponse.json({
      success: result.failed.length === 0,
      message: `Bulk reassignment completed. ${result.successful.length} successful, ${result.failed.length} failed.`,
      data: result
    }, { status: statusCode });

  } catch (error) {
    console.error('Error in bulk vendor reassignment:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process bulk vendor reassignment' 
      },
      { status: 500 }
    );
  }
}