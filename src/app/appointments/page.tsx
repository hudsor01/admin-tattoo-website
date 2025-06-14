"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { AppointmentStatsCards } from "@/components/appointments/appointment-stats-cards"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Phone } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import type { AppointmentResponse } from '@/types/database'

// Fetch appointments from API
const fetchAppointments = async () => {
  const response = await fetch('/api/admin/appointments')
  if (!response.ok) throw new Error('Failed to fetch appointments')
  return response.json()
}

export default function AppointmentsPage() {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: fetchAppointments,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  return (
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
              {/* Stats Cards */}
              <AppointmentStatsCards />
              
              {/* Page Header */}
              <div className="px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                    <p className="text-muted-foreground">
                      Manage client appointments and bookings
                    </p>
                  </div>
                </div>

                {/* Appointments Grid */}
                <div className="grid gap-4">
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="shadow-lg">
                      <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : appointments?.length > 0 ? (
                appointments.map((appointment: AppointmentResponse) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No appointments scheduled</h3>
                      <p className="text-muted-foreground mb-4">
                        Appointment management will be available soon.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppointmentCard({ appointment }: { appointment: AppointmentResponse }) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {`${appointment.client?.firstName} ${appointment.client?.lastName}` || 'Unknown Client'}
          </CardTitle>
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status || 'Pending'}
          </Badge>
        </div>
        <CardDescription>
          {appointment.type || 'Tattoo Session'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(appointment.scheduledDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(appointment.scheduledDate).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.artist?.name || 'Unknown Artist'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.client?.phone || 'N/A'}</span>
          </div>
        </div>
        {appointment.notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
