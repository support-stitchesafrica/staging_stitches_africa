/**
 * VVIP Management Service
 * 
 * Core business logic for VVIP operations including:
 * - Creating and revoking VVIP status
 * - Searching users by email and ID
 * - Listing and filtering VVIP shoppers
 * 
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.7, 2.8, 2.9
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
  VvipResult,
  VvipShopper,
  VvipFilters,
  VvipError,
  VvipErrorCode,
  VvipUserFields,
} from '@/types/vvip';
import { vvipPermissionService } from './vvip-permission-service';
import { vvipAuditService } from './vvip-audit-service';

/**
 * VVIP Service Class
 * Provides core VVIP management functionality
 */
export class VvipService {
  private static readonly USERS_COLLECTION = 'users';
  private static readonly MARKETING_USERS_COLLECTION = 'marketing_users';

  /**
   * Search users by email address
   * Requirement: 1.2
   * 
   * @param email - Email address to search for
   * @returns Array of matching users
   */
  static async searchUsersByEmail(email: string): Promise<Array<{
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isVvip?: boolean;
    country?: string;
  }>> {
    try {
      // Normalize email for case-insensitive search
      const normalizedEmail = email.toLowerCase().trim();

      // Query users collection by email
      const usersSnapshot = await adminDb
        .collection(this.USERS_COLLECTION)
        .where('email', '==', normalizedEmail)
        .limit(10)
        .get();

      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: doc.id,
          email: data.email || '',
          firstName: data.first_name || data.firstName,
          lastName: data.last_name || data.lastName,
          isVvip: data.isVvip || false,
          country: data.registration_country || data.country,
        };
      });

      return users;
    } catch (error) {
      console.error('Error searching users by email:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to search users by email',
        500
      );
    }
  }

  /**
   * Search user by user ID
   * Requirement: 1.3
   * 
   * @param userId - User ID to search for
   * @returns User if found, null otherwise
   */
  static async searchUserById(userId: string): Promise<{
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isVvip?: boolean;
    country?: string;
  } | null> {
    try {
      const userDoc = await adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        return null;
      }

      const data = userDoc.data()!;
      return {
        userId: userDoc.id,
        email: data.email || '',
        firstName: data.first_name || data.firstName,
        lastName: data.last_name || data.lastName,
        isVvip: data.isVvip || false,
        country: data.registration_country || data.country,
      };
    } catch (error) {
      console.error('Error searching user by ID:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to search user by ID',
        500
      );
    }
  }

  /**
   * Combined search function for both email and user ID
   * 
   * @param query - Search query (email or user ID)
   * @param searchType - Type of search to perform
   * @returns Array of matching users
   */
  static async searchUsers(
    query: string,
    searchType: 'email' | 'userId'
  ): Promise<Array<{
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isVvip?: boolean;
    country?: string;
  }>> {
    if (searchType === 'email') {
      return this.searchUsersByEmail(query);
    } else {
      const user = await this.searchUserById(query);
      return user ? [user] : [];
    }
  }

  /**
   * Validate that a user exists in the users collection
   * Requirements: 1.4, 1.5
   * 
   * @param userId - User ID to validate
   * @returns True if user exists
   * @throws VvipError if user does not exist
   */
  static async validateUserExists(userId: string): Promise<boolean> {
    try {
      const userDoc = await adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        throw new VvipError(
          VvipErrorCode.USER_NOT_FOUND,
          'User does not exist',
          404,
          'userId'
        );
      }

      return true;
    } catch (error) {
      if (error instanceof VvipError) {
        throw error;
      }
      console.error('Error validating user existence:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to validate user existence',
        500
      );
    }
  }

  /**
   * Create VVIP shopper
   * Requirements: 1.6, 1.7, 1.8, 1.10
   * 
   * @param userId - User ID to grant VVIP status
   * @param adminId - Admin user ID performing the action
   * @returns Result of the operation
   * @throws VvipError if user doesn't exist or is already VVIP
   */
  static async createVvipShopper(
    userId: string,
    adminId: string
  ): Promise<VvipResult> {
    try {
      // Validate admin has permission
      await vvipPermissionService.validatePermission(adminId, 'create');

      // Validate user exists
      await this.validateUserExists(userId);

      // Check if user is already VVIP
      const userDoc = await adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();

      const userData = userDoc.data();
      if (userData?.isVvip === true) {
        throw new VvipError(
          VvipErrorCode.ALREADY_VVIP,
          'User is already a VVIP shopper',
          409
        );
      }

      // Update user document with VVIP fields
      const vvipFields: VvipUserFields = {
        isVvip: true,
        vvip_created_by: adminId,
        vvip_created_at: Timestamp.now(),
      };

      await adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .update(vvipFields);

      // Create audit log entry (Requirement 1.10)
      await vvipAuditService.logVvipAction({
        action_type: 'vvip_created',
        performed_by: adminId,
        affected_user: userId,
        timestamp: vvipFields.vvip_created_at,
        metadata: {
          created_at: vvipFields.vvip_created_at.toDate().toISOString(),
        },
      });

      return {
        success: true,
        message: 'VVIP status granted successfully',
        userId,
        data: vvipFields,
      };
    } catch (error) {
      if (error instanceof VvipError) {
        throw error;
      }
      console.error('Error creating VVIP shopper:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to create VVIP shopper',
        500
      );
    }
  }

  /**
   * Revoke VVIP status
   * 
   * @param userId - User ID to revoke VVIP status from
   * @param adminId - Admin user ID performing the action
   * @returns Result of the operation
   * @throws VvipError if user doesn't exist or is not VVIP
   */
  static async revokeVvipStatus(
    userId: string,
    adminId: string
  ): Promise<VvipResult> {
    try {
      // Validate admin has permission
      await vvipPermissionService.validatePermission(adminId, 'revoke');

      // Validate user exists
      await this.validateUserExists(userId);

      // Check if user is VVIP
      const userDoc = await adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();

      const userData = userDoc.data();
      if (userData?.isVvip !== true) {
        throw new VvipError(
          VvipErrorCode.NOT_VVIP,
          'User is not a VVIP shopper',
          400
        );
      }

      const revokedAt = Timestamp.now();

      // Remove VVIP fields
      await adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .update({
          isVvip: false,
          vvip_revoked_by: adminId,
          vvip_revoked_at: revokedAt,
        });

      // Create audit log entry
      await vvipAuditService.logVvipAction({
        action_type: 'vvip_revoked',
        performed_by: adminId,
        affected_user: userId,
        timestamp: revokedAt,
        metadata: {
          revoked_at: revokedAt.toDate().toISOString(),
          previous_vvip_created_by: userData.vvip_created_by,
          previous_vvip_created_at: userData.vvip_created_at?.toDate().toISOString(),
        },
      });

      return {
        success: true,
        message: 'VVIP status revoked successfully',
        userId,
      };
    } catch (error) {
      if (error instanceof VvipError) {
        throw error;
      }
      console.error('Error revoking VVIP status:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to revoke VVIP status',
        500
      );
    }
  }

  /**
   * Get all VVIP shoppers with optional filtering
   * Requirements: 2.1, 2.7, 2.8, 2.9
   * 
   * @param filters - Optional filters to apply
   * @returns Array of VVIP shoppers
   */
  static async getVvipShoppers(filters?: VvipFilters): Promise<VvipShopper[]> {
    try {
      // Start with base query for VVIP users
      let query = adminDb
        .collection(this.USERS_COLLECTION)
        .where('isVvip', '==', true);

      // Apply country filter
      if (filters?.country) {
        query = query.where('registration_country', '==', filters.country);
      }

      // Apply date range filter
      if (filters?.dateRange) {
        const startTimestamp = Timestamp.fromDate(filters.dateRange.start);
        const endTimestamp = Timestamp.fromDate(filters.dateRange.end);
        query = query
          .where('vvip_created_at', '>=', startTimestamp)
          .where('vvip_created_at', '<=', endTimestamp);
      }

      // Apply creator filter
      if (filters?.createdBy) {
        query = query.where('vvip_created_by', '==', filters.createdBy);
      }

      // Execute query
      const snapshot = await query.get();

      // Map documents to VvipShopper objects
      const shoppers: VvipShopper[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // Apply search query filter (client-side for email/name search)
        if (filters?.searchQuery) {
          const searchLower = filters.searchQuery.toLowerCase();
          const email = (data.email || '').toLowerCase();
          const firstName = (data.first_name || data.firstName || '').toLowerCase();
          const lastName = (data.last_name || data.lastName || '').toLowerCase();
          const fullName = `${firstName} ${lastName}`.toLowerCase();

          if (
            !email.includes(searchLower) &&
            !firstName.includes(searchLower) &&
            !lastName.includes(searchLower) &&
            !fullName.includes(searchLower) &&
            !doc.id.includes(searchLower)
          ) {
            continue;
          }
        }

        shoppers.push({
          userId: doc.id,
          firstName: data.first_name || data.firstName || '',
          lastName: data.last_name || data.lastName || '',
          email: data.email || '',
          country: data.registration_country || data.country || '',
          isVvip: true,
          vvip_created_by: data.vvip_created_by || '',
          vvip_created_at: data.vvip_created_at || Timestamp.now(),
        });
      }

      // Fetch creator names for all shoppers
      const creatorIds = [...new Set(shoppers.map(s => s.vvip_created_by))];
      const creatorNames = await this.getCreatorNames(creatorIds);

      // Add creator names to shoppers
      shoppers.forEach(shopper => {
        shopper.createdByName = creatorNames.get(shopper.vvip_created_by);
      });

      return shoppers;
    } catch (error) {
      console.error('Error fetching VVIP shoppers:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch VVIP shoppers',
        500
      );
    }
  }

  /**
   * Get creator names for a list of user IDs
   * Helper function to populate createdByName field
   * 
   * @param creatorIds - Array of creator user IDs
   * @returns Map of userId to creator name
   */
  private static async getCreatorNames(
    creatorIds: string[]
  ): Promise<Map<string, string>> {
    const creatorNames = new Map<string, string>();

    if (creatorIds.length === 0) {
      return creatorNames;
    }

    try {
      // Fetch marketing users in batches (Firestore 'in' query limit is 10)
      const batchSize = 10;
      for (let i = 0; i < creatorIds.length; i += batchSize) {
        const batch = creatorIds.slice(i, i + batchSize);
        const snapshot = await adminDb
          .collection(this.MARKETING_USERS_COLLECTION)
          .where('__name__', 'in', batch)
          .get();

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          creatorNames.set(doc.id, data.name || data.email || 'Unknown');
        });
      }

      return creatorNames;
    } catch (error) {
      console.error('Error fetching creator names:', error);
      return creatorNames;
    }
  }

  /**
   * Get VVIP shopper by user ID
   * 
   * @param userId - User ID to fetch
   * @returns VVIP shopper if found and is VVIP, null otherwise
   */
  static async getVvipShopperById(userId: string): Promise<VvipShopper | null> {
    try {
      const userDoc = await adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        return null;
      }

      const data = userDoc.data()!;

      if (data.isVvip !== true) {
        return null;
      }

      const shopper: VvipShopper = {
        userId: userDoc.id,
        firstName: data.first_name || data.firstName || '',
        lastName: data.last_name || data.lastName || '',
        email: data.email || '',
        country: data.registration_country || data.country || '',
        isVvip: true,
        vvip_created_by: data.vvip_created_by || '',
        vvip_created_at: data.vvip_created_at || Timestamp.now(),
      };

      // Fetch creator name
      if (shopper.vvip_created_by) {
        const creatorNames = await this.getCreatorNames([shopper.vvip_created_by]);
        shopper.createdByName = creatorNames.get(shopper.vvip_created_by);
      }

      return shopper;
    } catch (error) {
      console.error('Error fetching VVIP shopper by ID:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch VVIP shopper',
        500
      );
    }
  }

  /**
   * Check if a user is a VVIP shopper
   * 
   * @param userId - User ID to check
   * @returns True if user is VVIP
   */
  static async isVvipUser(userId: string): Promise<boolean> {
    try {
      const userDoc = await adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        return false;
      }

      const data = userDoc.data();
      return data?.isVvip === true;
    } catch (error) {
      console.error('Error checking VVIP status:', error);
      return false;
    }
  }

  /**
   * Get VVIP statistics
   * 
   * @returns Statistics about VVIP program
   */
  static async getVvipStatistics(): Promise<{
    totalVvipShoppers: number;
    vvipByCountry: Map<string, number>;
    recentVvipShoppers: VvipShopper[];
  }> {
    try {
      const snapshot = await adminDb
        .collection(this.USERS_COLLECTION)
        .where('isVvip', '==', true)
        .get();

      const totalVvipShoppers = snapshot.size;
      const vvipByCountry = new Map<string, number>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const country = data.registration_country || data.country || 'Unknown';
        vvipByCountry.set(country, (vvipByCountry.get(country) || 0) + 1);
      });

      // Get recent VVIP shoppers (last 10)
      const recentSnapshot = await adminDb
        .collection(this.USERS_COLLECTION)
        .where('isVvip', '==', true)
        .orderBy('vvip_created_at', 'desc')
        .limit(10)
        .get();

      const recentVvipShoppers: VvipShopper[] = recentSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: doc.id,
          firstName: data.first_name || data.firstName || '',
          lastName: data.last_name || data.lastName || '',
          email: data.email || '',
          country: data.registration_country || data.country || '',
          isVvip: true,
          vvip_created_by: data.vvip_created_by || '',
          vvip_created_at: data.vvip_created_at || Timestamp.now(),
        };
      });

      return {
        totalVvipShoppers,
        vvipByCountry,
        recentVvipShoppers,
      };
    } catch (error) {
      console.error('Error fetching VVIP statistics:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch VVIP statistics',
        500
      );
    }
  }
}

// Export singleton instance methods for convenience
export const vvipService = {
  searchUsers: VvipService.searchUsers.bind(VvipService),
  searchUsersByEmail: VvipService.searchUsersByEmail.bind(VvipService),
  searchUserById: VvipService.searchUserById.bind(VvipService),
  validateUserExists: VvipService.validateUserExists.bind(VvipService),
  createVvipShopper: VvipService.createVvipShopper.bind(VvipService),
  revokeVvipStatus: VvipService.revokeVvipStatus.bind(VvipService),
  getVvipShoppers: VvipService.getVvipShoppers.bind(VvipService),
  getVvipShopperById: VvipService.getVvipShopperById.bind(VvipService),
  isVvipUser: VvipService.isVvipUser.bind(VvipService),
  getVvipStatistics: VvipService.getVvipStatistics.bind(VvipService),
};
