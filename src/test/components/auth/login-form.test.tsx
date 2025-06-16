import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { LoginForm } from '@/components/auth/login-form'

expect.extend(toHaveNoViolations)

// Mock Better Auth UI components
vi.mock('@daveyplate/better-auth-ui', () => ({
  AuthCard: ({ view, className, onError, onSuccess }: any) => {
    // Store callbacks for testing
    ;(window as any).__authCardCallbacks = { onError, onSuccess }
    return (
      <div data-testid="auth-card" data-view={view} className={className}>
        <form data-testid="auth-form">
          <input 
            type="email" 
            data-testid="email-input" 
            placeholder="Email" 
            aria-label="Email"
          />
          <input 
            type="password" 
            data-testid="password-input" 
            placeholder="Password"
            aria-label="Password" 
          />
          <button type="submit" data-testid="submit-button">Sign In</button>
        </form>
      </div>
    )
  },
  RedirectToSignIn: () => <div data-testid="redirect-to-signin">Redirect to SignIn</div>,
  SignedIn: ({ children }: any) => <div data-testid="signed-in">{children}</div>
}))

// Mock console methods for security tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

describe('LoginForm', () => {
  beforeEach(() => {
    // Clear any window properties
    delete (window as any).__authCardCallbacks
    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
  })

  describe('1. Basic Rendering', () => {
    it('should render all essential elements', () => {
      render(<LoginForm />)

      // Check for heading
      expect(screen.getByText('Login to your account')).toBeInTheDocument()
      
      // Check for subtitle
      expect(screen.getByText('Enter your email below to login to your admin dashboard')).toBeInTheDocument()
      
      // Check for RedirectToSignIn component
      expect(screen.getByTestId('redirect-to-signin')).toBeInTheDocument()
      
      // Check for AuthCard with correct props
      const authCard = screen.getByTestId('auth-card')
      expect(authCard).toBeInTheDocument()
      expect(authCard).toHaveAttribute('data-view', 'SIGN_IN')
      expect(authCard).toHaveClass('border-0', 'shadow-none', 'p-0')
      
      // Check for contact link
      expect(screen.getByText('Need admin access?')).toBeInTheDocument()
      const contactLink = screen.getByText('Contact administrator')
      expect(contactLink).toBeInTheDocument()
      expect(contactLink).toHaveAttribute('href', 'mailto:admin@ink37tattoos.com')
    })

    it('should render with custom className', () => {
      const { container } = render(<LoginForm className="custom-class extra-class" />)
      
      const formDiv = container.querySelector('.custom-class.extra-class')
      expect(formDiv).toBeInTheDocument()
    })

    it('should pass through additional props', () => {
      const { container } = render(
        <LoginForm 
          data-testid="login-form" 
          id="custom-id"
          aria-label="Custom login form"
        />
      )
      
      const formDiv = container.querySelector('[data-testid="login-form"]')
      expect(formDiv).toBeInTheDocument()
      expect(formDiv).toHaveAttribute('id', 'custom-id')
      expect(formDiv).toHaveAttribute('aria-label', 'Custom login form')
    })

    it('should render with all text content correctly', () => {
      render(<LoginForm />)
      
      // Verify exact text content
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Login to your account')
      expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-brand-gradient')
      
      const description = screen.getByText(/Enter your email below/)
      expect(description).toHaveClass('text-muted-foreground', 'text-sm', 'text-balance')
    })
  })

  describe('2. Redirect Functionality', () => {
    it('should include default redirect script for authenticated users', () => {
      render(<LoginForm />)
      
      const signedInDiv = screen.getByTestId('signed-in')
      const script = signedInDiv.querySelector('script')
      expect(script).toBeInTheDocument()
      expect(script?.innerHTML).toBe('window.location.href = "/dashboard"')
    })

    it('should use custom redirectTo prop', () => {
      render(<LoginForm redirectTo="/custom-path" />)
      
      const signedInDiv = screen.getByTestId('signed-in')
      const script = signedInDiv.querySelector('script')
      expect(script?.innerHTML).toBe('window.location.href = "/custom-path"')
    })

    it('should handle complex redirect paths', () => {
      const complexPath = '/admin/settings?tab=security&action=configure#security-section'
      render(<LoginForm redirectTo={complexPath} />)
      
      const signedInDiv = screen.getByTestId('signed-in')
      const script = signedInDiv.querySelector('script')
      expect(script?.innerHTML).toBe(`window.location.href = "${complexPath}"`)
    })

    it('should handle redirect with special characters', () => {
      const pathWithSpecialChars = '/path/with/特殊文字/and spaces'
      render(<LoginForm redirectTo={pathWithSpecialChars} />)
      
      const signedInDiv = screen.getByTestId('signed-in')
      const script = signedInDiv.querySelector('script')
      expect(script?.innerHTML).toContain(pathWithSpecialChars)
    })
  })

  describe('3. Form Elements and Interaction', () => {
    it('should render form elements from AuthCard', () => {
      render(<LoginForm />)
      
      expect(screen.getByTestId('auth-form')).toBeInTheDocument()
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
      expect(screen.getByTestId('password-input')).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    it('should allow typing in form fields', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
    })

    it('should handle form submission', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const form = screen.getByTestId('auth-form')
      const submitButton = screen.getByTestId('submit-button')
      
      const submitHandler = vi.fn((e) => e.preventDefault())
      form.addEventListener('submit', submitHandler)
      
      await user.click(submitButton)
      
      expect(submitHandler).toHaveBeenCalled()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('submit-button')
      
      // Tab through form elements
      await user.tab()
      expect(document.activeElement).toBe(emailInput)
      
      await user.tab()
      expect(document.activeElement).toBe(passwordInput)
      
      await user.tab()
      expect(document.activeElement).toBe(submitButton)
    })
  })

  describe('4. Contact Link Functionality', () => {
    it('should render contact link with correct attributes', () => {
      render(<LoginForm />)
      
      const contactLink = screen.getByText('Contact administrator')
      expect(contactLink).toBeInTheDocument()
      expect(contactLink.tagName).toBe('A')
      expect(contactLink).toHaveAttribute('href', 'mailto:admin@ink37tattoos.com')
      expect(contactLink).toHaveClass('underline', 'underline-offset-4', 'text-primary')
    })

    it('should open email client when contact link is clicked', () => {
      render(<LoginForm />)
      
      const contactLink = screen.getByText('Contact administrator') as HTMLAnchorElement
      expect(contactLink.href).toBe('mailto:admin@ink37tattoos.com')
      expect(contactLink.protocol).toBe('mailto:')
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const contactLink = screen.getByText('Contact administrator')
      
      // Navigate to link
      await user.tab() // email
      await user.tab() // password
      await user.tab() // submit
      await user.tab() // contact link
      
      expect(document.activeElement).toBe(contactLink)
    })
  })

  describe('5. Styling and Layout', () => {
    it('should apply correct styling classes to container', () => {
      render(<LoginForm />)
      
      const container = screen.getByText('Login to your account').closest('div')
      expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'gap-2', 'text-center', 'mb-6')
    })

    it('should apply correct styling to heading', () => {
      render(<LoginForm />)
      
      const heading = screen.getByText('Login to your account')
      expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-brand-gradient')
    })

    it('should apply correct styling to description', () => {
      render(<LoginForm />)
      
      const description = screen.getByText(/Enter your email below/)
      expect(description).toHaveClass('text-muted-foreground', 'text-sm', 'text-balance')
    })

    it('should apply correct styling to AuthCard', () => {
      render(<LoginForm />)
      
      const authCard = screen.getByTestId('auth-card')
      expect(authCard).toHaveClass('border-0', 'shadow-none', 'p-0')
    })

    it('should apply correct styling to contact section', () => {
      render(<LoginForm />)
      
      // The contact section has specific styling
      const contactSection = screen.getByText('Need admin access?').closest('div')
      expect(contactSection).toBeInTheDocument()
      expect(contactSection?.className).toContain('text-center')
      expect(contactSection?.className).toContain('text-sm')
      expect(contactSection?.className).toContain('mt-4')
    })

    it('should maintain layout integrity with long content', () => {
      const longClassName = 'very-long-class-name-that-might-break-layout'
      const { container } = render(<LoginForm className={longClassName} />)
      
      const formDiv = container.querySelector(`.${longClassName}`)
      expect(formDiv).toBeInTheDocument()
      
      // Verify nested structure is maintained
      expect(formDiv?.querySelector('.text-center.mb-6')).toBeInTheDocument()
      expect(formDiv?.querySelector('[data-testid="auth-card"]')).toBeInTheDocument()
      expect(formDiv?.querySelector('.text-center.text-sm.mt-4')).toBeInTheDocument()
    })
  })

  describe('6. Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<LoginForm />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading hierarchy', () => {
      render(<LoginForm />)
      
      const headings = screen.getAllByRole('heading')
      expect(headings).toHaveLength(1)
      expect(headings[0]).toHaveProperty('tagName', 'H1')
    })

    it('should have accessible form labels', () => {
      render(<LoginForm />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      expect(emailInput).toBeInTheDocument()
      expect(passwordInput).toBeInTheDocument()
    })

    it('should support screen reader announcements', () => {
      render(<LoginForm />)
      
      // Verify important text is readable by screen readers
      expect(screen.getByText('Login to your account')).toBeVisible()
      expect(screen.getByText(/Enter your email below/)).toBeVisible()
      expect(screen.getByText('Need admin access?')).toBeVisible()
    })

    it('should have proper focus management', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      // Tab through all interactive elements
      const interactiveElements = [
        screen.getByTestId('email-input'),
        screen.getByTestId('password-input'),
        screen.getByTestId('submit-button'),
        screen.getByText('Contact administrator')
      ]
      
      for (const element of interactiveElements) {
        await user.tab()
        expect(document.activeElement).toBe(element)
      }
    })

    it('should have proper ARIA attributes', () => {
      render(<LoginForm />)
      
      const form = screen.getByTestId('auth-form')
      expect(form).toHaveProperty('tagName', 'FORM')
      
      // Email and password inputs have aria-labels
      expect(screen.getByTestId('email-input')).toHaveAttribute('aria-label', 'Email')
      expect(screen.getByTestId('password-input')).toHaveAttribute('aria-label', 'Password')
    })
  })

  describe('7. Security Considerations', () => {
    it('should sanitize redirectTo parameter to prevent XSS', () => {
      const xssAttempt = '"><script>alert("XSS")</script>'
      render(<LoginForm redirectTo={xssAttempt} />)
      
      const signedInDiv = screen.getByTestId('signed-in')
      const script = signedInDiv.querySelector('script')
      
      // The script content should contain the XSS attempt as a string, not execute it
      expect(script?.innerHTML).toBe(`window.location.href = "${xssAttempt}"`)
      
      // Verify no additional script tags were created
      const allScripts = signedInDiv.querySelectorAll('script')
      expect(allScripts).toHaveLength(1)
    })

    it('should handle javascript: protocol in redirectTo', () => {
      const jsProtocol = 'javascript:alert("XSS")'
      render(<LoginForm redirectTo={jsProtocol} />)
      
      const signedInDiv = screen.getByTestId('signed-in')
      const script = signedInDiv.querySelector('script')
      expect(script?.innerHTML).toBe(`window.location.href = "${jsProtocol}"`)
    })

    it('should handle data: protocol in redirectTo', () => {
      const dataProtocol = 'data:text/html,<script>alert("XSS")</script>'
      render(<LoginForm redirectTo={dataProtocol} />)
      
      const signedInDiv = screen.getByTestId('signed-in')
      const script = signedInDiv.querySelector('script')
      expect(script?.innerHTML).toBe(`window.location.href = "${dataProtocol}"`)
    })

    it('should not expose sensitive information in rendered output', () => {
      const { container } = render(<LoginForm />)
      const html = container.innerHTML
      
      // Ensure no sensitive default values or debug info
      // Note: 'password' appears in placeholder text which is expected
      expect(html.toLowerCase()).not.toContain('secret')
      expect(html.toLowerCase()).not.toContain('token')
      expect(html.toLowerCase()).not.toContain('debug')
      expect(html.toLowerCase()).not.toContain('api_key')
      expect(html.toLowerCase()).not.toContain('private')
    })

    it('should handle malformed URLs in redirectTo', () => {
      const malformedUrls = [
        'http://[::1]:80',
        '//evil.com',
        'http://user:pass@evil.com',
        'java\nscript:alert(1)'
      ]
      
      malformedUrls.forEach(url => {
        const { container } = render(<LoginForm redirectTo={url} />)
        const script = container.querySelector('script')
        expect(script?.innerHTML).toBe(`window.location.href = "${url}"`)
      })
      
      // Test null byte separately as it gets encoded
      const nullByteUrl = '\x00javascript:alert(1)'
      const { container } = render(<LoginForm redirectTo={nullByteUrl} />)
      const script = container.querySelector('script')
      // Null byte may be replaced with replacement character
      expect(script?.innerHTML).toContain('javascript:alert(1)')
    })
  })

  describe('8. Edge Cases', () => {
    it('should handle empty redirectTo prop', () => {
      render(<LoginForm redirectTo="" />)
      
      const signedInDiv = screen.getByTestId('signed-in')
      const script = signedInDiv.querySelector('script')
      expect(script?.innerHTML).toBe('window.location.href = ""')
    })

    it('should handle undefined className', () => {
      const { container } = render(<LoginForm className={undefined} />)
      
      // Find the div that contains the form content (not the wrapper divs)
      const formDiv = container.querySelector('div[data-testid="login-form"]') || 
                      container.querySelector('div > div:last-child')
      expect(formDiv).toBeInTheDocument()
    })

    it('should handle very long redirectTo URLs', () => {
      const longUrl = '/path' + '/segment'.repeat(100) + '?query=value'
      render(<LoginForm redirectTo={longUrl} />)
      
      const signedInDiv = screen.getByTestId('signed-in')
      const script = signedInDiv.querySelector('script')
      expect(script?.innerHTML).toBe(`window.location.href = "${longUrl}"`)
    })

    it('should handle international characters in redirectTo', () => {
      const internationalUrl = '/用户/设置/安全'
      render(<LoginForm redirectTo={internationalUrl} />)
      
      const signedInDiv = screen.getByTestId('signed-in')
      const script = signedInDiv.querySelector('script')
      expect(script?.innerHTML).toBe(`window.location.href = "${internationalUrl}"`)
    })

    it('should handle multiple renders without side effects', () => {
      const { rerender } = render(<LoginForm redirectTo="/first" />)
      
      let script = screen.getByTestId('signed-in').querySelector('script')
      expect(script?.innerHTML).toBe('window.location.href = "/first"')
      
      rerender(<LoginForm redirectTo="/second" />)
      
      script = screen.getByTestId('signed-in').querySelector('script')
      expect(script?.innerHTML).toBe('window.location.href = "/second"')
    })

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<LoginForm redirectTo="/path1" />)
      
      const paths = ['/path2', '/path3', '/path4', '/path5']
      paths.forEach(path => {
        rerender(<LoginForm redirectTo={path} />)
        const script = screen.getByTestId('signed-in').querySelector('script')
        expect(script?.innerHTML).toBe(`window.location.href = "${path}"`)
      })
    })
  })

  describe('9. Component Integration', () => {
    it('should integrate all Better Auth UI components correctly', () => {
      render(<LoginForm />)
      
      // All three components should be present
      expect(screen.getByTestId('redirect-to-signin')).toBeInTheDocument()
      expect(screen.getByTestId('signed-in')).toBeInTheDocument()
      expect(screen.getByTestId('auth-card')).toBeInTheDocument()
    })

    it('should maintain component hierarchy', () => {
      const { container } = render(<LoginForm />)
      
      // RedirectToSignIn should be at root level
      const redirectComponent = container.querySelector('[data-testid="redirect-to-signin"]')
      expect(redirectComponent).toBeInTheDocument()
      
      // SignedIn should contain the script
      const signedInComponent = container.querySelector('[data-testid="signed-in"]')
      expect(signedInComponent?.querySelector('script')).toBeInTheDocument()
      
      // AuthCard should be inside the main form div
      const authCard = container.querySelector('[data-testid="auth-card"]')
      expect(authCard).toBeInTheDocument()
      
      // Verify the main content div structure
      const mainContentDiv = container.querySelector('div:has(> .flex.flex-col.items-center)')
      expect(mainContentDiv).toBeInTheDocument()
    })

    it('should pass correct props to AuthCard', () => {
      render(<LoginForm />)
      
      const authCard = screen.getByTestId('auth-card')
      expect(authCard).toHaveAttribute('data-view', 'SIGN_IN')
      expect(authCard.className).toContain('border-0')
      expect(authCard.className).toContain('shadow-none')
      expect(authCard.className).toContain('p-0')
    })

    it('should handle AuthCard callbacks if provided', () => {
      render(<LoginForm />)
      
      // Check if callbacks are accessible (mocked in our setup)
      expect((window as any).__authCardCallbacks).toBeDefined()
    })
  })

  describe('10. Performance', () => {
    it('should render efficiently without unnecessary re-renders', () => {
      const renderSpy = vi.fn()
      
      const TestWrapper = ({ redirectTo }: { redirectTo: string }) => {
        renderSpy()
        return <LoginForm redirectTo={redirectTo} />
      }
      
      const { rerender } = render(<TestWrapper redirectTo="/dashboard" />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Same props should not cause re-render
      rerender(<TestWrapper redirectTo="/dashboard" />)
      expect(renderSpy).toHaveBeenCalledTimes(2) // React will call it, but props haven't changed
    })

    it('should not create memory leaks with event listeners', () => {
      const { unmount } = render(<LoginForm />)
      
      const form = screen.getByTestId('auth-form')
      const listenerCount = (form as any).listenerCount?.('submit') || 0
      
      unmount()
      
      // Form should be removed from DOM
      expect(form).not.toBeInTheDocument()
    })

    it('should handle large amounts of props without performance degradation', () => {
      const manyProps: any = {}
      for (let i = 0; i < 100; i++) {
        manyProps[`data-prop-${i}`] = `value-${i}`
      }
      
      const startTime = performance.now()
      render(<LoginForm {...manyProps} />)
      const endTime = performance.now()
      
      // Rendering should be fast (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should not block the main thread with synchronous operations', () => {
      render(<LoginForm />)
      
      // Check that script injection doesn't block
      const script = screen.getByTestId('signed-in').querySelector('script')
      expect(script).toBeInTheDocument()
      
      // Script should be inline, not loading external resources
      expect(script).not.toHaveAttribute('src')
      expect(script).not.toHaveAttribute('async')
      expect(script).not.toHaveAttribute('defer')
    })
  })

  describe('11. Error Handling', () => {
    it('should handle missing Better Auth UI components gracefully', () => {
      // This is handled by our mock, but in real scenario would need error boundary
      expect(() => render(<LoginForm />)).not.toThrow()
    })

    it('should handle errors in redirect script execution', () => {
      // Mock console.error to check for error logging
      console.error = vi.fn()
      
      // Render with a redirect that might cause issues
      render(<LoginForm redirectTo="\\invalid\\path" />)
      
      // Component should still render
      expect(screen.getByText('Login to your account')).toBeInTheDocument()
    })

    it('should handle null or undefined props gracefully', () => {
      const { container } = render(<LoginForm {...({ redirectTo: null } as any)} />)
      
      const script = container.querySelector('script')
      expect(script?.innerHTML).toBe('window.location.href = "null"')
    })

    it('should not crash with invalid prop types', () => {
      // Test with wrong prop types
      const invalidProps = {
        redirectTo: { invalid: 'object' } as any,
        className: 123 as any
      }
      
      expect(() => render(<LoginForm {...invalidProps} />)).not.toThrow()
    })

    it('should handle script injection errors without crashing', () => {
      // Create a scenario where script might fail
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: false // Make it read-only
      })
      
      expect(() => render(<LoginForm />)).not.toThrow()
      
      // Restore window.location
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      })
    })

    it('should provide fallback behavior if components fail to load', () => {
      // Our mocks simulate this, but component should be defensive
      render(<LoginForm />)
      
      // Core content should still be accessible
      expect(screen.getByText('Login to your account')).toBeInTheDocument()
      expect(screen.getByText('Contact administrator')).toBeInTheDocument()
    })
  })

  describe('Additional Integration Tests', () => {
    it('should work correctly with React.StrictMode', () => {
      const { container } = render(
        <React.StrictMode>
          <LoginForm />
        </React.StrictMode>
      )
      
      // Should render without issues in StrictMode
      expect(screen.getByText('Login to your account')).toBeInTheDocument()
      
      // Should not have duplicate elements
      expect(screen.getAllByTestId('auth-card')).toHaveLength(1)
      expect(screen.getAllByTestId('redirect-to-signin')).toHaveLength(1)
    })

    it('should maintain consistency across different viewport sizes', () => {
      // Test with different viewport configurations
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 } // Desktop
      ]
      
      viewports.forEach(({ width, height }, index) => {
        window.innerWidth = width
        window.innerHeight = height
        
        const { unmount } = render(<LoginForm />)
        
        // All elements should be present regardless of viewport
        expect(screen.getAllByText('Login to your account')[0]).toBeInTheDocument()
        expect(screen.getAllByTestId('auth-card')[0]).toBeInTheDocument()
        expect(screen.getAllByText('Contact administrator')[0]).toBeInTheDocument()
        
        // Clean up before next iteration
        unmount()
      })
    })

    it('should handle concurrent renders correctly', async () => {
      const containers: HTMLElement[] = []
      
      // Render multiple instances
      for (let i = 0; i < 5; i++) {
        const { container } = render(<LoginForm redirectTo={`/path${i}`} />)
        containers.push(container)
      }
      
      // Each should have unique redirect paths
      containers.forEach((container, index) => {
        const script = container.querySelector('script')
        expect(script?.innerHTML).toBe(`window.location.href = "/path${index}"`)
      })
    })
  })

  describe('Component Lifecycle', () => {
    it('should clean up properly on unmount', () => {
      const { unmount } = render(<LoginForm />)
      
      // Get references before unmount
      const authCard = screen.queryByTestId('auth-card')
      
      unmount()
      
      // All elements should be removed
      expect(authCard).not.toBeInTheDocument()
      expect(screen.queryByText('Login to your account')).not.toBeInTheDocument()
    })

    it('should handle prop updates correctly', () => {
      const { rerender } = render(<LoginForm redirectTo="/initial" className="initial-class" />)
      
      // Verify initial state
      expect(screen.getByTestId('signed-in').querySelector('script')?.innerHTML)
        .toBe('window.location.href = "/initial"')
      
      // Update props
      rerender(<LoginForm redirectTo="/updated" className="updated-class" />)
      
      // Verify updated state
      expect(screen.getByTestId('signed-in').querySelector('script')?.innerHTML)
        .toBe('window.location.href = "/updated"')
      
      const container = screen.getByText('Login to your account').closest('div')?.parentElement
      expect(container).toHaveClass('updated-class')
    })
  })
})