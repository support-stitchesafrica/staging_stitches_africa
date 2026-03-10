/**
 * Unified Back Office Invitation Service
 * Handles invitation creation, validation, and acceptance workflow
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 17.5
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { BackOfficeInvitation, BackOfficeRole, Department, InvitationError } from '@/types/backoffice';
import { PermissionService } from './permission-service';
import { UserService } from './user-service';
import crypto from 'crypto';

// Constants
const COLLECTION_NAME = 'backoffice_invitations';
const INVITATION_EXPIRY_DAYS = 7; // 7 days expiration
const TOKEN_LENGTH = 64; // Length of secure random token

/**
 * Unified Back Office Invitation Service
 */
export class InvitationService {
  /**
   * Generate a unique secure token for invitation
   * Requirement: 2.1 - Generate unique invitation token
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
  }

  /**
   * Hash token for storage (security best practice)
   */
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new invitation
   * Requirement: 2.1 - Administrator creates invitation with unique token
   * Requirement: 2.2 - Send email with acceptance link
   */
  static async createInvitation(
    email: string,
    role: BackOfficeRole,
    invitedBy: string,
    invitedByName: string
  ): Promise<{ invitation: BackOfficeInvitation; token: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Check if user already exists
      const existingUser = await UserService.getUserByEmail(email);
      if (existingUser) {
        throw new Error(InvitationError.EMAIL_ALREADY_EXISTS);
      }

      // Check for existing pending invitation
      const existingInvitation = await this.getInvitationByEmail(email);
      if (existingInvitation && existingInvitation.status === 'pending') {
        // Auto-expire the old invitation and create a new one
        await this.expireInvitation(existingInvitation.id);
      }

      // Generate unique token
      const token = this.generateSecureToken();
      const hashedToken = this.hashToken(token);

      // Get permissions and departments for the role
      const permissions = PermissionService.getRolePermissions(role);
      const departments: Department[] = [];
      for (const [dept, perms] of Object.entries(permissions)) {
        if (perms.read || perms.write || perms.delete) {
          departments.push(dept as Department);
        }
      }

      const now = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(
        now.toMillis() + (INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      );

      // Create invitation document
      const invitationId = adminDb.collection(COLLECTION_NAME).doc().id;
      const invitation: BackOfficeInvitation = {
        id: invitationId,
        email,
        role,
        departments,
        token: hashedToken, // Store hashed token
        status: 'pending',
        invitedBy,
        invitedByName,
        createdAt: now,
        expiresAt,
      };

      // Save to Firestore
      await adminDb.collection(COLLECTION_NAME).doc(invitationId).set(invitation);

      // Return invitation with plain token (for email link)
      return {
        invitation,
        token, // Return unhashed token for email link
      };
    } catch (error) {
      console.error('Error creating invitation:', error);
      
      if (error instanceof Error) {
        if (error.message === InvitationError.EMAIL_ALREADY_EXISTS) {
          throw error;
        }
        throw new Error(`${InvitationError.CREATION_FAILED}: ${error.message}`);
      }
      
      throw new Error(InvitationError.CREATION_FAILED);
    }
  }

