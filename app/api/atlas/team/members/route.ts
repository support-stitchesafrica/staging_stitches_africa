// app/api/atlas/team/members/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { AtlasTeamService } from "@/lib/atlas/team-service";

/**
 * GET /api/atlas/team/members
 * 
 * Retrieves all team members from the atlasUsers collection
 * Requires Super Admin authentication
 */
export async function GET(request: Request) {
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
        { success: false, error: "Forbidden: Only Super Admins can view team members" },
        { status: 403 }
      );
    }

    // Get all team members
    const members = await AtlasTeamService.getAllTeamMembers();

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch team members",
      },
      { status: 500 }
    );
  }
}
