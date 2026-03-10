/**
 * Vendor Transfer API Route
 * Handles vendor transfer between users
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamAssignmentService, TeamManagementUtils, type VendorTransferData } from '@/lib/marketing/team-assignment-service';

export async function POST(request: NextRequest) {
  try {
    const { vendorId, ...transferData }: { vendorId: string } & VendorTransferData = await request.json();

    // Validate required fields
    if (!vendorId || !transferData.fromUserId || !transferData.toUserId || !transferData.transferredByUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: vendorId, fromUserId, toUserId, transferredByUserId' 
        },
        { status: 400 }
      );
    }

    // Validate that from and to users are different
    if (transferData.fromUserId === transferData.toUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot transfer vendor to the same user' 
        },
        { status: 400 }
      );
    }

    // TODO: Get current user role from authentication context
    // For now, assume Super Admin permissions
    const currentUserRole = 'super_admin';

    // Validate permissions
    if (!TeamManagementUtils.canTransferVendors(currentUserRole)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions to transfer vendors' 
        },
        { status: 403 }
      );
    }

    // Transfer vendor
    const newAssignment = await TeamAssignmentService.transferVendor(vendorId, transferData);

    return NextResponse.json({
      success: true,
      message: 'Vendor transferred successfully',
      data: newAssignment
    });

  } catch (error) {
    console.error('Error transferring vendor:', error);
    
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
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to transfer vendor' 
      },
      { status: 500 }
    );
  }
}