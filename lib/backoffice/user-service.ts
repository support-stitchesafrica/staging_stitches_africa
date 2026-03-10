/**
 * User Service for Unified Back Office System
 * Handles CRUD operations for back office users
 * Requirements: 2.4, 17.1, 17.2, 17.3, 17.4
 */

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { BackOfficeUser, BackOfficeRole, Department, AuthError, InvitationError } from '@/types/backoffice';
import { PermissionService } from './permission-service';
import { Timestamp } from 'firebase-admin/firestore';

export class UserService {
  private static readonly COLLECTION_NAME = 'backoffice_users';

  /**
   * Get user by Firebase Auth UID
   * Requirement: 17.1 - View team members
   */
  static async getUserById(uid: string): Promise<BackOfficeUser | null> {
    try {
      const docRef = adminDb.collection(this.COLLECTION_NAME).doc(uid);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return null;
      }

      const data = docSnap.data();
      if (!data) {
        return null;
      }

      return {
        uid: docSnap.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        departments: data.departments || [],
        permissions: data.permissions,
        teamId: data.teamId,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        invitedBy: data.invitedBy,
        lastLogin: data.lastLogin,
      } as BackOfficeUser;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user by email address
   * Requirement: 2.4 - Invitation acceptance creates user account
   */
  static async getUserByEmail(email: string): Promise<BackOfficeUser | null> {
    try {
      const querySnapshot = await adminDb
        .collection(this.COLLECTION_NAME)
        .where('email', '==', email)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        uid: doc.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        departments: data.departments || [],
        permissions: data.permissions,
        teamId: data.teamId,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        invitedBy: data.invitedBy,
        lastLogin: data.lastLogin,
      } as BackOfficeUser;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error(`Failed to get user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error(InvitationError.EMAIL_ALREADY_EXISTS);
      }

      // Create Firebase Auth user
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: fullName,
        emailVerified: false,
      });

      // Get permissions for the role
      const permissions = PermissionService.getRolePermissions(role);
      
      // Determine departments based on permissions
      const departments: Department[] = [];
      for (const [dept, perms] of Object.entries(permissions)) {
        if (perms.read || perms.write || perms.delete) {
          departments.push(dept as Department);
        }
      }

      const now = Timestamp.now();

      // Create user document in Firestore
      const userData: BackOfficeUser = {
        uid: userRecord.uid,
        email,
        fullName,
        role,
        departments,
        permissions,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        invitedBy,
      };

      await adminDb.collection(this.COLLECTION_NAME).doc(userRecord.uid).set(userData);

      return userData;
    } catch (error) {
      console.error('Error creating user:', error);
      
      // If it's an auth error, throw with specific message
      if (error instanceof Error) {
        if (error.message.includes('email-already-exists')) {
          throw new Error(InvitationError.EMAIL_ALREADY_EXISTS);
        }
        throw new Error(`Failed to create user: ${error.message}`);
      }
      
      throw new Error('Failed to create user: Unknown error');
    }
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
    try {
      // Verify user exists
      const existingUser = await this.getUserById(uid);
      if (!existingUser) {
        throw new Error(AuthError.USER_NOT_FOUND);
      }

      const updateData: Partial<BackOfficeUser> = {
        updatedAt: Timestamp.now(),
      };

      // Update full name
      if (updates.fullName !== undefined) {
        updateData.fullName = updates.fullName;
        
        // Also update in Firebase Auth
        await adminAuth.updateUser(uid, {
          displayName: updates.fullName,
        });
      }

      // Update role and recalculate permissions
      if (updates.role !== undefined) {
        updateData.role = updates.role;
        updateData.permissions = PermissionService.getRolePermissions(updates.role);
        
        // Recalculate departments based on new permissions
        const departments: Department[] = [];
        for (const [dept, perms] of Object.entries(updateData.permissions)) {
          if (perms.read || perms.write || perms.delete) {
            departments.push(dept as Department);
          }
        }
        updateData.departments = departments;
      }

      // Update active status
      if (updates.isActive !== undefined) {
        updateData.isActive = updates.isActive;
        
        // Also disable/enable in Firebase Auth
        await adminAuth.updateUser(uid, {
          disabled: !updates.isActive,
        });
      }

      // Update team ID
      if (updates.teamId !== undefined) {
        updateData.teamId = updates.teamId;
      }

      // Update Firestore document
      await adminDb.collection(this.COLLECTION_NAME).doc(uid).update(updateData);
    } catch (error) {
      console.error('Error updating user:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new Error(AuthError.USER_NOT_FOUND);
        }
        throw new Error(`Failed to update user: ${error.message}`);
      }
      
      throw new Error('Failed to update user: Unknown error');
    }
  }

  /**
   * Deactivate a back office user (soft delete)
   * Requirement: 17.4 - Deactivate team members
   */
  static async deactivateUser(uid: string): Promise<void> {
    try {
      // Verify user exists
      const existingUser = await this.getUserById(uid);
      if (!existingUser) {
        throw new Error(AuthError.USER_NOT_FOUND);
      }

      // Prevent deactivating the last superadmin
      if (existingUser.role === 'superadmin') {
        const allUsers = await this.getAllUsers();
        const activeSuperadmins = allUsers.filter(
          u => u.role === 'superadmin' && u.isActive && u.uid !== uid
        );
        
        if (activeSuperadmins.length === 0) {
          throw new Error('Cannot deactivate the last active superadmin');
        }
      }

      // Deactivate in Firestore
      await adminDb.collection(this.COLLECTION_NAME).doc(uid).update({
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      // Disable in Firebase Auth
      await adminAuth.updateUser(uid, {
        disabled: true,
      });
    } catch (error) {
      console.error('Error deactivating user:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new Error(AuthError.USER_NOT_FOUND);
        }
        throw error;
      }
      
      throw new Error('Failed to deactivate user: Unknown error');
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
    try {
      let query = adminDb.collection(this.COLLECTION_NAME);

      // Filter by active status
      if (!options?.includeInactive) {
        query = query.where('isActive', '==', true) as any;
      }

      // Filter by role
      if (options?.role) {
        query = query.where('role', '==', options.role) as any;
      }

      // Filter by department
      if (options?.department) {
        query = query.where('departments', 'array-contains', options.department) as any;
      }

      const querySnapshot = await query.get();

      const users: BackOfficeUser[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          departments: data.departments || [],
          permissions: data.permissions,
          teamId: data.teamId,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          invitedBy: data.invitedBy,
          lastLogin: data.lastLogin,
        } as BackOfficeUser);
      });

      // Sort by creation date (newest first)
      users.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user's last login timestamp
   * Called during authentication
   */
  static async updateLastLogin(uid: string): Promise<void> {
    try {
      await adminDb.collection(this.COLLECTION_NAME).doc(uid).update({
        lastLogin: Timestamp.now(),
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
}
