/**
 * Marketing Dashboard Page
 * 
 * Main marketing dashboard showing overview of marketing activities.
 * Accessible to users with marketing department permissions.
 * 
 * Requirements: 6.4, 6.5, 9.1, 9.2, 9.3, 9.5, 10.1, 10.2, 10.3
 */

'use client';

import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import PermissionGuard from '@/components/backoffice/PermissionGuard';
import { useRouter } from 'next/navigation';

/**
 * Unauthorized Access Component
 * Shown when user doesn't have marketing access
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
        <p className="text-gray-600 mb-4">You don't have permission to access the Marketing department.</p>
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
 * Marketing Dashboard Content
 * Main dashboard content for marketing overview
 */
function MarketingDashboardContent() {
  const { backOfficeUser, hasPermission } = useBackOfficeAuth();
  const router = useRouter();

  // Check if user has write permissions for conditional UI
  const canWrite = hasPermission('marketing', 'write');
  const canDelete = hasPermission('marketing', 'delete');

  // Check if user is marketing_member (limited access)
  const isMarketingMember = backOfficeUser?.role === 'marketing_member';

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Dashboard</h1>
            <p className="text-gray-600">
              {isMarketingMember 
                ? "Manage your assigned tasks and interactions"
                : "Comprehensive marketing management and team oversight"
              }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Vendors</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isMarketingMember ? "My Tasks" : "Total Tasks"}
              </p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isMarketingMember ? "My Interactions" : "Total Interactions"}
              </p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>

        {!isMarketingMember && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Marketing Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendors Management Card */}
        {!isMarketingMember && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Vendor Management</h3>
              <button
                onClick={() => router.push('/backoffice/marketing/vendors')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Manage vendor relationships and business development activities
            </p>
            <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-sm">Vendor metrics placeholder</p>
            </div>
          </div>
        )}

        {/* Tasks Management Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isMarketingMember ? "My Tasks" : "Team Tasks"}
            </h3>
            <button
              onClick={() => router.push('/backoffice/marketing/tasks')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            {isMarketingMember 
              ? "Track and manage your assigned marketing tasks"
              : "Assign and monitor marketing team tasks"
            }
          </p>
          <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 text-sm">Tasks overview placeholder</p>
          </div>
        </div>

        {/* Interactions Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isMarketingMember ? "My Interactions" : "Team Interactions"}
            </h3>
            <button
              onClick={() => router.push('/backoffice/marketing/interactions')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            {isMarketingMember 
              ? "View your customer and vendor interactions"
              : "Monitor team interactions and communications"
            }
          </p>
          <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 text-sm">Interactions timeline placeholder</p>
          </div>
        </div>

        {/* Analytics Card (for managers) */}
        {!isMarketingMember && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Marketing Analytics</h3>
              <button
                onClick={() => router.push('/backoffice/analytics')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Analytics →
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Performance metrics and campaign analytics
            </p>
            <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-sm">Analytics chart placeholder</p>
            </div>
          </div>
        )}
      </div>

      {/* Role-specific Information */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Marketing Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-blue-800 text-sm">
              {isMarketingMember ? "Read Access: Your tasks and interactions" : "Read Access: All marketing data"}
            </span>
          </div>
          {canWrite && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-blue-800 text-sm">
                {isMarketingMember ? "Write Access: Update your tasks" : "Write Access: Manage team and vendors"}
              </span>
            </div>
          )}
          {canDelete && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-blue-800 text-sm">Delete Access: Remove marketing data</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Marketing Dashboard Page
 * Protected by permission guard to ensure only authorized users can access
 */
export default function MarketingDashboardPage() {
  return (
    <PermissionGuard
      department="marketing"
      permission="read"
      fallback={<UnauthorizedAccess />}
    >
      <MarketingDashboardContent />
    </PermissionGuard>
  );
}
