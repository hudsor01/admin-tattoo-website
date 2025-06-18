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
import { useUser } from "@/stores/auth-store"

// Helper functions
function getImageSrc(user: unknown): string | undefined {
  // Only return a valid non-empty string, otherwise return undefined to prevent empty src
  if (typeof user === 'object' && user !== null) {
    const userObj = user as Record<string, unknown>;
    if (typeof userObj.image === 'string' && userObj.image.trim().length > 0) {
      return userObj.image;
    }
    if (typeof userObj.avatar === 'string' && userObj.avatar.trim().length > 0) {
      return userObj.avatar;
    }
  }
  return undefined;
}

interface NavUserProps {
  user?: {
    name?: string | null
    email?: string | null
    avatar?: string | null
    image?: string | null
  }
}

export function NavUser({ user: propUser }: NavUserProps) {
  const { isMobile } = useSidebar()
  const authUser = useUser()

  // Use auth user if available, fallback to prop user, then default
  const user = authUser || propUser || {
    name: "Admin User",
    email: "admin@ink37tattoos.com",
    avatar: "https://github.com/shadcn.png"
  }
  
  // Ensure we have safe fallbacks for display
  const displayName = user?.name || 'Admin User'
  const displayEmail = user?.email || 'admin@ink37tattoos.com'

  // Generate initials from name
  const getInitials = (name: string): string => {
    if (!name || typeof name !== 'string') return 'U';
    
    const trimmedName = name.trim();
    if (trimmedName.length === 0) return 'U';
    
    const parts = trimmedName
      .split(/\s+/)
      .filter(part => part.length > 0)
      .map(part => part[0]?.toUpperCase())
      .filter(initial => initial);
    
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0] || 'U';
    
    return parts.slice(0, 2).join('');
  }

  const imageSrc = getImageSrc(user);

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
                {imageSrc ? <AvatarImage src={imageSrc} alt={displayName} /> : null}
                <AvatarFallback className="rounded-lg bg-brand-gradient text-white font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold text-sidebar-foreground">
                  {displayName}
                </span>
                <span className="text-sidebar-foreground/70 truncate text-sm">
                  {displayEmail}
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
                  {imageSrc ? <AvatarImage src={imageSrc} alt={displayName} /> : null}
                  <AvatarFallback className="rounded-lg bg-brand-gradient text-white font-semibold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold text-foreground">
                    {displayName}
                  </span>
                  <span className="text-muted-foreground truncate text-sm">
                    {displayEmail}
                  </span>
                  {authUser?.role ? <span className="text-xs text-brand-gradient font-medium capitalize">
                      {authUser.role}
                    </span> : null}
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
