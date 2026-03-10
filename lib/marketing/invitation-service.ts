/**
 * Marketing Dashboard Invitation Service
 * Handles invitation creation, validation, and acceptance workflow
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { sign, verify } from 'jsonwebtoken';
import { isValidCompanyEmail } from './domain-validator';
import { ActivityLogServiceAdmin } from './activity-log-service-admin';
import { SecureTokenGenerator } from './password-validator';

// Types
export interface Invitation {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'team_lead' | 'bdm' | 'team_member';
  invitedByUserId: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
}

export interface CreateInvitationData {
  name: string;
  email: string;
  role: 'super_admin' | 'team_lead' | 'bdm' | 'team_member';
  invitedByUserId: string;
}

export interface InvitationValidationResult {
  isValid: boolean;
  invitation?: Invitation;
  error?: string;
  errorCode?: 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_USED' | 'INVALID_TOKEN' | 'INVALID_DOMAIN';
}

export interface AcceptInvitationData {
  token: string;
  userData?: {
    name: string;
    password: string;
  };
}

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'marketing-dashboard-secret';
const INVITATION_EXPIRY_HOURS = 72; // 3 days
const COLLECTIONS = {
  INVITATIONS: 'marketing_invitations'
} as const;

// Validation constants
const VALID_ROLES = ['super_admin', 'team_lead', 'bdm', 'team_member'] as const;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;

/**
 * Marketing Dashboard Invitation Service
 */
export class InvitationService {
  /**
   * Validate invitation data
   */
  private static validateInvitationData(data: CreateInvitationData): { valid: boolean; error?: string } {
    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      return { valid: false, error: 'Name is required' };
    }

    if (data.name.trim().length < MIN_NAME_LENGTH) {
      return { valid: false, error: `Name must be at least ${MIN_NAME_LENGTH} characters` };
    }

    if (data.name.trim().length > MAX_NAME_LENGTH) {
      return { valid: false, error: `Name must be less than ${MAX_NAME_LENGTH} characters` };
    }

