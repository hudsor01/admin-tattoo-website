import React from 'react';

// CONVERTED TO SERVER COMPONENT: Pure display component with CSS classes only
// import { Badge } from '@/components/ui/badge'; // unused in this file
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      status: {
        pending: 'border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100',
        confirmed: 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100',
        completed: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
        cancelled: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
        'in-progress': 'border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100',
        'no-show': 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100',
        scheduled: 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100',
        paid: 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100',
        unpaid: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
        'partially-paid': 'border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100',
        refunded: 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100',
        active: 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100',
        inactive: 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100',
        draft: 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100',
        high: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
        medium: 'border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100',
        low: 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100',
        success: 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100',
        error: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
        info: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      status: 'pending',
      size: 'md',
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  text?: string;
  children?: React.ReactNode;
}

export function StatusBadge({
  status,
  size,
  text,
  children,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ status, size }), className)} {...props}>
      {text ?? children}
    </div>
  );
}

// Helper function to get status variant from string
export function getStatusVariant(
  status: string
): VariantProps<typeof statusBadgeVariants>['status'] {
  const statusMap: Record<string, VariantProps<typeof statusBadgeVariants>['status']> = {

    pending: 'pending',
    confirmed: 'confirmed',
    completed: 'completed',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    'in-progress': 'in-progress',
    in_progress: 'in-progress',
    inprogress: 'in-progress',
    'no-show': 'no-show',
    no_show: 'no-show',
    noshow: 'no-show',
    scheduled: 'scheduled',
    paid: 'paid',
    unpaid: 'unpaid',
    'partially-paid': 'partially-paid',
    partially_paid: 'partially-paid',
    refunded: 'refunded',
    active: 'active',
    inactive: 'inactive',
    draft: 'draft',
    high: 'high',
    medium: 'medium',
    low: 'low',
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
  };

  return statusMap[status.toLowerCase()] ?? 'pending';
}

export function AppointmentStatusBadge({
  status,
  ...props
}: Omit<StatusBadgeProps, 'status'> & { status: string }) {
  return (
    <StatusBadge
      status={getStatusVariant(status)}
      text={status.charAt(0).toUpperCase() + status.slice(1)}
      {...props}
    />
  );
}

export function PaymentStatusBadge({
  status,
  ...props
}: Omit<StatusBadgeProps, 'status'> & { status: string }) {
  return (
    <StatusBadge
      status={getStatusVariant(status)}
      text={status.charAt(0).toUpperCase() + status.slice(1)}
      {...props}
    />
  );
}

// Export the default component
export default StatusBadge;
