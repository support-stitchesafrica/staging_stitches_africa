/**
 * Atlas Dashboard Invitation Service
 * Handles invitation creation, validation, and acceptance workflow
 * Following the Marketing dashboard pattern with Atlas-specific domain validation
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
import { AtlasRole, AUTHORIZED_DOMAINS } from './types';
import { generateInvitationToken } from '@/lib/utils/token-generator';
import { validateInvitationToken } from '@/lib/utils/token-validator';

// Types
export interface AtlasInvitation {
  id: string;
  email: string;
  name: string;
  role: AtlasRole;
  invitedByUserId: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  acceptedByUid?: string;
}

export interface CreateAtlasInvitationData {
  name: string;
  email: string;
  role: AtlasRole;
  invitedByUserId: string;
}

export interface InvitationValidationResult {
  isValid: boolean;
  invitation?: AtlasInvitation;
  error?: string;
  errorCode?: 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_USED' | 'INVALID_TOKEN' | 'INVALID_DOMAIN';
}

// Constants
const INVITATION_EXPIRY_DAYS = 7; // 7 days
const COLLECTIONS = {
  INVITATIONS: 'staging_atlasInvitations'
} as const;

/**
 * Secure Token Generator
 * Generates cryptographically secure tokens
 */
class SecureTokenGenerator {
  /**
   * Generate a secure random token
   */
  static generateToken(length: number = 32): string {
    // Use crypto for secure random generation
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for Node.js environment
    const { randomBytes } = require('crypto');
    return randomBytes(length).toString('hex');
  }
}

/**
 * Domain Validator for Atlas
 * Validates email domains to ensure only authorized company emails are allowed
 */
class AtlasDomainValidator {
  /**
   * Validates if an email domain is allowed for the Atlas dashboard
   * @param email - The email address to validate
   * @returns boolean indicating if email domain is valid
   */
  static isValidDomain(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if email has @ symbol
    if (!normalizedEmail.includes('@')) {
      return false;
    }

    // Check if email ends with any of the authorized domains
    return AUTHORIZED_DOMAINS.some(domain => 
      normalizedEmail.endsWith(domain)
    );
  }

  /**
   * Validates email domain and throws error if invalid
   * @param email - The email address to validate
   * @throws Error if domain is invalid
   */
  static validateDomainOrThrow(email: string): void {
    if (!this.isValidDomain(email)) {
      throw new Error('Only company emails (@stitchesafrica.com, @stitchesafrica.pro) are allowed');
    }
  }

  /**
   * Gets the list of authorized domains
   * @returns Array of authorized domain strings
   */
  static getAuthorizedDomains(): readonly string[] {
    return AUTHORIZED_DOMAINS;
  }
}

/**
 * Atlas Dashboard Invitation Service
 */
