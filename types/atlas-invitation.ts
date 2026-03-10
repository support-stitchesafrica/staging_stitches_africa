/**
 * Atlas Dashboard Invitation Types
 * Data models for the unified invitation system
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Invitation status enum
 */
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

/**
 * Atlas user roles
 */
export type AtlasRole = 
  | 'superadmin' 
  | 'founder' 
  | 'sales_lead' 
  | 'brand_lead' 
  | 'logistics_lead';

/**
 * Atlas invitation record stored in Firestore
 */
export interface AtlasInvitation {
  id: string;                    // Document ID
  email: string;                 // Invited email (lowercase, trimmed)
  name: string;                  // Invitee's full name
  role: AtlasRole;               // Assigned role
  invitedByUserId: string;       // UID of Super Admin
  status: InvitationStatus;      // Current invitation status
  token: string;                 // JWT token
  expiresAt: Timestamp;          // Expiration date (7 days)
  createdAt: Timestamp;          // Creation timestamp
  acceptedAt?: Timestamp;        // Acceptance timestamp
  acceptedByUid?: string;        // Firebase UID of user who accepted
}

/**
 * Data required to create a new invitation
 */
export interface CreateAtlasInvitationData {
  name: string;
  email: string;
  role: AtlasRole;
  invitedByUserId: string;
}

/**
 * Result of invitation validation
 */
export interface AtlasInvitationValidationResult {
  isValid: boolean;
  invitation?: AtlasInvitation;
  error?: string;
  errorCode?: 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_USED' | 'INVALID_TOKEN' | 'INVALID_DOMAIN';
}

/**
 * Data required to accept an invitation
 */
export interface AcceptAtlasInvitationData {
  token: string;
  firebaseUid: string;  // From Firebase Auth after login/signup
}

/**
 * JWT token payload for invitation
 */
export interface AtlasInvitationTokenPayload {
  inviteId: string;      // Firestore document ID
  email: string;         // Invited email
  role: AtlasRole;       // Assigned role
  system: 'atlas';       // System identifier
  exp: number;           // Expiration timestamp (seconds)
  iat: number;           // Issued at timestamp (seconds)
  jti: string;           // Unique token ID
}
