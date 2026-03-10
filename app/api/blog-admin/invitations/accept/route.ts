import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || "blog-admin-secret-key"

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    const idToken = authHeader.substring(7);

    // Get body (just token needed)
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Invitation token is required" },
        { status: 400 }
      )
    }

    // Verify Firebase ID token
    let decodedIdToken;
    try {
      decodedIdToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('ID token verification failed:', error);
      return NextResponse.json(
        { success: false, message: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Verify invitation token
    let decodedInviteToken: any
    try {
      decodedInviteToken = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired invitation token" },
        { status: 400 }
      )
    }
    
    // Find invitation by email and token
    const invitationsRef = adminDb.collection("blog_invitations");
    const snapshot = await invitationsRef
      .where("email", "==", decodedInviteToken.email)
      .where("token", "==", token)
      .where("status", "==", "pending")
      .get();
    
    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, message: "Invitation not found or already used" },
        { status: 404 }
      )
    }

    const invitationDoc = snapshot.docs[0]
    const invitationData = invitationDoc.data()
    
    // 1. Verify Email Match
    if (decodedIdToken.email !== invitationData.email) {
       return NextResponse.json(
        { success: false, message: "Email mismatch. You must sign in with the email address that was invited." },
        { status: 403 }
      )
    }

    // 2. Check Expiry
    const now = new Date()
    const expiresAt = invitationData.expiresAt.toDate()
    
    if (now > expiresAt) {
      await invitationDoc.ref.update({ status: 'expired' })
      return NextResponse.json(
        { success: false, message: "Invitation has expired" },
        { status: 400 }
      )
    }

    // 3. Create or Update Blog User
    // We use the UID from the ID Token, ensuring we link to the actual authenticated user
    const blogUserRef = adminDb.collection("blog_users").doc(decodedIdToken.uid);
    const existingUserDoc = await blogUserRef.get();

    const userData = {
      uid: decodedIdToken.uid,
      email: invitationData.email,
      firstName: invitationData.firstName,
      lastName: invitationData.lastName,
      username: invitationData.email.split('@')[0],
      role: invitationData.role,
      isActive: true,
      updatedAt: Timestamp.now(),
      // Only set createdAt if new
      ...(existingUserDoc.exists ? {} : { createdAt: Timestamp.now() }) 
    };

    await blogUserRef.set(userData, { merge: true });

    // 4. Mark Invitation as Accepted
    await invitationDoc.ref.update({
      status: 'accepted',
      acceptedAt: Timestamp.now(),
      acceptedByUid: decodedIdToken.uid
    });

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
      user: userData
    })

  } catch (error: any) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to accept invitation" },
      { status: 500 }
    )
  }
}