import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CustomersList } from '@/components/customers/customers-list'

// Mock the fetch function
global.fetch = vi.fn()

// Mock data
const mockCustomersResponse = {
  data: [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-1234',
      dateOfBirth: new Date('1985-05-15'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      allergies: ['latex'],
      medicalConds: [],
      sessions: []
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-5678',
      dateOfBirth: new Date('1990-08-20'),
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
      allergies: [],
      medicalConds: [],
      sessions: []
    }
  ]
}

// Test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('CustomersList Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockCustomersResponse,
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render customers list with data', async () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      expect(screen.getByText('Customers')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
        expect(screen.getByText('555-1234')).toBeInTheDocument()
      })
    })

    it('should render search input', () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      const searchInput = screen.getByPlaceholderText(/search customers/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('should show customer count', async () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 2 customers')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading skeleton when loading', () => {
      // Mock loading state by making fetch hang
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      // Should show loading skeletons
      expect(screen.getAllByTestId('skeleton')).toHaveLength(8)
    })
  })

  describe('Error States', () => {
    it('should show error message when fetch fails', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Failed to fetch'))

      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to load customers/i)).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('should filter customers when searching', async () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search customers/i)
      await user.type(searchInput, 'john')

      // Should filter to show only John
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })

    it('should show no results when search has no matches', async () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search customers/i)
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByText(/no customers found matching your search/i)).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no customers exist', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response)

      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('No customers found')).toBeInTheDocument()
      })
    })
  })

  describe('Customer Information Display', () => {
    it('should display customer details correctly', async () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        // Check names
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        
        // Check emails
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument()
        
        // Check phones
        expect(screen.getByText('555-1234')).toBeInTheDocument()
        expect(screen.getByText('555-5678')).toBeInTheDocument()
      })
    })

    it('should show medical conditions badge when present', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{
            ...mockCustomersResponse.data[0],
            allergies: ['latex'],
            medicalConds: ['diabetes']
          }]
        }),
      } as Response)

      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Medical conditions noted')).toBeInTheDocument()
      })
    })

    it('should calculate and display age correctly', async () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        // John Doe born 1985-05-15, should be around 39 years old
        expect(screen.getByText(/Age 39/)).toBeInTheDocument()
        // Jane Smith born 1990-08-20, should be around 34 years old
        expect(screen.getByText(/Age 34/)).toBeInTheDocument()
      })
    })

    it('should format join dates correctly', async () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Joined Jan 15, 2024')).toBeInTheDocument()
        expect(screen.getByText('Joined Feb 1, 2024')).toBeInTheDocument()
      })
    })

    it('should show session count', async () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getAllByText('0 sessions')).toHaveLength(2)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      expect(screen.getByRole('heading', { name: 'Customers' })).toBeInTheDocument()
    })

    it('should have accessible search input', () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      const searchInput = screen.getByPlaceholderText(/search customers/i)
      expect(searchInput).toHaveAttribute('type', 'text')
    })
  })

  describe('API Integration', () => {
    it('should call the correct API endpoint', async () => {
      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/admin/customers')
      })
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      render(
        <TestWrapper>
          <CustomersList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to load customers/i)).toBeInTheDocument()
      })
    })
  })
})
