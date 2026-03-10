/**
 * Team Sections API Endpoints
 * GET /api/marketing/sections - Get all sections for the current team
 * POST /api/marketing/sections - Create a new section
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { TeamAssignmentService } from '@/lib/marketing/team-assignment-service';
import { adminDb } from '@/lib/firebase-admin';

// Section Types
interface TeamSection {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  memberIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

interface CreateSectionData {
  name: string;
  description?: string;
  teamId: string;
  createdBy: string;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize request
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned a NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Only team leads and super admins can manage sections
    if (!['team_lead', 'super_admin', 'bdm'].includes(user.role)) {
      return NextResponse.json(
        { 
          error: 'Only Team Leads, BDMs and Super Admins can manage sections',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: ['team_lead', 'bdm', 'super_admin'],
          currentUserRole: user.role
        },
        { status: 403 }
      );
    }

    // Get team ID from query params or user's team
    const { searchParams } = new URL(request.url);
    let teamId = searchParams.get('teamId') || user.teamId;
    
    // If no team ID and user is super admin or BDM, get all sections
    if (!teamId && (user.role === 'super_admin' || user.role === 'bdm')) {
      // Check if adminDb is properly initialized
      if (!adminDb) {
        console.error('Firebase Admin DB is not initialized');
        return NextResponse.json(
          { 
            error: 'Service temporarily unavailable',
            code: 'SERVICE_UNAVAILABLE'
          },
          { status: 503 }
        );
      }
      
      const snapshot = await adminDb.collection('marketing_sections')
        .orderBy('createdAt', 'desc')
        .get();
      
      const sections = await Promise.all(
        snapshot.docs.map(async (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
          const sectionData = {
            id: doc.id,
            ...(doc.data() as any)
          };
          
          // Get team name using server-side operations
          if (sectionData.teamId) {
            try {
              const team = await TeamAssignmentService.getTeamByIdServerSide(sectionData.teamId);
              (sectionData as any).teamName = team?.name || 'Unknown Team';
            } catch (error) {
              (sectionData as any).teamName = 'Error';
            }
          }

          return sectionData;
        })
      );
      
      return NextResponse.json({
        success: true,
        data: sections
      });
    }
    
    // If no team ID, return error
    if (!teamId) {
      return NextResponse.json(
        { 
          error: 'Team ID is required',
          code: 'MISSING_TEAM_ID'
        },
        { status: 400 }
      );
    }
    
    // Check if user has access to this team
    if ((user.role === 'team_lead' || user.role === 'bdm') && user.teamId !== teamId) {
      return NextResponse.json(
        { 
          error: 'You do not have access to this team',
          code: 'TEAM_ACCESS_DENIED',
          requiredTeamId: teamId,
          userTeamId: user.teamId
        },
        { status: 403 }
      );
    }

    // Get sections for the team using server-side operations
    // Check if adminDb is properly initialized
    if (!adminDb) {
      console.error('Firebase Admin DB is not initialized');
      return NextResponse.json(
        { 
          error: 'Service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }
    
    const snapshot = await adminDb.collection('marketing_sections')
      .where('teamId', '==', teamId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const sections = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...(doc.data() as any)
    }));

    return NextResponse.json({
      success: true,
      data: sections
    });

  } catch (error) {
    console.error('Error fetching sections:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: error.message,
          code: 'BAD_REQUEST'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize request
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned a NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Only team leads, BDMs and super admins can create sections
    if (!['team_lead', 'super_admin', 'bdm'].includes(user.role)) {
      return NextResponse.json(
        { 
          error: 'Only Team Leads, BDMs and Super Admins can create sections',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: ['team_lead', 'bdm', 'super_admin'],
          currentUserRole: user.role
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, teamId } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { 
          error: 'Section name is required',
          code: 'MISSING_NAME'
        },
        { status: 400 }
      );
    }

    // Determine team ID
    let targetTeamId = teamId;
    
    // If no team ID provided, use user's team
    if (!targetTeamId) {
      targetTeamId = user.teamId;
    }
    
    // If still no team ID and user is not super admin or BDM, return error
    if (!targetTeamId && user.role !== 'super_admin' && user.role !== 'bdm') {
      return NextResponse.json(
        { 
          error: 'Team ID is required',
          code: 'MISSING_TEAM_ID'
        },
        { status: 400 }
      );
    }
    
    // If user is team lead, they can only create sections for their own team
    if (user.role === 'team_lead' && targetTeamId !== user.teamId) {
      return NextResponse.json(
        { 
          error: 'You can only create sections for your own team',
          code: 'TEAM_ACCESS_DENIED',
          requiredTeamId: targetTeamId,
          userTeamId: user.teamId
        },
        { status: 403 }
      );
    }

    // Create section
    const now = Timestamp.now();
    const sectionData: CreateSectionData = {
      name,
      description,
      teamId: targetTeamId,
      createdBy: user.uid
    };

    const docRef = await addDoc(collection(db, 'marketing_sections'), {
      ...sectionData,
      memberIds: [],
      createdAt: now,
      updatedAt: now
    });

    const newSection: TeamSection = {
      id: docRef.id,
      ...sectionData,
      memberIds: [],
      createdAt: now,
      updatedAt: now
    };

    return NextResponse.json({
      success: true,
      data: newSection
    });

  } catch (error) {
    console.error('Error creating section:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: error.message,
          code: 'BAD_REQUEST'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}