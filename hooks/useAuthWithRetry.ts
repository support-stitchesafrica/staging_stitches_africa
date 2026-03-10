'use client';

import { useState, useCallback } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, AuthResult } from '@/lib/auth-simple';
import { isOnline, setupNetworkListeners } from '@/lib/utils/network-utils';
import { useEffect } from 'react';

interface AuthState {
  loading: boolean;
  error: string | null;
  isRetryable: boolean;
  retryCount: number;
}

interface UseAuthWithRetryReturn {
  authState: AuthState;
  signInWithEmailRetry: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmailRetry: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogleRetry: () => Promise<AuthResult>;
  retry: () => Promise<void>;
  clearError: () => void;
  isOnlineStatus: boolean;
}

export const useAuthWithRetry = (): UseAuthWithRetryReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    loading: false,
    error: null,
    isRetryable: false,
    retryCount: 0,
  });
  
  const [isOnlineStatus, setIsOnlineStatus] = useState(isOnline());
  const [lastOperation, setLastOperation] = useState<(() => Promise<AuthResult>) | null>(null);

  // Setup network listeners
  useEffect(() => {
    const cleanup = setupNetworkListeners(
      () => setIsOnlineStatus(true),
      () => setIsOnlineStatus(false)
    );
    
    return cleanup;
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      error: null,
      isRetryable: false,
      retryCount: 0,
    }));
    setLastOperation(null);
  }, []);

  const handleAuthOperation = useCallback(async (
    operation: () => Promise<AuthResult>,
    operationName: string
  ): Promise<AuthResult> => {
    setAuthState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const result = await operation();
      
      if (result.error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.error,
          isRetryable: result.isRetryable || false,
          retryCount: 0,
        }));
        
        // Store operation for retry if it's retryable
        if (result.isRetryable) {
          setLastOperation(() => operation);
        }
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: null,
          isRetryable: false,
          retryCount: 0,
        }));
        setLastOperation(null);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        isRetryable: true,
        retryCount: 0,
      }));
      
      setLastOperation(() => operation);
      
      return {
        user: null,
        error: errorMessage,
        isRetryable: true,
      };
    }
  }, []);

  const signInWithEmailRetry = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    return handleAuthOperation(
      () => signInWithEmail(email, password),
      'signInWithEmail'
    );
  }, [handleAuthOperation]);

  const signUpWithEmailRetry = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    return handleAuthOperation(
      () => signUpWithEmail(email, password),
      'signUpWithEmail'
    );
  }, [handleAuthOperation]);

  const signInWithGoogleRetry = useCallback(async (): Promise<AuthResult> => {
    return handleAuthOperation(
      () => signInWithGoogle(),
      'signInWithGoogle'
    );
  }, [handleAuthOperation]);

  const retry = useCallback(async (): Promise<void> => {
    if (!lastOperation || !authState.isRetryable) {
      return;
    }

    setAuthState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
    }));

    await handleAuthOperation(lastOperation, 'retry');
  }, [lastOperation, authState.isRetryable, handleAuthOperation]);

  return {
    authState,
    signInWithEmailRetry,
    signUpWithEmailRetry,
    signInWithGoogleRetry,
    retry,
    clearError,
    isOnlineStatus,
  };
};