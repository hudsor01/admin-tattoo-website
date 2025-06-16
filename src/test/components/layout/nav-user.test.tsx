import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavUser } from '@/components/layout/nav-user'

// Mock stores
vi.mock('@/stores/auth-store', () => ({
  useUser: vi.fn(() => null),
}))

// Mock Tabler icons
vi.mock('@tabler/icons-react', () => ({
  IconDotsVertical: () => <div data-testid="icon-dots" />,
  IconNotification: () => <div data-testid="icon-notification" />,
  IconSettings: () => <div data-testid="icon-settings" />,
  IconUser: () => <div data-testid="icon-user" />,
}))

// Mock UI components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => (
    <div data-testid="avatar" className={className}>{children}</div>
  ),
  AvatarFallback: ({ children, className }: any) => (
    <div data-testid="avatar-fallback" className={className}>{children}</div>
  ),
  AvatarImage: ({ src, alt, ...props }: any) => (
    <img data-testid="avatar-image" src={src} alt={alt} {...props} />
  ),
}))

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
  DropdownMenuGroup: ({ children }: any) => (
    <div data-testid="dropdown-group">{children}</div>
  ),
  DropdownMenuItem: ({ children, className, onClick }: any) => (
    <div 
      data-testid="dropdown-item" 
      className={className}
      onClick={onClick}
      role="menuitem"
    >
      {children}
    </div>
  ),
  DropdownMenuLabel: ({ children, className }: any) => (
    <div data-testid="dropdown-label" className={className}>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger" data-as-child={asChild}>{children}</div>
  ),
}))

