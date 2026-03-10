# Unified Back Office Migration Service

This document describes the migration service for consolidating users from legacy systems into the unified back office system.

## Overview

The migration service handles the migration of users from five legacy systems into a single unified `backoffice_users` collection:

- **Atlas** (`atlasUsers`) - Analytics dashboard users
- **Promotional** (`promotionalUsers`) - Promotional events management users
- **Collections** (`collectionsUsers`) - Collections CMS users
- **Marketing** (`marketing_users`) - Marketing dashboard users
- **Admin** (`admin_users`) - Admin panel users (if exists)

## Features

- ✅ **Role Mapping**: Automatically maps legacy roles to unified roles
- ✅ **Batch Processing**: Processes users in configurable batches
- ✅ **Error Handling**: Continues migration even if individual users fail
- ✅ **Skip Logic**: Automatically skips already migrated users
- ✅ **Dry Run Mode**: Test migrations without making changes
- ✅ **Detailed Reporting**: Generates comprehensive migration reports
- ✅ **Permission Preservation**: Maintains all user permissions and access levels

## Role Mapping

The service maps legacy roles to unified roles according to the following table:

| Legacy System | Legacy Role | Unified Role | Notes |
|--------------|-------------|--------------|-------|
| Atlas | `superadmin` | `superadmin` | Direct mapping |
| Atlas | `founder` | `founder` | Direct mapping |
| Atlas | `sales_lead` | `bdm` | **Merged** into BDM role |
| Atlas | `brand_lead` | `brand_lead` | Direct mapping |
| Atlas | `logistics_lead` | `logistics_lead` | Direct mapping |
| Marketing | `super_admin` | `superadmin` | Normalized naming |
| Marketing | `team_lead` | `marketing_manager` | Renamed for clarity |
| Marketing | `bdm` | `bdm` | Direct mapping |
| Marketing | `team_member` | `marketing_member` | Renamed for clarity |
| Promotional | `admin` | `admin` | Direct mapping |
| Promotional | `editor` | `editor` | Direct mapping |
| Collections | `admin` | `admin` | Direct mapping |
| Collections | `editor` | `editor` | Direct mapping |
| Collections | `viewer` | `viewer` | Direct mapping |
| Admin | `admin` | `admin` | Direct mapping |

### Key Changes

- **Sales Lead → BDM**: The `sales_lead` role has been merged into the `bdm` role, combining sales analytics management with business development and vendor relationship management.
- **Team Lead → Marketing Manager**: Renamed for consistency and clarity.
- **Team Member → Marketing Member**: Renamed for consistency and clarity.

## Usage

### Command Line Interface

The migration script provides a comprehensive CLI for running migrations:

```bash
# Migrate users from a specific system
npm run migrate:backoffice -- --system=marketing

# Migrate users from all systems
npm run migrate:backoffice -- --system=all

# Dry run (no changes made)
npm run migrate:backoffice -- --system=marketing --dry-run

# Force migration (overwrite existing users)
npm run migrate:backoffice -- --system=marketing --force

# Custom batch size
npm run migrate:backoffice -- --system=atlas --batch-size=50

# Display help
npm run migrate:backoffice -- --help
```

### Programmatic Usage

You can also use the migration service programmatically:

```typescript
import { MigrationService } from '@/lib/backoffice/migration-service';

// Migrate a single user
const result = await MigrationService.migrateUser(
  legacyUser,
  'marketing',
  { skipIfExists: true, dryRun: false }
);

// Migrate all users from a system
const summary = await MigrationService.migrateAllUsers(
  'marketing',
  { skipIfExists: true, batchSize: 100 }
);

// Migrate all systems
const summaries = await MigrationService.migrateAllSystems({
  skipIfExists: true,
  dryRun: false,
});

// Check migration status
const status = await MigrationService.getUserMigrationStatus('user@example.com');

// Validate migration readiness
const validation = await MigrationService.validateMigrationReadiness('marketing');
```

## Migration Process

### 1. Pre-Migration Validation

Before running a migration, the service validates:

- Source collection exists and is accessible
- Target collection (`backoffice_users`) is accessible
- Source collection contains users

```typescript
const validation = await MigrationService.validateMigrationReadiness('marketing');
if (!validation.ready) {
  console.error('Migration validation failed:', validation.issues);
}
```

### 2. User Migration

For each user, the service:

