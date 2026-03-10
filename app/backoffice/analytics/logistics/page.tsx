/**
 * Logistics Analytics Page
 * 
 * Detailed logistics analytics dashboard showing delivery performance,
 * shipping costs, and logistics efficiency metrics.
 * 
 * Requirements: 4.5, 5.1, 5.2, 6.2, 6.3, 7.2, 7.3, 8.2, 8.3
 */

'use client';

import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import PermissionGuard from '@/components/backoffice/PermissionGuard';
import { useRouter } from 'next/navigation';

/**
 * Unauthorized Access Component
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
        <p className="text-gray-600 mb-4">You don't have permission to access Logistics Analytics.</p>
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
 * Logistics Analytics Content
 */
function LogisticsAnalyticsContent() {
  const { backOfficeUser, hasPermission } = useBackOfficeAuth();
  const router = useRouter();

  const canWrite = hasPermission('analytics', 'write');
  const canDelete = hasPermission('analytics', 'delete');

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={() => router.push('/backoffice/analytics')}
                className="text-blue-600 hover:text-blue-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Logistics Analytics</h1>
            </div>
            <p className="text-gray-600">
              Delivery performance, shipping costs, and logistics efficiency tracking
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {backOfficeUser?.role}
            </div>
            {canWrite && (
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                Export Logistics Data
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logistics Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
              <p className="text-sm text-green-600">+-- this month</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
              <p className="text-2xl font-bold text-gray-900">--%</p>
              <p className="text-sm text-green-600">+-- from last month</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Delivery Time</p>
              <p className="text-2xl font-bold text-gray-900">-- days</p>
              <p className="text-sm text-green-600">-- hours faster</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Shipping Cost</p>
              <p className="text-2xl font-bold text-gray-900">$--</p>
              <p className="text-sm text-red-600">+-- from last month</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Delivery Performance Over Time */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Delivery Performance</h3>
            <div className="flex items-center space-x-2">
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Delivery performance chart placeholder</p>
          </div>
        </div>

        {/* Delivery Status Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Delivered</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">--%</p>
                <p className="text-xs text-gray-500">-- orders</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">In Transit</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">--%</p>
                <p className="text-xs text-gray-500">-- orders</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Processing</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">--%</p>
                <p className="text-xs text-gray-500">-- orders</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Delayed</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">--%</p>
                <p className="text-xs text-gray-500">-- orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Regions Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Delivery Regions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Delivery Regions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Lagos</p>
                <p className="text-xs text-gray-500">-- deliveries</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">--%</p>
                <p className="text-xs text-gray-500">-- avg days</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Abuja</p>
                <p className="text-xs text-gray-500">-- deliveries</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">--%</p>
                <p className="text-xs text-gray-500">-- avg days</p>
              </div>
            </div>
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">Regional delivery data will be displayed here</p>
            </div>
          </div>
        </div>

        {/* Shipping Costs Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Costs</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Standard Delivery</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">$--</p>
                <p className="text-xs text-gray-500">avg cost</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Express Delivery</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">$--</p>
                <p className="text-xs text-gray-500">avg cost</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Same Day</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">$--</p>
                <p className="text-xs text-gray-500">avg cost</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deliveries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Deliveries</h3>
            {canWrite && (
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Manage Deliveries
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                {canWrite && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan={canWrite ? 6 : 5}>
                  <div className="text-center py-8">
                    <p className="text-gray-400">Logistics data will be displayed here</p>
                    <p className="text-xs text-gray-400 mt-1">Connect to logistics service to view real data</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-specific Logistics Information */}
      {backOfficeUser?.role === 'logistics_lead' && (
        <div className="mt-8 bg-orange-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-2">Logistics Lead Dashboard</h3>
          <p className="text-orange-800 text-sm mb-4">
            As a Logistics Lead, you have write access to logistics analytics and can manage delivery performance data.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-orange-800 text-sm">Manage logistics performance metrics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-orange-800 text-sm">Update delivery and shipping data</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Logistics Analytics Page
 * Protected by permission guard
 */
export default function LogisticsAnalyticsPage() {
  return (
    <PermissionGuard
      department="analytics"
      permission="read"
      fallback={<UnauthorizedAccess />}
    >
      <LogisticsAnalyticsContent />
    </PermissionGuard>
  );
}
