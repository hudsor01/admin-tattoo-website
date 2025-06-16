import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminPageHeader, AdminPageStructure } from '@/components/layout/Admin-Layout'

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}))

describe('AdminPageHeader', () => {
  describe('Basic Rendering', () => {
    it('should render with title only', () => {
      render(<AdminPageHeader title="Test Title" />)
      
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Title')
    })

    it('should render with title and description', () => {
      render(
        <AdminPageHeader 
          title="Test Title" 
          description="Test description for the page" 
        />
      )
      
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test description for the page')).toBeInTheDocument()
    })

    it('should render with title and children actions', () => {
      render(
        <AdminPageHeader title="Test Title">
          <button>Action Button</button>
          <span>Custom Action</span>
        </AdminPageHeader>
      )
      
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Action Button')).toBeInTheDocument()
      expect(screen.getByText('Custom Action')).toBeInTheDocument()
    })

    it('should render with all props', () => {
      render(
        <AdminPageHeader 
          title="Complete Title" 
          description="Complete description"
        >
          <button>Save</button>
          <button>Cancel</button>
        </AdminPageHeader>
      )
      
      expect(screen.getByText('Complete Title')).toBeInTheDocument()
      expect(screen.getByText('Complete description')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Styling and Structure', () => {
    it('should apply correct CSS classes to title', () => {
      render(<AdminPageHeader title="Styled Title" />)
      
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveClass('text-4xl', 'font-black', 'text-foreground')
    })

    it('should apply correct CSS classes to description when present', () => {
      render(
        <AdminPageHeader 
          title="Title" 
          description="Description text" 
        />
      )
      
      const description = screen.getByText('Description text')
      expect(description).toHaveClass('text-lg', 'text-muted-foreground', 'mt-2')
    })

    it('should apply correct structure classes', () => {
      const { container } = render(
        <AdminPageHeader title="Title">
          <button>Action</button>
        </AdminPageHeader>
      )
      
      const mainContainer = container.firstChild
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-between', 'mb-8')
      
      const actionsContainer = screen.getByText('Action').parentElement
      expect(actionsContainer).toHaveClass('flex', 'items-center', 'gap-4')
    })

    it('should not render description paragraph when description is not provided', () => {
      render(<AdminPageHeader title="Title Only" />)
      
      expect(screen.queryByText(/test/i)).not.toBeInTheDocument() // No description
      const paragraphs = screen.queryAllByRole('paragraph')
      expect(paragraphs).toHaveLength(0)
    })

    it('should not render actions container when children are not provided', () => {
      const { container } = render(<AdminPageHeader title="Title Only" />)
      
      const flexContainers = container.querySelectorAll('.flex.items-center.gap-4')
      expect(flexContainers).toHaveLength(0)
    })
  })

  describe('Accessibility', () => {
    it('should use proper heading hierarchy', () => {
      render(<AdminPageHeader title="Main Title" />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Main Title')
    })

    it('should maintain semantic structure with description', () => {
      render(
        <AdminPageHeader 
          title="Accessible Title" 
          description="Accessible description"
        />
      )
      
      const heading = screen.getByRole('heading', { level: 1 })
      const description = screen.getByText('Accessible description')
      
      expect(heading).toBeInTheDocument()
      expect(description.tagName).toBe('P')
    })

    it('should be screen reader friendly', () => {
      render(
        <AdminPageHeader 
          title="Screen Reader Title" 
          description="Screen reader description"
        >
          <button aria-label="Save changes">Save</button>
        </AdminPageHeader>
      )
      
      expect(screen.getByLabelText('Save changes')).toBeInTheDocument()
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })
  })

  describe('Content Handling', () => {
    it('should handle long titles gracefully', () => {
      const longTitle = 'This is a very long title that might span multiple lines and should be handled gracefully by the component'
      render(<AdminPageHeader title={longTitle} />)
      
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle long descriptions gracefully', () => {
      const longDescription = 'This is a very long description that provides detailed information about the page content and should be displayed properly without breaking the layout'
      render(
        <AdminPageHeader 
          title="Title" 
          description={longDescription} 
        />
      )
      
      expect(screen.getByText(longDescription)).toBeInTheDocument()
    })

    it('should handle multiple action children', () => {
      render(
        <AdminPageHeader title="Title">
          <button>First</button>
          <button>Second</button>
          <span>Third</span>
          <div>Fourth</div>
        </AdminPageHeader>
      )
      
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
      expect(screen.getByText('Third')).toBeInTheDocument()
      expect(screen.getByText('Fourth')).toBeInTheDocument()
    })

    it('should handle empty string title', () => {
      render(<AdminPageHeader title="" />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('')
    })

    it('should handle empty string description', () => {
      render(<AdminPageHeader title="Title" description="" />)
      
      // Empty description should still render paragraph
      expect(screen.getByText('')).toBeInTheDocument()
    })
  })
})

describe('AdminPageStructure', () => {
  describe('Basic Rendering', () => {
    it('should render with children only', () => {
      render(
        <AdminPageStructure>
          <div>Page content</div>
        </AdminPageStructure>
      )
      
      expect(screen.getByText('Page content')).toBeInTheDocument()
    })

    it('should render with header and children', () => {
      render(
        <AdminPageStructure
          header={{
            title: 'Page Title',
            description: 'Page description'
          }}
        >
          <div>Main content</div>
        </AdminPageStructure>
      )
      
      expect(screen.getByText('Page Title')).toBeInTheDocument()
      expect(screen.getByText('Page description')).toBeInTheDocument()
      expect(screen.getByText('Main content')).toBeInTheDocument()
    })

    it('should render with header actions', () => {
      render(
        <AdminPageStructure
          header={{
            title: 'Action Page',
            actions: <button>Header Action</button>
          }}
        >
          <div>Content with header actions</div>
        </AdminPageStructure>
      )
      
      expect(screen.getByText('Action Page')).toBeInTheDocument()
      expect(screen.getByText('Header Action')).toBeInTheDocument()
      expect(screen.getByText('Content with header actions')).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      const { container } = render(
        <AdminPageStructure className="custom-class">
          <div>Custom styled content</div>
        </AdminPageStructure>
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
      expect(screen.getByText('Custom styled content')).toBeInTheDocument()
    })
  })

  describe('Header Configuration', () => {
    it('should pass header props to AdminPageHeader correctly', () => {
      render(
        <AdminPageStructure
          header={{
            title: 'Configured Title',
            description: 'Configured description',
            actions: (
              <>
                <button>Action 1</button>
                <button>Action 2</button>
              </>
            )
          }}
        >
          <div>Page body</div>
        </AdminPageStructure>
      )
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Configured Title')
      expect(screen.getByText('Configured description')).toBeInTheDocument()
      expect(screen.getByText('Action 1')).toBeInTheDocument()
      expect(screen.getByText('Action 2')).toBeInTheDocument()
    })

    it('should handle header with title only', () => {
      render(
        <AdminPageStructure
          header={{ title: 'Title Only' }}
        >
          <div>Content</div>
        </AdminPageStructure>
      )
      
      expect(screen.getByText('Title Only')).toBeInTheDocument()
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
    })

    it('should not render header when not provided', () => {
      render(
        <AdminPageStructure>
          <div>No header content</div>
        </AdminPageStructure>
      )
      
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
      expect(screen.getByText('No header content')).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('should apply default CSS classes', () => {
      const { container } = render(
        <AdminPageStructure>
          <div>Content</div>
        </AdminPageStructure>
      )
      
      expect(container.firstChild).toHaveClass('p-6', 'lg:p-8', 'space-y-6')
    })

    it('should merge custom className with default classes', () => {
      const { container } = render(
        <AdminPageStructure className="custom-padding custom-bg">
          <div>Content</div>
        </AdminPageStructure>
      )
      
      const element = container.firstChild
      expect(element).toHaveClass('p-6', 'lg:p-8', 'space-y-6', 'custom-padding', 'custom-bg')
    })

    it('should maintain proper spacing structure', () => {
      const { container } = render(
        <AdminPageStructure
          header={{ title: 'Spaced Page' }}
        >
          <div>First section</div>
          <div>Second section</div>
        </AdminPageStructure>
      )
      
      expect(container.firstChild).toHaveClass('space-y-6')
    })
  })

  describe('Content Organization', () => {
    it('should organize multiple children properly', () => {
      render(
        <AdminPageStructure
          header={{ title: 'Multi-section Page' }}
        >
          <section>Section 1</section>
          <section>Section 2</section>
          <div>Additional content</div>
        </AdminPageStructure>
      )
      
      expect(screen.getByText('Multi-section Page')).toBeInTheDocument()
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Section 2')).toBeInTheDocument()
      expect(screen.getByText('Additional content')).toBeInTheDocument()
    })

    it('should handle complex nested content', () => {
      render(
        <AdminPageStructure
          header={{
            title: 'Complex Page',
            description: 'With nested structure',
            actions: <button>Complex Action</button>
          }}
        >
          <div>
            <h2>Subsection</h2>
            <p>Subsection content</p>
            <div>
              <span>Nested element</span>
            </div>
          </div>
        </AdminPageStructure>
      )
      
      expect(screen.getByText('Complex Page')).toBeInTheDocument()
      expect(screen.getByText('With nested structure')).toBeInTheDocument()
      expect(screen.getByText('Complex Action')).toBeInTheDocument()
      expect(screen.getByText('Subsection')).toBeInTheDocument()
      expect(screen.getByText('Subsection content')).toBeInTheDocument()
      expect(screen.getByText('Nested element')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null children gracefully', () => {
      render(
        <AdminPageStructure>
          {null}
        </AdminPageStructure>
      )
      
      // Should render without crashing
      expect(document.body).toBeInTheDocument()
    })

    it('should handle undefined header properties', () => {
      render(
        <AdminPageStructure
          header={{
            title: 'Title',
            description: undefined,
            actions: undefined
          }}
        >
          <div>Content</div>
        </AdminPageStructure>
      )
      
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should handle empty header object', () => {
      render(
        <AdminPageStructure
          header={{} as any}
        >
          <div>Content with empty header</div>
        </AdminPageStructure>
      )
      
      // Should still render the AdminPageHeader component
      expect(screen.getByText('Content with empty header')).toBeInTheDocument()
    })

    it('should handle fragment children', () => {
      render(
        <AdminPageStructure>
          <>
            <div>Fragment child 1</div>
            <div>Fragment child 2</div>
          </>
        </AdminPageStructure>
      )
      
      expect(screen.getByText('Fragment child 1')).toBeInTheDocument()
      expect(screen.getByText('Fragment child 2')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('should work with real-world admin page structure', () => {
      render(
        <AdminPageStructure
          header={{
            title: 'User Management',
            description: 'Manage user accounts and permissions',
            actions: (
              <>
                <button>Add User</button>
                <button>Export</button>
              </>
            )
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>User list</div>
            <div>User details</div>
          </div>
          <div className="mt-8">
            <button>Save Changes</button>
          </div>
        </AdminPageStructure>
      )
      
      expect(screen.getByText('User Management')).toBeInTheDocument()
      expect(screen.getByText('Manage user accounts and permissions')).toBeInTheDocument()
      expect(screen.getByText('Add User')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
      expect(screen.getByText('User list')).toBeInTheDocument()
      expect(screen.getByText('User details')).toBeInTheDocument()
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })
  })
})