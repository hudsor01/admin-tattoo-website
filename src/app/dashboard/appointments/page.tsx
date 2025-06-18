"use client"

import { useState } from "react"
import { AppointmentStatsCards } from "@/components/appointments/appointment-stats-cards"
import { AppointmentDialog } from "@/components/appointments/appointment-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Edit, Eye, Phone, Plus, User } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

interface AppointmentResponse {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  appointment_date: string
  appointment_time: string
  service_type: string
  status: string
  notes: string
  created_at: string
}

const fetchAppointments = async () => {
  const response = await fetch('/api/admin/appointments')
  if (!response.ok) throw new Error('Failed to fetch appointments')
  return response.json()
}

export default function AppointmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | undefined>()
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create')

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: fetchAppointments,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const handleCreateNew = () => {
    setSelectedAppointment(undefined)
    setDialogMode('create')
    setDialogOpen(true)
  }

  const handleView = (appointment: AppointmentResponse) => {
    setSelectedAppointment(appointment)
    setDialogMode('view')
    setDialogOpen(true)
  }

  const handleEdit = (appointment: AppointmentResponse) => {
    setSelectedAppointment(appointment)
    setDialogMode('edit')
    setDialogOpen(true)
  }

  return (
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
              <Button 
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Appointment
              </Button>
            </div>
          </div>

          {/* Appointments List */}
          <div className="px-6 lg:px-8">
            <div className="grid gap-4">
              {isLoading ? (
                Array.from({ length: 3 }, (_, i) => i).map((id) => (
                  <Card key={`skeleton-appointment-${id}`}>
                    <CardHeader>
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))
              ) : appointments && appointments.length > 0 ? (
                appointments.map((appointment: AppointmentResponse) => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment}
                    onView={() => handleView(appointment)}
                    onEdit={() => handleEdit(appointment)}
                  />
                ))
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="flex flex-col items-center gap-4">
                      <Calendar className="h-16 w-16 text-muted-foreground/50" />
                      <div>
                        <h3 className="text-lg font-semibold mb-2">No appointments scheduled</h3>
                        <p className="text-muted-foreground mb-4">
                          Appointment management will be available soon.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment}
        mode={dialogMode}
      />
    </div>
  )
}

function AppointmentCard({ 
  appointment, 
  onView, 
  onEdit 
}: { 
  appointment: AppointmentResponse
  onView: () => void
  onEdit: () => void
}) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{appointment.client_name}</CardTitle>
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status}
          </Badge>
        </div>
        <CardDescription>
          {appointment.service_type}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.appointment_date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.appointment_time}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.client_phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.client_email}</span>
          </div>
        </div>
        {appointment.notes && appointment.notes.length > 0 ? (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
          </div>
        ) : null}
        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
