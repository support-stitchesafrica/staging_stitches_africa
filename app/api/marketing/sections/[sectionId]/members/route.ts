/**
 * Team Section Members API Endpoints
 * POST /api/marketing/sections/[sectionId]/members - Add member to section
 * DELETE /api/marketing/sections/[sectionId]/members/[memberId] - Remove member from section
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { TeamAssignmentService } from '@/lib/marketing/team-assignment-service';
import { UserService } from '@/lib/marketing/user-service';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';

export async function POST(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    // Authenticate and authorize request
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned a NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { sectionId } = params;

    // Only team leads and super admins can manage section members
    if (!['team_lead', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only Team Leads and Super Admins can manage section members' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { memberId } = body;

    // Validate required fields
    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Get section
    const sectionDocRef = doc(db, 'marketing_sections', sectionId);
    const sectionDoc = await getDoc(sectionDocRef);
    
    if (!sectionDoc.exists()) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    const sectionData = sectionDoc.data();

    // Check if user has access to this section's team
    if (user.role === 'team_lead' && sectionData.teamId !== user.teamId) {
      return NextResponse.json(
        { error: 'You do not have access to this section' },
        { status: 403 }
      );
    }

    // Get member to verify they exist and are in the same team
    const member = await UserService.getUserById(memberId);
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Verify member is in the same team
    if (sectionData.teamId !== member.teamId) {
      return NextResponse.json(
        { error: 'Member is not in the same team as this section' },
        { status: 400 }
      );
    }

    // Add member to section
    await updateDoc(sectionDocRef, {
      memberIds: arrayUnion(memberId),
      updatedAt: Timestamp.now()
    });

    // Update section data with new member
    const updatedSection = {
      id: sectionDoc.id,
      ...sectionData,
      memberIds: [...(sectionData.memberIds || []), memberId],
      updatedAt: Timestamp.now()
    };

    return NextResponse.json({
      success: true,
      data: updatedSection
    });

  } catch (error) {
    console.error('Error adding member to section:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sectionId: string; memberId: string } }
) {
  try {
    // Authenticate and authorize request
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned a NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { sectionId, memberId } = params;

    // Only team leads and super admins can manage section members
    if (!['team_lead', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only Team Leads and Super Admins can manage section members' },
        { status: 403 }
      );
    }

    // Get section
    const sectionDocRef = doc(db, 'marketing_sections', sectionId);
    const sectionDoc = await getDoc(sectionDocRef);
    
    if (!sectionDoc.exists()) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    const sectionData = sectionDoc.data();

    // Check if user has access to this section's team
    if (user.role === 'team_lead' && sectionData.teamId !== user.teamId) {
      return NextResponse.json(
        { error: 'You do not have access to this section' },
        { status: 403 }
      );
    }

    // Remove member from section
    await updateDoc(sectionDocRef, {
      memberIds: arrayRemove(memberId),
      updatedAt: Timestamp.now()
    });

    // Update section data without removed member
    const updatedMemberIds = (sectionData.memberIds || []).filter((id: string) => id !== memberId);
    const updatedSection = {
      id: sectionDoc.id,
      ...sectionData,
      memberIds: updatedMemberIds,
      updatedAt: Timestamp.now()
    };

    return NextResponse.json({
      success: true,
      data: updatedSection
    });

  } catch (error) {
    console.error('Error removing member from section:', error);
    
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