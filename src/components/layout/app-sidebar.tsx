"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconListDetails,
  IconReport,
  IconSettings,
  IconUsers,
  IconVideo,
  IconPhoto,
  IconPlus,
} from "@tabler/icons-react"
import { Minus, Plus } from "lucide-react"

import { SearchForm } from "@/components/search-form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/layout/nav-user"
import { Button } from "@/components/ui/button"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "https://github.com/shadcn.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Media Management",
      url: "/dashboard/media-management",
      icon: IconCamera,
      items: [
        {
          title: "Images",
          url: "/dashboard/media-management/images",
          icon: IconPhoto,
        },
        {
          title: "Videos", 
          url: "/dashboard/media-management/videos",
          icon: IconVideo,
        },
      ],
    },
    {
      title: "Book of Business",
      url: "#",
      icon: IconUsers,
      items: [
        {
          title: "Appointments",
          url: "/dashboard/appointments",
          icon: IconListDetails,
          hasQuickAction: true,
          quickActionLabel: "New Appointment",
          quickActionUrl: "/dashboard/appointments?action=create",
        },
        {
          title: "Customers",
          url: "/dashboard/customers", 
          icon: IconUsers,
          hasQuickAction: true,
          quickActionLabel: "New Customer",
          quickActionUrl: "/dashboard/customers?action=create",
        },
      ],
    },
    {
      title: "Financials",
      url: "#",
      icon: IconChartBar,
      items: [
        {
          title: "Analytics",
          url: "/dashboard/analytics",
          icon: IconChartBar,
        },
        {
          title: "Reports",
          url: "/dashboard/reports",
          icon: IconReport,
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-brand-gradient text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/logo.png"
                    alt="Ink 37"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Ink 37 Tattoos</span>
                  <span className="text-xs">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item, index) => {
              const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
              
              if (!item.items) {
                // Single item without dropdown
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} className="flex items-center gap-3">
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }

              // Collapsible item with dropdown
              return (
                <Collapsible
                  key={item.title}
                  defaultOpen={isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        {item.icon && <item.icon className="w-4 h-4" />}
                        {item.title}
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const isSubActive = pathname === subItem.url
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <div className="flex items-center justify-between w-full">
                                <SidebarMenuSubButton asChild isActive={isSubActive} className="flex-1">
                                  <Link href={subItem.url} className="flex items-center gap-3">
                                    {subItem.icon && <subItem.icon className="w-4 h-4" />}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                                {subItem.hasQuickAction && subItem.quickActionUrl && (
                                  <Button
                                    asChild
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 ml-2 transition-colors hover:bg-brand-gradient hover:text-white"
                                  >
                                    <Link href={subItem.quickActionUrl}>
                                      <IconPlus className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