1. Checks if user already exists (skips if `skipIfExists` is true)
2. Maps legacy role to unified role
3. Calculates permissions based on unified role
4. Determines accessible departments
5. Verifies Firebase Auth user exists
6. Creates user document in `backoffice_users` collection
7. Preserves migration metadata

### 3. Error Handling

The migration service handles errors gracefully:

- **User Already Migrated**: Skipped by default (use `--force` to override)
- **Invalid Role Mapping**: Logged and user skipped
- **Firebase Auth User Not Found**: Logged and user skipped
- **Firestore Write Error**: Logged and user skipped

Failed migrations don't stop the process - the service continues with remaining users.

### 4. Reporting

After migration, a detailed report is generated showing:

- Total users processed
- Successfully migrated users
- Skipped users (already migrated)
- Failed migrations with error details
- Duration and success rate

Reports are saved to `migration-reports/` directory.

## Migration Data Structure

### Legacy User Structure

```typescript
interface LegacyUser {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  name?: string;
  role: LegacyRole;
  teamId?: string;
  isActive?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
}
```

### Migrated User Structure

```typescript
interface BackOfficeUser {
  uid: string;
  email: string;
  fullName: string;
  role: BackOfficeRole;
  departments: Department[];
  permissions: DepartmentPermissions;
  teamId?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  invitedBy?: string;
  lastLogin?: Timestamp;
  migratedFrom?: {
    system: 'atlas' | 'promotional' | 'collections' | 'marketing' | 'admin';
    originalUid: string;
    migratedAt: Timestamp;
  };
}
```

## Best Practices

### 1. Always Run Dry Run First

Before performing actual migration, run a dry run to validate:

```bash
npm run migrate:backoffice -- --system=marketing --dry-run
```

### 2. Migrate One System at a Time

For better control and monitoring, migrate systems individually:

```bash
npm run migrate:backoffice -- --system=atlas
npm run migrate:backoffice -- --system=marketing
npm run migrate:backoffice -- --system=promotional
```

### 3. Review Migration Reports

After each migration, review the generated report to identify any issues:

```bash
cat migration-reports/migration-report-marketing-*.txt
```

### 4. Backup Before Migration

Always backup your Firestore database before running migrations:

```bash
# Using Firebase CLI
firebase firestore:export gs://your-bucket/backups/pre-migration
```

### 5. Monitor During Migration

Watch the console output during migration to catch any issues early:

- Total users found
- Batch processing progress
- Failed migrations
- Final summary

## Troubleshooting

### Issue: "Firebase Auth user not found"

**Cause**: User exists in Firestore but not in Firebase Auth

**Solution**: 
- Verify the user exists in Firebase Auth console
- If missing, create the Auth user first or skip this user

### Issue: "User already migrated"

**Cause**: User already exists in `backoffice_users` collection

**Solution**:
- This is expected behavior (skip logic)
- Use `--force` flag to overwrite if needed

### Issue: "Invalid role mapping"

**Cause**: Legacy role doesn't have a mapping to unified role

**Solution**:
- Check the role mapping table
- Update `ROLE_MAPPING` in `migration-service.ts` if needed

### Issue: "Cannot access collection"

**Cause**: Firestore permissions or collection doesn't exist

**Solution**:
- Verify Firestore security rules
- Check collection name is correct
- Ensure Firebase Admin SDK is properly initialized

## Testing

The migration service includes comprehensive tests:

```bash
# Run migration service tests
npm test -- lib/backoffice/migration-service.test.ts

# Run all backoffice tests
npm test -- lib/backoffice/
```

Tests cover:
- Role mapping for all legacy roles
- Migration report generation
- Role mapping validation
- Edge cases and error handling

## Requirements Validation

This migration service satisfies the following requirements:

- **15.1**: Copy all users from existing collections to unified collection
- **15.2**: Map old roles to corresponding unified roles
- **15.3**: Preserve all user permissions and access levels
- **15.4**: Log failures and continue with remaining users
- **15.5**: Skip logic for already migrated users

## Support

For issues or questions about the migration service:

1. Check this documentation
2. Review migration reports for error details
3. Check the console output during migration
4. Review the test suite for examples
5. Contact the development team

## Future Enhancements

Potential improvements for future versions:

- [ ] Rollback functionality
- [ ] Incremental migration (resume from failure)
- [ ] Migration scheduling
- [ ] Email notifications on completion
- [ ] Web UI for migration management
- [ ] Real-time progress tracking
- [ ] Automated backup before migration
