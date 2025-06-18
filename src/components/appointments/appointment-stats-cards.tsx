"use client"

import { IconCalendar, IconCircleCheck, IconClock, IconTrendingDown, IconTrendingUp, IconUsers } from "@tabler/icons-react"

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
      <div className="grid grid-cols-1 gap-8 px-6 lg:px-8 md:grid-cols-2 xl:grid-cols-4">
        {['total', 'pending', 'confirmed', 'completed'].map((statType) => (
          <Card key={`appointment-stats-skeleton-${statType}`} className="bg-card border-border/30">
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
      <div className="grid grid-cols-1 gap-8 px-6 lg:px-8 md:grid-cols-2 xl:grid-cols-4">
        <Card className="col-span-full bg-card border-border/30">
          <CardHeader>
            <CardTitle className="text-error">Error loading appointment stats</CardTitle>
            <CardDescription>Please try refreshing the page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Helper function to determine if change is positive
  const isPositive = (change: string) => change?.startsWith('+') ?? false

  return (
    <div className="grid grid-cols-1 gap-8 px-6 lg:px-8 md:grid-cols-2 xl:grid-cols-4">
      {/* Total Appointments */}
      <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 dark:hover:border-primary/50">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Total Appointments</CardDescription>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-4xl sm:text-5xl lg:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {stats.totalAppointments.toLocaleString()}
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.appointmentsChange) 
                ? "bg-info-soft text-info border-info"
                : "bg-error-soft text-error border-error"
            }`}>
              {isPositive(stats.appointmentsChange) ? <IconTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> : <IconTrendingDown className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />}
              {stats.appointmentsChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.appointmentsChange) ? "Booking momentum" : "Bookings declining"}
            <IconCalendar className={`w-5 h-5 ${isPositive(stats.appointmentsChange) ? 'text-info' : 'text-error'}`} />
          </div>
          <div className="text-muted-foreground text-base font-medium">
            All appointment types included
          </div>
        </CardFooter>
      </Card>

      {/* Confirmed Appointments */}
      <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 dark:hover:border-primary/50">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Confirmed</CardDescription>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-4xl sm:text-5xl lg:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {stats.confirmedAppointments.toLocaleString()}
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.confirmedChange) 
                ? "bg-success-soft text-success border-success"
                : "bg-warning-soft text-warning border-warning"
            }`}>
              {isPositive(stats.confirmedChange) ? <IconTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> : <IconTrendingDown className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />}
              {stats.confirmedChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.confirmedChange) ? "Strong confirmation rate" : "Follow up needed"}
            <IconCircleCheck className={`w-5 h-5 ${isPositive(stats.confirmedChange) ? 'text-success' : 'text-warning'}`} />
          </div>
          <div className="text-muted-foreground text-base font-medium">
            Ready for service
          </div>
        </CardFooter>
      </Card>

      {/* Completed Appointments */}
      <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 dark:hover:border-primary/50">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Completed</CardDescription>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-4xl sm:text-5xl lg:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {stats.completedAppointments.toLocaleString()}
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.completedChange) 
                ? "bg-accent/10 text-accent-foreground border-accent"
                : "bg-muted text-muted-foreground border-muted-foreground"
            }`}>
              {isPositive(stats.completedChange) ? <IconTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> : <IconTrendingDown className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />}
              {stats.completedChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.completedChange) ? "Successful completions" : "Review completion process"}
            <IconUsers className={`w-5 h-5 ${isPositive(stats.completedChange) ? 'text-accent' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-muted-foreground text-base font-medium">
            Successfully finished
          </div>
        </CardFooter>
      </Card>

      {/* Completion Rate */}
      <Card className="bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 dark:hover:border-primary/50">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Completion Rate</CardDescription>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-4xl sm:text-5xl lg:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {stats.completionRate}%
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.completionRateChange) 
                ? "bg-success-soft text-success border-success"
                : "bg-warning-soft text-warning border-warning"
            }`}>
              {isPositive(stats.completionRateChange) ? <IconTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> : <IconTrendingDown className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />}
              {stats.completionRateChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.completionRateChange) ? "Excellent reliability" : "Monitor no-shows"}
            <IconClock className={`w-5 h-5 ${isPositive(stats.completionRateChange) ? 'text-success' : 'text-warning'}`} />
          </div>
          <div className="text-muted-foreground text-base font-medium">
            Success vs scheduled
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
