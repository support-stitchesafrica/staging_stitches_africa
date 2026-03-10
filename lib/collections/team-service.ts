import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { CollectionsUser, CollectionsRole } from "./types";

/**
 * Collections Team Management Service
 * 
 * Handles team member management operations including user activation,
 * role management, and invitation workflows for the Collections system.
 * 
 * @module CollectionsTeamService
 */
export class CollectionsTeamService {
  /**
   * Retrieves all team members from the collectionsUsers collection
   * @returns Array of CollectionsUser objects
   */
  static async getAllTeamMembers(): Promise<CollectionsUser[]> {
    try {
      const usersCollectionRef = collection(db, "staging_collectionsUsers");
      const querySnapshot = await getDocs(usersCollectionRef);

      const teamMembers: CollectionsUser[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        teamMembers.push({
          uid: data.uid,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          isCollectionsUser: data.isCollectionsUser,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          invitedBy: data.invitedBy,
        } as CollectionsUser);
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
   * Deactivates a user by setting isCollectionsUser to false
   * @param uid - User ID to deactivate
   * @param adminUid - UID of Super Admin performing action
   */
  static async deactivateUser(uid: string, adminUid: string): Promise<void> {
    try {
      if (!uid || !adminUid) {
        throw new Error("User ID and Admin ID are required");
      }

      // Prevent self-deactivation
      if (uid === adminUid) {
        throw new Error("You cannot deactivate your own account");
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
          (member) => member.role === "superadmin" && member.isCollectionsUser
        );

        if (activeSuperAdmins.length <= 1) {
          throw new Error(
            "Cannot deactivate the last Super Admin. At least one Super Admin must remain active."
          );
        }
      }

      // Update the user document
      const userDocRef = doc(db, "staging_collectionsUsers", uid);
      await updateDoc(userDocRef, {
        isCollectionsUser: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  }

  /**
   * Reactivates a user by setting isCollectionsUser to true
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
      const userDocRef = doc(db, "staging_collectionsUsers", uid);
      await updateDoc(userDocRef, {
        isCollectionsUser: true,
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
    newRole: CollectionsRole,
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
          (member) => member.role === "superadmin" && member.isCollectionsUser
        );

        if (activeSuperAdmins.length <= 1) {
          throw new Error(
            "Cannot change the role of the last Super Admin. At least one Super Admin must remain."
          );
        }
      }

      // Update the user document
      const userDocRef = doc(db, "staging_collectionsUsers", uid);
      await updateDoc(userDocRef, {
        role: newRole,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use CollectionsInvitationService.createInvitation instead
   * This method is kept for backward compatibility but should not be used.
   * The new invitation system uses JWT tokens and the collectionsInvitations collection.
   */
  static async createInvitation(invitationData: {
    fullName: string;
    email: string;
    role: CollectionsRole;
    invitedBy: string;
  }): Promise<string> {
    throw new Error(
      "This method is deprecated. Use CollectionsInvitationService.createInvitation instead. " +
      "The invitation system has been updated to use JWT tokens and the collectionsInvitations collection."
    );
  }

  /**
   * @deprecated Use CollectionsInvitationService.validateInvitation instead
   * This method is kept for backward compatibility but should not be used.
   * The new invitation system uses JWT tokens and the collectionsInvitations collection.
   */
  static async validateInvitationToken(
    token: string
  ): Promise<Partial<CollectionsUser> | null> {
    throw new Error(
      "This method is deprecated. Use CollectionsInvitationService.validateInvitation instead. " +
      "The invitation system has been updated to use JWT tokens and the collectionsInvitations collection."
    );
  }

  /**
   * Helper method to get a single team member by UID
   * @param uid - User ID
   * @returns CollectionsUser object or null if not found
   */
  private static async getTeamMember(uid: string): Promise<CollectionsUser | null> {
    try {
      const userDocRef = doc(db, "staging_collectionsUsers", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as CollectionsUser;
    } catch (error) {
      console.error("Error fetching team member:", error);
      return null;
    }
  }

  /**
   * Helper method to get a user by email
   * @param email - User email
   * @returns CollectionsUser object or null if not found
   */
  private static async getUserByEmail(email: string): Promise<CollectionsUser | null> {
    try {
      const usersCollectionRef = collection(db, "staging_collectionsUsers");
      const q = query(
        usersCollectionRef,
        where("email", "==", email.toLowerCase().trim())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      return querySnapshot.docs[0].data() as CollectionsUser;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
  }
}
