"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, BarChart3, Calendar, DollarSign, Download, Filter, TrendingUp, Users } from "lucide-react"
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
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Page Header */}
          <div className="px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-brand-gradient">
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
                <Button className="gap-2 bg-brand-gradient-hover">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error ? <div className="px-6 lg:px-8">
              <div className="bg-destructive/15 border border-destructive/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="font-medium">Failed to load analytics data</span>
                </div>
                <p className="text-destructive/70 text-sm mt-1">
                  Please check your connection and try again. If the problem persists, contact support.
                </p>
              </div>
            </div> : null}

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
                color="blue"
              />
              <MetricCard
                title="Average Session Value"
                value={analytics?.avgSessionValue || 0}
                change={analytics?.avgValueChange || 0}
                icon={<TrendingUp className="h-5 w-5" />}
                format="currency"
                isLoading={isLoading}
                color="blue"
              />
            </div>
          </div>

          {/* Charts Grid */}
          <div className="px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Main Revenue Chart */}
              <div className="lg:col-span-1">
                <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
                  <ChartAreaInteractive />
                </Suspense>
              </div>

              {/* Client Growth Chart */}
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
    green: 'bg-success-soft text-success',
    blue: 'bg-info-soft text-info',
    purple: 'bg-accent/10 text-accent-foreground',
    orange: 'bg-brand-gradient-soft text-primary'
  }

  const changePrefix = change > 0 ? '+' : ''

  return (
    <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {/* eslint-disable-next-line security/detect-object-injection */}
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

function ClientAcquisitionChart({ data, isLoading }: { 
  data?: Array<{ month: string; newClients: number; returningClients: number }> 
  isLoading: boolean 
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {['top-section', 'mid-upper', 'mid-lower', 'bottom-section'].map((sectionKey) => (
          <div key={`analytics-loading-${sectionKey}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
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
      {data.slice(-4).map((item) => (
        <div key={`analytics-month-${item.month}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <span className="font-medium text-foreground">{item.month}</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-info rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{item.newClients || 0}</span>
            </div>
            <span className="text-sm text-muted-foreground">new</span>
          </div>
        </div>
      ))}
    </div>
  )
}
