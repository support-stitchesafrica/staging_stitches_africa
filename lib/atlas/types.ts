import { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

/**
 * Atlas role types with different permission levels
 */
export type AtlasRole = 
  | "superadmin" 
  | "founder" 
  | "sales_lead" 
  | "brand_lead" 
  | "logistics_lead";

/**
 * Atlas User interface representing an authorized STITCHES Africa team member
 * with access to the analytics dashboard
 */
export interface AtlasUser {
  /** Firebase Auth UID */
  uid: string;
  
  /** User email address (must be @stitchesafrica.com or @stitchesafrica.pro) */
  email: string;
  
  /** User's full name */
  fullName: string;
  
  /** User role determining dashboard access permissions */
  role: AtlasRole;
  
  /** Flag indicating this is an authorized Atlas user */
  isAtlasUser: boolean;
  
  /** Account creation timestamp */
  createdAt: Timestamp;
  
  /** Last update timestamp */
  updatedAt: Timestamp;
  
  /** UID of Super Admin who invited this user (optional, kept for audit purposes) */
  invitedBy?: string;
}

/**
 * Atlas authentication state interface for managing auth context
 */
export interface AtlasAuthState {
  /** Firebase Auth user object */
  user: User | null;
  
  /** Firestore Atlas user document */
  atlasUser: AtlasUser | null;
  
  /** Loading state during authentication operations */
  loading: boolean;
  
  /** Error message if authentication fails */
  error: string | null;
}

/**
 * Role permissions interface defining dashboard access and capabilities
 */
export interface RolePermissions {
  /** Role identifier */
  role: AtlasRole;
  
  /** Array of accessible dashboard routes */
  dashboards: string[];
  
  /** Whether this role can manage team members */
  canManageTeam: boolean;
}

/**
 * Role permissions configuration mapping each role to its permissions
 */
export const ROLE_PERMISSIONS: Record<AtlasRole, RolePermissions> = {
  superadmin: {
    role: "superadmin",
    dashboards: [
      "/atlas",
      "/atlas/analytics",
      "/atlas/traffic",
      "/atlas/vendor-sales",
      "/atlas/logistics",
      "/atlas/ai-assistant-analytics",
      "/atlas/agent-chat",
      "/atlas/vendor-analytics",
      "/atlas/bogo-analytics",
      "/atlas/bogo-promotions",
      "/atlas/storefront-analytics",
      "/atlas/collections-analytics",
      "/atlas/referral-analytics",
      "/atlas/hierarchical-referral-admin",
      "/atlas/cross-analytics",
      "/atlas/notification-analytics",
      "/atlas/coupons",
      "/atlas/team",
      "/atlas/top-viewed",
      "/atlas/top-searched",
      "/atlas/popular-cart-items",
      "/atlas/free-gifts",
    ],
    canManageTeam: true,
  },
  founder: {
    role: "founder",
    dashboards: [
      "/atlas",
      "/atlas/analytics",
      "/atlas/traffic",
      "/atlas/vendor-sales",
      "/atlas/logistics",
      "/atlas/ai-assistant-analytics",
      "/atlas/agent-chat",
      "/atlas/vendor-analytics",
      "/atlas/bogo-analytics",
      "/atlas/bogo-promotions",
      "/atlas/storefront-analytics",
      "/atlas/collections-analytics",
      "/atlas/referral-analytics",
      "/atlas/hierarchical-referral-admin",
      "/atlas/cross-analytics",
      "/atlas/notification-analytics",
      "/atlas/coupons",
      "/atlas/top-viewed",
      "/atlas/top-searched",
      "/atlas/popular-cart-items",
      "/atlas/free-gifts",
    ],
    canManageTeam: false,
  },
  sales_lead: {
    role: "sales_lead",
    dashboards: [
      "/atlas",
      "/atlas/vendor-sales",
      "/atlas/ai-assistant-analytics",
      "/atlas/agent-chat",
      "/atlas/vendor-analytics",
      "/atlas/storefront-analytics",
      "/atlas/collections-analytics",
      "/atlas/referral-analytics",
      "/atlas/hierarchical-referral-admin",
      "/atlas/cross-analytics",
      "/atlas/coupons",
      "/atlas/top-viewed",
      "/atlas/top-searched",
      "/atlas/popular-cart-items",
    ],
    canManageTeam: false,
  },
  brand_lead: {
    role: "brand_lead",
    dashboards: [
      "/atlas",
      "/atlas/traffic",
      "/atlas/ai-assistant-analytics",
      "/atlas/agent-chat",
      "/atlas/vendor-analytics",
      "/atlas/bogo-analytics",
      "/atlas/bogo-promotions",
      "/atlas/storefront-analytics",
      "/atlas/collections-analytics",
      "/atlas/referral-analytics",
      "/atlas/hierarchical-referral-admin",
      "/atlas/cross-analytics",
      "/atlas/notification-analytics",
      "/atlas/coupons",
      "/atlas/top-viewed",
      "/atlas/top-searched",
      "/atlas/popular-cart-items",
    ],
    canManageTeam: false,
  },
  logistics_lead: {
    role: "logistics_lead",
    dashboards: [
      "/atlas",
      "/atlas/traffic",
      "/atlas/vendor-sales",
      "/atlas/logistics",
      "/atlas/vendor-analytics",
      "/atlas/hierarchical-referral-admin",
      "/atlas/top-viewed",
      "/atlas/top-searched",
      "/atlas/popular-cart-items",
    ],
    canManageTeam: false,
  },
};

/**
 * Registration data interface for creating new Atlas users
 */
export interface AtlasRegistrationData {
  /** User's full name */
  fullName: string;
  
  /** User email address (must be authorized domain) */
  email: string;
  
  /** User password */
  password: string;
  
  /** Password confirmation */
  confirmPassword: string;
}

/**
 * Login credentials interface for Atlas authentication
 */
export interface AtlasLoginCredentials {
  /** User email address */
  email: string;
  
  /** User password */
  password: string;
}

/**
 * Invitation data interface for creating new team member invitations
 */
export interface InvitationData {
  /** Invitee's full name */
  fullName: string;
  
  /** Invitee's email address */
  email: string;
  
  /** Role to be assigned to the invitee */
  role: AtlasRole;
  
  /** UID of Super Admin sending the invitation */
  invitedBy: string;
}

/**
 * Invitation token interface for validating invitation links
 */
export interface InvitationToken {
  /** Unique invitation token */
  token: string;
  
  /** Email address associated with the invitation */
  email: string;
  
  /** Expiration timestamp for the invitation */
  expiresAt: Timestamp;
}

/**
 * Authorized email domains for Atlas access
 */
export const AUTHORIZED_DOMAINS = [
  "@stitchesafrica.com",
  "@stitchesafrica.pro"
] as const;

/**
 * Type for authorized email domains
 */
export type AuthorizedDomain = typeof AUTHORIZED_DOMAINS[number];
