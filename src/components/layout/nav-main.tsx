"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconSearch, type Icon } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"

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
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Search customers by default, but could be made more sophisticated
      router.push(`/customers?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("") // Clear search after navigation
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <form onSubmit={handleSearch} className="flex items-center gap-2 px-3 py-2">
              <IconSearch className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent p-0 h-auto text-base font-medium placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </form>
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
                <Link href={item.url}>
                  {item.icon && <item.icon className="w-6 h-6" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
