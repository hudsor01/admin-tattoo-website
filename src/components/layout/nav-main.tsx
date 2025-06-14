"use client"

import Link from "next/link"
import { type Icon, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

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
    hasQuickAction?: boolean
    quickActionLabel?: string
    quickActionUrl?: string
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild
                tooltip={item.title}
                className="hover:bg-brand-gradient-soft hover:text-orange-700 dark:hover:text-orange-300 data-[active=true]:bg-brand-gradient data-[active=true]:text-white transition-all duration-200 text-lg font-semibold py-4"
              >
                <Link href={item.url} className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {item.icon && <item.icon className="w-6 h-6" />}
                    <span>{item.title}</span>
                  </div>
                  {item.hasQuickAction && item.quickActionUrl && (
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 ml-auto hover:bg-brand-gradient hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={item.quickActionUrl}>
                        <IconPlus className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
