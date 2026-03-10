/**
 * Module Loading Helper Functions
 *
 * Provides convenient wrapper functions for common module loading patterns
 * with built-in retry logic and error handling.
 */

import { moduleLoader } from './module-loader';

/**
 * Load a module with dynamic import and retry logic
 * Note: Only supports predefined modules for Turbopack compatibility
 */
export async function loadModuleWithRetry<T = any>(
  importPath: string,
  moduleKey?: string
): Promise<T> {
  const key = moduleKey || `import_${importPath.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Only support known modules to avoid dynamic import issues
  const supportedModules: Record<string, () => Promise<any>> = {
    'react': () => import('react'),
    'react-dom': () => import('react-dom'),
    'firebase/app': () => import('firebase/app'),
    'firebase/auth': () => import('firebase/auth'),
    'firebase/firestore': () => import('firebase/firestore'),
    'firebase/storage': () => import('firebase/storage'),
    'firebase/functions': () => import('firebase/functions'),
  };

  const importer = supportedModules[importPath];
  if (!importer) {
    throw new Error(`Unsupported module: ${importPath}. Only predefined modules are supported.`);
  }

  return moduleLoader.loadModule(importer, key);
}

/**
 * Load an optional module with reduced retry attempts and fallback support
 * Note: Only supports predefined modules for Turbopack compatibility
 */
export async function loadOptionalModule<T = any>(
  importPath: string,
  moduleKey?: string,
  fallback?: T
): Promise<T | null> {
  const key = moduleKey || `optional_${importPath.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Only support known modules to avoid dynamic import issues
  const supportedModules: Record<string, () => Promise<any>> = {
    'react': () => import('react'),
    'react-dom': () => import('react-dom'),
    'firebase/app': () => import('firebase/app'),
    'firebase/auth': () => import('firebase/auth'),
    'firebase/firestore': () => import('firebase/firestore'),
    'firebase/storage': () => import('firebase/storage'),
    'firebase/functions': () => import('firebase/functions'),
  };

  const importer = supportedModules[importPath];
  if (!importer) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[ModuleLoader] Unsupported optional module: ${importPath}, using fallback`);
    }
    return fallback || null;
  }

  return moduleLoader.loadOptionalModule(importer, key, fallback);
}

/**
 * Check if a module is available before attempting to load it
 */
export async function isModuleAvailable(importPath: string): Promise<boolean> {
  return moduleLoader.isModuleAvailable(importPath);
}

/**
 * Load a specific export from a module with retry logic
 * Note: Only supports predefined modules for Turbopack compatibility
 */
export async function loadModuleExport<T = any>(
  importPath: string,
  exportName: string,
  moduleKey?: string
): Promise<T> {
  const key = moduleKey || `export_${importPath.replace(/[^a-zA-Z0-9]/g, '_')}_${exportName}`;

  // Only support known modules to avoid dynamic import issues
  const supportedModules: Record<string, () => Promise<any>> = {
    'react': () => import('react'),
    'react-dom': () => import('react-dom'),
    'firebase/app': () => import('firebase/app'),
    'firebase/auth': () => import('firebase/auth'),
    'firebase/firestore': () => import('firebase/firestore'),
    'firebase/storage': () => import('firebase/storage'),
    'firebase/functions': () => import('firebase/functions'),
  };

  const importer = supportedModules[importPath];
  if (!importer) {
    throw new Error(`Unsupported module: ${importPath}. Only predefined modules are supported.`);
  }

  const module = await moduleLoader.loadModule(importer, key);

  if (!(exportName in module)) {
    throw new Error(`Export '${exportName}' not found in module '${importPath}'`);
  }

  return module[exportName];
}

/**
 * Load Firebase modules with specific error handling
 * Firebase Functions is treated as optional and uses different loading strategy
 */
export async function loadFirebaseModule<T = any>(
  importPath: string,
  moduleKey?: string
): Promise<T> {
  const key = moduleKey || `firebase_${importPath.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Firebase Functions is handled as optional service - use loadOptionalFirebaseModule instead
  if (importPath === 'firebase/functions') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Firebase Module] firebase/functions should be loaded using loadOptionalFirebaseModule for better error handling`);
    }
    // Delegate to optional loading with null fallback
    return loadOptionalFirebaseModule<T>(importPath, moduleKey) as Promise<T>;
  }

  // Handle known core Firebase modules explicitly to avoid dynamic import resolution issues
  const coreFirebaseImports: Record<string, () => Promise<any>> = {
    'firebase/app': () => import('firebase/app'),
    'firebase/auth': () => import('firebase/auth'),
    'firebase/firestore': () => import('firebase/firestore'),
    'firebase/storage': () => import('firebase/storage'),
  };

  const importer = coreFirebaseImports[importPath];
  if (!importer) {
    throw new Error(`Unsupported Firebase module: ${importPath}. Only core Firebase modules are supported.`);
  }

  return moduleLoader.retryModule(
    async () => {
      try {
        return await importer();
      } catch (error: any) {
        if (error?.message?.includes('module factory is not available')) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[Firebase Module] Factory not available for ${importPath}, retrying...`);
          }
          throw new Error(`Firebase module factory not available: ${importPath}`);
        }
        throw error;
      }
    },
    5, // Increased retries for core Firebase modules
    key
  );
}

