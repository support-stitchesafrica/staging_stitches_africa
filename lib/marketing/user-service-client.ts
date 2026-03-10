/**
 * Marketing Dashboard User Service (Client-side)
 * Handles user operations that can run in the browser
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
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';

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

// Client-side User Service Class
export class UserServiceClient {
  private static readonly COLLECTION_NAME = 'marketing_users';

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
   * Get Super Admin users
   */
  static async getSuperAdmins(): Promise<User[]> {
    return this.getUsersByRole('super_admin');
  }
}

// Export utilities
export const userUtilsClient = {
  UserServiceClient
};