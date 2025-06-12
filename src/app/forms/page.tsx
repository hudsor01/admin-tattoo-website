"use client"

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
import { FileText, Plus, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"

// Fetch forms and waivers from API
const fetchForms = async () => {
  const response = await fetch('/api/admin/forms')
  if (!response.ok) throw new Error('Failed to fetch forms')
  return response.json()
}

export default function FormsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: forms, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: fetchForms,
    refetchInterval: 60000, // Refresh every minute
  })

  const filteredForms = forms?.filter((form: any) =>
    form.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.formType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.status?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const completedForms = forms?.filter((f: any) => f.status === 'completed').length || 0
  const pendingForms = forms?.filter((f: any) => f.status === 'pending').length || 0
  const totalForms = forms?.length || 0

  return (

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
                      Ink37 Tattoos
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Forms & Waivers</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Forms & Waivers</h1>
                <p className="text-muted-foreground">
                  Manage client forms, waivers, and documentation
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export All
                </Button>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  New Form
                </Button>
              </div>
            </div>

            {/* Form Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Forms
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{totalForms}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    All forms and waivers
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Review
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{pendingForms}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{completedForms}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Reviewed and filed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search forms..."
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

            {/* Forms List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Forms</CardTitle>
                <CardDescription>
                  All client forms and waivers with their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : filteredForms.length > 0 ? (
                    filteredForms.map((form: any) => (
                      <FormItem key={form.id} form={form} />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No forms found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery ? 'No forms match your search.' : 'Start by creating your first form template.'}
                      </p>
                      {!searchQuery && (
                        <Button className="bg-orange-500 hover:bg-orange-600">
                          <Plus className="mr-2 h-4 w-4" />
                          Create First Form
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

  )
}

function FormItem({ form }: { form: any }) {
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getFormTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'waiver':
        return '⚖️'
      case 'consent':
        return '✅'
      case 'medical':
        return '🏥'
      case 'aftercare':
        return '🩹'
      default:
        return '📋'
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={form.clientAvatar} />
          <AvatarFallback>
            {form.clientName?.split(' ').map((n: string) => n[0]).join('') || 'CN'}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">
              {form.clientName || 'Unknown Client'}
            </h4>
            {getStatusIcon(form.status)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{getFormTypeIcon(form.formType)}</span>
            <span>{form.formType || 'General Form'}</span>
            <span>•</span>
            <span>
              {form.submittedDate ?
                new Date(form.submittedDate).toLocaleDateString() :
                'Not submitted'
              }
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge className={getStatusColor(form.status)}>
          {form.status || 'Draft'}
        </Badge>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