/**
 * Load optional Firebase modules with reduced retry attempts and fallback support
 * Includes specific handling for Firebase Functions loading issues
 */
export async function loadOptionalFirebaseModule<T = any>(
  importPath: string,
  moduleKey?: string,
  fallback?: T
): Promise<T | null> {
  const key = moduleKey || `firebase_optional_${importPath.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Handle known Firebase modules explicitly with alternative import strategies
  const firebaseImports: Record<string, () => Promise<any>> = {
    'firebase/app': () => import('firebase/app'),
    'firebase/auth': () => import('firebase/auth'),
    'firebase/firestore': () => import('firebase/firestore'),
    'firebase/storage': () => import('firebase/storage'),
    'firebase/functions': () => import('firebase/functions'),
  };

  const importer = firebaseImports[importPath];
  if (!importer) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Firebase Optional Module] Unsupported module: ${importPath}, using fallback`);
    }
    return fallback || null;
  }

  return moduleLoader.loadOptionalModule(
    async () => {
      try {
        return await importer();
      } catch (error: any) {
        // Enhanced error handling for Firebase Functions specifically
        if (importPath === 'firebase/functions') {
          if (error?.message?.includes('module factory is not available')) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[Firebase Functions] Module factory not available - this is common in development with HMR. Functions service will be unavailable.`);
            }
            throw new Error(`Firebase Functions module factory not available (HMR conflict)`);
          }
          
          if (error?.message?.includes('Cannot resolve module')) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[Firebase Functions] Module resolution failed - Functions service may not be properly installed or configured.`);
            }
            throw new Error(`Firebase Functions module resolution failed`);
          }

          if (error?.code === 'MODULE_NOT_FOUND' || error?.message?.includes('Module not found')) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[Firebase Functions] Module not found - Functions service is not available in this environment.`);
            }
            throw new Error(`Firebase Functions module not found`);
          }

          // Alternative import strategy for Functions - try different import approach
          try {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Firebase Functions] Attempting alternative import strategy...`);
            }
            // Try alternative dynamic import with different syntax
            const alternativeModule = await import('firebase/functions');
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Firebase Functions] Alternative import strategy succeeded`);
            }
            return alternativeModule;
          } catch (altError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[Firebase Functions] Alternative import strategy also failed:`, altError);
            }
            throw new Error(`Firebase Functions failed both primary and alternative import strategies: ${error.message}`);
          }
        }

        // Generic Firebase module error handling
        if (error?.message?.includes('module factory is not available')) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[Firebase Optional Module] Factory not available for ${importPath}, will use fallback if provided`);
          }
          throw new Error(`Firebase optional module factory not available: ${importPath}`);
        }
        
        throw error;
      }
    },
    key,
    fallback
  );
}

/**
 * Load Firebase Functions with enhanced error handling and fallback strategies
 * This function specifically handles the common issues with Firebase Functions loading
 */
export async function loadFirebaseFunctions<T = any>(
  moduleKey?: string,
  fallback?: T
): Promise<T | null> {
  const key = moduleKey || 'firebase_functions_enhanced';
  
  // First check if the module is available
  const isAvailable = await isFirebaseModuleAvailable('firebase/functions');
  if (!isAvailable) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Firebase Functions] Module not available, skipping initialization`);
    }
    return fallback || null;
  }

  try {
    return await loadOptionalFirebaseModule<T>('firebase/functions', key, fallback);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Firebase Functions] Enhanced loading failed, Functions service will be unavailable:`, error);
    }
    return fallback || null;
  }
}

/**
 * Check if Firebase Functions is available and can be loaded
 * Provides specific diagnostics for Functions module availability
 */
export async function isFirebaseFunctionsAvailable(): Promise<{
  available: boolean;
  reason?: string;
}> {
  try {
    const isAvailable = await moduleLoader.isModuleAvailable('firebase/functions');
    
    if (!isAvailable) {
      return {
        available: false,
        reason: 'Firebase Functions module not found or not installed'
      };
    }

    // Try a lightweight import to check for factory availability
    try {
      await import('firebase/functions');
      return { available: true };
    } catch (error: any) {
      if (error?.message?.includes('module factory is not available')) {
        return {
          available: false,
          reason: 'Firebase Functions module factory not available (likely HMR conflict)'
        };
      }
      
      return {
        available: false,
        reason: `Firebase Functions import failed: ${error.message}`
      };
    }
  } catch (error) {
    return {
      available: false,
      reason: `Firebase Functions availability check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Check if a Firebase module is available before attempting to load it
 */
export async function isFirebaseModuleAvailable(importPath: string): Promise<boolean> {
  return moduleLoader.isModuleAvailable(importPath);
}

/**
 * Load React runtime modules with specific error handling
 */
