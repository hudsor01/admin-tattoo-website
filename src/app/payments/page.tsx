"use client"

import { AdminRoute } from "@/lib/user"
import { AppSidebar } from "@/components/layout/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, Plus, Search, Filter, Download, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import Link from "next/link"

// Fetch payments from API
const fetchPayments = async () => {
  const response = await fetch('/api/admin/payments')
  if (!response.ok) throw new Error('Failed to fetch payments')
  return response.json()
}

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const filteredPayments = payments?.filter((payment: any) =>
    payment.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.sessionType?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const totalRevenue = payments?.reduce((sum: number, payment: any) =>
    payment.status === 'completed' ? sum + (payment.amount || 0) : sum, 0
  ) || 0

  const pendingPayments = payments?.filter((p: any) => p.status === 'pending').length || 0
  const completedPayments = payments?.filter((p: any) => p.status === 'completed').length || 0

  return (
    <AdminRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/dashboard">
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Payments</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                  <p className="text-muted-foreground">
                    Track and manage client payments and transactions
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                </div>
              </div>

              {/* Payment Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      From completed payments
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pending Payments
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">{pendingPayments}</div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Awaiting confirmation
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Completed Payments
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">{completedPayments}</div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Successfully processed
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>

              {/* Payments List */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>
                    All payment transactions and their current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <>
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-6 w-20" />
                            </div>
                          </div>
                        ))}
                      </>
                    ) : filteredPayments.length > 0 ? (
                      filteredPayments.map((payment: any) => (
                        <PaymentItem key={payment.id} payment={payment} />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No payments found</h3>
                        <p className="text-muted-foreground mb-4">
                          {searchQuery ? 'No payments match your search.' : 'Start by recording your first payment.'}
                        </p>
                        {!searchQuery && (
                          <Button className="bg-orange-500 hover:bg-orange-600">
                            <Plus className="mr-2 h-4 w-4" />
                            Record First Payment
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </SidebarProvider>
    </AdminRoute>
  )
}

function PaymentItem({ payment }: { payment: any }) {
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-orange-50/50 hover:border-orange-200 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={payment.clientAvatar} />
          <AvatarFallback>
            {payment.clientName?.split(' ').map((n: string) => n[0]).join('') || 'CN'}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <Link 
              href={`/customers?search=${encodeURIComponent(payment.clientName || '')}`}
              className="font-medium hover:text-orange-600 hover:underline transition-colors"
            >
              {payment.clientName || 'Unknown Client'}
            </Link>
            {getStatusIcon(payment.status)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{payment.sessionType || 'Tattoo Session'}</span>
            <span>•</span>
            <span>{payment.transactionId || 'No ID'}</span>
            <span>•</span>
            <span>
              {payment.paymentDate ?
                new Date(payment.paymentDate).toLocaleDateString() :
                'No date'
              }
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-lg">
          ${payment.amount?.toLocaleString() || '0'}
        </div>
        <Badge className={getStatusColor(payment.status)}>
          {payment.status || 'Unknown'}
        </Badge>
      </div>
    </div>
  )
}
