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
import { PromotionalUser, PromotionalRole } from "./types";

// Re-export types for convenience
export type { PromotionalUser, PromotionalRole };

/**
 * Promotional Authentication Service
 * 
 * Handles authentication operations for promotional events users.
 * Uses the promotionalUsers collection for access control.
 * 
 * @module PromotionalsAuthService
 */
export class PromotionalsAuthService {
  /**
   * Authenticates a promotional user with email and password
   * @param email - User email
   * @param password - User password
   * @returns Object with success status and optional error message
   */
  static async loginPromotionalUser(
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

      // Validate promotional access
      const hasAccess = await this.validatePromotionalAccess(userCredential.user.uid);

      if (!hasAccess) {
        // Sign out the user if they don't have promotional access
        await signOut(auth);
        return {
          success: false,
          error:
            "You are not authorized to access the Promotional Events Manager. Please contact your administrator.",
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Promotional login error:", error);

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
   * Retrieves promotional user data from Firestore
   * @param uid - Firebase Auth user ID
   * @returns PromotionalUser object or null if not found
   */
  static async getPromotionalUser(uid: string): Promise<PromotionalUser | null> {
    try {
      if (!uid) {
        return null;
      }

      const userDocRef = doc(db, "promotionalUsers", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();

      // Validate that this is a promotional user
      if (!data.isPromotionalUser) {
        return null;
      }

      return {
        uid: data.uid,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        isPromotionalUser: data.isPromotionalUser,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as PromotionalUser;
    } catch (error) {
      console.error("Error fetching promotional user:", error);
      return null;
    }
  }

  /**
   * Validates if a user has promotional access by checking the isPromotionalUser flag
   * @param uid - Firebase Auth user ID
   * @returns true if user has promotional access, false otherwise
   */
  static async validatePromotionalAccess(uid: string): Promise<boolean> {
    try {
      const promotionalUser = await this.getPromotionalUser(uid);
      return promotionalUser !== null && promotionalUser.isPromotionalUser === true;
    } catch (error) {
      console.error("Error validating promotional access:", error);
      return false;
    }
  }

  /**
   * Registers a new promotional user
   * @param email - User email
   * @param password - User password
   * @param fullName - User full name
   * @returns Object with success status and optional error message
   */
  static async registerPromotionalUser(
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

      // Create promotional user document in Firestore
      // First user is always a Super Admin
      const promotionalUserData: PromotionalUser = {
        uid,
        email,
        fullName,
        role: "superadmin" as PromotionalRole,
        isPromotionalUser: true,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, "promotionalUsers", uid), promotionalUserData);

      return { success: true };
    } catch (error: any) {
      console.error("Promotional registration error:", error);

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
   * Signs out the current promotional user
   * @returns Object with success status and optional error message
   */
  static async logoutPromotionalUser(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error("Promotional logout error:", error);
      return {
        success: false,
        error: error.message || "Logout failed. Please try again.",
      };
    }
  }

  /**
   * Checks if any promotional users exist in the system
   * Used to determine if first-time setup is needed
   * @returns true if at least one promotional user exists, false otherwise
   */
  static async checkIfAnyUsersExist(): Promise<boolean> {
    try {
      const { collection, getDocs, limit, query } = await import("firebase/firestore");
      
      const usersQuery = query(
        collection(db, "promotionalUsers"),
        limit(1)
      );
      
      const snapshot = await getDocs(usersQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking if promotional users exist:", error);
      return false;
    }
  }
}
