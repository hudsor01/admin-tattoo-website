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
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    refetchInterval: 60000, // Refresh every minute
  })

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
                    <BreadcrumbPage>Analytics</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">
                  Track performance metrics and business insights
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button className="bg-orange-500 hover:bg-orange-600" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value={analytics?.totalRevenue || 0}
                change={analytics?.revenueChange || 0}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard
                title="Active Clients"
                value={analytics?.activeClients || 0}
                change={analytics?.clientsChange || 0}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                format="number"
                isLoading={isLoading}
              />
              <MetricCard
                title="Sessions This Month"
                value={analytics?.monthySessions || 0}
                change={analytics?.sessionsChange || 0}
                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                format="number"
                isLoading={isLoading}
              />
              <MetricCard
                title="Average Session Value"
                value={analytics?.avgSessionValue || 0}
                change={analytics?.avgValueChange || 0}
                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                format="currency"
                isLoading={isLoading}
              />
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>
                    Revenue and session trends over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ChartAreaInteractive />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Top Performing Artists</CardTitle>
                  <CardDescription>
                    Artists by revenue generated this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TopArtists artists={analytics?.topArtists} isLoading={isLoading} />
                </CardContent>
              </Card>
            </div>

            {/* Additional Analytics */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Session Types Breakdown</CardTitle>
                  <CardDescription>
                    Distribution of different tattoo session types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SessionTypesChart data={analytics?.sessionTypes} isLoading={isLoading} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Client Acquisition</CardTitle>
                  <CardDescription>
                    New clients acquired over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ClientAcquisitionChart data={analytics?.clientAcquisition} isLoading={isLoading} />
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

  )
}

function MetricCard({ title, value, change, icon, format, isLoading }: {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  format: 'currency' | 'number'
  isLoading: boolean
}) {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return `$${val.toLocaleString()}`
    }
    return val.toLocaleString()
  }

  const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
  const changePrefix = change > 0 ? '+' : ''

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{formatValue(value)}</div>
            <p className={`text-xs ${changeColor}`}>
              {changePrefix}{change.toFixed(1)}% from last month
            </p>
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
    <div className="space-y-4">
      {artists.slice(0, 5).map((artist, index) => (
        <div key={artist.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">#{index + 1}</span>
            <span className="text-sm">{artist.name}</span>
          </div>
          <span className="text-sm font-medium">${artist.revenue?.toLocaleString()}</span>
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
    <div className="space-y-3">
      {data.map((type, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm">{type.name}</span>
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${type.percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium">{type.count}</span>
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
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm">{item.month}</span>
          <span className="text-sm font-medium">{item.newClients} new clients</span>
        </div>
      ))}
    </div>
  )
}
