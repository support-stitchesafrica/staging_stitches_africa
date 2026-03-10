/**
 * Admin Dashboard Component
 * 
 * Main admin dashboard showing overview of admin functions including
 * user management, tailor management, and system settings.
 * 
 * Requirements: 11.5, 14.5, 16.2, 16.3
 */

'use client';

import React, { memo, useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  Shield, 
  Activity,
  UserCheck,
  UserX,
  Scissors,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import StatsCard from '../StatsCard';
import DashboardCard from '../DashboardCard';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { getAllUsers } from '@/admin-services/userService';
import { useTailors } from '@/admin-services/useTailors';

interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  tailors: {
    total: number;
    active: number;
    pending: number;
  };
  system: {
    health: 'good' | 'warning' | 'error';
    uptime: string;
  };
}

export default function AdminDashboard() {
  const { backOfficeUser, hasPermission } = useBackOfficeAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get tailors data
  const { tailors, loading: tailorsLoading, error: tailorsError } = useTailors();

  // Check permissions
  const canWrite = hasPermission('admin', 'write');
  const canDelete = hasPermission('admin', 'delete');

  useEffect(() => {
    async function fetchAdminStats() {
      try {
        setLoading(true);
        setError(null);

        // Fetch users data
        const users = await getAllUsers();
        
        // Calculate user stats
        const activeUsers = users.filter(user => !user.is_general_admin && !user.is_sub_tailor && !user.is_tailor);
        
        setStats({
          users: {
            total: users.length,
            active: activeUsers.length,
            inactive: users.length - activeUsers.length,
          },
          tailors: {
            total: tailors.length,
            active: tailors.filter(t => t.identity_verification?.status === 'verified').length,
            pending: tailors.filter(t => t.identity_verification?.status === 'pending').length,
          },
          system: {
            health: 'good',
            uptime: '99.9%',
          },
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    }

    if (!tailorsLoading && !tailorsError) {
      fetchAdminStats();
    }
  }, [tailors, tailorsLoading, tailorsError]);

  if (loading || tailorsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || tailorsError) {
    return (
      <DashboardCard
        title="Error"
        description="Failed to load admin data"
        icon={AlertCircle}
      >
        <p className="text-red-600">{error || tailorsError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </DashboardCard>
    );
  }

  if (!stats) {
    return null;
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
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

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          value={formatNumber(stats.users.total)}
          label="Total Users"
          icon={Users}
          variant="primary"
        />
        
        <StatsCard
          value={formatNumber(stats.users.active)}
          label="Active Users"
          icon={UserCheck}
          variant="success"
        />
        
        <StatsCard
          value={formatNumber(stats.tailors.total)}
          label="Total Tailors"
          icon={Scissors}
          variant="purple"
        />
        
        <StatsCard
          value={formatNumber(stats.tailors.active)}
          label="Verified Tailors"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management Card */}
        <DashboardCard
          title="User Management"
          description="Manage all system users and their permissions"
          icon={Users}
          hoverable
          onClick={() => router.push('/backoffice/admin/users')}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="text-lg font-semibold text-gray-900">{stats.users.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-sm font-medium text-green-600">{stats.users.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Inactive Users</span>
              <span className="text-sm font-medium text-gray-500">{stats.users.inactive}</span>
            </div>
            {canWrite && (
              <button className="w-full mt-3 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                Manage Users →
              </button>
            )}
          </div>
        </DashboardCard>

        {/* Tailor Management Card */}
        <DashboardCard
          title="Tailor Management"
          description="Oversee tailor profiles and approvals"
          icon={Scissors}
          hoverable
          onClick={() => router.push('/backoffice/admin/tailors')}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Tailors</span>
              <span className="text-lg font-semibold text-gray-900">{stats.tailors.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Verified</span>
              <span className="text-sm font-medium text-green-600">{stats.tailors.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Approval</span>
              <span className="text-sm font-medium text-orange-600">{stats.tailors.pending}</span>
            </div>
            {canWrite && (
              <button className="w-full mt-3 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                Manage Tailors →
              </button>
            )}
          </div>
        </DashboardCard>

        {/* System Settings Card */}
        <DashboardCard
          title="System Settings"
          description="Configure system-wide settings and preferences"
          icon={Settings}
          hoverable
          onClick={() => router.push('/backoffice/admin/settings')}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">System Health</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Good</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-gray-900">{stats.system.uptime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Status</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </div>
            {canWrite && (
              <button className="w-full mt-3 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                Configure Settings →
              </button>
            )}
          </div>
        </DashboardCard>

        {/* Quick Actions Card */}
        <DashboardCard
          title="Quick Actions"
          description="Common administrative tasks"
          icon={Activity}
        >
          <div className="space-y-3">
            {canWrite && (
              <>
                <button 
                  onClick={() => router.push('/backoffice/admin/users?action=create')}
                  className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Create New User</span>
                  </div>
                </button>
                <button 
                  onClick={() => router.push('/backoffice/admin/tailors?filter=pending')}
                  className="w-full text-left px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Review Pending Tailors</span>
                  </div>
                </button>
              </>
            )}
            <button 
              onClick={() => router.push('/backoffice/admin/users?export=true')}
              className="w-full text-left px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Export User Data</span>
              </div>
            </button>
            <button 
              onClick={() => router.push('/backoffice/admin/settings?tab=health')}
              className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>System Health Check</span>
              </div>
            </button>
          </div>
        </DashboardCard>
      </div>

      {/* Role-specific Information */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Your Admin Access</h3>
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

export default memo(AdminDashboard);
