/**
 * Marketing Dashboard User Service
 * Handles user CRUD operations, role management, and validation
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentReference,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/firebase';
import { ActivityLogService } from './activity-log-service';

// User Types
export type UserRole = 'super_admin' | 'team_lead' | 'bdm' | 'team_member';

export interface User {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  role: UserRole;
  teamId?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  profileImage?: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  phoneNumber?: string;
  role: UserRole;
  teamId?: string;
  profileImage?: string;
}

export interface UpdateUserData {
  name?: string;
  phoneNumber?: string;
  teamId?: string;
  profileImage?: string;
  lastLoginAt?: Timestamp;
}

export interface UserFilters {
  role?: UserRole;
  teamId?: string;
  isActive?: boolean;
  limit?: number;
}

// User Service Class
export class UserService {
  private static readonly COLLECTION_NAME = 'marketing_users';

  /**
   * Create a new user profile
   */
  static async createUser(userData: CreateUserData, creatorUserId?: string, creatorUserName?: string): Promise<User> {
    try {
      const now = Timestamp.now();
      const userDoc = {
        ...userData,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), userDoc);
      
      const newUser = {
        id: docRef.id,
        ...userDoc
      };

      // Log user creation
      if (creatorUserId && creatorUserName) {
        await ActivityLogService.logUserCreation(
          creatorUserId,
          creatorUserName,
          newUser.id,
          newUser.email,
          newUser.role
        ).catch(err => console.error('Failed to log user creation:', err));
      }

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as User;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Failed to retrieve user');
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('email', '==', email),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error('Failed to retrieve user by email');
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, updateData: UpdateUserData): Promise<User> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      
      // Check if user exists
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      const updatePayload = {
        ...updateData,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updatePayload);
      
      // Return updated user
      return await this.getUserById(userId) as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, newRole: UserRole, updaterUserId?: string, updaterUserName?: string): Promise<User> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      
      // Check if user exists
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      const oldRole = existingUser.role;

      await updateDoc(docRef, {
        role: newRole,
        updatedAt: Timestamp.now()
      });
      
      const updatedUser = await this.getUserById(userId) as User;

      // Log role update
      if (updaterUserId && updaterUserName) {
        await ActivityLogService.logRoleUpdate(
          updaterUserId,
          updaterUserName,
          userId,
          existingUser.name,
          oldRole,
          newRole
        ).catch(err => console.error('Failed to log role update:', err));
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  /**
   * Activate/Deactivate user
   */
  static async setUserActiveStatus(userId: string, isActive: boolean, updaterUserId?: string, updaterUserName?: string, reason?: string): Promise<User> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      
      // Check if user exists
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      await updateDoc(docRef, {
        isActive,
        updatedAt: Timestamp.now()
      });
      
      const updatedUser = await this.getUserById(userId) as User;

      // Log user deactivation/activation
      if (updaterUserId && updaterUserName) {
        if (!isActive) {
          await ActivityLogService.logUserDeactivation(
            updaterUserId,
            updaterUserName,
            userId,
            existingUser.name,
            reason
          ).catch(err => console.error('Failed to log user deactivation:', err));
        } else {
          await ActivityLogService.createLog({
            userId: updaterUserId,
            userName: updaterUserName,
            action: 'user_activated',
            entityType: 'user',
            entityId: userId,
            entityName: existingUser.name,
            details: { reason }
          }).catch(err => console.error('Failed to log user activation:', err));
        }
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      await this.setUserActiveStatus(userId, false);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Get all users with optional filtering
   */
  static async getUsers(filters: UserFilters = {}): Promise<User[]> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      // Apply filters
      if (filters.role) {
        q = query(q, where('role', '==', filters.role));
      }
      
      if (filters.teamId) {
        q = query(q, where('teamId', '==', filters.teamId));
      }
      
      if (filters.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      // Add ordering and limit
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error) {
      console.error('Error getting users:', error);
      throw new Error('Failed to retrieve users');
    }
  }

  /**
   * Get users by team ID
   */
  static async getUsersByTeam(teamId: string): Promise<User[]> {
    return this.getUsers({ teamId, isActive: true });
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.getUsers({ role, isActive: true });
  }



  /**
   * Update user's last login timestamp
   */
  static async updateLastLogin(userId: string, userName?: string, userEmail?: string, userRole?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(docRef, {
        lastLoginAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Log login activity
      if (userName && userEmail && userRole) {
        await ActivityLogService.logLogin(
          userId,
          userName,
          userEmail,
          userRole,
          ipAddress,
          userAgent
        ).catch(err => console.error('Failed to log login:', err));
      }
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error for login tracking failures
    }
  }

  /**
   * Check if user exists by email
   */
  static async userExistsByEmail(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      return user !== null;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Get Super Admin users
   */
  static async getSuperAdmins(): Promise<User[]> {
    return this.getUsersByRole('super_admin');
  }

  /**
   * Check if any Super Admin exists
   */
  static async hasSuperAdmin(): Promise<boolean> {
    try {
      const superAdmins = await this.getSuperAdmins();
      return superAdmins.length > 0;
    } catch (error) {
      console.error('Error checking super admin existence:', error);
      return false;
    }
  }
}

// Role Validation Utilities
export class RoleValidator {
  private static readonly ROLE_HIERARCHY: Record<UserRole, number> = {
    'super_admin': 4,
    'team_lead': 3,
    'bdm': 2,
    'team_member': 1
  };

  private static readonly VALID_ROLES: UserRole[] = [
    'super_admin',
    'team_lead', 
    'bdm',
    'team_member'
  ];

  /**
   * Validate if role is valid
   */
  static isValidRole(role: string): role is UserRole {
    return this.VALID_ROLES.includes(role as UserRole);
  }

  /**
   * Get role hierarchy level
   */
  static getRoleLevel(role: UserRole): number {
    return this.ROLE_HIERARCHY[role] || 0;
  }

  /**
   * Check if user can manage another user based on role hierarchy
   */
  static canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
    return this.getRoleLevel(managerRole) > this.getRoleLevel(targetRole);
  }

  /**
   * Check if user can assign a specific role
   */
  static canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
    // Super admin can assign any role
    if (assignerRole === 'super_admin') {
      return true;
    }
    
    // Others can only assign roles lower than their own
    return this.getRoleLevel(assignerRole) > this.getRoleLevel(targetRole);
  }

  /**
   * Get roles that a user can assign
   */
  static getAssignableRoles(userRole: UserRole): UserRole[] {
    const userLevel = this.getRoleLevel(userRole);
    return this.VALID_ROLES.filter(role => 
      this.getRoleLevel(role) < userLevel
    );
  }

  /**
   * Validate role assignment
   */
  static validateRoleAssignment(
    assignerRole: UserRole, 
    targetRole: UserRole
  ): { valid: boolean; error?: string } {
    if (!this.isValidRole(targetRole)) {
      return { valid: false, error: 'Invalid role specified' };
    }

    if (!this.canAssignRole(assignerRole, targetRole)) {
      return { 
        valid: false, 
        error: 'Insufficient permissions to assign this role' 
      };
    }

    return { valid: true };
  }
}

