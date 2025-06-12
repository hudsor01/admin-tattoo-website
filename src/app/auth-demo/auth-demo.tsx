"use client"

import * as React from "react"
import { useState } from "react"
import { IconInnerShadowTop, IconUser, IconEyeOff } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { LogoutButton, LogoutMenuItem } from "@/components/auth/logout-button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AuthDemo() {
  const [showLoginDemo, setShowLoginDemo] = useState(false)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="absolute inset-0 bg-brand-gradient-soft" />
      
      <div className="relative max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-brand-gradient shadow-xl">
              <IconInnerShadowTop className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-brand-gradient mb-2">
            Auth Components Demo
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Showcasing the login and logout components built with the dashboard's design system, 
            color palette, and gradients.
          </p>
        </div>

        {/* Design System Overview */}
        <Card className="backdrop-blur-sm border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-brand-gradient">Design System Features</CardTitle>
            <CardDescription className="text-base">
              Key elements used in our authentication components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color Palette */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Brand Gradient Palette</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-brand-gradient shadow-lg"></div>
                  <p className="text-sm font-medium">Primary Gradient</p>
                  <code className="text-xs text-muted-foreground">linear-gradient(135deg, #dc2626, #ea580c, #f97316)</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-brand-gradient-soft shadow-lg"></div>
                  <p className="text-sm font-medium">Soft Gradient</p>
                  <code className="text-xs text-muted-foreground">rgba(220, 38, 38, 0.1) → rgba(249, 115, 22, 0.1)</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-card border border-border shadow-lg flex items-center justify-center">
                    <span className="text-brand-gradient font-bold text-lg">Ink 37</span>
                  </div>
                  <p className="text-sm font-medium">Text Gradient</p>
                  <code className="text-xs text-muted-foreground">background-clip: text</code>
                </div>
              </div>
            </div>

            <Separator />

            {/* Typography */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Typography Hierarchy</h3>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-brand-gradient">Heading 1 - Montserrat Black</h1>
                <h2 className="text-2xl font-bold text-foreground">Heading 2 - Montserrat Bold</h2>
                <h3 className="text-xl font-semibold text-foreground">Heading 3 - Montserrat Semibold</h3>
                <p className="text-base text-muted-foreground">Body text - Inter Regular with enhanced line height</p>
                <p className="text-sm text-muted-foreground">Small text - Inter Regular</p>
              </div>
            </div>

            <Separator />

            {/* Component Examples */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Interactive Components</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button className="bg-brand-gradient hover:opacity-90 text-white shadow-lg">
                  Primary Button
                </Button>
                <Button variant="outline" className="border-border hover:bg-accent">
                  Outline Button
                </Button>
                <Badge className="bg-brand-gradient text-white">
                  Status Badge
                </Badge>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border shadow-sm">
                  <IconUser className="h-5 w-5 text-brand-gradient" />
                  <span className="text-sm font-medium">Icon + Text</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Component Demo */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-brand-gradient">Login Form</CardTitle>
              <CardDescription>
                Full-featured login component with email/password and Google OAuth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Email and password authentication</li>
                  <li>• Google OAuth integration</li>
                  <li>• Password visibility toggle</li>
                  <li>• Loading states and error handling</li>
                  <li>• Responsive design with brand gradients</li>
                  <li>• Automatic redirect after login</li>
                </ul>
              </div>
              
              <Button 
                onClick={() => setShowLoginDemo(!showLoginDemo)}
                className="w-full bg-brand-gradient hover:opacity-90 text-white"
              >
                {showLoginDemo ? "Hide" : "Show"} Login Form
              </Button>

              {showLoginDemo && (
                <div className="mt-4 p-4 rounded-lg bg-background border border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    Demo form (non-functional for preview):
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Email</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          placeholder="admin@ink37tattoos.com"
                          className="w-full h-10 px-3 rounded-md border border-border bg-background focus:border-primary focus:outline-none"
                          disabled
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Password</label>
                      <div className="relative">
                        <input 
                          type="password" 
                          placeholder="Enter your password"
                          className="w-full h-10 px-3 pr-10 rounded-md border border-border bg-background focus:border-primary focus:outline-none"
                          disabled
                        />
                        <button className="absolute right-2 top-2 p-1" disabled>
                          <IconEyeOff className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <Button className="w-full bg-brand-gradient text-white" disabled>
                      Sign In (Demo)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-brand-gradient">Logout Components</CardTitle>
              <CardDescription>
                Multiple logout button variants with confirmation dialogs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Multiple button variants and sizes</li>
                  <li>• Optional confirmation dialogs</li>
                  <li>• Loading states during logout</li>
                  <li>• Dropdown menu item version</li>
                  <li>• Configurable redirect destinations</li>
                  <li>• Consistent with design system</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Button Variants:</h4>
                  <div className="flex flex-wrap gap-2">
                    <LogoutButton 
                      variant="default" 
                      showConfirmDialog={false}
                      className="bg-brand-gradient hover:opacity-90 text-white"
                    >
                      Primary
                    </LogoutButton>
                    <LogoutButton variant="outline" showConfirmDialog={false}>
                      Outline
                    </LogoutButton>
                    <LogoutButton variant="ghost" showConfirmDialog={false}>
                      Ghost
                    </LogoutButton>
                    <LogoutButton 
                      variant="destructive" 
                      showConfirmDialog={false}
                      size="icon"
                      showIcon={true}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">With Confirmation:</h4>
                  <LogoutButton 
                    className="bg-brand-gradient hover:opacity-90 text-white"
                    showConfirmDialog={true}
                  >
                    Sign Out (with confirmation)
                  </LogoutButton>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Dropdown Menu Item:</h4>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full">
                        User Menu Demo
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <IconUser className="h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Settings
                      </DropdownMenuItem>
                      <LogoutMenuItem />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Notes */}
        <Card className="backdrop-blur-sm border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-brand-gradient">Implementation Details</CardTitle>
            <CardDescription>
              Technical details about the authentication components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Authentication Flow:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Better Auth integration</li>
                  <li>• Email/password and Google OAuth</li>
                  <li>• Role-based access control (admin required)</li>
                  <li>• Automatic redirects and protected routes</li>
                  <li>• Session management and persistence</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Design System:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tailwind CSS v4 with custom utilities</li>
                  <li>• Brand gradient system (red to orange)</li>
                  <li>• Consistent typography (Montserrat + Inter)</li>
                  <li>• Radix UI primitives with shadcn/ui</li>
                  <li>• Responsive and accessible</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Authentication components for <span className="text-brand-gradient font-semibold">Ink 37 Tattoos Admin Dashboard</span>
          </p>
        </div>
      </div>
    </div>
  )
}