/**
 * Client-side User Service for Unified Back Office System
 * Uses API routes instead of direct firebase-admin calls
 * Requirements: 2.4, 17.1, 17.2, 17.3, 17.4
 */

import { BackOfficeUser, BackOfficeRole, Department } from '@/types/backoffice';

export class UserClientService {
  /**
   * Get user by Firebase Auth UID
   * Requirement: 17.1 - View team members
   */
  static async getUserById(uid: string): Promise<BackOfficeUser | null> {
    const response = await fetch(`/api/backoffice/users/${uid}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user');
    }

    const data = await response.json();
    return data.user;
  }

  /**
   * Get user by email address
   * Requirement: 2.4 - Invitation acceptance creates user account
   */
  static async getUserByEmail(email: string): Promise<BackOfficeUser | null> {
    const response = await fetch(`/api/backoffice/users?email=${encodeURIComponent(email)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user by email');
    }

    const data = await response.json();
    return data.users.length > 0 ? data.users[0] : null;
  }

  /**
   * Create a new back office user
   * Requirement: 2.4 - Invitation acceptance creates user account
   * Requirement: 17.2 - Create new team members
   */
  static async createUser(
    email: string,
    password: string,
    fullName: string,
    role: BackOfficeRole,
    invitedBy?: string
  ): Promise<BackOfficeUser> {
    const response = await fetch('/api/backoffice/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        fullName,
        role,
        invitedBy,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }

    const data = await response.json();
    return data.user;
  }

  /**
   * Update an existing back office user
   * Requirement: 17.3 - Edit team member roles and permissions
   */
  static async updateUser(
    uid: string,
    updates: {
      fullName?: string;
      role?: BackOfficeRole;
      isActive?: boolean;
      teamId?: string;
    }
  ): Promise<void> {
    const response = await fetch(`/api/backoffice/users/${uid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
  }

  /**
   * Deactivate a back office user (soft delete)
   * Requirement: 17.4 - Deactivate team members
   */
  static async deactivateUser(uid: string): Promise<void> {
    const response = await fetch(`/api/backoffice/users/${uid}/deactivate`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to deactivate user');
    }
  }

  /**
   * Get all back office users for team management
   * Requirement: 17.1 - View all team members
   */
  static async getAllUsers(options?: {
    includeInactive?: boolean;
    role?: BackOfficeRole;
    department?: Department;
  }): Promise<BackOfficeUser[]> {
    const params = new URLSearchParams();
    
    if (options?.includeInactive) {
      params.append('includeInactive', 'true');
    }
    
    if (options?.role) {
      params.append('role', options.role);
    }
    
    if (options?.department) {
      params.append('department', options.department);
    }

    const response = await fetch(`/api/backoffice/users?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get users');
    }

    const data = await response.json();
    return data.users;
  }

  /**
   * Update user's last login timestamp
   * Called during authentication
   */
  static async updateLastLogin(uid: string): Promise<void> {
    try {
      await fetch(`/api/backoffice/users/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lastLogin: new Date().toISOString() }),
      });
    } catch (error) {
      // Non-critical operation, just log the error
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Check if a user exists by email
   * Used during invitation creation to prevent duplicates
   */
  static async userExists(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      return user !== null;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }

  /**
   * Get users by role
   * Useful for team management and reporting
   */
  static async getUsersByRole(role: BackOfficeRole): Promise<BackOfficeUser[]> {
    return this.getAllUsers({ role });
  }

  /**
   * Get users by department
   * Useful for department-specific management
   */
  static async getUsersByDepartment(department: Department): Promise<BackOfficeUser[]> {
    return this.getAllUsers({ department });
  }

  /**
   * Hard delete a user (removes from Firebase Auth and Firestore)
   * Use with caution - this is permanent
   */
  static async deleteUser(uid: string): Promise<void> {
    const response = await fetch(`/api/backoffice/users/${uid}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
  }
}