"use client"

import * as React from "react"
const { memo, useMemo } = React
import { useIsMobile } from "@/hooks/use-mobile"
import { useChartData } from "@/hooks/use-chart-data"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

export const description = "An interactive area chart"

const chartConfig = {
  revenue: {
    label: "Revenue",
  },
  value1: {
    label: "Revenue ($)",
    color: "var(--color-chart-1)",
  },
  value2: {
    label: "Appointments",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig

const ChartAreaInteractiveComponent = () => {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const { data: chartData, isLoading, error } = useChartData()

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Memoize chart config to prevent re-creation
  const memoizedChartConfig = useMemo(() => chartConfig, [])

  // Memoize filtered data calculation
  const filteredData = useMemo(() => {
    const safeChartData = Array.isArray(chartData) ? chartData : []
    return safeChartData.slice(timeRange === "7d" ? -7 : timeRange === "30d" ? -30 : -90)
  }, [chartData, timeRange])

  if (isLoading) {
    return (
      <Card className="@container/card bg-card border-border/30 shadow-lg shadow-black/5">
        <CardHeader className="pb-6 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-2">
            <CardTitle className="text-5xl font-black text-foreground tracking-tight">Revenue & Appointments</CardTitle>
            <CardDescription className="text-muted-foreground font-medium text-xl">
              Loading chart data...
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pt-2 pb-6 sm:px-8 sm:pt-4">
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  if (error || !chartData) {
    return (
      <Card className="@container/card bg-card border-border/30 shadow-lg shadow-black/5">
        <CardHeader className="pb-6">
          <CardTitle className="text-red-600">Error loading chart data</CardTitle>
          <CardDescription>Please refresh the page or contact support</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="@container/card bg-card border-border/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
      <CardHeader className="pb-6 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-2">
          <CardTitle className="text-5xl font-black text-foreground tracking-tight">Revenue & Appointments</CardTitle>
          <CardDescription className="text-muted-foreground font-medium text-xl">
            <span className="hidden @[540px]/card:block">
              Daily revenue and appointment trends
            </span>
            <span className="@[540px]/card:hidden">Revenue & bookings</span>
          </CardDescription>
        </div>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden @[767px]/card:flex bg-muted/50 rounded-xl p-2 shadow-sm border border-border/30"
          >
            <ToggleGroupItem value="90d" className="px-8 py-4 text-lg font-semibold rounded-lg data-[state=on]:!bg-brand-gradient data-[state=on]:!text-white data-[state=on]:shadow-sm hover:bg-brand-gradient-soft hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d" className="px-8 py-4 text-lg font-semibold rounded-lg data-[state=on]:!bg-brand-gradient data-[state=on]:!text-white data-[state=on]:shadow-sm hover:bg-brand-gradient-soft hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d" className="px-8 py-4 text-lg font-semibold rounded-lg data-[state=on]:!bg-brand-gradient data-[state=on]:!text-white data-[state=on]:shadow-sm hover:bg-brand-gradient-soft hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-52 @[767px]/card:hidden border-border/30 bg-background/50 font-semibold shadow-sm text-lg py-4"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/30 bg-popover shadow-lg">
              <SelectItem value="90d" className="rounded-lg focus:bg-accent font-semibold text-lg py-4">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg focus:bg-accent font-semibold text-lg py-4">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg focus:bg-accent font-semibold text-lg py-4">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-6 pt-2 pb-6 sm:px-8 sm:pt-4">
        <ChartContainer
          config={memoizedChartConfig}
          className="aspect-auto h-[320px] w-full rounded-xl shadow-inner bg-gradient-to-br from-muted/30 to-muted/10 border border-border/20"
        >
          <AreaChart data={filteredData} className="w-full h-full">
            <defs>
              <linearGradient id="fillValue1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value1)" stopOpacity={0.9} />
                <stop offset="95%" stopColor="var(--color-value1)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillValue2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value2)" stopOpacity={0.7} />
                <stop offset="95%" stopColor="var(--color-value2)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
            />
            <Area
              dataKey="value2"
              type="natural"
              fill="url(#fillValue2)"
              stroke="var(--color-value2)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="value1"
              type="natural"
              fill="url(#fillValue1)"
              stroke="var(--color-value1)"
              strokeWidth={2}
              stackId="a"
            />
            <ChartTooltip
              cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '3 3' }}
              content={
                <ChartTooltipContent
                  className="bg-popover border-border shadow-lg rounded-lg"
                  labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
                indicator="dot"
              />
            }
          />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

ChartAreaInteractiveComponent.displayName = 'ChartAreaInteractive'

export const ChartAreaInteractive = memo(ChartAreaInteractiveComponent)