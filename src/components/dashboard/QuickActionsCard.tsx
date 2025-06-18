'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  BarChart3, 
  Calendar, 
  FileText, 
  Mail, 
  Settings,
  Upload,
  UserPlus
} from 'lucide-react';

export default function QuickActionsCard() {
  const quickActions = [
    {
      title: 'New Appointment',
      description: 'Schedule a new customer appointment',
      icon: <Calendar className="h-4 w-4" />,
      href: '/admin/appointments/new',
      variant: 'default' as const,
    },
    {
      title: 'Add Customer',
      description: 'Create a new customer profile',
      icon: <UserPlus className="h-4 w-4" />,
      href: '/admin/customers/new',
      variant: 'outline' as const,
    },
    {
      title: 'Upload Gallery',
      description: 'Add new tattoo designs to gallery',
      icon: <Upload className="h-4 w-4" />,
      href: '/admin/gallery/upload',
      variant: 'outline' as const,
    },
    {
      title: 'View Analytics',
      description: 'Check business performance metrics',
      icon: <BarChart3 className="h-4 w-4" />,
      href: '/admin/analytics',
      variant: 'outline' as const,
    },
    {
      title: 'Send Newsletter',
      description: 'Send updates to customers',
      icon: <Mail className="h-4 w-4" />,
      href: '/admin/marketing/newsletter',
      variant: 'outline' as const,
    },
    {
      title: 'Generate Report',
      description: 'Create business reports',
      icon: <FileText className="h-4 w-4" />,
      href: '/admin/reports',
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-3">
      {quickActions.map((action, index) => (
        <Button
          key={index}
          asChild
          variant={action.variant}
          className="w-full justify-start h-auto p-4"
        >
          <Link href={action.href}>
            <div className="flex items-start gap-3 w-full">
              <div className="mt-0.5">
                {action.icon}
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {action.description}
                </div>
              </div>
            </div>
          </Link>
        </Button>
      ))}
      
      {/* Settings Link */}
      <div className="border-t pt-3 mt-4">
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/admin/settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  );
}