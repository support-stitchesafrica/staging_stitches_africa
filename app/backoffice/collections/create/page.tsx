/**
 * Create Collection Page
 * 
 * Form for creating new product collections.
 * Accessible to users with collections write permissions.
 * 
 * Requirements: 11.4, 12.3, 12.4
 */

'use client';

import PermissionGuard from '@/components/backoffice/PermissionGuard';
import CreateCollectionForm from '@/components/backoffice/collections/CreateCollectionForm';
import Link from 'next/link';

/**
 * Unauthorized Access Component
 * Shown when user doesn't have collections write access
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
        <p className="text-gray-600 mb-4">You don't have permission to create collections.</p>
        <Link href="/backoffice/collections">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Back to Collections
          </button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Create Collection Page
 * Protected by permission guard to ensure only authorized users can access
 */
export default function CreateCollectionPage() {
  return (
    <PermissionGuard
      department="collections"
      permission="write"
      fallback={<UnauthorizedAccess />}
    >
      <CreateCollectionForm />
    </PermissionGuard>
  );
}