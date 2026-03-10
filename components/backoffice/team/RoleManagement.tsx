/**
 * Role Management Component
 * 
 * Displays role information and permissions matrix.
 * Helps superadmins understand role capabilities and permissions.
 * 
 * Requirements: 17.2, 17.3
 */

'use client';

import React, { useState } from 'react';
import { BackOfficeRole, Department, ROLE_PERMISSIONS } from '@/types/backoffice';
import { 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  Info, 
  Users,
  BarChart3,
  Calendar,
  Layers,
  Megaphone,
  Settings,
  CheckCircle,
  XCircle,
  Minus
} from 'lucide-react';

interface RoleManagementProps {
  className?: string;
}

export default function RoleManagement({ className = '' }: RoleManagementProps) {
  const [selectedRole, setSelectedRole] = useState<BackOfficeRole>('superadmin');

  // Department icons mapping
  const departmentIcons: Record<Department, React.ComponentType<{ className?: string }>> = {
    analytics: BarChart3,
    promotions: Calendar,
    collections: Layers,
    marketing: Megaphone,
    admin: Settings,
  };

  // Role descriptions
  const roleDescriptions: Record<BackOfficeRole, string> = {
    superadmin: 'Full system access with all permissions across all departments. Can manage users, roles, and system settings.',
    founder: 'Executive overview access with read-only permissions to monitor business performance across all departments.',
    bdm: 'Business Development Manager with sales analytics access and vendor management capabilities in marketing.',
    brand_lead: 'Brand management with product analytics access and promotional content oversight.',
    logistics_lead: 'Logistics management with delivery analytics access and operational oversight.',
    marketing_manager: 'Marketing team leadership with full marketing department access and analytics overview.',
    marketing_member: 'Marketing team member with access to assigned tasks and limited marketing functions.',
    admin: 'Administrative access to promotional events, collections management, and admin dashboard.',
    editor: 'Content editing capabilities for promotional events and collections without delete permissions.',
    viewer: 'Read-only access to collections and analytics for content review and monitoring.',
  };

  // Format role name for display
  const formatRoleName = (role: BackOfficeRole): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format department name for display
  const formatDepartmentName = (department: Department): string => {
    return department.charAt(0).toUpperCase() + department.slice(1);
  };

  // Get permission icon
  const getPermissionIcon = (hasPermission: boolean, level: 'read' | 'write' | 'delete') => {
    if (!hasPermission) {
      return <XCircle className="w-4 h-4 text-gray-400" />;
    }

    switch (level) {
      case 'read':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'write':
        return <Edit className="w-4 h-4 text-green-600" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: BackOfficeRole): string => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'founder':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'bdm':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'marketing_manager':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'admin':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get all roles
  const allRoles = Object.keys(ROLE_PERMISSIONS) as BackOfficeRole[];
  const allDepartments: Department[] = ['analytics', 'promotions', 'collections', 'marketing', 'admin'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Role Selector */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Select Role to View Permissions
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {allRoles.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedRole === role
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mb-2 ${getRoleBadgeColor(role)}`}>
                {formatRoleName(role)}
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">
                {roleDescriptions[role]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Role Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {formatRoleName(selectedRole)}
            </h3>
            <p className="text-gray-600 mb-4">
              {roleDescriptions[selectedRole]}
            </p>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(selectedRole)}`}>
              Role: {formatRoleName(selectedRole)}
            </div>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Department Permissions
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                    Department
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b border-gray-200">
                    Read
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b border-gray-200">
                    Write
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b border-gray-200">
                    Delete
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                    Access Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allDepartments.map((department) => {
                  const permissions = ROLE_PERMISSIONS[selectedRole][department];
                  const DepartmentIcon = departmentIcons[department];
                  
                  // Determine access level
                  let accessLevel = 'No Access';
                  let accessColor = 'text-gray-500';
                  
                  if (permissions.delete) {
                    accessLevel = 'Full Access';
                    accessColor = 'text-red-600';
                  } else if (permissions.write) {
                    accessLevel = 'Read & Write';
                    accessColor = 'text-green-600';
                  } else if (permissions.read) {
                    accessLevel = 'Read Only';
                    accessColor = 'text-blue-600';
                  }

                  return (
                    <tr key={department} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <DepartmentIcon className="w-5 h-5 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            {formatDepartmentName(department)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center border-b border-gray-200">
                        {getPermissionIcon(permissions.read, 'read')}
                      </td>
                      <td className="px-4 py-3 text-center border-b border-gray-200">
                        {getPermissionIcon(permissions.write, 'write')}
                      </td>
                      <td className="px-4 py-3 text-center border-b border-gray-200">
                        {getPermissionIcon(permissions.delete, 'delete')}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200">
                        <span className={`font-medium ${accessColor}`}>
                          {accessLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permission Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Permission Legend</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700">
                <strong>Read:</strong> View data and content
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Edit className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">
                <strong>Write:</strong> Create and modify content
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span className="text-gray-700">
                <strong>Delete:</strong> Remove content permanently
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Comparison */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Role Hierarchy & Access Levels
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Top Level Roles */}
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <h4 className="font-medium text-red-800 mb-2">Top Level Access</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span>Superadmin - Full system control</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span>Founder - Executive overview</span>
                </div>
              </div>
            </div>

            {/* Department Leads */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h4 className="font-medium text-blue-800 mb-2">Department Leads</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>BDM - Sales & Vendors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Brand Lead - Products</span>
                </div>
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-green-600" />
                  <span>Marketing Manager - Team Lead</span>
                </div>
              </div>
            </div>

            {/* Content Roles */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-2">Content & Operations</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-orange-600" />
                  <span>Admin - System management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-600" />
                  <span>Editor - Content creation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span>Viewer - Read-only access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
