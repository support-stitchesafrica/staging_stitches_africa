'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { TriangleAlert, RefreshCw, Home, Bug, AlertCircle } from 'lucide-react';
import { ErrorLogger } from '@/lib/utils/error-logger';
import { performanceMonitor } from '@/lib/utils/performance-utils';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<GlobalErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'app' | 'page' | 'component';
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export interface GlobalErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retry: () => void;
  retryCount: number;
  level: 'app' | 'page' | 'component';
  context?: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = ErrorLogger.generateErrorId();
    
    console.error('Global Error Boundary caught an error:', {
      error,
      errorInfo,
      errorId,
      level: this.props.level || 'component',
      context: this.props.context,
    });

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log error with comprehensive context
    ErrorLogger.logError(error, {
      errorInfo,
      errorId,
      level: this.props.level || 'component',
      context: this.props.context,
      retryCount: this.state.retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    // Track error in performance monitoring
    performanceMonitor.trackError(error, {
      level: this.props.level || 'component',
      context: this.props.context,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to external monitoring services
    this.reportToMonitoringServices(error, errorInfo, errorId);
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private reportToMonitoringServices(error: Error, errorInfo: ErrorInfo, errorId: string) {
    // Report to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `${this.props.level || 'component'}: ${error.message}`,
        fatal: this.props.level === 'app',
        error_id: errorId,
        error_context: this.props.context,
      });
    }

    // Report to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.withScope((scope: any) => {
        scope.setTag('errorBoundary', true);
        scope.setTag('level', this.props.level || 'component');
        scope.setContext('errorInfo', errorInfo);
        scope.setContext('errorId', errorId);
        if (this.props.context) {
          scope.setContext('context', this.props.context);
        }
        (window as any).Sentry.captureException(error);
      });
    }

    // Report to custom error tracking endpoint
    this.reportToCustomEndpoint(error, errorInfo, errorId);
  }

  private async reportToCustomEndpoint(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          level: this.props.level || 'component',
          context: this.props.context,
          retryCount: this.state.retryCount,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (reportError) {
      console.error('Failed to report error to custom endpoint:', reportError);
    }
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    // Implement exponential backoff for retries
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 10000); // Max 10 seconds
    
    console.log(`Retrying error recovery (attempt ${newRetryCount}) after ${delay}ms delay`);
    
    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: newRetryCount,
      });
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  handleReload = () => {
    // Log reload action
    if (this.state.errorId) {
      ErrorLogger.logErrorAction(this.state.errorId, 'page_reload', {
        retryCount: this.state.retryCount,
      });
    }
    
    window.location.reload();
  };

  handleGoHome = () => {
    // Log navigation action
    if (this.state.errorId) {
      ErrorLogger.logErrorAction(this.state.errorId, 'navigate_home', {
        retryCount: this.state.retryCount,
      });
    }
    
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: CustomFallback } = this.props;
      
      if (CustomFallback) {
        return (
          <CustomFallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            errorId={this.state.errorId}
            retry={this.handleRetry}
            retryCount={this.state.retryCount}
            level={this.props.level || 'component'}
            context={this.props.context}
          />
        );
      }

      return (
        <DefaultGlobalErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          retry={this.handleRetry}
          retryCount={this.state.retryCount}
          level={this.props.level || 'component'}
          context={this.props.context}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultGlobalErrorFallbackProps extends GlobalErrorFallbackProps {
  onReload: () => void;
  onGoHome: () => void;
}

const DefaultGlobalErrorFallback: React.FC<DefaultGlobalErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  retry,
  retryCount,
  level,
  context,
  onReload,
  onGoHome,
}) => {
  const isAppLevel = level === 'app';
  const isPageLevel = level === 'page';
  const maxRetries = 3;
  const canRetry = retryCount < maxRetries;

  const getErrorSeverity = () => {
    if (isAppLevel) return 'critical';
    if (isPageLevel) return 'high';
    return 'medium';
  };

  const getErrorIcon = () => {
    switch (getErrorSeverity()) {
      case 'critical':
        return <AlertCircle className="h-12 w-12 text-red-600" />;
      case 'high':
        return <TriangleAlert className="h-12 w-12 text-orange-500" />;
      default:
        return <Bug className="h-12 w-12 text-yellow-500" />;
    }
  };

  const getErrorTitle = () => {
    if (isAppLevel) return 'Application Error';
    if (isPageLevel) return 'Page Error';
    return 'Component Error';
  };

  const getErrorDescription = () => {
    if (isAppLevel) {
      return 'A critical error occurred that affected the entire application. We apologize for the inconvenience.';
    }
    if (isPageLevel) {
      return 'An error occurred while loading this page. Some features may not work as expected.';
    }
    return 'A component failed to load properly. This may affect some functionality on this page.';
  };

  return (
    <div className={`${isAppLevel ? 'min-h-screen' : 'min-h-[400px]'} flex items-center justify-center bg-gray-50 ${isAppLevel ? '' : 'rounded-lg border border-gray-200'}`}>
      <div className="max-w-md w-full space-y-6 p-8">
        <div className="text-center">
          {getErrorIcon()}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">
            {getErrorTitle()}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {getErrorDescription()}
          </p>
          {context && (
            <p className="text-xs text-gray-500 mb-4">
              Context: {context}
            </p>
          )}
        </div>
        
        {/* Error Details */}
        <div className={`${getErrorSeverity() === 'critical' ? 'bg-red-50 border-red-200' : getErrorSeverity() === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'} border rounded-md p-4`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <TriangleAlert className={`h-5 w-5 ${getErrorSeverity() === 'critical' ? 'text-red-400' : getErrorSeverity() === 'high' ? 'text-orange-400' : 'text-yellow-400'}`} />
            </div>
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${getErrorSeverity() === 'critical' ? 'text-red-800' : getErrorSeverity() === 'high' ? 'text-orange-800' : 'text-yellow-800'}`}>
                Error Details
              </h4>
              <div className={`mt-2 text-sm ${getErrorSeverity() === 'critical' ? 'text-red-700' : getErrorSeverity() === 'high' ? 'text-orange-700' : 'text-yellow-700'}`}>
                <p className="font-mono text-xs break-all">{error.message}</p>
                {errorId && (
                  <p className="mt-1 text-xs opacity-75">
                    Error ID: {errorId}
                  </p>
                )}
                {retryCount > 0 && (
                  <p className="mt-1 text-xs opacity-75">
                    Retry attempts: {retryCount}/{maxRetries}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {canRetry && (
            <button
              onClick={retry}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
            </button>
          )}
          
          {!isAppLevel && (
            <button
              onClick={onReload}
              className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </button>
          )}
          
          <button
            onClick={onGoHome}
            className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Home
          </button>
        </div>

        {/* Additional Help */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            If this problem persists, please contact our support team with the error ID above.
          </p>
        </div>

        {/* Debug Information (Development Only) */}
        {process.env.NODE_ENV === 'development' && errorInfo && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Debug Information (Development Only)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
              <div className="mb-2">
                <strong>Stack Trace:</strong>
                <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
              </div>
              <div>
                <strong>Component Stack:</strong>
                <pre className="whitespace-pre-wrap text-xs">{errorInfo.componentStack}</pre>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};