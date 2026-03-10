/**
 * Back Office Header Component
 * 
 * Displays the header bar with user information, notifications, and quick actions.
 * Implements Bumpa-style design with gradients and modern typography.
 * 
 * Requirements: 14.5
 */

'use client';

import React, { memo } from 'react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { Bell, LogOut, Settings, User } from 'lucide-react';

function BackOfficeHeader() {
  const { backOfficeUser, signOut } = useBackOfficeAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!backOfficeUser) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left section - Title */}
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Back Office
          </h1>
        </div>

        {/* Right section - User info and actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Notification badge - can be conditionally shown */}
            {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
          </button>

          {/* Settings */}
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            {/* User avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {backOfficeUser.fullName.charAt(0).toUpperCase()}
            </div>

            {/* User info */}
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900">
                {backOfficeUser.fullName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {backOfficeUser.role.replace('_', ' ')}
              </p>
            </div>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default memo(BackOfficeHeader);
