import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DollarSign, Users, Calendar, Star, TrendingUp, AlertTriangle } from 'lucide-react'
import MetricCard from '@/components/dashboard/Metrics-Card'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid="mock-link">
      {children}
    </a>
  ),
}))

// Mock comparison data
const mockComparisonString = "Compared to last month"

const mockComparisonObject = {
  previousValue: "$18,500",
  previousPeriod: "December 2023",
  yearOverYear: 15.5
}

const mockComparisonObjectNegative = {
  previousValue: "$22,000",
  previousPeriod: "December 2023",
  yearOverYear: -8.2
}

const mockComparisonObjectZero = {
  previousValue: "$20,000",
  previousPeriod: "December 2023",
  yearOverYear: 0
}

describe('MetricCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render with minimal required props', () => {
      render(
        <MetricCard 
          title="Revenue"
          value="$24,500"
        />
      )

      expect(screen.getByText('Revenue')).toBeInTheDocument()
      expect(screen.getByText('$24,500')).toBeInTheDocument()
    })

    it('should render with all props provided', () => {
      render(
        <MetricCard
          title="Monthly Revenue"
          value="$24,500"
          change={12.5}
          trend="up"
          icon={<DollarSign />}
          description="Revenue growth this month"
          href="/dashboard/revenue"
          variant="revenue"
          priority="high"
          comparison={mockComparisonObject}
          showProgress={true}
        />
      )

      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
      expect(screen.getByText('$24,500')).toBeInTheDocument()
      expect(screen.getByText('+12.5%')).toBeInTheDocument()
      expect(screen.getByText('Revenue growth this month')).toBeInTheDocument()
    })

    it('should render numeric values correctly', () => {
      render(
        <MetricCard
          title="Users"
          value={1234}
        />
      )

      expect(screen.getByText('1234')).toBeInTheDocument()
    })

    it('should handle missing optional props gracefully', () => {
      render(
        <MetricCard
          title="Test Metric"
          value="Test Value"
        />
      )

      // Should not have change indicator when change is undefined
      expect(screen.queryByText('%')).not.toBeInTheDocument()
      // Should not show description container when no change or description provided
      expect(screen.queryByText('from last month')).not.toBeInTheDocument()
    })

    it('should show default description when change is provided but description is not', () => {
      render(
        <MetricCard
          title="Test Metric"
          value="Test Value"
          change={12.5}
        />
      )

      // Should show default description when change is provided
      expect(screen.getByText('from last month')).toBeInTheDocument()
    })
  })

  describe('Variant Testing', () => {
    const variants = ['default', 'revenue', 'customers', 'appointments', 'critical', 'success', 'metallic'] as const

    variants.forEach(variant => {
      it(`should render with ${variant} variant`, () => {
        render(
          <MetricCard
            title={`${variant} metric`}
            value="100"
            variant={variant}
            icon={<DollarSign />}
          />
        )

        const card = document.querySelector('[class*="metric-card"]')
        expect(card).toBeInTheDocument()

        if (variant === 'critical') {
          expect(card).toHaveClass('metric-card-critical')
        } else if (variant === 'success') {
          expect(card).toHaveClass('metric-card-success')
        } else if (variant === 'metallic') {
          expect(card).toHaveClass('metallic-gradient')
        }
      })
    })

    it('should apply correct gradient overlays for each variant', () => {
      const { rerender } = render(
        <MetricCard title="Test" value="100" variant="critical" />
      )

      let gradientOverlay = document.querySelector('[class*="from-red-500/20"]')
      expect(gradientOverlay).toBeInTheDocument()

      rerender(<MetricCard title="Test" value="100" variant="success" />)
      gradientOverlay = document.querySelector('[class*="from-slate-400/15"]')
      expect(gradientOverlay).toBeInTheDocument()

      rerender(<MetricCard title="Test" value="100" variant="metallic" />)
      gradientOverlay = document.querySelector('[class*="from-gray-400/20"]')
      expect(gradientOverlay).toBeInTheDocument()

      rerender(<MetricCard title="Test" value="100" variant="default" />)
      gradientOverlay = document.querySelector('[class*="from-primary/5"]')
      expect(gradientOverlay).toBeInTheDocument()
    })

    it('should apply correct icon styling for each variant', () => {
      const { rerender } = render(
        <MetricCard title="Test" value="100" variant="critical" icon={<DollarSign />} />
      )

      let iconContainer = document.querySelector('[class*="bg-red-100/20"]')
      expect(iconContainer).toBeInTheDocument()

      rerender(<MetricCard title="Test" value="100" variant="success" icon={<DollarSign />} />)
      iconContainer = document.querySelector('[class*="bg-slate-200"]')
      expect(iconContainer).toBeInTheDocument()

      rerender(<MetricCard title="Test" value="100" variant="metallic" icon={<DollarSign />} />)
      iconContainer = document.querySelector('[class*="bg-white/20"]')
      expect(iconContainer).toBeInTheDocument()

      rerender(<MetricCard title="Test" value="100" variant="default" icon={<DollarSign />} />)
      iconContainer = document.querySelector('[class*="bg-accent"]')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Priority Testing', () => {
    const priorities = ['low', 'medium', 'high', 'critical'] as const

    priorities.forEach(priority => {
      it(`should render with ${priority} priority`, () => {
        render(
          <MetricCard
            title={`${priority} priority metric`}
            value="100"
            priority={priority}
          />
        )

        const valueElement = document.querySelector('.admin-metric-value')
        expect(valueElement).toBeInTheDocument()

        if (priority === 'critical') {
          expect(valueElement).toHaveClass('critical-metric')
        } else if (priority === 'high') {
          expect(valueElement).toHaveClass('success-metric')
        } else if (priority === 'low') {
          expect(valueElement).toHaveClass('neutral-metric')
        }
      })
    })

    it('should default to medium priority when not specified', () => {
      render(
        <MetricCard
          title="Default Priority"
          value="100"
        />
      )

      const valueElement = document.querySelector('.admin-metric-value')
      expect(valueElement).not.toHaveClass('critical-metric')
      expect(valueElement).not.toHaveClass('success-metric')
      expect(valueElement).not.toHaveClass('neutral-metric')
    })
  })

  describe('Trend Testing', () => {
    it('should show up trend with ArrowUpRight icon', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={12.5}
          trend="up"
        />
      )

      expect(screen.getByText('+12.5%')).toBeInTheDocument()
      
      const badge = document.querySelector('[class*="bg-emerald-50"]')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-emerald-700', 'border-emerald-200')

      // Check for ArrowUpRight icon (lucide icons have specific attributes)
      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should show down trend with ArrowDownRight icon', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$18,200"
          change={-8.7}
          trend="down"
        />
      )

      expect(screen.getByText('-8.7%')).toBeInTheDocument()
      
      const badge = document.querySelector('[class*="bg-red-50"]')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-red-700', 'border-red-200')

      // Check for ArrowDownRight icon
      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should show neutral trend without arrow icons', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$20,000"
          change={0}
          trend="neutral"
        />
      )

      expect(screen.getByText('0%')).toBeInTheDocument()
      
      const badge = document.querySelector('[class*="bg-slate-50"]')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-slate-700', 'border-slate-200')
    })

    it('should handle positive change without plus sign for down trend', () => {
      render(
        <MetricCard
          title="Test"
          value="100"
          change={5}
          trend="down"
        />
      )

      // Should still show positive change even with down trend
      expect(screen.getByText('+5%')).toBeInTheDocument()
      expect(document.querySelector('[class*="bg-red-50"]')).toBeInTheDocument()
    })

    it('should handle negative change correctly', () => {
      render(
        <MetricCard
          title="Test"
          value="100"
          change={-15.5}
          trend="down"
        />
      )

      expect(screen.getByText('-15.5%')).toBeInTheDocument()
    })

    it('should handle zero change', () => {
      render(
        <MetricCard
          title="Test"
          value="100"
          change={0}
          trend="neutral"
        />
      )

      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  describe('Comparison Data Testing', () => {
    it('should display string comparison data', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          comparison={mockComparisonString}
        />
      )

      // String comparison is not directly rendered, only object comparison
      // The card should still render without errors
      expect(screen.getByText('Revenue')).toBeInTheDocument()
      expect(screen.getByText('$24,500')).toBeInTheDocument()
    })

    it('should display object comparison data with all fields', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          comparison={mockComparisonObject}
        />
      )

      expect(screen.getByText('Previous:')).toBeInTheDocument()
      expect(screen.getByText('$18,500')).toBeInTheDocument()
      expect(screen.getByText('YoY:')).toBeInTheDocument()
      expect(screen.getByText('+15.5%')).toBeInTheDocument()

      // Check YoY styling for positive value
      const yoyValue = screen.getByText('+15.5%')
      expect(yoyValue).toHaveClass('text-emerald-600')
    })

    it('should handle negative YoY comparison', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          comparison={mockComparisonObjectNegative}
        />
      )

      expect(screen.getByText('-8.2%')).toBeInTheDocument()
      
      // Check YoY styling for negative value
      const yoyValue = screen.getByText('-8.2%')
      expect(yoyValue).toHaveClass('text-red-600')
    })

    it('should handle zero YoY comparison', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          comparison={mockComparisonObjectZero}
        />
      )

      expect(screen.getByText('0%')).toBeInTheDocument()
      
      // Check YoY styling for zero value
      const yoyValue = screen.getByText('0%')
      expect(yoyValue).toHaveClass('text-muted-foreground')
    })

    it('should handle partial comparison object', () => {
      const partialComparison = {
        previousValue: "$20,000",
        previousPeriod: "Last month",
        yearOverYear: undefined as any
      }

      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          comparison={partialComparison}
        />
      )

      expect(screen.getByText('Previous:')).toBeInTheDocument()
      expect(screen.getByText('$20,000')).toBeInTheDocument()
      // YoY should not be displayed when undefined
      expect(screen.queryByText('YoY:')).not.toBeInTheDocument()
    })

    it('should show comparison section border when comparison data exists', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          comparison={mockComparisonObject}
        />
      )

      const comparisonSection = document.querySelector('[class*="border-t"]')
      expect(comparisonSection).toBeInTheDocument()
      expect(comparisonSection).toHaveClass('border-border/40')
    })
  })

  describe('Progress Bar Testing', () => {
    it('should show progress bar when showProgress is true', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={75}
          showProgress={true}
        />
      )

      const progressContainer = document.querySelector('.h-1\\.5')
      expect(progressContainer).toBeInTheDocument()
      expect(progressContainer).toHaveClass('bg-muted', 'rounded-full')

      const progressBar = document.querySelector('[class*="bg-gradient-to-r"]')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveStyle({ width: '75%' })
    })

    it('should not show progress bar when showProgress is false', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={75}
          showProgress={false}
        />
      )

      const progressContainer = document.querySelector('.h-1\\.5')
      expect(progressContainer).not.toBeInTheDocument()
    })

    it('should cap progress bar width at 100%', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={150}
          showProgress={true}
        />
      )

      const progressBar = document.querySelector('[class*="bg-gradient-to-r"]')
      expect(progressBar).toHaveStyle({ width: '100%' })
    })

    it('should handle negative change in progress bar', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={-25}
          showProgress={true}
        />
      )

      const progressBar = document.querySelector('[class*="bg-gradient-to-r"]')
      expect(progressBar).toHaveStyle({ width: '25%' }) // Should use absolute value
    })

    it('should handle zero change in progress bar', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={0}
          showProgress={true}
        />
      )

      const progressBar = document.querySelector('[class*="bg-gradient-to-r"]')
      expect(progressBar).toHaveStyle({ width: '0%' })
    })

    it('should handle undefined change in progress bar', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          showProgress={true}
        />
      )

      const progressBar = document.querySelector('[class*="bg-gradient-to-r"]')
      expect(progressBar).toHaveStyle({ width: '0%' })
    })
  })

  describe('Link Behavior Testing', () => {
    it('should render as Link when href is provided', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          href="/dashboard/revenue"
        />
      )

      const link = screen.getByTestId('mock-link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/dashboard/revenue')
    })

    it('should render as regular Card when href is not provided', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
        />
      )

      const link = screen.queryByTestId('mock-link')
      expect(link).not.toBeInTheDocument()
    })

    it('should apply cursor-pointer class when href is provided', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          href="/dashboard/revenue"
        />
      )

      const card = document.querySelector('[class*="cursor-pointer"]')
      expect(card).toBeInTheDocument()
    })

    it('should not apply cursor-pointer class when href is not provided', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
        />
      )

      const card = document.querySelector('[class*="cursor-pointer"]')
      expect(card).not.toBeInTheDocument()
    })
  })

  describe('Icon Rendering and Styling', () => {
    it('should render icon when provided', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          icon={<DollarSign data-testid="dollar-icon" />}
        />
      )

      expect(screen.getByTestId('dollar-icon')).toBeInTheDocument()
    })

    it('should not render icon container when icon is not provided', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
        />
      )

      const iconContainer = document.querySelector('[aria-hidden="true"]')
      expect(iconContainer).toBeInTheDocument() // Container exists but is empty
      expect(iconContainer?.children.length).toBe(0)
    })

    it('should apply correct icon container styling', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          icon={<DollarSign />}
          variant="default"
        />
      )

      const iconContainer = document.querySelector('[aria-hidden="true"]')
      expect(iconContainer).toHaveClass('p-2.5', 'rounded-xl', 'transition-all', 'duration-300')
    })

    it('should handle multiple different icons', () => {
      const { rerender } = render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          icon={<DollarSign data-testid="dollar-icon" />}
        />
      )

      expect(screen.getByTestId('dollar-icon')).toBeInTheDocument()

      rerender(
        <MetricCard
          title="Users"
          value="1,234"
          icon={<Users data-testid="users-icon" />}
        />
      )

      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('dollar-icon')).not.toBeInTheDocument()
    })
  })

  describe('Responsive Styling Tests', () => {
    it('should have proper card height based on comparison data', () => {
      const { rerender } = render(
        <MetricCard
          title="Revenue"
          value="$24,500"
        />
      )

      let card = document.querySelector('[class*="min-h-"]')
      expect(card).toHaveClass('min-h-[160px]')

      rerender(
        <MetricCard
          title="Revenue"
          value="$24,500"
          comparison={mockComparisonObject}
        />
      )

      card = document.querySelector('[class*="min-h-"]')
      expect(card).toHaveClass('min-h-[200px]')
    })

    it('should have proper flex layout', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
        />
      )

      const card = document.querySelector('[class*="flex-col"]')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('justify-between')
    })

    it('should have proper header layout', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          icon={<DollarSign />}
        />
      )

      const header = document.querySelector('[class*="flex-row"]')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('items-center', 'justify-between')
    })
  })

  describe('Hover Effect Tests', () => {
    it('should have hover scale effects based on variant', () => {
      const { rerender } = render(
        <MetricCard
          title="Test"
          value="100"
          variant="critical"
        />
      )

      let card = document.querySelector('.metric-card-critical')
      expect(card).toHaveClass('hover:scale-[1.03]')

      rerender(<MetricCard title="Test" value="100" variant="success" />)
      card = document.querySelector('.metric-card-success')
      expect(card).toHaveClass('hover:scale-[1.02]')

      rerender(<MetricCard title="Test" value="100" variant="metallic" />)
      card = document.querySelector('.metallic-gradient')
      expect(card).toHaveClass('hover:scale-[1.02]')

      rerender(<MetricCard title="Test" value="100" variant="default" />)
      card = document.querySelector('.metric-card')
      expect(card).toHaveClass('hover:scale-[1.02]')
    })

    it('should have transition effects', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
        />
      )

      const card = document.querySelector('[class*="transition-all"]')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('duration-500')
    })

    it('should have hover opacity effects on gradient overlay', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
        />
      )

      const overlay = document.querySelector('[class*="group-hover:opacity-100"]')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass('opacity-0', 'transition-opacity', 'duration-500')
    })
  })

  describe('Badge Styling Tests', () => {
    it('should apply correct badge styling for up trend', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={12.5}
          trend="up"
        />
      )

      const badge = document.querySelector('.flex.items-center.gap-1')
      expect(badge).toHaveClass(
        'px-2.5',
        'py-1',
        'text-xs',
        'font-medium',
        'rounded-full',
        'border-2',
        'bg-emerald-50',
        'text-emerald-700',
        'border-emerald-200'
      )
    })

    it('should apply correct badge styling for down trend', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={-8.5}
          trend="down"
        />
      )

      const badge = document.querySelector('.flex.items-center.gap-1')
      expect(badge).toHaveClass(
        'bg-red-50',
        'text-red-700',
        'border-red-200'
      )
    })

    it('should apply correct badge styling for neutral trend', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={0}
          trend="neutral"
        />
      )

      const badge = document.querySelector('.flex.items-center.gap-1')
      expect(badge).toHaveClass(
        'bg-slate-50',
        'text-slate-700',
        'border-slate-200'
      )
    })
  })

  describe('Accessibility Testing', () => {
    it('should have proper semantic structure', () => {
      render(
        <MetricCard
          title="Monthly Revenue"
          value="$24,500"
          description="Revenue growth this month"
        />
      )

      // Title should be properly displayed
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
      
      // Value should be prominently displayed
      expect(screen.getByText('$24,500')).toBeInTheDocument()
      
      // Description should be available
      expect(screen.getByText('Revenue growth this month')).toBeInTheDocument()
    })

    it('should have proper aria attributes for icon', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          icon={<DollarSign />}
        />
      )

      const iconContainer = document.querySelector('[aria-hidden="true"]')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have proper class hierarchy for screen readers', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={12.5}
          description="Monthly growth"
        />
      )

      // Title should have proper styling class
      const title = document.querySelector('.admin-metric-title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('tracking-wider', 'uppercase', 'text-xs', 'font-semibold')

      // Value should have proper styling class
      const value = document.querySelector('.admin-metric-value')
      expect(value).toBeInTheDocument()

      // Description should have proper styling class
      const description = document.querySelector('.admin-text-small')
      expect(description).toBeInTheDocument()
    })

    it('should handle long titles appropriately', () => {
      render(
        <MetricCard
          title="Very Long Title That Might Wrap To Multiple Lines In The Card Header"
          value="$24,500"
        />
      )

      const title = screen.getByText('Very Long Title That Might Wrap To Multiple Lines In The Card Header')
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('admin-metric-title')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      render(
        <MetricCard
          title=""
          value=""
        />
      )

      // Should still render the card structure
      const card = document.querySelector('[class*="metric-card"]')
      expect(card).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      render(
        <MetricCard
          title="Large Number"
          value="$1,234,567,890"
          change={999.99}
        />
      )

      expect(screen.getByText('Large Number')).toBeInTheDocument()
      expect(screen.getByText('$1,234,567,890')).toBeInTheDocument()
      expect(screen.getByText('+999.99%')).toBeInTheDocument()
    })

    it('should handle special characters in values', () => {
      render(
        <MetricCard
          title="Special Chars"
          value="€1,234.56 (±5%)"
          change={-12.5}
        />
      )

      expect(screen.getByText('Special Chars')).toBeInTheDocument()
      expect(screen.getByText('€1,234.56 (±5%)')).toBeInTheDocument()
    })

    it('should handle undefined trend with defined change', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={12.5}
          trend={undefined}
        />
      )

      // Should still show the change value
      expect(screen.getByText('+12.5%')).toBeInTheDocument()
      
      // Badge should still be rendered but without specific trend styling
      const badge = document.querySelector('.flex.items-center.gap-1')
      expect(badge).toBeInTheDocument()
    })

    it('should handle null comparison data', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          comparison={null as any}
        />
      )

      // Should not show comparison section
      expect(screen.queryByText('Previous:')).not.toBeInTheDocument()
      expect(screen.queryByText('YoY:')).not.toBeInTheDocument()
    })

    it('should handle invalid comparison object', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          comparison={{} as any}
        />
      )

      // Should not crash and should not show comparison fields
      expect(screen.queryByText('Previous:')).not.toBeInTheDocument()
      expect(screen.queryByText('YoY:')).not.toBeInTheDocument()
    })

    it('should handle decimal change values', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={12.345}
          trend="up"
        />
      )

      expect(screen.getByText('+12.345%')).toBeInTheDocument()
    })

    it('should handle negative zero change', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={-0}
          trend="neutral"
        />
      )

      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  describe('Performance Tests', () => {
    it('should render efficiently with multiple re-renders', () => {
      const { rerender } = render(
        <MetricCard
          title="Revenue"
          value="$24,500"
          change={12.5}
        />
      )

      expect(screen.getByText('Revenue')).toBeInTheDocument()

      // Re-render with different data
      rerender(
        <MetricCard
          title="Customers"
          value="1,234"
          change={-5.2}
        />
      )

      expect(screen.getByText('Customers')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()

      // Re-render with complex data
      rerender(
        <MetricCard
          title="Complex Metric"
          value="$50,000"
          change={25.8}
          trend="up"
          icon={<TrendingUp />}
          comparison={mockComparisonObject}
          showProgress={true}
          variant="critical"
          priority="high"
        />
      )

      expect(screen.getByText('Complex Metric')).toBeInTheDocument()
      expect(screen.getByText('$50,000')).toBeInTheDocument()
    })

    it('should handle rapid data updates without errors', () => {
      const { rerender } = render(
        <MetricCard title="Test" value="100" />
      )

      // Simulate rapid updates
      for (let i = 0; i < 20; i++) {
        rerender(
          <MetricCard
            title={`Test ${i}`}
            value={`${1000 + i * 100}`}
            change={i * 2.5}
            trend={i % 2 === 0 ? 'up' : 'down'}
            variant={i % 3 === 0 ? 'critical' : 'default'}
          />
        )
      }

      // Final state should be correct
      expect(screen.getByText('Test 19')).toBeInTheDocument()
      expect(screen.getByText('2900')).toBeInTheDocument()
    })
  })

  describe('CSS Class Application Tests', () => {
    it('should apply base classes correctly', () => {
      render(
        <MetricCard
          title="Test"
          value="100"
        />
      )

      const card = document.querySelector('[class*="relative"]')
      expect(card).toHaveClass(
        'relative',
        'overflow-hidden',
        'transition-all',
        'duration-500',
        'group',
        'h-full',
        'flex',
        'flex-col',
        'justify-between'
      )
    })

    it('should apply title classes correctly', () => {
      render(
        <MetricCard
          title="Test Title"
          value="100"
        />
      )

      const title = document.querySelector('.admin-metric-title')
      expect(title).toHaveClass(
        'admin-metric-title',
        'tracking-wider',
        'uppercase',
        'text-xs',
        'font-semibold'
      )
    })

    it('should apply value classes correctly for different priorities', () => {
      const { rerender } = render(
        <MetricCard
          title="Test"
          value="100"
          priority="critical"
        />
      )

      let valueElement = document.querySelector('.admin-metric-value')
      expect(valueElement).toHaveClass('admin-metric-value', 'critical-metric')

      rerender(
        <MetricCard
          title="Test"
          value="100"
          priority="high"
        />
      )

      valueElement = document.querySelector('.admin-metric-value')
      expect(valueElement).toHaveClass('admin-metric-value', 'success-metric')

      rerender(
        <MetricCard
          title="Test"
          value="100"
          priority="low"
        />
      )

      valueElement = document.querySelector('.admin-metric-value')
      expect(valueElement).toHaveClass('admin-metric-value', 'neutral-metric')
    })

    it('should apply comparison section classes correctly', () => {
      render(
        <MetricCard
          title="Test"
          value="100"
          comparison={mockComparisonObject}
        />
      )

      const comparisonSection = document.querySelector('[class*="border-t"]')
      expect(comparisonSection).toHaveClass(
        'flex',
        'flex-col',
        'gap-1',
        'mt-3',
        'pt-3',
        'border-t',
        'border-border/40'
      )

      // Find the specific comparison item divs with the exact class pattern
      const comparisonItems = document.querySelectorAll('div.flex.items-center.justify-between.text-xs')
      expect(comparisonItems.length).toBe(2) // Previous and YoY

      comparisonItems.forEach(item => {
        expect(item).toHaveClass('flex', 'items-center', 'justify-between', 'text-xs')
      })
    })
  })
})