export class AtlasInvitationService {
  /**
   * Safely decode URL-encoded token, handling both encoded and non-encoded tokens
   */
  private static safeDecodeToken(token: string): string {
    try {
      // Try to decode - if it fails, the token wasn't encoded
      const decoded = decodeURIComponent(token);
      // If decoding succeeds and changes the token, return decoded version
      // Otherwise, return original (it might already be decoded)
      return decoded !== token ? decoded : token;
    } catch (error) {
      // If decodeURIComponent fails, token wasn't URL-encoded, return as-is
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
      system: 'atlas',
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
  static async createInvitation(data: CreateAtlasInvitationData): Promise<AtlasInvitation> {
    // Normalize email
    const normalizedEmail = data.email.toLowerCase().trim();

    // Validate email domain
    AtlasDomainValidator.validateDomainOrThrow(normalizedEmail);

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
    const invitation: AtlasInvitation = {
      id: inviteId,
      email: normalizedEmail,
      name: data.name,
      role: data.role,
      invitedByUserId: data.invitedByUserId,
      status: 'pending',
      token,
      expiresAt,
      createdAt: now
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
      // Decode URL-encoded token if needed (tokens in URLs may be encoded)
      const decodedToken = this.safeDecodeToken(token);
      
      // Verify JWT token using centralized validator
      const validation = validateInvitationToken(decodedToken, 'atlas');
      
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

      const invitation = { id: inviteDoc.id, ...inviteDoc.data() } as AtlasInvitation;

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
        await updateDoc(doc(db, COLLECTIONS.INVITATIONS, invitation.id), {
          status: 'expired'
        });

        return {
          isValid: false,
          error: 'This invitation has expired. Please request a new invitation.',
          errorCode: 'EXPIRED'
        };
      }

      // Validate email domain
      if (!AtlasDomainValidator.isValidDomain(invitation.email)) {
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
      console.error('[Atlas Invitation Service] Validation error:', error);
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
  static async acceptInvitation(token: string, acceptedByUid?: string): Promise<AtlasInvitation> {
    // Decode URL-encoded token if needed
    const decodedToken = this.safeDecodeToken(token);
    const validation = await this.validateInvitation(decodedToken);
    
    if (!validation.isValid || !validation.invitation) {
      throw new Error(validation.error || 'Invalid invitation');
    }

    const invitation = validation.invitation;

    // Mark invitation as accepted
    const now = Timestamp.now();
    const updateData: any = {
      status: 'accepted',
      acceptedAt: now
    };

    if (acceptedByUid) {
      updateData.acceptedByUid = acceptedByUid;
    }

    await updateDoc(doc(db, COLLECTIONS.INVITATIONS, invitation.id), updateData);

    return {
      ...invitation,
      status: 'accepted',
      acceptedAt: now,
      acceptedByUid
    };
  }

  /**
   * Get invitation by email
   */
  static async getInvitationByEmail(email: string): Promise<AtlasInvitation | null> {
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
    return { id: doc.id, ...doc.data() } as AtlasInvitation;
  }

  /**
   * Get invitation by ID
   */
  static async getInvitationById(id: string): Promise<AtlasInvitation | null> {
    const inviteDoc = await getDoc(doc(db, COLLECTIONS.INVITATIONS, id));
    
    if (!inviteDoc.exists()) {
      return null;
    }

    return { id: inviteDoc.id, ...inviteDoc.data() } as AtlasInvitation;
  }

  /**
   * Revoke an invitation
   */
  static async revokeInvitation(id: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.INVITATIONS, id), {
      status: 'revoked'
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
  static async getAllInvitations(): Promise<AtlasInvitation[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.INVITATIONS));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AtlasInvitation[];
  }

  /**
   * Get invitations by status
   */
  static async getInvitationsByStatus(status: AtlasInvitation['status']): Promise<AtlasInvitation[]> {
    const q = query(
      collection(db, COLLECTIONS.INVITATIONS),
      where('status', '==', status)
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AtlasInvitation[];
  }

  /**
   * Get invitations created by a specific user
   */
  static async getInvitationsByInviter(invitedByUserId: string): Promise<AtlasInvitation[]> {
    const q = query(
      collection(db, COLLECTIONS.INVITATIONS),
      where('invitedByUserId', '==', invitedByUserId)
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AtlasInvitation[];
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
    return `${base}/atlas/invite/${token}`;
  }

  /**
   * Check if user has permission to create invitations
   */
  static canCreateInvitation(userRole: string): boolean {
    return userRole === 'superadmin';
  }

  /**
   * Check if user can manage invitations
   */
  static canManageInvitations(userRole: string): boolean {
    return userRole === 'superadmin';
  }

  /**
   * Validate email domain (public method)
   */
  static isValidDomain(email: string): boolean {
    return AtlasDomainValidator.isValidDomain(email);
  }

  /**
   * Get authorized domains (public method)
   */
  static getAuthorizedDomains(): readonly string[] {
    return AtlasDomainValidator.getAuthorizedDomains();
  }
}

// Export utility functions
export const atlasInvitationUtils = {
  generateInvitationLink: AtlasInvitationService.generateInvitationLink,
  canCreateInvitation: AtlasInvitationService.canCreateInvitation,
  canManageInvitations: AtlasInvitationService.canManageInvitations,
  checkEmailExists: AtlasInvitationService.checkEmailExists,
  isValidDomain: AtlasInvitationService.isValidDomain,
  getAuthorizedDomains: AtlasInvitationService.getAuthorizedDomains
};

// Export error types for better error handling
export class AtlasInvitationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AtlasInvitationError';
  }
}

export const AtlasInvitationErrorCodes = {
  INVALID_DOMAIN: 'INVALID_DOMAIN',
  INVITATION_EXISTS: 'INVITATION_EXISTS',
  NOT_FOUND: 'NOT_FOUND',
  EXPIRED: 'EXPIRED',
  ALREADY_USED: 'ALREADY_USED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
} as const;
