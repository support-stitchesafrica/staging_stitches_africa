/**
 * Marketing Dashboard - Vendor Assignments API
 * Handles vendor assignment operations for team management
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamAssignmentService, type CreateVendorAssignmentData, type VendorAssignment } from '@/lib/marketing/team-assignment-service';
import { UserService } from '@/lib/marketing/user-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

/**
 * GET /api/marketing/vendors/assignments
 * Get vendor assignments with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const teamId = searchParams.get('teamId');

    let assignments: VendorAssignment[];

    if (userId) {
      // Get assignments for specific user
      if (user.role !== 'super_admin' && user.uid !== userId) {
        // Team leads can only view their team members' assignments
        if (user.role === 'team_lead') {
          const targetUser = await UserService.getUserById(userId);
          if (!targetUser || targetUser.teamId !== user.teamId) {
            return NextResponse.json(
              { success: false, error: 'Access denied' },
              { status: 403 }
            );
          }
        } else {
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          );
        }
      }
      
      assignments = await TeamAssignmentService.getUserVendorAssignments(userId);
    } else if (teamId) {
      // Get assignments for specific team using server-side operations
      if (user.role !== 'super_admin' && user.teamId !== teamId) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
      
      assignments = await TeamAssignmentService.getTeamVendorAssignmentsServerSide(teamId);
    } else {
      // Get all assignments (role-based filtering) using server-side operations
      if (user.role === 'super_admin') {
        assignments = await TeamAssignmentService.getAllVendorAssignmentsServerSide();
      } else if (user.role === 'team_lead' && user.teamId) {
        assignments = await TeamAssignmentService.getTeamVendorAssignmentsServerSide(user.teamId);
      } else if (user.role === 'bdm') {
        // BDM can see all assignments
        assignments = await TeamAssignmentService.getAllVendorAssignmentsServerSide();
      } else if (user.role === 'team_member') {
        assignments = await TeamAssignmentService.getUserVendorAssignments(user.uid);
      } else {
        assignments = [];
      }
    }

    return NextResponse.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching vendor assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendor assignments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/vendors/assignments
 * Create new vendor assignment
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Check permissions
    if (!['super_admin', 'team_lead', 'bdm'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vendorId, assignedToUserId, teamId, notes } = body;

    if (!vendorId || !assignedToUserId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID and assigned user ID are required' },
        { status: 400 }
      );
    }

    // Validate assignment permissions based on role
    if (user.role === 'team_lead') {
      // Team leads can only assign to their team members
      const targetUser = await UserService.getUserById(assignedToUserId);
      if (!targetUser || targetUser.teamId !== user.teamId) {
        return NextResponse.json(
          { success: false, error: 'Can only assign vendors to your team members' },
          { status: 403 }
        );
      }
    }

    const assignmentData: CreateVendorAssignmentData = {
      vendorId,
      assignedToUserId,
      assignedByUserId: user.uid,
      teamId: teamId || user.teamId,
      notes
    };

    const assignment = await TeamAssignmentService.assignVendor(assignmentData);

    return NextResponse.json({
      success: true,
      data: assignment
    });

  } catch (error) {
    console.error('Error creating vendor assignment:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/marketing/vendors/assignments
 * Update vendor assignment (reassignment)
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Check permissions
    if (!['super_admin', 'team_lead'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { assignmentId, assignedToUserId, notes } = body;

    if (!assignmentId || !assignedToUserId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID and new assigned user ID are required' },
        { status: 400 }
      );
    }

    // Get current assignment to validate permissions and get vendor info using server-side operations
    const allAssignments = await TeamAssignmentService.getAllVendorAssignmentsServerSide();
    const currentAssignment = allAssignments.find(a => a.id === assignmentId);
    
    if (!currentAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Validate reassignment permissions based on role
    if (user.role === 'team_lead') {
      // Team leads can only reassign within their team
      const currentUser = await UserService.getUserById(currentAssignment.assignedToUserId);
      const targetUser = await UserService.getUserById(assignedToUserId);
      
      if (!currentUser || !targetUser || 
          currentUser.teamId !== user.teamId || 
          targetUser.teamId !== user.teamId) {
        return NextResponse.json(
          { success: false, error: 'Can only reassign vendors within your team' },
          { status: 403 }
        );
      }
    } else if (user.role === 'bdm') {
      // BDM can reassign vendors across teams
      // No additional validation needed
    }

    // Perform the transfer
    const newAssignment = await TeamAssignmentService.transferVendor(
      currentAssignment.vendorId,
      {
        fromUserId: currentAssignment.assignedToUserId,
        toUserId: assignedToUserId,
        transferredByUserId: user.uid,
        reason: notes || `Reassigned by ${user.role}`
      }
    );

    return NextResponse.json({
      success: true,
      data: newAssignment
    });

  } catch (error) {
    console.error('Error updating vendor assignment:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update assignment' },
      { status: 500 }
    );
  }
}