/**
 * Firebase Functions Wrapper with Availability Checking
 * 
 * Provides a safe wrapper around Firebase Functions that handles unavailability
 * gracefully and implements fallback behavior when the Functions service is not available.
 */

import type { Functions, HttpsCallable, HttpsCallableResult } from 'firebase/functions';
import { getFirebaseFunctions } from './firebase';
import { isFirebaseFunctionsAvailable } from './utils/module-helpers';

/**
 * Interface for Firebase Functions wrapper operations
 */
export interface FirebaseFunctionsWrapper {
  isAvailable(): Promise<boolean>;
  getFunctions(): Promise<Functions | null>;
  callFunction(name: string, data?: any): Promise<any>;
  getHttpsCallable(name: string): Promise<HttpsCallable | null>;
  connectFunctionsEmulator(host: string, port: number): Promise<boolean>;
}

/**
 * Result type for function calls with error handling
 */
export interface FunctionCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fallbackUsed?: boolean;
}

/**
 * Configuration options for the Functions wrapper
 */
export interface FunctionsWrapperConfig {
  enableFallbacks: boolean;
  logErrors: boolean;
  retryAttempts: number;
  emulatorConfig?: {
    host: string;
    port: number;
  };
}

/**
 * Default configuration for the Functions wrapper
 */
const DEFAULT_CONFIG: FunctionsWrapperConfig = {
  enableFallbacks: true,
  logErrors: process.env.NODE_ENV === 'development',
  retryAttempts: 2,
};

/**
 * Firebase Functions Wrapper Implementation
 * 
 * Provides null-safe operations and graceful degradation when Firebase Functions
 * is not available or fails to load.
 */
class FirebaseFunctionsWrapperImpl implements FirebaseFunctionsWrapper {
  private config: FunctionsWrapperConfig;
  private functionsInstance: Functions | null = null;
  private availabilityChecked = false;
  private isServiceAvailable = false;
  private lastAvailabilityCheck: Date | null = null;
  private readonly availabilityCacheTimeout = 30000; // 30 seconds

  constructor(config: Partial<FunctionsWrapperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if Firebase Functions service is available
   * Caches the result for performance optimization
   */
  async isAvailable(): Promise<boolean> {
    // Check cache first
    if (this.availabilityChecked && this.lastAvailabilityCheck) {
      const timeSinceCheck = Date.now() - this.lastAvailabilityCheck.getTime();
      if (timeSinceCheck < this.availabilityCacheTimeout) {
        return this.isServiceAvailable;
      }
    }

    try {
      // Check module availability first
      const moduleAvailability = await isFirebaseFunctionsAvailable();
      
      if (!moduleAvailability.available) {
        this.isServiceAvailable = false;
        this.logWarning(`Firebase Functions module not available: ${moduleAvailability.reason}`);
        this.updateAvailabilityCache(false);
        return false;
      }

      // Try to get Functions instance
      const functions = await this.getFunctions();
      this.isServiceAvailable = functions !== null;
      this.updateAvailabilityCache(this.isServiceAvailable);
      
      if (this.config.logErrors && !this.isServiceAvailable) {
        this.logWarning('Firebase Functions service is not available');
      }

      return this.isServiceAvailable;
    } catch (error) {
      this.isServiceAvailable = false;
      this.updateAvailabilityCache(false);
      
      if (this.config.logErrors) {
        this.logError('Error checking Firebase Functions availability:', error);
      }
      
      return false;
    }
  }

  /**
   * Get Firebase Functions instance with null-safe handling
   */
  async getFunctions(): Promise<Functions | null> {
    // Return cached instance if available
    if (this.functionsInstance) {
      return this.functionsInstance;
    }

    try {
      const functions = await getFirebaseFunctions();
      
      if (functions) {
        this.functionsInstance = functions;
        
        // Configure emulator if specified
        if (this.config.emulatorConfig && process.env.NODE_ENV === 'development') {
          await this.connectFunctionsEmulator(
            this.config.emulatorConfig.host,
            this.config.emulatorConfig.port
          );
        }
        
        if (this.config.logErrors) {
          console.log('[Firebase Functions Wrapper] Functions service initialized successfully');
        }
      } else {
        if (this.config.logErrors) {
          this.logWarning('Firebase Functions service returned null - service unavailable');
        }
      }

      return functions;
    } catch (error) {
      if (this.config.logErrors) {
        this.logError('Failed to get Firebase Functions instance:', error);
      }
      return null;
    }
  }

  /**
   * Call a Firebase Function with error handling and fallback support
   */
  async callFunction(name: string, data?: any): Promise<any> {
    const result = await this.callFunctionWithResult(name, data);
    
    if (result.success) {
      return result.data;
    }
    
    // Throw error if no fallback was used
    if (!result.fallbackUsed) {
      throw new Error(result.error || `Failed to call function: ${name}`);
    }
    
    // Return fallback result
    return result.data;
  }

  /**
   * Call a Firebase Function and return detailed result information
   */
  async callFunctionWithResult<T = any>(name: string, data?: any): Promise<FunctionCallResult<T>> {
    // Check availability first
    const available = await this.isAvailable();
    
    if (!available) {
      const fallbackResult = await this.handleUnavailableFunction(name, data);
      return {
        success: false,
        error: 'Firebase Functions service is not available',
        fallbackUsed: fallbackResult !== null,
        data: fallbackResult
      };
    }

    // Attempt to call the function with retries
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const callable = await this.getHttpsCallable(name);
        
        if (!callable) {
          return {
            success: false,
            error: `Failed to get callable function: ${name}`,
            fallbackUsed: false
          };
        }

        const result = await callable(data) as HttpsCallableResult<T>;
        
        if (this.config.logErrors && attempt > 0) {
          console.log(`[Firebase Functions Wrapper] Function call succeeded on attempt ${attempt + 1}: ${name}`);
        }

        return {
          success: true,
          data: result.data
        };
      } catch (error) {
        const isLastAttempt = attempt === this.config.retryAttempts - 1;
        
        if (this.config.logErrors) {
          const attemptInfo = isLastAttempt ? 'final attempt' : `attempt ${attempt + 1}/${this.config.retryAttempts}`;
          this.logError(`Function call failed (${attemptInfo}): ${name}`, error);
        }

        // If this is the last attempt, try fallback
        if (isLastAttempt) {
          const fallbackResult = await this.handleFailedFunction(name, data, error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            fallbackUsed: fallbackResult !== null,
            data: fallbackResult
          };
        }

        // Wait before retry (except on last attempt)
        if (!isLastAttempt) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }

    // This should never be reached, but included for completeness
    return {
      success: false,
      error: `Function call failed after ${this.config.retryAttempts} attempts: ${name}`,
      fallbackUsed: false
    };
  }

