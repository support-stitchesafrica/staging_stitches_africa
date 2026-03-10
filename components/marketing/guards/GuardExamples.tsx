/**
 * Component-Level Guard Usage Examples
 * Demonstrates how to use role-based rendering components
 * Requirements: 8.1, 8.5
 */

'use client';

import React from 'react';
import {
  RequireRole,
  RequirePermission,
  SuperAdminOnly,
  TeamLeadOnly,
  BDMOnly,
  CanManageUsers,
  CanInviteUsers,
  CanAssignVendors,
  CanExportData,
  DisabledButton,
  RoleSwitch,
  PermissionDeniedMessage
} from './RoleBasedRender';
import { UserPlus, Trash2, Download, Users, Building2 } from 'lucide-react';

/**
 * Example: Action Buttons with Role Guards
 * Shows how to conditionally render action buttons based on roles
 */
export function ActionButtonsExample() {
  return (
    <div className="flex gap-2">
      {/* Only super admins can see this button */}
      <SuperAdminOnly>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Delete System Data
        </button>
      </SuperAdminOnly>

      {/* Team leads and super admins can see this */}
      <TeamLeadOnly>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Manage Team
        </button>
      </TeamLeadOnly>

      {/* BDMs and super admins can see this */}
      <BDMOnly>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Assign Vendors
        </button>
      </BDMOnly>
    </div>
  );
}

/**
 * Example: Permission-Based Buttons
 * Shows how to conditionally render buttons based on permissions
 */
export function PermissionButtonsExample() {
  return (
    <div className="flex gap-2">
      {/* Only users with canInviteUsers permission */}
      <CanInviteUsers>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </CanInviteUsers>

      {/* Only users with canExportData permission */}
      <CanExportData>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </CanExportData>
    </div>
  );
}

/**
 * Example: Disabled Button with Permission Check
 * Shows how to disable a button when user lacks permission
 */
export function DisabledButtonExample() {
  const handleDelete = () => {
    console.log('Deleting user...');
  };

  return (
    <div className="space-y-2">
      {/* Button is disabled if user doesn't have the required role */}
      <DisabledButton
        requiredRole="super_admin"
        onClick={handleDelete}
        disabledMessage="Only super admins can delete users"
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Delete User
      </DisabledButton>

      {/* Button is disabled if user doesn't have the required permission */}
      <DisabledButton
        requiredPermission="canManageUsers"
        onClick={() => console.log('Editing user...')}
        disabledMessage="You need user management permission"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Edit User
      </DisabledButton>
    </div>
  );
}

/**
 * Example: Role-Based Content Switching
 * Shows different content based on user role
 */
export function RoleSwitchExample() {
  return (
    <RoleSwitch
      superAdmin={
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-900">Super Admin View</h3>
          <p className="text-sm text-red-700">You have full system access</p>
        </div>
      }
      teamLead={
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900">Team Lead View</h3>
          <p className="text-sm text-blue-700">You can manage your team</p>
        </div>
      }
      bdm={
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900">BDM View</h3>
          <p className="text-sm text-green-700">You can manage vendors</p>
        </div>
      }
      teamMember={
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900">Team Member View</h3>
          <p className="text-sm text-gray-700">You can view your assigned vendors</p>
        </div>
      }
      fallback={
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900">No Role Assigned</h3>
          <p className="text-sm text-yellow-700">Contact your administrator</p>
        </div>
      }
    />
  );
}

/**
 * Example: Conditional UI Sections
 * Shows how to conditionally render entire sections
 */
export function ConditionalSectionsExample() {
  return (
    <div className="space-y-6">
      {/* User Management Section - Only for users with permission */}
      <CanManageUsers
        fallback={
          <PermissionDeniedMessage
            message="You need user management permission to access this section"
            showContactInfo
          />
        }
      >
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-gray-600">Manage system users and their roles</p>
          {/* User management UI here */}
        </div>
      </CanManageUsers>

      {/* Vendor Assignment Section - Only for BDMs */}
      <BDMOnly
        fallback={
          <PermissionDeniedMessage
            message="Only BDMs can assign vendors"
            showContactInfo
          />
        }
      >
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Vendor Assignment</h2>
          <p className="text-gray-600">Assign vendors to team members</p>
          {/* Vendor assignment UI here */}
        </div>
      </BDMOnly>

      {/* System Settings - Only for super admins */}
      <SuperAdminOnly>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          <p className="text-gray-600">Configure system-wide settings</p>
          {/* System settings UI here */}
        </div>
      </SuperAdminOnly>
    </div>
  );
}

/**
 * Example: Table Actions with Guards
 * Shows how to conditionally render table action buttons
 */
export function TableActionsExample({ userId }: { userId: string }) {
  return (
    <div className="flex items-center gap-2">
      {/* Edit button - requires canManageUsers permission */}
      <RequirePermission permission="canManageUsers">
        <button
          onClick={() => console.log('Edit user', userId)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          title="Edit user"
        >
          <Users className="w-4 h-4" />
        </button>
      </RequirePermission>

      {/* Delete button - requires super_admin role */}
      <RequireRole role="super_admin">
        <button
          onClick={() => console.log('Delete user', userId)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          title="Delete user"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </RequireRole>
    </div>
  );
}

/**
 * Example: Nested Guards
 * Shows how to combine multiple guard conditions
 */
export function NestedGuardsExample() {
  return (
    <div className="space-y-4">
      {/* Only super admins with export permission */}
      <SuperAdminOnly>
        <CanExportData>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Export All System Data
          </button>
        </CanExportData>
      </SuperAdminOnly>

      {/* Team leads who can assign vendors */}
      <TeamLeadOnly>
        <CanAssignVendors>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Assign Vendors to Team
          </button>
        </CanAssignVendors>
      </TeamLeadOnly>
    </div>
  );
}

/**
 * Example: Menu Items with Guards
 * Shows how to conditionally render navigation menu items
 */
export function NavigationMenuExample() {
  return (
    <nav className="space-y-1">
      {/* Everyone can see dashboard */}
      <a href="/marketing/dashboard" className="block px-4 py-2 hover:bg-gray-100 rounded-lg">
        Dashboard
      </a>

      {/* Only users who can view all vendors */}
      <RequirePermission permission="canViewAllVendors">
        <a href="/marketing/vendors" className="block px-4 py-2 hover:bg-gray-100 rounded-lg">
          All Vendors
        </a>
      </RequirePermission>

      {/* Only team leads and above */}
      <TeamLeadOnly>
        <a href="/marketing/team" className="block px-4 py-2 hover:bg-gray-100 rounded-lg">
          Team Management
        </a>
      </TeamLeadOnly>

      {/* Only super admins */}
      <SuperAdminOnly>
        <a href="/marketing/admin/teams" className="block px-4 py-2 hover:bg-gray-100 rounded-lg">
          Teams Administration
        </a>
      </SuperAdminOnly>
    </nav>
  );
}
