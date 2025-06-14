"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconListDetails,
  IconReport,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavSecondary } from "@/components/layout/nav-secondary"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "https://github.com/shadcn.png",
  },
  dashboard: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Media Management",
      url: "/media-management",
      icon: IconCamera,
    },
  ],
  bookOfBusiness: [
    {
      title: "Appointments",
      url: "/appointments",
      icon: IconListDetails,
      hasQuickAction: true,
      quickActionLabel: "New Appointment",
      quickActionUrl: "/appointments?action=create",
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
      hasQuickAction: true,
      quickActionLabel: "New Customer",
      quickActionUrl: "/customers?action=create",
    },
  ],
  financials: [
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: IconReport,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  return (
    <Sidebar collapsible="offcanvas" className="bg-sidebar" {...props}>
      <SidebarHeader className="pb-6">
      </SidebarHeader>
      <SidebarContent className="py-8">
        <div className="space-y-12">
          {/* Dashboard Section */}
          <div className="space-y-4">
            <div className="px-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
              Dashboard
            </div>
            <NavMain items={data.dashboard} />
          </div>

          {/* Book of Business Section */}
          <div className="space-y-4">
            <div className="px-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
              Book of Business
            </div>
            <NavMain items={data.bookOfBusiness} />
          </div>

          {/* Financials Section */}
          <div className="space-y-4">
            <div className="px-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
              Financials
            </div>
            <NavMain items={data.financials} />
          </div>
        </div>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="pt-4">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
