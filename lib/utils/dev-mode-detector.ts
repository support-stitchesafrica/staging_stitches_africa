/**
 * Development mode detection and safeguards utility
 * Ensures HMR fixes and debugging tools only apply in development mode
 */

export interface DevModeConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  enableHMRFixes: boolean;
  enableDebugLogging: boolean;
  enableErrorRecovery: boolean;
}

export interface DevModeFeatures {
  hmrErrorBoundary: boolean;
  moduleLoadingWrapper: boolean;
  developmentErrorUI: boolean;
  debugConsoleLogging: boolean;
  moduleRetryLogic: boolean;
  errorRecoveryMechanisms: boolean;
}

class DevModeDetectorService {
  private config: DevModeConfig;
  private features: DevModeFeatures;

  constructor() {
    this.config = this.detectEnvironment();
    this.features = this.determineFeatures();
  }

  /**
   * Detect the current environment and create configuration
   */
  private detectEnvironment(): DevModeConfig {
    // Primary environment detection
    const nodeEnv = process.env.NODE_ENV;
    const isDevelopment = nodeEnv === 'development';
    const isProduction = nodeEnv === 'production';
    const isTest = nodeEnv === 'test';

    // Additional development indicators
    const hasDevServer = typeof window !== 'undefined' && 
      (window as any).__NEXT_DATA__?.buildId === 'development';
    
    const hasHMR = typeof window !== 'undefined' && 
      (window as any).module?.hot !== undefined;

    // Webpack mode detection (fallback for Turbopack)
    const isWebpackDev = process.env.WEBPACK_MODE === 'development';
    const hasHMREnabled = process.env.HMR_ENABLED === 'true';

    // Final development determination with safeguards
    const finalIsDevelopment = isDevelopment || hasDevServer || hasHMR || isWebpackDev;
    
    return {
      isDevelopment: finalIsDevelopment,
      isProduction: isProduction && !finalIsDevelopment, // Ensure production is exclusive
      isTest,
      enableHMRFixes: finalIsDevelopment && !isTest,
      enableDebugLogging: finalIsDevelopment && !isTest,
      enableErrorRecovery: finalIsDevelopment && !isTest,
    };
  }

  /**
   * Determine which development features should be enabled
   */
  private determineFeatures(): DevModeFeatures {
    return {
      hmrErrorBoundary: this.config.enableHMRFixes,
      moduleLoadingWrapper: this.config.enableHMRFixes,
      developmentErrorUI: this.config.enableErrorRecovery,
      debugConsoleLogging: this.config.enableDebugLogging,
      moduleRetryLogic: this.config.enableHMRFixes,
      errorRecoveryMechanisms: this.config.enableErrorRecovery,
    };
  }

  /**
   * Get current environment configuration
   */
  getConfig(): DevModeConfig {
    return { ...this.config };
  }

  /**
   * Get enabled development features
   */
  getFeatures(): DevModeFeatures {
    return { ...this.features };
  }

  /**
   * Check if we're in development mode
   */
  isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  /**
   * Check if we're in production mode
   */
  isProduction(): boolean {
    return this.config.isProduction;
  }

  /**
   * Check if we're in test mode
   */
  isTest(): boolean {
    return this.config.isTest;
  }

  /**
   * Check if HMR fixes should be enabled
   */
  shouldEnableHMRFixes(): boolean {
    return this.config.enableHMRFixes;
  }

  /**
   * Check if debug logging should be enabled
   */
  shouldEnableDebugLogging(): boolean {
    return this.config.enableDebugLogging;
  }

  /**
   * Check if error recovery mechanisms should be enabled
   */
  shouldEnableErrorRecovery(): boolean {
    return this.config.enableErrorRecovery;
  }

  /**
   * Check if a specific development feature should be enabled
   */
  isFeatureEnabled(feature: keyof DevModeFeatures): boolean {
    return this.features[feature];
  }

  /**
   * Safely execute development-only code
   */
  runInDevelopment<T>(callback: () => T): T | undefined {
    if (this.config.isDevelopment) {
      try {
        return callback();
      } catch (error) {
        if (this.config.enableDebugLogging) {
          console.warn('Development-only code failed:', error);
        }
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Safely execute production-only code
   */
  runInProduction<T>(callback: () => T): T | undefined {
    if (this.config.isProduction) {
      try {
        return callback();
      } catch (error) {
        // Silent fail in production, but still return undefined
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Get environment-specific configuration for external services
   */
  getEnvironmentConfig() {
    return {
      logLevel: this.config.isDevelopment ? 'debug' : 'error',
      enableSourceMaps: this.config.isDevelopment,
      enablePerformanceMonitoring: this.config.isProduction,
      enableErrorReporting: this.config.isProduction,
      enableHMRDebugging: this.config.enableHMRFixes,
      enableModuleLogging: this.config.enableDebugLogging,
    };
  }

  /**
   * Validate that production builds don't include development features
   */
  validateProductionBuild(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.config.isProduction) {
      // Check that development features are disabled in production
      if (this.config.enableHMRFixes) {
        issues.push('HMR fixes are enabled in production build');
      }
      if (this.config.enableDebugLogging) {
        issues.push('Debug logging is enabled in production build');
      }
      if (this.config.enableErrorRecovery) {
        issues.push('Development error recovery is enabled in production build');
      }

      // Check for development-specific globals
      if (typeof window !== 'undefined') {
        if ((window as any).module?.hot) {
          issues.push('HMR module detected in production build');
        }
        if ((window as any).__NEXT_DATA__?.buildId === 'development') {
          issues.push('Development build ID detected in production');
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get debugging information about the current environment
   */
  getDebugInfo() {
    return {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        WEBPACK_MODE: process.env.WEBPACK_MODE,
        HMR_ENABLED: process.env.HMR_ENABLED,
      },
      config: this.config,
      features: this.features,
      runtime: {
        hasWindow: typeof window !== 'undefined',
        hasHMR: typeof window !== 'undefined' && (window as any).module?.hot !== undefined,
        buildId: typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.buildId : 'server',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      },
      validation: this.validateProductionBuild(),
    };
  }
}

// Export singleton instance
export const DevModeDetector = new DevModeDetectorService();

// Export utility functions for common use cases
export const isDevelopment = () => DevModeDetector.isDevelopment();
export const isProduction = () => DevModeDetector.isProduction();
export const shouldEnableHMRFixes = () => DevModeDetector.shouldEnableHMRFixes();
export const shouldEnableDebugLogging = () => DevModeDetector.shouldEnableDebugLogging();
export const runInDevelopment = <T>(callback: () => T) => DevModeDetector.runInDevelopment(callback);
export const runInProduction = <T>(callback: () => T) => DevModeDetector.runInProduction(callback);