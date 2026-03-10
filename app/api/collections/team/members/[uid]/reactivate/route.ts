// app/api/collections/team/members/[uid]/reactivate/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";
import { CollectionsTeamService } from "@/lib/collections/team-service";

/**
 * PATCH /api/collections/team/members/[uid]/reactivate
 * 
 * Reactivates a team member by setting isCollectionsUser to true
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
    const adminUserDoc = await adminDb.collection("staging_collectionsUsers").doc(adminUid).get();
    
    if (!adminUserDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Forbidden: User not found" },
        { status: 403 }
      );
    }

    const adminUser = adminUserDoc.data();
    if (!adminUser || adminUser.role !== "superadmin" || !adminUser.isCollectionsUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Super Admins can reactivate users" },
        { status: 403 }
      );
    }

    // Get the user being reactivated
    const targetUserDoc = await adminDb.collection("staging_collectionsUsers").doc(uid).get();
    
    if (!targetUserDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Reactivate user
    await CollectionsTeamService.reactivateUser(uid, adminUid);

    return NextResponse.json({
      success: true,
      message: "User reactivated successfully",
    });
  } catch (error: any) {
    console.error("Error reactivating user:", error);
    
    // Handle specific error messages
    if (error.message?.includes("Only Super Admins")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    if (error.message?.includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to reactivate user",
      },
      { status: 500 }
    );
  }
}
