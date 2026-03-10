/**
 * Migration Service for Unified Back Office System
 * Handles migration of users from legacy systems to unified backoffice
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { BackOfficeUser, BackOfficeRole, MigrationError } from '@/types/backoffice';
import { PermissionService } from './permission-service';
import { UserService } from './user-service';
import type { Timestamp } from 'firebase-admin/firestore';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

/**
 * Legacy system identifiers
 */
export type LegacySystem = 'atlas' | 'promotional' | 'collections' | 'marketing' | 'admin';

/**
 * Legacy role types from each system
 */
export type LegacyRole = 
  // Atlas roles
  | 'superadmin'
  | 'founder'
  | 'sales_lead'      // Maps to bdm
  | 'brand_lead'
  | 'logistics_lead'
  // Marketing roles
  | 'super_admin'     // Maps to superadmin
  | 'team_lead'       // Maps to marketing_manager
  | 'bdm'
  | 'team_member'     // Maps to marketing_member
  // Promotional/Collections/Admin roles
  | 'admin'
  | 'editor'
  | 'viewer';

/**
 * Legacy user structure (common fields across systems)
 */
export interface LegacyUser {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  name?: string;
  role: LegacyRole;
  teamId?: string;
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;
}

/**
 * Migration result for a single user
 */
export interface MigrationResult {
  success: boolean;
  uid: string;
  email: string;
  legacyRole: LegacyRole;
  unifiedRole?: BackOfficeRole;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

/**
 * Migration summary
 */
export interface MigrationSummary {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  results: MigrationResult[];
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
}

/**
 * Migration Service
 */
export class MigrationService {
  /**
   * Role mapping from legacy systems to unified backoffice
   * Requirement: 15.2 - Map old roles to corresponding unified roles
   */
  private static readonly ROLE_MAPPING: Record<LegacyRole, BackOfficeRole> = {
    // Atlas roles - direct mapping
    'superadmin': 'superadmin',
    'founder': 'founder',
    'sales_lead': 'bdm',           // Merged: Sales Lead → BDM
    'brand_lead': 'brand_lead',
    'logistics_lead': 'logistics_lead',
    
    // Marketing roles
    'super_admin': 'superadmin',   // Marketing super_admin → superadmin
    'team_lead': 'marketing_manager', // Renamed: team_lead → marketing_manager
    'bdm': 'bdm',
    'team_member': 'marketing_member', // Renamed: team_member → marketing_member
    
    // Content management roles - direct mapping
    'admin': 'admin',
    'editor': 'editor',
    'viewer': 'viewer',
  };

  /**
   * Legacy collection names for each system
   */
  private static readonly LEGACY_COLLECTIONS: Record<LegacySystem, string> = {
    'atlas': 'atlasUsers',
    'promotional': 'promotionalUsers',
    'collections': 'collectionsUsers',
    'marketing': 'marketing_users',
    'admin': 'admins', // Note: May not exist, verify before migration
  };

  /**
   * Map legacy role to unified role
   * Requirement: 15.2 - Map old roles to corresponding unified roles
   */
  static mapRole(legacyRole: LegacyRole): BackOfficeRole {
    const unifiedRole = this.ROLE_MAPPING[legacyRole];
    
    if (!unifiedRole) {
      throw new Error(`${MigrationError.INVALID_ROLE_MAPPING}: ${legacyRole}`);
    }
    
    return unifiedRole;
  }

  /**
   * Check if user has already been migrated
   * Requirement: 15.4 - Skip logic for already migrated users
   */
  static async isUserMigrated(email: string): Promise<boolean> {
    try {
      const existingUser = await UserService.getUserByEmail(email);
      return existingUser !== null;
    } catch (error) {
      console.error('Error checking if user is migrated:', error);
      return false;
    }
  }

