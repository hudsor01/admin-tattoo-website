"use client"

import { AuthCard, RedirectToSignIn, SignedIn } from "@daveyplate/better-auth-ui"

export function LoginForm({
  className,
  redirectTo = "/dashboard",
  ...props
}: React.ComponentProps<"div"> & { redirectTo?: string }) {
  return (
    <>
      <RedirectToSignIn />
      <SignedIn>
        {/* This will redirect authenticated users */}
        <script dangerouslySetInnerHTML={{
          __html: `window.location.href = "${redirectTo}"`
        }} />
      </SignedIn>
      
      <div className={className} {...props}>
        <div className="flex flex-col items-center gap-2 text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-gradient">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your admin dashboard
          </p>
        </div>
        
        <AuthCard 
          view="SIGN_IN"
          className="border-0 shadow-none p-0"
        />
        
        <div className="text-center text-sm mt-4">
          Need admin access?{" "}
          <a href="mailto:admin@ink37tattoos.com" className="underline underline-offset-4 text-primary">
            Contact administrator
          </a>
        </div>
      </div>
    </>
  )
}
