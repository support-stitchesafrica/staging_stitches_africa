import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import { Timestamp } from "firebase/firestore";
import { CollectionsUser, CollectionsRole } from "./types";

// Re-export types for convenience
export type { CollectionsUser, CollectionsRole };

/**
 * Collections Authentication Service
 * 
 * Handles authentication operations for product collections users.
 * Uses the collectionsUsers collection for access control.
 * 
 * @module CollectionsAuthService
 */
export class CollectionsAuthService {
  /**
   * Authenticates a collections user with email and password
   * @param email - User email
   * @param password - User password
   * @returns Object with success status and optional error message
   */
  static async loginCollectionsUser(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs
      if (!email || !password) {
        return {
          success: false,
          error: "Email and password are required",
        };
      }

      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Validate collections access
      const hasAccess = await this.validateCollectionsAccess(userCredential.user.uid);

      if (!hasAccess) {
        // Sign out the user if they don't have collections access
        await signOut(auth);
        return {
          success: false,
          error:
            "You are not authorized to access the Collections Designer. Please contact your administrator.",
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Collections login error:", error);

      // Handle specific Firebase errors
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      if (error.code === "auth/too-many-requests") {
        return {
          success: false,
          error: "Too many failed login attempts. Please try again later.",
        };
      }

      if (error.code === "auth/network-request-failed") {
        return {
          success: false,
          error: "Network error. Please check your connection and try again.",
        };
      }

      return {
        success: false,
        error: error.message || "Login failed. Please try again.",
      };
    }
  }

  /**
   * Retrieves collections user data from Firestore
   * @param uid - Firebase Auth user ID
   * @returns CollectionsUser object or null if not found
   */
  static async getCollectionsUser(uid: string): Promise<CollectionsUser | null> {
    try {
      if (!uid) {
        return null;
      }

      const userDocRef = doc(db, "staging_collectionsUsers", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();

      // Validate that this is a collections user
      if (!data.isCollectionsUser) {
        return null;
      }

      return {
        uid: data.uid,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        isCollectionsUser: data.isCollectionsUser,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as CollectionsUser;
    } catch (error: any) {
      // Only log non-permission errors to avoid noise for admins
      if (error?.code !== "permission-denied" && 
          !error?.message?.includes("permission") &&
          !error?.message?.includes("insufficient permissions")) {
        console.error("Error fetching collections user:", error);
      }
      return null;
    }
  }

  /**
   * Validates if a user has collections access by checking the isCollectionsUser flag
   * @param uid - Firebase Auth user ID
   * @returns true if user has collections access, false otherwise
   */
  static async validateCollectionsAccess(uid: string): Promise<boolean> {
    try {
      // First check if user is an admin - admins are not collections users
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/firebase");
        const adminDoc = await getDoc(doc(db, "admins", uid));
        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          if (adminData?.role === "admin" || adminData?.role === "superadmin") {
            // User is an admin, not a collections user
            return false;
          }
        }
      } catch (adminErr: any) {
        // If admin check fails with permission error, user might be admin
        // Return false to avoid trying collections check
        if (adminErr?.code === "permission-denied" || 
            adminErr?.message?.includes("permission") ||
            adminErr?.message?.includes("insufficient permissions")) {
          return false;
        }
        // For other errors, continue with collections check
      }

      const collectionsUser = await this.getCollectionsUser(uid);
      return collectionsUser !== null && collectionsUser.isCollectionsUser === true;
    } catch (error: any) {
      // Only log non-permission errors to avoid noise
      if (error?.code !== "permission-denied" && 
          !error?.message?.includes("permission") &&
          !error?.message?.includes("insufficient permissions")) {
        console.error("Error validating collections access:", error);
      }
      return false;
    }
  }

  /**
   * Registers a new collections user
   * @param email - User email
   * @param password - User password
   * @param fullName - User full name
   * @returns Object with success status and optional error message
   */
  static async registerCollectionsUser(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs
      if (!email || !password || !fullName) {
        return {
          success: false,
          error: "Email, password, and full name are required",
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters",
        };
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const uid = userCredential.user.uid;
      const now = Timestamp.now();

      // Create collections user document in Firestore
      // First user is always a Super Admin
      const collectionsUserData: CollectionsUser = {
        uid,
        email,
        fullName,
        role: "superadmin" as CollectionsRole,
        isCollectionsUser: true,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, "staging_collectionsUsers", uid), collectionsUserData);

      return { success: true };
    } catch (error: any) {
      console.error("Collections registration error:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/email-already-in-use") {
        return {
          success: false,
          error: "This email is already registered. If you received an invitation, please use the invitation link from your email. Otherwise, try logging in.",
        };
      }

      if (error.code === "auth/invalid-email") {
        return {
          success: false,
          error: "Invalid email address",
        };
      }

      if (error.code === "auth/weak-password") {
        return {
          success: false,
          error: "Password is too weak. Please use a stronger password.",
        };
      }

      if (error.code === "auth/network-request-failed") {
        return {
          success: false,
          error: "Network error. Please check your connection and try again.",
        };
      }

      return {
        success: false,
        error: error.message || "Registration failed. Please try again.",
      };
    }
  }

  /**
   * Signs out the current collections user
   * @returns Object with success status and optional error message
   */
  static async logoutCollectionsUser(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error("Collections logout error:", error);
      return {
        success: false,
        error: error.message || "Logout failed. Please try again.",
      };
    }
  }
}
