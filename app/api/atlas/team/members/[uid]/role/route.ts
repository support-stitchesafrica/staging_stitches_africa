// app/api/atlas/team/members/[uid]/role/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { AtlasTeamService } from "@/lib/atlas/team-service";
import { AtlasEmailService } from "@/lib/atlas/email-service";
import type { AtlasRole } from "@/lib/atlas/types";

/**
 * PATCH /api/atlas/team/members/[uid]/role
 * 
 * Updates a team member's role
 * Requires Super Admin authentication
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

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
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const adminUid = decodedToken.uid;

    // Verify the user is a Super Admin using Admin SDK
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
        { success: false, error: "Forbidden: Only Super Admins can update user roles" },
        { status: 403 }
      );
    }

    // Parse request body
    const { role } = await request.json();

    // Validate role
    const validRoles: AtlasRole[] = ["superadmin", "founder", "sales_lead", "brand_lead", "logistics_lead"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    // Get the user being updated to send notification using Admin SDK
    const targetUserDoc = await adminDb.collection("staging_atlasUsers").doc(uid).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const targetUser = targetUserDoc.data();
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const oldRole = targetUser.role;

    // Update user role
    await AtlasTeamService.updateUserRole(uid, role, adminUid);

    // Send role change notification email
    const emailResult = await AtlasEmailService.sendRoleChangeNotification(
      targetUser.email || "",
      targetUser.fullName || "",
      oldRole,
      role
    );

    if (!emailResult.success) {
      console.warn("Failed to send role change notification:", emailResult.error);
      // Don't fail the request, just warn
    }

    return NextResponse.json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating user role:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update user role",
      },
      { status: 500 }
    );
  }
}
