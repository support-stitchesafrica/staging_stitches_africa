/**
 * Team Roles Management Page
 * 
 * Displays role information and permissions matrix.
 * Allows superadmins to understand role capabilities.
 * 
 * Requirements: 17.2, 17.3
 */

'use client';

import React from 'react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import PermissionGuard from '@/components/backoffice/PermissionGuard';
import RoleManagement from '@/components/backoffice/team/RoleManagement';
import { Shield, Users, Clock } from 'lucide-react';
import Link from 'next/link';

export default function TeamRolesPage() {
  return (
    <PermissionGuard
      customCheck={(user) => user.role === 'superadmin'}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Role management is only available to superadmins.
            </p>
            <Link
              href="/backoffice"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    Role Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    View and understand role permissions across departments
                  </p>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-3">
                  <Link
                    href="/backoffice/team"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Team Members
                  </Link>
                  
                  <Link
                    href="/backoffice/team/invitations"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    Invitations
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8" aria-label="Tabs">
              <Link
                href="/backoffice/team"
                className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Team Members
              </Link>
              <Link
                href="/backoffice/team/roles"
                className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
              >
                Role Management
              </Link>
              <Link
                href="/backoffice/team/invitations"
                className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Invitations
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RoleManagement />
        </div>
      </div>
    </PermissionGuard>
  );
}
