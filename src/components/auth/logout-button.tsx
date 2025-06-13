"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconLogout, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { authClient } from "@/lib/auth-client"

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  showConfirmDialog?: boolean
  className?: string
  children?: React.ReactNode
  redirectTo?: string
}

export function LogoutButton({
  variant = "ghost",
  size = "sm",
  showIcon = true,
  showConfirmDialog = true,
  className = "",
  children,
  redirectTo = "/login"
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      await authClient.signOut()
      router.push(redirectTo)
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const LogoutContent = () => (
    <>
      {isLoading ? (
        <IconLoader2 className="h-4 w-4 animate-spin" />
      ) : (
        showIcon && <IconLogout className="h-4 w-4" />
      )}
      {children || "Sign Out"}
    </>
  )

  if (showConfirmDialog) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`flex items-center gap-2 ${className}`}
            disabled={isLoading}
          >
            <LogoutContent />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">
              Sign Out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Are you sure you want to sign out? You&apos;ll need to sign in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoading}
              className="bg-brand-gradient hover:opacity-90 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  <span>Signing out...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <IconLogout className="h-4 w-4" />
                  <span>Sign Out</span>
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={`flex items-center gap-2 ${className}`}
    >
      <LogoutContent />
    </Button>
  )
}

// Quick logout button for dropdown menus
export function LogoutMenuItem({
  className = "",
  onLogout
}: {
  className?: string
  onLogout?: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      await authClient.signOut()
      onLogout?.()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <IconLoader2 className="h-4 w-4 animate-spin" />
      ) : (
        <IconLogout className="h-4 w-4" />
      )}
      <span>Sign Out</span>
    </button>
  )
}
