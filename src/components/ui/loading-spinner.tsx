'use client'

import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  // Size classes based on the size prop
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }
  
  return (
    <div className={`flex items-center justify-center py-8 ${className ?? ''}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-red-500`} />
    </div>
  )
}