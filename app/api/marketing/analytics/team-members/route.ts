/**
 * Team Member Analytics API Endpoint
 * GET /api/marketing/analytics/team-members - Get team member performance analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/marketing/analytics-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { TeamAssignmentService } from '@/lib/marketing/team-assignment-service';
import { UserService } from '@/lib/marketing/user-service';
import { UserServiceServer } from '@/lib/marketing/user-service-server';

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize request
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned a NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId') || undefined;
    const timeRange = searchParams.get('timeRange') || 'month';

    // Role-based access control using server-side operations
    let filteredMembers;
    
    if (user.role === 'super_admin') {
      // Super admin can see all team members using server-side operations
      const allUsers = await UserServiceServer.getUsersServerSide();
      filteredMembers = allUsers.filter(u => 
        ['team_member', 'team_lead', 'bdm'].includes(u.role)
      );
    } else if (user.role === 'team_lead' && user.teamId) {
      // Team lead can only see members of their own team using server-side operations
      const requestedTeamId = teamId || user.teamId;
      
      // Ensure team lead can only access their own team
      if (requestedTeamId !== user.teamId) {
        return NextResponse.json(
          { error: 'You can only access analytics for your own team' },
          { status: 403 }
        );
      }
      
      filteredMembers = await TeamAssignmentService.getTeamMembersServerSide(requestedTeamId);
    } else if (user.role === 'bdm') {
      // BDM can see team members they work with using server-side operations
      const allUsers = await UserServiceServer.getUsersServerSide();
      filteredMembers = allUsers.filter(u => 
        ['team_member', 'team_lead'].includes(u.role)
      );
    } else {
      // Regular team members can only see their own data
      const self = await UserService.getUserById(user.uid);
      filteredMembers = self ? [self] : [];
    }

    // Calculate performance metrics for each team member
    const teamMemberPerformance = await Promise.all(
      filteredMembers.map(async (member) => {
        try {
          // Get vendor assignments for this member using server-side operations
          const assignments = await TeamAssignmentService.getUserVendorAssignments(member.id);
          const activeAssignments = assignments.filter(a => a.status === 'active');
          
          // Calculate performance metrics
          let totalRevenue = 0;
          let totalVendors = activeAssignments.length;
          let performanceScore = 0;
          let lastActive: Date | null = null;
          
          // Calculate revenue from assigned vendors
          for (const assignment of activeAssignments) {
            try {
              const vendorPerformance = await AnalyticsService.calculateVendorPerformance(assignment.vendorId);
              totalRevenue += vendorPerformance.totalRevenue;
              performanceScore += vendorPerformance.performanceScore;
              
              // Track last activity
              if (vendorPerformance.lastActivityDate && 
                  (!lastActive || vendorPerformance.lastActivityDate > lastActive)) {
                lastActive = vendorPerformance.lastActivityDate;
              }
            } catch (error) {
              console.error(`Error calculating performance for vendor ${assignment.vendorId}:`, error);
            }
          }
          
          // Average performance score
          const avgPerformanceScore = activeAssignments.length > 0 
            ? performanceScore / activeAssignments.length 
            : 0;
          
          // Get team info if available using server-side operations
          let teamName = 'Unassigned';
          try {
            const team = await TeamAssignmentService.getTeamByIdServerSide(member.teamId || '');
            teamName = team?.name || 'Unassigned';
          } catch (error) {
            console.error(`Error getting team for member ${member.id}:`, error);
          }
          
          return {
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            teamName,
            assignedVendors: totalVendors,
            totalRevenue,
            performanceScore: avgPerformanceScore,
            lastActive
          };
        } catch (error) {
          console.error(`Error processing member ${member.id}:`, error);
          return {
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            teamName: 'Error',
            assignedVendors: 0,
            totalRevenue: 0,
            performanceScore: 0,
            lastActive: null,
            error: 'Failed to calculate performance'
          };
        }
      })
    );

    // Sort by performance score descending
    const sortedPerformance = teamMemberPerformance.sort((a, b) => 
      (b.performanceScore || 0) - (a.performanceScore || 0)
    );

    return NextResponse.json({
      success: true,
      data: sortedPerformance
    });

  } catch (error) {
    console.error('Error fetching team member analytics:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
