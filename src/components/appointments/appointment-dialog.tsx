"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Appointment {
  id?: string
  client_name: string
  client_email: string
  client_phone: string
  appointment_date: string
  appointment_time: string
  service_type: string
  status: string
  notes: string
}

interface AppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Appointment
  mode: 'create' | 'edit' | 'view'
}

export function AppointmentDialog({ open, onOpenChange, appointment, mode }: AppointmentDialogProps) {
  const [date, setDate] = useState<Date | undefined>(
    appointment?.appointment_date ? new Date(appointment.appointment_date) : undefined
  )
  const [formData, setFormData] = useState<Appointment>({
    client_name: appointment?.client_name || '',
    client_email: appointment?.client_email || '',
    client_phone: appointment?.client_phone || '',
    appointment_date: appointment?.appointment_date || '',
    appointment_time: appointment?.appointment_time || '',
    service_type: appointment?.service_type || '',
    status: appointment?.status || 'pending',
    notes: appointment?.notes || ''
  })

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: Appointment) => {
      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create appointment')
      return response.json()
    },
    onSuccess: () => {
      toast.success('Appointment created successfully')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      onOpenChange(false)
      resetForm()
    },
    onError: () => {
      toast.error('Failed to create appointment')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Appointment) => {
      const response = await fetch(`/api/admin/appointments/${appointment?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update appointment')
      return response.json()
    },
    onSuccess: () => {
      toast.success('Appointment updated successfully')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to update appointment')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/appointments/${appointment?.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete appointment')
      return response.json()
    },
    onSuccess: () => {
      toast.success('Appointment cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to cancel appointment')
    }
  })

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_email: '',
      client_phone: '',
      appointment_date: '',
      appointment_time: '',
      service_type: '',
      status: 'pending',
      notes: ''
    })
    setDate(undefined)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'create') {
      createMutation.mutate(formData)
    } else if (mode === 'edit') {
      updateMutation.mutate(formData)
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        appointment_date: format(selectedDate, 'yyyy-MM-dd')
      }))
    }
  }

  const isReadOnly = mode === 'view'
  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-2xl max-h-[90vh] overflow-hidden p-0",
        "bg-white dark:bg-card text-gray-900 dark:text-card-foreground",
        "shadow-2xl border border-gray-200 dark:border-border"
      )}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-border/50">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-md bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-sm">
              <CalendarIcon className="h-4 w-4" />
            </div>
            {mode === 'create' ? 'New Appointment' : ''}
            {mode === 'edit' ? 'Edit Appointment' : ''}
            {mode === 'view' ? 'Appointment Details' : ''}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {mode === 'create' ? 'Schedule a new appointment for a client' : ''}
            {mode === 'edit' ? 'Update appointment information' : ''}
            {mode === 'view' ? 'View appointment details' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name" className="text-sm font-medium">
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                  placeholder="John Doe"
                  required
                  disabled={isReadOnly}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_email" className="text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                  disabled={isReadOnly}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_phone" className="text-sm font-medium">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  required
                  disabled={isReadOnly}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type" className="text-sm font-medium">
                  Service Type <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.service_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="consultation" className="hover:bg-gray-50 cursor-pointer">Consultation</SelectItem>
                    <SelectItem value="tattoo_session" className="hover:bg-gray-50 cursor-pointer">Tattoo Session</SelectItem>
                    <SelectItem value="touch_up" className="hover:bg-gray-50 cursor-pointer">Touch Up</SelectItem>
                    <SelectItem value="removal" className="hover:bg-gray-50 cursor-pointer">Removal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !date && "text-muted-foreground"
                      )}
                      disabled={isReadOnly}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment_time" className="text-sm font-medium">
                  Time
                </Label>
                <Input
                  id="appointment_time"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, appointment_time: e.target.value }))}
                  disabled={isReadOnly}
                  className="h-9"
                />
              </div>

              {mode !== 'create' ? (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      <SelectItem value="pending" className="hover:bg-gray-50 cursor-pointer">Pending</SelectItem>
                      <SelectItem value="confirmed" className="hover:bg-gray-50 cursor-pointer">Confirmed</SelectItem>
                      <SelectItem value="in_progress" className="hover:bg-gray-50 cursor-pointer">In Progress</SelectItem>
                      <SelectItem value="completed" className="hover:bg-gray-50 cursor-pointer">Completed</SelectItem>
                      <SelectItem value="cancelled" className="hover:bg-gray-50 cursor-pointer">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                  disabled={isReadOnly}
                  className="resize-none"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-border/50">
          <div>
            {mode === 'view' && appointment ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={isLoading}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Cancel Appointment
              </Button>
            ) : null}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="px-4"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            
            {!isReadOnly ? (
              <Button 
                type="submit" 
                disabled={isLoading}
                className={cn(
                  "px-6",
                  mode === 'create' && "bg-gradient-to-br from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                )}
                onClick={(e) => {
                  e.preventDefault()
                  handleSubmit(e as React.FormEvent)
                }}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {mode === 'create' ? 'Create' : 'Update'} Appointment
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}