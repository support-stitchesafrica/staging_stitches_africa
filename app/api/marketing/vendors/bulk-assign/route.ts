/**
 * Bulk Vendor Assignment API Route
 * Handles bulk assignment of multiple vendors to users
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamAssignmentService, TeamManagementUtils, type CreateVendorAssignmentData } from '@/lib/marketing/team-assignment-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { NotificationService } from '@/lib/marketing/notification-service';
import { getTailorById } from '@/admin-services/useTailors';

interface BulkAssignmentRequest {
  assignments: {
    vendorId: string;
    assignedToUserId: string;
    teamId?: string;
    notes?: string;
  }[];
}

interface BulkAssignmentResult {
  successful: {
    vendorId: string;
    assignmentId: string;
    assignedToUserId: string;
  }[];
  failed: {
    vendorId: string;
    assignedToUserId: string;
    error: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get current user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult.user;

    // Parse request body
    const { assignments }: BulkAssignmentRequest = await request.json();

    // Validate request
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing or invalid assignments array' 
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

    // Validate each assignment has required fields
    for (const assignment of assignments) {
      if (!assignment.vendorId || !assignment.assignedToUserId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Each assignment must have vendorId and assignedToUserId' 
          },
          { status: 400 }
        );
      }
    }

    const result: BulkAssignmentResult = {
      successful: [],
      failed: []
    };

    // Process each assignment
    for (const assignmentRequest of assignments) {
      try {
        const assignmentData: CreateVendorAssignmentData = {
          vendorId: assignmentRequest.vendorId,
          assignedToUserId: assignmentRequest.assignedToUserId,
          assignedByUserId: currentUser.uid,
          teamId: assignmentRequest.teamId,
          notes: assignmentRequest.notes
        };

        const assignment = await TeamAssignmentService.assignVendor(assignmentData);

        result.successful.push({
          vendorId: assignmentRequest.vendorId,
          assignmentId: assignment.id,
          assignedToUserId: assignmentRequest.assignedToUserId
        });

        // Send notification (don't fail bulk operation if notification fails)
        try {
          // Get vendor name for the notification
          let vendorName = 'Unknown Vendor';
          try {
            const vendor = await getTailorById(assignmentRequest.vendorId);
            vendorName = vendor.brand_name || vendor.brandName || assignmentRequest.vendorId;
          } catch (vendorError) {
            console.error(`Error getting vendor name for ${assignmentRequest.vendorId}:`, vendorError);
          }

          await NotificationService.sendVendorAssignmentNotification({
            assignmentId: assignment.id,
            vendorId: assignmentRequest.vendorId,
            vendorName,
            assignedToUserId: assignmentRequest.assignedToUserId,
            assignedByUserId: currentUser.uid,
            assignedByName: currentUser.name || currentUser.email
          });
        } catch (notificationError) {
          console.error(`Failed to send notification for vendor ${assignmentRequest.vendorId}:`, notificationError);
        }

      } catch (error) {
        console.error(`Failed to assign vendor ${assignmentRequest.vendorId}:`, error);
        
        result.failed.push({
          vendorId: assignmentRequest.vendorId,
          assignedToUserId: assignmentRequest.assignedToUserId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Send bulk assignment summary notification
    if (result.successful.length > 0) {
      try {
        await NotificationService.sendBulkAssignmentSummaryNotification({
          assignedByUserId: currentUser.uid,
          assignedByName: currentUser.name || currentUser.email,
          successfulCount: result.successful.length,
          failedCount: result.failed.length,
          totalCount: assignments.length
        });
      } catch (notificationError) {
        console.error('Failed to send bulk assignment summary notification:', notificationError);
      }
    }

    const statusCode = result.failed.length === 0 ? 200 : 207; // 207 Multi-Status for partial success

    return NextResponse.json({
      success: result.failed.length === 0,
      message: `Bulk assignment completed. ${result.successful.length} successful, ${result.failed.length} failed.`,
      data: result
    }, { status: statusCode });

  } catch (error) {
    console.error('Error in bulk vendor assignment:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process bulk vendor assignment' 
      },
      { status: 500 }
    );
  }
}