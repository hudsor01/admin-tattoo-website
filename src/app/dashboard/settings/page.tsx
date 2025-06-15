"use client"

import { AdminRoute } from "@/components/auth/admin-route"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { 
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Calendar, Palette, Bell } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AdminRoute>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "5rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Page Header */}
                <div className="px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                          <Settings className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-black text-foreground tracking-tight">Settings</h1>
                          <p className="text-muted-foreground">
                            Manage your studio settings, Cal.com integration, and preferences
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Settings Grid */}
                <div className="px-6 lg:px-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Studio Information */}
                    <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Studio Information
              </CardTitle>
              <CardDescription>
                Basic information about your tattoo studio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studio-name">Studio Name</Label>
                <Input id="studio-name" defaultValue="Ink 37 Tattoos" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-email">Contact Email</Label>
                <Input 
                  id="studio-email" 
                  type="email" 
                  defaultValue="info@ink37tattoos.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-phone">Phone Number</Label>
                <Input 
                  id="studio-phone" 
                  type="tel" 
                  defaultValue="+1 (555) 123-4567"
                />
              </div>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">Save Changes</Button>
            </CardContent>
          </Card>

          {/* Cal.com Integration */}
          <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cal.com Integration
              </CardTitle>
              <CardDescription>
                Configure your Cal.com booking integration settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-sync appointments</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync new Cal.com bookings
                  </p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email alerts for new bookings
                  </p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cal-webhook">Webhook URL</Label>
                <Input 
                  id="cal-webhook" 
                  readOnly 
                  defaultValue="https://ink37tattoos.com/api/webhooks/cal" 
                />
              </div>
              <Button variant="outline" className="border-gradient hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-red-500/10">Test Connection</Button>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your admin dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Dark mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle dark/light theme
                  </p>
                </div>
                <Switch className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Compact sidebar</Label>
                  <p className="text-sm text-muted-foreground">
                    Use a more compact sidebar layout
                  </p>
                </div>
                <Switch className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500" />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure notification preferences and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>New booking alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new bookings are made
                  </p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Payment notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerts for payment status changes
                  </p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Daily summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Daily email with booking and revenue summary
                  </p>
                </div>
                <Switch className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500" />
              </div>
            </CardContent>
          </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminRoute>
  );
}