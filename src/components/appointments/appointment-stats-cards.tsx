"use client"

import { IconTrendingDown, IconTrendingUp, IconCalendar, IconClock, IconUsers, IconCircleCheck } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"

interface AppointmentStats {
  totalAppointments: number
  confirmedAppointments: number
  completedAppointments: number
  completionRate: number
  appointmentsChange: string
  confirmedChange: string
  completedChange: string
  completionRateChange: string
}

// Fetch appointment stats from API
const fetchAppointmentStats = async (): Promise<AppointmentStats> => {
  const response = await fetch('/api/admin/appointments/stats')
  if (!response.ok) throw new Error('Failed to fetch appointment stats')
  const result = await response.json()
  return result.data
}

export function AppointmentStatsCards() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['appointment-stats'],
    queryFn: fetchAppointmentStats,
    refetchInterval: 60000, // Refresh every minute
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 px-6 lg:px-8 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card bg-card border-border/30">
            <CardHeader className="pb-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-40" />
            </CardHeader>
            <CardFooter className="flex flex-col items-start gap-3 pt-0">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-36" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 gap-8 px-6 lg:px-8 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="col-span-4 bg-card border-border/30">
          <CardHeader>
            <CardTitle className="text-red-600">Error loading appointment stats</CardTitle>
            <CardDescription>Please try refreshing the page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Helper function to determine if change is positive
  const isPositive = (change: string) => change?.startsWith('+') ?? false

  return (
    <div className="grid grid-cols-1 gap-8 px-6 lg:px-8 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Total Appointments */}
      <Card className="@container/card bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-orange-200 dark:hover:border-orange-700">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Total Appointments</CardDescription>
          <div className="flex flex-col gap-3 @[280px]/card:flex-row @[280px]/card:items-center @[280px]/card:justify-between">
            <CardTitle className="text-4xl @[250px]/card:text-5xl @[350px]/card:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {stats.totalAppointments.toLocaleString()}
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 @[280px]/card:px-4 @[280px]/card:py-2 text-sm @[280px]/card:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.appointmentsChange) 
                ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-300 dark:from-blue-950/30 dark:to-cyan-950/30 dark:text-blue-300 dark:border-blue-700"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300 dark:from-red-950/30 dark:to-rose-950/30 dark:text-red-300 dark:border-red-700"
            }`}>
              {isPositive(stats.appointmentsChange) ? <IconTrendingUp className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" /> : <IconTrendingDown className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" />}
              {stats.appointmentsChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.appointmentsChange) ? "Booking momentum" : "Bookings declining"}
            <IconCalendar className={`w-5 h-5 ${isPositive(stats.appointmentsChange) ? 'text-blue-600' : 'text-red-600'}`} />
          </div>
          <div className="text-muted-foreground text-base font-medium">
            All appointment types included
          </div>
        </CardFooter>
      </Card>

      {/* Confirmed Appointments */}
      <Card className="@container/card bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-orange-200 dark:hover:border-orange-700">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Confirmed</CardDescription>
          <div className="flex flex-col gap-3 @[280px]/card:flex-row @[280px]/card:items-center @[280px]/card:justify-between">
            <CardTitle className="text-4xl @[250px]/card:text-5xl @[350px]/card:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {stats.confirmedAppointments.toLocaleString()}
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 @[280px]/card:px-4 @[280px]/card:py-2 text-sm @[280px]/card:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.confirmedChange) 
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300 dark:from-green-950/30 dark:to-emerald-950/30 dark:text-green-300 dark:border-green-700"
                : "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-300 dark:from-orange-950/30 dark:to-amber-950/30 dark:text-orange-300 dark:border-orange-700"
            }`}>
              {isPositive(stats.confirmedChange) ? <IconTrendingUp className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" /> : <IconTrendingDown className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" />}
              {stats.confirmedChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.confirmedChange) ? "Strong confirmation rate" : "Follow up needed"}
            <IconCircleCheck className={`w-5 h-5 ${isPositive(stats.confirmedChange) ? 'text-green-600' : 'text-orange-600'}`} />
          </div>
          <div className="text-muted-foreground text-base font-medium">
            Ready for service
          </div>
        </CardFooter>
      </Card>

      {/* Completed Appointments */}
      <Card className="@container/card bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-orange-200 dark:hover:border-orange-700">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Completed</CardDescription>
          <div className="flex flex-col gap-3 @[280px]/card:flex-row @[280px]/card:items-center @[280px]/card:justify-between">
            <CardTitle className="text-4xl @[250px]/card:text-5xl @[350px]/card:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {stats.completedAppointments.toLocaleString()}
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 @[280px]/card:px-4 @[280px]/card:py-2 text-sm @[280px]/card:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.completedChange) 
                ? "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-300 dark:from-purple-950/30 dark:to-violet-950/30 dark:text-purple-300 dark:border-purple-700"
                : "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-300 dark:from-gray-950/30 dark:to-slate-950/30 dark:text-gray-300 dark:border-gray-700"
            }`}>
              {isPositive(stats.completedChange) ? <IconTrendingUp className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" /> : <IconTrendingDown className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" />}
              {stats.completedChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.completedChange) ? "Successful completions" : "Review completion process"}
            <IconUsers className={`w-5 h-5 ${isPositive(stats.completedChange) ? 'text-purple-600' : 'text-gray-600'}`} />
          </div>
          <div className="text-muted-foreground text-base font-medium">
            Successfully finished
          </div>
        </CardFooter>
      </Card>

      {/* Completion Rate */}
      <Card className="@container/card bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-orange-200 dark:hover:border-orange-700">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Completion Rate</CardDescription>
          <div className="flex flex-col gap-3 @[280px]/card:flex-row @[280px]/card:items-center @[280px]/card:justify-between">
            <CardTitle className="text-4xl @[250px]/card:text-5xl @[350px]/card:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {stats.completionRate}%
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 @[280px]/card:px-4 @[280px]/card:py-2 text-sm @[280px]/card:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.completionRateChange) 
                ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-300 dark:from-emerald-950/30 dark:to-teal-950/30 dark:text-emerald-300 dark:border-emerald-700"
                : "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-300 dark:from-yellow-950/30 dark:to-amber-950/30 dark:text-yellow-300 dark:border-yellow-700"
            }`}>
              {isPositive(stats.completionRateChange) ? <IconTrendingUp className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" /> : <IconTrendingDown className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" />}
              {stats.completionRateChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.completionRateChange) ? "Excellent reliability" : "Monitor no-shows"}
            <IconClock className={`w-5 h-5 ${isPositive(stats.completionRateChange) ? 'text-emerald-600' : 'text-yellow-600'}`} />
          </div>
          <div className="text-muted-foreground text-base font-medium">
            Success vs scheduled
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
