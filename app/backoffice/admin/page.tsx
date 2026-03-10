/**
 * Admin Dashboard Page
 * 
 * Main admin dashboard showing overview of admin functions.
 * Accessible to users with admin department permissions.
 * 
 * Requirements: 11.1, 11.2, 11.5
 */

'use client';

import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import PermissionGuard from '@/components/backoffice/PermissionGuard';
import { useRouter } from 'next/navigation';

/**
 * Unauthorized Access Component
 * Shown when user doesn't have admin access
 */
function UnauthorizedAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You don't have permission to access the Admin department.</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

/**
 * Admin Dashboard Content
 * Main dashboard content for admin overview
 */
function AdminDashboardContent() {
  const { backOfficeUser, hasPermission } = useBackOfficeAuth();
  const router = useRouter();

  // Check if user has write permissions for conditional UI
  const canWrite = hasPermission('admin', 'write');
  const canDelete = hasPermission('admin', 'delete');

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">
              Manage users, tailors, and system configuration
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {backOfficeUser?.role}
            </div>
            {canWrite && (
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Write Access
              </div>
            )}
            {canDelete && (
              <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                Delete Access
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tailors</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-green-600">Good</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <button
              onClick={() => router.push('/backoffice/admin/users')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Manage Users →
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            View and manage all system users, their roles, and permissions
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Users</span>
              <span className="font-medium">--</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending Invitations</span>
              <span className="font-medium">--</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Inactive Users</span>
              <span className="font-medium">--</span>
            </div>
          </div>
        </div>

        {/* Tailor Management Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tailor Management</h3>
            <button
              onClick={() => router.push('/backoffice/admin/tailors')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Manage Tailors →
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Oversee tailor profiles, approvals, and performance metrics
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Tailors</span>
              <span className="font-medium">--</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending Approvals</span>
              <span className="font-medium">--</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed Orders</span>
              <span className="font-medium">--</span>
            </div>
          </div>
        </div>

        {/* System Settings Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
            <button
              onClick={() => router.push('/backoffice/admin/settings')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Configure →
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Configure system-wide settings, features, and preferences
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Feature Flags</span>
              <span className="font-medium">--</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">API Status</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Backup</span>
              <span className="font-medium">--</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Common administrative tasks and shortcuts
          </p>
          <div className="space-y-3">
            {canWrite && (
              <>
                <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  Create New User
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  Approve Tailor
                </button>
              </>
            )}
            <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              Export User Data
            </button>
            <button className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
              System Health Check
            </button>
          </div>
        </div>
      </div>

      {/* Role-specific Information */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Admin Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-blue-800 text-sm">Read Access: All admin data</span>
          </div>
          {canWrite && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-blue-800 text-sm">Write Access: Can modify settings</span>
            </div>
          )}
          {canDelete && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-blue-800 text-sm">Delete Access: Can remove data</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Dashboard Page
 * Protected by permission guard to ensure only authorized users can access
 */
export default function AdminDashboardPage() {
  return (
    <PermissionGuard
      department="admin"
      permission="read"
      fallback={<UnauthorizedAccess />}
    >
      <AdminDashboardContent />
    </PermissionGuard>
  );
}
