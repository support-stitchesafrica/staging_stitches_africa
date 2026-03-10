/**
 * Back Office Dashboard Home Page
 * 
 * Main dashboard showing welcome message, user role, and quick access cards
 * to accessible departments.
 * 
 * Requirements: 14.1, 14.5
 */

'use client';

import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { PermissionService } from '@/lib/backoffice/permission-service';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Layers,
  Megaphone,
  Settings,
  ArrowRight,
  Users,
  Clock,
} from 'lucide-react';
import DashboardCard from '@/components/backoffice/DashboardCard';
import StatsCard from '@/components/backoffice/StatsCard';
import PermissionGuard from '@/components/backoffice/PermissionGuard';

/**
 * Department card data
 */
const DEPARTMENT_CARDS = [
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'View traffic, sales, products, and logistics data',
    icon: BarChart3,
    href: '/backoffice/analytics',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'promotions',
    title: 'Promotions',
    description: 'Manage promotional events and campaigns',
    icon: Calendar,
    href: '/backoffice/promotions',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'collections',
    title: 'Collections',
    description: 'Manage product collections and featured items',
    icon: Layers,
    href: '/backoffice/collections',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Manage vendors, tasks, and team interactions',
    icon: Megaphone,
    href: '/backoffice/marketing',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'admin',
    title: 'Admin',
    description: 'Manage users, tailors, and system settings',
    icon: Settings,
    href: '/backoffice/admin',
    gradient: 'from-slate-500 to-gray-600',
  },
];

export default function BackOfficeDashboard() {
  const { backOfficeUser } = useBackOfficeAuth();

  if (!backOfficeUser) {
    return null;
  }

  // Filter department cards based on user permissions
  const accessibleDepartments = DEPARTMENT_CARDS.filter((dept) =>
    PermissionService.canAccessDepartment(backOfficeUser, dept.id as any)
  );

  // Format role name for display
  const formatRoleName = (role: string): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {backOfficeUser.fullName}!
          </h1>
          <p className="text-gray-600">
            You're logged in as{' '}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              {formatRoleName(backOfficeUser.role)}
            </span>
          </p>
        </div>

        {/* Quick Stats - Using new StatsCard component */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            value={accessibleDepartments.length}
            label="Accessible Departments"
            icon={Layers}
            variant="primary"
          />

          <StatsCard
            value="Active"
            label="Account Status"
            icon={Users}
            variant="success"
          />

          <StatsCard
            value={backOfficeUser.lastLogin
              ? new Date(backOfficeUser.lastLogin.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'First login'}
            label="Last Login"
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Department Cards - Using new DashboardCard component */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Departments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessibleDepartments.map((dept) => {
              const Icon = dept.icon;
              return (
                <Link key={dept.id} href={dept.href}>
                  <DashboardCard
                    title={dept.title}
                    description={dept.description}
                    icon={Icon}
                    hoverable
                    footer={
                      <div className="flex items-center text-sm font-medium text-blue-600">
                        <span>Open {dept.title}</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    }
                  >
                    <div className="text-sm text-gray-500">
                      Click to access {dept.title.toLowerCase()} dashboard
                    </div>
                  </DashboardCard>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Empty State - Using DashboardCard */}
        {accessibleDepartments.length === 0 && (
          <DashboardCard>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Departments Available
              </h3>
              <p className="text-gray-600">
                You don't have access to any departments yet. Please contact your administrator.
              </p>
            </div>
          </DashboardCard>
        )}

        {/* Example of PermissionGuard usage */}
        <PermissionGuard department="admin" permission="write">
          <div className="mt-8">
            <DashboardCard
              title="Admin Actions"
              description="Only visible to users with admin write permissions"
              icon={Settings}
            >
              <p className="text-sm text-gray-600">
                This section is only visible to administrators with write permissions.
              </p>
            </DashboardCard>
          </div>
        </PermissionGuard>
      </div>
    </div>
  );
}
