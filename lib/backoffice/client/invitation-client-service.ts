/**
 * Client-side Invitation Service for Unified Back Office System
 * Uses API routes instead of direct firebase-admin calls
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 17.5
 */

import { BackOfficeInvitation, BackOfficeRole } from '@/types/backoffice';

export class InvitationClientService {
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
    const response = await fetch('/api/backoffice/invitations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        role,
        invitedBy,
        invitedByName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create invitation');
    }

    return response.json();
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
    const response = await fetch('/api/backoffice/invitations/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        isValid: false,
        error: error.error || 'Failed to validate invitation',
      };
    }

    return response.json();
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
    const response = await fetch('/api/backoffice/invitations/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        fullName,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to accept invitation');
    }

    return response.json();
  }

  /**
   * Get all invitations
   * Requirement: 17.5 - View pending, accepted, and expired invitations
   */
  static async getAllInvitations(): Promise<BackOfficeInvitation[]> {
    const response = await fetch('/api/backoffice/invitations', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get invitations');
    }

    const data = await response.json();
    return data.invitations;
  }

  /**
   * Get invitations by status
   * Requirement: 17.5 - View pending, accepted, and expired invitations
   */
  static async getInvitationsByStatus(
    status: 'pending' | 'accepted' | 'expired'
  ): Promise<BackOfficeInvitation[]> {
    const response = await fetch(`/api/backoffice/invitations?status=${status}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get invitations');
    }

    const data = await response.json();
    return data.invitations;
  }

  /**
   * Get invitations created by a specific user
   */
  static async getInvitationsByInviter(invitedBy: string): Promise<BackOfficeInvitation[]> {
    const response = await fetch(`/api/backoffice/invitations?invitedBy=${invitedBy}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get invitations');
    }

    const data = await response.json();
    return data.invitations;
  }

  /**
   * Get invitation by ID
   */
  static async getInvitationById(id: string): Promise<BackOfficeInvitation | null> {
    const response = await fetch(`/api/backoffice/invitations/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get invitation');
    }

    const data = await response.json();
    return data.invitation;
  }

  /**
   * Expire a specific invitation
   */
  static async expireInvitation(id: string): Promise<void> {
    const response = await fetch(`/api/backoffice/invitations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'expire' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to expire invitation');
    }
  }

  /**
   * Delete an invitation (permanent removal)
   */
  static async deleteInvitation(id: string): Promise<void> {
    const response = await fetch(`/api/backoffice/invitations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete invitation');
    }
  }

  /**
   * Generate invitation link
   */
  static generateInvitationLink(token: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
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
    const response = await fetch(`/api/backoffice/invitations/${invitationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'resend',
        invitedBy,
        invitedByName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to resend invitation');
    }

    return response.json();
  }
}