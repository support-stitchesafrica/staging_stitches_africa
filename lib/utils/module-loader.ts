/**
 * Module Loading Wrapper with Retry Logic
 * 
 * Provides robust module loading capabilities with retry mechanisms
 * and caching to handle HMR-related module loading failures.
 */

interface ModuleLoadingState {
  isLoaded: boolean;
  isOptional: boolean;
  loadError: Error | null;
  retryCount: number;
  lastAttempt: Date;
  moduleKey: string;
  fallbackUsed?: boolean;
}

interface ModuleCache<T = any> {
  [key: string]: {
    module: T;
    timestamp: Date;
    loadState: ModuleLoadingState;
  };
}

interface ModuleLoader {
  loadModule<T>(moduleFactory: () => Promise<T>, moduleKey?: string): Promise<T>;
  loadOptionalModule<T>(moduleFactory: () => Promise<T>, moduleKey: string, fallback?: T): Promise<T | null>;
  retryModule<T>(moduleFactory: () => Promise<T>, maxRetries: number, moduleKey?: string): Promise<T>;
  isModuleAvailable(importPath: string): Promise<boolean>;
  getCachedModule<T>(moduleKey: string): T | null;
  clearModuleCache(): void;
  getModuleLoadingState(moduleKey: string): ModuleLoadingState | null;
}

class ModuleLoaderImpl implements ModuleLoader {
  private cache: ModuleCache = {};
  private loadingStates: Map<string, ModuleLoadingState> = new Map();
  private readonly maxRetries = 3;
  private readonly optionalMaxRetries = 2; // Reduced retries for optional modules
  private readonly baseDelay = 100; // Base delay in ms for exponential backoff
  private moduleAvailabilityCache: Map<string, boolean> = new Map();

  /**
   * Load a module with automatic retry and caching
   */
  async loadModule<T>(moduleFactory: () => Promise<T>, moduleKey?: string): Promise<T> {
    const key = moduleKey || this.generateModuleKey(moduleFactory);
    
    // Check cache first
    const cached = this.getCachedModule<T>(key);
    if (cached) {
      return cached;
    }

    return this.retryModule(moduleFactory, this.maxRetries, key);
  }

