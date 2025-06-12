"use client"

import { useUser } from "@/lib/user"
import { useRouter } from "next/navigation"
import { ReactNode, useEffect } from "react"

interface RequireAdminProps {
  children: ReactNode
  fallback?: ReactNode
}

export function RequireAdmin({ children, fallback }: RequireAdminProps) {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Redirect if no user
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user has admin role
      if (user.role !== 'admin') {
        router.push('/login?error=insufficient_permissions')
        return
      }
    }
  }, [user, isLoading, router])

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
  if (!user || user.role !== 'admin') {
    return null
  }

  // User is authenticated and has admin role
  return <>{children}</>
}

export default RequireAdmin