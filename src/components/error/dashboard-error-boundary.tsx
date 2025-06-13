'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Settings, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  retryCount: number;
}

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  maxRetries?: number;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class DashboardErrorBoundary extends React.Component<DashboardErrorBoundaryProps, DashboardErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<DashboardErrorBoundaryState> {
    const errorId = `dash_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Dashboard Error Boundary] Critical dashboard error:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Auto-retry logic for certain errors
    if (this.shouldAutoRetry(error) && this.state.retryCount < (this.props.maxRetries || 2)) {
      this.scheduleRetry();
    }
  }

  shouldAutoRetry = (error: Error): boolean => {
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
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: '',
        retryCount: prevState.retryCount + 1
      }));
    }, Math.min(1000 * Math.pow(2, this.state.retryCount), 10000)); // Exponential backoff, max 10s
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

  render() {
    if (this.state.hasError && this.state.error) {
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
                
                {process.env.NODE_ENV === 'development' && (
                  <div className="p-3 bg-gray-100 rounded-md">
                    <p className="text-sm font-mono text-gray-700">
                      {this.state.error.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Error ID: {this.state.errorId}
                    </p>
                  </div>
                )}
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

    return this.props.children;
  }
}