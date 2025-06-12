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
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive"
import { DollarSign, Users, Calendar, TrendingUp, Download, Filter } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"


// Fetch analytics data from API
const fetchAnalytics = async () => {
  const response = await fetch('/api/admin/analytics')
  if (!response.ok) throw new Error('Failed to fetch analytics data')
  return response.json()
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    refetchInterval: 60000, // Refresh every minute
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

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
                    <BreadcrumbPage>Analytics</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Analytics</h1>
                <p className="text-lg text-gray-600 font-medium">
                  Track performance metrics and business insights
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="shadow-sm hover:shadow-md transition-shadow">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-300" size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-800">
                  <span className="font-medium">Failed to load analytics data</span>
                </div>
                <p className="text-red-600 text-sm mt-1">
                  Please check your connection and try again. If the problem persists, contact support.
                </p>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value={analytics?.totalRevenue || 1300}
                change={analytics?.revenueChange || 12.5}
                icon={<DollarSign className="h-6 w-6 text-green-600" />}
                format="currency"
                isLoading={isLoading}
                gradient="from-green-500 to-emerald-600"
              />
              <MetricCard
                title="Active Clients"
                value={analytics?.activeClients || 50}
                change={analytics?.clientsChange || 8.2}
                icon={<Users className="h-6 w-6 text-blue-600" />}
                format="number"
                isLoading={isLoading}
                gradient="from-blue-500 to-cyan-600"
              />
              <MetricCard
                title="Sessions This Month"
                value={analytics?.monthlySessions || 26}
                change={analytics?.sessionsChange || 15.3}
                icon={<Calendar className="h-6 w-6 text-purple-600" />}
                format="number"
                isLoading={isLoading}
                gradient="from-purple-500 to-violet-600"
              />
              <MetricCard
                title="Average Session Value"
                value={analytics?.avgSessionValue || 325}
                change={analytics?.avgValueChange || 5.7}
                icon={<TrendingUp className="h-6 w-6 text-orange-600" />}
                format="currency"
                isLoading={isLoading}
                gradient="from-orange-500 to-red-600"
              />
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-5 rounded-lg" />
                <CardHeader className="relative">
                  <CardTitle className="text-xl font-bold text-gray-900">Revenue Overview</CardTitle>
                  <CardDescription className="text-gray-600">
                    Revenue and session trends over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2 relative">
                  <ChartAreaInteractive />
                </CardContent>
              </Card>
              <Card className="col-span-3 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-600 opacity-5 rounded-lg" />
                <CardHeader className="relative">
                  <CardTitle className="text-xl font-bold text-gray-900">Top Performing Artists</CardTitle>
                  <CardDescription className="text-gray-600">
                    Artists by revenue generated this month
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <TopArtists artists={analytics?.topArtists} isLoading={isLoading} />
                </CardContent>
              </Card>
            </div>

            {/* Additional Analytics */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-600 opacity-5 rounded-lg" />
                <CardHeader className="relative">
                  <CardTitle className="text-xl font-bold text-gray-900">Session Types Breakdown</CardTitle>
                  <CardDescription className="text-gray-600">
                    Distribution of different tattoo session types
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <SessionTypesChart data={analytics?.sessionTypes} isLoading={isLoading} />
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 opacity-5 rounded-lg" />
                <CardHeader className="relative">
                  <CardTitle className="text-xl font-bold text-gray-900">Client Acquisition</CardTitle>
                  <CardDescription className="text-gray-600">
                    New clients acquired over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <ClientAcquisitionChart data={analytics?.clientAcquisition} isLoading={isLoading} />
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminRoute>
  )
}

function MetricCard({ title, value, change, icon, format, isLoading, gradient }: {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  format: 'currency' | 'number'
  isLoading: boolean
  gradient: string
}) {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      if (val >= 1000000) {
        return `$${(val / 1000000).toFixed(1)}M`
      } else if (val >= 1000) {
        return `$${(val / 1000).toFixed(0)}K`
      }
      return `$${val.toLocaleString()}`
    }
    return val.toLocaleString()
  }

  const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
  const changePrefix = change > 0 ? '+' : ''

  return (
    <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
        <CardTitle className="text-sm font-semibold text-gray-700">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-10`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-gray-900 mb-1">{formatValue(value)}</div>
            <div className="flex items-center gap-1">
              <p className={`text-sm font-medium ${changeColor}`}>
                {changePrefix}{change.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">from last month</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function TopArtists({ artists, isLoading }: { artists: any[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!artists?.length) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No artist data available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {artists.slice(0, 5).map((artist, index) => (
        <div key={artist.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-orange-50 hover:to-pink-50 transition-all duration-200 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
              index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
              'bg-gradient-to-r from-blue-400 to-blue-500'
            }`}>
              #{index + 1}
            </div>
            <span className="font-semibold text-gray-800">{artist.name}</span>
          </div>
          <span className="text-lg font-bold text-gray-900">${artist.revenue?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function SessionTypesChart({ data, isLoading }: { data: any[], isLoading: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-32 w-full" />
  }

  if (!data?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No session data available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((type, index) => (
        <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">{type.name}</span>
            <span className="text-lg font-bold text-gray-900">{type.count}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${type.percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">{type.percentage}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ClientAcquisitionChart({ data, isLoading }: { data: any[], isLoading: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-32 w-full" />
  }

  if (!data?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No client acquisition data available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.slice(-6).map((item, index) => (
        <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 hover:from-yellow-100 hover:to-orange-100 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">{item.month}</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{item.newClients}</span>
              </div>
              <span className="text-sm font-medium text-gray-600">new clients</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
