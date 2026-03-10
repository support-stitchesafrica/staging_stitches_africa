# Marketing Dashboard

## Overview

The Marketing Dashboard is a comprehensive system for managing vendor relationships, team assignments, and marketing activities for Stitches Africa.

## Roles & Permissions

### Super Admin
- **Full Access** to all features
- Can create and manage all users
- Can create and manage teams
- Can assign vendors to any team member
- Can view all analytics and reports
- Can export all data
- Can manage system settings

### BDM (Business Development Manager)
- Can view and manage all vendors
- Can assign vendors to team members
- Can create and manage teams
- Can view analytics for all teams
- Can export vendor data
- Cannot manage other BDMs or Super Admins

### Team Lead
- Can view and manage their team members
- Can view vendors assigned to their team
- Can reassign vendors within their team
- Can view analytics for their team
- Can export their team's data

### Team Member
- Can view vendors assigned to them
- Can update vendor interactions
- Can view their own analytics
- Can manage their tasks

## Setup Instructions

### 1. Set Up Super Admin

If you're the first user setting up the marketing dashboard, run:

```bash
npm run setup:marketing-admin your-email@stitchesafrica.com
```

This will:
- Create your user in the `marketing_users` collection
- Assign you the `super_admin` role
- Grant you all permissions

### 2. Access the Dashboard

Navigate to: `/marketing/auth/login`

Log in with your Stitches Africa email (@stitchesafrica.com or @stitchesafrica.pro)

### 3. Create Additional Users

As a Super Admin, you can:
1. Go to `/marketing/admin/teams`
2. Create teams
3. Invite users via email
4. Assign roles (BDM, Team Lead, Team Member)

## Features

### Vendor Management (`/marketing/vendors`)
- View all vendors from the system
- Assign vendors to team members
- Track vendor performance
- Export vendor data
- Filter by status, assignment, location

### Team Management (`/marketing/admin/teams`)
- Create and manage teams
- Assign team leads
- Add team members
- View team performance

### Analytics (`/marketing/analytics`)
- View system-wide analytics (Super Admin, BDM)
- View team analytics (Team Lead)
- View personal analytics (Team Member)
- Track vendor interactions
- Monitor conversion rates

### User Management (`/marketing/users`)
- Invite new users
- Manage user roles
- Deactivate users
- View user activity

## Troubleshooting

### "You are not authorized" Error

**Solution 1: Check Your Email Domain**
- Only @stitchesafrica.com and @stitchesafrica.pro emails are allowed
- Make sure you're logged in with the correct email

**Solution 2: Set Up Your User**
```bash
npm run setup:marketing-admin your-email@stitchesafrica.com
```

**Solution 3: Check Firestore**
1. Open Firebase Console
2. Go to Firestore Database
3. Check if you exist in `marketing_users` collection
4. Verify your `role` field is set correctly
5. Verify `isActive` is `true`

### Vendors Not Showing

**Check:**
1. Are you logged in as Super Admin or BDM?
2. Check browser console for errors
3. Verify Firestore rules are deployed
4. Check if tailors collection has data

### Cannot Assign Vendors

**Check:**
1. Do you have `canAssignVendors` permission?
2. Is the team member active?
3. Check browser console for API errors

## API Endpoints

### Users
- `GET /api/marketing/users` - List all users
- `GET /api/marketing/users/me` - Get current user
- `POST /api/marketing/users` - Create user
- `PATCH /api/marketing/users/[id]` - Update user
- `DELETE /api/marketing/users/[id]` - Delete user

### Vendors
- `GET /api/marketing/vendors` - List vendors
- `POST /api/marketing/vendors/assign` - Assign vendor
- `POST /api/marketing/vendors/bulk-assign` - Bulk assign
- `POST /api/marketing/vendors/transfer` - Transfer vendor

### Teams
- `GET /api/marketing/teams` - List teams
- `POST /api/marketing/teams` - Create team
- `PATCH /api/marketing/teams/[id]` - Update team
- `DELETE /api/marketing/teams/[id]` - Delete team

## Database Collections

### `marketing_users`
Stores all marketing dashboard users with roles and permissions.

### `marketing_teams`
Stores team information and member assignments.

### `marketing_vendor_assignments`
Tracks which vendors are assigned to which team members.

### `marketing_interactions`
Logs all vendor interactions by team members.

### `marketing_activity_logs`
Audit log of all actions in the marketing dashboard.

## Security

- All routes are protected by Firebase Authentication
- Role-based access control via Firestore rules
- Email domain validation (@stitchesafrica.com only)
- Activity logging for audit trails
- Secure API endpoints with authentication middleware

## Support

For issues or questions, contact:
- Technical Support: tech@stitchesafrica.com
- System Admin: admin@stitchesafrica.com
