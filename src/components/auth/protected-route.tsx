"use client"

import * as React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { IconLoader2 } from "@tabler/icons-react"

import { useUser, useIsAdmin } from "@/lib/auth-client"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  redirectTo = "/login",
  fallback
}: ProtectedRouteProps) {
  const { user, isLoading } = useUser()
  const isAdmin = useIsAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not authenticated - redirect to login
        router.push(redirectTo)
        return
      }

      if (requireAdmin && !isAdmin) {
        // Authenticated but not admin - redirect to unauthorized
        router.push("/unauthorized")
        return
      }
    }
  }, [user, isLoading, isAdmin, requireAdmin, router, redirectTo])

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-gradient-soft">
              <IconLoader2 className="h-8 w-8 animate-spin text-brand-gradient" />
            </div>
            <p className="text-muted-foreground text-sm">
              Checking authentication...
            </p>
          </div>
        </div>
      )
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  // Don't render if admin required but user is not admin
  if (requireAdmin && !isAdmin) {
    return null
  }

  // Render children if all checks pass
  return <>{children}</>
}

// Higher-order component version
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options: Omit<ProtectedRouteProps, "children"> = {}
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Admin-only wrapper
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin redirectTo="/login">
      {children}
    </ProtectedRoute>
  )
}

// Unauthorized page component
export function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="p-4 rounded-2xl bg-destructive/10 inline-block mb-4">
            <svg
              className="h-12 w-12 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. Please contact an administrator if you believe this is an error.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-gradient hover:opacity-90 rounded-lg transition-opacity"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
