"use client"

import { AdminRoute } from "@/components/auth/admin-route"
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
import { Download, FileBarChart, Users, CreditCard, Calendar, TrendingUp } from "lucide-react"

export default function ReportsPage() {
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
                    <BreadcrumbPage>Reports</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                <p className="text-muted-foreground">
                  Generate and export business reports for customers, payments, and appointments
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>

            {/* Reports Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Customer Report */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Customer Report</CardTitle>
                      <CardDescription>Client data and history</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete customer database with contact info, session history, and preferences.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <FileBarChart className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Report */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Payment Report</CardTitle>
                      <CardDescription>Revenue and transactions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Detailed payment history, revenue trends, and outstanding balances.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <FileBarChart className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Report */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Appointment Report</CardTitle>
                      <CardDescription>Booking and scheduling data</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Appointment history, booking trends, and scheduling analytics.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      <FileBarChart className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Analytics */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle>Revenue Analytics</CardTitle>
                      <CardDescription>Financial performance</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Monthly revenue trends, profit margins, and financial insights.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      <FileBarChart className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Artist Performance */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Users className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <CardTitle>Artist Performance</CardTitle>
                      <CardDescription>Individual artist metrics</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Artist productivity, client satisfaction, and revenue by artist.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-pink-600 hover:bg-pink-700">
                      <FileBarChart className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Report Builder */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-dashed border-orange-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileBarChart className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle>Custom Report</CardTitle>
                      <CardDescription>Build your own report</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create custom reports with specific date ranges and data filters.
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    <FileBarChart className="mr-2 h-4 w-4" />
                    Build Custom Report
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Report Summary</CardTitle>
                <CardDescription>Quick overview of available data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">50</div>
                    <div className="text-sm text-muted-foreground">Total Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">$1,300</div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">26</div>
                    <div className="text-sm text-muted-foreground">Appointments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">4.2</div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminRoute>
  )
}