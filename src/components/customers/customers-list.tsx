"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, Phone, Calendar, User, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

// Fetch customers from API
const fetchCustomers = async () => {
  const response = await fetch('/api/admin/customers')
  if (!response.ok) throw new Error('Failed to fetch customers')
  return response.json()
}

export function CustomersList() {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    refetchInterval: 60000, // Refresh every minute
  })

  const filteredCustomers = customers?.data?.filter((customer: any) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm)
    )
  }) || []

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Manage your client database</CardDescription>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
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
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
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
            {filteredCustomers.map((customer: any) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
            
            {/* Pagination info */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              Showing {filteredCustomers.length} of {customers?.data?.length || 0} customers
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? "No customers found matching your search" : "No customers found"}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CustomerCard({ customer }: { customer: any }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const calculateAge = (dateOfBirth: string) => {
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
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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
            {customer.preferredArtist && (
              <Badge variant="secondary" className="text-xs">
                Prefers {customer.preferredArtist}
              </Badge>
            )}
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
          
          {(customer.allergies?.length > 0 || customer.medicalConds?.length > 0) && (
            <div className="mt-1">
              <Badge variant="outline" className="text-xs text-amber-600 bg-amber-50">
                Medical conditions noted
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <Calendar className="h-3 w-3" />
          <span>Joined {formatDate(customer.createdAt)}</span>
        </div>
        <div className="text-xs text-gray-500">
          {customer.sessions?.length || 0} sessions
        </div>
      </div>
    </div>
  )
}