"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { authClient } from '@/lib/auth-client'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  type MaybeApiError = Error & { status?: number };

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
        retry: (failureCount: number, error: MaybeApiError) => {
          // Don't retry on 4xx client errors
          if (error?.status !== undefined && error.status >= 400 && error.status < 500) {
            return false
          }
          // Retry up to 3 times for network/server errors
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        networkMode: 'offlineFirst', // Better offline support
      },
      mutations: {
        retry: (failureCount: number, error: MaybeApiError) => {
          // Don't retry mutations on client errors
          if (error?.status !== undefined && error.status >= 400 && error.status < 500) {
            return false
          }
          return failureCount < 2
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        networkMode: 'offlineFirst',
      },
    }
  }))

  return (
    <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
      <QueryClientProvider client={queryClient}>
        <AuthUIProvider 
          authClient={authClient}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </AuthUIProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
