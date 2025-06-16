"use client"

import * as React from "react"
import Image from "next/image"
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
      <SidebarHeader className="pb-6 pt-6 px-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 bg-brand-gradient rounded-xl shadow-lg">
              <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
            </div>
          </div>
          <div className="relative w-24 h-24">
            <Image
              src="/logo.png"
              alt="Ink 37 Tattoos"
              fill={true}
              className="object-contain"
              priority={true}
            />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-6 px-4">
        <div className="space-y-8">
          {/* Dashboard Section */}
          <div className="space-y-3">
            <div className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Dashboard
            </div>
            <NavMain items={data.dashboard} />
          </div>

          {/* Book of Business Section */}
          <div className="space-y-3">
            <div className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Book of Business
            </div>
            <NavMain items={data.bookOfBusiness} />
          </div>

          {/* Financials Section */}
          <div className="space-y-3">
            <div className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Financials
            </div>
            <NavMain items={data.financials} />
          </div>
        </div>
        <NavSecondary items={data.navSecondary} className="mt-auto px-4" />
      </SidebarContent>
      <SidebarFooter className="pt-4 px-4">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
