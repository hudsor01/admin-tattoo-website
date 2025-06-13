'use client'

import { AppSidebar } from "@/components/layout/app-sidebar"
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive"
import { RecentSessions } from "@/components/dashboard/recent-sessions"
import { SectionCards } from "@/components/dashboard/section-cards"
import { SiteHeader } from "@/components/layout/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AdminRoute } from "@/components/auth/admin-route"
import { DashboardErrorBoundary } from "@/components/error/dashboard-error-boundary"
import { ApiErrorBoundary } from "@/components/error/api-error-boundary"

export default function DashboardPage() {
  return (
    <AdminRoute>
      <DashboardErrorBoundary>
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
                  <ApiErrorBoundary>
                    <SectionCards />
                  </ApiErrorBoundary>
                  <div className="px-6 lg:px-8">
                    <ApiErrorBoundary>
                      <ChartAreaInteractive />
                    </ApiErrorBoundary>
                  </div>
                  <div className="px-6 lg:px-8">
                    <ApiErrorBoundary>
                      <RecentSessions />
                    </ApiErrorBoundary>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </DashboardErrorBoundary>
    </AdminRoute>
  )
}