  /**
   * Migrate a single user from legacy system to unified backoffice
   * Requirement: 15.1 - Copy all users from existing collections
   * Requirement: 15.2 - Map old roles to corresponding unified roles
   * Requirement: 15.3 - Preserve all user permissions and access levels
   */
  static async migrateUser(
    legacyUser: LegacyUser,
    sourceSystem: LegacySystem,
    options?: {
      skipIfExists?: boolean;
      dryRun?: boolean;
    }
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      uid: legacyUser.uid,
      email: legacyUser.email,
      legacyRole: legacyUser.role,
    };

    try {
      // Validate source system
      if (!this.LEGACY_COLLECTIONS[sourceSystem]) {
        result.error = `${MigrationError.INVALID_SOURCE_SYSTEM}: ${sourceSystem}`;
        return result;
      }

      // Check if user already migrated
      const alreadyMigrated = await this.isUserMigrated(legacyUser.email);
      
      if (alreadyMigrated) {
        if (options?.skipIfExists !== false) {
          result.skipped = true;
          result.reason = MigrationError.USER_ALREADY_MIGRATED;
          result.success = true; // Not an error, just skipped
          return result;
        } else {
          result.error = MigrationError.USER_ALREADY_MIGRATED;
          return result;
        }
      }

      // Map legacy role to unified role
      let unifiedRole: BackOfficeRole;
      try {
        unifiedRole = this.mapRole(legacyUser.role);
        result.unifiedRole = unifiedRole;
      } catch (error) {
        result.error = error instanceof Error ? error.message : MigrationError.INVALID_ROLE_MAPPING;
        return result;
      }

      // If dry run, stop here
      if (options?.dryRun) {
        result.success = true;
        result.reason = 'Dry run - no changes made';
        return result;
      }

      // Get permissions for the unified role
      const permissions = PermissionService.getRolePermissions(unifiedRole);
      
      // Determine departments based on permissions
      const departments = PermissionService.getDepartmentsForRole(unifiedRole);

      // Extract full name from various possible fields
      const fullName = legacyUser.fullName || legacyUser.displayName || legacyUser.name || legacyUser.email.split('@')[0];

      // Check if Firebase Auth user exists
      let firebaseUid = legacyUser.uid;
      try {
        await adminAuth.getUser(legacyUser.uid);
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found') {
          // Firebase Auth user doesn't exist, we'll need to handle this
          // For now, we'll skip this user and log it
          result.error = `Firebase Auth user not found: ${legacyUser.uid}`;
          result.reason = 'User exists in Firestore but not in Firebase Auth';
          return result;
        }
        throw authError;
      }

      const now = AdminTimestamp.now();

      // Create migrated user document
      const migratedUser: BackOfficeUser = {
        uid: firebaseUid,
        email: legacyUser.email,
        fullName,
        role: unifiedRole,
        departments,
        permissions,
        teamId: legacyUser.teamId,
        isActive: legacyUser.isActive !== false, // Default to true if not specified
        createdAt: legacyUser.createdAt || now,
        updatedAt: now,
        migratedFrom: {
          system: sourceSystem,
          originalUid: legacyUser.uid,
          migratedAt: now,
        },
      } as any;

      // Preserve last login if available
      if (legacyUser.lastLoginAt) {
        migratedUser.lastLogin = legacyUser.lastLoginAt;
      }

      // Save to unified backoffice_users collection
      await adminDb.collection('backoffice_users').doc(firebaseUid).set(migratedUser);

