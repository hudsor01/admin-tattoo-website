"use client"

import { useUser, useHasPermission, useHasAnyPermission, Permission } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { ReactNode, useEffect } from "react"

interface RequirePermissionProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean // If true, user must have ALL permissions; if false, ANY permission
  fallback?: ReactNode
  redirectTo?: string
  showError?: boolean
}

export function RequirePermission({ 
  children, 
  permission,
  permissions,
  requireAll = false,
  fallback,
  redirectTo = '/login',
  showError = false
}: RequirePermissionProps) {
  const { user, isLoading } = useUser()
  const router = useRouter()

  // Determine which permissions to check
  const permissionsToCheck = permission ? [permission] : (permissions || [])
  
  // Check permissions based on requirements
  const hasSinglePermission = useHasPermission(permission!)
  const hasAnyPermissions = useHasAnyPermission(permissionsToCheck)
  const hasAllPermissions = permissionsToCheck.every(perm => 
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHasPermission(perm)
  )

  // Determine if user has required permissions
  const hasRequiredPermissions = permission 
    ? hasSinglePermission
    : requireAll 
      ? hasAllPermissions 
      : hasAnyPermissions

  useEffect(() => {
    if (!isLoading) {
      // Redirect if no user
      if (!user) {
        router.push(`${redirectTo}?error=authentication_required`)
        return
      }

      // Check if user has required permissions
      if (!hasRequiredPermissions) {
        const errorParam = showError ? '?error=insufficient_permissions' : ''
        router.push(`${redirectTo}${errorParam}`)
        return
      }
    }
  }, [user, isLoading, hasRequiredPermissions, router, redirectTo, showError])

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

  // Don't render children until auth and permissions are verified
  if (!user || !hasRequiredPermissions) {
    return fallback || null
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}

// Specific permission components for common use cases
export function RequireCustomerRead({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RequirePermission permission={Permission.READ_CUSTOMERS} fallback={fallback}>
      {children}
    </RequirePermission>
  )
}

export function RequireCustomerWrite({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RequirePermission 
      permissions={[Permission.CREATE_CUSTOMERS, Permission.UPDATE_CUSTOMERS]} 
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </RequirePermission>
  )
}

export function RequireAppointmentManagement({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RequirePermission 
      permissions={[
        Permission.READ_APPOINTMENTS, 
        Permission.CREATE_APPOINTMENTS, 
        Permission.UPDATE_APPOINTMENTS
      ]} 
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </RequirePermission>
  )
}

export function RequirePaymentAccess({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RequirePermission permission={Permission.READ_PAYMENTS} fallback={fallback}>
      {children}
    </RequirePermission>
  )
}

export function RequireMediaUpload({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RequirePermission permission={Permission.UPLOAD_MEDIA} fallback={fallback}>
      {children}
    </RequirePermission>
  )
}

export function RequireAnalyticsAccess({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RequirePermission permission={Permission.READ_ANALYTICS} fallback={fallback}>
      {children}
    </RequirePermission>
  )
}

export function RequireDashboardAccess({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RequirePermission permission={Permission.READ_DASHBOARD} fallback={fallback}>
      {children}
    </RequirePermission>
  )
}

export default RequirePermission