/**
 * Error logging utility for tracking and reporting application errors
 */

import { DevModeDetector } from './dev-mode-detector';

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  error: Error;
  context?: Record<string, any>;
  level: 'error' | 'warning' | 'info';
  component?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

export interface ErrorAction {
  errorId: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class ErrorLoggerService {
  private logs: ErrorLogEntry[] = [];
  private actions: ErrorAction[] = [];
  private maxLogs = 100; // Keep last 100 errors in memory

  /**
   * Generate a unique error ID
   */
  generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log an error with context
   */
  logError(
    error: Error,
    context?: Record<string, any>,
    level: 'error' | 'warning' | 'info' = 'error',
    component?: string
  ): string {
    const errorId = this.generateErrorId();
    
    const logEntry: ErrorLogEntry = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error,
      context,
      level,
      component,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development (using dev mode detector)
    if (DevModeDetector.shouldEnableDebugLogging()) {
      console.error('Error logged:', {
        id: errorId,
        message: error.message,
        stack: error.stack,
        context,
        component,
      });
    }

    // Send to external logging service in production (using dev mode detector)
    if (DevModeDetector.isProduction()) {
      this.sendToExternalService(logEntry);
    }

    return errorId;
  }

  /**
   * Log an error action (retry, navigate, etc.)
   */
  logErrorAction(
    errorId: string,
    action: string,
    metadata?: Record<string, any>
  ): void {
    const actionEntry: ErrorAction = {
      errorId,
      action,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.actions.push(actionEntry);

    // Log to console in development (using dev mode detector)
    if (DevModeDetector.shouldEnableDebugLogging()) {
      console.log('Error action logged:', actionEntry);
    }

    // Send to external service in production (using dev mode detector)
    if (DevModeDetector.isProduction()) {
      this.sendActionToExternalService(actionEntry);
    }
  }

  /**
   * Get error logs for debugging
   */
  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get error actions for debugging
   */
  getActions(): ErrorAction[] {
    return [...this.actions];
  }

  /**
   * Clear all logs (useful for testing)
   */
  clearLogs(): void {
    this.logs = [];
    this.actions = [];
  }

  /**
   * Get current user ID from context
   */
  private getCurrentUserId(): string | undefined {
    // This would typically get the user ID from your auth context
    // For now, return undefined
    return undefined;
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('error_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Send error to external logging service
   */
  private async sendToExternalService(logEntry: ErrorLogEntry): Promise<void> {
    try {
      // In a real application, you would send this to your logging service
      // Examples: Sentry, LogRocket, DataDog, etc.
      
      // For now, just log to console
      console.error('Would send to external service:', {
        id: logEntry.id,
        message: logEntry.error.message,
        timestamp: logEntry.timestamp,
        level: logEntry.level,
        component: logEntry.component,
        url: logEntry.url,
      });

      // Example Sentry integration:
      // if (typeof window !== 'undefined' && (window as any).Sentry) {
      //   (window as any).Sentry.captureException(logEntry.error, {
      //     tags: {
      //       component: logEntry.component,
      //       level: logEntry.level,
      //     },
      //     contexts: {
      //       error_context: logEntry.context,
      //     },
      //     user: {
      //       id: logEntry.userId,
      //     },
      //   });
      // }
    } catch (error) {
      console.error('Failed to send error to external service:', error);
    }
  }

  /**
   * Send action to external logging service
   */
  private async sendActionToExternalService(actionEntry: ErrorAction): Promise<void> {
    try {
      // In a real application, you would send this to your analytics service
      console.log('Would send action to external service:', actionEntry);
    } catch (error) {
      console.error('Failed to send action to external service:', error);
    }
  }
}

// Export singleton instance
export const ErrorLogger = new ErrorLoggerService();


