'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void; errorId: string }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ApiErrorBoundary extends React.Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): ApiErrorBoundaryState {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[API Error Boundary] Error caught:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString()
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you could send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // sendErrorReport({
      //   message: error.message,
      //   stack: error.stack,
      //   errorId: this.state.errorId,
      //   componentStack: errorInfo.componentStack
      // });
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorId: '' });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent && this.state.error) {
        return (
          <FallbackComponent 
            error={this.state.error}
            reset={this.reset}
            errorId={this.state.errorId}
          />
        );
      }

      // Default API error UI
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
              {process.env.NODE_ENV === 'development' && (
                <div className="p-3 bg-gray-100 rounded-md">
                  <p className="text-xs font-mono text-gray-700">
                    {this.state.error?.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={this.reset}
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

    return this.props.children;
  }
}

// Hook for handling API errors in functional components
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