import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Providers } from '@/components/providers'

// Mock QueryClient and QueryClientProvider
const mockQueryClient = {
  defaultOptions: {
    queries: expect.any(Object),
    mutations: expect.any(Object),
  }
}

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => mockQueryClient),
  QueryClientProvider: ({ children, client }: any) => (
    <div data-testid="query-client-provider" data-client={JSON.stringify(client)}>
      {children}
    </div>
  ),
}))

// Mock ThemeProvider
vi.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children, attribute, defaultTheme, enableSystem, disableTransitionOnChange }: any) => (
    <div 
      data-testid="theme-provider" 
      data-attribute={attribute}
      data-default-theme={defaultTheme}
      data-enable-system={enableSystem}
      data-disable-transition={disableTransitionOnChange}
    >
      {children}
    </div>
  ),
}))

// Mock AuthProvider
vi.mock('@/components/providers/AuthProvider', () => ({
  AuthProvider: ({ children }: any) => (
    <div data-testid="auth-provider">
      {children}
    </div>
  ),
}))

// Mock AuthUIProvider
vi.mock('@daveyplate/better-auth-ui', () => ({
  AuthUIProvider: ({ children, authClient }: any) => (
    <div data-testid="auth-ui-provider" data-auth-client={JSON.stringify(authClient)}>
      {children}
    </div>
  ),
}))

// Mock auth client
const mockAuthClient = { 
  baseURL: 'http://localhost:3001/api/auth',
  credentials: 'same-origin' 
}

vi.mock('@/lib/auth-client', () => ({
  authClient: mockAuthClient,
}))

// Mock useState to track QueryClient creation
const mockSetState = vi.fn()
const originalUseState = vi.fn()

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useState: (initialValue: any) => {
      const result = typeof initialValue === 'function' ? initialValue() : initialValue
      originalUseState(result)
      return [result, mockSetState]
    },
  }
})

