/**
 * Auth Debugger Component
 * Displays real-time authentication state for debugging
 * Only use in development
 */

'use client';

import React, { useState } from 'react';
import { useReferralAuth } from '@/contexts/ReferralAuthContext';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

export function AuthDebugger() {
  const { user, referralUser, loading, error, isAuthenticated, isAdmin } = useReferralAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-black text-white px-3 py-2 rounded-lg text-xs font-mono hover:bg-gray-800 transition-colors"
      >
        Show Auth Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white rounded-lg shadow-2xl max-w-md z-50 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
          <h3 className="font-bold">Auth Debug</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
        {/* Basic Status */}
        <div className="space-y-1">
          <StatusRow label="Loading" value={loading ? 'Yes' : 'No'} status={loading ? 'warning' : 'success'} />
          <StatusRow label="Authenticated" value={isAuthenticated ? 'Yes' : 'No'} status={isAuthenticated ? 'success' : 'error'} />
          <StatusRow label="Is Admin" value={isAdmin ? 'Yes' : 'No'} status={isAdmin ? 'info' : 'default'} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded p-2 mt-2">
            <p className="text-red-300 font-semibold mb-1">Error:</p>
            <p className="text-red-200 text-xs break-words">{error}</p>
          </div>
        )}

        {/* Firebase User */}
        {isExpanded && (
          <>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <p className="text-gray-400 font-semibold mb-1">Firebase User:</p>
              {user ? (
                <div className="bg-gray-900 rounded p-2 space-y-1">
                  <InfoRow label="UID" value={user.uid} />
                  <InfoRow label="Email" value={user.email || 'N/A'} />
                  <InfoRow label="Display Name" value={user.displayName || 'N/A'} />
                  <InfoRow label="Email Verified" value={user.emailVerified ? 'Yes' : 'No'} />
                </div>
              ) : (
                <p className="text-gray-500">None</p>
              )}
            </div>

            {/* Referral User */}
            <div className="border-t border-gray-700 pt-2 mt-2">
              <p className="text-gray-400 font-semibold mb-1">Referral User:</p>
              {referralUser ? (
                <div className="bg-gray-900 rounded p-2 space-y-1">
                  <InfoRow label="User ID" value={referralUser.userId} />
                  <InfoRow label="Email" value={referralUser.email} />
                  <InfoRow label="Full Name" value={referralUser.fullName} />
                  <InfoRow label="Referral Code" value={referralUser.referralCode} />
                  <InfoRow label="Total Referrals" value={referralUser.totalReferrals.toString()} />
                  <InfoRow label="Total Points" value={referralUser.totalPoints.toString()} />
                  <InfoRow label="Is Active" value={referralUser.isActive ? 'Yes' : 'No'} />
                  <InfoRow label="Is Admin" value={referralUser.isAdmin ? 'Yes' : 'No'} />
                </div>
              ) : (
                <p className="text-gray-500">None</p>
              )}
            </div>

            {/* Cookies */}
            <div className="border-t border-gray-700 pt-2 mt-2">
              <p className="text-gray-400 font-semibold mb-1">Cookies:</p>
              <div className="bg-gray-900 rounded p-2">
                <InfoRow 
                  label="referral_token" 
                  value={document.cookie.includes('referral_token=') ? 'Present' : 'Missing'} 
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-700 text-center text-gray-500">
        <p>Development Only</p>
      </div>
    </div>
  );
}

function StatusRow({ label, value, status }: { label: string; value: string; status: 'success' | 'error' | 'warning' | 'info' | 'default' }) {
  const colors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
    default: 'text-gray-400',
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}:</span>
      <span className={`font-semibold ${colors[status]}`}>{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-gray-500 flex-shrink-0">{label}:</span>
      <span className="text-gray-300 text-right break-all">{value}</span>
    </div>
  );
}
