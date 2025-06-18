"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
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
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @sm:grid-cols-2 @3xl:grid-cols-4">
        {['section-1', 'section-2', 'section-3', 'section-4'].map((sectionId) => (
          <Card key={`section-skeleton-${sectionId}`}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @sm:grid-cols-2 @3xl:grid-cols-4">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-destructive">Error loading dashboard data</CardTitle>
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
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @sm:grid-cols-2 @3xl:grid-cols-4">
      {/* Total Revenue */}
      <Card>
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {formatCurrency(stats.revenue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isPositive(stats.revenueChange) ? <IconTrendingUp /> : <IconTrendingDown />}
              {stats.revenueChange}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isPositive(stats.revenueChange) ? "Trending up this month" : "Down this month"} 
            {isPositive(stats.revenueChange) ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Revenue for the last 6 months
          </div>
        </CardFooter>
      </Card>

      {/* Total Clients */}
      <Card>
        <CardHeader>
          <CardDescription>Total Clients</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {stats.totalClients.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isPositive(stats.clientsChange) ? <IconTrendingUp /> : <IconTrendingDown />}
              {stats.clientsChange}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isPositive(stats.clientsChange) ? "Growing client base" : "Client acquisition needs attention"}
            {isPositive(stats.clientsChange) ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {isPositive(stats.clientsChange) ? "Strong growth this month" : "Focus on marketing"}
          </div>
        </CardFooter>
      </Card>

      {/* Monthly Appointments */}
      <Card>
        <CardHeader>
          <CardDescription>Active Appointments</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {stats.monthlyAppointments}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isPositive(stats.appointmentsChange) ? <IconTrendingUp /> : <IconTrendingDown />}
              {stats.appointmentsChange}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isPositive(stats.appointmentsChange) ? "Strong appointment bookings" : "Bookings need attention"}
            {isPositive(stats.appointmentsChange) ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {isPositive(stats.appointmentsChange) ? "Exceeds targets" : "Review scheduling"}
          </div>
        </CardFooter>
      </Card>

      {/* Satisfaction Rating */}
      <Card>
        <CardHeader>
          <CardDescription>Satisfaction Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {stats.averageRating}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isPositive(stats.ratingChange) ? <IconTrendingUp /> : <IconTrendingDown />}
              {stats.ratingChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isPositive(stats.ratingChange) ? "Steady performance increase" : "Maintain quality focus"}
            {isPositive(stats.ratingChange) ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Based on completion metrics
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
