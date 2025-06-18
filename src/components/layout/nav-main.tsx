"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  items: Array<{
    title: string
    url: string
    icon?: Icon
    hasQuickAction?: boolean
    quickActionLabel?: string
    quickActionUrl?: string
  }>
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <div className="flex items-center justify-between w-full">
                  <SidebarMenuButton 
                    asChild
                    tooltip={item.title}
                    className={`
                      transition-all duration-200 font-semibold py-3 px-3 rounded-xl mx-1 flex-1
                      ${isActive 
                        ? 'bg-brand-gradient text-white shadow-lg' 
                        : 'hover:bg-brand-gradient-soft hover:text-primary dark:hover:text-primary'
                      }
                    `}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      {item.icon ? <item.icon className="w-6 h-6" /> : null}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.hasQuickAction && item.quickActionUrl ? <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className={`h-6 w-6 p-0 ml-2 transition-colors ${
                        isActive 
                          ? 'hover:bg-white/20 text-white' 
                          : 'hover:bg-brand-gradient hover:text-white'
                      }`}
                    >
                      <Link href={item.quickActionUrl}>
                        <IconPlus className="h-4 w-4" />
                      </Link>
                    </Button> : null}
                </div>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
