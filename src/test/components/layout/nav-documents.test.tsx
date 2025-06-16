import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NavDocuments } from '@/components/layout/nav-documents'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock Tabler icons
vi.mock('@tabler/icons-react', () => ({
  IconDots: () => <div data-testid="icon-dots" />,
  IconFolder: () => <div data-testid="icon-folder" />,
  IconShare3: () => <div data-testid="icon-share" />,
  IconTrash: () => <div data-testid="icon-trash" />,
}))

// Mock UI components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuContent: ({ children, side, align, className }: any) => (
    <div 
      data-testid="dropdown-content" 
      data-side={side} 
      data-align={align}
      className={className}
    >
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, variant }: any) => (
    <div data-testid="dropdown-item" data-variant={variant} role="menuitem">
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger" data-as-child={asChild}>{children}</div>
  ),
}))

vi.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children, className }: any) => (
    <div data-testid="sidebar-group" className={className}>{children}</div>
  ),
  SidebarGroupLabel: ({ children, className }: any) => (
    <div data-testid="sidebar-group-label" className={className}>{children}</div>
  ),
  SidebarMenu: ({ children }: any) => (
    <div data-testid="sidebar-menu">{children}</div>
  ),
  SidebarMenuAction: ({ children, showOnHover, className }: any) => (
    <button 
      data-testid="sidebar-menu-action" 
      data-show-on-hover={showOnHover}
      className={className}
    >
      {children}
    </button>
  ),
  SidebarMenuButton: ({ children, className, asChild }: any) => (
    <div 
      data-testid="sidebar-menu-button"
      className={className}
      data-as-child={asChild}
    >
      {children}
    </div>
  ),
  SidebarMenuItem: ({ children }: any) => (
    <div data-testid="sidebar-menu-item">{children}</div>
  ),
  useSidebar: vi.fn(() => ({ isMobile: false })),
}))

