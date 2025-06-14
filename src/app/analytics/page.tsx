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
import { Badge } from "@/components/ui/badge"
import { DollarSign, Users, Calendar, TrendingUp, Download, Filter, Activity, BarChart3, PieChart, Target } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive"


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
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-black text-foreground tracking-tight">Analytics</h1>
                          <p className="text-muted-foreground">
                            Track performance metrics and business insights
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                      </Button>
                      <Button className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                        <Download className="h-4 w-4" />
                        Export Report
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Error State */}
                {error && (
                  <div className="px-6 lg:px-8">
                    <div className="bg-destructive/15 border border-destructive/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-destructive">
                        <span className="font-medium">Failed to load analytics data</span>
                      </div>
                      <p className="text-destructive/70 text-sm mt-1">
                        Please check your connection and try again. If the problem persists, contact support.
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Metrics */}
                <div className="px-6 lg:px-8">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      title="Total Revenue"
                      value={analytics?.totalRevenue || 0}
                      change={analytics?.revenueChange || 0}
                      icon={<DollarSign className="h-5 w-5" />}
                      format="currency"
                      isLoading={isLoading}
                      color="green"
                    />
                    <MetricCard
                      title="Active Clients"
                      value={analytics?.activeClients || 0}
                      change={analytics?.clientsChange || 0}
                      icon={<Users className="h-5 w-5" />}
                      format="number"
                      isLoading={isLoading}
                      color="blue"
                    />
                    <MetricCard
                      title="Sessions This Month"
                      value={analytics?.monthlySessions || 0}
                      change={analytics?.sessionsChange || 0}
                      icon={<Calendar className="h-5 w-5" />}
                      format="number"
                      isLoading={isLoading}
                      color="purple"
                    />
                    <MetricCard
                      title="Average Session Value"
                      value={analytics?.avgSessionValue || 0}
                      change={analytics?.avgValueChange || 0}
                      icon={<TrendingUp className="h-5 w-5" />}
                      format="currency"
                      isLoading={isLoading}
                      color="orange"
                    />
                  </div>
                </div>

                {/* Main Chart */}
                <div className="px-6 lg:px-8">
                  <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
                    <ChartAreaInteractive />
                  </Suspense>
                </div>

                {/* Analytics Grid */}
                <div className="px-6 lg:px-8">
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Top Performing Artists */}
                    <Card className="bg-card border-border/30 shadow-lg shadow-black/5">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-500/10">
                            <Target className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold">Top Artists</CardTitle>
                            <CardDescription>
                              Artists by revenue this month
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <TopArtists artists={analytics?.topArtists} isLoading={isLoading} />
                      </CardContent>
                    </Card>

                    {/* Session Types */}
                    <Card className="bg-card border-border/30 shadow-lg shadow-black/5">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <PieChart className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold">Session Types</CardTitle>
                            <CardDescription>
                              Distribution of session types
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <SessionTypesChart data={analytics?.sessionTypes} isLoading={isLoading} />
                      </CardContent>
                    </Card>

                    {/* Client Acquisition */}
                    <Card className="bg-card border-border/30 shadow-lg shadow-black/5">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Activity className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold">Client Growth</CardTitle>
                            <CardDescription>
                              New clients over time
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ClientAcquisitionChart data={analytics?.clientAcquisition} isLoading={isLoading} />
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

function MetricCard({ title, value, change, icon, format, isLoading, color }: {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  format: 'currency' | 'number'
  isLoading: boolean
  color: 'green' | 'blue' | 'purple' | 'orange'
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

  const colorClasses = {
    green: 'bg-green-500/10 text-green-600',
    blue: 'bg-blue-500/10 text-blue-600',
    purple: 'bg-purple-500/10 text-purple-600',
    orange: 'bg-orange-500/10 text-orange-600'
  }

  const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'
  const changePrefix = change > 0 ? '+' : ''

  return (
    <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-foreground mb-1">{formatValue(value)}</div>
            <div className="flex items-center gap-1">
              <Badge variant={change > 0 ? "default" : change < 0 ? "destructive" : "secondary"} className="text-xs px-2 py-0">
                {changePrefix}{change.toFixed(1)}%
              </Badge>
              <p className="text-xs text-muted-foreground">from last month</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function TopArtists({ artists, isLoading }: { artists: Array<{ artistId: string; artistName: string; sessions: number; revenue: number; avgRating: number }>, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!artists?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No artist data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {artists.slice(0, 3).map((artist, index) => (
        <div key={artist.artistId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
              'bg-gradient-to-r from-orange-400 to-red-500'
            }`}>
              {index + 1}
            </div>
            <span className="font-medium text-foreground">{artist.artistName}</span>
          </div>
          <span className="font-bold text-foreground">${artist.revenue?.toLocaleString() || 0}</span>
        </div>
      ))}
    </div>
  )
}

function SessionTypesChart({ data, isLoading }: { data: Array<{ type: string; count: number }>, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!data?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No session data available</p>
      </div>
    )
  }

  // Calculate total and percentages
  const total = data.reduce((sum, type) => sum + type.count, 0);
  const dataWithPercentages = data.map(type => ({
    ...type,
    percentage: total > 0 ? Math.round((type.count / total) * 100) : 0
  }));

  return (
    <div className="space-y-4">
      {dataWithPercentages.slice(0, 3).map((type, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{type.type}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">{type.count}</span>
              <Badge variant="secondary" className="text-xs">{type.percentage}%</Badge>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${type.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ClientAcquisitionChart({ data, isLoading }: { data: Array<{ month: string; newClients: number; returningClients: number }>, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <Skeleton className="h-4 w-16" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!data?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No client data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.slice(-4).map((item, index) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <span className="font-medium text-foreground">{item.month}</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{item.newClients || 0}</span>
            </div>
            <span className="text-sm text-muted-foreground">new</span>
          </div>
        </div>
      ))}
    </div>
  )
}
