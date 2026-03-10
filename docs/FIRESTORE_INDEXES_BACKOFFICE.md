# Firestore Indexes for Unified Backoffice System

This document outlines all the Firestore indexes created for the unified backoffice system as part of Task 32.

## Overview

The indexes have been added to `firestore.indexes.json` to optimize query performance for the unified backoffice system. These indexes support efficient querying of users and invitations based on common access patterns.

## Backoffice Users Collection (`backoffice_users`)

### Single Field Indexes

1. **Email Index**
   - Field: `email` (ascending)
   - Use case: User lookup by email during authentication

2. **Role Index**
   - Field: `role` (ascending)
   - Use case: Filtering users by role type

3. **Active Status Index**
   - Field: `isActive` (ascending)
   - Use case: Filtering active/inactive users

4. **Departments Array Index**
   - Field: `departments` (array-contains)
   - Use case: Finding users with access to specific departments

5. **Last Login Index**
   - Field: `lastLogin` (descending)
   - Use case: Sorting users by recent activity

### Composite Indexes

1. **Active Users by Creation Date**
   - Fields: `isActive` (ascending) + `createdAt` (descending)
   - Use case: Getting recently created active users

2. **Role and Active Status**
   - Fields: `role` (ascending) + `isActive` (ascending)
   - Use case: Filtering users by role and active status

3. **Department Access by Active Status**
   - Fields: `departments` (array-contains) + `isActive` (ascending)
   - Use case: Finding active users with access to specific departments

4. **Role by Department Access**
   - Fields: `role` (ascending) + `departments` (array-contains)
   - Use case: Finding users of specific roles with department access

5. **Email and Active Status**
   - Fields: `email` (ascending) + `isActive` (ascending)
   - Use case: Verifying active user by email

## Backoffice Invitations Collection (`backoffice_invitations`)

### Single Field Indexes

1. **Email Index**
   - Field: `email` (ascending)
   - Use case: Finding invitations by email address

2. **Status Index**
   - Field: `status` (ascending)
   - Use case: Filtering invitations by status (pending, accepted, expired)

3. **Token Index**
   - Field: `token` (ascending)
   - Use case: Validating invitation tokens

4. **Expiration Index**
   - Field: `expiresAt` (ascending)
   - Use case: Finding expired invitations for cleanup

### Composite Indexes

1. **Status by Creation Date**
   - Fields: `status` (ascending) + `createdAt` (descending)
   - Use case: Getting recent invitations by status

2. **Inviter by Creation Date**
   - Fields: `invitedBy` (ascending) + `createdAt` (descending)
   - Use case: Finding invitations created by specific users

3. **Email and Status**
   - Fields: `email` (ascending) + `status` (ascending)
   - Use case: Checking invitation status for specific email

4. **Status and Expiration**
   - Fields: `status` (ascending) + `expiresAt` (ascending)
   - Use case: Finding pending invitations that are about to expire

5. **Role by Creation Date**
   - Fields: `role` (ascending) + `createdAt` (descending)
   - Use case: Getting recent invitations by role type

## Query Performance Benefits

These indexes provide significant performance improvements for:

### User Management Queries
- Finding users by email during authentication
- Filtering users by role and department access
- Getting active users for team management
- Sorting users by last login activity

### Invitation Management Queries
- Validating invitation tokens
- Finding pending invitations
- Cleaning up expired invitations
- Tracking invitations by inviter

### Team Management Queries
- Listing team members by department
- Filtering users by role and active status
- Finding users with specific permissions

## Deployment

To deploy these indexes to Firebase:

1. **Using the deployment script:**
   ```bash
   ./scripts/deploy-firestore-indexes.sh
   ```

2. **Using Firebase CLI directly:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Prerequisites:**
   - Firebase CLI installed (`npm install -g firebase-tools`)
   - Logged in to Firebase (`firebase login`)
   - Correct Firebase project selected

## Monitoring

After deployment, monitor index usage in the Firebase Console:
1. Go to Firestore → Indexes
2. Check index status and usage statistics
3. Monitor query performance improvements

## Requirements Satisfied

This implementation satisfies the following requirements from Task 32:

- ✅ Updated firestore.indexes.json
- ✅ Added indexes for backoffice_users (email, role, isActive, departments)
- ✅ Added indexes for backoffice_invitations (email, status, token, expiresAt)
- ✅ Added composite indexes for common queries
- ✅ Created deployment script for Firebase deployment
- ✅ Requirements 16.2, 16.3 satisfied

## Next Steps

1. Deploy the indexes using the provided script
2. Monitor query performance in Firebase Console
3. Adjust indexes if new query patterns emerge
4. Consider adding additional indexes for future features