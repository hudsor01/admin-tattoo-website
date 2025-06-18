"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight, Calendar, DollarSign, Star, TrendingUp, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStatsCardsProps {
  data?: {
    revenue?: { value: string; change: string; trend: string }
    customers?: { value: string; change: string; trend: string }
    appointments?: { value: string; change: string; trend: string }
    rating?: { value: string; change: string; trend: string }
  }
}

export function DashboardStatsCards({ data }: DashboardStatsCardsProps) {
  const stats = [
    {
      title: "Monthly Revenue",
      value: data?.revenue?.value || "$12,450",
      change: data?.revenue?.change || "+18.2%",
      trend: data?.revenue?.trend || "up",
      description: "Revenue up this month",
      subtext: "Compared to last month",
      icon: DollarSign
    },
    {
      title: "Active Clients",
      value: data?.customers?.value || "234",
      change: data?.customers?.change || "+12",
      trend: data?.customers?.trend || "up",
      description: "New clients this month",
      subtext: "Total active customer base",
      icon: Users
    },
    {
      title: "Appointments",
      value: data?.appointments?.value || "47",
      change: data?.appointments?.change || "+5.8%",
      trend: data?.appointments?.trend || "up",
      description: "More bookings than usual",
      subtext: "This month's appointments",
      icon: Calendar
    },
    {
      title: "Avg Rating",
      value: data?.rating?.value || "4.9",
      change: data?.rating?.change || "+0.2",
      trend: data?.rating?.trend || "up",
      description: "Customer satisfaction",
      subtext: "Based on 156 reviews",
      icon: Star
    }
  ]

  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="bg-card border-border group hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card border-border group hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`flex items-center text-xs font-medium ${
              stat.trend === "up" ? "text-success" : "text-error"
            }`}>
              {stat.change}
              {stat.trend === "up" ? (
                <ArrowUpRight className="ml-1 h-3 w-3" />
              ) : (
                <ArrowDownRight className="ml-1 h-3 w-3" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground transition-all duration-200">{stat.value}</div>
                <div className="flex items-center pt-1">
                  <TrendingUp className="mr-1 h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <p className="text-xs text-muted-foreground/80 mt-1">{stat.subtext}</p>
              </div>
              <div className="ml-4">
                <stat.icon className="h-8 w-8 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}