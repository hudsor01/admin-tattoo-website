"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Edit, Eye, Mail, Phone, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import type { ClientResponse } from '@/types/database'

// Fetch customers from API
const fetchCustomers = async () => {
  const response = await fetch('/api/admin/customers')
  if (!response.ok) throw new Error('Failed to fetch customers')
  return response.json()
}

interface CustomersListProps {
  onView: (customer: ClientResponse) => void
  onEdit: (customer: ClientResponse) => void
}

export function CustomersList({ onView, onEdit }: CustomersListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    refetchInterval: 60000, // Refresh every minute
  })

  // Ensure customers data is always an array before filtering
  const safeCustomersData = Array.isArray(customers?.data) ? customers.data : []
  const filteredCustomers = safeCustomersData.filter((customer: ClientResponse) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm)
    )
  })

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Manage your client database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-4">
            Failed to load customers. Please try again later.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Manage your client database</CardDescription>
        </div>
        
        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              {['customer-1', 'customer-2', 'customer-3', 'customer-4', 'customer-5', 'customer-6', 'customer-7', 'customer-8'].map((customerId) => (
                <div key={`customer-skeleton-${customerId}`} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="space-y-3">
              {filteredCustomers.map((customer: ClientResponse) => (
                <CustomerCard 
                  key={customer.id} 
                  customer={customer}
                  onView={() => onView(customer)}
                  onEdit={() => onEdit(customer)}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div>
                <div className="text-lg font-medium mb-2">
                  {searchTerm ? "No customers found matching your search" : "No customers found"}
                </div>
                <div className="text-sm">
                  {searchTerm ? "Try adjusting your search terms" : "Use the + button next to Customers in the sidebar to add your first customer"}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer with pagination info - outside scrollable area */}
        {!isLoading && filteredCustomers.length > 0 ? <div className="text-center text-sm text-muted-foreground pt-4 mt-4 border-t">
            Showing {filteredCustomers.length} of {customers?.data?.length || 0} customers
          </div> : null}
      </CardContent>
    </Card>
  )
}

function CustomerCard({ 
  customer, 
  onView, 
  onEdit 
}: { 
  customer: ClientResponse
  onView: () => void
  onEdit: () => void
}) {
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const calculateAge = (dateOfBirth: string | Date) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group">
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-sm font-medium text-orange-600">
              {getInitials(customer.firstName, customer.lastName)}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {customer.firstName} {customer.lastName}
            </p>
            {customer.preferredArtist ? <Badge variant="secondary" className="text-xs">
                Prefers {customer.preferredArtist}
              </Badge> : null}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{customer.email}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>{customer.phone}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Age {calculateAge(customer.dateOfBirth)}</span>
            </div>
          </div>
          
          {(customer.allergies?.length > 0 || customer.medicalConds?.length > 0) ? <div className="mt-1">
              <Badge variant="outline" className="text-xs text-amber-600 bg-amber-50">
                Medical conditions noted
              </Badge>
            </div> : null}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Calendar className="h-3 w-3" />
            <span>Joined {formatDate(customer.createdAt)}</span>
          </div>
          <div className="text-xs text-gray-500">
            {customer.sessions?.length || 0} sessions
          </div>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View Customer Details" onClick={onView}>
            <Eye className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Edit Customer" onClick={onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}