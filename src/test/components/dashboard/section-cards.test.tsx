import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SectionCards } from '@/components/dashboard/section-cards'

// Mock Tabler icons
vi.mock('@tabler/icons-react', () => ({
  IconTrendingUp: vi.fn(({ className, ...props }) => (
    <svg 
      data-testid="icon-trending-up" 
      className={className} 
      {...props}
    >
      <path d="trending-up" />
    </svg>
  )),
  IconTrendingDown: vi.fn(({ className, ...props }) => (
    <svg 
      data-testid="icon-trending-down" 
      className={className} 
      {...props}
    >
      <path d="trending-down" />
    </svg>
  ))
}))

// Mock the dashboard data hook
const mockUseDashboardData = vi.fn()
vi.mock('@/hooks/use-dashboard-data', () => ({
  useDashboardData: () => mockUseDashboardData()
}))

// Mock data structure based on component expectations
const mockDashboardData = {
  stats: {
    revenue: 125000,
    revenueChange: '+15.2%',
    totalClients: 342,
    clientsChange: '+18',
    monthlyAppointments: 89,
    appointmentsChange: '+12.5%',
    averageRating: 4.8,
    ratingChange: '+0.3'
  },
  chartData: []
}

const mockDashboardDataNegative = {
  stats: {
    revenue: 95000,
    revenueChange: '-8.7%',
    totalClients: 298,
    clientsChange: '-12',
    monthlyAppointments: 65,
    appointmentsChange: '-5.2%',
    averageRating: 4.2,
    ratingChange: '-0.4'
  },
  chartData: []
}

const mockDashboardDataMixed = {
  stats: {
    revenue: 110000,
    revenueChange: '+8.1%',
    totalClients: 315,
    clientsChange: '-5',
    monthlyAppointments: 76,
    appointmentsChange: '+3.8%',
    averageRating: 4.6,
    ratingChange: '-0.1'
  },
  chartData: []
}

const mockDashboardDataLarge = {
  stats: {
    revenue: 2500000, // 2.5M
    revenueChange: '+25.0%',
    totalClients: 1250,
    clientsChange: '+150',
    monthlyAppointments: 450,
    appointmentsChange: '+75.5%',
    averageRating: 4.95,
    ratingChange: '+0.15'
  },
  chartData: []
}

const mockDashboardDataSmall = {
  stats: {
    revenue: 850, // Under 1K
    revenueChange: '+2.1%',
    totalClients: 15,
    clientsChange: '+3',
    monthlyAppointments: 8,
    appointmentsChange: '+1.2%',
    averageRating: 3.8,
    ratingChange: '+0.05'
  },
  chartData: []
}

