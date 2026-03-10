import { Timestamp } from "firebase/firestore";

/**
 * Collections role types with different permission levels
 */
export type CollectionsRole = "superadmin" | "editor" | "viewer";

/**
 * Collections User interface
 */
export interface CollectionsUser {
  uid: string;
  email: string;
  fullName: string;
  role: CollectionsRole;
  isCollectionsUser: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  invitedBy?: string;
  // Note: invitationToken and invitationExpiry removed - now using collectionsInvitations collection
}

/**
 * Role permissions configuration
 */
export interface RolePermissions {
  role: CollectionsRole;
  canCreateCollections: boolean;
  canEditCollections: boolean;
  canDeleteCollections: boolean;
  canManageTeam: boolean;
  canPublishCollections: boolean;
}

/**
 * Role permissions mapping
 */
export const COLLECTIONS_ROLE_PERMISSIONS: Record<CollectionsRole, RolePermissions> = {
  superadmin: {
    role: "superadmin",
    canCreateCollections: true,
    canEditCollections: true,
    canDeleteCollections: true,
    canManageTeam: true,
    canPublishCollections: true,
  },
  editor: {
    role: "editor",
    canCreateCollections: true,
    canEditCollections: true,
    canDeleteCollections: true,
    canManageTeam: false,
    canPublishCollections: true,
  },
  viewer: {
    role: "viewer",
    canCreateCollections: false,
    canEditCollections: false,
    canDeleteCollections: false,
    canManageTeam: false,
    canPublishCollections: false,
  },
};
