"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardData } from "@/hooks/use-dashboard-data"

export function SectionCards() {
  const { data, isLoading, error } = useDashboardData()

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

  if (error || !data) {
    return (
      <div className="grid grid-cols-1 gap-8 px-6 lg:px-8 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="col-span-4 bg-card border-border/30">
          <CardHeader>
            <CardTitle className="text-red-600">Error loading dashboard data</CardTitle>
            <CardDescription>Please try refreshing the page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { stats } = data
  
  // Helper function to determine if change is positive
  const isPositive = (change: string) => change.startsWith('+')
  
  // Format currency - shorter format for better fit
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toLocaleString()}`
  }
  return (
    <div className="grid grid-cols-1 gap-8 px-6 lg:px-8 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Total Revenue */}
      <Card className="@container/card bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-orange-200 dark:hover:border-orange-700">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Total Revenue</CardDescription>
          <div className="flex flex-col gap-3 @[280px]/card:flex-row @[280px]/card:items-center @[280px]/card:justify-between">
            <CardTitle className="text-4xl @[250px]/card:text-5xl @[350px]/card:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {formatCurrency(stats.revenue)}
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 @[280px]/card:px-4 @[280px]/card:py-2 text-sm @[280px]/card:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.revenueChange) 
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300 dark:from-green-950/30 dark:to-emerald-950/30 dark:text-green-300 dark:border-green-700"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300 dark:from-red-950/30 dark:to-rose-950/30 dark:text-red-300 dark:border-red-700"
            }`}>
              {isPositive(stats.revenueChange) ? <IconTrendingUp className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" /> : <IconTrendingDown className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" />}
              {stats.revenueChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.revenueChange) ? "Trending up this month" : "Down this month"} 
            {isPositive(stats.revenueChange) ? <IconTrendingUp className="w-5 h-5 text-green-600" /> : <IconTrendingDown className="w-5 h-5 text-red-600" />}
          </div>
          <div className="text-muted-foreground text-base font-medium">
            Revenue for the last 6 months
          </div>
        </CardFooter>
      </Card>

      {/* Total Clients */}
      <Card className="@container/card bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-orange-200 dark:hover:border-orange-700">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Total Clients</CardDescription>
          <div className="flex flex-col gap-3 @[280px]/card:flex-row @[280px]/card:items-center @[280px]/card:justify-between">
            <CardTitle className="text-4xl @[250px]/card:text-5xl @[350px]/card:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {stats.totalClients.toLocaleString()}
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 @[280px]/card:px-4 @[280px]/card:py-2 text-sm @[280px]/card:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.clientsChange) 
                ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-300 dark:from-blue-950/30 dark:to-cyan-950/30 dark:text-blue-300 dark:border-blue-700"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300 dark:from-red-950/30 dark:to-rose-950/30 dark:text-red-300 dark:border-red-700"
            }`}>
              {isPositive(stats.clientsChange) ? <IconTrendingUp className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" /> : <IconTrendingDown className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" />}
              {stats.clientsChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.clientsChange) ? "Growing client base" : "Client acquisition needs attention"}
            {isPositive(stats.clientsChange) ? <IconTrendingUp className="w-5 h-5 text-blue-600" /> : <IconTrendingDown className="w-5 h-5 text-red-600" />}
          </div>
          <div className="text-muted-foreground text-base font-medium">
            {isPositive(stats.clientsChange) ? "Strong growth this month" : "Focus on marketing"}
          </div>
        </CardFooter>
      </Card>

      {/* Monthly Appointments */}
      <Card className="@container/card bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-orange-200 dark:hover:border-orange-700">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Monthly Appointments</CardDescription>
          <div className="flex flex-col gap-3 @[280px]/card:flex-row @[280px]/card:items-center @[280px]/card:justify-between">
            <CardTitle className="text-4xl @[250px]/card:text-5xl @[350px]/card:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {stats.monthlyAppointments}
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 @[280px]/card:px-4 @[280px]/card:py-2 text-sm @[280px]/card:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.appointmentsChange) 
                ? "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-300 dark:from-purple-950/30 dark:to-violet-950/30 dark:text-purple-300 dark:border-purple-700"
                : "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-300 dark:from-orange-950/30 dark:to-amber-950/30 dark:text-orange-300 dark:border-orange-700"
            }`}>
              {isPositive(stats.appointmentsChange) ? <IconTrendingUp className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" /> : <IconTrendingDown className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" />}
              {stats.appointmentsChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.appointmentsChange) ? "Booking momentum" : "Bookings declining"}
            {isPositive(stats.appointmentsChange) ? <IconTrendingUp className="w-5 h-5 text-purple-600" /> : <IconTrendingDown className="w-5 h-5 text-orange-600" />}
          </div>
          <div className="text-muted-foreground text-base font-medium">
            {isPositive(stats.appointmentsChange) ? "Exceeds targets" : "Review scheduling"}
          </div>
        </CardFooter>
      </Card>

      {/* Average Rating */}
      <Card className="@container/card bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:border-orange-200 dark:hover:border-orange-700">
        <CardHeader className="pb-4 space-y-3">
          <CardDescription className="text-muted-foreground text-base font-semibold uppercase tracking-wide">Satisfaction Rating</CardDescription>
          <div className="flex flex-col gap-3 @[280px]/card:flex-row @[280px]/card:items-center @[280px]/card:justify-between">
            <CardTitle className="text-4xl @[250px]/card:text-5xl @[350px]/card:text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {stats.averageRating}
            </CardTitle>
            <Badge variant="outline" className={`font-semibold px-3 py-1 @[280px]/card:px-4 @[280px]/card:py-2 text-sm @[280px]/card:text-base shadow-sm flex-shrink-0 w-fit ${
              isPositive(stats.ratingChange) 
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300 dark:from-green-950/30 dark:to-emerald-950/30 dark:text-green-300 dark:border-green-700"
                : "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-300 dark:from-yellow-950/30 dark:to-amber-950/30 dark:text-yellow-300 dark:border-yellow-700"
            }`}>
              {isPositive(stats.ratingChange) ? <IconTrendingUp className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" /> : <IconTrendingDown className="w-4 h-4 @[280px]/card:w-5 @[280px]/card:h-5 mr-1 @[280px]/card:mr-2" />}
              {stats.ratingChange}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            {isPositive(stats.ratingChange) ? "Improving satisfaction" : "Maintain quality focus"}
            {isPositive(stats.ratingChange) ? <IconTrendingUp className="w-5 h-5 text-green-600" /> : <IconTrendingDown className="w-5 h-5 text-yellow-600" />}
          </div>
          <div className="text-muted-foreground text-base font-medium">
            Based on completion rates
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
