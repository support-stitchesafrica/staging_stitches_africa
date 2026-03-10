/**
 * Promotional Events Invitation Service
 * Handles invitation creation, validation, and acceptance workflow
 * Following the Collections/Marketing dashboard pattern
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/firebase';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { generateInvitationToken } from '@/lib/utils/token-generator';
import { validateInvitationToken } from '@/lib/utils/token-validator';
import type { 
  PromotionalInvitation, 
  CreatePromotionalInvitationData,
  PromotionalRole
} from '@/types/promotionals';

// Invitation validation result interface
export interface InvitationValidationResult {
  isValid: boolean;
  invitation?: PromotionalInvitation;
  error?: string;
  errorCode?: 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_USED' | 'INVALID_TOKEN';
}

// Constants
const INVITATION_EXPIRY_DAYS = 7; // 7 days
const COLLECTIONS = {
  INVITATIONS: 'promotionalInvitations'
} as const;

/**
 * Promotional Events Invitation Service
 */
export class PromotionalInvitationService {
  /**
   * Safely decode URL-encoded token, handling both encoded and non-encoded tokens
   */
  private static safeDecodeToken(token: string): string {
    try {
      const decoded = decodeURIComponent(token);
      return decoded !== token ? decoded : token;
    } catch (error) {
      return token;
    }
  }

  /**
   * Generate a secure invitation token using centralized generator
   */
  private static generateSecureToken(inviteData: {
    inviteId: string;
    email: string;
    role: string;
    expiresAt: number;
  }): string {
    return generateInvitationToken({
      inviteId: inviteData.inviteId,
      email: inviteData.email,
      role: inviteData.role,
      system: 'promotionals',
      expiresAt: inviteData.expiresAt
    });
  }

  /**
   * Check if email exists in Firebase Auth
   */
  static async checkEmailExists(email: string): Promise<boolean> {
    try {
      const auth = getAuth();
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      return signInMethods.length > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  }

  /**
   * Create a new invitation
   */
  static async createInvitation(data: CreatePromotionalInvitationData): Promise<PromotionalInvitation> {
    // Normalize email
    const normalizedEmail = data.email.toLowerCase().trim();

    // Check if invitation already exists for this email
    const existingInvite = await this.getInvitationByEmail(normalizedEmail);
    if (existingInvite && existingInvite.status === 'pending') {
      throw new Error('An active invitation already exists for this email');
    }

    // Generate invitation ID and expiration
    const inviteId = doc(collection(db, COLLECTIONS.INVITATIONS)).id;
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(
      now.toMillis() + (INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    );

    // Generate secure token
    const token = this.generateSecureToken({
      inviteId,
      email: normalizedEmail,
      role: data.role,
      expiresAt: expiresAt.toMillis()
    });

    // Create invitation object
    const invitation: PromotionalInvitation = {
      id: inviteId,
      email: normalizedEmail,
      role: data.role,
      token,
      status: 'pending',
      invitedBy: data.invitedBy,
      invitedByName: data.invitedByName,
      createdAt: now,
      expiresAt
    };

    // Save to Firestore
    await setDoc(doc(db, COLLECTIONS.INVITATIONS, inviteId), invitation);

    return invitation;
  }

  /**
   * Validate invitation token and return invitation data
   * Uses centralized token validator for consistency
   */
  static async validateInvitation(token: string): Promise<InvitationValidationResult> {
    try {
      // Decode URL-encoded token if needed
      const decodedToken = this.safeDecodeToken(token);
      
      // Verify JWT token using centralized validator
      const validation = validateInvitationToken(decodedToken, 'promotionals');
      
      if (!validation.success || !validation.payload) {
        return {
          isValid: false,
          error: validation.error || 'Invalid or malformed token',
          errorCode: validation.errorType === 'EXPIRED' ? 'EXPIRED' : 
                     validation.errorType === 'INVALID_SIGNATURE' || validation.errorType === 'MALFORMED' ? 'INVALID_TOKEN' :
                     'INVALID_TOKEN'
        };
      }

      const decoded = validation.payload;
      
      // Get invitation from database
      const inviteDoc = await getDoc(doc(db, COLLECTIONS.INVITATIONS, decoded.inviteId));
      
      if (!inviteDoc.exists()) {
        return {
          isValid: false,
          error: 'Invitation not found',
          errorCode: 'NOT_FOUND'
        };
      }

      const invitation = { id: inviteDoc.id, ...inviteDoc.data() } as PromotionalInvitation;

      // Check if invitation is already used
      if (invitation.status === 'accepted') {
        return {
          isValid: false,
          error: 'This invitation has already been used',
          errorCode: 'ALREADY_USED'
        };
      }

      // Check if invitation is expired
      if (invitation.expiresAt.toMillis() < Date.now()) {
        // Update status to expired
        await updateDoc(doc(db, COLLECTIONS.INVITATIONS, invitation.id), {
          status: 'expired'
        });

        return {
          isValid: false,
          error: 'This invitation has expired. Please request a new invitation.',
          errorCode: 'EXPIRED'
        };
      }

      // Verify token data matches invitation
      if (decoded.email !== invitation.email || decoded.role !== invitation.role) {
        return {
          isValid: false,
          error: 'Invalid token data',
          errorCode: 'INVALID_TOKEN'
        };
      }

      return {
        isValid: true,
        invitation
      };
    } catch (error) {
      console.error('[Promotional Invitation Service] Validation error:', error);
      return {
        isValid: false,
        error: 'Invalid or malformed token',
        errorCode: 'INVALID_TOKEN'
      };
    }
  }

  /**
   * Accept an invitation and mark it as used
   */
  static async acceptInvitation(token: string, acceptedByUid?: string): Promise<PromotionalInvitation> {
    // Decode URL-encoded token if needed
    const decodedToken = this.safeDecodeToken(token);
    const validation = await this.validateInvitation(decodedToken);
    
    if (!validation.isValid || !validation.invitation) {
      throw new Error(validation.error || 'Invalid invitation');
    }

    const invitation = validation.invitation;

    // Mark invitation as accepted
    const now = Timestamp.now();
    await updateDoc(doc(db, COLLECTIONS.INVITATIONS, invitation.id), {
      status: 'accepted',
      acceptedAt: now
    });

    return {
      ...invitation,
      status: 'accepted',
      acceptedAt: now
    };
  }

  /**
   * Get invitation by email
   */
  static async getInvitationByEmail(email: string): Promise<PromotionalInvitation | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const q = query(
      collection(db, COLLECTIONS.INVITATIONS),
      where('email', '==', normalizedEmail),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PromotionalInvitation;
  }

  /**
   * Get invitation by ID
   */
  static async getInvitationById(id: string): Promise<PromotionalInvitation | null> {
    const inviteDoc = await getDoc(doc(db, COLLECTIONS.INVITATIONS, id));
    
    if (!inviteDoc.exists()) {
      return null;
    }

    return { id: inviteDoc.id, ...inviteDoc.data() } as PromotionalInvitation;
  }

  /**
   * Revoke an invitation
   */
  static async revokeInvitation(id: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.INVITATIONS, id), {
      status: 'expired' // Using 'expired' since PromotionalInvitationStatus doesn't have 'revoked'
    });
  }

