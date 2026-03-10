// Simple authentication service without complex module loading
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User
} from 'firebase/auth';
import { auth } from './firebase-simple';

// Enhanced AuthResult interface
export interface AuthResult {
  user: User | null;
  error: string | null;
  isRetryable?: boolean;
}

// Set authentication persistence
const initAuthPersistence = async () => {
  try {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await setPersistence(auth, browserLocalPersistence);
      console.log('Firebase Auth persistence set successfully');
    }
  } catch (error) {
    console.error('Failed to set Firebase Auth persistence:', error);
  }
};

// Initialize persistence only in browser environment
if (typeof window !== 'undefined') {
  initAuthPersistence();
}

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { 
      user: result.user, 
      error: null, 
      isRetryable: false
    };
  } catch (error: any) {
    return { 
      user: null, 
      error: getAuthErrorMessage(error.code || 'unknown'),
      isRetryable: getIsRetryableAuthError(error.code || 'unknown')
    };
  }
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { 
      user: result.user, 
      error: null, 
      isRetryable: false
    };
  } catch (error: any) {
    return { 
      user: null, 
      error: getAuthErrorMessage(error.code || 'unknown'),
      isRetryable: getIsRetryableAuthError(error.code || 'unknown')
    };
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<AuthResult> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    const result = await signInWithPopup(auth, provider);
    return { 
      user: result.user, 
      error: null, 
      isRetryable: false
    };
  } catch (error: any) {
    return { 
      user: null, 
      error: getAuthErrorMessage(error.code || 'unknown'),
      isRetryable: getIsRetryableAuthError(error.code || 'unknown')
    };
  }
};

/**
 * Sign out current user
 */
export const logout = async (): Promise<{ error: string | null }> => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: getAuthErrorMessage(error.code || 'unknown') };
  }
};

/**
 * Set up authentication state change listener
 */
export const onAuthStateChange = async (callback: (user: User | null) => void) => {
  try {
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    console.error('Failed to set up auth state listener:', error);
    throw error;
  }
};

/**
 * Get user-friendly error message for Firebase auth errors
 */
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Please allow pop-ups and try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/internal-error':
      return 'An internal error occurred. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your email and password.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
}

/**
 * Determine if an auth error is retryable
 */
function getIsRetryableAuthError(errorCode: string): boolean {
  const retryableErrors = [
    'auth/network-request-failed',
    'auth/timeout',
    'auth/internal-error',
    'auth/cancelled-popup-request',
    'auth/popup-blocked',
    'auth/popup-closed-by-user',
  ];
  
  return retryableErrors.includes(errorCode);
}