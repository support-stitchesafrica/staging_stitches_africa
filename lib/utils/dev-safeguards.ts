/**
 * Development safeguards utility
 * Ensures production builds remain unaffected by development-specific code
 */

import { DevModeDetector } from './dev-mode-detector';

export interface SafeguardCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ProductionSafetyReport {
  isProductionSafe: boolean;
  checks: SafeguardCheck[];
  recommendations: string[];
  buildValidation: {
    hasDevCode: boolean;
    hasDebugCode: boolean;
    hasHMRCode: boolean;
    hasTestCode: boolean;
  };
}

class DevSafeguardsService {
  /**
   * Validate that production builds don't include development features
   */
  validateProductionBuild(): ProductionSafetyReport {
    const checks: SafeguardCheck[] = [];
    const config = DevModeDetector.getConfig();
    const features = DevModeDetector.getFeatures();

    // Environment checks
    checks.push({
      name: 'Environment Detection',
      passed: config.isProduction ? !config.isDevelopment : true,
      message: config.isProduction 
        ? 'Production environment correctly detected'
        : 'Development environment detected',
      severity: config.isProduction && config.isDevelopment ? 'error' : 'info',
    });

    // Development feature checks
    checks.push({
      name: 'HMR Fixes Disabled',
      passed: config.isProduction ? !config.enableHMRFixes : true,
      message: config.enableHMRFixes 
        ? 'HMR fixes are enabled (should be disabled in production)'
        : 'HMR fixes are disabled',
      severity: config.isProduction && config.enableHMRFixes ? 'error' : 'info',
    });

    checks.push({
      name: 'Debug Logging Disabled',
      passed: config.isProduction ? !config.enableDebugLogging : true,
      message: config.enableDebugLogging 
        ? 'Debug logging is enabled (should be disabled in production)'
        : 'Debug logging is disabled',
      severity: config.isProduction && config.enableDebugLogging ? 'error' : 'info',
    });

    checks.push({
      name: 'Error Recovery Disabled',
      passed: config.isProduction ? !config.enableErrorRecovery : true,
      message: config.enableErrorRecovery 
        ? 'Error recovery is enabled (should be disabled in production)'
        : 'Error recovery is disabled',
      severity: config.isProduction && config.enableErrorRecovery ? 'error' : 'info',
    });

    // Runtime checks
    if (typeof window !== 'undefined') {
      checks.push({
        name: 'HMR Runtime Disabled',
        passed: !(window as any).module?.hot,
        message: (window as any).module?.hot 
          ? 'HMR runtime detected in browser (should not be present in production)'
          : 'HMR runtime not detected',
        severity: (window as any).module?.hot ? 'error' : 'info',
      });

      checks.push({
        name: 'Development Build ID',
        passed: (window as any).__NEXT_DATA__?.buildId !== 'development',
        message: (window as any).__NEXT_DATA__?.buildId === 'development'
          ? 'Development build ID detected (should not be present in production)'
          : 'Production build ID detected',
        severity: (window as any).__NEXT_DATA__?.buildId === 'development' ? 'error' : 'info',
      });
    }

    // Feature-specific checks
    Object.entries(features).forEach(([featureName, enabled]) => {
      checks.push({
        name: `Feature: ${featureName}`,
        passed: config.isProduction ? !enabled : true,
        message: enabled 
          ? `${featureName} is enabled ${config.isProduction ? '(should be disabled in production)' : ''}`
          : `${featureName} is disabled`,
        severity: config.isProduction && enabled ? 'warning' : 'info',
      });
    });

    // Build validation
    const buildValidation = {
      hasDevCode: this.hasDevCode(),
      hasDebugCode: this.hasDebugCode(),
      hasHMRCode: this.hasHMRCode(),
      hasTestCode: this.hasTestCode(),
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(checks, buildValidation);

    return {
      isProductionSafe: checks.every(check => check.passed || check.severity !== 'error'),
      checks,
      recommendations,
      buildValidation,
    };
  }

  /**
   * Check if development code is present in the build
   */
  private hasDevCode(): boolean {
    // Check for common development patterns
    const devPatterns = [
      'console.log',
      'console.debug',
      'debugger',
      '__DEV__',
      'process.env.NODE_ENV === "development"',
    ];

    // In a real implementation, this would scan the built code
    // For now, we check runtime indicators
    return DevModeDetector.isDevelopment();
  }

  /**
   * Check if debug code is present in the build
   */
  private hasDebugCode(): boolean {
    return DevModeDetector.shouldEnableDebugLogging();
  }

  /**
   * Check if HMR code is present in the build
   */
  private hasHMRCode(): boolean {
    return typeof window !== 'undefined' && (window as any).module?.hot !== undefined;
  }

  /**
   * Check if test code is present in the build
   */
  private hasTestCode(): boolean {
    return DevModeDetector.isTest();
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(checks: SafeguardCheck[], buildValidation: any): string[] {
    const recommendations: string[] = [];

    const errorChecks = checks.filter(check => !check.passed && check.severity === 'error');
    const warningChecks = checks.filter(check => !check.passed && check.severity === 'warning');

    if (errorChecks.length > 0) {
      recommendations.push('Critical: Production build contains development code that must be removed');
      recommendations.push('Run "npm run build" to create a proper production build');
    }

    if (warningChecks.length > 0) {
      recommendations.push('Warning: Some development features are still enabled');
      recommendations.push('Verify that NODE_ENV is set to "production" during build');
    }

    if (buildValidation.hasDevCode) {
      recommendations.push('Remove console.log and debug statements from production code');
    }

    if (buildValidation.hasHMRCode) {
      recommendations.push('Ensure HMR is disabled in production builds');
    }

    if (buildValidation.hasTestCode) {
      recommendations.push('Test code detected - ensure test files are excluded from production build');
    }

    return recommendations;
  }

  /**
   * Create a development-only wrapper function
   */
  createDevOnlyWrapper<T extends (...args: any[]) => any>(
    fn: T,
    fallback?: (...args: Parameters<T>) => ReturnType<T>
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      if (DevModeDetector.isDevelopment()) {
        try {
          return fn(...args);
        } catch (error) {
          console.warn('Development-only function failed:', error);
          return fallback ? fallback(...args) : undefined as ReturnType<T>;
        }
      }
      return fallback ? fallback(...args) : undefined as ReturnType<T>;
    }) as T;
  }

