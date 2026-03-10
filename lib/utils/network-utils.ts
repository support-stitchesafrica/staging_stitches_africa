// Network connectivity utilities for authentication flows

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
}

export class NetworkError extends Error {
  constructor(message: string, public isRetryable: boolean = true) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Check if the browser is online
 */
export const isOnline = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

/**
 * Get network status information
 */
export const getNetworkStatus = (): NetworkStatus => {
  if (typeof navigator === 'undefined') {
    return {
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'unknown',
    };
  }

  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    isOnline: navigator.onLine,
    isSlowConnection: connection ? connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false,
    connectionType: connection ? connection.effectiveType : 'unknown',
  };
};

/**
 * Wait for network to come back online
 */
export const waitForOnline = (timeout: number = 30000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onOnline);
      reject(new NetworkError('Network timeout: Unable to connect after 30 seconds'));
    }, timeout);

    const onOnline = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', onOnline);
      resolve();
    };

    window.addEventListener('online', onOnline);
  });
};

/**
 * Check if an error is network-related
 */
export const isNetworkError = (error: any): boolean => {
  if (error instanceof NetworkError) return true;
  
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || '';
  
  // Firebase network error codes
  const networkErrorCodes = [
    'auth/network-request-failed',
    'auth/timeout',
    'unavailable',
    'deadline-exceeded',
  ];
  
  // Common network error messages
  const networkErrorMessages = [
    'network error',
    'network request failed',
    'fetch failed',
    'connection failed',
    'timeout',
    'no internet',
    'offline',
  ];
  
  return (
    !isOnline() ||
    networkErrorCodes.includes(errorCode) ||
    networkErrorMessages.some(msg => errorMessage.includes(msg))
  );
};

/**
 * Create a network-aware retry function
 */
export const createNetworkRetry = <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  return new Promise(async (resolve, reject) => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check network status before attempting
        if (!isOnline()) {
          throw new NetworkError('No internet connection');
        }
        
        const result = await operation();
        resolve(result);
        return;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if it's not a network error
        if (!isNetworkError(error)) {
          reject(error);
          return;
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          reject(lastError);
          return;
        }
        
        // Wait for network if offline
        if (!isOnline()) {
          try {
            await waitForOnline(10000); // Wait up to 10 seconds for network
          } catch (networkError) {
            reject(networkError);
            return;
          }
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    reject(lastError!);
  });
};

/**
 * Setup network status listeners
 */
export const setupNetworkListeners = (
  onOnline?: () => void,
  onOffline?: () => void
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => {
    console.log('Network: Back online');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('Network: Gone offline');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};