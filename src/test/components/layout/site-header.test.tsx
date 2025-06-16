import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SiteHeader } from '@/components/layout/site-header'

// Mock UI components
vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: ({ className, ...props }: any) => (
    <button 
      data-testid="sidebar-trigger" 
      className={className}
      {...props}
    >
      Toggle Sidebar
    </button>
  ),
}))

vi.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => (
    <button data-testid="theme-toggle">
      Toggle Theme
    </button>
  ),
}))

describe('SiteHeader', () => {
  describe('Basic Rendering', () => {
    it('should render header with all components', () => {
      render(<SiteHeader />)
      
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument()
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('should render as header element', () => {
      render(<SiteHeader />)
      
      const header = screen.getByRole('banner')
      expect(header.tagName).toBe('HEADER')
    })

    it('should render title with correct text', () => {
      render(<SiteHeader />)
      
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveTextContent('Admin Dashboard')
    })
  })

  describe('Layout Structure', () => {
    it('should have proper flex layout', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass('flex', 'items-center')
      
      const innerContainer = container.querySelector('.flex.w-full.items-center')
      expect(innerContainer).toBeInTheDocument()
    })

    it('should have correct gap spacing', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass('gap-3')
      
      const innerContainer = container.querySelector('.flex.w-full.items-center')
      expect(innerContainer).toHaveClass('gap-4')
    })

    it('should have proper title container with flex-1', () => {
      const { container } = render(<SiteHeader />)
      
      const titleContainer = container.querySelector('.flex.items-center.min-w-0.flex-1')
      expect(titleContainer).toBeInTheDocument()
    })

    it('should have controls container', () => {
      const { container } = render(<SiteHeader />)
      
      const controlsContainer = container.querySelector('.flex.items-center.gap-4')
      expect(controlsContainer).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply correct header styling', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass(
        'flex',
        'min-h-16',
        'lg:min-h-18',
        'shrink-0',
        'items-center',
        'gap-3',
        'bg-background/95',
        'backdrop-blur',
        'shadow-sm',
        'border-b',
        'border-border'
      )
    })

    it('should apply responsive min-height classes', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass('min-h-16', 'lg:min-h-18')
    })

    it('should apply backdrop blur and background effects', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass(
        'bg-background/95',
        'backdrop-blur',
        'supports-[backdrop-filter]:bg-background/60'
      )
    })

    it('should apply sidebar responsive styling', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass('group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-16')
    })

    it('should apply transition effects', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass('transition-[width,height]', 'ease-linear')
    })

    it('should apply responsive padding', () => {
      const { container } = render(<SiteHeader />)
      
      const innerContainer = container.querySelector('.px-6.lg\\:px-8')
      expect(innerContainer).toBeInTheDocument()
    })
  })

  describe('Title Styling', () => {
    it('should apply correct title styling', () => {
      render(<SiteHeader />)
      
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveClass(
        'text-xl',
        'sm:text-2xl',
        'lg:text-3xl',
        'font-black',
        'text-foreground',
        'tracking-tight',
        'truncate'
      )
    })

    it('should be responsive text sizes', () => {
      render(<SiteHeader />)
      
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveClass('text-xl', 'sm:text-2xl', 'lg:text-3xl')
    })

    it('should truncate long text', () => {
      render(<SiteHeader />)
      
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveClass('truncate')
    })
  })

  describe('Component Integration', () => {
    it('should render SidebarTrigger with correct styling', () => {
      render(<SiteHeader />)
      
      const trigger = screen.getByTestId('sidebar-trigger')
      expect(trigger).toHaveClass(
        '-ml-1',
        'hover:bg-accent/50',
        'transition-colors',
        'rounded-lg',
        'p-2'
      )
    })

    it('should render ThemeToggle in controls section', () => {
      render(<SiteHeader />)
      
      const themeToggle = screen.getByTestId('theme-toggle')
      expect(themeToggle).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive minimum heights', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass('min-h-16')
      expect(header).toHaveClass('lg:min-h-18')
    })

    it('should have responsive text sizing', () => {
      render(<SiteHeader />)
      
      const title = screen.getByRole('heading')
      expect(title).toHaveClass('text-xl')
      expect(title).toHaveClass('sm:text-2xl')
      expect(title).toHaveClass('lg:text-3xl')
    })

    it('should have responsive padding', () => {
      const { container } = render(<SiteHeader />)
      
      const innerContainer = container.querySelector('.px-6')
      expect(innerContainer).toHaveClass('lg:px-8')
    })

    it('should handle sidebar collapsible states', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass('group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-16')
    })
  })

  describe('Accessibility', () => {
    it('should use proper heading hierarchy', () => {
      render(<SiteHeader />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Admin Dashboard')
    })

    it('should have proper landmark role', () => {
      render(<SiteHeader />)
      
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
    })

    it('should provide accessible controls', () => {
      render(<SiteHeader />)
      
      const sidebarTrigger = screen.getByTestId('sidebar-trigger')
      const themeToggle = screen.getByTestId('theme-toggle')
      
      expect(sidebarTrigger).toBeInTheDocument()
      expect(themeToggle).toBeInTheDocument()
    })
  })

  describe('Visual Design', () => {
    it('should have border and shadow styling', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass('shadow-sm', 'border-b', 'border-border')
    })

    it('should have backdrop effects for modern browsers', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass('backdrop-blur')
      expect(header).toHaveClass('supports-[backdrop-filter]:bg-background/60')
    })

    it('should have smooth transitions', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass('transition-[width,height]', 'ease-linear')
      
      const trigger = screen.getByTestId('sidebar-trigger')
      expect(trigger).toHaveClass('transition-colors')
    })
  })

  describe('Layout Behavior', () => {
    it('should shrink appropriately', () => {
      const { container } = render(<SiteHeader />)
      
      const header = container.querySelector('header')
      expect(header).toHaveClass('shrink-0')
    })

    it('should fill width correctly', () => {
      const { container } = render(<SiteHeader />)
      
      const innerContainer = container.querySelector('.w-full')
      expect(innerContainer).toBeInTheDocument()
    })

    it('should handle minimum width constraints', () => {
      const { container } = render(<SiteHeader />)
      
      const titleContainer = container.querySelector('.min-w-0')
      expect(titleContainer).toBeInTheDocument()
    })
  })
})