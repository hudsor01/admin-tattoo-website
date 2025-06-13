"use client"

import { useUser, useIsVerifiedAdmin } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { ReactNode, useEffect } from "react"

interface RequireAdminProps {
  children: ReactNode
  fallback?: ReactNode
}

export function RequireAdmin({ children, fallback }: RequireAdminProps) {
  const { user, isLoading } = useUser()
  const isVerifiedAdmin = useIsVerifiedAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Redirect if no user
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user has verified admin access using new authorization system
      if (!isVerifiedAdmin) {
        router.push('/login?error=insufficient_permissions')
        return
      }
    }
  }, [user, isLoading, isVerifiedAdmin, router])

  // Show loading state while checking auth
  if (isLoading) {
    return fallback || (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-48 mx-auto bg-gray-200 animate-pulse rounded" />
          <div className="h-4 w-32 mx-auto bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    )
  }

  // Don't render children until auth is verified
  if (!user || !isVerifiedAdmin) {
    return null
  }

  // User is authenticated and has verified admin access
  return <>{children}</>
}

export default RequireAdmin