      result.success = true;
      return result;

    } catch (error) {
      console.error(`Error migrating user ${legacyUser.email}:`, error);
      result.error = error instanceof Error ? error.message : MigrationError.MIGRATION_FAILED;
      return result;
    }
  }

  /**
   * Migrate all users from a specific legacy system
   * Requirement: 15.1 - Copy all users from existing collections
   * Requirement: 15.4 - Log failures and continue with remaining users
   * Requirement: 15.5 - Skip logic for already migrated users
   */
  static async migrateAllUsers(
    sourceSystem: LegacySystem,
    options?: {
      skipIfExists?: boolean;
      dryRun?: boolean;
      batchSize?: number;
    }
  ): Promise<MigrationSummary> {
    const startTime = new Date();
    const results: MigrationResult[] = [];
    const batchSize = options?.batchSize || 100;

    console.log(`Starting migration from ${sourceSystem} system...`);
    if (options?.dryRun) {
      console.log('DRY RUN MODE - No changes will be made');
    }

    try {
      // Get legacy collection name
      const collectionName = this.LEGACY_COLLECTIONS[sourceSystem];
      
      if (!collectionName) {
        throw new Error(`${MigrationError.INVALID_SOURCE_SYSTEM}: ${sourceSystem}`);
      }

      // Fetch all users from legacy collection
      const legacyUsersSnapshot = await adminDb.collection(collectionName).get();
      
      console.log(`Found ${legacyUsersSnapshot.size} users in ${collectionName}`);

      // Process users in batches
      const legacyUsers: LegacyUser[] = [];
      legacyUsersSnapshot.forEach(doc => {
        const data = doc.data();
        legacyUsers.push({
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          fullName: data.fullName,
          name: data.name,
          role: data.role,
          teamId: data.teamId,
          isActive: data.isActive,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          lastLoginAt: data.lastLoginAt || data.lastLogin,
        });
      });

      // Process in batches
      for (let i = 0; i < legacyUsers.length; i += batchSize) {
        const batch = legacyUsers.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} users)...`);

        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(user => this.migrateUser(user, sourceSystem, options))
        );

        results.push(...batchResults);

        // Log progress
        const processed = Math.min(i + batchSize, legacyUsers.length);
        console.log(`Progress: ${processed}/${legacyUsers.length} users processed`);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Calculate summary
      const summary: MigrationSummary = {
        total: results.length,
        migrated: results.filter(r => r.success && !r.skipped).length,
        skipped: results.filter(r => r.skipped).length,
        failed: results.filter(r => !r.success).length,
        results,
        startTime,
        endTime,
        duration,
      };

      // Log summary
      console.log('\n=== Migration Summary ===');
      console.log(`System: ${sourceSystem}`);
      console.log(`Total users: ${summary.total}`);
      console.log(`Migrated: ${summary.migrated}`);
      console.log(`Skipped: ${summary.skipped}`);
      console.log(`Failed: ${summary.failed}`);
      console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);

      if (summary.failed > 0) {
        console.log('\n=== Failed Migrations ===');
        results.filter(r => !r.success && !r.skipped).forEach(r => {
          console.log(`- ${r.email} (${r.legacyRole}): ${r.error}`);
        });
      }

      return summary;

    } catch (error) {
      console.error('Error during migration:', error);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        total: results.length,
        migrated: results.filter(r => r.success && !r.skipped).length,
        skipped: results.filter(r => r.skipped).length,
        failed: results.filter(r => !r.success).length,
        results,
        startTime,
        endTime,
        duration,
      };
    }
  }

  /**
   * Migrate users from all legacy systems
   * Convenience method to migrate from all systems at once
   */
  static async migrateAllSystems(options?: {
    skipIfExists?: boolean;
    dryRun?: boolean;
    batchSize?: number;
    systems?: LegacySystem[];
  }): Promise<Record<LegacySystem, MigrationSummary>> {
    const systems = options?.systems || ['atlas', 'promotional', 'collections', 'marketing', 'admin'];
    const summaries: Record<string, MigrationSummary> = {};

    console.log('=== Starting Multi-System Migration ===');
    console.log(`Systems to migrate: ${systems.join(', ')}`);
    console.log('');

    for (const system of systems) {
      console.log(`\n--- Migrating ${system} system ---`);
      const summary = await this.migrateAllUsers(system, options);
      summaries[system] = summary;
    }

    // Overall summary
    console.log('\n=== Overall Migration Summary ===');
    let totalUsers = 0;
    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const [system, summary] of Object.entries(summaries)) {
      console.log(`\n${system}:`);
      console.log(`  Total: ${summary.total}`);
      console.log(`  Migrated: ${summary.migrated}`);
      console.log(`  Skipped: ${summary.skipped}`);
      console.log(`  Failed: ${summary.failed}`);

      totalUsers += summary.total;
      totalMigrated += summary.migrated;
      totalSkipped += summary.skipped;
      totalFailed += summary.failed;
    }

    console.log('\n=== Grand Total ===');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Migrated: ${totalMigrated}`);
    console.log(`Skipped: ${totalSkipped}`);
    console.log(`Failed: ${totalFailed}`);

    return summaries as Record<LegacySystem, MigrationSummary>;
  }

  /**
   * Get migration status for a specific user
   */
  static async getUserMigrationStatus(email: string): Promise<{
    isMigrated: boolean;
    user?: BackOfficeUser;
    migratedFrom?: {
      system: LegacySystem;
      originalUid: string;
      migratedAt: Timestamp;
    };
  }> {
    try {
      const user = await UserService.getUserByEmail(email);
      
      if (!user) {
        return { isMigrated: false };
      }

      return {
        isMigrated: true,
        user,
        migratedFrom: user.migratedFrom,
      };
    } catch (error) {
      console.error('Error getting migration status:', error);
      return { isMigrated: false };
    }
  }

  /**
   * Validate migration readiness
   * Checks if all prerequisites are met before migration
   */
  static async validateMigrationReadiness(sourceSystem: LegacySystem): Promise<{
    ready: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check if source collection exists
      const collectionName = this.LEGACY_COLLECTIONS[sourceSystem];
      if (!collectionName) {
        issues.push(`Invalid source system: ${sourceSystem}`);
        return { ready: false, issues };
      }

      // Check if collection has users
      const snapshot = await adminDb.collection(collectionName).limit(1).get();
      if (snapshot.empty) {
        issues.push(`No users found in ${collectionName} collection`);
      }

      // Check if backoffice_users collection is accessible
      try {
        await adminDb.collection('backoffice_users').limit(1).get();
      } catch (error) {
        issues.push('Cannot access backoffice_users collection');
      }

      return {
        ready: issues.length === 0,
        issues,
      };
    } catch (error) {
      issues.push(`Error validating migration readiness: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { ready: false, issues };
    }
  }

  /**
   * Generate migration report
   * Creates a detailed report of migration results
   */
  static generateMigrationReport(summary: MigrationSummary): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('MIGRATION REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Start Time: ${summary.startTime.toISOString()}`);
    lines.push(`End Time: ${summary.endTime.toISOString()}`);
    lines.push(`Duration: ${(summary.duration / 1000).toFixed(2)} seconds`);
    lines.push('');
    lines.push('SUMMARY');
    lines.push('-'.repeat(60));
    lines.push(`Total Users: ${summary.total}`);
    lines.push(`Successfully Migrated: ${summary.migrated}`);
    lines.push(`Skipped (Already Migrated): ${summary.skipped}`);
    lines.push(`Failed: ${summary.failed}`);
    lines.push(`Success Rate: ${((summary.migrated / summary.total) * 100).toFixed(2)}%`);
    lines.push('');

    if (summary.migrated > 0) {
      lines.push('MIGRATED USERS');
      lines.push('-'.repeat(60));
      summary.results
        .filter(r => r.success && !r.skipped)
        .forEach(r => {
          lines.push(`✓ ${r.email} | ${r.legacyRole} → ${r.unifiedRole}`);
        });
      lines.push('');
    }

    if (summary.skipped > 0) {
      lines.push('SKIPPED USERS');
      lines.push('-'.repeat(60));
      summary.results
        .filter(r => r.skipped)
        .forEach(r => {
          lines.push(`⊘ ${r.email} | ${r.reason || 'Already migrated'}`);
        });
      lines.push('');
    }

    if (summary.failed > 0) {
      lines.push('FAILED MIGRATIONS');
      lines.push('-'.repeat(60));
      summary.results
        .filter(r => !r.success && !r.skipped)
        .forEach(r => {
          lines.push(`✗ ${r.email} | ${r.legacyRole}`);
          lines.push(`  Error: ${r.error}`);
          if (r.reason) {
            lines.push(`  Reason: ${r.reason}`);
          }
        });
      lines.push('');
    }

    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }
}
