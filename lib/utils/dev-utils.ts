/**
 * Development utilities index
 * Centralized exports for all development mode detection and safeguards
 */

// Import for internal use
import {
  DevModeDetector,
  isDevelopment,
  isProduction,
  shouldEnableHMRFixes,
  shouldEnableDebugLogging,
  runInDevelopment,
  runInProduction,
} from './dev-mode-detector';

import {
  DevSafeguards,
  createDevOnlyWrapper,
} from './dev-safeguards';

// Re-export development mode detection
export {
  DevModeDetector,
  isDevelopment,
  isProduction,
  shouldEnableHMRFixes,
  shouldEnableDebugLogging,
  runInDevelopment,
  runInProduction,
  type DevModeConfig,
  type DevModeFeatures,
} from './dev-mode-detector';

// Re-export development error logging
export {
  DevErrorLogger,
  logHMRError,
  logModuleDebug,
  logErrorRecovery,
  generateDebugReport,
  clearDevLogs,
  type HMRError,
  type ModuleLoadingDebugInfo,
  type DevErrorContext,
} from './dev-error-logger';

// Re-export development safeguards
export {
  DevSafeguards,
  validateProductionBuild,
  createDevOnlyWrapper,
  createProductionSafeWrapper,
  getProductionSafetyStatus,
  assertProductionSafety,
  type SafeguardCheck,
  type ProductionSafetyReport,
} from './dev-safeguards';

// Utility functions for common development patterns
export const withDevSafeguards = <T extends (...args: any[]) => any>(
  fn: T,
  options?: {
    fallback?: (...args: Parameters<T>) => ReturnType<T>;
    logErrors?: boolean;
  }
): T => {
  return createDevOnlyWrapper(fn, options?.fallback);
};

export const devOnly = <T>(callback: () => T): T | undefined => {
  return runInDevelopment(callback);
};

export const prodOnly = <T>(callback: () => T): T | undefined => {
  return runInProduction(callback);
};

// Development debugging helpers
export const debugLog = (...args: any[]): void => {
  devOnly(() => {
    if (shouldEnableDebugLogging()) {
      console.log('[DEV]', ...args);
    }
  });
};

export const debugWarn = (...args: any[]): void => {
  devOnly(() => {
    if (shouldEnableDebugLogging()) {
      console.warn('[DEV]', ...args);
    }
  });
};

export const debugError = (...args: any[]): void => {
  devOnly(() => {
    if (shouldEnableDebugLogging()) {
      console.error('[DEV]', ...args);
    }
  });
};

// HMR-specific utilities
export const isHMREnabled = (): boolean => {
  return isDevelopment() && typeof window !== 'undefined' && (window as any).module?.hot !== undefined;
};

export const onHMRUpdate = (callback: () => void): void => {
  if (isHMREnabled() && typeof window !== 'undefined') {
    const hot = (window as any).module.hot;
    if (hot) {
      hot.accept(callback);
    }
  }
};

// Environment information
export const getDevEnvironmentInfo = () => {
  return devOnly(() => ({
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    hmrEnabled: isHMREnabled(),
    debugLogging: shouldEnableDebugLogging(),
    hmrFixes: shouldEnableHMRFixes(),
    nodeEnv: process.env.NODE_ENV,
    buildId: typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.buildId : 'server',
  }));
};