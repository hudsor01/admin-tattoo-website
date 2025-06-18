import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function SiteHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-4 px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center min-w-0 flex-1">
          {/* Empty - content is now in dashboard page */}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
