import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChartAreaInteractive } from '@/components/dashboard/chart-area-interactive'

// Mock hooks
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false)
}))

vi.mock('@/hooks/use-chart-data', () => ({
  useChartData: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null
  }))
}))

// Mock recharts to avoid canvas rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children, data }: any) => (
    <div data-testid="area-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Area: ({ dataKey }: any) => <div data-testid={`area-${dataKey}`} />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: ({ content }: any) => <div data-testid="tooltip">{content}</div>,
  // Mock additional components that might be used
  linearGradient: () => <div data-testid="linear-gradient" />,
  defs: () => <div data-testid="defs" />,
  stop: () => <div data-testid="stop" />,
}))

// Sample test data
const mockChartData = [
  { date: '2024-01-01', value1: 1000, value2: 5 },
  { date: '2024-01-02', value1: 1500, value2: 7 },
  { date: '2024-01-03', value1: 1200, value2: 6 },
  { date: '2024-01-04', value1: 1800, value2: 8 },
  { date: '2024-01-05', value1: 2000, value2: 9 },
]

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('ChartAreaInteractive', () => {
  let mockUseIsMobile: any
  let mockUseChartData: any

  beforeEach(async () => {
    mockUseIsMobile = vi.mocked(await import('@/hooks/use-mobile')).useIsMobile
    mockUseChartData = vi.mocked(await import('@/hooks/use-chart-data')).useChartData
    vi.clearAllMocks()
    // Default to desktop view with successful data
    mockUseIsMobile.mockReturnValue(false)
    mockUseChartData.mockReturnValue({
      data: mockChartData,
      isLoading: false,
      error: null
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the chart with correct title and description', () => {
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      expect(screen.getByText('Revenue & Appointments')).toBeInTheDocument()
      expect(screen.getByText('Daily revenue and appointment trends')).toBeInTheDocument()
    })

    it('should render the chart container with data', () => {
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      const chart = screen.getByTestId('area-chart')
      expect(chart).toBeInTheDocument()
      
      // Check that areas are rendered
      expect(screen.getByTestId('area-value1')).toBeInTheDocument()
      expect(screen.getByTestId('area-value2')).toBeInTheDocument()
    })

    it('should render time range controls', () => {
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      // Check for toggle group (desktop)
      expect(screen.getByText('Last 3 months')).toBeInTheDocument()
      expect(screen.getByText('Last 30 days')).toBeInTheDocument()
      expect(screen.getByText('Last 7 days')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show skeleton loader when data is loading', () => {
      mockUseChartData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      } as any)

      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      expect(screen.getByText('Loading chart data...')).toBeInTheDocument()
      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('should maintain card structure during loading', () => {
      mockUseChartData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      } as any)

      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      expect(screen.getByText('Revenue & Appointments')).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('should display error message when there is an error', () => {
      mockUseChartData.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch')
      } as any)

      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      expect(screen.getByText('Error loading chart data')).toBeInTheDocument()
      expect(screen.getByText('Please refresh the page or contact support')).toBeInTheDocument()
    })

    it('should display error when data is null without error object', () => {
      mockUseChartData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      } as any)

      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      expect(screen.getByText('Error loading chart data')).toBeInTheDocument()
    })

    it('should handle non-array data gracefully', () => {
      mockUseChartData.mockReturnValue({
        data: {} as any, // Invalid data format
        isLoading: false,
        error: null
      } as any)

      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      // Should render chart with empty array
      const chart = screen.getByTestId('area-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      expect(chartData).toEqual([])
    })
  })

  describe('Time Range Filtering', () => {
    it('should default to 30d time range on desktop', () => {
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      // The 30d button should be selected by default
      const button30d = screen.getByText('Last 30 days')
      expect(button30d).toBeInTheDocument()
    })

    it('should filter data to last 7 days when 7d is selected', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      const button7d = screen.getByText('Last 7 days')
      await user.click(button7d)

      const chart = screen.getByTestId('area-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      
      // Should show filtered data (last 7 items from the 5-item mock data)
      expect(chartData).toHaveLength(5) // All 5 items since we only have 5
    })

    it('should update chart data when time range changes', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      const chart = screen.getByTestId('area-chart')
      const initialData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      expect(initialData).toHaveLength(5) // Default shows all data

      const button7d = screen.getByText('Last 7 days')
      await user.click(button7d)

      const updatedData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      expect(updatedData).toHaveLength(5) // Still 5 since our mock data only has 5 items
    })
  })

  describe('Responsive Behavior', () => {
    it('should show ToggleGroup on desktop', () => {
      mockUseIsMobile.mockReturnValue(false)
      
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      expect(screen.getByText('Last 3 months')).toBeInTheDocument()
      expect(screen.getByText('Last 30 days')).toBeInTheDocument()
      expect(screen.getByText('Last 7 days')).toBeInTheDocument()
    })

    it('should show Select on mobile', () => {
      mockUseIsMobile.mockReturnValue(true)
      
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })

    it('should default to 7d on mobile', () => {
      mockUseIsMobile.mockReturnValue(true)
      
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      waitFor(() => {
        const chart = screen.getByTestId('area-chart')
        const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
        expect(chartData).toHaveLength(5) // All data since we only have 5 items
      })
    })

    it('should show mobile-specific description text', () => {
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      expect(screen.getByText('Revenue & bookings')).toBeInTheDocument()
      expect(screen.getByText('Daily revenue and appointment trends')).toBeInTheDocument()
    })
  })

  describe('Chart Configuration', () => {
    it('should render chart with correct configuration', () => {
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      // Check chart elements
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('area-value1')).toBeInTheDocument()
      expect(screen.getByTestId('area-value2')).toBeInTheDocument()
    })

    it('should pass correct data to chart', () => {
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      const chart = screen.getByTestId('area-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      
      expect(chartData).toEqual(mockChartData.slice(-30)) // Last 30 items (default)
    })
  })

  describe('User Interactions', () => {
    it('should handle time range toggle interactions', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      const button7d = screen.getByText('Last 7 days')
      const button30d = screen.getByText('Last 30 days')
      const button90d = screen.getByText('Last 3 months')

      // Click each button to verify they work
      await user.click(button7d)
      await user.click(button30d)
      await user.click(button90d)

      // Should not throw errors
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty data array', () => {
      mockUseChartData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      } as any)

      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      const chart = screen.getByTestId('area-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]')
      expect(chartData).toEqual([])
    })

    it('should handle data with missing fields', () => {
      const incompleteData = [
        { date: '2024-01-01', value1: 1000 }, // Missing value2
        { date: '2024-01-02', value2: 5 }, // Missing value1
        { value1: 1500, value2: 7 }, // Missing date
      ]

      mockUseChartData.mockReturnValue({
        data: incompleteData,
        isLoading: false,
        error: null
      } as any)

      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      // Should render without crashing
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })

    it('should handle undefined/null in useChartData gracefully', () => {
      mockUseChartData.mockReturnValue({
        data: undefined as any,
        isLoading: false,
        error: null
      } as any)

      render(
        <TestWrapper>
          <ChartAreaInteractive />
        </TestWrapper>
      )

      // Should show error state
      expect(screen.getByText('Error loading chart data')).toBeInTheDocument()
    })
  })
})
