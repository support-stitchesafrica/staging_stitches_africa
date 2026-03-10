import { Timestamp } from 'firebase/firestore';

/**
 * Unified Back Office User Roles
 * Preserves all existing roles from Atlas, Promotional, Collections, Marketing, and Admin systems
 */
export type BackOfficeRole = 
  // Top Level Access
  | 'superadmin'           // Full system access (all systems)
  | 'founder'              // Executive overview (Atlas)
  
  // Analytics/Atlas Leads
  | 'bdm'                  // Business Development Manager (merged with sales_lead - sales analytics + vendor management)
  | 'brand_lead'           // Brand/products analytics access
  | 'logistics_lead'       // Logistics analytics access
  
  // Marketing Roles
  | 'marketing_manager'    // Marketing team lead (formerly team_lead)
  | 'marketing_member'     // Marketing team member
  
  // Content Management Roles
  | 'admin'                // Department admin (Promotional/Admin systems)
  | 'editor'               // Content editor (Promotional/Collections)
  | 'viewer';              // Read-only access (Collections)

/**
 * Department Types
 */
export type Department = 
  | 'analytics'
  | 'promotions'
  | 'collections'
  | 'marketing'
  | 'admin';

/**
 * Permission Level
 */
export interface PermissionLevel {
  read: boolean;
  write: boolean;
  delete: boolean;
}

/**
 * Department Permissions
 */
export interface DepartmentPermissions {
  analytics: PermissionLevel;
  promotions: PermissionLevel;
  collections: PermissionLevel;
  marketing: PermissionLevel;
  admin: PermissionLevel;
}

/**
 * Unified Back Office User
 */
export interface BackOfficeUser {
  uid: string;
  email: string;
  fullName: string;
  role: BackOfficeRole;
  departments: Department[];
  permissions: DepartmentPermissions;
  teamId?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  invitedBy?: string;
  lastLogin?: Timestamp;
  migratedFrom?: {
    system: 'atlas' | 'promotional' | 'collections' | 'marketing' | 'admin';
    originalUid: string;
    migratedAt: Timestamp;
  };
}

/**
 * Back Office Invitation
 */
export interface BackOfficeInvitation {
  id: string;
  email: string;
  role: BackOfficeRole;
  departments: Department[];
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
  invitedByName: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
}

/**
 * Navigation Item
 */
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  department: Department;
  children?: NavSubItem[];
}

/**
 * Navigation Sub Item
 */
export interface NavSubItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  requiredPermission?: keyof PermissionLevel;
}

/**
 * Role Permission Presets
 * Maps all 10 unified roles to their appropriate department permissions
 * Note: Sales Lead has been merged into BDM role
 */
