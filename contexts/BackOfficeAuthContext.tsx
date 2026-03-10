/**
 * Back Office Authentication Context
 * 
 * Provides unified authentication state and user management for the back office system.
 * Manages authentication, user permissions, and department access control.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/firebase';
import { BackOfficeUser, Department, PermissionLevel } from '@/types/backoffice';
import { PermissionService } from '@/lib/backoffice/permission-service';

/**
 * Back Office Authentication Context Type
 * Defines the shape of the authentication context
 */
interface BackOfficeAuthContextType {
  /** Firebase Auth user object */
  user: User | null;
  
  /** Back office user document with role and permissions */
  backOfficeUser: BackOfficeUser | null;
  
  /** Loading state during authentication operations */
  loading: boolean;
  
  /** Error message if authentication fails */
  error: string | null;
  
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  
  /** Sign out the current user */
  signOut: () => Promise<void>;
  
  /** Check if user has specific permission for a department */
  hasPermission: (department: Department, level: keyof PermissionLevel) => boolean;
  
  /** Check if user can access a department */
  canAccessDepartment: (department: Department) => boolean;
  
  /** Refresh user data from Firestore */
  refreshUser: () => Promise<void>;
  
  /** Clear error state */
  clearError: () => void;
}

/**
 * Back Office Authentication Context
 */
const BackOfficeAuthContext = createContext<BackOfficeAuthContextType | undefined>(undefined);

/**
 * Hook to access Back Office authentication context
 * @throws Error if used outside of BackOfficeAuthProvider
 */
export const useBackOfficeAuth = (): BackOfficeAuthContextType => {
  const context = useContext(BackOfficeAuthContext);
  if (!context) {
    throw new Error('useBackOfficeAuth must be used within a BackOfficeAuthProvider');
  }
  return context;
};

/**
 * Back Office Authentication Provider Component
 * Manages authentication state and provides auth methods to children
 */
