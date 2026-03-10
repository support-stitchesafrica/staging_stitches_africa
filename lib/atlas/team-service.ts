import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { AtlasUser, AtlasRole, ROLE_PERMISSIONS } from "./types";

/**
 * Atlas Team Management Service
 * 
 * Handles team member management operations including user activation,
 * role management, and invitation workflows for the Atlas dashboard.
 * 
 * @module AtlasTeamService
 */
export class AtlasTeamService {
  /**
   * Retrieves all team members from the atlasUsers collection
   * @returns Array of AtlasUser objects
   */
  static async getAllTeamMembers(): Promise<AtlasUser[]> {
    try {
      const usersCollectionRef = collection(db, "atlasUsers");
      const querySnapshot = await getDocs(usersCollectionRef);

      const teamMembers: AtlasUser[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        teamMembers.push({
          uid: data.uid,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          isAtlasUser: data.isAtlasUser,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          invitedBy: data.invitedBy,
        } as AtlasUser);
      });

      // Sort by creation date (newest first)
      teamMembers.sort((a, b) => {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });

      return teamMembers;
    } catch (error) {
      console.error("Error fetching team members:", error);
      throw new Error("Failed to fetch team members");
    }
  }

  /**
   * Deactivates a user by setting isAtlasUser to false
   * @param uid - User ID to deactivate
   * @param adminUid - UID of Super Admin performing action
   */
  static async deactivateUser(uid: string, adminUid: string): Promise<void> {
    try {
      if (!uid || !adminUid) {
        throw new Error("User ID and Admin ID are required");
      }

      // Validate that the admin is a Super Admin
      const adminUser = await this.getTeamMember(adminUid);
      if (!adminUser || adminUser.role !== "superadmin") {
        throw new Error("Only Super Admins can deactivate users");
      }

      // Get the user to be deactivated
      const userToDeactivate = await this.getTeamMember(uid);
      if (!userToDeactivate) {
        throw new Error("User not found");
      }

      // Prevent deactivating the last Super Admin
      if (userToDeactivate.role === "superadmin") {
        const allMembers = await this.getAllTeamMembers();
        const activeSuperAdmins = allMembers.filter(
          (member) => member.role === "superadmin" && member.isAtlasUser
        );

        if (activeSuperAdmins.length <= 1) {
          throw new Error(
            "Cannot deactivate the last Super Admin. At least one Super Admin must remain active."
          );
        }
      }

      // Update the user document
      const userDocRef = doc(db, "atlasUsers", uid);
      await updateDoc(userDocRef, {
        isAtlasUser: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  }

  /**
   * Reactivates a user by setting isAtlasUser to true
   * @param uid - User ID to reactivate
   * @param adminUid - UID of Super Admin performing action
   */
  static async reactivateUser(uid: string, adminUid: string): Promise<void> {
    try {
      if (!uid || !adminUid) {
        throw new Error("User ID and Admin ID are required");
      }

      // Validate that the admin is a Super Admin
      const adminUser = await this.getTeamMember(adminUid);
      if (!adminUser || adminUser.role !== "superadmin") {
        throw new Error("Only Super Admins can reactivate users");
      }

      // Get the user to be reactivated
      const userToReactivate = await this.getTeamMember(uid);
      if (!userToReactivate) {
        throw new Error("User not found");
      }

      // Update the user document
      const userDocRef = doc(db, "atlasUsers", uid);
      await updateDoc(userDocRef, {
        isAtlasUser: true,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error reactivating user:", error);
      throw error;
    }
  }

  /**
   * Updates a user's role with validation to ensure at least one Super Admin exists
   * @param uid - User ID to update
   * @param newRole - New role to assign
   * @param adminUid - UID of Super Admin performing action
   */
  static async updateUserRole(
    uid: string,
    newRole: AtlasRole,
    adminUid: string
  ): Promise<void> {
    try {
      if (!uid || !newRole || !adminUid) {
        throw new Error("User ID, new role, and Admin ID are required");
      }

      // Validate that the admin is a Super Admin
      const adminUser = await this.getTeamMember(adminUid);
      if (!adminUser || adminUser.role !== "superadmin") {
        throw new Error("Only Super Admins can update user roles");
      }

      // Get the user to be updated
      const userToUpdate = await this.getTeamMember(uid);
      if (!userToUpdate) {
        throw new Error("User not found");
      }

      // Prevent changing the last Super Admin's role
      if (userToUpdate.role === "superadmin" && newRole !== "superadmin") {
        const allMembers = await this.getAllTeamMembers();
        const activeSuperAdmins = allMembers.filter(
          (member) => member.role === "superadmin" && member.isAtlasUser
        );

        if (activeSuperAdmins.length <= 1) {
          throw new Error(
            "Cannot change the role of the last Super Admin. At least one Super Admin must remain."
          );
        }
      }

      // Update the user document
      const userDocRef = doc(db, "atlasUsers", uid);
      await updateDoc(userDocRef, {
        role: newRole,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }

  // Note: Old invitation methods (createInvitation, validateInvitationToken, completeUserSetup)
  // have been removed. The new unified invitation system uses AtlasInvitationService
  // from lib/atlas/invitation-service.ts instead.

  /**
   * Validates if a user has permission to access a dashboard
   * @param role - User's role
   * @param dashboardPath - Dashboard route to check
   * @returns true if user has access, false otherwise
   */
  static hasAccessToDashboard(role: AtlasRole, dashboardPath: string): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) {
      return false;
    }

    // Check if the dashboard path is in the allowed dashboards
    return permissions.dashboards.some((allowedPath) => {
      // Exact match
      if (dashboardPath === allowedPath) {
        return true;
      }
      
      // For sub-routes, check if it starts with the allowed path followed by a slash
      // But only if the allowed path is not the base /atlas path
      if (allowedPath !== '/atlas' && dashboardPath.startsWith(`${allowedPath}/`)) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Validates if a user can manage team members
   * @param role - User's role
   * @returns true if user can manage team, false otherwise
   */
  static canManageTeam(role: AtlasRole): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions ? permissions.canManageTeam : false;
  }

  /**
   * Helper method to get a single team member by UID
   * @param uid - User ID
   * @returns AtlasUser object or null if not found
   */
  private static async getTeamMember(uid: string): Promise<AtlasUser | null> {
    try {
      const userDocRef = doc(db, "atlasUsers", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as AtlasUser;
    } catch (error) {
      console.error("Error fetching team member:", error);
      return null;
    }
  }

  /**
   * Helper method to get a user by email
   * @param email - User email
   * @returns AtlasUser object or null if not found
   */
  private static async getUserByEmail(email: string): Promise<AtlasUser | null> {
    try {
      const usersCollectionRef = collection(db, "atlasUsers");
      const q = query(
        usersCollectionRef,
        where("email", "==", email.toLowerCase().trim())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      return querySnapshot.docs[0].data() as AtlasUser;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
  }
}
