"use client"

import { IconSearch, type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Search"
              className="hover:bg-accent/50 transition-colors text-lg font-semibold py-4"
            >
              <IconSearch className="w-6 h-6" />
              <span>Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild
                tooltip={item.title}
                className="hover:bg-brand-gradient-soft hover:text-orange-700 dark:hover:text-orange-300 data-[active=true]:bg-brand-gradient data-[active=true]:text-white transition-all duration-200 text-lg font-semibold py-4"
              >
                <a href={item.url}>
                  {item.icon && <item.icon className="w-6 h-6" />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
