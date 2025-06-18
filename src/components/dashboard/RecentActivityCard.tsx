'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, DollarSign, Mail, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';

// Activity types
type ActivityType = 'booking' | 'payment' | 'customer' | 'system';

interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
}

// Fetch recent activity from API
async function fetchRecentActivity(): Promise<RecentActivity[]> {
  const response = await fetch('/api/admin/analytics/activity');
  if (!response.ok) {
    throw new Error('Failed to fetch recent activity');
  }
  return response.json();
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'booking':
      return <Calendar className="h-4 w-4" />;
    case 'payment':
      return <DollarSign className="h-4 w-4" />;
    case 'customer':
      return <User className="h-4 w-4" />;
    case 'system':
      return <Mail className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
}

function getActivityColor(type: ActivityType) {
  switch (type) {
    case 'booking':
      return 'bg-blue-500';
    case 'payment':
      return 'bg-green-500';
    case 'customer':
      return 'bg-purple-500';
    case 'system':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
}

export default function RecentActivityCard() {
  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: fetchRecentActivity,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-sm">Failed to load recent activity</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.slice(0, 10).map((activity) => (
        <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
          {/* Activity Icon */}
          <div className={`p-2 rounded-full text-white ${getActivityColor(activity.type)}`}>
            {getActivityIcon(activity.type)}
          </div>

          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">{activity.title}</h4>
              <Badge variant="outline" className="text-xs">
                {activity.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
            
            {/* User info if available */}
            {activity.user ? <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={activity.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {activity.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{activity.user.name}</span>
              </div> : null}
          </div>

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground text-right">
            <div title={format(new Date(activity.timestamp), 'PPpp')}>
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}