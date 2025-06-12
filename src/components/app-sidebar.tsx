"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconFileDescription,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "https://github.com/shadcn.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
    },
    {
      title: "Payments",
      url: "/payments",
      icon: IconFileDescription,
    },
    {
      title: "Appointments",
      url: "/appointments",
      icon: IconListDetails,
    },
    {
      title: "Media Management",
      url: "/media-management",
      icon: IconCamera,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
  documents: [
    {
      name: "Reports",
      url: "/forms",
      icon: IconReport,
    },
    {
      name: "Messages",
      url: "/messages",
      icon: IconFileDescription,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" className="bg-sidebar border-r border-sidebar-border" {...props}>
      <SidebarHeader className="border-b border-border/30 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-brand-gradient text-white hover:opacity-90 active:opacity-80 min-w-8 duration-200 ease-linear shadow-sm text-lg font-semibold py-4"
            >
              <IconInnerShadowTop className="w-6 h-6" />
              <span>Quick Create</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <div className="space-y-6">
          <NavMain items={data.navMain} />
          <NavDocuments items={data.documents} />
        </div>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/30 pt-4">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
