"use client";

import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Auth Error Boundary caught an error:", error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error || new Error('Unknown error')} 
            retry={this.retry} 
          />
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <IconAlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Authentication Error</p>
                  <p className="text-sm">
                    There was a problem with the authentication system. 
                    This might be a temporary issue.
                  </p>
                  {this.state.error ? <details className="text-xs opacity-70">
                      <summary>Technical details</summary>
                      <pre className="mt-2 whitespace-pre-wrap">
                        {this.state.error.message}
                      </pre>
                    </details> : null}
                </div>
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button 
                onClick={this.retry}
                variant="outline"
                className="flex-1"
              >
                <IconRefresh className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="default"
                className="flex-1"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook to handle auth errors gracefully
export function useAuthErrorHandler() {
  const handleAuthError = React.useCallback((error: unknown) => {
    console.error("Authentication error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Network")) {
        return "Network connection error. Please check your internet connection.";
      }
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        return "Your session has expired. Please sign in again.";
      }
      if (error.message.includes("403") || error.message.includes("Forbidden")) {
        return "You don't have permission to access this resource.";
      }
      if (error.message.includes("500")) {
        return "Server error. Please try again later.";
      }
    }
    
    return "An unexpected error occurred. Please try again.";
  }, []);

  return { handleAuthError };
}