  /**
   * Validate invitation token and check expiration
   * Requirement: 2.3 - Validate token and display acceptance form
   * Requirement: 2.5 - Prevent acceptance of expired invitations
   */
  static async validateInvitation(token: string): Promise<{
    isValid: boolean;
    invitation?: BackOfficeInvitation;
    error?: string;
  }> {
    try {
      // Hash the provided token to match stored hash
      const hashedToken = this.hashToken(token);

      // Find invitation by hashed token
      const querySnapshot = await adminDb
        .collection(COLLECTION_NAME)
        .where('token', '==', hashedToken)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return {
          isValid: false,
          error: InvitationError.INVALID_TOKEN,
        };
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const invitation: BackOfficeInvitation = {
        id: doc.id,
        email: data.email,
        role: data.role,
        departments: data.departments,
        token: data.token,
        status: data.status,
        invitedBy: data.invitedBy,
        invitedByName: data.invitedByName,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        acceptedAt: data.acceptedAt,
      };

      // Check if already accepted
      if (invitation.status === 'accepted') {
        return {
          isValid: false,
          error: InvitationError.ALREADY_ACCEPTED,
        };
      }

      // Check if expired
      if (invitation.expiresAt.toMillis() < Date.now()) {
        // Update status to expired
        await this.expireInvitation(invitation.id);
        
        return {
          isValid: false,
          error: InvitationError.EXPIRED_TOKEN,
        };
      }

      // Check if manually expired
      if (invitation.status === 'expired') {
        return {
          isValid: false,
          error: InvitationError.EXPIRED_TOKEN,
        };
      }

      return {
        isValid: true,
        invitation,
      };
    } catch (error) {
      console.error('Error validating invitation:', error);
      return {
        isValid: false,
        error: InvitationError.INVALID_TOKEN,
      };
    }
  }

  /**
   * Accept invitation and create user account
   * Requirement: 2.4 - Create account with assigned role and permissions
   */
  static async acceptInvitation(
    token: string,
    fullName: string,
    password: string
  ): Promise<BackOfficeInvitation> {
    try {
      // Validate invitation
      const validation = await this.validateInvitation(token);
      
      if (!validation.isValid || !validation.invitation) {
        throw new Error(validation.error || InvitationError.INVALID_TOKEN);
      }

      const invitation = validation.invitation;

      // Create user account
      await UserService.createUser(
        invitation.email,
        password,
        fullName,
        invitation.role,
        invitation.invitedBy
      );

      // Mark invitation as accepted
      const now = Timestamp.now();
      await adminDb.collection(COLLECTION_NAME).doc(invitation.id).update({
        status: 'accepted',
        acceptedAt: now,
      });

      return {
        ...invitation,
        status: 'accepted',
        acceptedAt: now,
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to accept invitation');
    }
  }

  /**
   * Get invitations by status
   * Requirement: 17.5 - View pending, accepted, and expired invitations
   */
  static async getInvitationsByStatus(
    status: 'pending' | 'accepted' | 'expired'
  ): Promise<BackOfficeInvitation[]> {
    try {
      const querySnapshot = await adminDb
        .collection(COLLECTION_NAME)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .get();

      const invitations: BackOfficeInvitation[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        invitations.push({
          id: doc.id,
          email: data.email,
          role: data.role,
          departments: data.departments,
          token: data.token,
          status: data.status,
          invitedBy: data.invitedBy,
          invitedByName: data.invitedByName,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          acceptedAt: data.acceptedAt,
        });
      });

      return invitations;
    } catch (error) {
      console.error('Error getting invitations by status:', error);
      throw new Error(`Failed to get invitations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Expire old invitations
   * Requirement: 2.5 - Mark expired invitations
   */
  static async expireOldInvitations(): Promise<number> {
    try {
      const now = Timestamp.now();
      
      // Find all pending invitations that have expired
      const querySnapshot = await adminDb
        .collection(COLLECTION_NAME)
        .where('status', '==', 'pending')
        .where('expiresAt', '<', now)
        .get();

      let expiredCount = 0;

      // Update each expired invitation
      const batch = adminDb.batch();
      querySnapshot.forEach(doc => {
        batch.update(doc.ref, { status: 'expired' });
        expiredCount++;
      });

      if (expiredCount > 0) {
        await batch.commit();
      }

      return expiredCount;
    } catch (error) {
      console.error('Error expiring old invitations:', error);
      throw new Error(`Failed to expire invitations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get invitation by email
   * Helper method to check for existing invitations
   */
  static async getInvitationByEmail(email: string): Promise<BackOfficeInvitation | null> {
    try {
      const querySnapshot = await adminDb
        .collection(COLLECTION_NAME)
        .where('email', '==', email)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        departments: data.departments,
        token: data.token,
        status: data.status,
        invitedBy: data.invitedBy,
        invitedByName: data.invitedByName,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        acceptedAt: data.acceptedAt,
      };
    } catch (error) {
      console.error('Error getting invitation by email:', error);
      return null;
    }
  }

  /**
   * Get invitation by ID
   */
  static async getInvitationById(id: string): Promise<BackOfficeInvitation | null> {
    try {
      const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }

      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        departments: data.departments,
        token: data.token,
        status: data.status,
        invitedBy: data.invitedBy,
        invitedByName: data.invitedByName,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        acceptedAt: data.acceptedAt,
      };
    } catch (error) {
      console.error('Error getting invitation by ID:', error);
      return null;
    }
  }

