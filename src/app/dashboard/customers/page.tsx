"use client"

import { useState } from "react"
import { SectionCards } from "@/components/dashboard/section-cards"
import { CustomersList } from "@/components/customers/customers-list"
import { CustomerDialog } from "@/components/customers/customer-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import type { ClientResponse } from '@/types/database'

export default function CustomersPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<ClientResponse | undefined>(undefined)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create')

  const handleCreateNew = () => {
    setSelectedCustomer(undefined)
    setDialogMode('create')
    setDialogOpen(true)
  }

  const handleView = (customer: ClientResponse) => {
    setSelectedCustomer(customer)
    setDialogMode('view')
    setDialogOpen(true)
  }

  const handleEdit = (customer: ClientResponse) => {
    setSelectedCustomer(customer)
    setDialogMode('edit')
    setDialogOpen(true)
  }
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          
          {/* Page Header */}
          <div className="px-4 md:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-gradient">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Customers</h1>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Manage your client database and relationships
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCreateNew}
                  className="bg-brand-gradient-hover w-full sm:w-auto"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
              </div>
            </div>
          </div>
          
          <div className="px-4 md:px-6 lg:px-8">
            <CustomersList 
              onView={handleView}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </div>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
        mode={dialogMode}
      />
    </div>
  )
}