// User Profile Validation
export class UserProfileValidator {
  /**
   * Validate email format and domain
   */
  static validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    const allowedDomains = ['stitchesafrica.com', 'stitchesafrica.pro'];
    const domain = email.split('@')[1];
    
    if (!allowedDomains.includes(domain)) {
      return { 
        valid: false, 
        error: 'Only company emails are allowed' 
      };
    }

    return { valid: true };
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    
    if (!phoneRegex.test(phone)) {
      return { valid: false, error: 'Invalid phone number format' };
    }

    return { valid: true };
  }

  /**
   * Validate user name
   */
  static validateName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters' };
    }

    if (name.length > 100) {
      return { valid: false, error: 'Name must be less than 100 characters' };
    }

    return { valid: true };
  }

  /**
   * Validate complete user data
   */
  static validateUserData(userData: CreateUserData): { 
    valid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];

    const emailValidation = this.validateEmail(userData.email);
    if (!emailValidation.valid) {
      errors.push(emailValidation.error!);
    }

    const nameValidation = this.validateName(userData.name);
    if (!nameValidation.valid) {
      errors.push(nameValidation.error!);
    }

    if (userData.phoneNumber) {
      const phoneValidation = this.validatePhoneNumber(userData.phoneNumber);
      if (!phoneValidation.valid) {
        errors.push(phoneValidation.error!);
      }
    }

    if (!RoleValidator.isValidRole(userData.role)) {
      errors.push('Invalid role specified');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export utilities
export const userUtils = {
  UserService,
  RoleValidator,
  UserProfileValidator
};