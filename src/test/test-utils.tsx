import React, { type ReactElement } from 'react';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { ThemeProvider } from '@/components/theme-provider'
import { vi } from 'vitest'

// Mock Better Auth UI hooks
vi.mock('@daveyplate/better-auth-ui', async () => {
  const actual = await vi.importActual('@daveyplate/better-auth-ui') as Record<string, unknown>
  return {
    ...actual,
    useSession: vi.fn().mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    }),
  }
})

// Mock window.matchMedia for next-themes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock auth client for testing
const mockAuthClient = {
  signIn: {
    email: vi.fn(),
    social: vi.fn(),
  },
  signUp: {
    email: vi.fn(),
  },
  signOut: vi.fn(),
  getSession: vi.fn(),
  useSession: vi.fn().mockReturnValue({
    data: null,
    isPending: false,
    error: null,
  }),
}

// Create a test query client with no retries and no caching
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const testQueryClient = queryClient || createTestQueryClient()

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={testQueryClient}>
        <AuthUIProvider authClient={mockAuthClient as Record<string, unknown>}>
          {children}
        </AuthUIProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) => {
  const { queryClient, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Mock API responses
export const mockApiResponses = {
  dashboardStats: {
    data: {
      totalRevenue: 15000,
      revenueGrowth: 12.5,
      newClients: 8,
      clientGrowth: 25.0,
      activeBookings: 12,
      bookingGrowth: 8.3,
      completionRate: 95,
      completionGrowth: 2.1,
    },
    error: null,
  },
  chartData: {
    data: [
      { date: '2024-01-01', revenue: 1200, sessions: 5 },
      { date: '2024-01-02', revenue: 1800, sessions: 7 },
      { date: '2024-01-03', revenue: 950, sessions: 4 },
    ],
    error: null,
  },
  recentClients: {
    data: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        joinDate: '2024-01-15',
        totalSessions: 3,
        totalSpent: 1200,
        lastSession: '2024-01-20',
      },
    ],
    error: null,
  },
  recentSessions: {
    data: [
      {
        id: '1',
        clientName: 'Jane Smith',
        artistName: 'Mike Johnson',
        type: 'Session',
        duration: 180,
        amount: 400,
        date: '2024-01-20',
        status: 'completed' as const,
      },
    ],
    error: null,
  },
}

// Mock user for auth testing
export const mockUser = {
  id: '1',
  email: 'admin@ink37tattoos.com',
  name: 'Admin User',
  role: 'admin',
  image: null,
  emailVerified: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Mock session for auth testing
export const mockSession = {
  user: mockUser,
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
}

// Helper to mock fetch responses
export function mockFetchResponse(data: Record<string, unknown>, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  })
}

// Helper to mock fetch error
export function mockFetchError(message = 'Network error', status = 500) {
  return vi.fn().mockRejectedValue(new Error(message))
}

// Helper to wait for React Query to settle
export async function waitForQueryToSettle() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override the default render with our custom render
export { customRender as render }

// Export the mock auth client for use in tests
export { mockAuthClient }
