# Marketing Dashboard Component-Level Guards

This directory contains component-level guards for implementing role-based access control (RBAC) in the marketing dashboard.

## Overview

Component-level guards allow you to conditionally render UI elements based on user roles and permissions. This provides fine-grained control over what users can see and interact with.

## Requirements

- Requirements: 8.1, 8.5
- Implements component-level authorization
- Provides conditional rendering based on roles and permissions
- Shows appropriate error messages when access is denied

## Available Guards

### Role-Based Guards

#### `RequireRole`
Renders children only if user has the required role.

```tsx
<RequireRole role="super_admin">
  <button>Delete User</button>
</RequireRole>

// Multiple roles (OR condition)
<RequireRole role={['super_admin', 'team_lead']}>
  <button>Manage Team</button>
</RequireRole>
```

#### `SuperAdminOnly`
Shorthand for requiring super_admin role.

```tsx
<SuperAdminOnly>
  <button>System Settings</button>
</SuperAdminOnly>
```

#### `TeamLeadOnly`
Renders for team leads and super admins.

```tsx
<TeamLeadOnly>
  <button>Manage Team</button>
</TeamLeadOnly>
```

#### `BDMOnly`
Renders for BDMs and super admins.

```tsx
<BDMOnly>
  <button>Assign Vendors</button>
</BDMOnly>
```

#### `TeamMemberOnly`
Renders for all authenticated marketing users.

```tsx
<TeamMemberOnly>
  <button>View My Tasks</button>
</TeamMemberOnly>
```

### Permission-Based Guards

#### `RequirePermission`
Renders children only if user has the required permission.

```tsx
<RequirePermission permission="canManageUsers">
  <button>Edit User</button>
</RequirePermission>

// Multiple permissions (AND condition)
<RequirePermission permission={['canManageUsers', 'canInviteUsers']}>
  <button>Invite and Manage Users</button>
</RequirePermission>
```

#### Permission-Specific Guards

```tsx
<CanManageUsers>
  <button>Edit User</button>
</CanManageUsers>

<CanInviteUsers>
  <button>Send Invitation</button>
</CanInviteUsers>

<CanManageTeams>
  <button>Create Team</button>
</CanManageTeams>

<CanAssignVendors>
  <button>Assign to Team Member</button>
</CanAssignVendors>

<CanViewAllVendors>
  <VendorList />
</CanViewAllVendors>

<CanViewAllAnalytics>
  <AnalyticsDashboard />
</CanViewAllAnalytics>

<CanExportData>
  <button>Export CSV</button>
</CanExportData>

<CanViewAuditLogs>
  <AuditLogViewer />
</CanViewAuditLogs>
```

### Utility Components

#### `DisabledButton`
Disables a button when user lacks required role/permission.

```tsx
<DisabledButton
  requiredRole="super_admin"
  onClick={handleDelete}
  disabledMessage="Only super admins can delete users"
  className="px-4 py-2 bg-red-600 text-white rounded-lg"
>
  Delete User
</DisabledButton>

<DisabledButton
  requiredPermission="canManageUsers"
  onClick={handleEdit}
  disabledMessage="You need user management permission"
  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
>
  Edit User
</DisabledButton>
```

#### `RoleSwitch`
Shows different content based on user role.

```tsx
<RoleSwitch
  superAdmin={<SuperAdminDashboard />}
  teamLead={<TeamLeadDashboard />}
  bdm={<BDMDashboard />}
  teamMember={<TeamMemberDashboard />}
  fallback={<UnauthorizedMessage />}
/>
```

#### `PermissionDeniedMessage`
Shows a user-friendly error message when permission is denied.

```tsx
<PermissionDeniedMessage
  message="You need super admin privileges to access this feature"
  showContactInfo
/>
```

## Usage Patterns

### 1. Conditional Action Buttons

```tsx
function UserActions({ userId }) {
  return (
    <div className="flex gap-2">
      <RequirePermission permission="canManageUsers">
        <button onClick={() => editUser(userId)}>Edit</button>
      </RequirePermission>
      
      <SuperAdminOnly>
        <button onClick={() => deleteUser(userId)}>Delete</button>
      </SuperAdminOnly>
    </div>
  );
}
```

### 2. Conditional Sections with Fallback

```tsx
function Dashboard() {
  return (
    <div>
      <CanManageUsers
        fallback={
          <PermissionDeniedMessage
            message="You need user management permission"
            showContactInfo
          />
        }
      >
        <UserManagementSection />
      </CanManageUsers>
    </div>
  );
}
```

### 3. Navigation Menu Items

```tsx
function NavigationMenu() {
  return (
    <nav>
      <a href="/dashboard">Dashboard</a>
      
      <TeamLeadOnly>
        <a href="/team">Team Management</a>
      </TeamLeadOnly>
      
      <SuperAdminOnly>
        <a href="/admin">Administration</a>
      </SuperAdminOnly>
    </nav>
  );
}
```

### 4. Table Row Actions

```tsx
function UserTableRow({ user }) {
  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>
        <RequirePermission permission="canManageUsers">
          <button onClick={() => editUser(user.id)}>Edit</button>
        </RequirePermission>
        
        <RequireRole role="super_admin">
          <button onClick={() => deleteUser(user.id)}>Delete</button>
        </RequireRole>
      </td>
    </tr>
  );
}
```

### 5. Nested Guards

```tsx
// Only super admins with export permission
<SuperAdminOnly>
  <CanExportData>
    <button>Export All System Data</button>
  </CanExportData>
</SuperAdminOnly>

// Team leads who can assign vendors
<TeamLeadOnly>
  <CanAssignVendors>
    <button>Assign Vendors to Team</button>
  </CanAssignVendors>
</TeamLeadOnly>
```

## Best Practices

1. **Use Specific Guards**: Prefer permission-based guards over role-based guards when possible, as they're more flexible.

2. **Provide Fallbacks**: Always provide meaningful fallback content or error messages when access is denied.

3. **Combine Guards**: Use nested guards for complex permission requirements.

4. **Disable vs Hide**: Use `DisabledButton` when you want to show the button but disable it. Use guard components when you want to hide the element entirely.

5. **Error Messages**: Use `PermissionDeniedMessage` to provide clear feedback about why access is denied.

6. **Performance**: Guards are lightweight and use React context, so they don't cause performance issues.

## Examples

See `GuardExamples.tsx` for comprehensive examples of all guard usage patterns.

## Related

- Page-level guards: `components/marketing/MarketingAuthGuard.tsx`
- Hook-based guards: `hooks/useMarketingRoleGuard.ts`
- Auth context: `contexts/MarketingAuthContext.tsx`
