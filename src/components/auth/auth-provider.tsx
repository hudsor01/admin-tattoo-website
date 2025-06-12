"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { IconLoader2 } from "@tabler/icons-react"

import { useUser, useIsAdmin } from "@/lib/auth-client"

interface AuthProviderProps {
  children: React.ReactNode
}

// List of public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/unauthorized"]

// List of admin-only routes
const ADMIN_ROUTES = [
  "/",
  "/dashboard",
  "/customers",
  "/appointments",
  "/payments",
  "/media-management",
  "/analytics",
  "/settings",
  "/messages",
  "/forms"
]

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const { user, isLoading } = useUser()
  const isAdmin = useIsAdmin()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      setIsInitialized(true)

      const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
      const isAdminRoute = ADMIN_ROUTES.includes(pathname) || pathname.startsWith("/api/admin")

      if (!user && !isPublicRoute) {
        // Not authenticated and trying to access protected route
        router.push("/login")
        return
      }

      if (user && pathname === "/login") {
        // Authenticated user trying to access login page
        router.push("/")
        return
      }

      if (user && isAdminRoute && !isAdmin) {
        // Authenticated but not admin trying to access admin route
        router.push("/unauthorized")
        return
      }
    }
  }, [user, isLoading, isAdmin, pathname, router])

  // Show loading screen while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-brand-gradient-soft">
            <IconLoader2 className="h-10 w-10 animate-spin text-brand-gradient" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Ink 37 Tattoos Admin
            </h2>
            <p className="text-sm text-muted-foreground">
              Checking authentication...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Loading component for consistent loading states
export function AuthLoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-2xl bg-brand-gradient">
          <IconLoader2 className="h-10 w-10 animate-spin text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Ink 37 Tattoos Admin
          </h2>
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