export const BackOfficeAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [backOfficeUser, setBackOfficeUser] = useState<BackOfficeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch back office user data from Firestore
   * 
   * @param uid - Firebase user ID
   */
  const fetchBackOfficeUser = useCallback(async (uid: string): Promise<void> => {
    try {
      const userDocRef = doc(db, 'backoffice_users', uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.error('[BackOffice Auth] User document not found:', uid);
        setBackOfficeUser(null);
        setError('Back office account not found. Please contact your administrator.');
        return;
      }

      const userData = userDoc.data() as BackOfficeUser;

      // Check if user is active
      if (!userData.isActive) {
        console.warn('[BackOffice Auth] User account is inactive:', uid);
        setBackOfficeUser(null);
        setError('Your account has been deactivated. Please contact your administrator.');
        
        // Sign out inactive users
        await firebaseSignOut(auth);
        return;
      }

      console.log('[BackOffice Auth] User loaded:', {
        uid: userData.uid,
        email: userData.email,
        role: userData.role,
        departments: userData.departments,
      });

      setBackOfficeUser(userData);
      setError(null);
    } catch (err) {
      console.error('[BackOffice Auth] Error fetching user:', err);
      setBackOfficeUser(null);
      setError('Failed to load user profile. Please try again.');
    }
  }, []);

  /**
   * Sign in with email and password
   * 
   * @param email - User email
   * @param password - User password
   */
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      console.log('[BackOffice Auth] Attempting sign in:', email);

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('[BackOffice Auth] Firebase sign in successful:', userCredential.user.uid);

      // Fetch back office user data
      await fetchBackOfficeUser(userCredential.user.uid);

      console.log('[BackOffice Auth] Sign in complete');
    } catch (err: any) {
      console.error('[BackOffice Auth] Sign in error:', err);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Sign in failed. Please try again.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      setBackOfficeUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchBackOfficeUser]);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      console.log('[BackOffice Auth] Signing out');

      await firebaseSignOut(auth);

      // Clear state
      setUser(null);
      setBackOfficeUser(null);
      setError(null);

      console.log('[BackOffice Auth] Sign out complete');

      // Redirect to login
      router.push('/backoffice/login');
    } catch (err) {
      console.error('[BackOffice Auth] Sign out error:', err);
      setError('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  /**
   * Check if user has specific permission for a department
   * 
   * @param department - Department to check
   * @param level - Permission level to check
   * @returns True if user has permission
   */
  const hasPermission = useCallback((department: Department, level: keyof PermissionLevel): boolean => {
    if (!backOfficeUser) {
      return false;
    }

    return PermissionService.hasPermission(backOfficeUser, department, level);
  }, [backOfficeUser]);

  /**
   * Check if user can access a department
   * 
   * @param department - Department to check
   * @returns True if user can access department
   */
  const canAccessDepartment = useCallback((department: Department): boolean => {
    if (!backOfficeUser) {
      return false;
    }

    return PermissionService.canAccessDepartment(backOfficeUser, department);
  }, [backOfficeUser]);

  /**
   * Refresh user data from Firestore
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!user) {
      console.warn('[BackOffice Auth] Cannot refresh user: no user logged in');
      return;
    }

    try {
      setLoading(true);
      console.log('[BackOffice Auth] Refreshing user data');
      await fetchBackOfficeUser(user.uid);
    } catch (err) {
      console.error('[BackOffice Auth] Error refreshing user:', err);
      setError('Failed to refresh user data.');
    } finally {
      setLoading(false);
    }
  }, [user, fetchBackOfficeUser]);

  /**
   * Set up Firebase auth state listener
   * Automatically fetches back office user data when auth state changes
   */
  useEffect(() => {
    let isMounted = true;

    console.log('[BackOffice Auth] Setting up auth state listener');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      console.log('[BackOffice Auth] Auth state changed:', firebaseUser ? firebaseUser.email : 'No user');

      if (firebaseUser) {
        // User is authenticated
        setUser(firebaseUser);
        
        // Fetch back office user data
        await fetchBackOfficeUser(firebaseUser.uid);
      } else {
        // User is not authenticated
        setUser(null);
        setBackOfficeUser(null);
        setError(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchBackOfficeUser]);

  /**
   * Memoize context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo(
    () => ({
      user,
      backOfficeUser,
      loading,
      error,
      signIn,
      signOut,
      hasPermission,
      canAccessDepartment,
      refreshUser,
      clearError,
    }),
    [
      user,
      backOfficeUser,
      loading,
      error,
      signIn,
      signOut,
      hasPermission,
      canAccessDepartment,
      refreshUser,
      clearError,
    ]
  );

  return (
    <BackOfficeAuthContext.Provider value={contextValue}>
      {children}
    </BackOfficeAuthContext.Provider>
  );
};

/**
 * Higher-order component for protecting back office routes
 * Redirects unauthenticated users to login page
 */
export interface WithBackOfficeAuthOptions {
  /** Required department access */
  requiredDepartment?: Department;
  
  /** Required permission level */
  requiredPermission?: keyof PermissionLevel;
  
  /** Redirect URL for unauthorized users */
  redirectTo?: string;
  
  /** Fallback component to show while loading */
  fallback?: React.ComponentType;
}

export function withBackOfficeAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithBackOfficeAuthOptions = {}
) {
  const WrappedComponent = (props: P) => {
    const {
      user,
      backOfficeUser,
      loading,
      error,
      hasPermission,
      canAccessDepartment,
    } = useBackOfficeAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return;

      // Check if user is authenticated
      if (!user) {
        const redirectUrl = options.redirectTo || '/backoffice/login';
        console.log('[BackOffice Auth] User not authenticated, redirecting to:', redirectUrl);
        router.push(redirectUrl);
        return;
      }

      // Check if back office user data is loaded
      if (!backOfficeUser) {
        console.log('[BackOffice Auth] Back office user not loaded');
        return;
      }

      // Check department access if required
      if (options.requiredDepartment && !canAccessDepartment(options.requiredDepartment)) {
        console.log('[BackOffice Auth] User does not have access to department:', options.requiredDepartment);
        router.push('/backoffice/unauthorized');
        return;
      }

      // Check permission level if required
      if (
        options.requiredDepartment &&
        options.requiredPermission &&
        !hasPermission(options.requiredDepartment, options.requiredPermission)
      ) {
        console.log('[BackOffice Auth] User does not have required permission:', options.requiredPermission);
        router.push('/backoffice/unauthorized');
        return;
      }
    }, [loading, user, backOfficeUser, hasPermission, canAccessDepartment, router]);

    // Show loading state
    if (loading) {
      if (options.fallback) {
        const FallbackComponent = options.fallback;
        return <FallbackComponent />;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Show error state
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      );
    }

    // Don't render if not authenticated or authorized
    if (!user || !backOfficeUser) {
      return null;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withBackOfficeAuth(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
