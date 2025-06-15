import { Suspense, lazy } from 'react'
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SectionCards } from "@/components/dashboard/section-cards"
import { SiteHeader } from "@/components/layout/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { DashboardErrorBoundary } from "@/components/error/dashboard-error-boundary"
import { ApiErrorBoundary } from "@/components/error/api-error-boundary"
import { Skeleton } from "@/components/ui/skeleton"
import { RedirectToSignIn, SignedIn } from "@daveyplate/better-auth-ui"

// Lazy load heavy components
const ChartAreaInteractive = lazy(() => import("@/components/dashboard/chart-area-interactive").then(mod => ({ default: mod.ChartAreaInteractive })))
const RecentSessions = lazy(() => import("@/components/dashboard/recent-sessions").then(mod => ({ default: mod.RecentSessions })))

export default function DashboardPage() {
  return (
    <>
      <RedirectToSignIn />
      <SignedIn>
        <DashboardErrorBoundary>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "5rem",
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
                        <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
                          <ChartAreaInteractive />
                        </Suspense>
                      </ApiErrorBoundary>
                    </div>
                    <div className="px-6 lg:px-8">
                      <ApiErrorBoundary>
                        <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
                          <RecentSessions />
                        </Suspense>
                      </ApiErrorBoundary>
                    </div>
                  </div>
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </DashboardErrorBoundary>
      </SignedIn>
    </>
  )
}
