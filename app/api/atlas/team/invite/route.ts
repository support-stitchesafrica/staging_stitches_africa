// app/api/atlas/team/invite/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";
import { RateLimitService, RATE_LIMIT_CONFIGS } from "@/lib/atlas/rate-limit-service";
import type { AtlasRole } from "@/lib/atlas/types";
import { atlasInvitationTemplate } from "@/lib/emailTemplates/atlasInvitationTemplate";
import { Timestamp } from "firebase-admin/firestore";
import { generateInvitationToken } from "@/lib/utils/token-generator";

/**
 * POST /api/atlas/team/invite
 * 
 * Creates an invitation for a new team member
 * Requires Super Admin authentication
 */
export async function POST(request: Request) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify the Firebase ID token
    let decodedToken;
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const adminUid = decodedToken.uid;

    // Verify the user is a Super Admin using Firebase Admin SDK
    const adminUserDoc = await adminDb.collection("staging_atlasUsers").doc(adminUid).get();
    
    if (!adminUserDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Forbidden: User not found" },
        { status: 403 }
      );
    }

    const adminUser = adminUserDoc.data();
    if (!adminUser || adminUser.role !== "superadmin" || !adminUser.isAtlasUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Super Admins can invite team members" },
        { status: 403 }
      );
    }

    // Check rate limit for invitation creation
    const rateLimitResult = await RateLimitService.checkRateLimit(
      adminUid,
      "team_invite",
      RATE_LIMIT_CONFIGS.TEAM_INVITE
    );

    if (!rateLimitResult.allowed) {
      const resetTimeString = rateLimitResult.resetTime.toLocaleString();
      return NextResponse.json(
        { 
          success: false, 
          error: `Rate limit exceeded. You can send up to ${RATE_LIMIT_CONFIGS.TEAM_INVITE.maxRequests} invitations per hour. Try again after ${resetTimeString}.`,
          rateLimitExceeded: true,
          resetTime: rateLimitResult.resetTime.toISOString(),
          remainingRequests: rateLimitResult.remainingRequests
        },
        { status: 429 }
      );
    }

    // Parse request body
    const { fullName, email, role } = await request.json();

    // Validate required fields
    if (!fullName || !email || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: fullName, email, role" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: AtlasRole[] = ["superadmin", "founder", "sales_lead", "brand_lead", "logistics_lead"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be one of: superadmin, founder, sales_lead, brand_lead, logistics_lead" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email domain
    const AUTHORIZED_DOMAINS = ["@stitchesafrica.com", "@stitchesafrica.pro"];
    const isValidDomain = AUTHORIZED_DOMAINS.some(domain =>
      normalizedEmail.endsWith(domain)
    );
    
    if (!isValidDomain) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email domain. Only @stitchesafrica.com and @stitchesafrica.pro are allowed",
        },
        { status: 400 }
      );
    }

    // Check if user already exists in atlasUsers
    const existingUserQuery = await adminDb
      .collection("staging_atlasUsers")
      .where("email", "==", normalizedEmail)
      .get();

    if (!existingUserQuery.empty) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Check if pending invitation already exists
    const existingInviteQuery = await adminDb
      .collection("staging_atlasInvitations")
      .where("email", "==", normalizedEmail)
      .where("status", "==", "pending")
      .get();

    if (!existingInviteQuery.empty) {
      return NextResponse.json(
        { success: false, error: "An active invitation already exists for this email" },
        { status: 409 }
      );
    }

    // Generate invitation ID and expiration
    const inviteId = adminDb.collection("staging_atlasInvitations").doc().id;
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(
      now.toMillis() + (7 * 24 * 60 * 60 * 1000) // 7 days
    );

    // Generate JWT token using centralized token generator
    const invitationToken = generateInvitationToken({
      inviteId,
      email: normalizedEmail,
      role,
      system: 'atlas',
      expiresAt: expiresAt.toMillis()
    });

    // Create invitation record
    const invitation = {
      id: inviteId,
      email: normalizedEmail,
      name: fullName.trim(),
      role,
      invitedByUserId: adminUid,
      status: 'pending',
      token: invitationToken,
      expiresAt,
      createdAt: now
    };

    // Save to Firestore
    await adminDb.collection("staging_atlasInvitations").doc(inviteId).set(invitation);

    // Generate invitation link
    // Use environment variable, or default based on NODE_ENV
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://www.stitchesafrica.com');
    const invitationLink = `${baseUrl}/atlas/invite/${invitationToken}`;
    
    // Log the base URL being used for debugging
    console.log('[Atlas Team Invite] Generated invitation link', {
      baseUrl,
      nodeEnv: process.env.NODE_ENV,
      hasEnvVar: !!process.env.NEXT_PUBLIC_BASE_URL,
      invitationLink: invitationLink.substring(0, 100) + '...'
    });

    // Send invitation email
    try {
      // Get inviter's name for the email
      const inviterDoc = await adminDb.collection("staging_atlasUsers").doc(adminUid).get();
      const inviterName = inviterDoc.exists 
        ? inviterDoc.data()?.fullName || "A team member"
        : "A team member";

      // Generate email HTML
      const emailHtml = atlasInvitationTemplate({
        inviteeName: fullName.trim(),
        inviterName,
        role,
        invitationLink,
        expiryDays: 7,
      });

      // Send email via the staging API
      const emailResponse = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: emailHtml,
          subject: `You're invited to join Stitches Africa Atlas`,
          emails: [{
            emailAddress: normalizedEmail,
            name: fullName.trim(),
          }],
          from: "atlas@stitchesafrica.com",
          replyTo: "support@stitchesafrica.com",
        }),
      });

      const emailResult = await emailResponse.text();
      
      if (!emailResponse.ok) {
        console.error("Failed to send invitation email:", emailResult);
        // Log the error but don't fail the invitation creation
        // The invitation is still valid and can be manually shared
      } else {
        console.log("Invitation email sent successfully to:", email);
      }
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Log the error but don't fail the invitation creation
      // The invitation is still valid and can be manually shared
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: inviteId,
        email: normalizedEmail,
        name: fullName.trim(),
        role,
        status: 'pending',
        expiresAt: expiresAt.toMillis()
      },
      invitationToken,
      invitationLink,
      message: "Invitation created successfully",
      rateLimitInfo: {
        remainingRequests: rateLimitResult.remainingRequests,
        resetTime: rateLimitResult.resetTime.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error creating invitation:", error);
    
    // Handle specific error messages
    if (error.message?.includes("already exists")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    if (error.message?.includes("Only Super Admins")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create invitation",
      },
      { status: 500 }
    );
  }
}