export const ROLE_PERMISSIONS: Record<BackOfficeRole, DepartmentPermissions> = {
  // Top Level - Full Access
  superadmin: {
    analytics: { read: true, write: true, delete: true },
    promotions: { read: true, write: true, delete: true },
    collections: { read: true, write: true, delete: true },
    marketing: { read: true, write: true, delete: true },
    admin: { read: true, write: true, delete: true },
  },
  
  // Executive - Overview Access
  founder: {
    analytics: { read: true, write: false, delete: false }, // Overview, sales, products
    promotions: { read: true, write: false, delete: false },
    collections: { read: true, write: false, delete: false },
    marketing: { read: true, write: false, delete: false },
    admin: { read: false, write: false, delete: false },
  },
  
  // Analytics Leads - Specific Dashboard Access
  bdm: {
    analytics: { read: true, write: true, delete: false }, // Sales analytics + vendor management
    promotions: { read: true, write: false, delete: false },
    collections: { read: false, write: false, delete: false },
    marketing: { read: true, write: true, delete: false }, // Marketing + vendor management
    admin: { read: false, write: false, delete: false },
  },
  
  brand_lead: {
    analytics: { read: true, write: true, delete: false }, // Products dashboard only
    promotions: { read: true, write: false, delete: false },
    collections: { read: false, write: false, delete: false },
    marketing: { read: false, write: false, delete: false },
    admin: { read: false, write: false, delete: false },
  },
  
  logistics_lead: {
    analytics: { read: true, write: true, delete: false }, // Logistics dashboard only
    promotions: { read: false, write: false, delete: false },
    collections: { read: false, write: false, delete: false },
    marketing: { read: false, write: false, delete: false },
    admin: { read: false, write: false, delete: false },
  },
  
  // Marketing Roles
  marketing_manager: {
    analytics: { read: true, write: false, delete: false },
    promotions: { read: true, write: false, delete: false },
    collections: { read: false, write: false, delete: false },
    marketing: { read: true, write: true, delete: true }, // Full marketing access
    admin: { read: false, write: false, delete: false },
  },
  
  marketing_member: {
    analytics: { read: true, write: false, delete: false },
    promotions: { read: false, write: false, delete: false },
    collections: { read: false, write: false, delete: false },
    marketing: { read: true, write: true, delete: false }, // Own assignments only
    admin: { read: false, write: false, delete: false },
  },
  
  // Content Management Roles
  admin: {
    analytics: { read: true, write: false, delete: false },
    promotions: { read: true, write: true, delete: true }, // Promotional admin
    collections: { read: true, write: true, delete: false },
    marketing: { read: false, write: false, delete: false },
    admin: { read: true, write: true, delete: false }, // Admin dashboard
  },
  
  editor: {
    analytics: { read: true, write: false, delete: false },
    promotions: { read: true, write: true, delete: false }, // Can edit events
    collections: { read: true, write: true, delete: false }, // Can edit collections
    marketing: { read: false, write: false, delete: false },
    admin: { read: false, write: false, delete: false },
  },
  
  viewer: {
    analytics: { read: true, write: false, delete: false },
    promotions: { read: true, write: false, delete: false },
    collections: { read: true, write: false, delete: false }, // Read-only collections
    marketing: { read: false, write: false, delete: false },
    admin: { read: false, write: false, delete: false },
  },
};

/**
 * Authentication Errors
 */
export enum AuthError {
  INVALID_CREDENTIALS = 'Invalid email or password',
  USER_NOT_FOUND = 'User not found',
  USER_INACTIVE = 'Account is inactive',
  SESSION_EXPIRED = 'Session has expired',
  UNAUTHORIZED = 'Unauthorized access',
  AUTHENTICATION_REQUIRED = 'Authentication required',
}

/**
 * Invitation Errors
 */
export enum InvitationError {
  INVALID_TOKEN = 'Invalid invitation token',
  EXPIRED_TOKEN = 'Invitation has expired',
  ALREADY_ACCEPTED = 'Invitation already accepted',
  EMAIL_ALREADY_EXISTS = 'User with this email already exists',
  INVITATION_NOT_FOUND = 'Invitation not found',
  CREATION_FAILED = 'Failed to create invitation',
}

/**
 * Permission Errors
 */
export enum PermissionError {
  NO_DEPARTMENT_ACCESS = 'No access to this department',
  INSUFFICIENT_PERMISSIONS = 'Insufficient permissions for this action',
  READ_ONLY_ACCESS = 'Read-only access - cannot modify',
  DELETE_NOT_ALLOWED = 'Delete permission not granted',
  UNAUTHORIZED_ROUTE = 'Unauthorized to access this route',
}

/**
 * Migration Errors
 */
export enum MigrationError {
  USER_ALREADY_MIGRATED = 'User already migrated',
  INVALID_ROLE_MAPPING = 'Cannot map role to unified system',
  MIGRATION_FAILED = 'Migration failed for user',
  SOURCE_USER_NOT_FOUND = 'Source user not found in legacy system',
  INVALID_SOURCE_SYSTEM = 'Invalid source system specified',
}
