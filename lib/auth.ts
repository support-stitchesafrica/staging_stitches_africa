// Authentication utilities with enhanced wrapper service integration
import type { User } from 'firebase/auth';
import { authService, type AuthResult } from './auth-service';
import { getAuthFunctions } from './firebase-wrapper';

// Set authentication persistence with dynamic import
const initAuthPersistence = async () => {
  try {
    // Only initialize if we're in a browser environment
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      const { setPersistence, browserLocalPersistence, auth } = await getAuthFunctions();
      await setPersistence(auth, browserLocalPersistence);
      console.log('Firebase Auth persistence set successfully');
    }
  } catch (error) {
    console.error('Failed to set Firebase Auth persistence:', error);
    // Don't throw error during module load - let the wrapper service handle retries
  }
};

// Initialize persistence only in browser environment
if (typeof window !== 'undefined') {
  initAuthPersistence();
}

// Re-export AuthResult interface for backward compatibility
export type { AuthResult };

// Legacy interface for backward compatibility
export interface AuthErrorDetails {
  code: string;
  message: string;
  isNetworkError: boolean;
  isRetryable: boolean;
  userFriendlyMessage: string;
}

/**
 * Sign in with email and password using the wrapper service
 */
export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  return authService.signInWithEmail(email, password);
};

/**
 * Sign up with email and password using the wrapper service
 */
export const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  return authService.signUpWithEmail(email, password);
};

/**
 * Sign in with Google using the wrapper service
 */
export const signInWithGoogle = async (): Promise<AuthResult> => {
  return authService.signInWithGoogle();
};

/**
 * Sign out current user using the wrapper service
 */
export const logout = async (): Promise<{ error: string | null }> => {
  return authService.signOut();
};

/**
 * Set up authentication state change listener using the wrapper service
 */
export const onAuthStateChange = async (callback: (user: User | null) => void) => {
  try {
    return await authService.onAuthStateChange(callback);
  } catch (error) {
    console.error('Failed to set up auth state listener:', error);
    throw error;
  }
};

// Legacy error handling functions are now handled by the auth service wrapper
// These functions have been moved to auth-service.ts for better organization and enhanced functionality