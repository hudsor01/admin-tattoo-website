"use client"

import * as React from "react"
import { useState } from "react"
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
  IconPlus,
  IconUser,
  IconCalendar,
  IconCreditCard,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/layout/nav-documents"
import { NavMain } from "@/components/layout/nav-main"
import { NavSecondary } from "@/components/layout/nav-secondary"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

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
      url: "/reports",
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
  const router = useRouter()

  const handleQuickCreate = (type: string) => {
    switch (type) {
      case 'customer':
        router.push('/customers?action=create')
        break
      case 'appointment':
        router.push('/appointments?action=create')
        break
      case 'payment':
        router.push('/payments?action=create')
        break
      default:
        router.push('/customers?action=create')
    }
  }

  return (
    <Sidebar collapsible="offcanvas" className="bg-sidebar border-r border-sidebar-border" {...props}>
      <SidebarHeader className="border-b border-border/30 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Quick Create"
                  className="bg-brand-gradient text-white hover:opacity-90 active:opacity-80 min-w-8 duration-200 ease-linear shadow-sm text-lg font-semibold py-4"
                >
                  <IconInnerShadowTop className="w-6 h-6" />
                  <span>Quick Create</span>
                  <IconPlus className="ml-auto w-4 h-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-48">
                <DropdownMenuItem onClick={() => handleQuickCreate('customer')}>
                  <IconUser className="w-4 h-4 mr-2" />
                  New Customer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickCreate('appointment')}>
                  <IconCalendar className="w-4 h-4 mr-2" />
                  New Appointment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickCreate('payment')}>
                  <IconCreditCard className="w-4 h-4 mr-2" />
                  Record Payment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
