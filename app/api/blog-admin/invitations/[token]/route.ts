import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || "blog-admin-secret-key"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token is required" },
        { status: 400 }
      )
    }

    // Verify and decode token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      )
    }
    
    // Find invitation by email and token
    const invitationsRef = adminDb.collection("blog_invitations");
    const snapshot = await invitationsRef
      .where("email", "==", decoded.email)
      .where("token", "==", token)
      .where("status", "==", "pending")
      .get();
    
    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, message: "Invitation not found" },
        { status: 404 }
      )
    }

    const invitationDoc = snapshot.docs[0]
    const data = invitationDoc.data()
    
    // Check if invitation has expired
    const now = new Date()
    // Firestore Admin SDK timestamp handling
    const expiresAt = data.expiresAt.toDate()
    
    if (now > expiresAt) {
      // Mark as expired
      await invitationDoc.ref.update({
        status: 'expired'
      })
      return NextResponse.json(
        { success: false, message: "Invitation has expired" },
        { status: 400 }
      )
    }

    const invitation = {
      id: invitationDoc.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      invitedBy: data.invitedBy,
      invitedByName: data.invitedByName,
      token: data.token,
      status: data.status,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
      acceptedAt: data.acceptedAt?.toDate?.()?.toISOString() || null
    }

    return NextResponse.json({ success: true, invitation })
  } catch (error: any) {
    console.error("Error getting invitation:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get invitation" },
      { status: 500 }
    )
  }
}