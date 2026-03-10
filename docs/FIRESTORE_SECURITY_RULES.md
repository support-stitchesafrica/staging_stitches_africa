# Firestore Security Rules - Unified Backoffice

This document describes the Firestore security rules implemented for the unified backoffice system.

## Overview

The unified backoffice system uses comprehensive Firestore security rules to enforce role-based access control across all departments. The rules ensure that users can only access data they have permission for based on their assigned role and department access.

## Core Helper Functions

### Authentication Functions

- `isAuthenticated()` - Checks if user is authenticated
- `isBackOfficeUser()` - Checks if user exists in backoffice_users collection and is active
- `getBackOfficeUser()` - Retrieves the user's backoffice document
- `isSuperAdmin()` - Checks if user has superadmin role

### Permission Functions

- `hasPermission(department, level)` - Checks if user has specific permission level for a department
- `canAccessDepartment(department)` - Checks if user has access to a department

## Collection Rules

### backoffice_users
- **Read**: Users can read their own document, superadmins can read all
- **Create**: Superadmins can create users, users can create their own during invitation acceptance
- **Update**: Superadmins can update any user, users can update limited fields on their own document
- **Delete**: Only superadmins can delete users

### backoffice_invitations
- **Read**: Superadmins can read all, users can read invitations sent to their email
- **Create**: Only superadmins can create invitations
- **Update**: Only superadmins can update invitations
- **Delete**: Only superadmins can delete invitations

### Analytics Collections
- **website_hits, sales_data, product_analytics, logistics_data**
- **Read**: Users with analytics read permission
- **Write**: Users with analytics write permission
- **Delete**: Users with analytics delete permission

### Promotional Collections
- **promotional_events, promotional_products**
- **Read**: Users with promotions read permission or legacy promotional users
- **Write**: Users with promotions write permission
- **Delete**: Users with promotions delete permission

### Collections CMS
- **collections, featured_collections**
- **Read**: Public read access for frontend
- **Write**: Users with collections write permission or legacy collections users
- **Delete**: Users with collections delete permission

### Marketing Collections
- **marketing_vendors**
- **Read**: Users with marketing read permission or legacy marketing users
- **Write**: Users with marketing write permission
- **Delete**: Users with marketing delete permission

### Admin Collections
- **system_settings**
- **Read**: Users with admin read permission
- **Write**: Users with admin write permission
- **Delete**: Users with admin delete permission

## Role Permissions Matrix

| Role | Analytics | Promotions | Collections | Marketing | Admin |
|------|-----------|------------|-------------|-----------|-------|
| superadmin | RWD | RWD | RWD | RWD | RWD |
| founder | R | R | R | R | - |
| bdm | RW | R | - | RW | - |
| brand_lead | RW | R | - | - | - |
| logistics_lead | RW | - | - | - | - |
| marketing_manager | R | - | - | RWD | - |
| marketing_member | - | - | - | RW | - |
| admin | R | RWD | RW | - | RW |
| editor | R | RW | RW | - | - |
| viewer | R | R | R | - | - |

**Legend**: R = Read, W = Write, D = Delete

## Legacy Compatibility

The rules maintain backward compatibility with existing systems:
- Atlas users can still access analytics data
- Promotional users can still manage promotional events
- Collections users can still manage collections
- Marketing users can still access marketing data
- Admin users can still access admin functions

## Security Features

1. **Authentication Required**: All backoffice operations require authentication
2. **Role-Based Access**: Permissions are strictly enforced based on user roles
3. **Department Isolation**: Users can only access departments they're assigned to
4. **Granular Permissions**: Read, write, and delete permissions are separately controlled
5. **Audit Trail**: All operations are logged with user context
6. **Legacy Support**: Existing systems continue to work during migration

## Testing

The rules have been validated for:
- Proper syntax and structure
- Authentication enforcement
- Permission-based access control
- Role-specific restrictions
- Legacy system compatibility

## Deployment

To deploy these rules:

1. Ensure Firebase CLI is installed and authenticated
2. Run `firebase deploy --only firestore:rules`
3. Verify deployment in Firebase Console
4. Test with different user roles to confirm permissions

## Monitoring

Monitor rule performance and security:
- Check Firebase Console for rule evaluation metrics
- Monitor for unauthorized access attempts
- Review query performance with new indexes
- Track rule evaluation costs

## Maintenance

Regular maintenance tasks:
- Review and update permissions as roles evolve
- Clean up unused legacy compatibility rules after migration
- Optimize rules for performance
- Update documentation when rules change