// lib/marketing/types.ts

/**
 * Marketing Dashboard Type Definitions
 */

export type MarketingRole = 'super_admin' | 'team_lead' | 'bdm' | 'team_member';

export interface MarketingUser {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  role: MarketingRole;
  teamId?: string;
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  lastLoginAt?: any; // Firestore Timestamp
  profileImage?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'invitation' | 'vendor_assignment' | 'vendor_reassignment' | 'system_alert' | 'role_change' | 'team_assignment' | 'task_update' | 'task_assignment' | 'task_reminder';
  title: string;
  message: string;
  read: boolean;
  actionLink?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  createdAt: any; // Firestore Timestamp
  readAt?: any; // Firestore Timestamp
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: {
    invitations: boolean;
    vendorAssignments: boolean;
    vendorReassignments: boolean;
    systemAlerts: boolean;
    roleChanges: boolean;
    teamAssignments: boolean;
    taskUpdates: boolean;
    taskAssignments: boolean;
  };
  inAppNotifications: {
    invitations: boolean;
    vendorAssignments: boolean;
    vendorReassignments: boolean;
    systemAlerts: boolean;
    roleChanges: boolean;
    teamAssignments: boolean;
    taskUpdates: boolean;
    taskAssignments: boolean;
  };
  updatedAt: any; // Firestore Timestamp
}

export type AssignmentStatus = 'active' | 'completed' | 'cancelled';

export interface VendorAssignment {
  id: string;
  vendorId: string;
  vendorName: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignedBy: string;
  assignedByName: string;
  assignedAt: any; // Firestore Timestamp
  status: AssignmentStatus;
  notes?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
