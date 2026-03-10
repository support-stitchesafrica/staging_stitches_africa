/**
 * Back Office Layout
 * 
 * Main layout for the unified back office system.
 * Provides authentication context, checks user authentication,
 * and renders the sidebar navigation with responsive design.
 * 
 * Requirements: 1.1, 14.1, 18.1, 18.2, 18.3, 19.1
 */

'use client';

import { BackOfficeAuthProvider } from '@/contexts/BackOfficeAuthContext';
import { BackOfficeSidebar } from '@/components/backoffice/BackOfficeSidebar';
import BackOfficeHeader from '@/components/backoffice/BackOfficeHeader';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Loading Spinner Component
 * Displays while authentication state is being determined
 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 font-medium">Loading Back Office...</p>
      </div>
    </div>
  );
}

/**
 * Back Office Layout Content
 * Handles authentication checks and renders the main layout
 */
function BackOfficeLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, backOfficeUser, loading, error } = useBackOfficeAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Authentication Check
   * Redirects unauthenticated users to login page
   * Requirement: 19.1 - Unauthenticated access redirects to login
   */
  useEffect(() => {
    // Skip auth check for login and invitation pages
    const isAuthPage = pathname?.startsWith('/backoffice/login') || 
                       pathname?.startsWith('/backoffice/accept-invitation');
    
    if (isAuthPage) {
      return;
    }

    // Skip auth check if still loading
    if (loading) {
      return;
    }

    // Check if user is authenticated
    if (!user) {
      console.log('[BackOffice Layout] User not authenticated, redirecting to login');
      router.push('/backoffice/login');
      return;
    }

    // Check if back office user data is loaded
    if (!backOfficeUser) {
      console.log('[BackOffice Layout] Back office user data not loaded');
      // Don't redirect yet, wait for user data to load or error
      return;
    }

    // Check if user account is active
    if (!backOfficeUser.isActive) {
      console.log('[BackOffice Layout] User account is inactive');
      router.push('/backoffice/login');
      return;
    }

    console.log('[BackOffice Layout] User authenticated:', {
      email: backOfficeUser.email,
      role: backOfficeUser.role,
      departments: backOfficeUser.departments,
    });
  }, [user, backOfficeUser, loading, router, pathname]);

  /**
   * Close mobile menu when route changes
   * Requirement: 18.3 - Mobile hamburger menu
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Check if this is an auth page (login, accept-invitation)
  const isAuthPage = pathname?.startsWith('/backoffice/login') || 
                     pathname?.startsWith('/backoffice/accept-invitation');

  // For auth pages, render children directly without authentication checks
  if (isAuthPage) {
    return <>{children}</>;
  }

  /**
   * Show loading state while authentication is being determined
   */
  if (loading) {
    return <LoadingSpinner />;
  }

  /**
   * Show error state if authentication failed
   */
  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/backoffice/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  /**
   * Don't render content if user is not authenticated or user data is not loaded
   * This prevents flash of content before redirect
   */
  if (!user || !backOfficeUser) {
    return null;
  }

  /**
   * Main Layout Structure
   * Requirements:
   * - 14.1: Sidebar with department dropdowns
   * - 18.1: Desktop full sidebar layout
   * - 18.2: Tablet collapsible sidebar
   * - 18.3: Mobile hamburger menu
   */
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: slide-in menu */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <BackOfficeSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header with Hamburger Menu - Only on mobile */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BO</span>
            </div>
            <span className="font-semibold text-gray-900">Back Office</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Desktop Header - Only on desktop */}
        <div className="hidden lg:block">
          <BackOfficeHeader />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Back Office Layout Root Component
 * Wraps the entire back office with authentication provider
 * 
 * Requirement: 1.1 - Unified authentication system
 */
export default function BackOfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackOfficeAuthProvider>
      <BackOfficeLayoutContent>{children}</BackOfficeLayoutContent>
    </BackOfficeAuthProvider>
  );
}
