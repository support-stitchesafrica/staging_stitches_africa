/**
 * Collections Dashboard Invitation Types
 * Data models for the unified invitation system
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Invitation status enum
 */
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

/**
 * Collections user roles
 */
export type CollectionsRole = 'admin' | 'editor';

/**
 * Collections invitation record stored in Firestore
 */
export interface CollectionsInvitation {
  id: string;                    // Document ID
  email: string;                 // Invited email (lowercase, trimmed)
  name: string;                  // Invitee's full name
  role: CollectionsRole;         // Assigned role
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
export interface CreateCollectionsInvitationData {
  name: string;
  email: string;
  role: CollectionsRole;
  invitedByUserId: string;
}

/**
 * Result of invitation validation
 */
export interface CollectionsInvitationValidationResult {
  isValid: boolean;
  invitation?: CollectionsInvitation;
  error?: string;
  errorCode?: 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_USED' | 'INVALID_TOKEN';
}

/**
 * Data required to accept an invitation
 */
export interface AcceptCollectionsInvitationData {
  token: string;
  firebaseUid: string;  // From Firebase Auth after login/signup
}

/**
 * JWT token payload for invitation
 */
export interface CollectionsInvitationTokenPayload {
  inviteId: string;      // Firestore document ID
  email: string;         // Invited email
  role: CollectionsRole; // Assigned role
  system: 'collections'; // System identifier
  exp: number;           // Expiration timestamp (seconds)
  iat: number;           // Issued at timestamp (seconds)
  jti: string;           // Unique token ID
}
