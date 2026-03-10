# Marketing Dashboard - User Invitation System

## Overview

The Marketing Dashboard now has a fully functional user invitation system that works exactly like the Atlas Dashboard. Super Admins can invite new users with Stitches Africa email addresses, assign them roles, and the invited users will receive email notifications with invitation links.

## Features

### 1. Add Member Dialog
- **Location**: `components/marketing/team/AddMemberDialog.tsx`
- **Trigger**: Click "Invite User" button in Super Admin Dashboard
- **Functionality**:
  - Email validation (only @stitchesafrica.com and @stitchesafrica.pro)
  - Role assignment (Super Admin, Team Lead, BDM, Team Member)
  - Real-time form validation
  - Loading states with progress indicators
  - Error handling with user-friendly messages

### 2. Email Notifications
- **Template**: `lib/emailTemplates/marketingInvitationTemplate.ts`
- **Content**:
  - Personalized greeting with invitee's name
  - Inviter's name displayed
  - Role assignment information
  - Secure invitation link
  - 72-hour expiration notice
  - Support contact information

### 3. Invitation API
- **Endpoint**: `POST /api/marketing/invites/create`
- **Authentication**: Requires Super Admin role
- **Features**:
  - Domain validation
  - Duplicate invitation prevention
  - JWT token generation
  - Email sending via staging API
  - Activity logging

## User Flow

### For Super Admins (Inviting Users)

1. Navigate to Marketing Dashboard
2. Click "Invite User" button (top right or in User Management tab)
3. Fill in the invitation form:
   - Full Name
   - Email (must be @stitchesafrica.com or @stitchesafrica.pro)
   - Role (Super Admin, Team Lead, BDM, or Team Member)
4. Click "Send Invitation"
5. System creates invitation and sends email
6. Success notification appears

### For Invited Users (Accepting Invitations)

1. Receive invitation email
2. Click "Accept Invitation" button in email
3. Redirected to `/marketing/invite/[token]` page
4. Create account with password
5. Automatically logged in with assigned role
6. Redirected to appropriate dashboard

## Email Domain Validation

Only the following email domains are allowed:
- `@stitchesafrica.com`
- `@stitchesafrica.pro`

This ensures only authorized company employees can access the Marketing Dashboard.

## Role Permissions

### Super Admin
- Full access to all features
- Can invite and manage users
- Can create and manage teams
- Can assign vendors to teams
- View all analytics

### Team Lead
- Manage team members
- View team analytics
- Cannot invite users or manage other teams

### BDM (Business Development Manager)
- Manage vendors and teams
- View analytics
- Can add members to teams
- Cannot invite new users

### Team Member
- Basic access to assigned vendors
- Limited analytics view
- Cannot manage users or teams

## Integration Points

### Components Using the Dialog

1. **SuperAdminDashboard** (`components/marketing/SuperAdminDashboard.tsx`)
   - Main "Invite User" button in header
   - "Invite New User" button in User Management tab

2. **Future Integration Points**
   - Team Management Interface
   - User Management Page
   - Settings Page

### API Endpoints

- `POST /api/marketing/invites/create` - Create new invitation
- `GET /api/marketing/invites` - List all invitations
- `GET /api/marketing/invites/[id]` - Get specific invitation
- `DELETE /api/marketing/invites/[id]` - Revoke invitation

### Services

- **InvitationService** (`lib/marketing/invitation-service.ts`)
  - Create, validate, and manage invitations
  - Token generation and verification
  - Email domain validation

- **ActivityLogService** (`lib/marketing/activity-log-service.ts`)
  - Log invitation sent events
  - Log invitation acceptance events
  - Track user actions

## Security Features

1. **Email Domain Validation**: Only company emails allowed
2. **JWT Tokens**: Secure, time-limited invitation tokens
3. **Token Expiration**: Invitations expire after 72 hours
4. **Role-Based Access**: Only Super Admins can invite users
5. **Duplicate Prevention**: Cannot send multiple invitations to same email
6. **Authentication Required**: All API calls require valid Firebase ID token

## Error Handling

The system handles various error scenarios:

- **Invalid Email Domain**: Clear error message with allowed domains
- **Duplicate Invitation**: Notifies that invitation already exists
- **Network Errors**: User-friendly network error messages
- **Authentication Errors**: Prompts user to log in again
- **Rate Limiting**: Prevents spam invitations
- **Token Expiration**: Clear message to request new invitation

## Testing

### Manual Testing Checklist

- [ ] Super Admin can open invitation dialog
- [ ] Form validation works for all fields
- [ ] Email domain validation rejects invalid domains
- [ ] Email domain validation accepts valid domains
- [ ] Invitation email is sent successfully
- [ ] Email contains correct information
- [ ] Invitation link works
- [ ] Expired invitations show error
- [ ] Non-Super Admins cannot access invite API
- [ ] Duplicate invitations are prevented

### Test Accounts

Use these test scenarios:

1. **Valid Invitation**
   - Email: `test.user@stitchesafrica.com`
   - Role: Team Member
   - Expected: Success

2. **Invalid Domain**
   - Email: `test@gmail.com`
   - Expected: Validation error

3. **Duplicate Invitation**
   - Send invitation twice to same email
   - Expected: Error on second attempt

## Troubleshooting

### Invitation Email Not Received

1. Check spam/junk folder
2. Verify email address is correct
3. Check staging API logs
4. Verify email service is running

### Invitation Link Not Working

1. Check if invitation has expired (72 hours)
2. Verify token is valid
3. Check browser console for errors
4. Try copying link directly instead of clicking

### Permission Denied

1. Verify user is Super Admin
2. Check Firebase authentication
3. Refresh ID token
4. Log out and log back in

## Future Enhancements

- [ ] Bulk invitation support
- [ ] Custom invitation messages
- [ ] Invitation templates
- [ ] Resend invitation functionality
- [ ] Invitation analytics dashboard
- [ ] Email preview before sending
- [ ] Custom expiration times
- [ ] Invitation history tracking

## Related Documentation

- [Marketing Dashboard README](./README.md)
- [Atlas Invitation System](../atlas/INVITATION_SYSTEM.md)
- [Email Templates Guide](../../lib/emailTemplates/README.md)
- [Authentication Guide](../../docs/AUTHENTICATION.md)
