import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { vvipPermissionService } from '@/lib/marketing/vvip-permission-service';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request using Firebase Auth
    const authResult = await authenticateRequest(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return authentication error
    }

    const { user } = authResult;

    // Check if user can create VVIP
    const canCreate = await vvipPermissionService.canCreateVvip(user.uid);
    
    if (!canCreate) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_PERMISSIONS', message: 'You do not have permission to create VVIP shoppers' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'INVALID_PARAMETERS', message: 'userId is required' },
        { status: 400 }
      );
    }

    try {
      // Check if user exists
      const userDoc = await adminDb.collection("staging_users").doc(userId).get();
      
      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'USER_NOT_FOUND', message: 'User not found' },
          { status: 404 }
        );
      }

      const userData = userDoc.data();

      // Check if user is already VVIP
      const existingVvipDoc = await adminDb
        .collection("staging_vvip_shoppers")
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!existingVvipDoc.empty) {
        return NextResponse.json(
          { error: 'ALREADY_VVIP', message: 'User is already a VVIP shopper' },
          { status: 400 }
        );
      }

      // Create VVIP shopper record
      const vvipData = {
        userId,
        email: userData?.email || null,
        name: userData?.name || userData?.displayName || 'Unknown',
        status: 'active',
        createdAt: new Date(),
        createdBy: user.uid,
        createdByEmail: user.email,
        updatedAt: new Date(),
        metadata: {
          source: 'marketing_dashboard',
          createdByRole: user.role,
        }
      };

      const vvipDocRef = await adminDb.collection("staging_vvip_shoppers").add(vvipData);

      // Log the action for audit purposes
      await adminDb.collection("staging_vvip_audit_log").add({
        action: 'create_vvip',
        userId,
        vvipId: vvipDocRef.id,
        performedBy: user.uid,
        performedByEmail: user.email,
        performedByRole: user.role,
        timestamp: new Date(),
        details: {
          userEmail: userData?.email,
          userName: userData?.name || userData?.displayName,
        }
      });

      return NextResponse.json({
        success: true,
        message: 'VVIP shopper created successfully',
        data: {
          vvipId: vvipDocRef.id,
          userId,
          status: 'active'
        }
      });

    } catch (dbError) {
      console.error('Database error creating VVIP:', dbError);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Failed to create VVIP shopper' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('VVIP Create API Error:', error);
    return NextResponse.json(
      { error: 'CREATE_ERROR', message: 'Failed to create VVIP shopper' },
      { status: 500 }
    );
  }
}