vi.mock('@/components/ui/sidebar', () => ({
  SidebarMenu: ({ children }: any) => (
    <div data-testid="sidebar-menu">{children}</div>
  ),
  SidebarMenuButton: ({ children, size, className }: any) => (
    <button 
      data-testid="sidebar-menu-button" 
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
  SidebarMenuItem: ({ children }: any) => (
    <div data-testid="sidebar-menu-item">{children}</div>
  ),
  useSidebar: vi.fn(() => ({ isMobile: false })),
}))

vi.mock('@/components/auth/logout-button', () => ({
  LogoutMenuItem: () => <div data-testid="logout-menu-item">Logout</div>,
}))

describe('NavUser', () => {
  const sampleUser = {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render with prop user', () => {
      render(<NavUser user={sampleUser} />)
      
      expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument()
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('should render with auth user when available', () => {
      const useUser = vi.mocked(require('@/stores/auth-store').useUser)
      useUser.mockReturnValue({
        name: 'Auth User',
        email: 'auth@example.com',
        role: 'admin'
      })
      
      render(<NavUser user={sampleUser} />)
      
      expect(screen.getByText('Auth User')).toBeInTheDocument()
      expect(screen.getByText('auth@example.com')).toBeInTheDocument()
    })

    it('should render with default user when no user provided', () => {
      render(<NavUser />)
      
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('admin@ink37tattoos.com')).toBeInTheDocument()
    })
  })

  describe('Avatar and User Info', () => {
    it('should render avatar with image', () => {
      render(<NavUser user={sampleUser} />)
      
      const avatarImage = screen.getAllByTestId('avatar-image')[0]
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg')
      expect(avatarImage).toHaveAttribute('alt', 'John Doe')
    })

    it('should render fallback with initials', () => {
      render(<NavUser user={{ ...sampleUser, avatar: '' }} />)
      
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD')
    })

    it('should generate correct initials', () => {
      render(<NavUser user={{ name: 'Alice Bob Cooper', email: 'abc@example.com', avatar: '' }} />)
      
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('AB')
    })

    it('should handle single name', () => {
      render(<NavUser user={{ name: 'Madonna', email: 'madonna@example.com', avatar: '' }} />)
      
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('M')
    })

    it('should handle empty name', () => {
      render(<NavUser user={{ name: '', email: 'test@example.com', avatar: '' }} />)
      
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('U')
    })
  })

  describe('Dropdown Menu', () => {
    it('should render dropdown menu items', () => {
      render(<NavUser user={sampleUser} />)
      
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByTestId('logout-menu-item')).toBeInTheDocument()
    })

    it('should render menu icons', () => {
      render(<NavUser user={sampleUser} />)
      
      expect(screen.getByTestId('icon-user')).toBeInTheDocument()
      expect(screen.getByTestId('icon-settings')).toBeInTheDocument()
      expect(screen.getByTestId('icon-notification')).toBeInTheDocument()
      expect(screen.getByTestId('icon-dots')).toBeInTheDocument()
    })

    it('should render separators', () => {
      render(<NavUser user={sampleUser} />)
      
      const separators = screen.getAllByTestId('dropdown-separator')
      expect(separators).toHaveLength(2)
    })

    it('should show role when auth user has role', () => {
      const useUser = vi.mocked(require('@/stores/auth-store').useUser)
      useUser.mockReturnValue({
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      })
      
      render(<NavUser />)
      
      expect(screen.getByText('admin')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should set dropdown side to right on desktop', () => {
      const useSidebar = vi.mocked(require('@/components/ui/sidebar').useSidebar)
      useSidebar.mockReturnValue({ isMobile: false })
      
      render(<NavUser user={sampleUser} />)
      
      expect(screen.getByTestId('dropdown-content')).toHaveAttribute('data-side', 'right')
    })

    it('should set dropdown side to bottom on mobile', () => {
      const useSidebar = vi.mocked(require('@/components/ui/sidebar').useSidebar)
      useSidebar.mockReturnValue({ isMobile: true })
      
      render(<NavUser user={sampleUser} />)
      
      expect(screen.getByTestId('dropdown-content')).toHaveAttribute('data-side', 'bottom')
    })
  })

  describe('Styling', () => {
    it('should apply correct button styling', () => {
      render(<NavUser user={sampleUser} />)
      
      const button = screen.getByTestId('sidebar-menu-button')
      expect(button).toHaveAttribute('data-size', 'lg')
      expect(button.className).toContain('data-[state=open]:bg-sidebar-accent')
      expect(button.className).toContain('hover:bg-sidebar-accent/50')
    })

    it('should apply correct avatar styling', () => {
      render(<NavUser user={sampleUser} />)
      
      const avatars = screen.getAllByTestId('avatar')
      avatars.forEach(avatar => {
        expect(avatar.className).toContain('rounded-lg')
        expect(avatar.className).toContain('ring-2')
        expect(avatar.className).toContain('ring-border')
      })
    })

    it('should apply brand gradient to fallback', () => {
      render(<NavUser user={{ ...sampleUser, avatar: '' }} />)
      
      const fallback = screen.getByTestId('avatar-fallback')
      expect(fallback.className).toContain('bg-brand-gradient')
      expect(fallback.className).toContain('text-white')
    })
  })

  describe('User Interactions', () => {
    it('should handle menu item clicks', async () => {
      const user = userEvent.setup()
      render(<NavUser user={sampleUser} />)
      
      const profileItem = screen.getByText('Profile')
      await user.click(profileItem)
      
      // Should not throw error
      expect(profileItem).toBeInTheDocument()
    })
  })

  describe('Image Source Handling', () => {
    it('should use image property when available', () => {
      const userWithImage = { 
        name: 'Test', 
        email: 'test@example.com', 
        image: 'https://example.com/image.jpg',
        avatar: 'https://example.com/avatar.jpg'
      }
      
      render(<NavUser user={userWithImage as any} />)
      
      const avatarImage = screen.getAllByTestId('avatar-image')[0]
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('should fallback to avatar property', () => {
      render(<NavUser user={sampleUser} />)
      
      const avatarImage = screen.getAllByTestId('avatar-image')[0]
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should handle undefined image sources', () => {
      render(<NavUser user={{ name: 'Test', email: 'test@example.com', avatar: undefined as any }} />)
      
      const avatarImage = screen.getAllByTestId('avatar-image')[0]
      expect(avatarImage).toHaveAttribute('src', '')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null user gracefully', () => {
      render(<NavUser user={null as any} />)
      
      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    it('should handle undefined user gracefully', () => {
      render(<NavUser user={undefined} />)
      
      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    it('should handle user with missing properties', () => {
      render(<NavUser user={{ name: 'Test' } as any} />)
      
      expect(screen.getByText('Test')).toBeInTheDocument()
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('T')
    })
  })

  describe('Layout Structure', () => {
    it('should have proper dropdown layout', () => {
      render(<NavUser user={sampleUser} />)
      
      expect(screen.getByTestId('dropdown-label')).toBeInTheDocument()
      expect(screen.getByTestId('dropdown-group')).toBeInTheDocument()
    })

    it('should apply correct dropdown positioning', () => {
      render(<NavUser user={sampleUser} />)
      
      const content = screen.getByTestId('dropdown-content')
      expect(content).toHaveAttribute('data-align', 'end')
    })
  })
})