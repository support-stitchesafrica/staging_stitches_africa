/**
 * Development-specific error logging and debugging tools
 * Only active in development mode with comprehensive HMR error tracking
 */

import { DevModeDetector } from './dev-mode-detector';
import { ErrorLogger } from './error-logger';

export interface HMRError {
  type: 'module-factory-deleted' | 'import-failure' | 'hmr-update-failed' | 'module-not-found';
  modulePath: string;
  errorMessage: string;
  timestamp: Date;
  canRetry: boolean;
  stackTrace?: string;
  hmrUpdateId?: string;
  affectedModules?: string[];
}

export interface ModuleLoadingDebugInfo {
  moduleKey: string;
  loadAttempts: number;
  lastError?: Error;
  loadTime?: number;
  cacheHit: boolean;
  hmrCycles: number;
  dependencies?: string[];
}

export interface DevErrorContext {
  hmrEnabled: boolean;
  turbopackActive: boolean;
  webpackFallback: boolean;
  moduleCache: Record<string, any>;
  errorRecoveryAttempts: number;
  lastHMRUpdate?: Date;
}

class DevErrorLoggerService {
  private hmrErrors: HMRError[] = [];
  private moduleDebugInfo: Map<string, ModuleLoadingDebugInfo> = new Map();
  private devContext: DevErrorContext;
  private maxHMRErrors = 50;
  private debugConsole: boolean;

  constructor() {
    this.devContext = this.initializeDevContext();
    this.debugConsole = DevModeDetector.shouldEnableDebugLogging();
    
    // Only initialize HMR tracking in development
    if (DevModeDetector.shouldEnableHMRFixes()) {
      this.initializeHMRTracking();
    }
  }

  /**
   * Initialize development context
   */
  private initializeDevContext(): DevErrorContext {
    return {
      hmrEnabled: typeof window !== 'undefined' && (window as any).module?.hot !== undefined,
      turbopackActive: process.env.WEBPACK_MODE !== 'development',
      webpackFallback: process.env.WEBPACK_MODE === 'development',
      moduleCache: {},
      errorRecoveryAttempts: 0,
      lastHMRUpdate: undefined,
    };
  }

