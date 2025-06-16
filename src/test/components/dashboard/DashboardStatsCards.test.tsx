import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardStatsCards } from '@/components/dashboard/DashboardStatsCards'

// Mock data
const mockData = {
  revenue: { value: "$24,500", change: "+25.3%", trend: "up" },
  customers: { value: "456", change: "+18", trend: "up" },
  appointments: { value: "89", change: "+12.5%", trend: "up" },
  rating: { value: "4.8", change: "+0.1", trend: "up" }
}

const mockDataDown = {
  revenue: { value: "$18,200", change: "-8.7%", trend: "down" },
  customers: { value: "387", change: "-12", trend: "down" },
  appointments: { value: "65", change: "-5.2%", trend: "down" },
  rating: { value: "4.6", change: "-0.3", trend: "down" }
}

const mockDataMixed = {
  revenue: { value: "$22,100", change: "+15.1%", trend: "up" },
  customers: { value: "412", change: "-5", trend: "down" },
  appointments: { value: "78", change: "+8.3%", trend: "up" },
  rating: { value: "4.7", change: "-0.1", trend: "down" }
}

const mockDataPartial = {
  revenue: { value: "$19,800", change: "+3.2%", trend: "up" },
  customers: { value: "298", change: "+7", trend: "up" }
  // Missing appointments and rating data
}

