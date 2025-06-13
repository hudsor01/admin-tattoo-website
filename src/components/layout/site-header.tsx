import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-3 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) shadow-sm">
      <div className="flex w-full items-center gap-2 px-6 lg:gap-4 lg:px-8">
        <SidebarTrigger className="-ml-1 hover:bg-accent/50 transition-colors rounded-lg p-2" />
        <Separator
          orientation="vertical"
          className="mx-3 data-[orientation=vertical]:h-5 bg-border/30"
        />
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-gradient-soft rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
            <div className="w-4 h-4 bg-brand-gradient rounded-md shadow-sm"></div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Admin Dashboard</h1>
            <p className="text-xl text-brand-gradient font-semibold">Ink 37 Tattoos</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