  /**
   * Get an HttpsCallable function with null-safe handling
   */
  async getHttpsCallable(name: string): Promise<HttpsCallable | null> {
    try {
      const functions = await this.getFunctions();
      
      if (!functions) {
        if (this.config.logErrors) {
          this.logWarning(`Cannot create callable function '${name}' - Functions service unavailable`);
        }
        return null;
      }

      // Dynamic import of httpsCallable to avoid loading issues
      const { loadFirebaseModule } = await import('./utils/module-helpers');
      const functionsModule = await loadFirebaseModule('firebase/functions', 'firebase_functions_callable');
      const { httpsCallable } = functionsModule;

      return httpsCallable(functions, name);
    } catch (error) {
      if (this.config.logErrors) {
        this.logError(`Failed to create callable function '${name}':`, error);
      }
      return null;
    }
  }

  /**
   * Connect to Firebase Functions emulator (development only)
   */
  async connectFunctionsEmulator(host: string, port: number): Promise<boolean> {
    if (process.env.NODE_ENV !== 'development') {
      if (this.config.logErrors) {
        this.logWarning('Functions emulator connection attempted in non-development environment');
      }
      return false;
    }

    try {
      const functions = await this.getFunctions();
      
      if (!functions) {
        if (this.config.logErrors) {
          this.logWarning('Cannot connect to emulator - Functions service unavailable');
        }
        return false;
      }

      // Dynamic import of connectFunctionsEmulator
      const { loadFirebaseModule } = await import('./utils/module-helpers');
      const functionsModule = await loadFirebaseModule('firebase/functions', 'firebase_functions_emulator');
      const { connectFunctionsEmulator } = functionsModule;

      connectFunctionsEmulator(functions, host, port);
      
      if (this.config.logErrors) {
        console.log(`[Firebase Functions Wrapper] Connected to emulator at ${host}:${port}`);
      }
      
      return true;
    } catch (error) {
      if (this.config.logErrors) {
        this.logError(`Failed to connect to Functions emulator at ${host}:${port}:`, error);
      }
      return false;
    }
  }

  /**
   * Handle function calls when Functions service is unavailable
   * Override this method to provide custom fallback behavior
   */
  protected async handleUnavailableFunction(name: string, data?: any): Promise<any> {
    if (!this.config.enableFallbacks) {
      return null;
    }

    // Default fallback behavior - can be overridden by subclasses
    if (this.config.logErrors) {
      this.logWarning(`Using fallback for unavailable function: ${name}`);
    }

    // Return a basic fallback response structure
    return {
      success: false,
      message: 'Function service unavailable',
      fallback: true,
      functionName: name,
      requestData: data
    };
  }

  /**
   * Handle failed function calls
   * Override this method to provide custom error handling
   */
  protected async handleFailedFunction(name: string, data?: any, error?: any): Promise<any> {
    if (!this.config.enableFallbacks) {
      return null;
    }

    // Default error handling - can be overridden by subclasses
    if (this.config.logErrors) {
      this.logWarning(`Using fallback for failed function: ${name}`);
    }

    return {
      success: false,
      message: 'Function call failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
      functionName: name,
      requestData: data
    };
  }

  /**
   * Update availability cache
   */
  private updateAvailabilityCache(available: boolean): void {
    this.availabilityChecked = true;
    this.isServiceAvailable = available;
    this.lastAvailabilityCheck = new Date();
  }

  /**
   * Log warning messages
   */
  private logWarning(message: string): void {
    if (this.config.logErrors) {
      console.warn(`[Firebase Functions Wrapper] ${message}`);
    }
  }

  /**
   * Log error messages
   */
  private logError(message: string, error?: any): void {
    if (this.config.logErrors) {
      console.error(`[Firebase Functions Wrapper] ${message}`, error);
    }
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance for global use
let functionsWrapperInstance: FirebaseFunctionsWrapperImpl | null = null;

/**
 * Get the global Firebase Functions wrapper instance
 */
export function getFirebaseFunctionsWrapper(config?: Partial<FunctionsWrapperConfig>): FirebaseFunctionsWrapperImpl {
  if (!functionsWrapperInstance) {
    functionsWrapperInstance = new FirebaseFunctionsWrapperImpl(config);
  }
  return functionsWrapperInstance;
}

/**
 * Create a new Firebase Functions wrapper instance with custom configuration
 */
export function createFirebaseFunctionsWrapper(config?: Partial<FunctionsWrapperConfig>): FirebaseFunctionsWrapperImpl {
  return new FirebaseFunctionsWrapperImpl(config);
}

// Export the implementation class for advanced usage
export { FirebaseFunctionsWrapperImpl };

// Types are already exported as interfaces above