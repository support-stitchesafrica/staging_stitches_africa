// Authentication service wrapper with enhanced error handling and module loading support
import type { User } from 'firebase/auth';
import { getAuthFunctions } from './firebase-wrapper';

// Enhanced AuthResult interface with module loading error support
export interface AuthResult {
  user: User | null;
  error: string | null;
  isRetryable?: boolean;
  moduleLoadError?: boolean;
}

// Authentication service interface
export interface AuthService {
  signInWithEmail(email: string, password: string): Promise<AuthResult>;
  signUpWithEmail(email: string, password: string): Promise<AuthResult>;
  signInWithGoogle(): Promise<AuthResult>;
  signOut(): Promise<{ error: string | null }>;
  onAuthStateChange(callback: (user: User | null) => void): Promise<() => void>;
}

// Error types for better error categorization
export enum AuthErrorType {
  MODULE_LOAD_ERROR = 'module-load-error',
  NETWORK_ERROR = 'network-error',
  AUTH_ERROR = 'auth-error',
  UNKNOWN_ERROR = 'unknown-error'
}

// Enhanced error details interface
export interface AuthErrorDetails {
  type: AuthErrorType;
  code: string;
  message: string;
  isRetryable: boolean;
  userFriendlyMessage: string;
  moduleLoadError: boolean;
}

// Authentication service implementation
class FirebaseAuthService implements AuthService {
  
  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const { signInWithEmailAndPassword, auth } = await getAuthFunctions();
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { 
        user: result.user, 
        error: null, 
        isRetryable: false,
        moduleLoadError: false
      };
      
    } catch (error) {
      const errorDetails = this.getAuthErrorDetails(error);
      return { 
        user: null, 
        error: errorDetails.userFriendlyMessage,
        isRetryable: errorDetails.isRetryable,
        moduleLoadError: errorDetails.moduleLoadError
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const { createUserWithEmailAndPassword, auth } = await getAuthFunctions();
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return { 
        user: result.user, 
        error: null, 
        isRetryable: false,
        moduleLoadError: false
      };
      
    } catch (error) {
      const errorDetails = this.getAuthErrorDetails(error);
      return { 
        user: null, 
        error: errorDetails.userFriendlyMessage,
        isRetryable: errorDetails.isRetryable,
        moduleLoadError: errorDetails.moduleLoadError
      };
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const { GoogleAuthProvider, signInWithPopup, auth } = await getAuthFunctions();
      
      const provider = new GoogleAuthProvider();
      // Add additional scopes for better user experience
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      return { 
        user: result.user, 
        error: null, 
        isRetryable: false,
        moduleLoadError: false
      };
      
    } catch (error) {
      const errorDetails = this.getAuthErrorDetails(error);
      return { 
        user: null, 
        error: errorDetails.userFriendlyMessage,
        isRetryable: errorDetails.isRetryable,
        moduleLoadError: errorDetails.moduleLoadError
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { signOut, auth } = await getAuthFunctions();
      
      await signOut(auth);
      return { error: null };
      
    } catch (error) {
      const errorDetails = this.getAuthErrorDetails(error);
      return { error: errorDetails.userFriendlyMessage };
    }
  }

  /**
   * Set up authentication state change listener
   */
  async onAuthStateChange(callback: (user: User | null) => void): Promise<() => void> {
    try {
      const { onAuthStateChanged, auth } = await getAuthFunctions();
      
      return onAuthStateChanged(auth, callback);
      
    } catch (error) {
      console.error('Failed to set up auth state listener:', error);
      const errorDetails = this.getAuthErrorDetails(error);
      throw new Error(`Auth state listener setup failed: ${errorDetails.userFriendlyMessage}`);
    }
  }

  /**
   * Get detailed error information for better error handling
   */
  private getAuthErrorDetails(error: any): AuthErrorDetails {
    // Handle module loading errors
    if (this.isModuleLoadError(error)) {
      return {
        type: AuthErrorType.MODULE_LOAD_ERROR,
        code: 'module-load-failed',
        message: error.message,
        isRetryable: true,
        userFriendlyMessage: 'Authentication system is temporarily unavailable. Please try again.',
        moduleLoadError: true,
      };
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return {
        type: AuthErrorType.NETWORK_ERROR,
        code: 'network-error',
        message: error.message,
        isRetryable: true,
        userFriendlyMessage: 'Connection problem. Please check your internet and try again.',
        moduleLoadError: false,
      };
    }

    // Handle Firebase auth errors
    if (error && typeof error === 'object' && 'code' in error) {
      const authError = error as { code: string; message: string };
      const isRetryable = this.getIsRetryableAuthError(authError.code);
      
      return {
        type: AuthErrorType.AUTH_ERROR,
        code: authError.code,
        message: authError.message,
        isRetryable,
        userFriendlyMessage: this.getAuthErrorMessage(authError.code),
        moduleLoadError: false,
      };
    }

    // Handle generic errors
    return {
      type: AuthErrorType.UNKNOWN_ERROR,
      code: 'unknown-error',
      message: error?.message || 'Unknown error',
      isRetryable: false,
      userFriendlyMessage: 'An unexpected error occurred. Please try again.',
      moduleLoadError: false,
    };
  }

  /**
   * Check if error is a module loading error
   */
  private isModuleLoadError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || '';
    const moduleLoadErrorPatterns = [
      'Failed to load',
      'Module loading failed',
      'module factory not available',
      'Cannot resolve module',
      'Dynamic import failed',
      'Module not found'
    ];
    
    return moduleLoadErrorPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorCode = error.code || '';
    const errorMessage = error.message || '';
    
    const networkErrorCodes = [
      'auth/network-request-failed',
      'auth/timeout',
      'network-error'
    ];
    
    const networkErrorMessages = [
      'network error',
      'connection failed',
      'timeout',
      'fetch failed'
    ];
    
    return networkErrorCodes.includes(errorCode) ||
           networkErrorMessages.some(msg => 
             errorMessage.toLowerCase().includes(msg.toLowerCase())
           );
  }

  /**
   * Get user-friendly error message for Firebase auth errors
   */
  private getAuthErrorMessage(errorCode: string): string {
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
  private getIsRetryableAuthError(errorCode: string): boolean {
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
}

// Export singleton instance
export const authService: AuthService = new FirebaseAuthService();

// Export class for testing purposes
export { FirebaseAuthService };