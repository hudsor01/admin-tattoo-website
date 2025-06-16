import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavMain } from '@/components/layout/nav-main'

// Mock Next.js navigation
const mockPush = vi.fn()
const mockUsePathname = vi.fn(() => '/dashboard')

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}))

// Mock Tabler icons
vi.mock('@tabler/icons-react', () => ({
  IconPlus: () => <div data-testid="icon-plus" />,
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, size, variant, asChild, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-size={size}
      data-variant={variant}
      data-as-child={asChild}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children }: any) => (
    <div data-testid="sidebar-group">{children}</div>
  ),
  SidebarGroupContent: ({ children }: any) => (
    <div data-testid="sidebar-group-content">{children}</div>
  ),
  SidebarMenu: ({ children }: any) => (
    <div data-testid="sidebar-menu">{children}</div>
  ),
  SidebarMenuButton: ({ children, asChild, tooltip, className, ...props }: any) => (
    <div 
      data-testid="sidebar-menu-button"
      data-tooltip={tooltip}
      className={className}
      data-as-child={asChild}
      {...props}
    >
      {children}
    </div>
  ),
  SidebarMenuItem: ({ children }: any) => (
    <div data-testid="sidebar-menu-item">{children}</div>
  ),
}))

describe('NavMain', () => {
  const mockIcon = () => <div data-testid="mock-icon" />
  
  const sampleItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: mockIcon,
    },
    {
      title: 'Users',
      url: '/users',
      icon: mockIcon,
    },
    {
      title: 'Settings',
      url: '/settings',
    }
  ]

  const itemsWithQuickActions = [
    {
      title: 'Appointments',
      url: '/appointments',
      icon: mockIcon,
      hasQuickAction: true,
      quickActionLabel: 'New Appointment',
      quickActionUrl: '/appointments/new',
    },
    {
      title: 'Customers',
      url: '/customers',
      icon: mockIcon,
      hasQuickAction: true,
      quickActionLabel: 'New Customer',
      quickActionUrl: '/customers/new',
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render with basic items', () => {
      render(<NavMain items={sampleItems} />)
      
      expect(screen.getByTestId('sidebar-group')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-group-content')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument()
    })

    it('should render all menu items', () => {
      render(<NavMain items={sampleItems} />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      
      const menuItems = screen.getAllByTestId('sidebar-menu-item')
      expect(menuItems).toHaveLength(3)
    })

    it('should render empty menu when no items provided', () => {
      render(<NavMain items={[]} />)
      
      expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument()
      const menuItems = screen.queryAllByTestId('sidebar-menu-item')
      expect(menuItems).toHaveLength(0)
    })
  })

  describe('Menu Items', () => {
    it('should render menu items with correct links', () => {
      render(<NavMain items={sampleItems} />)
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
      
      const usersLink = screen.getByRole('link', { name: /users/i })
      expect(usersLink).toHaveAttribute('href', '/users')
    })

    it('should render icons when provided', () => {
      render(<NavMain items={sampleItems} />)
      
      const icons = screen.getAllByTestId('mock-icon')
      expect(icons).toHaveLength(2) // Dashboard and Users have icons, Settings doesn't
    })

    it('should handle items without icons', () => {
      render(<NavMain items={sampleItems} />)
      
      // Settings item should render without crashing
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should apply tooltip to menu buttons', () => {
      render(<NavMain items={sampleItems} />)
      
      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      expect(menuButtons[0]).toHaveAttribute('data-tooltip', 'Dashboard')
      expect(menuButtons[1]).toHaveAttribute('data-tooltip', 'Users')
      expect(menuButtons[2]).toHaveAttribute('data-tooltip', 'Settings')
    })
  })

  describe('Active State', () => {
    it('should highlight active menu item based on pathname', () => {
      const usePathname = vi.mocked(require('next/navigation').usePathname)
      mockUsePathname.mockReturnValue('/dashboard')
      
      render(<NavMain items={sampleItems} />)
      
      const dashboardButton = screen.getAllByTestId('sidebar-menu-button')[0]
      expect(dashboardButton.className).toContain('bg-brand-gradient')
      expect(dashboardButton.className).toContain('text-white')
      expect(dashboardButton.className).toContain('shadow-lg')
    })

    it('should apply hover styles to inactive items', () => {
      const usePathname = vi.mocked(require('next/navigation').usePathname)
      mockUsePathname.mockReturnValue('/dashboard')
      
      render(<NavMain items={sampleItems} />)
      
      const usersButton = screen.getAllByTestId('sidebar-menu-button')[1]
      expect(usersButton.className).toContain('hover:bg-brand-gradient-soft')
      expect(usersButton.className).toContain('hover:text-orange-700')
    })

    it('should update active state when pathname changes', () => {
      const usePathname = vi.mocked(require('next/navigation').usePathname)
      mockUsePathname.mockReturnValue('/users')
      
      render(<NavMain items={sampleItems} />)
      
      const usersButton = screen.getAllByTestId('sidebar-menu-button')[1]
      expect(usersButton.className).toContain('bg-brand-gradient')
      expect(usersButton.className).toContain('text-white')
    })
  })

  describe('Quick Actions', () => {
    it('should render quick action buttons when hasQuickAction is true', () => {
      render(<NavMain items={itemsWithQuickActions} />)
      
      const quickActionButtons = screen.getAllByTestId('icon-plus')
      expect(quickActionButtons).toHaveLength(2)
    })

    it('should link quick actions to correct URLs', () => {
      render(<NavMain items={itemsWithQuickActions} />)
      
      const quickActionLinks = screen.getAllByRole('link')
      const quickActions = quickActionLinks.filter(link => 
        link.getAttribute('href')?.includes('/new')
      )
      
      expect(quickActions).toHaveLength(2)
      expect(quickActions[0]).toHaveAttribute('href', '/appointments/new')
      expect(quickActions[1]).toHaveAttribute('href', '/customers/new')
    })

    it('should apply correct styling to quick action buttons', () => {
      render(<NavMain items={itemsWithQuickActions} />)
      
      const quickActionButtons = screen.getAllByRole('button')
      quickActionButtons.forEach(button => {
        expect(button).toHaveAttribute('data-size', 'sm')
        expect(button).toHaveAttribute('data-variant', 'ghost')
        expect(button.className).toContain('h-6')
        expect(button.className).toContain('w-6')
        expect(button.className).toContain('p-0')
        expect(button.className).toContain('ml-auto')
      })
    })

    it('should not render quick actions when hasQuickAction is false', () => {
      render(<NavMain items={sampleItems} />)
      
      const quickActionButtons = screen.queryAllByTestId('icon-plus')
      expect(quickActionButtons).toHaveLength(0)
    })

    it('should not render quick actions when quickActionUrl is missing', () => {
      const itemsWithoutUrl = [
        {
          title: 'Test Item',
          url: '/test',
          hasQuickAction: true,
          quickActionLabel: 'Test Action',
          // quickActionUrl is missing
        }
      ]
      
      render(<NavMain items={itemsWithoutUrl} />)
      
      const quickActionButtons = screen.queryAllByTestId('icon-plus')
      expect(quickActionButtons).toHaveLength(0)
    })

    it('should handle click events on quick action buttons', async () => {
      const user = userEvent.setup()
      render(<NavMain items={itemsWithQuickActions} />)
      
      const quickActionButtons = screen.getAllByRole('button')
      
      // Should not throw error when clicked
      await user.click(quickActionButtons[0])
      expect(quickActionButtons[0]).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply base styling classes', () => {
      render(<NavMain items={sampleItems} />)
      
      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      menuButtons.forEach(button => {
        expect(button.className).toContain('transition-all')
        expect(button.className).toContain('duration-200')
        expect(button.className).toContain('font-semibold')
        expect(button.className).toContain('py-3')
        expect(button.className).toContain('px-3')
        expect(button.className).toContain('rounded-xl')
        expect(button.className).toContain('mx-1')
      })
    })

    it('should apply different styles for active and inactive items', () => {
      const usePathname = vi.mocked(require('next/navigation').usePathname)
      mockUsePathname.mockReturnValue('/dashboard')
      
      render(<NavMain items={sampleItems} />)
      
      const buttons = screen.getAllByTestId('sidebar-menu-button')
      
      // Active item (Dashboard)
      expect(buttons[0].className).toContain('bg-brand-gradient')
      expect(buttons[0].className).toContain('text-white')
      expect(buttons[0].className).toContain('shadow-lg')
      
      // Inactive item (Users)
      expect(buttons[1].className).toContain('hover:bg-brand-gradient-soft')
      expect(buttons[1].className).toContain('hover:text-orange-700')
      expect(buttons[1].className).toContain('dark:hover:text-orange-300')
    })

    it('should apply conditional quick action styling based on active state', () => {
      const usePathname = vi.mocked(require('next/navigation').usePathname)
      mockUsePathname.mockReturnValue('/appointments')
      
      render(<NavMain items={itemsWithQuickActions} />)
      
      const quickActionButtons = screen.getAllByRole('button')
      
      // Check that active item quick action has different styling
      expect(quickActionButtons[0].className).toContain('hover:bg-white/20')
      expect(quickActionButtons[0].className).toContain('text-white')
    })
  })

  describe('Layout Structure', () => {
    it('should have proper flex layout for menu items', () => {
      render(<NavMain items={sampleItems} />)
      
      const menuLinks = screen.getAllByRole('link')
      menuLinks.forEach(link => {
        expect(link.className).toContain('flex')
        expect(link.className).toContain('items-center')
        expect(link.className).toContain('justify-between')
        expect(link.className).toContain('w-full')
      })
    })

    it('should organize icon and title correctly', () => {
      const { container } = render(<NavMain items={sampleItems} />)
      
      const iconContainers = container.querySelectorAll('.flex.items-center.gap-3')
      expect(iconContainers.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should provide proper link semantics', () => {
      render(<NavMain items={sampleItems} />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(3)
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('should provide tooltips for menu items', () => {
      render(<NavMain items={sampleItems} />)
      
      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      menuButtons.forEach((button, index) => {
        expect(button).toHaveAttribute('data-tooltip', sampleItems[index].title)
      })
    })

    it('should maintain button semantics for quick actions', () => {
      render(<NavMain items={itemsWithQuickActions} />)
      
      const quickActionButtons = screen.getAllByRole('button')
      expect(quickActionButtons).toHaveLength(2)
      
      quickActionButtons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle items with special characters in title', () => {
      const specialItems = [
        { title: 'Special & Characters', url: '/special', icon: mockIcon },
        { title: 'Émojis 🚀', url: '/emoji', icon: mockIcon }
      ]
      
      render(<NavMain items={specialItems} />)
      
      expect(screen.getByText('Special & Characters')).toBeInTheDocument()
      expect(screen.getByText('Émojis 🚀')).toBeInTheDocument()
    })

    it('should handle very long URLs', () => {
      const longUrlItems = [
        { 
          title: 'Long URL', 
          url: '/very/long/url/path/that/might/be/problematic/in/some/cases',
          icon: mockIcon 
        }
      ]
      
      render(<NavMain items={longUrlItems} />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/very/long/url/path/that/might/be/problematic/in/some/cases')
    })

    it('should handle empty quick action URLs gracefully', () => {
      const emptyUrlItems = [
        {
          title: 'Empty URL',
          url: '/test',
          hasQuickAction: true,
          quickActionUrl: '',
        }
      ]
      
      render(<NavMain items={emptyUrlItems} />)
      
      // Should not render quick action when URL is empty
      const quickActions = screen.queryAllByTestId('icon-plus')
      expect(quickActions).toHaveLength(0)
    })
  })
})