/**
 * Collections Team Invitation Revoke API
 * Revokes a pending invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    let decodedToken;
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const adminUid = decodedToken.uid;

    // Verify the user is a Super Admin
    const adminUserDoc = await adminDb.collection("staging_collectionsUsers").doc(adminUid).get();
    
    if (!adminUserDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: User not found' },
        { status: 403 }
      );
    }

    const adminUser = adminUserDoc.data();
    if (!adminUser || adminUser.role !== 'superadmin' || !adminUser.isCollectionsUser) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Super Admins can revoke invitations' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Get the invitation
    const invitationDoc = await adminDb.collection("staging_collectionsInvitations").doc(invitationId).get();

    if (!invitationDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const invitation = invitationDoc.data();

    if (!invitation || invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Only pending invitations can be revoked' },
        { status: 400 }
      );
    }

    // Revoke the invitation
    await adminDb.collection("staging_collectionsInvitations").doc(invitationId).update({
      status: 'revoked'
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to revoke invitation';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