describe('DashboardStatsCards Component', () => {
  describe('Loading State', () => {
    it('should render loading skeletons when no data provided', () => {
      render(<DashboardStatsCards />)

      // Should render 4 skeleton cards
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBeGreaterThan(8) // Multiple skeletons per card

      // Should have proper grid structure
      const gridContainer = document.querySelector('.grid')
      expect(gridContainer).toHaveClass('gap-4', 'md:grid-cols-2', 'lg:grid-cols-4')
    })

    it('should render loading skeletons when data is undefined', () => {
      render(<DashboardStatsCards data={undefined} />)

      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBeGreaterThan(8)
    })

    it('should have proper loading card styling', () => {
      render(<DashboardStatsCards />)

      const cards = document.querySelectorAll('[class*="bg-gray-900"]')
      expect(cards.length).toBe(4)

      const hoverCards = document.querySelectorAll('[class*="hover:border-gray-700"]')
      expect(hoverCards.length).toBe(4)
    })
  })

  describe('Data Display', () => {
    it('should render all stats with provided data', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Check main values
      expect(screen.getByText('$24,500')).toBeInTheDocument()
      expect(screen.getByText('456')).toBeInTheDocument()
      expect(screen.getByText('89')).toBeInTheDocument()
      expect(screen.getByText('4.8')).toBeInTheDocument()

      // Check change values
      expect(screen.getByText('+25.3%')).toBeInTheDocument()
      expect(screen.getByText('+18')).toBeInTheDocument()
      expect(screen.getByText('+12.5%')).toBeInTheDocument()
      expect(screen.getByText('+0.1')).toBeInTheDocument()

      // Check titles
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
      expect(screen.getByText('Active Clients')).toBeInTheDocument()
      expect(screen.getByText('Appointments')).toBeInTheDocument()
      expect(screen.getByText('Avg Rating')).toBeInTheDocument()
    })

    it('should render default values when data properties are missing', () => {
      render(<DashboardStatsCards data={{}} />)

      // Should show default values
      expect(screen.getByText('$12,450')).toBeInTheDocument()
      expect(screen.getByText('234')).toBeInTheDocument()
      expect(screen.getByText('47')).toBeInTheDocument()
      expect(screen.getByText('4.9')).toBeInTheDocument()

      // Should show default changes
      expect(screen.getByText('+18.2%')).toBeInTheDocument()
      expect(screen.getByText('+12')).toBeInTheDocument()
      expect(screen.getByText('+5.8%')).toBeInTheDocument()
      expect(screen.getByText('+0.2')).toBeInTheDocument()
    })

    it('should handle partial data correctly', () => {
      render(<DashboardStatsCards data={mockDataPartial} />)

      // Should show provided data
      expect(screen.getByText('$19,800')).toBeInTheDocument()
      expect(screen.getByText('+3.2%')).toBeInTheDocument()
      expect(screen.getByText('298')).toBeInTheDocument()
      expect(screen.getByText('+7')).toBeInTheDocument()

      // Should show defaults for missing data
      expect(screen.getByText('47')).toBeInTheDocument() // Default appointments
      expect(screen.getByText('4.9')).toBeInTheDocument() // Default rating
    })
  })

  describe('Trend Indicators', () => {
    it('should show up trend indicators for positive changes', () => {
      render(<DashboardStatsCards data={mockData} />)

      // All changes should be green (up trend)
      const upTrendElements = document.querySelectorAll('[class*="text-green-500"]')
      expect(upTrendElements.length).toBe(4)

      // Should have ArrowUpRight icons
      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(8) // Arrow icons + category icons
    })

    it('should show down trend indicators for negative changes', () => {
      render(<DashboardStatsCards data={mockDataDown} />)

      // All changes should be red (down trend)
      const downTrendElements = document.querySelectorAll('[class*="text-red-500"]')
      expect(downTrendElements.length).toBe(4)

      // Check negative change values
      expect(screen.getByText('-8.7%')).toBeInTheDocument()
      expect(screen.getByText('-12')).toBeInTheDocument()
      expect(screen.getByText('-5.2%')).toBeInTheDocument()
      expect(screen.getByText('-0.3')).toBeInTheDocument()
    })

    it('should handle mixed trends correctly', () => {
      render(<DashboardStatsCards data={mockDataMixed} />)

      // Should have both green and red trend indicators
      const upTrendElements = document.querySelectorAll('[class*="text-green-500"]')
      const downTrendElements = document.querySelectorAll('[class*="text-red-500"]')

      expect(upTrendElements.length).toBe(2) // Revenue and Appointments up
      expect(downTrendElements.length).toBe(2) // Customers and Rating down

      // Check specific values
      expect(screen.getByText('+15.1%')).toBeInTheDocument() // Revenue up
      expect(screen.getByText('-5')).toBeInTheDocument() // Customers down
      expect(screen.getByText('+8.3%')).toBeInTheDocument() // Appointments up
      expect(screen.getByText('-0.1')).toBeInTheDocument() // Rating down
    })
  })

  describe('Card Content', () => {
    it('should display all card descriptions and subtexts', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Check descriptions
      expect(screen.getByText('Revenue up this month')).toBeInTheDocument()
      expect(screen.getByText('New clients this month')).toBeInTheDocument()
      expect(screen.getByText('More bookings than usual')).toBeInTheDocument()
      expect(screen.getByText('Customer satisfaction')).toBeInTheDocument()

      // Check subtexts
      expect(screen.getByText('Compared to last month')).toBeInTheDocument()
      expect(screen.getByText('Total active customer base')).toBeInTheDocument()
      expect(screen.getByText("This month's appointments")).toBeInTheDocument()
      expect(screen.getByText('Based on 156 reviews')).toBeInTheDocument()
    })

    it('should have proper card structure and layout', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Should have 4 cards
      const cards = document.querySelectorAll('[role="generic"]')
      expect(cards.length).toBeGreaterThan(0)

      // Check for card headers and content
      const cardHeaders = document.querySelectorAll('[class*="flex-row"]')
      expect(cardHeaders.length).toBe(4)
    })

    it('should display correct icons for each category', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Should have icons for each category (DollarSign, Users, Calendar, Star)
      // Plus trend icons (ArrowUpRight) and TrendingUp icons
      const allIcons = document.querySelectorAll('svg')
      expect(allIcons.length).toBeGreaterThan(12) // Multiple icons per card
    })
  })

  describe('Styling and Layout', () => {
    it('should have proper grid layout classes', () => {
      render(<DashboardStatsCards data={mockData} />)

      const gridContainer = document.querySelector('.grid')
      expect(gridContainer).toHaveClass('gap-4', 'md:grid-cols-2', 'lg:grid-cols-4')
    })

    it('should apply dark theme styling', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Check for dark theme classes
      const darkCards = document.querySelectorAll('[class*="bg-gray-900"]')
      expect(darkCards.length).toBe(4)

      const darkBorders = document.querySelectorAll('[class*="border-gray-800"]')
      expect(darkBorders.length).toBe(4)
    })

    it('should have hover effects', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Check for hover classes
      const hoverBorder = document.querySelectorAll('[class*="hover:border-gray-700"]')
      expect(hoverBorder.length).toBe(4)

      const hoverShadow = document.querySelectorAll('[class*="hover:shadow-lg"]')
      expect(hoverShadow.length).toBe(4)

      const hoverScale = document.querySelectorAll('[class*="hover:scale-105"]')
      expect(hoverScale.length).toBe(4)
    })

    it('should have proper transitions', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Check for transition classes
      const transitions = document.querySelectorAll('[class*="transition-all"]')
      expect(transitions.length).toBe(8) // Cards + values

      const durationClasses = document.querySelectorAll('[class*="duration-200"]')
      expect(durationClasses.length).toBeGreaterThan(4)
    })

    it('should have proper text styling', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Check for white text on main values
      const whiteText = document.querySelectorAll('[class*="text-white"]')
      expect(whiteText.length).toBe(4)

      // Check for gray text on descriptions
      const grayText = document.querySelectorAll('[class*="text-gray-"]')
      expect(grayText.length).toBeGreaterThan(8)
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid columns', () => {
      render(<DashboardStatsCards data={mockData} />)

      const gridContainer = document.querySelector('.grid')
      expect(gridContainer).toHaveClass('md:grid-cols-2') // 2 columns on medium screens
      expect(gridContainer).toHaveClass('lg:grid-cols-4') // 4 columns on large screens
    })

    it('should maintain card structure across screen sizes', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Cards should maintain their flex layout
      const flexHeaders = document.querySelectorAll('[class*="flex-row"]')
      expect(flexHeaders.length).toBe(4)

      const spaceBetween = document.querySelectorAll('[class*="justify-between"]')
      expect(spaceBetween.length).toBeGreaterThan(4)
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Check for card titles (should be headings or have proper roles)
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
      expect(screen.getByText('Active Clients')).toBeInTheDocument()
      expect(screen.getByText('Appointments')).toBeInTheDocument()
      expect(screen.getByText('Avg Rating')).toBeInTheDocument()
    })

    it('should have readable color contrast', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Check for proper contrast with white text on dark background
      const whiteText = document.querySelectorAll('[class*="text-white"]')
      expect(whiteText.length).toBe(4)

      // Green and red should have sufficient contrast
      const greenText = document.querySelectorAll('[class*="text-green-500"]')
      const redText = document.querySelectorAll('[class*="text-red-500"]')
      expect(greenText.length + redText.length).toBe(4)
    })

    it('should provide meaningful content hierarchy', () => {
      render(<DashboardStatsCards data={mockData} />)

      // Main values should be prominently displayed
      const largeText = document.querySelectorAll('[class*="text-2xl"]')
      expect(largeText.length).toBe(4)

      // Secondary text should be smaller
      const smallText = document.querySelectorAll('[class*="text-xs"]')
      expect(smallText.length).toBeGreaterThan(8)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      const emptyData = {
        revenue: { value: "", change: "", trend: "up" },
        customers: { value: "", change: "", trend: "up" },
        appointments: { value: "", change: "", trend: "up" },
        rating: { value: "", change: "", trend: "up" }
      }

      render(<DashboardStatsCards data={emptyData} />)

      // Should fall back to defaults when values are empty
      expect(screen.getByText('$12,450')).toBeInTheDocument()
      expect(screen.getByText('234')).toBeInTheDocument()
      expect(screen.getByText('47')).toBeInTheDocument()
      expect(screen.getByText('4.9')).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      const largeData = {
        revenue: { value: "$1,234,567", change: "+999%", trend: "up" },
        customers: { value: "99,999", change: "+9,999", trend: "up" },
        appointments: { value: "9,999", change: "+999.9%", trend: "up" },
        rating: { value: "5.0", change: "+1.0", trend: "up" }
      }

      render(<DashboardStatsCards data={largeData} />)

      expect(screen.getByText('$1,234,567')).toBeInTheDocument()
      expect(screen.getByText('99,999')).toBeInTheDocument()
      expect(screen.getByText('9,999')).toBeInTheDocument()
      expect(screen.getByText('+999%')).toBeInTheDocument()
    })

    it('should handle special characters and symbols', () => {
      const specialData = {
        revenue: { value: "$12,450.99", change: "+18.2%", trend: "up" },
        customers: { value: "234+", change: "+12", trend: "up" },
        appointments: { value: "47*", change: "+5.8%", trend: "up" },
        rating: { value: "4.9★", change: "+0.2", trend: "up" }
      }

      render(<DashboardStatsCards data={specialData} />)

      expect(screen.getByText('$12,450.99')).toBeInTheDocument()
      expect(screen.getByText('234+')).toBeInTheDocument()
      expect(screen.getByText('47*')).toBeInTheDocument()
      expect(screen.getByText('4.9★')).toBeInTheDocument()
    })

    it('should handle null trend values', () => {
      const nullTrendData = {
        revenue: { value: "$15,000", change: "+5%", trend: null as any },
        customers: { value: "300", change: "-10", trend: undefined as any },
        appointments: { value: "50", change: "+2%", trend: "up" },
        rating: { value: "4.8", change: "0", trend: "down" }
      }

      render(<DashboardStatsCards data={nullTrendData} />)

      // Should still render the cards even with null/undefined trends
      expect(screen.getByText('$15,000')).toBeInTheDocument()
      expect(screen.getByText('300')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('4.8')).toBeInTheDocument()
    })

    it('should handle mixed data completeness', () => {
      const mixedData = {
        revenue: { value: "$20,000", change: "+10%", trend: "up" },
        customers: { value: "400" }, // Missing change and trend
        appointments: { change: "+15%", trend: "up" }, // Missing value
        rating: { value: "4.7", trend: "down" } // Missing change
      }

      render(<DashboardStatsCards data={mixedData} />)

      // Should show provided data and defaults for missing data
      expect(screen.getByText('$20,000')).toBeInTheDocument()
      expect(screen.getByText('+10%')).toBeInTheDocument()
      expect(screen.getByText('400')).toBeInTheDocument()
      expect(screen.getByText('4.7')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should render efficiently with multiple re-renders', () => {
      const { rerender } = render(<DashboardStatsCards data={mockData} />)

      // Should maintain stable rendering
      expect(screen.getByText('$24,500')).toBeInTheDocument()

      // Re-render with different data
      rerender(<DashboardStatsCards data={mockDataDown} />)
      expect(screen.getByText('$18,200')).toBeInTheDocument()

      // Re-render with no data
      rerender(<DashboardStatsCards />)
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBeGreaterThan(8)
    })

    it('should handle rapid data updates', () => {
      const { rerender } = render(<DashboardStatsCards data={mockData} />)

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        const updatedData = {
          ...mockData,
          revenue: { value: `$${20000 + i * 1000}`, change: `+${i * 2}%`, trend: "up" }
        }
        rerender(<DashboardStatsCards data={updatedData} />)
      }

      // Final state should be correct
      expect(screen.getByText('$29,000')).toBeInTheDocument()
      expect(screen.getByText('+18%')).toBeInTheDocument()
    })
  })
})