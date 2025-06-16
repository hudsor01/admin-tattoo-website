import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppointmentStatsCards } from '@/components/appointments/appointment-stats-cards'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock data
const mockStats = {
  totalAppointments: 128,
  confirmedAppointments: 95,
  completedAppointments: 82,
  completionRate: 86.3,
  appointmentsChange: '+12.5%',
  confirmedChange: '+8.2%',
  completedChange: '+15.3%',
  completionRateChange: '+3.1%'
}

const mockStatsNegative = {
  totalAppointments: 85,
  confirmedAppointments: 60,
  completedAppointments: 45,
  completionRate: 75.0,
  appointmentsChange: '-5.2%',
  confirmedChange: '-12.1%',
  completedChange: '-8.7%',
  completionRateChange: '-4.5%'
}

const mockStatsZero = {
  totalAppointments: 0,
  confirmedAppointments: 0,
  completedAppointments: 0,
  completionRate: 0,
  appointmentsChange: '0%',
  confirmedChange: '0%',
  completedChange: '0%',
  completionRateChange: '0%'
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

describe('AppointmentStatsCards Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading skeletons while fetching data', () => {
      // Mock pending fetch
      mockFetch.mockReturnValue(new Promise(() => {}))

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      // Should show 4 skeleton cards
      const skeletonCards = screen.getAllByTestId('card')
      expect(skeletonCards).toHaveLength(4)

      // Check for skeleton elements
      expect(screen.getAllByTestId('skeleton')).toHaveLength(16) // 4 cards × 4 skeletons each
    })

    it('should have proper loading structure', () => {
      mockFetch.mockReturnValue(new Promise(() => {}))

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      // Grid container should be present
      const gridContainer = screen.getByRole('generic').closest('.grid')
      expect(gridContainer).toHaveClass('grid-cols-1', 'gap-8')
    })
  })

  describe('Success State', () => {
    it('should render all stats cards with positive changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('128')).toBeInTheDocument()
      })

      // Check all stat values
      expect(screen.getByText('128')).toBeInTheDocument() // Total appointments
      expect(screen.getByText('95')).toBeInTheDocument() // Confirmed
      expect(screen.getByText('82')).toBeInTheDocument() // Completed
      expect(screen.getByText('86.3%')).toBeInTheDocument() // Completion rate

      // Check change indicators
      expect(screen.getByText('+12.5%')).toBeInTheDocument()
      expect(screen.getByText('+8.2%')).toBeInTheDocument()
      expect(screen.getByText('+15.3%')).toBeInTheDocument()
      expect(screen.getByText('+3.1%')).toBeInTheDocument()
    })

    it('should render negative change indicators properly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockStatsNegative })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument()
      })

      // Check negative change indicators
      expect(screen.getByText('-5.2%')).toBeInTheDocument()
      expect(screen.getByText('-12.1%')).toBeInTheDocument()
      expect(screen.getByText('-8.7%')).toBeInTheDocument()
      expect(screen.getByText('-4.5%')).toBeInTheDocument()

      // Check negative status messages
      expect(screen.getByText('Bookings declining')).toBeInTheDocument()
      expect(screen.getByText('Follow up needed')).toBeInTheDocument()
      expect(screen.getByText('Review completion process')).toBeInTheDocument()
      expect(screen.getByText('Monitor no-shows')).toBeInTheDocument()
    })

    it('should handle zero values correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockStatsZero })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getAllByText('0')).toHaveLength(4) // 3 counts + 1 completion rate
      })

      // All main values should be 0
      const zeroValues = screen.getAllByText('0')
      expect(zeroValues).toHaveLength(4)

      // All change indicators should be 0%
      const zeroChanges = screen.getAllByText('0%')
      expect(zeroChanges).toHaveLength(4)
    })

    it('should format large numbers with locale formatting', async () => {
      const largeStats = {
        ...mockStats,
        totalAppointments: 1250,
        confirmedAppointments: 950,
        completedAppointments: 850
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: largeStats })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('1,250')).toBeInTheDocument()
      })

      expect(screen.getByText('1,250')).toBeInTheDocument()
      expect(screen.getByText('950')).toBeInTheDocument()
      expect(screen.getByText('850')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should show error message when API call fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Error loading appointment stats')).toBeInTheDocument()
      })

      expect(screen.getByText('Error loading appointment stats')).toBeInTheDocument()
      expect(screen.getByText('Please try refreshing the page')).toBeInTheDocument()
    })

    it('should show error message when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Error loading appointment stats')).toBeInTheDocument()
      })

      expect(screen.getByText('Error loading appointment stats')).toBeInTheDocument()
    })

    it('should show error message when data is null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Error loading appointment stats')).toBeInTheDocument()
      })

      expect(screen.getByText('Error loading appointment stats')).toBeInTheDocument()
    })
  })

  describe('Card Content and Labels', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
      })
    })

    it('should display correct card titles and descriptions', async () => {
      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Total Appointments')).toBeInTheDocument()
      })

      // Check all card titles
      expect(screen.getByText('Total Appointments')).toBeInTheDocument()
      expect(screen.getByText('Confirmed')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Completion Rate')).toBeInTheDocument()

      // Check footer descriptions
      expect(screen.getByText('All appointment types included')).toBeInTheDocument()
      expect(screen.getByText('Ready for service')).toBeInTheDocument()
      expect(screen.getByText('Successfully finished')).toBeInTheDocument()
      expect(screen.getByText('Success vs scheduled')).toBeInTheDocument()
    })

    it('should display positive status messages correctly', async () => {
      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Booking momentum')).toBeInTheDocument()
      })

      expect(screen.getByText('Booking momentum')).toBeInTheDocument()
      expect(screen.getByText('Strong confirmation rate')).toBeInTheDocument()
      expect(screen.getByText('Successful completions')).toBeInTheDocument()
      expect(screen.getByText('Excellent reliability')).toBeInTheDocument()
    })

    it('should show correct icons for each stat type', async () => {
      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Booking momentum')).toBeInTheDocument()
      })

      // Check for icon presence by looking for their SVG elements
      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(8) // Should have trending + category icons
    })
  })

  describe('Responsive and Styling', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
      })
    })

    it('should have responsive grid layout classes', async () => {
      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('128')).toBeInTheDocument()
      })

      const gridContainer = document.querySelector('.grid')
      expect(gridContainer).toHaveClass(
        'grid-cols-1',
        'gap-8',
        '@xl/main:grid-cols-2',
        '@5xl/main:grid-cols-4'
      )
    })

    it('should apply correct styling classes for positive changes', async () => {
      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('+12.5%')).toBeInTheDocument()
      })

      // Check for positive change styling by looking for badges with specific colors
      const badges = document.querySelectorAll('[class*="bg-gradient-to-r"]')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should apply hover effects and transitions', async () => {
      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('128')).toBeInTheDocument()
      })

      // Check for hover classes
      const cards = document.querySelectorAll('[class*="hover:shadow-xl"]')
      expect(cards.length).toBe(4)

      const scaleCards = document.querySelectorAll('[class*="hover:scale-"]')
      expect(scaleCards.length).toBe(4)
    })

    it('should have proper container query classes', async () => {
      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('128')).toBeInTheDocument()
      })

      // Check for container query classes
      const containerCards = document.querySelectorAll('[class*="@container/card"]')
      expect(containerCards.length).toBe(4)
    })
  })

  describe('Change Indicator Logic', () => {
    it('should correctly identify positive changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('+12.5%')).toBeInTheDocument()
      })

      // All changes should be positive and use trending up icons
      const trendingUpIcons = document.querySelectorAll('svg')
      expect(trendingUpIcons.length).toBeGreaterThan(4) // At least 4 trending up + other icons
    })

    it('should correctly identify negative changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockStatsNegative })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('-5.2%')).toBeInTheDocument()
      })

      // Should have negative change indicators
      expect(screen.getByText('-5.2%')).toBeInTheDocument()
      expect(screen.getByText('-12.1%')).toBeInTheDocument()
      expect(screen.getByText('-8.7%')).toBeInTheDocument()
      expect(screen.getByText('-4.5%')).toBeInTheDocument()
    })

    it('should handle zero change correctly', async () => {
      const zeroChangeStats = {
        ...mockStats,
        appointmentsChange: '0%',
        confirmedChange: '0%',
        completedChange: '0%',
        completionRateChange: '0%'
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: zeroChangeStats })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getAllByText('0%')).toHaveLength(4)
      })

      // Should treat 0% as negative (no + sign)
      const zeroPercentages = screen.getAllByText('0%')
      expect(zeroPercentages).toHaveLength(4)
    })
  })

  describe('API Integration', () => {
    it('should call the correct API endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/appointments/stats')
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/appointments/stats')
    })

    it('should have correct query configuration', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('128')).toBeInTheDocument()
      })

      // Component should use the appointment-stats query key
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/appointments/stats')
    })

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Error loading appointment stats')).toBeInTheDocument()
      })

      expect(screen.getByText('Error loading appointment stats')).toBeInTheDocument()
    })

    it('should handle missing data property in response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null }) // Missing data but proper structure
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Error loading appointment stats')).toBeInTheDocument()
      })

      expect(screen.getByText('Error loading appointment stats')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
      })
    })

    it('should have proper semantic structure', async () => {
      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('128')).toBeInTheDocument()
      })

      // Should have proper heading structure
      const titles = screen.getAllByRole('heading')
      expect(titles.length).toBeGreaterThan(0)
    })

    it('should have readable text contrast', async () => {
      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('128')).toBeInTheDocument()
      })

      // Check for proper text color classes
      const foregroundText = document.querySelectorAll('[class*="text-foreground"]')
      expect(foregroundText.length).toBeGreaterThan(0)

      const mutedText = document.querySelectorAll('[class*="text-muted-foreground"]')
      expect(mutedText.length).toBeGreaterThan(0)
    })

    it('should provide meaningful content for screen readers', async () => {
      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('128')).toBeInTheDocument()
      })

      // Check for descriptive text
      expect(screen.getByText('All appointment types included')).toBeInTheDocument()
      expect(screen.getByText('Ready for service')).toBeInTheDocument()
      expect(screen.getByText('Successfully finished')).toBeInTheDocument()
      expect(screen.getByText('Success vs scheduled')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle very large numbers efficiently', async () => {
      const largeStats = {
        totalAppointments: 999999,
        confirmedAppointments: 888888,
        completedAppointments: 777777,
        completionRate: 99.9,
        appointmentsChange: '+999.9%',
        confirmedChange: '+888.8%',
        completedChange: '+777.7%',
        completionRateChange: '+66.6%'
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: largeStats })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('999,999')).toBeInTheDocument()
      })

      expect(screen.getByText('999,999')).toBeInTheDocument()
      expect(screen.getByText('888,888')).toBeInTheDocument()
      expect(screen.getByText('777,777')).toBeInTheDocument()
      expect(screen.getByText('99.9%')).toBeInTheDocument()
    })

    it('should memoize expensive formatting operations', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
      })

      const { rerender } = render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('128')).toBeInTheDocument()
      })

      // Re-render with same data should not cause additional API calls
      rerender(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      // Should still show the same data without additional fetch
      expect(screen.getByText('128')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle decimal completion rates correctly', async () => {
      const decimalStats = {
        ...mockStats,
        completionRate: 86.789
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: decimalStats })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('86.789%')).toBeInTheDocument()
      })

      expect(screen.getByText('86.789%')).toBeInTheDocument()
    })

    it('should handle extremely long change percentages', async () => {
      const longChangeStats = {
        ...mockStats,
        appointmentsChange: '+123.456789%'
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: longChangeStats })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('+123.456789%')).toBeInTheDocument()
      })

      expect(screen.getByText('+123.456789%')).toBeInTheDocument()
    })

    it('should handle missing change properties gracefully', async () => {
      const incompleteStats = {
        totalAppointments: 100,
        confirmedAppointments: 80,
        completedAppointments: 70,
        completionRate: 87.5
        // Missing all change properties
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: incompleteStats })
      })

      render(
        <TestWrapper>
          <AppointmentStatsCards />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument()
      })

      // Should still render the main stats even without changes
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('80')).toBeInTheDocument()
      expect(screen.getByText('70')).toBeInTheDocument()
      expect(screen.getByText('87.5%')).toBeInTheDocument()
    })
  })
})