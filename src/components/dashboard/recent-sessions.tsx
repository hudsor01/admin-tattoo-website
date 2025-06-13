"use client"

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

export function RecentSessions() {
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: fetchRecentSessions,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Latest tattoo sessions and appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-4">
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : sessions?.data?.length > 0 ? (
          <div className="space-y-4">
            {sessions.data.slice(0, 10).map((session: TattooSessionWithClient) => (
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
}

function SessionCard({ session }: { session: TattooSessionWithClient }) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
            <User className="h-5 w-5 text-orange-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session.client?.firstName} {session.client?.lastName}
            </p>
            <Badge className={`text-xs ${getStatusColor(session.status)}`}>
              {session.status?.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              <span>{formatDate(session.appointmentDate)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{Math.round(session.duration / 60)}h</span>
            </div>
            
            {session.totalCost && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>{formatCurrency(Number(session.totalCost))}</span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-1 truncate">
            {session.designDescription}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          {session.artist?.name}
        </p>
        <p className="text-xs text-gray-500">Artist</p>
      </div>
    </div>
  )
}