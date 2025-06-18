"use client"

import {
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
import { Button } from "@/components/ui/button"
import { LogoutMenuItem } from "@/components/auth/logout-button"
import { useUser } from "@/stores/auth-store"

// Helper functions
function getImageSrc(user: unknown): string | undefined {
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

interface HeaderUserProps {
  user?: {
    name?: string | null
    email?: string | null
    avatar?: string | null
    image?: string | null
  }
}

export function HeaderUser({ user: propUser }: HeaderUserProps) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 w-10 rounded-full hover:bg-sidebar-accent/50 transition-colors p-0"
        >
          <Avatar className="h-8 w-8 rounded-full ring-2 ring-border">
            {imageSrc ? <AvatarImage src={imageSrc} alt={displayName} /> : null}
            <AvatarFallback className="rounded-full bg-brand-gradient text-white font-semibold text-sm">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg shadow-lg border-border/50"
        side="bottom"
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
              {authUser?.role ? (
                <span className="text-xs text-brand-gradient font-medium capitalize">
                  {authUser.role}
                </span>
              ) : null}
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
  )
}
