"use client"

import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type ReactNode, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { authClient } from "@/lib/auth-client"

export function Providers({ children }: { children: ReactNode }) {
    const router = useRouter()
    
    type MaybeApiError = Error & { status?: number }
    
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5, // 5 minutes
                gcTime: 1000 * 60 * 30, // 30 minutes
                retry: (failureCount, error: MaybeApiError) => {
                    if (error?.status !== undefined && error.status >= 400 && error.status < 500) {
                        return false;
                    }
                    return failureCount < 3;
                },
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                refetchOnWindowFocus: false,
                refetchOnReconnect: 'always',
                // Smart refetch intervals based on query type
                refetchInterval: (query) => {
                    if (query.queryKey.includes('dashboard-stats')) return 5 * 60 * 1000 // 5 min
                    if (query.queryKey.includes('recent-sessions')) return 2 * 60 * 1000 // 2 min
                    if (query.queryKey.includes('recent-clients')) return 5 * 60 * 1000 // 5 min
                    return false // No auto-refetch for other queries
                },
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
                    navigate={router.push}
                    replace={router.replace}
                    onSessionChange={() => {
                        router.refresh()
                    }}
                    Link={Link}
                >
                    {children}
                </AuthUIProvider>
            </QueryClientProvider>
        </ThemeProvider>
    )
}