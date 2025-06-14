import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function SiteHeader() {
  return (
    <header className="flex min-h-16 lg:min-h-18 shrink-0 items-center gap-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-16 shadow-sm border-b border-border">
      <div className="flex w-full items-center gap-4 px-6 lg:px-8">
        <SidebarTrigger className="-ml-1 hover:bg-accent/50 transition-colors rounded-lg p-2" />
        <div className="flex items-center min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight truncate">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