export async function loadReactModule<T = any>(
  importPath: string,
  moduleKey?: string
): Promise<T> {
  const key = moduleKey || `react_${importPath.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Handle known React runtime modules safely with static imports only
  let importer: () => Promise<any>;
  
  switch (importPath) {
    case 'react':
      importer = () => import('react');
      break;
    case 'react-dom':
      importer = () => import('react-dom');
      break;
    default:
      throw new Error(`Unsupported React module: ${importPath}. Only 'react' and 'react-dom' are supported.`);
  }

  return moduleLoader.retryModule(
    async () => {
      try {
        return await importer();
      } catch (error: any) {
        if (
          error?.message?.includes('module factory is not available') ||
          error?.message?.includes('React runtime')
        ) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[React Module] Runtime error for ${importPath}, retrying...`);
          }
          throw new Error(`React module runtime error: ${importPath}`);
        }
        throw error;
      }
    },
    4,
    key
  );
}

/**
 * Preload critical modules to avoid loading delays
 * Firebase Functions is excluded as it's now optional
 */
export async function preloadCriticalModules(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return; // Only preload in development
  }

  const criticalModules = [
    'react',
    'react-dom',
    'firebase/app',
    'firebase/auth',
    'firebase/firestore',
    'firebase/storage', // Added storage as it's a core service
  ];

  const preloadPromises = criticalModules.map(async (modulePath) => {
    try {
      if (modulePath.startsWith('firebase/')) {
        await loadFirebaseModule(modulePath, `preload_${modulePath}`);
      } else {
        await loadModuleWithRetry(modulePath, `preload_${modulePath}`);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`[ModuleLoader] Preloaded: ${modulePath}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[ModuleLoader] Failed to preload: ${modulePath}`, error);
      }
    }
  });

  await Promise.allSettled(preloadPromises);
}

/**
 * Create a module loading wrapper for a specific component
 * Note: Only supports predefined modules for Turbopack compatibility
 */
export function createModuleWrapper<T>(
  importPath: string,
  fallback?: T
): () => Promise<T> {
  return async () => {
    try {
      return await loadModuleWithRetry<T>(importPath);
    } catch (error) {
      if (fallback !== undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[ModuleLoader] Using fallback for ${importPath}:`, error);
        }
        return fallback;
      }
      throw error;
    }
  };
}

/**
 * Create an optional module loading wrapper with built-in fallback support
 */
export function createOptionalModuleWrapper<T>(
  importPath: string,
  fallback?: T,
  moduleKey?: string
): () => Promise<T | null> {
  return async () => {
    return loadOptionalModule<T>(importPath, moduleKey, fallback);
  };
}

/**
 * Clear module cache and reload critical modules
 */
export async function refreshModuleCache(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[ModuleLoader] Refreshing module cache...');
  }

  moduleLoader.clearModuleCache();
  await preloadCriticalModules();

  if (process.env.NODE_ENV === 'development') {
    console.log('[ModuleLoader] Module cache refreshed');
  }
}

/**
 * Get module loading diagnostics for debugging
 * Includes specific information about Firebase Functions status
 */
export function getModuleDiagnostics() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const states = moduleLoader.getAllLoadingStates();
  const diagnostics = {
    totalModules: states.size,
    loadedModules: 0,
    failedModules: 0,
    loadingModules: 0,
    optionalModules: 0,
    optionalFailedModules: 0,
    fallbackUsedModules: 0,
    firebaseFunctionsStatus: 'unknown' as 'loaded' | 'failed' | 'optional-failed' | 'unknown',
    modules: Array.from(states.entries()).map(([key, state]) => ({
      key,
      ...state,
    })),
  };

  states.forEach((state) => {
    // Check for Firebase Functions specific status
    if (state.moduleKey.includes('firebase_functions') || state.moduleKey.includes('firebase/functions')) {
      if (state.isLoaded) {
        diagnostics.firebaseFunctionsStatus = 'loaded';
      } else if (state.isOptional && state.loadError) {
        diagnostics.firebaseFunctionsStatus = 'optional-failed';
      } else if (state.loadError) {
        diagnostics.firebaseFunctionsStatus = 'failed';
      }
    }

    if (state.isOptional) {
      diagnostics.optionalModules++;
      if (state.loadError) {
        diagnostics.optionalFailedModules++;
      }
      if (state.fallbackUsed) {
        diagnostics.fallbackUsedModules++;
      }
    }
    
    if (state.isLoaded) {
      diagnostics.loadedModules++;
    } else if (state.loadError) {
      diagnostics.failedModules++;
    } else {
      diagnostics.loadingModules++;
    }
  });

  return diagnostics;
}

/**
 * Get module availability diagnostics
 */
export function getModuleAvailabilityDiagnostics() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Access the availability cache through the module loader instance
  const availabilityStates = new Map<string, boolean>();
  
  // This is a simplified version - in a real implementation, you might want to expose
  // the availability cache through a public method
  return {
    checkedModules: availabilityStates.size,
    availableModules: Array.from(availabilityStates.values()).filter(Boolean).length,
    unavailableModules: Array.from(availabilityStates.values()).filter(v => !v).length,
    modules: Array.from(availabilityStates.entries()).map(([path, available]) => ({
      path,
      available
    }))
  };
}
