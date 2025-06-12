"use client"

import { cn } from "@/lib/utils"

interface AdminPageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-black text-foreground">{title}</h1>
        {description && (
          <p className="text-lg text-muted-foreground mt-2">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </div>
  )
}

interface AdminPageStructureProps {
  header?: {
    title: string
    description?: string
    actions?: React.ReactNode
  }
  children: React.ReactNode
  className?: string
}

export function AdminPageStructure({ header, children, className }: AdminPageStructureProps) {
  return (
    <div className={cn("p-6 lg:p-8 space-y-6", className)}>
      {header && (
        <AdminPageHeader 
          title={header.title} 
          description={header.description}
        >
          {header.actions}
        </AdminPageHeader>
      )}
      {children}
    </div>
  )
}