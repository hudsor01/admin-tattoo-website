import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NavSecondary } from '@/components/layout/nav-secondary'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/settings'),
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock UI components
vi.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children, ...props }: any) => (
    <div data-testid="sidebar-group" {...props}>{children}</div>
  ),
  SidebarGroupContent: ({ children }: any) => (
    <div data-testid="sidebar-group-content">{children}</div>
  ),
  SidebarMenu: ({ children }: any) => (
    <div data-testid="sidebar-menu">{children}</div>
  ),
  SidebarMenuButton: ({ children, className, asChild, ...props }: any) => (
    <div 
      data-testid="sidebar-menu-button"
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

describe('NavSecondary', () => {
  const mockIcon = () => <div data-testid="mock-icon" />
  
  const sampleItems = [
    {
      title: 'Settings',
      url: '/settings',
      icon: mockIcon,
    },
    {
      title: 'Help',
      url: '/help',
      icon: mockIcon,
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render with basic structure', () => {
      render(<NavSecondary items={sampleItems} />)
      
      expect(screen.getByTestId('sidebar-group')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-group-content')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument()
    })

    it('should render all menu items', () => {
      render(<NavSecondary items={sampleItems} />)
      
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Help')).toBeInTheDocument()
      
      const menuItems = screen.getAllByTestId('sidebar-menu-item')
      expect(menuItems).toHaveLength(2)
    })

    it('should render with empty items array', () => {
      render(<NavSecondary items={[]} />)
      
      expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument()
      const menuItems = screen.queryAllByTestId('sidebar-menu-item')
      expect(menuItems).toHaveLength(0)
    })
  })

  describe('Links and Icons', () => {
    it('should render correct links', () => {
      render(<NavSecondary items={sampleItems} />)
      
      const settingsLink = screen.getByRole('link', { name: /settings/i })
      expect(settingsLink).toHaveAttribute('href', '/settings')
      
      const helpLink = screen.getByRole('link', { name: /help/i })
      expect(helpLink).toHaveAttribute('href', '/help')
    })

    it('should render icons for all items', () => {
      render(<NavSecondary items={sampleItems} />)
      
      const icons = screen.getAllByTestId('mock-icon')
      expect(icons).toHaveLength(2)
    })
  })

  describe('Active State', () => {
    it('should highlight active item based on pathname', () => {
      const usePathname = vi.mocked(require('next/navigation').usePathname)
      usePathname.mockReturnValue('/settings')
      
      render(<NavSecondary items={sampleItems} />)
      
      const buttons = screen.getAllByTestId('sidebar-menu-button')
      expect(buttons[0].className).toContain('bg-brand-gradient')
      expect(buttons[0].className).toContain('text-white')
      expect(buttons[0].className).toContain('shadow-lg')
    })

    it('should apply hover styles to inactive items', () => {
      const usePathname = vi.mocked(require('next/navigation').usePathname)
      usePathname.mockReturnValue('/settings')
      
      render(<NavSecondary items={sampleItems} />)
      
      const buttons = screen.getAllByTestId('sidebar-menu-button')
      // Help button should have hover styles
      expect(buttons[1].className).toContain('hover:bg-brand-gradient-soft')
      expect(buttons[1].className).toContain('hover:text-orange-700')
      expect(buttons[1].className).toContain('dark:hover:text-orange-300')
    })
  })

  describe('Styling', () => {
    it('should apply correct base styles', () => {
      render(<NavSecondary items={sampleItems} />)
      
      const buttons = screen.getAllByTestId('sidebar-menu-button')
      buttons.forEach(button => {
        expect(button.className).toContain('font-semibold')
        expect(button.className).toContain('py-3')
        expect(button.className).toContain('px-3')
        expect(button.className).toContain('rounded-xl')
        expect(button.className).toContain('mx-1')
        expect(button.className).toContain('transition-all')
        expect(button.className).toContain('duration-200')
      })
    })
  })

  describe('Props Forwarding', () => {
    it('should forward props to SidebarGroup', () => {
      render(<NavSecondary items={sampleItems} className="custom-class" data-test="custom" />)
      
      const sidebarGroup = screen.getByTestId('sidebar-group')
      expect(sidebarGroup).toHaveClass('custom-class')
      expect(sidebarGroup).toHaveAttribute('data-test', 'custom')
    })
  })

  describe('Accessibility', () => {
    it('should provide proper link semantics', () => {
      render(<NavSecondary items={sampleItems} />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })
  })
})