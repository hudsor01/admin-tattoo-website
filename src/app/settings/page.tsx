"use client"

import { AdminRoute } from "@/components/auth/admin-route"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { 
  SidebarInset,
  SidebarProvider,
  SidebarTrigger 
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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your studio settings, Cal.com integration, and preferences.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Studio Information */}
          <Card>
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
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          {/* Cal.com Integration */}
          <Card>
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
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email alerts for new bookings
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cal-webhook">Webhook URL</Label>
                <Input 
                  id="cal-webhook" 
                  readOnly 
                  defaultValue="https://ink37tattoos.com/api/webhooks/cal" 
                />
              </div>
              <Button variant="outline">Test Connection</Button>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
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
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Compact sidebar</Label>
                  <p className="text-sm text-muted-foreground">
                    Use a more compact sidebar layout
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
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
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Payment notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerts for payment status changes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Daily summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Daily email with booking and revenue summary
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminRoute>
  );
}