# Migration Scripts

This directory contains migration scripts for database updates and data transformations.

## Atlas Users Migration

### Purpose
Migrates existing Atlas users in the `atlasUsers` Firestore collection to include the new role-based access control fields.

### What it does
- Adds `role` field (defaults to "superadmin") for users without a role
- Ensures all users have `isAtlasUser: true`
- Updates the `updatedAt` timestamp for modified records
- Uses Firestore batch writes for efficient bulk updates

### Usage

Run the migration script using npm:

```bash
npm run migrate:atlas-users
```

Or directly with ts-node:

```bash
npx ts-node scripts/migrate-atlas-users.ts
```

### Output
The script provides detailed logging including:
- Number of users found
- Which users are being updated and what changes are made
- Batch commit confirmations
- Final migration statistics (total, updated, skipped, errors)

### Safety
- The script only updates users that need changes
- Users already with correct fields are skipped
- Uses Firestore batch writes (max 500 operations per batch)
- Provides detailed logging for audit purposes

### Requirements
- Node.js and npm installed
- Firebase credentials configured in the script
- Network access to Firestore database

### Related Documentation
- Requirements: 12.4, 12.5 in `.kiro/specs/atlas-team-management/requirements.md`
- Design: Migration Strategy section in `.kiro/specs/atlas-team-management/design.md`
