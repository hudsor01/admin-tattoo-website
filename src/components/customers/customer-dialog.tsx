"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ClientResponse } from '@/types/database'

interface Customer {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  emergencyName: string
  emergencyPhone: string
  emergencyRel: string
  allergies: string[]
  medicalConds: string[]
  preferredArtist?: string
}

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: ClientResponse
  mode: 'create' | 'edit' | 'view'
}

export function CustomerDialog({ open, onOpenChange, customer, mode }: CustomerDialogProps) {
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    customer?.dateOfBirth ? new Date(customer.dateOfBirth) : undefined
  )
  const [formData, setFormData] = useState<Customer>({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    dateOfBirth: customer?.dateOfBirth ? 
      (customer.dateOfBirth instanceof Date ? format(customer.dateOfBirth, 'yyyy-MM-dd') : customer.dateOfBirth) : '',
    emergencyName: customer?.emergencyName || '',
    emergencyPhone: customer?.emergencyPhone || '',
    emergencyRel: customer?.emergencyRel || '',
    allergies: customer?.allergies || [],
    medicalConds: customer?.medicalConds || [],
    preferredArtist: customer?.preferredArtist || ''
  })

  const [allergyInput, setAllergyInput] = useState('')
  const [medicalInput, setMedicalInput] = useState('')

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: Customer) => {
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create customer')
      return response.json()
    },
    onSuccess: () => {
      toast.success('Customer created successfully')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onOpenChange(false)
      resetForm()
    },
    onError: () => {
      toast.error('Failed to create customer')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Customer) => {
      const response = await fetch(`/api/admin/customers/${customer?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update customer')
      return response.json()
    },
    onSuccess: () => {
      toast.success('Customer updated successfully')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to update customer')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/customers/${customer?.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete customer')
      return response.json()
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to delete customer')
    }
  })

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRel: '',
      allergies: [],
      medicalConds: [],
      preferredArtist: ''
    })
    setDateOfBirth(undefined)
    setAllergyInput('')
    setMedicalInput('')
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
    setDateOfBirth(selectedDate)
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        dateOfBirth: format(selectedDate, 'yyyy-MM-dd')
      }))
    }
  }

  const addAllergy = () => {
    if (allergyInput.trim() && !formData.allergies.includes(allergyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergyInput.trim()]
      }))
      setAllergyInput('')
    }
  }

  const removeAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }))
  }

  const addMedicalCondition = () => {
    if (medicalInput.trim() && !formData.medicalConds.includes(medicalInput.trim())) {
      setFormData(prev => ({
        ...prev,
        medicalConds: [...prev.medicalConds, medicalInput.trim()]
      }))
      setMedicalInput('')
    }
  }

  const removeMedicalCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      medicalConds: prev.medicalConds.filter(c => c !== condition)
    }))
  }

  const isReadOnly = mode === 'view'
  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-4xl max-h-[90vh] overflow-hidden p-0",
        "bg-white dark:bg-card text-gray-900 dark:text-card-foreground",
        "shadow-2xl border border-gray-200 dark:border-border"
      )}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-border/50">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-md bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-sm">
              <Plus className="h-4 w-4" />
            </div>
            {mode === 'create' ? 'New Customer' : ''}
            {mode === 'edit' ? 'Edit Customer' : ''}
            {mode === 'view' ? 'Customer Details' : ''}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {mode === 'create' ? 'Add a new customer to your database' : ''}
            {mode === 'edit' ? 'Update customer information' : ''}
            {mode === 'view' ? 'View customer details and history' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base mb-1">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    required
                    disabled={isReadOnly}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                    disabled={isReadOnly}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    disabled={isReadOnly}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    required
                    disabled={isReadOnly}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Date of Birth
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9",
                          !dateOfBirth && "text-muted-foreground"
                        )}
                        disabled={isReadOnly}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg">
                      <Calendar
                        mode="single"
                        selected={dateOfBirth}
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base mb-1">Emergency Contact</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName" className="text-sm font-medium">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyName: e.target.value }))}
                    placeholder="Jane Doe"
                    required
                    disabled={isReadOnly}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone" className="text-sm font-medium">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                    placeholder="(555) 987-6543"
                    required
                    disabled={isReadOnly}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyRel" className="text-sm font-medium">
                    Relationship <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emergencyRel"
                    value={formData.emergencyRel}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyRel: e.target.value }))}
                    placeholder="Mother, Friend, etc."
                    required
                    disabled={isReadOnly}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base mb-1">Medical Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Allergies</Label>
                  {!isReadOnly ? (
                    <div className="flex gap-2">
                      <Input
                        value={allergyInput}
                        onChange={(e) => setAllergyInput(e.target.value)}
                        placeholder="Add allergy..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addAllergy()
                          }
                        }}
                        className="flex-1 h-9"
                      />
                      <Button type="button" onClick={addAllergy} variant="outline" size="sm" className="h-9 px-3">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                  {formData.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.allergies.map((allergy) => (
                        <Badge key={allergy} variant="secondary" className="text-xs">
                          {allergy}
                          {!isReadOnly ? (
                            <X
                              className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                              onClick={() => removeAllergy(allergy)}
                            />
                          ) : null}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Medical Conditions</Label>
                  {!isReadOnly ? (
                    <div className="flex gap-2">
                      <Input
                        value={medicalInput}
                        onChange={(e) => setMedicalInput(e.target.value)}
                        placeholder="Add condition..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addMedicalCondition()
                          }
                        }}
                        className="flex-1 h-9"
                      />
                      <Button type="button" onClick={addMedicalCondition} variant="outline" size="sm" className="h-9 px-3">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                  {formData.medicalConds.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.medicalConds.map((condition) => (
                        <Badge key={condition} variant="secondary" className="text-xs">
                          {condition}
                          {!isReadOnly ? (
                            <X
                              className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                              onClick={() => removeMedicalCondition(condition)}
                            />
                          ) : null}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-border/50">
          <div>
            {mode === 'view' && customer ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={isLoading}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete Customer
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
                className="px-6"
                onClick={(e) => {
                  e.preventDefault()
                  handleSubmit(e as React.FormEvent)
                }}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {mode === 'create' ? 'Create' : 'Update'} Customer
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}