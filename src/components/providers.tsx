"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  type MaybeApiError = Error & { status?: number };
  const router = useRouter();

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        retry: (failureCount: number, error: MaybeApiError) => {
          if (error?.status !== undefined && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        networkMode: 'offlineFirst',
      },
      mutations: {
        retry: (failureCount: number, error: MaybeApiError) => {
          if (error?.status !== undefined && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        networkMode: 'offlineFirst',
      },
    }
  }));

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
          navigate={router.push}
          replace={router.replace}
          onSessionChange={() => {
            router.refresh();
          }}
          Link={Link}
        >
          {children}
        </AuthUIProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}