  /**
   * Delete an invitation (permanent removal)
   */
  static async deleteInvitation(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.INVITATIONS, id));
  }

  /**
   * Get all invitations
   */
  static async getAllInvitations(): Promise<PromotionalInvitation[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.INVITATIONS));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PromotionalInvitation[];
  }

  /**
   * Get invitations by status
   */
  static async getInvitationsByStatus(status: PromotionalInvitation['status']): Promise<PromotionalInvitation[]> {
    const q = query(
      collection(db, COLLECTIONS.INVITATIONS),
      where('status', '==', status)
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PromotionalInvitation[];
  }

  /**
   * Get invitations created by a specific user
   */
  static async getInvitationsByInviter(invitedBy: string): Promise<PromotionalInvitation[]> {
    const q = query(
      collection(db, COLLECTIONS.INVITATIONS),
      where('invitedBy', '==', invitedBy)
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PromotionalInvitation[];
  }

  /**
   * Clean up expired invitations
   */
  static async cleanupExpiredInvitations(): Promise<number> {
    const now = Timestamp.now();
    const q = query(
      collection(db, COLLECTIONS.INVITATIONS),
      where('status', '==', 'pending'),
      where('expiresAt', '<', now)
    );

    const querySnapshot = await getDocs(q);
    let cleanedCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      await updateDoc(docSnapshot.ref, { status: 'expired' });
      cleanedCount++;
    }

    return cleanedCount;
  }

  /**
   * Generate invitation link
   */
  static generateInvitationLink(token: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${base}/promotionals/invite/${token}`;
  }

  /**
   * Check if user has permission to create invitations
   */
  static canCreateInvitation(userRole: PromotionalRole): boolean {
    return userRole === 'superadmin';
  }

  /**
   * Check if user can manage invitations
   */
  static canManageInvitations(userRole: PromotionalRole): boolean {
    return userRole === 'superadmin';
  }
}

// Export utility functions
export const promotionalInvitationUtils = {
  generateInvitationLink: PromotionalInvitationService.generateInvitationLink,
  canCreateInvitation: PromotionalInvitationService.canCreateInvitation,
  canManageInvitations: PromotionalInvitationService.canManageInvitations,
  checkEmailExists: PromotionalInvitationService.checkEmailExists
};

// Export error types for better error handling
export class PromotionalInvitationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'PromotionalInvitationError';
  }
}

export const PromotionalInvitationErrorCodes = {
  INVITATION_EXISTS: 'INVITATION_EXISTS',
  NOT_FOUND: 'NOT_FOUND',
  EXPIRED: 'EXPIRED',
  ALREADY_USED: 'ALREADY_USED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
} as const;
