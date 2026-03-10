import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import jwt from 'jsonwebtoken'
import { blogInvitationTemplate } from '@/lib/emailTemplates/blogInvitationTemplate'

const JWT_SECRET = process.env.JWT_SECRET || "blog-admin-secret-key"
const INVITATION_EXPIRY_HOURS = 72 // 3 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invitationData, invitedBy } = body

    // Validate required fields
    if (!invitationData?.email || !invitationData?.firstName || !invitationData?.lastName || !invitationData?.role) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!invitedBy?.uid || !invitedBy?.firstName || !invitedBy?.lastName) {
      return NextResponse.json(
        { success: false, message: "Invalid inviter information" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const usersRef = adminDb.collection("blog_users");
    const existingUserSnapshot = await usersRef.where("email", "==", invitationData.email).get();
    
    if (!existingUserSnapshot.empty) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const invitationsRef = adminDb.collection("blog_invitations");
    const existingInvitationSnapshot = await invitationsRef
      .where("email", "==", invitationData.email)
      .where("status", "==", "pending")
      .get();
    
    if (!existingInvitationSnapshot.empty) {
      return NextResponse.json(
        { success: false, message: "Pending invitation already exists for this email" },
        { status: 400 }
      )
    }

    // Generate invitation token
    const token = jwt.sign(
      { 
        email: invitationData.email,
        role: invitationData.role,
        invitedBy: invitedBy.uid
      },
      JWT_SECRET,
      { expiresIn: `${INVITATION_EXPIRY_HOURS}h` }
    )

    // Create invitation document
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + INVITATION_EXPIRY_HOURS)

    const invitation = {
      email: invitationData.email,
      firstName: invitationData.firstName,
      lastName: invitationData.lastName,
      role: invitationData.role,
      invitedBy: invitedBy.uid,
      invitedByName: `${invitedBy.firstName} ${invitedBy.lastName}`,
      token,
      status: 'pending',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt)
    }

    const docRef = await invitationsRef.add(invitation);
    const invitationId = docRef.id;

    // Generate invitation URL
    // For testing: explicitly using localhost as requested
    // const invitationUrl = `http://localhost:3000/blog-admin/accept-invitation?token=${token}`
    // To revert to production, uncomment the line below and remove the one above:
    const invitationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/blog-admin/accept-invitation?token=${token}`
    
    // Send invitation email
    try {
      const emailHtml = blogInvitationTemplate({
        firstName: invitationData.firstName,
        invitedByName: `${invitedBy.firstName} ${invitedBy.lastName}`,
        role: invitationData.role,
        invitationUrl,
        expiryHours: INVITATION_EXPIRY_HOURS
      })

      const emailResponse = await fetch('https://stitchesafricamobile-backend.onrender.com/api/Email/Send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify({
          body: emailHtml,
          subject: 'You\'re invited to join Stitches Africa Blog Admin',
          emails: [{
            emailAddress: invitationData.email,
            name: `${invitationData.firstName} ${invitationData.lastName}`
          }],
          from: 'noreply@stitchesafrica.com',
          replyTo: 'support@stitchesafrica.com'
        })
      })

      if (!emailResponse.ok) {
        console.error('Failed to send invitation email:', await emailResponse.text())
      } else {
        console.log('Invitation email sent successfully to:', invitationData.email)
      }
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError)
      // Continue execution - we don't want to fail the whole request if just email fails
      // as the token is generated and valid
    }

    return NextResponse.json({
      success: true,
      invitationId,
      invitationUrl // Include URL in response for testing
    })

  } catch (error: any) {
    console.error("Error creating invitation:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create invitation" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const invitationsSnapshot = await adminDb.collection("blog_invitations").get();
    
    const invitations = invitationsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        invitedBy: data.invitedBy,
        invitedByName: data.invitedByName,
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
        acceptedAt: data.acceptedAt?.toDate?.()?.toISOString() || null
      }
    })

    return NextResponse.json({ success: true, invitations })
  } catch (error: any) {
    console.error("Error getting invitations:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get invitations" },
      { status: 500 }
    )
  }
}