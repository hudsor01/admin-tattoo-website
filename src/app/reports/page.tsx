"use client"

import { AdminRoute } from "@/components/auth/admin-route"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileBarChart, Users, CreditCard, Calendar, TrendingUp, BarChart3, FileText, Target, PieChart } from "lucide-react"

export default function ReportsPage() {
  return (
    <AdminRoute>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Page Header */}
                <div className="px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-black text-foreground tracking-tight">Reports</h1>
                          <p className="text-muted-foreground">
                            Generate and export business reports for customers, payments, and appointments
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export All
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Report Summary - Moved to top */}
                <div className="px-6 lg:px-8">
                  <Card className="bg-card border-border/30 shadow-lg shadow-black/5">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold">Report Summary</CardTitle>
                          <CardDescription>Quick overview of available data</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <div className="text-2xl font-bold text-blue-600">0</div>
                          <div className="text-sm text-muted-foreground">Total Customers</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <div className="text-2xl font-bold text-green-600">$0</div>
                          <div className="text-sm text-muted-foreground">Total Revenue</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <div className="text-2xl font-bold text-purple-600">0</div>
                          <div className="text-sm text-muted-foreground">Appointments</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <div className="text-2xl font-bold text-orange-600">0.0</div>
                          <div className="text-sm text-muted-foreground">Avg Rating</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Reports Grid */}
                <div className="px-6 lg:px-8">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Customer Report */}
                    <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold">Customer Report</CardTitle>
                            <CardDescription className="text-sm">Client data and history</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Complete customer database with contact info, session history, and preferences.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button size="sm" className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700">
                            <FileBarChart className="h-4 w-4" />
                            View Report
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-2">
                            <Download className="h-4 w-4" />
                            Export CSV
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Report */}
                    <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <CreditCard className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold">Payment Report</CardTitle>
                            <CardDescription className="text-sm">Revenue and transactions</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Detailed payment history, revenue trends, and outstanding balances.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button size="sm" className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                            <FileBarChart className="h-4 w-4" />
                            View Report
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-2">
                            <Download className="h-4 w-4" />
                            Export CSV
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Appointment Report */}
                    <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Calendar className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold">Appointment Report</CardTitle>
                            <CardDescription className="text-sm">Booking and scheduling data</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Appointment history, booking trends, and scheduling analytics.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button size="sm" className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700">
                            <FileBarChart className="h-4 w-4" />
                            View Report
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-2">
                            <Download className="h-4 w-4" />
                            Export CSV
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Revenue Analytics */}
                    <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-500/10 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold">Revenue Analytics</CardTitle>
                            <CardDescription className="text-sm">Financial performance</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Monthly revenue trends, profit margins, and financial insights.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button size="sm" className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700">
                            <FileBarChart className="h-4 w-4" />
                            View Analytics
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-2">
                            <Download className="h-4 w-4" />
                            Export PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Artist Performance */}
                    <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-pink-500/10 rounded-lg">
                            <Target className="h-5 w-5 text-pink-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold">Artist Performance</CardTitle>
                            <CardDescription className="text-sm">Individual artist metrics</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Artist productivity, client satisfaction, and revenue by artist.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button size="sm" className="flex-1 gap-2 bg-pink-600 hover:bg-pink-700">
                            <FileBarChart className="h-4 w-4" />
                            View Report
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-2">
                            <Download className="h-4 w-4" />
                            Export CSV
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Custom Report Builder */}
                    <Card className="bg-card border-2 border-dashed border-border/50 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <PieChart className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold">Custom Report</CardTitle>
                            <CardDescription className="text-sm">Build your own report</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Create custom reports with specific date ranges and data filters.
                        </p>
                        <Button size="sm" variant="outline" className="w-full gap-2">
                          <PieChart className="h-4 w-4" />
                          Build Custom Report
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminRoute>
  )
}