/**
 * Back Office Login Page
 * 
 * Entry point for back office authentication.
 * Renders the login form with Bumpa-style design.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import LoginForm from '@/components/backoffice/auth/LoginForm';

/**
 * Login Page Component
 * 
 * Requirement: 1.1 - Unified login form
 * Requirement: 1.2 - Email/password authentication
 * Requirement: 1.3 - Load user role and permissions
 */
export default function LoginPage() {
  const router = useRouter();
  const { user, backOfficeUser, loading } = useBackOfficeAuth();

  /**
   * Redirect authenticated users to dashboard
   * Prevents logged-in users from seeing the login page
   */
  useEffect(() => {
    if (!loading && user && backOfficeUser) {
      console.log('[Login Page] User already authenticated, redirecting to dashboard');
      router.push('/backoffice');
    }
  }, [user, backOfficeUser, loading, router]);

  /**
   * Show loading state while checking authentication
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  /**
   * Don't render login form if user is already authenticated
   * Prevents flash of login form before redirect
   */
  if (user && backOfficeUser) {
    return null;
  }

  /**
   * Render login form
   */
  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700/50">
      <LoginForm />
    </div>
  );
}
