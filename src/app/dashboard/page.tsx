"use client"

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowDownRight, ArrowUpRight, Calendar, DollarSign, Star, Users } from "lucide-react"
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive"
import { RecentSessions } from "@/components/dashboard/recent-sessions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

const fetchDashboardStats = async () => {
  const response = await fetch('/api/admin/dashboard/stats')
  if (!response.ok) throw new Error('Failed to fetch dashboard stats')
  const data = await response.json()
  return data.data || data
}

interface StatCard {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  description: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function DashboardPage() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats
  })

  const stats: StatCard[] = [
    {
      title: "Total Revenue",
      value: `$${statsData?.revenue?.toFixed(2) || '0.00'}`,
      change: statsData?.revenueChange || '+0%',
      trend: statsData?.revenueChange?.startsWith('+') ? "up" : "down",
      description: "Revenue this month",
      subtitle: "From completed sessions",
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      title: "Total Clients", 
      value: statsData?.totalClients?.toString() || '0',
      change: statsData?.clientsChange || '+0',
      trend: statsData?.clientsChange?.startsWith('+') ? "up" : "down",
      description: "Active client base",
      subtitle: "Total registered clients",
      icon: Users,
      color: "text-blue-500"
    },
    {
      title: "Monthly Appointments",
      value: statsData?.monthlyAppointments?.toString() || '0', 
      change: statsData?.appointmentsChange || '+0%',
      trend: statsData?.appointmentsChange?.startsWith('+') ? "up" : "down",
      description: "Appointments this month",
      subtitle: "Scheduled sessions",
      icon: Calendar,
      color: "text-blue-500"
    },
    {
      title: "Average Rating",
      value: statsData?.averageRating || '0.0',
      change: statsData?.ratingChange || '+0.0', 
      trend: statsData?.ratingChange?.startsWith('+') ? "up" : "down",
      description: "Customer satisfaction",
      subtitle: "Based on completed sessions",
      icon: Star,
      color: "text-blue-500"
    }
  ]

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border dark:border-border bg-background dark:bg-background px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-foreground dark:text-foreground">Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      
      <div className="flex flex-1 flex-col gap-4 p-4 bg-background dark:bg-background">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">Welcome back, Fernando!</h1>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              ['revenue', 'customers', 'appointments', 'rating'].map((statType) => (
                <Card key={`skeleton-stat-${statType}`}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : (
              stats.map((stat) => (
                <Card key={stat.title} className="relative overflow-hidden bg-card dark:bg-card border border-border dark:border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-card-foreground dark:text-card-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-card-foreground dark:text-card-foreground">{stat.value}</div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <div className={`flex items-center text-xs font-medium ${
                        stat.trend === "up" ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
                      }`}>
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="mr-1 h-3 w-3" />
                        )}
                        {stat.change}
                      </div>
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {stat.subtitle}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Charts and Data Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <ChartAreaInteractive />
            </div>
            <div className="col-span-3">
              <RecentSessions />
            </div>
          </div>

      </div>
    </>
  )
}