  /**
   * Load an optional module with reduced retry attempts and fallback support
   */
  async loadOptionalModule<T>(
    moduleFactory: () => Promise<T>, 
    moduleKey: string, 
    fallback?: T
  ): Promise<T | null> {
    // Check cache first
    const cached = this.getCachedModule<T>(moduleKey);
    if (cached) {
      return cached;
    }

    try {
      const module = await this.retryModule(
        moduleFactory, 
        this.optionalMaxRetries, 
        moduleKey,
        true // Mark as optional
      );
      return module;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[ModuleLoader] Optional module failed to load: ${moduleKey}`, error);
      }

      // Update loading state to indicate fallback was used
      this.updateLoadingState(moduleKey, {
        isLoaded: false,
        isOptional: true,
        loadError: error as Error,
        retryCount: this.optionalMaxRetries,
        lastAttempt: new Date(),
        moduleKey,
        fallbackUsed: fallback !== undefined
      });

      if (fallback !== undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ModuleLoader] Using fallback for optional module: ${moduleKey}`);
        }
        return fallback;
      }

      return null;
    }
  }

  /**
   * Check if a module is available without actually loading it
   * Note: Only supports predefined modules for Turbopack compatibility
   */
  async isModuleAvailable(importPath: string): Promise<boolean> {
    // Check cache first
    if (this.moduleAvailabilityCache.has(importPath)) {
      return this.moduleAvailabilityCache.get(importPath)!;
    }

    // Only support known modules to avoid dynamic import issues
    const supportedModules = [
      'react',
      'react-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/functions',
    ];

    const isSupported = supportedModules.includes(importPath);
    this.moduleAvailabilityCache.set(importPath, isSupported);
    
    if (!isSupported && process.env.NODE_ENV === 'development') {
      console.debug(`[ModuleLoader] Module not in supported list: ${importPath}`);
    }
    
    return isSupported;
  }

  /**
   * Retry module loading with exponential backoff
   */
  async retryModule<T>(
    moduleFactory: () => Promise<T>, 
    maxRetries: number, 
    moduleKey?: string,
    isOptional: boolean = false
  ): Promise<T> {
    const key = moduleKey || this.generateModuleKey(moduleFactory);
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.updateLoadingState(key, {
          isLoaded: false,
          isOptional,
          loadError: null,
          retryCount: attempt,
          lastAttempt: new Date(),
          moduleKey: key
        });

        const module = await moduleFactory();
        
        // Cache successful load
        this.cache[key] = {
          module,
          timestamp: new Date(),
          loadState: {
            isLoaded: true,
            isOptional,
            loadError: null,
            retryCount: attempt,
            lastAttempt: new Date(),
            moduleKey: key
          }
        };

        this.updateLoadingState(key, this.cache[key].loadState);
        
        if (process.env.NODE_ENV === 'development') {
          const moduleType = isOptional ? 'optional' : 'required';
          console.log(`[ModuleLoader] Successfully loaded ${moduleType} module: ${key} (attempt ${attempt + 1})`);
        }

        return module;
      } catch (error) {
        lastError = error as Error;
        
        this.updateLoadingState(key, {
          isLoaded: false,
          isOptional,
          loadError: lastError,
          retryCount: attempt,
          lastAttempt: new Date(),
          moduleKey: key
        });

        if (process.env.NODE_ENV === 'development') {
          const moduleType = isOptional ? 'optional' : 'required';
          console.warn(`[ModuleLoader] Failed to load ${moduleType} module: ${key} (attempt ${attempt + 1}/${maxRetries + 1})`, error);
        }

        // Don't wait after the last attempt
        if (attempt < maxRetries) {
          // Use shorter delays for optional modules
          const delay = isOptional ? 
            this.calculateBackoffDelay(attempt) / 2 : 
            this.calculateBackoffDelay(attempt);
          await this.delay(delay);
        }
      }
    }

    // All retries failed
    const moduleType = isOptional ? 'optional' : 'required';
    const finalError = new Error(
      `Failed to load ${moduleType} module after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`
    );
    
    if (process.env.NODE_ENV === 'development') {
      if (isOptional) {
        console.warn(`[ModuleLoader] Optional module loading failed: ${key}`, finalError);
      } else {
        console.error(`[ModuleLoader] Required module loading failed permanently: ${key}`, finalError);
      }
    }

    throw finalError;
  }

  /**
   * Get cached module if available
   */
  getCachedModule<T>(moduleKey: string): T | null {
    const cached = this.cache[moduleKey];
    if (cached && cached.loadState.isLoaded) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ModuleLoader] Retrieved cached module: ${moduleKey}`);
      }
      return cached.module as T;
    }
    return null;
  }

  /**
   * Clear all cached modules
   */
  clearModuleCache(): void {
    this.cache = {};
    this.loadingStates.clear();
    this.moduleAvailabilityCache.clear();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[ModuleLoader] Module cache cleared');
    }
  }

  /**
   * Get loading state for a specific module
   */
  getModuleLoadingState(moduleKey: string): ModuleLoadingState | null {
    return this.loadingStates.get(moduleKey) || null;
  }

  /**
   * Check if a module is currently being loaded
   */
  isModuleLoading(moduleKey: string): boolean {
    const state = this.getModuleLoadingState(moduleKey);
    return state ? !state.isLoaded && !state.loadError : false;
  }

  /**
   * Get all loading states for debugging
   */
  getAllLoadingStates(): Map<string, ModuleLoadingState> {
    return new Map(this.loadingStates);
  }

  /**
   * Get module availability status from cache
   */
  getModuleAvailabilityStatus(importPath: string): boolean | null {
    return this.moduleAvailabilityCache.get(importPath) || null;
  }

  /**
   * Clear module availability cache
   */
  clearAvailabilityCache(): void {
    this.moduleAvailabilityCache.clear();
    if (process.env.NODE_ENV === 'development') {
      console.log('[ModuleLoader] Module availability cache cleared');
    }
  }

  private updateLoadingState(key: string, state: ModuleLoadingState): void {
    this.loadingStates.set(key, state);
  }

  private generateModuleKey(moduleFactory: () => Promise<any>): string {
    // Generate a key based on the function string and timestamp
    const funcStr = moduleFactory.toString();
    const hash = this.simpleHash(funcStr);
    return `module_${hash}_${Date.now()}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^attempt with jitter
    const delay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * delay; // Add up to 10% jitter
    return Math.min(delay + jitter, 5000); // Cap at 5 seconds
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance for global use
const moduleLoader = new ModuleLoaderImpl();

export { moduleLoader, ModuleLoaderImpl };
export type { ModuleLoader, ModuleLoadingState };