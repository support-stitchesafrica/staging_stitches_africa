import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import { AtlasUser, AUTHORIZED_DOMAINS } from "./types";

/**
 * Atlas Authentication Service
 * 
 * Handles authentication operations specific to Atlas users with domain validation
 * and role-based access control.
 * 
 * This service manages the `atlasUsers` collection in Firestore. For detailed
 * information about the collection structure, indexes, and security rules, see:
 * @see {@link ./firestore-schema.md}
 * 
 * @module AtlasAuthService
 */
export class AtlasAuthService {
  /**
   * Validates if an email address belongs to an authorized domain
   * @param email - Email address to validate
   * @returns true if email ends with @stitchesafrica.com or @stitchesafrica.pro
   */
  static validateEmailDomain(email: string): boolean {
    if (!email || typeof email !== "string") {
      return false;
    }

    const normalizedEmail = email.toLowerCase().trim();
    return AUTHORIZED_DOMAINS.some((domain) =>
      normalizedEmail.endsWith(domain)
    );
  }

  /**
   * Registers a new Atlas user with Firebase Auth and creates Firestore document
   * @param email - User email (must be authorized domain)
   * @param password - User password
   * @param fullName - User's full name
   * @returns Object with success status and optional error message
   */
  static async registerAtlasUser(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate email domain
      if (!this.validateEmailDomain(email)) {
        return {
          success: false,
          error:
            "Only @stitchesafrica.com and @stitchesafrica.pro email addresses are allowed",
        };
      }

      // Validate full name
      if (!fullName || fullName.trim().length === 0) {
        return {
          success: false,
          error: "Full name is required",
        };
      }

      // Validate password
      if (!password || password.length < 6) {
        return {
          success: false,
          error: "Password should be at least 6 characters",
        };
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create Firestore user document
      await this.createAtlasUserDocument(
        userCredential.user.uid,
        email,
        fullName
      );

      return { success: true };
    } catch (error: any) {
      console.error("Atlas registration error:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/email-already-in-use") {
        return {
          success: false,
          error: "This email is already registered",
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
          error: "Password should be at least 6 characters",
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
   * Authenticates an Atlas user with email and password
   * @param email - User email
   * @param password - User password
   * @returns Object with success status and optional error message
   */
  static async loginAtlasUser(
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

      // Validate Atlas access
      const hasAccess = await this.validateAtlasAccess(userCredential.user.uid);

      if (!hasAccess) {
        // Sign out the user if they don't have Atlas access
        await signOut(auth);
        return {
          success: false,
          error:
            "You are not authorized to access Atlas. Please contact your administrator.",
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Atlas login error:", error);

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
   * Retrieves Atlas user data from Firestore
   * @param uid - Firebase Auth user ID
   * @returns AtlasUser object or null if not found
   */
  static async getAtlasUser(uid: string): Promise<AtlasUser | null> {
    try {
      if (!uid) {
        return null;
      }

      const userDocRef = doc(db, "staging_atlasUsers", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();

      // Validate that this is an Atlas user
      if (!data.isAtlasUser) {
        return null;
      }

      return {
        uid: data.uid,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        isAtlasUser: data.isAtlasUser,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as AtlasUser;
    } catch (error) {
      console.error("Error fetching Atlas user:", error);
      return null;
    }
  }

  /**
   * Creates an Atlas user document in Firestore
   * @param uid - Firebase Auth user ID
   * @param email - User email
   * @param fullName - User's full name
   */
  static async createAtlasUserDocument(
    uid: string,
    email: string,
    fullName: string
  ): Promise<void> {
    try {
      const userDocRef = doc(db, "staging_atlasUsers", uid);
      const now = Timestamp.now();

      const atlasUserData: Omit<AtlasUser, "createdAt" | "updatedAt"> & {
        createdAt: Timestamp;
        updatedAt: Timestamp;
      } = {
        uid,
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        role: "superadmin",
        isAtlasUser: true,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(userDocRef, atlasUserData);
    } catch (error) {
      console.error("Error creating Atlas user document:", error);
      throw new Error("Failed to create user profile");
    }
  }

  /**
   * Validates if a user has Atlas access by checking the isAtlasUser flag
   * @param uid - Firebase Auth user ID
   * @returns true if user has Atlas access, false otherwise
   */
  static async validateAtlasAccess(uid: string): Promise<boolean> {
    try {
      const atlasUser = await this.getAtlasUser(uid);
      return atlasUser !== null && atlasUser.isAtlasUser === true;
    } catch (error) {
      console.error("Error validating Atlas access:", error);
      return false;
    }
  }

  /**
   * Signs out the current Atlas user
   * @returns Object with success status and optional error message
   */
  static async logoutAtlasUser(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error("Atlas logout error:", error);
      return {
        success: false,
        error: error.message || "Logout failed. Please try again.",
      };
    }
  }
}
