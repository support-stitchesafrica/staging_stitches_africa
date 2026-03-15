/**
 * Atlas Team Invitation Resend API
 * Resends an invitation email to a pending invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';
import { atlasInvitationTemplate } from '@/lib/emailTemplates/atlasInvitationTemplate';
import { Timestamp } from 'firebase-admin/firestore';
import { sign } from 'jsonwebtoken';

/**
 * Generate a unique ID for JWT token
 */
function generateUniqueId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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
    const adminUserDoc = await adminDb.collection("staging_atlasUsers").doc(adminUid).get();
    
    if (!adminUserDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: User not found' },
        { status: 403 }
      );
    }

    const adminUser = adminUserDoc.data();
    if (!adminUser || adminUser.role !== 'superadmin' || !adminUser.isAtlasUser) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Super Admins can resend invitations' },
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
    const invitationDoc = await adminDb.collection("staging_atlasInvitations").doc(invitationId).get();

    if (!invitationDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const invitation = invitationDoc.data();

    if (!invitation || invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Only pending invitations can be resent' },
        { status: 400 }
      );
    }

    // Generate new invitation ID and expiration
    const newInviteId = adminDb.collection("staging_atlasInvitations").doc().id;
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(
      now.toMillis() + (7 * 24 * 60 * 60 * 1000) // 7 days
    );

    // Generate new JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'atlas-dashboard-secret';
    const invitationToken = sign(
      {
        inviteId: newInviteId,
        email: invitation.email,
        role: invitation.role,
        system: 'atlas',
        exp: Math.floor(expiresAt.toMillis() / 1000),
        iat: Math.floor(Date.now() / 1000),
        jti: generateUniqueId()
      },
      JWT_SECRET,
      { algorithm: 'HS256' }
    );

    // Create new invitation record
    const newInvitation = {
      id: newInviteId,
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      invitedByUserId: adminUid,
      status: 'pending',
      token: invitationToken,
      expiresAt,
      createdAt: now
    };

    // Save new invitation to Firestore
    await adminDb.collection("staging_atlasInvitations").doc(newInviteId).set(newInvitation);

    // Revoke the old invitation
    await adminDb.collection("staging_atlasInvitations").doc(invitationId).update({
      status: 'revoked'
    });

    // Generate invitation link
    // Use environment variable, or default based on NODE_ENV
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://staging-stitches-africa.vercel.app');
    const invitationLink = `${baseUrl}/atlas/invite/${invitationToken}`;

    // Send invitation email
    try {
      const inviterName = adminUser.fullName || 'A team member';

      // Generate email HTML
      const emailHtml = atlasInvitationTemplate({
        inviteeName: invitation.name,
        inviterName,
        role: invitation.role,
        invitationLink,
        expiryDays: 7,
      });

      // Send email via the staging API
      const emailResponse = await fetch('https://stitchesafricamobile-backend.onrender.com/api/Email/Send', {
        method: 'POST',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: emailHtml,
          subject: `You're invited to join Stitches Africa Atlas`,
          emails: [{
            emailAddress: invitation.email,
            name: invitation.name,
          }],
          from: 'noreply@stitchesafrica.com',
          replyTo: 'support@stitchesafrica.com',
        }),
      });

      const emailResult = await emailResponse.text();
      
      if (!emailResponse.ok) {
        console.error('Failed to send invitation email:', emailResult);
      } else {
        console.log('Invitation email resent successfully to:', invitation.email);
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
      invitation: newInvitation,
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to resend invitation';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