  /**
   * Initialize HMR error tracking (development only)
   */
  private initializeHMRTracking(): void {
    if (typeof window === 'undefined') return;

    // Track HMR updates
    if ((window as any).module?.hot) {
      const hot = (window as any).module.hot;
      
      hot.addStatusHandler((status: string) => {
        this.devContext.lastHMRUpdate = new Date();
        
        if (this.debugConsole) {
          console.log(`[HMR] Status: ${status}`, {
            timestamp: this.devContext.lastHMRUpdate,
            context: this.devContext,
          });
        }
      });

      // Track module updates
      hot.accept((err: Error) => {
        if (err) {
          this.logHMRError({
            type: 'hmr-update-failed',
            modulePath: 'unknown',
            errorMessage: err.message,
            timestamp: new Date(),
            canRetry: true,
            stackTrace: err.stack,
          });
        }
      });
    }

    // Track unhandled promise rejections (common with module loading)
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      if (this.isModuleLoadingError(error)) {
        this.logHMRError({
          type: 'module-not-found',
          modulePath: this.extractModulePath(error),
          errorMessage: error.message || 'Module loading failed',
          timestamp: new Date(),
          canRetry: true,
          stackTrace: error.stack,
        });
      }
    });
  }

  /**
   * Log HMR-specific errors (development only)
   */
  logHMRError(error: HMRError): string | undefined {
    if (!DevModeDetector.shouldEnableHMRFixes()) {
      return undefined;
    }

    // Add to HMR error log
    this.hmrErrors.push(error);
    
    // Keep only recent errors
    if (this.hmrErrors.length > this.maxHMRErrors) {
      this.hmrErrors = this.hmrErrors.slice(-this.maxHMRErrors);
    }

    // Log to console in development
    if (this.debugConsole) {
      console.group(`[HMR Error] ${error.type}`);
      console.error('Module:', error.modulePath);
      console.error('Message:', error.errorMessage);
      console.error('Can Retry:', error.canRetry);
      console.error('Timestamp:', error.timestamp);
      if (error.stackTrace) {
        console.error('Stack:', error.stackTrace);
      }
      if (error.affectedModules) {
        console.error('Affected Modules:', error.affectedModules);
      }
      console.groupEnd();
    }

    // Also log to main error logger for consistency
    const errorId = ErrorLogger.logError(
      new Error(`HMR Error: ${error.errorMessage}`),
      {
        hmrError: error,
        devContext: this.devContext,
      },
      'error',
      'HMR'
    );

    return errorId;
  }

  /**
   * Log module loading debug information (development only)
   */
  logModuleDebug(moduleKey: string, debugInfo: Partial<ModuleLoadingDebugInfo>): void {
    if (!DevModeDetector.shouldEnableDebugLogging()) {
      return;
    }

    const existing = this.moduleDebugInfo.get(moduleKey) || {
      moduleKey,
      loadAttempts: 0,
      cacheHit: false,
      hmrCycles: 0,
    };

    const updated: ModuleLoadingDebugInfo = {
      ...existing,
      ...debugInfo,
      loadAttempts: debugInfo.loadAttempts ?? existing.loadAttempts + 1,
    };

    this.moduleDebugInfo.set(moduleKey, updated);

    if (this.debugConsole) {
      console.log(`[Module Debug] ${moduleKey}`, updated);
    }
  }

  /**
   * Log error recovery attempt (development only)
   */
  logErrorRecovery(action: string, success: boolean, details?: any): void {
    if (!DevModeDetector.shouldEnableErrorRecovery()) {
      return;
    }

    this.devContext.errorRecoveryAttempts++;

    if (this.debugConsole) {
      console.log(`[Error Recovery] ${action}`, {
        success,
        attempt: this.devContext.errorRecoveryAttempts,
        details,
        timestamp: new Date(),
      });
    }

    // Log to main error logger
    ErrorLogger.logErrorAction(
      'dev-error-recovery',
      action,
      {
        success,
        attempt: this.devContext.errorRecoveryAttempts,
        details,
      }
    );
  }

  /**
   * Get HMR error history (development only)
   */
  getHMRErrors(): HMRError[] {
    if (!DevModeDetector.shouldEnableHMRFixes()) {
      return [];
    }
    return [...this.hmrErrors];
  }

  /**
   * Get module debug information (development only)
   */
  getModuleDebugInfo(): ModuleLoadingDebugInfo[] {
    if (!DevModeDetector.shouldEnableDebugLogging()) {
      return [];
    }
    return Array.from(this.moduleDebugInfo.values());
  }

  /**
   * Get development context information
   */
  getDevContext(): DevErrorContext {
    return { ...this.devContext };
  }

  /**
   * Clear all development logs
   */
  clearDevLogs(): void {
    if (!DevModeDetector.isDevelopment()) {
      return;
    }

    this.hmrErrors = [];
    this.moduleDebugInfo.clear();
    this.devContext.errorRecoveryAttempts = 0;

    if (this.debugConsole) {
      console.log('[Dev Logger] Logs cleared');
    }
  }

  /**
   * Generate development debugging report
   */
  generateDebugReport(): any {
    if (!DevModeDetector.isDevelopment()) {
      return { error: 'Debug reports only available in development mode' };
    }

    return {
      environment: DevModeDetector.getDebugInfo(),
      hmrErrors: this.getHMRErrors(),
      moduleDebugInfo: this.getModuleDebugInfo(),
      devContext: this.getDevContext(),
      errorSummary: {
        totalHMRErrors: this.hmrErrors.length,
        totalModulesTracked: this.moduleDebugInfo.size,
        errorRecoveryAttempts: this.devContext.errorRecoveryAttempts,
        lastHMRUpdate: this.devContext.lastHMRUpdate,
      },
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Generate recommendations based on error patterns
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.hmrErrors.length > 10) {
      recommendations.push('Consider switching to webpack fallback mode (npm run dev:webpack)');
    }

    const moduleFactoryErrors = this.hmrErrors.filter(e => e.type === 'module-factory-deleted');
    if (moduleFactoryErrors.length > 5) {
      recommendations.push('Module factory deletion detected - consider clearing Next.js cache');
    }

    const importFailures = this.hmrErrors.filter(e => e.type === 'import-failure');
    if (importFailures.length > 3) {
      recommendations.push('Import failures detected - check module resolution configuration');
    }

    if (this.devContext.errorRecoveryAttempts > 20) {
      recommendations.push('High error recovery attempts - consider restarting development server');
    }

    return recommendations;
  }

  /**
   * Check if error is related to module loading
   */
  private isModuleLoadingError(error: any): boolean {
    if (!error || typeof error !== 'object') return false;
    
    const message = error.message || '';
    return (
      message.includes('module factory is not available') ||
      message.includes('Cannot resolve module') ||
      message.includes('Module not found') ||
      message.includes('Failed to resolve') ||
      message.includes('Dynamic import')
    );
  }

  /**
   * Extract module path from error
   */
  private extractModulePath(error: any): string {
    if (!error || typeof error !== 'object') return 'unknown';
    
    const message = error.message || '';
    const stack = error.stack || '';
    
    // Try to extract module path from common error patterns
    const patterns = [
      /Cannot resolve module '([^']+)'/,
      /Module not found: Can't resolve '([^']+)'/,
      /Failed to resolve '([^']+)'/,
      /at ([^(]+)/,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern) || stack.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return 'unknown';
  }
}

// Export singleton instance (only created in development)
export const DevErrorLogger = DevModeDetector.isDevelopment() 
  ? new DevErrorLoggerService() 
  : null;

// Export utility functions with development checks
export const logHMRError = (error: HMRError) => DevErrorLogger?.logHMRError(error);
export const logModuleDebug = (moduleKey: string, debugInfo: Partial<ModuleLoadingDebugInfo>) => 
  DevErrorLogger?.logModuleDebug(moduleKey, debugInfo);
export const logErrorRecovery = (action: string, success: boolean, details?: any) => 
  DevErrorLogger?.logErrorRecovery(action, success, details);
export const generateDebugReport = () => DevErrorLogger?.generateDebugReport();
export const clearDevLogs = () => DevErrorLogger?.clearDevLogs();