  /**
   * Create a production-safe conditional execution wrapper
   */
  createProductionSafeWrapper<T>(
    devCallback: () => T,
    prodCallback?: () => T
  ): () => T | undefined {
    return () => {
      if (DevModeDetector.isProduction()) {
        return prodCallback ? prodCallback() : undefined;
      } else if (DevModeDetector.isDevelopment()) {
        try {
          return devCallback();
        } catch (error) {
          console.warn('Development callback failed:', error);
          return undefined;
        }
      }
      return undefined;
    };
  }

  /**
   * Validate environment variables for production safety
   */
  validateEnvironmentVariables(): SafeguardCheck[] {
    const checks: SafeguardCheck[] = [];

    // Check NODE_ENV
    checks.push({
      name: 'NODE_ENV',
      passed: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development',
      message: `NODE_ENV is set to: ${process.env.NODE_ENV}`,
      severity: !process.env.NODE_ENV ? 'warning' : 'info',
    });

    // Check for development-specific environment variables
    const devEnvVars = ['WEBPACK_MODE', 'HMR_ENABLED'];
    devEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      checks.push({
        name: `${envVar}`,
        passed: !value || value !== 'development',
        message: value ? `${envVar} is set to: ${value}` : `${envVar} is not set`,
        severity: value === 'development' ? 'warning' : 'info',
      });
    });

    return checks;
  }

  /**
   * Get production safety status
   */
  getProductionSafetyStatus(): {
    isSafe: boolean;
    issues: string[];
    warnings: string[];
  } {
    const report = this.validateProductionBuild();
    const envChecks = this.validateEnvironmentVariables();
    
    const allChecks = [...report.checks, ...envChecks];
    const errors = allChecks.filter(check => !check.passed && check.severity === 'error');
    const warnings = allChecks.filter(check => !check.passed && check.severity === 'warning');

    return {
      isSafe: errors.length === 0,
      issues: errors.map(check => check.message),
      warnings: warnings.map(check => check.message),
    };
  }

  /**
   * Assert production safety (throws in development if issues found)
   */
  assertProductionSafety(): void {
    if (!DevModeDetector.isDevelopment()) {
      return; // Only run assertions in development
    }

    const status = this.getProductionSafetyStatus();
    
    if (!status.isSafe) {
      console.error('Production Safety Issues Detected:', status.issues);
      console.warn('Production Safety Warnings:', status.warnings);
      
      // In development, we can throw to alert developers
      throw new Error(`Production safety validation failed: ${status.issues.join(', ')}`);
    }

    if (status.warnings.length > 0) {
      console.warn('Production Safety Warnings:', status.warnings);
    }
  }
}

// Export singleton instance
export const DevSafeguards = new DevSafeguardsService();

// Export utility functions
export const validateProductionBuild = () => DevSafeguards.validateProductionBuild();
export const createDevOnlyWrapper = <T extends (...args: any[]) => any>(
  fn: T,
  fallback?: (...args: Parameters<T>) => ReturnType<T>
) => DevSafeguards.createDevOnlyWrapper(fn, fallback);
export const createProductionSafeWrapper = <T>(
  devCallback: () => T,
  prodCallback?: () => T
) => DevSafeguards.createProductionSafeWrapper(devCallback, prodCallback);
export const getProductionSafetyStatus = () => DevSafeguards.getProductionSafetyStatus();
export const assertProductionSafety = () => DevSafeguards.assertProductionSafety();