/**
 * Marketing Dashboard User Service - Server Side Only
 * Handles user operations that require Firebase Admin SDK
 */

import { UserService } from './user-service';
import { adminDb } from '@/lib/firebase-admin';
import type { User, UserFilters, CreateUserData, UserRole } from './user-service';
import * as admin from 'firebase-admin';

// Extend the UserService with server-side only methods
export class UserServiceServer {
  private static readonly COLLECTION_NAME = 'marketing_users';

  /**
   * Get all users - SERVER SIDE VERSION
   */
  static async getUsersServerSide(filters: UserFilters = {}): Promise<User[]> {
    try {
      let query: admin.firestore.Query<admin.firestore.DocumentData> = adminDb.collection(this.COLLECTION_NAME);

      // Apply filters
      if (filters.role) {
        query = query.where('role', '==', filters.role);
      }
      
      if (filters.teamId) {
        query = query.where('teamId', '==', filters.teamId);
      }
      
      if (filters.isActive !== undefined) {
        query = query.where('isActive', '==', filters.isActive);
      }

      // Add ordering and limit
      query = query.orderBy('createdAt', 'desc');
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      
      return snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as User[];
    } catch (error) {
      console.error('Error getting users (server-side):', error);
      throw new Error('Failed to retrieve users');
    }
  }

  /**
   * Get user by email - SERVER SIDE (Admin)
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const snapshot = await adminDb.collection(this.COLLECTION_NAME)
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...(doc.data() as any)
      } as User;
    } catch (error) {
      console.error('Server: Error getting user by email:', error);
      throw new Error('Failed to retrieve user by email');
    }
  }

  /**
   * Create a new user profile - SERVER SIDE (Admin)
   */
  static async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Use Firestore admin timestamp
      const now = admin.firestore.Timestamp.now();
      const userDoc = {
        ...userData,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await adminDb.collection(this.COLLECTION_NAME).add(userDoc);
      
      return {
        id: docRef.id,
        ...userDoc
      } as unknown as User; 
    } catch (error) {
      console.error('Server: Error creating user:', error);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Update user role - SERVER SIDE (Admin)
   */
  static async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    try {
      await adminDb.collection(this.COLLECTION_NAME).doc(userId).update({
        role: newRole,
        updatedAt: admin.firestore.Timestamp.now()
      });
    } catch (error) {
      console.error('Server: Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  /**
   * Get users by team ID - SERVER SIDE VERSION
   */
  static async getUsersByTeamServerSide(teamId: string): Promise<User[]> {
    return this.getUsersServerSide({ teamId, isActive: true });
  }
}

// Export combined service
export const userServiceServer = UserServiceServer;