import { cookies } from "next/headers"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import {
  SidebarInset,
  SidebarProvider
} from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require admin access for entire dashboard
  // try {
  //   await requireAdmin()
  // } catch {
  //   redirect("/access-denied")
  // }

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <div className="flex h-screen bg-background dark:bg-background">
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          {
            "--sidebar-width": "16rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <SiteHeader />
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