// Create a wrapper component with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('SectionCards Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should render 4 skeleton cards when loading', () => {
      mockUseDashboardData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      // Should render 4 skeleton cards
      const cards = document.querySelectorAll('[class*="bg-card"]')
      expect(cards).toHaveLength(4)

      // Should have proper skeleton elements
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBeGreaterThanOrEqual(8) // At least 2 skeletons per card

      // Check grid layout classes
      const gridContainer = document.querySelector('.grid')
      expect(gridContainer).toHaveClass('grid-cols-1', 'gap-8', 'px-6', 'lg:px-8')
      expect(gridContainer).toHaveClass('@xl/main:grid-cols-2', '@5xl/main:grid-cols-4')
    })

    it('should have correct skeleton structure for each card', () => {
      mockUseDashboardData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      // Each card should have CardHeader and CardFooter
      const cardHeaders = document.querySelectorAll('[class*="pb-4"]')
      const cardFooters = document.querySelectorAll('[class*="flex-col"]')
      
      expect(cardHeaders).toHaveLength(4)
      expect(cardFooters.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('Error State', () => {
    it('should render error message when error occurs', () => {
      mockUseDashboardData.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch dashboard data')
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      expect(screen.getByText('Error loading dashboard data')).toBeInTheDocument()
      expect(screen.getByText('Please try refreshing the page')).toBeInTheDocument()
      
      // Should have error styling
      const errorTitle = screen.getByText('Error loading dashboard data')
      expect(errorTitle).toHaveClass('text-red-600')
    })

    it('should render error message when data is null', () => {
      mockUseDashboardData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      expect(screen.getByText('Error loading dashboard data')).toBeInTheDocument()
      expect(screen.getByText('Please try refreshing the page')).toBeInTheDocument()
    })
  })

  describe('Helper Functions', () => {
    describe('isPositive function', () => {
      it('should correctly identify positive changes', () => {
        mockUseDashboardData.mockReturnValue({
          data: mockDashboardData,
          isLoading: false,
          error: null
        })

        const Wrapper = createWrapper()
        render(<SectionCards />, { wrapper: Wrapper })

        // All badges should have positive (green/blue/purple) styling for positive changes
        const positiveBadges = document.querySelectorAll('[class*="from-green-50"], [class*="from-blue-50"], [class*="from-purple-50"]')
        expect(positiveBadges.length).toBeGreaterThan(0)

        // Should show "Trending up" text
        expect(screen.getByText('Trending up this month')).toBeInTheDocument()
        expect(screen.getByText('Growing client base')).toBeInTheDocument()
        expect(screen.getByText('Booking momentum')).toBeInTheDocument()
        expect(screen.getByText('Improving satisfaction')).toBeInTheDocument()
      })

      it('should correctly identify negative changes', () => {
        mockUseDashboardData.mockReturnValue({
          data: mockDashboardDataNegative,
          isLoading: false,
          error: null
        })

        const Wrapper = createWrapper()
        render(<SectionCards />, { wrapper: Wrapper })

        // Should show negative trend messages
        expect(screen.getByText('Down this month')).toBeInTheDocument()
        expect(screen.getByText('Client acquisition needs attention')).toBeInTheDocument()
        expect(screen.getByText('Bookings declining')).toBeInTheDocument()
        expect(screen.getByText('Maintain quality focus')).toBeInTheDocument()
      })
    })

    describe('formatCurrency function', () => {
      it('should format large amounts with M suffix', () => {
        mockUseDashboardData.mockReturnValue({
          data: mockDashboardDataLarge,
          isLoading: false,
          error: null
        })

        const Wrapper = createWrapper()
        render(<SectionCards />, { wrapper: Wrapper })

        expect(screen.getByText('$2.5M')).toBeInTheDocument()
      })

      it('should format thousands with K suffix', () => {
        mockUseDashboardData.mockReturnValue({
          data: mockDashboardData,
          isLoading: false,
          error: null
        })

        const Wrapper = createWrapper()
        render(<SectionCards />, { wrapper: Wrapper })

        expect(screen.getByText('$125K')).toBeInTheDocument()
      })

      it('should format small amounts without suffix', () => {
        mockUseDashboardData.mockReturnValue({
          data: mockDashboardDataSmall,
          isLoading: false,
          error: null
        })

        const Wrapper = createWrapper()
        render(<SectionCards />, { wrapper: Wrapper })

        expect(screen.getByText('$850')).toBeInTheDocument()
      })

      it('should handle exactly 1000 correctly', () => {
        const exactThousandData = {
          stats: {
            ...mockDashboardData.stats,
            revenue: 1000
          }
        }

        mockUseDashboardData.mockReturnValue({
          data: exactThousandData,
          isLoading: false,
          error: null
        })

        const Wrapper = createWrapper()
        render(<SectionCards />, { wrapper: Wrapper })

        expect(screen.getByText('$1K')).toBeInTheDocument()
      })

      it('should handle exactly 1000000 correctly', () => {
        const exactMillionData = {
          stats: {
            ...mockDashboardData.stats,
            revenue: 1000000
          }
        }

        mockUseDashboardData.mockReturnValue({
          data: exactMillionData,
          isLoading: false,
          error: null
        })

        const Wrapper = createWrapper()
        render(<SectionCards />, { wrapper: Wrapper })

        expect(screen.getByText('$1.0M')).toBeInTheDocument()
      })
    })
  })

  describe('Data Display', () => {
    it('should render all 4 metric cards with correct data', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      // Check card titles
      expect(screen.getByText('TOTAL REVENUE')).toBeInTheDocument()
      expect(screen.getByText('TOTAL CLIENTS')).toBeInTheDocument()
      expect(screen.getByText('MONTHLY APPOINTMENTS')).toBeInTheDocument()
      expect(screen.getByText('SATISFACTION RATING')).toBeInTheDocument()

      // Check main values
      expect(screen.getByText('$125K')).toBeInTheDocument()
      expect(screen.getByText('342')).toBeInTheDocument()
      expect(screen.getByText('89')).toBeInTheDocument()
      expect(screen.getByText('4.8')).toBeInTheDocument()

      // Check change values
      expect(screen.getByText('+15.2%')).toBeInTheDocument()
      expect(screen.getByText('+18')).toBeInTheDocument()
      expect(screen.getByText('+12.5%')).toBeInTheDocument()
      expect(screen.getByText('+0.3')).toBeInTheDocument()
    })

    it('should display correct footer descriptions', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      expect(screen.getByText('Revenue for the last 6 months')).toBeInTheDocument()
      expect(screen.getByText('Strong growth this month')).toBeInTheDocument()
      expect(screen.getByText('Exceeds targets')).toBeInTheDocument()
      expect(screen.getByText('Based on completion rates')).toBeInTheDocument()
    })

    it('should handle client count with proper formatting', () => {
      const largeClientData = {
        stats: {
          ...mockDashboardData.stats,
          totalClients: 1234
        }
      }

      mockUseDashboardData.mockReturnValue({
        data: largeClientData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      expect(screen.getByText('1,234')).toBeInTheDocument()
    })
  })

  describe('Trend Testing', () => {
    it('should show correct trend icons for positive changes', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const upTrendIcons = screen.getAllByTestId('icon-trending-up')
      expect(upTrendIcons.length).toBeGreaterThanOrEqual(8) // 2 per positive card (badge + footer)
    })

    it('should show correct trend icons for negative changes', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardDataNegative,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const downTrendIcons = screen.getAllByTestId('icon-trending-down')
      expect(downTrendIcons.length).toBeGreaterThanOrEqual(8) // 2 per negative card (badge + footer)
    })

    it('should handle mixed trends correctly', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardDataMixed,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const upTrendIcons = screen.getAllByTestId('icon-trending-up')
      const downTrendIcons = screen.getAllByTestId('icon-trending-down')

      expect(upTrendIcons.length).toBeGreaterThan(0)
      expect(downTrendIcons.length).toBeGreaterThan(0)

      // Should show mixed messages
      expect(screen.getByText('Trending up this month')).toBeInTheDocument() // Revenue positive
      expect(screen.getByText('Client acquisition needs attention')).toBeInTheDocument() // Clients negative
    })
  })

  describe('Badge Styling', () => {
    it('should apply correct styling for revenue card positive trend', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const revenueBadge = screen.getByText('+15.2%').closest('[class*="bg-gradient-to-r"]')
      expect(revenueBadge).toHaveClass('from-green-50', 'to-emerald-50', 'text-green-700', 'border-green-300')
    })

    it('should apply correct styling for clients card positive trend', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const clientsBadge = screen.getByText('+18').closest('[class*="bg-gradient-to-r"]')
      expect(clientsBadge).toHaveClass('from-blue-50', 'to-cyan-50', 'text-blue-700', 'border-blue-300')
    })

    it('should apply correct styling for appointments card positive trend', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const appointmentsBadge = screen.getByText('+12.5%').closest('[class*="bg-gradient-to-r"]')
      expect(appointmentsBadge).toHaveClass('from-purple-50', 'to-violet-50', 'text-purple-700', 'border-purple-300')
    })

    it('should apply correct styling for rating card positive trend', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const ratingBadge = screen.getByText('+0.3').closest('[class*="bg-gradient-to-r"]')
      expect(ratingBadge).toHaveClass('from-green-50', 'to-emerald-50', 'text-green-700', 'border-green-300')
    })

    it('should apply different negative styling for appointments card', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardDataNegative,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const appointmentsBadge = screen.getByText('-5.2%').closest('[class*="bg-gradient-to-r"]')
      expect(appointmentsBadge).toHaveClass('from-orange-50', 'to-amber-50', 'text-orange-700', 'border-orange-300')
    })

    it('should apply different negative styling for rating card', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardDataNegative,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const ratingBadge = screen.getByText('-0.4').closest('[class*="bg-gradient-to-r"]')
      expect(ratingBadge).toHaveClass('from-yellow-50', 'to-amber-50', 'text-yellow-700', 'border-yellow-300')
    })
  })

  describe('Responsive Design', () => {
    it('should have proper grid layout classes', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const gridContainer = document.querySelector('.grid')
      expect(gridContainer).toHaveClass(
        'grid-cols-1',
        'gap-8',
        'px-6',
        'lg:px-8',
        '@xl/main:grid-cols-2',
        '@5xl/main:grid-cols-4'
      )
    })

    it('should have container query classes on cards', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const cards = document.querySelectorAll('[class*="@container/card"]')
      expect(cards).toHaveLength(4)
    })

    it('should have responsive typography classes', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      // Check for responsive text sizing
      const responsiveText = document.querySelectorAll('[class*="@[250px]/card:text-5xl"]')
      expect(responsiveText.length).toBeGreaterThan(0)

      const moreResponsiveText = document.querySelectorAll('[class*="@[350px]/card:text-6xl"]')
      expect(moreResponsiveText.length).toBeGreaterThan(0)
    })

    it('should have responsive flex layout classes', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const responsiveFlex = document.querySelectorAll('[class*="@[280px]/card:flex-row"]')
      expect(responsiveFlex.length).toBeGreaterThan(0)

      const responsiveItems = document.querySelectorAll('[class*="@[280px]/card:items-center"]')
      expect(responsiveItems.length).toBeGreaterThan(0)
    })
  })

  describe('Hover Effects', () => {
    it('should have hover transition classes', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const cards = document.querySelectorAll('[class*="transition-all"]')
      expect(cards).toHaveLength(4)

      const durationCards = document.querySelectorAll('[class*="duration-300"]')
      expect(durationCards).toHaveLength(4)
    })

    it('should have hover scale and shadow effects', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const hoverScale = document.querySelectorAll('[class*="hover:scale-[1.02]"]')
      expect(hoverScale).toHaveLength(4)

      const hoverShadow = document.querySelectorAll('[class*="hover:shadow-xl"]')
      expect(hoverShadow).toHaveLength(4)

      const hoverBorder = document.querySelectorAll('[class*="hover:border-orange-200"]')
      expect(hoverBorder).toHaveLength(4)
    })

    it('should have base shadow effects', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const baseShadow = document.querySelectorAll('[class*="shadow-lg"]')
      expect(baseShadow).toHaveLength(4)

      const shadowBlack = document.querySelectorAll('[class*="shadow-black/5"]')
      expect(shadowBlack).toHaveLength(4)
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      // Card descriptions should be accessible
      expect(screen.getByText('TOTAL REVENUE')).toBeInTheDocument()
      expect(screen.getByText('TOTAL CLIENTS')).toBeInTheDocument()
      expect(screen.getByText('MONTHLY APPOINTMENTS')).toBeInTheDocument()
      expect(screen.getByText('SATISFACTION RATING')).toBeInTheDocument()
    })

    it('should have tabular numbers for better readability', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      const tabularNums = document.querySelectorAll('[class*="tabular-nums"]')
      expect(tabularNums).toHaveLength(4) // One per card title
    })

    it('should have proper contrast with color schemes', () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      // Check for proper text color classes
      const foregroundText = document.querySelectorAll('[class*="text-foreground"]')
      expect(foregroundText.length).toBeGreaterThan(0)

      const mutedText = document.querySelectorAll('[class*="text-muted-foreground"]')
      expect(mutedText.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const zeroData = {
        stats: {
          revenue: 0,
          revenueChange: '+0%',
          totalClients: 0,
          clientsChange: '+0',
          monthlyAppointments: 0,
          appointmentsChange: '+0%',
          averageRating: 0,
          ratingChange: '+0'
        }
      }

      mockUseDashboardData.mockReturnValue({
        data: zeroData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      expect(screen.getByText('$0')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getAllByText('0')).toHaveLength(3) // clients, appointments, rating
    })

    it('should handle missing stats object', () => {
      const noStatsData = {
        chartData: []
      }

      mockUseDashboardData.mockReturnValue({
        data: noStatsData as any,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      
      // This should trigger the error state since stats is undefined
      expect(() => {
        render(<SectionCards />, { wrapper: Wrapper })
      }).not.toThrow()
    })

    it('should handle malformed change values', () => {
      const malformedData = {
        stats: {
          revenue: 50000,
          revenueChange: 'invalid', // Should still render
          totalClients: 200,
          clientsChange: '', // Empty string
          monthlyAppointments: 45,
          appointmentsChange: null as any, // Null value
          averageRating: 4.5,
          ratingChange: undefined as any // Undefined value
        }
      }

      mockUseDashboardData.mockReturnValue({
        data: malformedData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      
      expect(() => {
        render(<SectionCards />, { wrapper: Wrapper })
      }).not.toThrow()

      // Should still render the main values
      expect(screen.getByText('$50K')).toBeInTheDocument()
      expect(screen.getByText('200')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('4.5')).toBeInTheDocument()
    })

    it('should handle very large numbers correctly', () => {
      const veryLargeData = {
        stats: {
          revenue: 15750000, // 15.75M
          revenueChange: '+125.5%',
          totalClients: 99999,
          clientsChange: '+9999',
          monthlyAppointments: 9999,
          appointmentsChange: '+999.9%',
          averageRating: 5.0,
          ratingChange: '+2.0'
        }
      }

      mockUseDashboardData.mockReturnValue({
        data: veryLargeData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      expect(screen.getByText('$15.8M')).toBeInTheDocument() // Rounded to 1 decimal
      expect(screen.getByText('99,999')).toBeInTheDocument() // Comma formatting
      expect(screen.getByText('+125.5%')).toBeInTheDocument()
      expect(screen.getByText('+9999')).toBeInTheDocument()
    })

    it('should handle decimal values in ratings', () => {
      const decimalData = {
        stats: {
          revenue: 75000,
          revenueChange: '+5.25%',
          totalClients: 150,
          clientsChange: '+7.5',
          monthlyAppointments: 25,
          appointmentsChange: '+12.75%',
          averageRating: 4.75,
          ratingChange: '+0.125'
        }
      }

      mockUseDashboardData.mockReturnValue({
        data: decimalData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      expect(screen.getByText('4.75')).toBeInTheDocument()
      expect(screen.getByText('+0.125')).toBeInTheDocument()
      expect(screen.getByText('+5.25%')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should render efficiently with data updates', () => {
      const { rerender } = render(
        <QueryClientProvider client={new QueryClient()}>
          <SectionCards />
        </QueryClientProvider>
      )

      // Initial loading state
      mockUseDashboardData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      })

      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <SectionCards />
        </QueryClientProvider>
      )

      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBeGreaterThan(0)

      // Update to data state
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <SectionCards />
        </QueryClientProvider>
      )

      expect(screen.getByText('$125K')).toBeInTheDocument()
    })

    it('should handle rapid consecutive updates', () => {
      const Wrapper = createWrapper()
      const { rerender } = render(<SectionCards />, { wrapper: Wrapper })

      // Simulate rapid data updates
      for (let i = 0; i < 5; i++) {
        const updateData = {
          stats: {
            ...mockDashboardData.stats,
            revenue: 100000 + i * 5000,
            revenueChange: `+${10 + i}%`
          }
        }

        mockUseDashboardData.mockReturnValue({
          data: updateData,
          isLoading: false,
          error: null
        })

        rerender(<SectionCards />)
      }

      // Final state should be correct
      expect(screen.getByText('$120K')).toBeInTheDocument()
      expect(screen.getByText('+14%')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('should work with QueryClient provider', async () => {
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      const Wrapper = createWrapper()
      render(<SectionCards />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByText('$125K')).toBeInTheDocument()
      })
    })

    it('should handle async data loading properly', async () => {
      // Start with loading
      mockUseDashboardData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      })

      const Wrapper = createWrapper()
      const { rerender } = render(<SectionCards />, { wrapper: Wrapper })

      // Should show skeleton
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)

      // Simulate data loaded
      mockUseDashboardData.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null
      })

      rerender(<SectionCards />)

      await waitFor(() => {
        expect(screen.getByText('$125K')).toBeInTheDocument()
        expect(screen.queryAllByTestId('skeleton')).toHaveLength(0)
      })
    })
  })
})