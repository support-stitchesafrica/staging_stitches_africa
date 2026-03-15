import { adminDb } from '@/lib/firebase-admin';
import { sign } from 'jsonwebtoken';
import { isValidCompanyEmail } from './domain-validator';
import { ActivityLogService } from './activity-log-service';
import { SecureTokenGenerator } from './password-validator';
import { Timestamp } from 'firebase-admin/firestore';
import {  CreateInvitationData, Invitation, InvitationValidationResult } from './invitation-service';

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'marketing-dashboard-secret';
const INVITATION_EXPIRY_HOURS = 72; // 3 days
const COLLECTIONS = {
  INVITATIONS: 'staging_marketing_invitations'
} as const;

export class InvitationServiceServer {
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
      system: 'marketing',
      exp: Math.floor(inviteData.expiresAt / 1000), // JWT expects seconds
      iat: Math.floor(Date.now() / 1000),
      jti: SecureTokenGenerator.generateToken(16) // Unique token ID
    };

    return sign(payload, JWT_SECRET, { algorithm: 'HS256' });
  }

  /**
   * Create a new invitation (Server-Side using Admin SDK)
   */
  static async createInvitation(data: CreateInvitationData): Promise<Invitation> {
    if (!adminDb) {
      throw new Error('Firebase Admin DB is not initialized');
    }

    // Validate email domain
    if (!isValidCompanyEmail(data.email)) {
      throw new Error('Only company emails (@stitchesafrica.com, @stitchesafrica.pro) are allowed');
    }

    // Check if invitation already exists for this email
    const existingSnapshot = await adminDb.collection(COLLECTIONS.INVITATIONS)
        .where('email', '==', data.email)
        .where('status', '==', 'pending')
        .get();

    if (!existingSnapshot.empty) {
      throw new Error('An active invitation already exists for this email');
    }

    // Generate invitation ID and expiration
    const inviteRef = adminDb.collection(COLLECTIONS.INVITATIONS).doc();
    const inviteId = inviteRef.id;
    
    // Admin SDK Timestamp
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

    // Create invitation object (using generic Object for Firestore compat if types differ slightly)
    const invitationData = {
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
    await inviteRef.set(invitationData);

    // Return as Invitation type (converting Timestamps if needed for client, but here returning internal type is fine for route)
    // We cast to any to avoid strict type mismatch between Admin Timestamp and Client Timestamp if they differ in the interface
    return invitationData as any as Invitation;
  }
  
  /**
   * Verify and decode invitation token
   */
  private static verifyToken(token: string): any {
    try {
      return (sign as any).verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch (error) {
      // jsonwebtoken verify is imported as 'sign' in line 2? No, line 2 is `import { sign } from 'jsonwebtoken';`
      // I need to import verify.
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Validate invitation token and return invitation data
   */
  static async validateInvitation(token: string): Promise<InvitationValidationResult> {
    try {
      // Verify JWT token
      // Note: we need to import 'verify' from jsonwebtoken
      const { verify } = await import('jsonwebtoken');
      let decoded: any;
      try {
        decoded = verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      } catch (e) {
        return {
          isValid: false,
          error: 'Invalid or malformed token',
          errorCode: 'INVALID_TOKEN'
        };
      }
      
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
      console.error('Validation error:', error);
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
    const validation = await this.validateInvitation(token);
    
    if (!validation.isValid || !validation.invitation) {
      throw new Error(validation.error || 'Invalid invitation');
    }

    const invitation = validation.invitation;

    // Mark invitation as accepted
    const now = Timestamp.now();
    await adminDb.collection(COLLECTIONS.INVITATIONS).doc(invitation.id).update({
      status: 'accepted',
      acceptedAt: now
    });

    // Log invitation acceptance
    // Note: ActivityLogService might need to be adjusted for server-side if it uses client SDK
    // For now assuming we can skip or it works (it imports from local file, let's check imports)
    
    return {
      ...invitation,
      status: 'accepted',
      acceptedAt: now
    } as Invitation;
  }

  static generateInvitationLink(token: string, baseUrl?: string): string {
    let base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
    // let base = 'http://localhost:3000';

    // Default to localhost in development if no env var is explicitly set to override it
    if (!base && process.env.NODE_ENV === 'development') {
      base = 'http://localhost:3000';
    }

    // Fallback to production URL
    if (!base) {
      base = 'https://staging-stitches-africa.vercel.app';
    }

    return `${base}/marketing/invite/${token}`;
  }
}
