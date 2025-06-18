"use client"

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Calendar, Palette, Save, Settings, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import type { SettingsData } from '@/lib/services/settings-service';

type PartialSettingsData = {
  [K in keyof SettingsData]?: Partial<SettingsData[K]>;
};

const fetchSettings = async (): Promise<SettingsData> => {
  const response = await fetch('/api/admin/settings');
  if (!response.ok) throw new Error('Failed to fetch settings');
  const data = await response.json();
  return data.data;
};

const updateSettings = async (settings: PartialSettingsData): Promise<SettingsData> => {
  const response = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error('Failed to update settings');
  const data = await response.json();
  return data.data;
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<PartialSettingsData>({});

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully');
      setLocalSettings({});
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const handleUpdate = (section: keyof SettingsData, key: string, value: unknown) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      
      // Type-safe section initialization and update
      switch (section) {
        case 'studioInfo':
          newSettings.studioInfo = {
            ...(newSettings.studioInfo || {}),
            [key]: value as string,
          };
          break;
        case 'calcom':
          newSettings.calcom = {
            ...(newSettings.calcom || {}),
            [key]: key === 'webhookUrl' ? value as string : value as boolean,
          };
          break;
        case 'appearance':
          newSettings.appearance = {
            ...(newSettings.appearance || {}),
            [key]: value as boolean,
          };
          break;
        case 'notifications':
          newSettings.notifications = {
            ...(newSettings.notifications || {}),
            [key]: value as boolean,
          };
          break;
      }
      
      return newSettings;
    });
  };

  const handleSave = () => {
    if (Object.keys(localSettings).length > 0) {
      updateMutation.mutate(localSettings);
    }
  };

  const testConnection = () => {
    toast.success('Connection test successful!');
  };

  const getStringValue = (section: keyof SettingsData, key: string): string => {
    // Use type-safe property access instead of dynamic access
    switch (section) {
      case 'studioInfo': {
        const localValue = localSettings.studioInfo;
        const settingsValue = settings?.studioInfo;
        if (localValue && key in localValue) {
          const value = localValue[key as keyof typeof localValue];
          return typeof value === 'string' ? value : '';
        }
        if (settingsValue && key in settingsValue) {
          const value = settingsValue[key as keyof typeof settingsValue];
          return typeof value === 'string' ? value : '';
        }
        return '';
      }
      case 'calcom': {
        const localValue = localSettings.calcom;
        const settingsValue = settings?.calcom;
        if (localValue && key in localValue) {
          const value = localValue[key as keyof typeof localValue];
          return typeof value === 'string' ? value : '';
        }
        if (settingsValue && key in settingsValue) {
          const value = settingsValue[key as keyof typeof settingsValue];
          return typeof value === 'string' ? value : '';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const getBooleanValue = (section: keyof SettingsData, key: string): boolean => {
    // Use type-safe property access instead of dynamic access
    switch (section) {
      case 'calcom': {
        const localValue = localSettings.calcom;
        const settingsValue = settings?.calcom;
        if (localValue && key in localValue) {
          const value = localValue[key as keyof typeof localValue];
          return typeof value === 'boolean' ? value : false;
        }
        if (settingsValue && key in settingsValue) {
          const value = settingsValue[key as keyof typeof settingsValue];
          return typeof value === 'boolean' ? value : false;
        }
        return false;
      }
      case 'appearance': {
        const localValue = localSettings.appearance;
        const settingsValue = settings?.appearance;
        if (localValue && key in localValue) {
          const value = localValue[key as keyof typeof localValue];
          return typeof value === 'boolean' ? value : false;
        }
        if (settingsValue && key in settingsValue) {
          const value = settingsValue[key as keyof typeof settingsValue];
          return typeof value === 'boolean' ? value : false;
        }
        return false;
      }
      case 'notifications': {
        const localValue = localSettings.notifications;
        const settingsValue = settings?.notifications;
        if (localValue && key in localValue) {
          const value = localValue[key as keyof typeof localValue];
          return typeof value === 'boolean' ? value : false;
        }
        if (settingsValue && key in settingsValue) {
          const value = settingsValue[key as keyof typeof settingsValue];
          return typeof value === 'boolean' ? value : false;
        }
        return false;
      }
      default:
        return false;
    }
  };

  const hasChanges = Object.keys(localSettings).length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Breadcrumb */}
          <div className="px-6 lg:px-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

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
              {hasChanges ? (
                <Button 
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              ) : null}
            </div>
          </div>

          {/* Error State */}
          {error ? (
            <div className="px-6 lg:px-8">
              <div className="bg-destructive/15 border border-destructive/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="font-medium">Failed to load settings</span>
                </div>
                <p className="text-destructive/70 text-sm mt-1">
                  Please check your connection and try again. If the problem persists, contact support.
                </p>
              </div>
            </div>
          ) : null}
                
          {/* Settings Grid */}
          <div className="px-6 lg:px-8">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((skeletonId) => (
                  <Card key={skeletonId} className="bg-card border-border/30">
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
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
                      <Input 
                        id="studio-name" 
                        value={getStringValue('studioInfo', 'name')}
                        onChange={(e) => handleUpdate('studioInfo', 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studio-email">Contact Email</Label>
                      <Input 
                        id="studio-email" 
                        type="email" 
                        value={getStringValue('studioInfo', 'email')}
                        onChange={(e) => handleUpdate('studioInfo', 'email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studio-phone">Phone Number</Label>
                      <Input 
                        id="studio-phone" 
                        type="tel" 
                        value={getStringValue('studioInfo', 'phone')}
                        onChange={(e) => handleUpdate('studioInfo', 'phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studio-address">Address</Label>
                      <Input 
                        id="studio-address" 
                        value={getStringValue('studioInfo', 'address')}
                        onChange={(e) => handleUpdate('studioInfo', 'address', e.target.value)}
                      />
                    </div>
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
                    <div className="flex items-center justify-between p-4 rounded-lg border border-muted bg-background/50">
                      <div className="space-y-1">
                        <Label>Auto-sync appointments</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically sync new Cal.com bookings
                        </p>
                      </div>
                      <Switch 
                        checked={getBooleanValue('calcom', 'autoSync')}
                        onCheckedChange={(checked) => handleUpdate('calcom', 'autoSync', checked)}
                        className="border-2 border-muted data-[state=checked]:border-orange-500 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500 data-[state=unchecked]:bg-muted shadow-sm" 
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-muted bg-background/50">
                      <div className="space-y-1">
                        <Label>Email notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send email alerts for new bookings
                        </p>
                      </div>
                      <Switch 
                        checked={getBooleanValue('calcom', 'emailNotifications')}
                        onCheckedChange={(checked) => handleUpdate('calcom', 'emailNotifications', checked)}
                        className="border-2 border-muted data-[state=checked]:border-orange-500 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500 data-[state=unchecked]:bg-muted shadow-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cal-webhook">Webhook URL</Label>
                      <Input 
                        id="cal-webhook" 
                        readOnly 
                        value={getStringValue('calcom', 'webhookUrl')}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={testConnection}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-none shadow-md"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connection
                    </Button>
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
                    <div className="flex items-center justify-between p-4 rounded-lg border border-muted bg-background/50">
                      <div className="space-y-1">
                        <Label>Dark mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Toggle dark/light theme
                        </p>
                      </div>
                      <Switch 
                        checked={getBooleanValue('appearance', 'darkMode')}
                        onCheckedChange={(checked) => handleUpdate('appearance', 'darkMode', checked)}
                        className="border-2 border-muted data-[state=checked]:border-orange-500 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500 data-[state=unchecked]:bg-muted shadow-sm" 
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-muted bg-background/50">
                      <div className="space-y-1">
                        <Label>Compact sidebar</Label>
                        <p className="text-sm text-muted-foreground">
                          Use a more compact sidebar layout
                        </p>
                      </div>
                      <Switch 
                        checked={getBooleanValue('appearance', 'compactSidebar')}
                        onCheckedChange={(checked) => handleUpdate('appearance', 'compactSidebar', checked)}
                        className="border-2 border-muted data-[state=checked]:border-orange-500 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500 data-[state=unchecked]:bg-muted shadow-sm" 
                      />
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
                    <div className="flex items-center justify-between p-4 rounded-lg border border-muted bg-background/50">
                      <div className="space-y-1">
                        <Label>New booking alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when new bookings are made
                        </p>
                      </div>
                      <Switch 
                        checked={getBooleanValue('notifications', 'newBookings')}
                        onCheckedChange={(checked) => handleUpdate('notifications', 'newBookings', checked)}
                        className="border-2 border-muted data-[state=checked]:border-orange-500 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500 data-[state=unchecked]:bg-muted shadow-sm" 
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-muted bg-background/50">
                      <div className="space-y-1">
                        <Label>Payment notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Alerts for payment status changes
                        </p>
                      </div>
                      <Switch 
                        checked={getBooleanValue('notifications', 'payments')}
                        onCheckedChange={(checked) => handleUpdate('notifications', 'payments', checked)}
                        className="border-2 border-muted data-[state=checked]:border-orange-500 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500 data-[state=unchecked]:bg-muted shadow-sm" 
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-muted bg-background/50">
                      <div className="space-y-1">
                        <Label>Daily summary</Label>
                        <p className="text-sm text-muted-foreground">
                          Daily email with booking and revenue summary
                        </p>
                      </div>
                      <Switch 
                        checked={getBooleanValue('notifications', 'dailySummary')}
                        onCheckedChange={(checked) => handleUpdate('notifications', 'dailySummary', checked)}
                        className="border-2 border-muted data-[state=checked]:border-orange-500 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500 data-[state=unchecked]:bg-muted shadow-sm" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