describe('Providers Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render children with all providers', () => {
      render(
        <Providers>
          <div data-testid="test-child">Test Content</div>
        </Providers>
      )

      expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-ui-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <Providers>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </Providers>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      render(<Providers>{null}</Providers>)

      expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-ui-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
    })
  })

  describe('Provider Hierarchy', () => {
    it('should render providers in correct nesting order', () => {
      render(
        <Providers>
          <div data-testid="content">Content</div>
        </Providers>
      )

      const themeProvider = screen.getByTestId('theme-provider')
      const queryProvider = screen.getByTestId('query-client-provider')
      const authUIProvider = screen.getByTestId('auth-ui-provider')
      const authProvider = screen.getByTestId('auth-provider')

      // Check hierarchy: ThemeProvider > QueryClientProvider > AuthUIProvider > AuthProvider > Content
      expect(themeProvider).toContainElement(queryProvider)
      expect(queryProvider).toContainElement(authUIProvider)
      expect(authUIProvider).toContainElement(authProvider)
      expect(authProvider).toContainElement(screen.getByTestId('content'))
    })

    it('should maintain provider separation and encapsulation', () => {
      render(
        <Providers>
          <div data-testid="nested-content">Nested Content</div>
        </Providers>
      )

      // Each provider should be independently testable
      expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-ui-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
    })
  })

  describe('ThemeProvider Configuration', () => {
    it('should configure ThemeProvider with correct props', () => {
      render(
        <Providers>
          <div>Content</div>
        </Providers>
      )

      const themeProvider = screen.getByTestId('theme-provider')
      expect(themeProvider).toHaveAttribute('data-attribute', 'class')
      expect(themeProvider).toHaveAttribute('data-default-theme', 'system')
      expect(themeProvider).toHaveAttribute('data-enable-system', 'true')
      expect(themeProvider).toHaveAttribute('data-disable-transition', 'true')
    })
  })

  describe('QueryClient Configuration', () => {
    it('should create QueryClient with proper configuration', () => {
      const { QueryClient } = require('@tanstack/react-query')
      
      render(
        <Providers>
          <div>Content</div>
        </Providers>
      )

      expect(QueryClient).toHaveBeenCalledWith({
        defaultOptions: {
          queries: {
            staleTime: 300000, // 5 minutes
            gcTime: 1800000, // 30 minutes
            retry: expect.any(Function),
            retryDelay: expect.any(Function),
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: true,
            networkMode: 'offlineFirst',
          },
          mutations: {
            retry: expect.any(Function),
            retryDelay: expect.any(Function),
            networkMode: 'offlineFirst',
          },
        }
      })
    })

    it('should pass QueryClient to QueryClientProvider', () => {
      render(
        <Providers>
          <div>Content</div>
        </Providers>
      )

      const queryProvider = screen.getByTestId('query-client-provider')
      const clientData = queryProvider.getAttribute('data-client')
      const client = JSON.parse(clientData!)
      
      expect(client).toEqual(mockQueryClient)
    })

    it('should create QueryClient only once', () => {
      const { QueryClient } = require('@tanstack/react-query')
      
      const { rerender } = render(
        <Providers>
          <div>Content 1</div>
        </Providers>
      )

      const initialCallCount = QueryClient.mock.calls.length

      rerender(
        <Providers>
          <div>Content 2</div>
        </Providers>
      )

      // Should not create a new QueryClient on rerender
      expect(QueryClient.mock.calls.length).toBe(initialCallCount)
    })
  })

  describe('AuthUIProvider Configuration', () => {
    it('should pass authClient to AuthUIProvider', () => {
      render(
        <Providers>
          <div>Content</div>
        </Providers>
      )

      const authUIProvider = screen.getByTestId('auth-ui-provider')
      const authClientData = authUIProvider.getAttribute('data-auth-client')
      const authClient = JSON.parse(authClientData!)
      
      expect(authClient).toEqual(mockAuthClient)
    })
  })

  describe('QueryClient Retry Logic', () => {
    it('should configure queries retry logic correctly', () => {
      const { QueryClient } = require('@tanstack/react-query')
      
      render(
        <Providers>
          <div>Content</div>
        </Providers>
      )

      const config = QueryClient.mock.calls[0][0]
      const queriesRetry = config.defaultOptions.queries.retry

      // Test 4xx errors (should not retry)
      const clientError = new Error('Client Error') as Error & { status?: number }
      clientError.status = 404
      expect(queriesRetry(1, clientError)).toBe(false)

      clientError.status = 400
      expect(queriesRetry(1, clientError)).toBe(false)

      clientError.status = 422
      expect(queriesRetry(2, clientError)).toBe(false)

      // Test 5xx errors (should retry up to 3 times)
      const serverError = new Error('Server Error') as Error & { status?: number }
      serverError.status = 500
      expect(queriesRetry(0, serverError)).toBe(true)
      expect(queriesRetry(1, serverError)).toBe(true)
      expect(queriesRetry(2, serverError)).toBe(true)
      expect(queriesRetry(3, serverError)).toBe(false)

      // Test network errors (no status)
      const networkError = new Error('Network Error')
      expect(queriesRetry(0, networkError)).toBe(true)
      expect(queriesRetry(1, networkError)).toBe(true)
      expect(queriesRetry(2, networkError)).toBe(true)
      expect(queriesRetry(3, networkError)).toBe(false)
    })

    it('should configure mutations retry logic correctly', () => {
      const { QueryClient } = require('@tanstack/react-query')
      
      render(
        <Providers>
          <div>Content</div>
        </Providers>
      )

      const config = QueryClient.mock.calls[0][0]
      const mutationsRetry = config.defaultOptions.mutations.retry

      // Test 4xx errors (should not retry)
      const clientError = new Error('Client Error') as Error & { status?: number }
      clientError.status = 400
      expect(mutationsRetry(1, clientError)).toBe(false)

      // Test 5xx errors (should retry up to 2 times)
      const serverError = new Error('Server Error') as Error & { status?: number }
      serverError.status = 500
      expect(mutationsRetry(0, serverError)).toBe(true)
      expect(mutationsRetry(1, serverError)).toBe(true)
      expect(mutationsRetry(2, serverError)).toBe(false)

      // Test network errors
      const networkError = new Error('Network Error')
      expect(mutationsRetry(0, networkError)).toBe(true)
      expect(mutationsRetry(1, networkError)).toBe(true)
      expect(mutationsRetry(2, networkError)).toBe(false)
    })

    it('should configure retry delays correctly', () => {
      const { QueryClient } = require('@tanstack/react-query')
      
      render(
        <Providers>
          <div>Content</div>
        </Providers>
      )

      const config = QueryClient.mock.calls[0][0]
      const queriesRetryDelay = config.defaultOptions.queries.retryDelay
      const mutationsRetryDelay = config.defaultOptions.mutations.retryDelay

      // Test queries exponential backoff (max 30000ms)
      expect(queriesRetryDelay(0)).toBe(1000) // 2^0 * 1000
      expect(queriesRetryDelay(1)).toBe(2000) // 2^1 * 1000
      expect(queriesRetryDelay(2)).toBe(4000) // 2^2 * 1000
      expect(queriesRetryDelay(10)).toBe(30000) // Capped at 30000

      // Test mutations exponential backoff (max 10000ms)
      expect(mutationsRetryDelay(0)).toBe(1000) // 2^0 * 1000
      expect(mutationsRetryDelay(1)).toBe(2000) // 2^1 * 1000
      expect(mutationsRetryDelay(2)).toBe(4000) // 2^2 * 1000
      expect(mutationsRetryDelay(10)).toBe(10000) // Capped at 10000
    })
  })

  describe('Component Lifecycle', () => {
    it('should handle mounting and unmounting cleanly', () => {
      const { unmount } = render(
        <Providers>
          <div data-testid="content">Content</div>
        </Providers>
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()

      unmount()

      // Should not cause errors or warnings
      expect(() => unmount()).not.toThrow()
    })

    it('should handle remounting', () => {
      const { unmount, rerender } = render(
        <Providers>
          <div data-testid="content-1">Content 1</div>
        </Providers>
      )

      expect(screen.getByTestId('content-1')).toBeInTheDocument()

      unmount()

      rerender(
        <Providers>
          <div data-testid="content-2">Content 2</div>
        </Providers>
      )

      expect(screen.getByTestId('content-2')).toBeInTheDocument()
    })

    it('should maintain stable provider configuration across re-renders', () => {
      const { rerender } = render(
        <Providers>
          <div data-testid="content-1">Content 1</div>
        </Providers>
      )

      const initialThemeProvider = screen.getByTestId('theme-provider')
      const initialQueryProvider = screen.getByTestId('query-client-provider')

      rerender(
        <Providers>
          <div data-testid="content-2">Content 2</div>
        </Providers>
      )

      const updatedThemeProvider = screen.getByTestId('theme-provider')
      const updatedQueryProvider = screen.getByTestId('query-client-provider')

      // Provider configurations should remain the same
      expect(updatedThemeProvider.getAttribute('data-attribute')).toBe(
        initialThemeProvider.getAttribute('data-attribute')
      )
      expect(updatedQueryProvider.getAttribute('data-client')).toBe(
        initialQueryProvider.getAttribute('data-client')
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle child component errors gracefully', () => {
      const ThrowingComponent = () => {
        throw new Error('Child component error')
      }

      // This test ensures the providers structure doesn't interfere with error boundaries
      expect(() => {
        render(
          <Providers>
            <ThrowingComponent />
          </Providers>
        )
      }).toThrow('Child component error')
    })

    it('should maintain provider hierarchy during errors', () => {
      const ConditionalError = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Conditional error')
        }
        return <div data-testid="success-content">Success</div>
      }

      const { rerender } = render(
        <Providers>
          <ConditionalError shouldThrow={false} />
        </Providers>
      )

      expect(screen.getByTestId('success-content')).toBeInTheDocument()

      // Providers should still be rendered even if child throws
      expect(() => {
        rerender(
          <Providers>
            <ConditionalError shouldThrow={true} />
          </Providers>
        )
      }).toThrow('Conditional error')
    })
  })

  describe('Performance', () => {
    it('should not recreate QueryClient on every render', () => {
      const { QueryClient } = require('@tanstack/react-query')
      const initialCallCount = QueryClient.mock.calls.length

      const { rerender } = render(
        <Providers>
          <div>Content 1</div>
        </Providers>
      )

      rerender(
        <Providers>
          <div>Content 2</div>
        </Providers>
      )

      rerender(
        <Providers>
          <div>Content 3</div>
        </Providers>
      )

      // QueryClient should only be created once
      expect(QueryClient.mock.calls.length).toBe(initialCallCount + 1)
    })

    it('should handle rapid re-renders efficiently', () => {
      const { rerender } = render(
        <Providers>
          <div data-testid="content">Initial</div>
        </Providers>
      )

      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(
          <Providers>
            <div data-testid="content">Content {i}</div>
          </Providers>
        )
      }

      expect(screen.getByTestId('content')).toHaveTextContent('Content 9')
    })
  })

  describe('TypeScript Integration', () => {
    it('should accept ReactNode children prop', () => {
      // Test with various ReactNode types
      render(
        <Providers>
          <div>String content</div>
          {null}
          {false}
          {123}
          <span>Multiple elements</span>
        </Providers>
      )

      expect(screen.getByText('String content')).toBeInTheDocument()
      expect(screen.getByText('Multiple elements')).toBeInTheDocument()
    })

    it('should handle complex children structures', () => {
      const ComplexChildren = () => (
        <>
          <div data-testid="fragment-child-1">Fragment Child 1</div>
          <div data-testid="fragment-child-2">Fragment Child 2</div>
        </>
      )

      render(
        <Providers>
          <ComplexChildren />
          <div data-testid="sibling">Sibling</div>
        </Providers>
      )

      expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument()
      expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument()
      expect(screen.getByTestId('sibling')).toBeInTheDocument()
    })
  })

  describe('Integration with Mocked Dependencies', () => {
    it('should correctly integrate with all mocked providers', async () => {
      render(
        <Providers>
          <div data-testid="integration-test">Integration Test Content</div>
        </Providers>
      )

      // All providers should be present
      expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-ui-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
      expect(screen.getByTestId('integration-test')).toBeInTheDocument()

      // Check that mocked auth client is passed correctly
      const authUIProvider = screen.getByTestId('auth-ui-provider')
      const authClientData = authUIProvider.getAttribute('data-auth-client')
      expect(JSON.parse(authClientData!)).toEqual(mockAuthClient)
    })
  })
})