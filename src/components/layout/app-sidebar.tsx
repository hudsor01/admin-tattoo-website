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
  IconPlus,
  IconUser,
  IconCalendar,
  IconCreditCard,
} from "@tabler/icons-react"

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
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
    },
  ],
  financials: [
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
    {
      title: "Payments",
      url: "/payments",
      icon: IconCreditCard,
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
        <div className="space-y-8">
          {/* Dashboard Section */}
          <div className="space-y-2">
            <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Dashboard
            </div>
            <NavMain items={data.dashboard} />
          </div>

          {/* Book of Business Section */}
          <div className="space-y-2">
            <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Book of Business
            </div>
            <NavMain items={data.bookOfBusiness} />
          </div>

          {/* Financials Section */}
          <div className="space-y-2">
            <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Financials
            </div>
            <NavMain items={data.financials} />
          </div>
        </div>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/30 pt-4">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