describe('NavDocuments', () => {
  const mockIcon = () => <div data-testid="mock-icon" />
  
  const sampleItems = [
    {
      name: 'Document 1',
      url: '/docs/doc1',
      icon: mockIcon,
    },
    {
      name: 'Document 2',
      url: '/docs/doc2',
      icon: mockIcon,
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render with basic structure', () => {
      render(<NavDocuments items={sampleItems} />)
      
      expect(screen.getByTestId('sidebar-group')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-group-label')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument()
      expect(screen.getByText('Documents')).toBeInTheDocument()
    })

    it('should render all document items', () => {
      render(<NavDocuments items={sampleItems} />)
      
      expect(screen.getByText('Document 1')).toBeInTheDocument()
      expect(screen.getByText('Document 2')).toBeInTheDocument()
      
      const menuItems = screen.getAllByTestId('sidebar-menu-item')
      expect(menuItems).toHaveLength(3) // 2 docs + 1 "More" item
    })

    it('should render with empty items array', () => {
      render(<NavDocuments items={[]} />)
      
      expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument()
      expect(screen.getByText('Documents')).toBeInTheDocument()
      expect(screen.getByText('More')).toBeInTheDocument() // Always present
    })
  })

  describe('Document Links', () => {
    it('should render correct links for documents', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const doc1Link = screen.getByRole('link', { name: /document 1/i })
      expect(doc1Link).toHaveAttribute('href', '/docs/doc1')
      
      const doc2Link = screen.getByRole('link', { name: /document 2/i })
      expect(doc2Link).toHaveAttribute('href', '/docs/doc2')
    })

    it('should render icons for documents', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const icons = screen.getAllByTestId('mock-icon')
      expect(icons).toHaveLength(2)
    })
  })

  describe('Dropdown Actions', () => {
    it('should render dropdown menus for each document', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const dropdownMenus = screen.getAllByTestId('dropdown-menu')
      expect(dropdownMenus).toHaveLength(2) // One per document
    })

    it('should render action menu items', () => {
      render(<NavDocuments items={sampleItems} />)
      
      expect(screen.getAllByText('Open')).toHaveLength(2)
      expect(screen.getAllByText('Share')).toHaveLength(2)
      expect(screen.getAllByText('Delete')).toHaveLength(2)
    })

    it('should render action icons', () => {
      render(<NavDocuments items={sampleItems} />)
      
      expect(screen.getAllByTestId('icon-folder')).toHaveLength(2)
      expect(screen.getAllByTestId('icon-share')).toHaveLength(2)
      expect(screen.getAllByTestId('icon-trash')).toHaveLength(2)
    })

    it('should apply destructive variant to delete items', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const deleteItems = screen.getAllByTestId('dropdown-item')
        .filter(item => item.getAttribute('data-variant') === 'destructive')
      expect(deleteItems).toHaveLength(2)
    })

    it('should render separators in dropdowns', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const separators = screen.getAllByTestId('dropdown-separator')
      expect(separators).toHaveLength(2) // One per document dropdown
    })
  })

  describe('More Button', () => {
    it('should render More button', () => {
      render(<NavDocuments items={sampleItems} />)
      
      expect(screen.getByText('More')).toBeInTheDocument()
    })

    it('should apply correct styling to More button', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const moreButtons = screen.getAllByTestId('sidebar-menu-button')
      const moreButton = moreButtons[moreButtons.length - 1] // Last button is "More"
      expect(moreButton.className).toContain('text-sidebar-foreground/70')
    })

    it('should render More button icon', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const dotsIcons = screen.getAllByTestId('icon-dots')
      expect(dotsIcons.length).toBeGreaterThan(0) // Should have dots icons
    })
  })

  describe('Responsive Behavior', () => {
    it('should set dropdown side to right on desktop', () => {
      const useSidebar = vi.mocked(require('@/components/ui/sidebar').useSidebar)
      useSidebar.mockReturnValue({ isMobile: false })
      
      render(<NavDocuments items={sampleItems} />)
      
      const dropdownContents = screen.getAllByTestId('dropdown-content')
      dropdownContents.forEach(content => {
        expect(content).toHaveAttribute('data-side', 'right')
        expect(content).toHaveAttribute('data-align', 'start')
      })
    })

    it('should set dropdown side to bottom on mobile', () => {
      const useSidebar = vi.mocked(require('@/components/ui/sidebar').useSidebar)
      useSidebar.mockReturnValue({ isMobile: true })
      
      render(<NavDocuments items={sampleItems} />)
      
      const dropdownContents = screen.getAllByTestId('dropdown-content')
      dropdownContents.forEach(content => {
        expect(content).toHaveAttribute('data-side', 'bottom')
        expect(content).toHaveAttribute('data-align', 'end')
      })
    })
  })

  describe('Styling', () => {
    it('should apply correct group styling', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const group = screen.getByTestId('sidebar-group')
      expect(group.className).toContain('group-data-[collapsible=icon]:hidden')
    })

    it('should apply correct label styling', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const label = screen.getByTestId('sidebar-group-label')
      expect(label.className).toContain('text-lg')
      expect(label.className).toContain('font-bold')
    })

    it('should apply correct button styling', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const buttons = screen.getAllByTestId('sidebar-menu-button')
      buttons.slice(0, -1).forEach(button => { // Exclude "More" button
        expect(button.className).toContain('text-lg')
        expect(button.className).toContain('font-semibold')
        expect(button.className).toContain('py-4')
      })
    })

    it('should apply correct action button styling', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const actionButtons = screen.getAllByTestId('sidebar-menu-action')
      actionButtons.forEach(button => {
        expect(button).toHaveAttribute('data-show-on-hover', 'true')
        expect(button.className).toContain('data-[state=open]:bg-accent')
        expect(button.className).toContain('rounded-sm')
      })
    })
  })

  describe('Accessibility', () => {
    it('should provide proper link semantics', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('should provide screen reader text for actions', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const screenReaderTexts = screen.getAllByText('More')
      expect(screenReaderTexts.length).toBeGreaterThan(0)
    })

    it('should use proper menu item roles', () => {
      render(<NavDocuments items={sampleItems} />)
      
      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle documents with special characters', () => {
      const specialItems = [
        {
          name: 'Document & File',
          url: '/docs/special',
          icon: mockIcon,
        }
      ]
      
      render(<NavDocuments items={specialItems} />)
      
      expect(screen.getByText('Document & File')).toBeInTheDocument()
    })

    it('should handle long document names', () => {
      const longNameItems = [
        {
          name: 'Very Long Document Name That Might Overflow',
          url: '/docs/long',
          icon: mockIcon,
        }
      ]
      
      render(<NavDocuments items={longNameItems} />)
      
      expect(screen.getByText('Very Long Document Name That Might Overflow')).toBeInTheDocument()
    })
  })
})