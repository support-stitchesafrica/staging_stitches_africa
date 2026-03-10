/**
 * Analytics Overview Page
 * 
 * Main analytics dashboard showing overview of all analytics data.
 * Accessible to users with analytics department permissions.
 * 
 * Requirements: 4.5, 5.1, 5.2
 */

'use client';

import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import PermissionGuard from '@/components/backoffice/PermissionGuard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Unauthorized Access Component
 * Shown when user doesn't have analytics access
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
        <p className="text-gray-600 mb-4">You don't have permission to access the Analytics department.</p>
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
 * Analytics Overview Content
 * Main dashboard content for analytics overview
 */
function AnalyticsOverviewContent() {
  const { backOfficeUser, hasPermission } = useBackOfficeAuth();

  // Check if user has write permissions for conditional UI
  const canWrite = hasPermission('analytics', 'write');
  const canDelete = hasPermission('analytics', 'delete');

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Overview</h1>
            <p className="text-gray-600">
              Comprehensive view of your business analytics and performance metrics
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
              <p className="text-sm font-medium text-gray-600">Total Traffic</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Logistics</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Analytics Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Traffic Analytics</h3>
            <a
              href="/backoffice/analytics/traffic"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Details →
            </a>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Website traffic, page views, and user engagement metrics
          </p>
          <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 text-sm">Traffic chart placeholder</p>
          </div>
        </div>

        {/* Sales Analytics Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Analytics</h3>
            <a
              href="/backoffice/analytics/sales"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Details →
            </a>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Revenue, orders, and sales performance tracking
          </p>
          <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 text-sm">Sales chart placeholder</p>
          </div>
        </div>

        {/* Products Analytics Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Products Analytics</h3>
            <a
              href="/backoffice/analytics/products"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Details →
            </a>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Product performance, inventory, and catalog insights
          </p>
          <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 text-sm">Products chart placeholder</p>
          </div>
        </div>

        {/* Logistics Analytics Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Logistics Analytics</h3>
            <a
              href="/backoffice/analytics/logistics"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Details →
            </a>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Delivery performance, shipping costs, and logistics efficiency
          </p>
          <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 text-sm">Logistics chart placeholder</p>
          </div>
        </div>
      </div>

      {/* Role-specific Information */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Analytics Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-blue-800 text-sm">Read Access: All analytics data</span>
          </div>
          {canWrite && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-blue-800 text-sm">Write Access: Can modify data</span>
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
 * Analytics Overview Page
 * Protected by permission guard to ensure only authorized users can access
 */
export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <PermissionGuard
      department="analytics"
      permission="read"
      fallback={<UnauthorizedAccess />}
    >
      <AnalyticsOverviewContent />
    </PermissionGuard>
  );
}