  /**
   * Get all invitations (for superadmin)
   */
  static async getAllInvitations(): Promise<BackOfficeInvitation[]> {
    try {
      const querySnapshot = await adminDb
        .collection(COLLECTION_NAME)
        .orderBy('createdAt', 'desc')
        .get();

      const invitations: BackOfficeInvitation[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        invitations.push({
          id: doc.id,
          email: data.email,
          role: data.role,
          departments: data.departments,
          token: data.token,
          status: data.status,
          invitedBy: data.invitedBy,
          invitedByName: data.invitedByName,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          acceptedAt: data.acceptedAt,
        });
      });

      return invitations;
    } catch (error) {
      console.error('Error getting all invitations:', error);
      throw new Error(`Failed to get invitations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get invitations created by a specific user
   */
  static async getInvitationsByInviter(invitedBy: string): Promise<BackOfficeInvitation[]> {
    try {
      const querySnapshot = await adminDb
        .collection(COLLECTION_NAME)
        .where('invitedBy', '==', invitedBy)
        .orderBy('createdAt', 'desc')
        .get();

      const invitations: BackOfficeInvitation[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        invitations.push({
          id: doc.id,
          email: data.email,
          role: data.role,
          departments: data.departments,
          token: data.token,
          status: data.status,
          invitedBy: data.invitedBy,
          invitedByName: data.invitedByName,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          acceptedAt: data.acceptedAt,
        });
      });

      return invitations;
    } catch (error) {
      console.error('Error getting invitations by inviter:', error);
      throw new Error(`Failed to get invitations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Expire a specific invitation
   */
  static async expireInvitation(id: string): Promise<void> {
    try {
      await adminDb.collection(COLLECTION_NAME).doc(id).update({
        status: 'expired',
      });
    } catch (error) {
      console.error('Error expiring invitation:', error);
      throw new Error(`Failed to expire invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an invitation (permanent removal)
   */
  static async deleteInvitation(id: string): Promise<void> {
    try {
      await adminDb.collection(COLLECTION_NAME).doc(id).delete();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw new Error(`Failed to delete invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate invitation link
   */
  static generateInvitationLink(token: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${base}/backoffice/accept-invitation/${token}`;
  }

  /**
   * Resend invitation (creates new token, expires old one)
   */
  static async resendInvitation(
    invitationId: string,
    invitedBy: string,
    invitedByName: string
  ): Promise<{ invitation: BackOfficeInvitation; token: string }> {
    try {
      // Get existing invitation
      const existingInvitation = await this.getInvitationById(invitationId);
      
      if (!existingInvitation) {
        throw new Error(InvitationError.INVITATION_NOT_FOUND);
      }

      if (existingInvitation.status === 'accepted') {
        throw new Error(InvitationError.ALREADY_ACCEPTED);
      }

      // Expire old invitation
      await this.expireInvitation(invitationId);

      // Create new invitation with same details
      return await this.createInvitation(
        existingInvitation.email,
        existingInvitation.role,
        invitedBy,
        invitedByName
      );
    } catch (error) {
      console.error('Error resending invitation:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to resend invitation');
    }
  }
}
