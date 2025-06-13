"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { IconBrandGoogle, IconLoader2 } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authClient } from "@/lib/auth-client"
import { useUser } from "@/lib/auth-client"
import { isAdmin, AuthorizedUser } from "@/lib/authorization"
import { useAuthErrorHandler } from "./auth-error-boundary"

export function LoginForm({
  className,
  redirectTo = "/dashboard",
  ...props
}: React.ComponentProps<"form"> & { redirectTo?: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { user, isLoading: authLoading } = useUser()
  const { handleAuthError } = useAuthErrorHandler()

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectTo)
    }
  }, [user, authLoading, router, redirectTo])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      })

      if (error) {
        setError(error.message || "Invalid email or password")
      } else if (data?.user) {
        // Check if user has admin access using new authorization system
        const user = data.user as unknown as AuthorizedUser
        if (!isAdmin(user)) {
          setError("Admin access required. Contact administrator for access.")
          await authClient.signOut()
          return
        }
        router.push(redirectTo)
      }
    } catch (err) {
      setError(handleAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      })

      if (error) {
        setError("Failed to sign in with Google. Please try again.")
        setIsLoading(false)
      } else if (data?.url) {
        // Handle social sign-in redirect
        window.location.href = data.url;
      }
    } catch (err) {
      setError(handleAuthError(err))
      setIsLoading(false)
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconLoader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Don't render if already authenticated
  if (user) {
    return null
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleEmailSignIn}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-brand-gradient">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your admin dashboard
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@ink37tattoos.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline text-primary"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-brand-gradient hover:opacity-90 text-white font-medium shadow-lg"
          disabled={isLoading || !email || !password}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <IconLoader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            "Login"
          )}
        </Button>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full border-border hover:bg-accent"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <IconBrandGoogle className="h-4 w-4 mr-2" />
          Login with Google
        </Button>
      </div>
      <div className="text-center text-sm">
        Need admin access?{" "}
        <a href="mailto:admin@ink37tattoos.com" className="underline underline-offset-4 text-primary">
          Contact administrator
        </a>
      </div>
    </form>
  )
}
