"use client"

import {
  IconDotsVertical,
  IconNotification,
  IconSettings,
  IconUser
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { LogoutMenuItem } from "@/components/auth/logout-button"
import { useUser } from "@/lib/auth-client"

interface NavUserProps {
  user?: {
    name: string
    email: string
    avatar: string
  }
}

export function NavUser({ user: propUser }: NavUserProps) {
  const { isMobile } = useSidebar()
  const { user: authUser } = useUser()

  // Use auth user if available, fallback to prop user, then default
  const user = authUser || propUser || {
    name: "Admin User",
    email: "admin@ink37tattoos.com",
    avatar: "https://github.com/shadcn.png"
  }

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <Avatar className="h-8 w-8 rounded-lg ring-2 ring-border">
                <AvatarImage src={'image' in user ? user.image || undefined : 'avatar' in user ? user.avatar || undefined : undefined} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-brand-gradient text-white font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold text-sidebar-foreground">
                  {user.name}
                </span>
                <span className="text-sidebar-foreground/70 truncate text-sm">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4 text-sidebar-foreground/70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg shadow-lg border-border/50"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-2 py-2 text-left">
                <Avatar className="h-10 w-10 rounded-lg ring-2 ring-border">
                  <AvatarImage src={'image' in user ? user.image || undefined : 'avatar' in user ? user.avatar || undefined : undefined} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-brand-gradient text-white font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold text-foreground">
                    {user.name}
                  </span>
                  <span className="text-muted-foreground truncate text-sm">
                    {user.email}
                  </span>
                  {authUser?.role && (
                    <span className="text-xs text-brand-gradient font-medium capitalize">
                      {authUser.role}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-sm py-2 cursor-pointer">
                <IconUser className="w-4 h-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm py-2 cursor-pointer">
                <IconSettings className="w-4 h-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm py-2 cursor-pointer">
                <IconNotification className="w-4 h-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <LogoutMenuItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
