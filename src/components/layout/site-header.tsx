import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function SiteHeader() {
  return (
    <header className="flex min-h-20 lg:min-h-24 shrink-0 items-center gap-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-20 shadow-sm">
      <div className="flex w-full items-center gap-2 px-6 lg:gap-6 lg:px-8">
        <SidebarTrigger className="-ml-1 hover:bg-accent/50 transition-colors rounded-lg p-2" />
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="p-2 bg-brand-gradient-soft rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
            <div className="w-4 h-4 bg-brand-gradient rounded-md shadow-sm"></div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight truncate">Admin Dashboard</h1>
            <p className="text-lg sm:text-xl text-brand-gradient font-semibold">Ink 37 Tattoos</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