    // Validate email format
    if (!data.email || data.email.trim().length === 0) {
      return { valid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    // Validate email domain
    if (!isValidCompanyEmail(data.email)) {
      return { valid: false, error: 'Only company emails (@stitchesafrica.com, @stitchesafrica.pro) are allowed' };
    }

    // Validate role
    if (!data.role || !VALID_ROLES.includes(data.role)) {
      return { valid: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` };
    }

    // Validate invitedByUserId
    if (!data.invitedByUserId || data.invitedByUserId.trim().length === 0) {
      return { valid: false, error: 'Invited by user ID is required' };
    }

    return { valid: true };
  }

  /**
   * Check for duplicate invitations
   * Note: Users can exist in Firebase Auth (e.g., on Atlas/Collections) and still be invited to Marketing
   */
  private static async checkDuplicateInvitation(email: string): Promise<{ hasDuplicate: boolean; invitation?: Invitation; reason?: string }> {
    // Check for pending invitations
    const existingInvite = await this.getInvitationByEmail(email);
    
    if (existingInvite && existingInvite.status === 'pending') {
      return { 
        hasDuplicate: true, 
        invitation: existingInvite,
        reason: 'pending_invitation'
      };
    }

    // Check if user already exists in marketing_users collection
    // Marketing users are stored by UID, so we need to query by email
    try {
      const marketingUsersSnapshot = await adminDb.collection("staging_marketing_users")
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!marketingUsersSnapshot.empty) {
        return { 
          hasDuplicate: true,
          reason: 'already_marketing_user',
        };
      }
    } catch (error) {
      console.error('Error checking marketing user:', error);
      // Continue if check fails - better to allow invitation than block incorrectly
    }

    return { hasDuplicate: false };
  }

  /**
   * Generate a secure invitation token
   */
  private static generateSecureToken(inviteData: {
    inviteId: string;
    email: string;
    role: string;
    expiresAt: number;
  }): string {
    const payload = {
      inviteId: inviteData.inviteId,
      email: inviteData.email,
      role: inviteData.role,
      system: 'marketing', // Identify this as a marketing invitation
      exp: Math.floor(inviteData.expiresAt / 1000), // JWT expects seconds
      iat: Math.floor(Date.now() / 1000),
      jti: SecureTokenGenerator.generateToken(16) // Unique token ID
    };

    return sign(payload, JWT_SECRET, { algorithm: 'HS256' });
  }

  /**
   * Verify and decode invitation token
   */
  private static verifyToken(token: string): any {
    try {
      return verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Create a new invitation
   */
  static async createInvitation(data: CreateInvitationData): Promise<Invitation> {
    // Validate invitation data
    const validation = this.validateInvitationData(data);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid invitation data');
    }

    // Check for duplicate invitations
    const duplicateCheck = await this.checkDuplicateInvitation(data.email);
    if (duplicateCheck.hasDuplicate) {
      if (duplicateCheck.reason === 'pending_invitation') {
        // Auto-revoke the existing pending invitation and create a new one
        // This allows re-inviting users with updated roles
        console.log(`Auto-revoking existing pending invitation for ${data.email}`);
        if (duplicateCheck.invitation) {
          await this.revokeInvitation(
            duplicateCheck.invitation.id,
            data.invitedByUserId,
            'System (auto-revoke for new invitation)'
          );
          console.log(`Successfully revoked invitation ${duplicateCheck.invitation.id}`);
        }
      } else if (duplicateCheck.reason === 'already_marketing_user') {
        throw new Error('This user is already a member of the Marketing dashboard. You can update their role from the team management page.');
      } else {
        throw new Error('A user with this email already exists or has a pending invitation.');
      }
    }

    // Generate invitation ID and expiration
    const inviteId = adminDb.collection(COLLECTIONS.INVITATIONS).doc().id;
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(
      now.toMillis() + (INVITATION_EXPIRY_HOURS * 60 * 60 * 1000)
    );

    // Generate secure token
    const token = this.generateSecureToken({
      inviteId,
      email: data.email,
      role: data.role,
      expiresAt: expiresAt.toMillis()
    });

    // Create invitation object
    const invitation: Invitation = {
      id: inviteId,
      email: data.email,
      name: data.name,
      role: data.role,
      invitedByUserId: data.invitedByUserId,
      status: 'pending',
      token,
      expiresAt,
      createdAt: now
    };

    // Save to Firestore
    try {
      console.log('📝 Attempting to save invitation to Firestore:', {
        collection: COLLECTIONS.INVITATIONS,
        docId: inviteId,
        email: invitation.email
      });
      
      await adminDb.collection(COLLECTIONS.INVITATIONS).doc(inviteId).set(invitation);
      
      console.log('✅ Successfully saved invitation to Firestore');
    } catch (firestoreError) {
      console.error('❌ Firestore write error:', firestoreError);
      console.error('Error details:', {
        name: firestoreError instanceof Error ? firestoreError.name : 'Unknown',
        message: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
        code: (firestoreError as any)?.code,
        stack: firestoreError instanceof Error ? firestoreError.stack : 'No stack'
      });
      throw firestoreError;
    }

    // Log invitation sent (using Admin SDK)
    await ActivityLogServiceAdmin.logInvitationSent(
      data.invitedByUserId,
      '', // userName will be filled by the caller
      inviteId,
      data.email,
      data.role
    ).catch(err => console.error('Failed to log invitation:', err));

    return invitation;
  }

  /**
   * Validate invitation token and return invitation data
   */
  static async validateInvitation(token: string): Promise<InvitationValidationResult> {
    try {
      // Verify JWT token
      const decoded = this.verifyToken(token);
      
      // Get invitation from database
      const inviteDoc = await adminDb.collection(COLLECTIONS.INVITATIONS).doc(decoded.inviteId).get();
      
      if (!inviteDoc.exists) {
        return {
          isValid: false,
          error: 'Invitation not found',
          errorCode: 'NOT_FOUND'
        };
      }

      const invitation = { id: inviteDoc.id, ...inviteDoc.data() } as Invitation;

      // Check if invitation is already used
      if (invitation.status === 'accepted') {
        return {
          isValid: false,
          error: 'This invitation has already been used',
          errorCode: 'ALREADY_USED'
        };
      }

      // Check if invitation is revoked
      if (invitation.status === 'revoked') {
        return {
          isValid: false,
          error: 'This invitation has been revoked',
          errorCode: 'ALREADY_USED'
        };
      }


      // Check if invitation is expired
      if (invitation.expiresAt.toMillis() < Date.now()) {
        // Update status to expired
        await adminDb.collection(COLLECTIONS.INVITATIONS).doc(invitation.id).update({
          status: 'expired'
        });

        return {
          isValid: false,
          error: 'This invitation has expired. Please request a new invitation.',
          errorCode: 'EXPIRED'
        };
      }

      // Validate email domain
      if (!isValidCompanyEmail(invitation.email)) {
        return {
          isValid: false,
          error: 'Invalid email domain',
          errorCode: 'INVALID_DOMAIN'
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
  static async acceptInvitation(token: string): Promise<Invitation> {
    // Validate token parameter
    if (!token || token.trim().length === 0) {
      throw new Error('Invitation token is required');
    }

    const validation = await this.validateInvitation(token);
    
    if (!validation.isValid || !validation.invitation) {
      throw new Error(validation.error || 'Invalid invitation');
    }

    const invitation = validation.invitation;

    // Additional check to ensure invitation hasn't been accepted already
    if (invitation.status === 'accepted') {
      throw new Error('This invitation has already been accepted');
    }

    // Mark invitation as accepted
    const now = Timestamp.now();
    await adminDb.collection(COLLECTIONS.INVITATIONS).doc(invitation.id).update({
      status: 'accepted',
      acceptedAt: now
    });

    // Log invitation acceptance (using Admin SDK)
    await ActivityLogServiceAdmin.createLog({
      userId: invitation.email, // Use email as temporary ID
      userName: invitation.name,
      userEmail: invitation.email,
      userRole: invitation.role,
      action: 'invite_accepted',
      entityType: 'invitation',
      entityId: invitation.id,
      details: {
        invitedByUserId: invitation.invitedByUserId
      }
    }).catch(err => console.error('Failed to log invitation acceptance:', err));

    return {
      ...invitation,
      status: 'accepted',
      acceptedAt: now
    };
  }

  /**
   * Get invitation by email
   */
  static async getInvitationByEmail(email: string): Promise<Invitation | null> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.INVITATIONS)
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .get();
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Invitation;
  }

  /**
   * Get invitation by ID
   */
  static async getInvitationById(id: string): Promise<Invitation | null> {
    const inviteDoc = await adminDb.collection(COLLECTIONS.INVITATIONS).doc(id).get();
    
    if (!inviteDoc.exists) {
      return null;
    }

    return { id: inviteDoc.id, ...inviteDoc.data() } as Invitation;
  }

  /**
   * Revoke an invitation
   */
  static async revokeInvitation(id: string, revokedByUserId?: string, revokedByUserName?: string): Promise<void> {
    // Validate invitation ID
    if (!id || id.trim().length === 0) {
      throw new Error('Invitation ID is required');
    }

    const invitation = await this.getInvitationById(id);
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status === 'revoked') {
      throw new Error('Invitation is already revoked');
    }

    if (invitation.status === 'accepted') {
      throw new Error('Cannot revoke an accepted invitation');
    }
    
    await adminDb.collection(COLLECTIONS.INVITATIONS).doc(id).update({
      status: 'revoked'
    });

    // Log invitation revocation (using Admin SDK)
    if (revokedByUserId && revokedByUserName && invitation) {
      await ActivityLogServiceAdmin.createLog({
        userId: revokedByUserId,
        userName: revokedByUserName,
        action: 'invite_revoked',
        entityType: 'invitation',
        entityId: id,
        entityName: invitation.email,
        details: {
          inviteeEmail: invitation.email,
          inviteeRole: invitation.role
        }
      }).catch(err => console.error('Failed to log invitation revocation:', err));
    }
  }

  /**
   * Delete an invitation (permanent removal)
   */
  static async deleteInvitation(id: string): Promise<void> {
    await adminDb.collection(COLLECTIONS.INVITATIONS).doc(id).delete();
  }

  /**
   * Get all invitations (for Super Admin)
   */
  static async getAllInvitations(): Promise<Invitation[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.INVITATIONS).get();
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Invitation[];
  }

  /**
   * Get invitations by status
   */
  static async getInvitationsByStatus(status: Invitation['status']): Promise<Invitation[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.INVITATIONS)
      .where('status', '==', status)
      .get();
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Invitation[];
  }

  /**
   * Get invitations created by a specific user
   */
  static async getInvitationsByInviter(invitedByUserId: string): Promise<Invitation[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.INVITATIONS)
      .where('invitedByUserId', '==', invitedByUserId)
      .get();
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Invitation[];
  }

  /**
   * Clean up expired invitations
   */
  static async cleanupExpiredInvitations(): Promise<number> {
    const now = Timestamp.now();
    const querySnapshot = await adminDb.collection(COLLECTIONS.INVITATIONS)
      .where('status', '==', 'pending')
      .where('expiresAt', '<', now)
      .get();
    
    let cleanedCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      await docSnapshot.ref.update({ status: 'expired' });
      cleanedCount++;
    }

    return cleanedCount;
  }

  /**
   * Generate invitation link
   */
  static generateInvitationLink(token: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${base}/marketing/invite/${token}`;
  }

  /**
   * Check if user has permission to create invitations
   */
  static canCreateInvitation(userRole: string): boolean {
    return userRole === 'super_admin';
  }

  /**
   * Check if user can manage invitations
   */
  static canManageInvitations(userRole: string): boolean {
    return userRole === 'super_admin';
  }
}

// Export utility functions
export const invitationUtils = {
  generateInvitationLink: InvitationService.generateInvitationLink,
  canCreateInvitation: InvitationService.canCreateInvitation,
  canManageInvitations: InvitationService.canManageInvitations
};

// Export error types for better error handling
export class InvitationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'InvitationError';
  }
}

export const InvitationErrorCodes = {
  INVALID_DOMAIN: 'INVALID_DOMAIN',
  INVITATION_EXISTS: 'INVITATION_EXISTS',
  NOT_FOUND: 'NOT_FOUND',
  EXPIRED: 'EXPIRED',
  ALREADY_USED: 'ALREADY_USED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
} as const;