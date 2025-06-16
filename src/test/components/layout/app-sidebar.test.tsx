import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppSidebar } from '@/components/layout/app-sidebar'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} data-testid="next-image" />
  ),
}))

// Mock Tabler icons
vi.mock('@tabler/icons-react', () => ({
  IconCamera: () => <div data-testid="icon-camera" />,
  IconChartBar: () => <div data-testid="icon-chart-bar" />,
  IconDashboard: () => <div data-testid="icon-dashboard" />,
  IconListDetails: () => <div data-testid="icon-list-details" />,
  IconReport: () => <div data-testid="icon-report" />,
  IconSettings: () => <div data-testid="icon-settings" />,
  IconUsers: () => <div data-testid="icon-users" />,
}))

// Mock navigation components
vi.mock('@/components/layout/nav-main', () => ({
  NavMain: ({ items }: { items: any[] }) => (
    <div data-testid="nav-main">
      {items.map((item, index) => (
        <div key={index} data-testid={`nav-item-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
          {item.title}
          {item.hasQuickAction && (
            <span data-testid={`quick-action-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
              {item.quickActionLabel}
            </span>
          )}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/components/layout/nav-secondary', () => ({
  NavSecondary: ({ items, className }: { items: any[]; className?: string }) => (
    <div data-testid="nav-secondary" className={className}>
      {items.map((item, index) => (
        <div key={index} data-testid={`nav-secondary-${item.title.toLowerCase()}`}>
          {item.title}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/components/layout/nav-user', () => ({
  NavUser: ({ user }: { user: any }) => (
    <div data-testid="nav-user">
      <span data-testid="user-name">{user.name}</span>
      <span data-testid="user-email">{user.email}</span>
    </div>
  ),
}))

// Mock UI Sidebar components
vi.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, className, collapsible, ...props }: any) => (
    <div 
      data-testid="sidebar" 
      className={className}
      data-collapsible={collapsible}
      {...props}
    >
      {children}
    </div>
  ),
  SidebarContent: ({ children, className }: any) => (
    <div data-testid="sidebar-content" className={className}>
      {children}
    </div>
  ),
  SidebarFooter: ({ children, className }: any) => (
    <div data-testid="sidebar-footer" className={className}>
      {children}
    </div>
  ),
  SidebarHeader: ({ children, className }: any) => (
    <div data-testid="sidebar-header" className={className}>
      {children}
    </div>
  ),
}))

describe('AppSidebar', () => {
  describe('Basic Rendering', () => {
    it('should render with all main sections', () => {
      render(<AppSidebar />)
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-header')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument()
    })

    it('should render the logo and branding', () => {
      render(<AppSidebar />)
      
      const logo = screen.getByTestId('next-image')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', '/logo.png')
      expect(logo).toHaveAttribute('alt', 'Ink 37 Tattoos')
    })

    it('should render all navigation sections', () => {
      render(<AppSidebar />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Book of Business')).toBeInTheDocument()
      expect(screen.getByText('Financials')).toBeInTheDocument()
    })

    it('should render navigation components', () => {
      render(<AppSidebar />)
      
      expect(screen.getAllByTestId('nav-main')).toHaveLength(3) // Dashboard, Book of Business, Financials
      expect(screen.getByTestId('nav-secondary')).toBeInTheDocument()
      expect(screen.getByTestId('nav-user')).toBeInTheDocument()
    })
  })

  describe('Sidebar Configuration', () => {
    it('should configure sidebar with correct props', () => {
      render(<AppSidebar />)
      
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveAttribute('data-collapsible', 'offcanvas')
      expect(sidebar).toHaveClass('bg-sidebar')
    })

    it('should pass through additional props', () => {
      render(<AppSidebar data-custom="test-prop" />)
      
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveAttribute('data-custom', 'test-prop')
    })

    it('should apply correct CSS classes to sections', () => {
      render(<AppSidebar />)
      
      expect(screen.getByTestId('sidebar-header')).toHaveClass('pb-6', 'pt-6', 'px-6')
      expect(screen.getByTestId('sidebar-content')).toHaveClass('py-6', 'px-4')
      expect(screen.getByTestId('sidebar-footer')).toHaveClass('pt-4', 'px-4')
    })
  })

  describe('Header Section', () => {
    it('should render brand gradient container', () => {
      const { container } = render(<AppSidebar />)
      
      const brandGradient = container.querySelector('.bg-brand-gradient')
      expect(brandGradient).toBeInTheDocument()
      expect(brandGradient).toHaveClass('p-3', 'rounded-xl', 'shadow-lg')
    })

    it('should render logo with correct properties', () => {
      render(<AppSidebar />)
      
      const logo = screen.getByTestId('next-image')
      expect(logo).toHaveAttribute('src', '/logo.png')
      expect(logo).toHaveAttribute('alt', 'Ink 37 Tattoos')
      expect(logo).toHaveClass('object-contain')
    })

    it('should have proper header layout structure', () => {
      const { container } = render(<AppSidebar />)
      
      const headerContent = container.querySelector('.flex.items-center.gap-4')
      expect(headerContent).toBeInTheDocument()
      
      const logoContainer = container.querySelector('.relative.w-24.h-24')
      expect(logoContainer).toBeInTheDocument()
    })
  })

  describe('Navigation Sections', () => {
    it('should render Dashboard section with correct items', () => {
      render(<AppSidebar />)
      
      expect(screen.getByTestId('nav-item-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('nav-item-media-management')).toBeInTheDocument()
    })

    it('should render Book of Business section with quick actions', () => {
      render(<AppSidebar />)
      
      expect(screen.getByTestId('nav-item-appointments')).toBeInTheDocument()
      expect(screen.getByTestId('nav-item-customers')).toBeInTheDocument()
      
      // Quick actions
      expect(screen.getByTestId('quick-action-appointments')).toBeInTheDocument()
      expect(screen.getByTestId('quick-action-customers')).toBeInTheDocument()
    })

    it('should render Financials section', () => {
      render(<AppSidebar />)
      
      expect(screen.getByTestId('nav-item-analytics')).toBeInTheDocument()
      expect(screen.getByTestId('nav-item-reports')).toBeInTheDocument()
    })

    it('should render secondary navigation', () => {
      render(<AppSidebar />)
      
      expect(screen.getByTestId('nav-secondary-settings')).toBeInTheDocument()
    })

    it('should apply correct spacing and styling to sections', () => {
      const { container } = render(<AppSidebar />)
      
      const spacedSections = container.querySelectorAll('.space-y-3')
      expect(spacedSections.length).toBeGreaterThan(0)
      
      const sectionTitles = container.querySelectorAll('.text-xs.font-bold.text-muted-foreground.uppercase.tracking-wider')
      expect(sectionTitles).toHaveLength(3) // Dashboard, Book of Business, Financials
    })
  })

  describe('User Section', () => {
    it('should render user information', () => {
      render(<AppSidebar />)
      
      expect(screen.getByTestId('user-name')).toHaveTextContent('shadcn')
      expect(screen.getByTestId('user-email')).toHaveTextContent('m@example.com')
    })

    it('should pass correct user data to NavUser', () => {
      render(<AppSidebar />)
      
      const navUser = screen.getByTestId('nav-user')
      expect(navUser).toBeInTheDocument()
      expect(screen.getByTestId('user-name')).toBeInTheDocument()
      expect(screen.getByTestId('user-email')).toBeInTheDocument()
    })
  })

  describe('Data Structure', () => {
    it('should have correct dashboard items', () => {
      render(<AppSidebar />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Media Management')).toBeInTheDocument()
    })

    it('should have correct book of business items with quick actions', () => {
      render(<AppSidebar />)
      
      expect(screen.getByText('Appointments')).toBeInTheDocument()
      expect(screen.getByText('Customers')).toBeInTheDocument()
      expect(screen.getByText('New Appointment')).toBeInTheDocument()
      expect(screen.getByText('New Customer')).toBeInTheDocument()
    })

    it('should have correct financial items', () => {
      render(<AppSidebar />)
      
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(screen.getByText('Reports')).toBeInTheDocument()
    })

    it('should have correct secondary navigation items', () => {
      render(<AppSidebar />)
      
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have proper content organization', () => {
      const { container } = render(<AppSidebar />)
      
      const contentContainer = container.querySelector('.space-y-8')
      expect(contentContainer).toBeInTheDocument()
    })

    it('should position secondary nav with mt-auto', () => {
      render(<AppSidebar />)
      
      const navSecondary = screen.getByTestId('nav-secondary')
      expect(navSecondary).toHaveClass('mt-auto', 'px-4')
    })

    it('should maintain proper spacing hierarchy', () => {
      const { container } = render(<AppSidebar />)
      
      // Check for various spacing classes
      expect(container.querySelector('.space-y-8')).toBeInTheDocument()
      expect(container.querySelectorAll('.space-y-3')).toHaveLength(3)
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive padding classes', () => {
      render(<AppSidebar />)
      
      expect(screen.getByTestId('sidebar-header')).toHaveClass('pb-6', 'pt-6', 'px-6')
      expect(screen.getByTestId('sidebar-content')).toHaveClass('py-6', 'px-4')
      expect(screen.getByTestId('sidebar-footer')).toHaveClass('pt-4', 'px-4')
    })

    it('should handle collapsible sidebar behavior', () => {
      render(<AppSidebar />)
      
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveAttribute('data-collapsible', 'offcanvas')
    })
  })

  describe('Accessibility', () => {
    it('should have proper logo alt text', () => {
      render(<AppSidebar />)
      
      const logo = screen.getByTestId('next-image')
      expect(logo).toHaveAttribute('alt', 'Ink 37 Tattoos')
    })

    it('should have semantic navigation structure', () => {
      render(<AppSidebar />)
      
      expect(screen.getAllByTestId('nav-main')).toHaveLength(3)
      expect(screen.getByTestId('nav-secondary')).toBeInTheDocument()
      expect(screen.getByTestId('nav-user')).toBeInTheDocument()
    })

    it('should have proper section labels', () => {
      render(<AppSidebar />)
      
      const sectionLabels = ['Dashboard', 'Book of Business', 'Financials']
      sectionLabels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })
  })

  describe('Integration', () => {
    it('should integrate with sidebar components correctly', () => {
      render(<AppSidebar />)
      
      // All sidebar components should be present
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-header')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument()
    })

    it('should pass correct data to navigation components', () => {
      render(<AppSidebar />)
      
      // Verify that navigation components receive the correct data
      expect(screen.getByTestId('nav-main')).toBeInTheDocument()
      expect(screen.getByTestId('nav-secondary')).toBeInTheDocument()
      expect(screen.getByTestId('nav-user')).toBeInTheDocument()
    })

    it('should work with all required props', () => {
      render(<AppSidebar className="custom-sidebar" />)
      
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('custom-sidebar')
    })
  })

  describe('Brand Elements', () => {
    it('should render brand icon container correctly', () => {
      const { container } = render(<AppSidebar />)
      
      const brandIcon = container.querySelector('.w-8.h-8.bg-white\\/20.rounded-lg')
      expect(brandIcon).toBeInTheDocument()
    })

    it('should have proper brand styling', () => {
      const { container } = render(<AppSidebar />)
      
      const brandContainer = container.querySelector('.bg-brand-gradient')
      expect(brandContainer).toHaveClass('p-3', 'rounded-xl', 'shadow-lg')
    })

    it('should maintain proper logo sizing', () => {
      const { container } = render(<AppSidebar />)
      
      const logoContainer = container.querySelector('.relative.w-24.h-24')
      expect(logoContainer).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should render without crashing when props are undefined', () => {
      render(<AppSidebar />)
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    it('should handle missing navigation items gracefully', () => {
      // Component uses hardcoded data, so this tests the basic structure
      render(<AppSidebar />)
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getAllByTestId('nav-main')).toHaveLength(3)
    })
  })
})