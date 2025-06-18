"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconListDetails,
  IconPhoto,
  IconReport,
  IconSettings,
  IconUsers,
  IconVideo,
} from "@tabler/icons-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { SearchForm } from "@/components/search-form"
import { NavUser } from "@/components/layout/nav-user"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
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

// Ink 37 Tattoos navigation data
const data = {
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
        },
        {
          title: "Customers",
          url: "/dashboard/customers",
          icon: IconUsers,
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader className="space-y-4 p-4">
        <div className="pb-2 border-b border-sidebar-border">
          <NavUser />
        </div>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup className="py-4">
          <SidebarMenu className="space-y-3">
            {data.navMain.map((item, _index) => {
              const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
              
              if (!item.items) {
                // Single item without dropdown
                return (
                  <SidebarMenuItem key={item.title} className="mb-1">
                    <SidebarMenuButton asChild isActive={isActive} className="h-10 px-3 rounded-lg hover:bg-sidebar-accent/70 transition-colors">
                      <Link href={item.url} className="flex items-center gap-3">
                        {item.icon ? <item.icon className="w-4 h-4" /> : null}
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
                  className="group/collapsible mb-2"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="h-10 px-3 rounded-lg hover:bg-sidebar-accent/70 transition-colors">
                        {item.icon ? <item.icon className="w-4 h-4" /> : null}
                        {item.title}
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <SidebarMenuSub className="ml-4 space-y-1 border-l border-sidebar-border/50 pl-4">
                        {item.items.map((subItem) => {
                          const isSubActive = pathname === subItem.url
                          return (
                            <SidebarMenuSubItem key={subItem.title} className="py-0.5">
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className="h-8 px-3 rounded-md hover:bg-sidebar-accent/50 transition-colors"
                              >
                                <Link href={subItem.url} className="flex items-center gap-3">
                                  {subItem.icon ? <subItem.icon className="w-4 h-4 text-sidebar-foreground/70" /> : null}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
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
        
        {/* Settings at the bottom */}
        <SidebarGroup className="mt-auto px-2 py-4 border-t border-sidebar-border/50">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-lg hover:bg-sidebar-accent/70 transition-colors">
                <Link href="/dashboard/settings" className="flex items-center gap-3">
                  <IconSettings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
