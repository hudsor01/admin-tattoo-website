"use client"

import { memo, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, Clock, DollarSign, User } from "lucide-react"
import type { TattooSessionWithClient } from '@/types/database'

// Fetch recent sessions from API
const fetchRecentSessions = async () => {
  const response = await fetch('/api/admin/sessions/recent')
  if (!response.ok) throw new Error('Failed to fetch recent sessions')
  return response.json()
}

export const RecentSessions = memo(function RecentSessions() {
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: fetchRecentSessions,
    refetchInterval: () => {
      // Smart refetching - only if tab is visible and data exists
      return document.visibilityState === 'visible' ? 60000 : false // 1 minute when visible
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  })

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Latest tattoo sessions and appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-4">
            Failed to load recent sessions. Please try again later.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
        <CardDescription>Latest tattoo sessions and appointments</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {['session-1', 'session-2', 'session-3', 'session-4', 'session-5'].map((sessionId) => (
              <div key={`session-skeleton-${sessionId}`} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : (sessions as any)?.data?.length > 0 ? (
          <div className="space-y-4">
            {(sessions as any).data.slice(0, 10).map((session: TattooSessionWithClient) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No recent sessions found
          </div>
        )}
      </CardContent>
    </Card>
  )
})

const SessionCard = memo(function SessionCard({ session }: { session: TattooSessionWithClient }) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-success-soft text-success'
      case 'in_progress':
        return 'bg-info-soft text-info'
      case 'scheduled':
        return 'bg-warning-soft text-warning'
      case 'cancelled':
        return 'bg-error-soft text-error'
      case 'no_show':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-brand-gradient-soft flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-foreground truncate">
              {session.clients?.firstName} {session.clients?.lastName}
            </p>
            <Badge className={`text-xs ${getStatusColor(session.status)}`}>
              {session.status?.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              <span>{formatDate(session.appointmentDate)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{Math.round(session.duration / 60)}h</span>
            </div>
            
            {session.totalCost ? <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>{formatCurrency(Number(session.totalCost))}</span>
              </div> : null}
          </div>
          
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {session.designDescription}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-medium text-foreground">
          {session.tattoo_artists?.name}
        </p>
        <p className="text-xs text-muted-foreground">Artist</p>
      </div>
    </div>
  )
})
