'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, RefreshCw, Home, Settings, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Unified Error Boundary Component
 * Consolidates functionality from error-boundary.tsx, api-error-boundary.tsx, and dashboard-error-boundary.tsx
 * Supports different display modes and auto-retry capabilities
 */

export type ErrorBoundaryMode = 'generic' | 'api' | 'dashboard';

interface UnifiedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  retryCount: number;
}

interface UnifiedErrorBoundaryProps {
  children: React.ReactNode;
  mode?: ErrorBoundaryMode;
  maxRetries?: number;
  autoRetryDelay?: number;
  fallback?: React.ComponentType<{ error: Error; reset: () => void; errorId: string }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class UnifiedErrorBoundary extends React.Component<UnifiedErrorBoundaryProps, UnifiedErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: UnifiedErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<UnifiedErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { mode = 'generic' } = this.props;
    
    console.error(`[${mode.toUpperCase()} Error Boundary] Error caught:`, {
      error: error.message,
      stack: error.stack,
      errorInfo,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Auto-retry logic for certain errors (mainly for dashboard and api modes)
    if (this.shouldAutoRetry(error) && this.state.retryCount < (this.props.maxRetries || 2)) {
      this.scheduleRetry();
    }
  }

  shouldAutoRetry = (error: Error): boolean => {
    const { mode = 'generic' } = this.props;
    
    // Only auto-retry for API and dashboard modes
    if (mode === 'generic') return false;
    
    // Auto-retry for network errors, timeouts, etc.
    const retryableErrors = [
      'fetch',
      'network',
      'timeout',
      'connection',
      'ECONNRESET',
      'ETIMEDOUT'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(keyword => errorMessage.includes(keyword));
  }

  scheduleRetry = () => {
    const delay = this.props.autoRetryDelay || 1000;
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: '',
        retryCount: prevState.retryCount + 1
      }));
    }, Math.min(delay * Math.pow(2, this.state.retryCount), 10000)); // Exponential backoff, max 10s
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  manualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0
    });
  }

  renderGenericError() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Something went wrong</h3>
            <p className="mt-1 text-sm text-gray-500">
              There was an error loading this page. Please try refreshing or contact support if the problem persists.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderApiError() {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-lg">API Error</CardTitle>
            <CardDescription>
              There was a problem loading the data. This might be a temporary issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="p-3 bg-gray-100 rounded-md">
                <p className="text-xs font-mono text-gray-700">
                  {this.state.error.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Error ID: {this.state.errorId}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={this.manualRetry}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  renderDashboardError() {
    if (!this.state.error) return null;
    
    const isNetworkError = this.shouldAutoRetry(this.state.error);
    const maxRetriesReached = this.state.retryCount >= (this.props.maxRetries || 2);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl">Dashboard Error</CardTitle>
            <CardDescription>
              The admin dashboard encountered an unexpected error and couldn&apos;t load properly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Error Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={isNetworkError ? "secondary" : "destructive"}>
                  {isNetworkError ? "Network Error" : "Application Error"}
                </Badge>
                {this.state.retryCount > 0 && (
                  <Badge variant="outline">
                    Retry {this.state.retryCount}/{this.props.maxRetries || 2}
                  </Badge>
                )}
              </div>
            </div>

            {/* Retry Information */}
            {isNetworkError && !maxRetriesReached && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  This appears to be a network issue. The dashboard will automatically retry in a moment.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={this.manualRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Dashboard
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => window.location.href = '/settings'}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
                <Button 
                  onClick={() => window.location.href = 'mailto:support@ink37tattoos.com'}
                  variant="outline"
                  size="sm"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Support
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-gray-600">
              <p>If this problem persists:</p>
              <ul className="mt-2 space-y-1">
                <li>• Try refreshing your browser</li>
                <li>• Check your internet connection</li>
                <li>• Clear browser cache and cookies</li>
                <li>• Contact support with Error ID: {this.state.errorId}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent && this.state.error) {
        return (
          <FallbackComponent 
            error={this.state.error} 
            reset={this.manualRetry}
            errorId={this.state.errorId}
          />
        );
      }

      // Render based on mode
      switch (this.props.mode) {
        case 'api':
          return this.renderApiError();
        case 'dashboard':
          return this.renderDashboardError();
        case 'generic':
        default:
          return this.renderGenericError();
      }
    }

    return this.props.children;
  }
}

/**
 * Hook version for functional components
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { captureError, resetError };
}

/**
 * Hook for handling API errors in functional components
 */
export function useApiErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const handleError = React.useCallback((error: Error | unknown) => {
    const apiError = error instanceof Error ? error : new Error('Unknown API error');
    console.error('[API Error Handler]', apiError);
    setError(apiError);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { handleError, clearError };
}

/**
 * Convenience components for specific modes
 */
export function GenericErrorBoundary({ children, ...props }: Omit<UnifiedErrorBoundaryProps, 'mode'>) {
  return (
    <UnifiedErrorBoundary mode="generic" {...props}>
      {children}
    </UnifiedErrorBoundary>
  );
}

export function ApiErrorBoundary({ children, ...props }: Omit<UnifiedErrorBoundaryProps, 'mode'>) {
  return (
    <UnifiedErrorBoundary mode="api" {...props}>
      {children}
    </UnifiedErrorBoundary>
  );
}

export function DashboardErrorBoundary({ children, ...props }: Omit<UnifiedErrorBoundaryProps, 'mode'>) {
  return (
    <UnifiedErrorBoundary mode="dashboard" maxRetries={2} {...props}>
      {children}
    </UnifiedErrorBoundary>
  );
}

export default UnifiedErrorBoundary;
