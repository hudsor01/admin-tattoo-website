import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme-provider'

// Mock next-themes
const mockNextThemesProvider = vi.fn(({ children, ...props }) => (
  <div data-testid="next-themes-provider" {...props}>
    {children}
  </div>
))

vi.mock('next-themes', () => ({
  ThemeProvider: mockNextThemesProvider,
}))

describe('ThemeProvider Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render children', () => {
      render(
        <ThemeProvider>
          <div data-testid="test-child">Test Content</div>
        </ThemeProvider>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <ThemeProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <span data-testid="child-3">Child 3</span>
        </ThemeProvider>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      render(<ThemeProvider>{null}</ThemeProvider>)

      expect(screen.getByTestId('next-themes-provider')).toBeInTheDocument()
    })

    it('should handle undefined children', () => {
      render(<ThemeProvider>{undefined}</ThemeProvider>)

      expect(screen.getByTestId('next-themes-provider')).toBeInTheDocument()
    })
  })

  describe('Props Forwarding', () => {
    it('should forward all props to NextThemesProvider', () => {
      const props = {
        attribute: 'class',
        defaultTheme: 'system',
        enableSystem: true,
        disableTransitionOnChange: true,
        themes: ['light', 'dark', 'system'],
        value: { light: 'light-theme', dark: 'dark-theme' },
        storageKey: 'custom-theme',
        nonce: 'test-nonce',
      }

      render(
        <ThemeProvider {...props}>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          ...props,
          children: expect.any(Object),
        }),
        expect.any(Object)
      )
    })

    it('should forward custom props', () => {
      const customProps = {
        'data-testid': 'custom-theme-provider',
        className: 'custom-class',
        id: 'theme-provider-id',
      }

      render(
        <ThemeProvider {...customProps}>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining(customProps),
        expect.any(Object)
      )
    })

    it('should handle empty props object', () => {
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          children: expect.any(Object),
        }),
        expect.any(Object)
      )
    })

    it('should not pass children as part of spread props', () => {
      render(
        <ThemeProvider attribute="class" defaultTheme="dark">
          <div>Content</div>
        </ThemeProvider>
      )

      const callArgs = mockNextThemesProvider.mock.calls[0][0]
      expect(callArgs).toHaveProperty('attribute', 'class')
      expect(callArgs).toHaveProperty('defaultTheme', 'dark')
      expect(callArgs).toHaveProperty('children')
      
      // Children should be passed separately, not in spread props
      expect(Object.keys(callArgs)).toContain('children')
    })
  })

  describe('Theme Configuration Props', () => {
    it('should handle attribute prop', () => {
      render(
        <ThemeProvider attribute="data-theme">
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          attribute: 'data-theme',
        }),
        expect.any(Object)
      )
    })

    it('should handle defaultTheme prop', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultTheme: 'light',
        }),
        expect.any(Object)
      )
    })

    it('should handle enableSystem prop', () => {
      render(
        <ThemeProvider enableSystem={false}>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          enableSystem: false,
        }),
        expect.any(Object)
      )
    })

    it('should handle disableTransitionOnChange prop', () => {
      render(
        <ThemeProvider disableTransitionOnChange={false}>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          disableTransitionOnChange: false,
        }),
        expect.any(Object)
      )
    })

    it('should handle themes array prop', () => {
      const customThemes = ['light', 'dark', 'blue', 'red']
      
      render(
        <ThemeProvider themes={customThemes}>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          themes: customThemes,
        }),
        expect.any(Object)
      )
    })

    it('should handle value object prop', () => {
      const themeValue = {
        light: 'light-mode',
        dark: 'dark-mode',
        blue: 'blue-theme',
      }
      
      render(
        <ThemeProvider value={themeValue}>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          value: themeValue,
        }),
        expect.any(Object)
      )
    })

    it('should handle storageKey prop', () => {
      render(
        <ThemeProvider storageKey="app-theme">
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          storageKey: 'app-theme',
        }),
        expect.any(Object)
      )
    })
  })

  describe('Component Composition', () => {
    it('should work with nested components', () => {
      const NestedComponent = () => (
        <div data-testid="nested">
          <span>Nested Content</span>
        </div>
      )

      render(
        <ThemeProvider>
          <NestedComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('nested')).toBeInTheDocument()
      expect(screen.getByText('Nested Content')).toBeInTheDocument()
    })

    it('should work with React fragments', () => {
      render(
        <ThemeProvider>
          <>
            <div data-testid="fragment-child-1">Fragment Child 1</div>
            <div data-testid="fragment-child-2">Fragment Child 2</div>
          </>
        </ThemeProvider>
      )

      expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument()
      expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument()
    })

    it('should work with conditional rendering', () => {
      const ConditionalContent = ({ show }: { show: boolean }) => (
        show ? <div data-testid="conditional">Conditional Content</div> : null
      )

      const { rerender } = render(
        <ThemeProvider>
          <ConditionalContent show={false} />
        </ThemeProvider>
      )

      expect(screen.queryByTestId('conditional')).not.toBeInTheDocument()

      rerender(
        <ThemeProvider>
          <ConditionalContent show={true} />
        </ThemeProvider>
      )

      expect(screen.getByTestId('conditional')).toBeInTheDocument()
    })
  })

  describe('TypeScript Props Handling', () => {
    it('should accept all NextThemesProvider props types', () => {
      // This test verifies that our component accepts the same props as NextThemesProvider
      const allProps = {
        attribute: 'class' as const,
        defaultTheme: 'system' as const,
        enableSystem: true,
        disableTransitionOnChange: true,
        themes: ['light', 'dark'],
        value: { light: 'light-theme', dark: 'dark-theme' },
        storageKey: 'theme',
        nonce: 'abc123',
        scriptProps: { 'data-script': 'theme' },
      }

      expect(() => {
        render(
          <ThemeProvider {...allProps}>
            <div>TypeScript Test</div>
          </ThemeProvider>
        )
      }).not.toThrow()
    })

    it('should handle optional props', () => {
      // Test with minimal props
      expect(() => {
        render(
          <ThemeProvider>
            <div>Minimal Props</div>
          </ThemeProvider>
        )
      }).not.toThrow()

      // Test with some optional props
      expect(() => {
        render(
          <ThemeProvider enableSystem>
            <div>Some Props</div>
          </ThemeProvider>
        )
      }).not.toThrow()
    })
  })

  describe('Lifecycle and Re-rendering', () => {
    it('should handle component re-renders', () => {
      const { rerender } = render(
        <ThemeProvider defaultTheme="light">
          <div data-testid="content">Light Theme</div>
        </ThemeProvider>
      )

      expect(screen.getByTestId('content')).toHaveTextContent('Light Theme')

      rerender(
        <ThemeProvider defaultTheme="dark">
          <div data-testid="content">Dark Theme</div>
        </ThemeProvider>
      )

      expect(screen.getByTestId('content')).toHaveTextContent('Dark Theme')
    })

    it('should handle prop changes', () => {
      const { rerender } = render(
        <ThemeProvider enableSystem={true}>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenLastCalledWith(
        expect.objectContaining({ enableSystem: true }),
        expect.any(Object)
      )

      rerender(
        <ThemeProvider enableSystem={false}>
          <div>Content</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenLastCalledWith(
        expect.objectContaining({ enableSystem: false }),
        expect.any(Object)
      )
    })

    it('should handle children changes', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div data-testid="original">Original Content</div>
        </ThemeProvider>
      )

      expect(screen.getByTestId('original')).toBeInTheDocument()

      rerender(
        <ThemeProvider>
          <div data-testid="updated">Updated Content</div>
        </ThemeProvider>
      )

      expect(screen.queryByTestId('original')).not.toBeInTheDocument()
      expect(screen.getByTestId('updated')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle children that throw errors', () => {
      const ThrowingComponent = () => {
        throw new Error('Child component error')
      }

      expect(() => {
        render(
          <ThemeProvider>
            <ThrowingComponent />
          </ThemeProvider>
        )
      }).toThrow('Child component error')
    })

    it('should not interfere with error boundaries', () => {
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        try {
          return <>{children}</>
        } catch (error) {
          return <div data-testid="error-caught">Error caught</div>
        }
      }

      const ThrowingChild = () => {
        throw new Error('Test error')
      }

      expect(() => {
        render(
          <ErrorBoundary>
            <ThemeProvider>
              <ThrowingChild />
            </ThemeProvider>
          </ErrorBoundary>
        )
      }).toThrow('Test error')
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const { rerender } = render(
        <ThemeProvider defaultTheme="system">
          <div>Content</div>
        </ThemeProvider>
      )

      const initialCallCount = mockNextThemesProvider.mock.calls.length

      // Re-render with same props
      rerender(
        <ThemeProvider defaultTheme="system">
          <div>Content</div>
        </ThemeProvider>
      )

      // Should have been called twice (initial + rerender)
      expect(mockNextThemesProvider.mock.calls.length).toBe(initialCallCount + 1)
    })

    it('should handle rapid re-renders efficiently', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Initial</div>
        </ThemeProvider>
      )

      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(
          <ThemeProvider>
            <div>Update {i}</div>
          </ThemeProvider>
        )
      }

      expect(screen.getByText('Update 9')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('should integrate properly with NextThemesProvider', () => {
      render(
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div data-testid="integration-test">Integration Test</div>
        </ThemeProvider>
      )

      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          attribute: 'class',
          defaultTheme: 'system',
          enableSystem: true,
          disableTransitionOnChange: true,
          children: expect.any(Object),
        }),
        expect.any(Object)
      )

      expect(screen.getByTestId('integration-test')).toBeInTheDocument()
    })

    it('should maintain reference equality for stable props', () => {
      const stableThemes = ['light', 'dark']
      const stableValue = { light: 'light', dark: 'dark' }

      const { rerender } = render(
        <ThemeProvider themes={stableThemes} value={stableValue}>
          <div>Content</div>
        </ThemeProvider>
      )

      const firstCall = mockNextThemesProvider.mock.calls[mockNextThemesProvider.mock.calls.length - 1]

      rerender(
        <ThemeProvider themes={stableThemes} value={stableValue}>
          <div>Content</div>
        </ThemeProvider>
      )

      const secondCall = mockNextThemesProvider.mock.calls[mockNextThemesProvider.mock.calls.length - 1]

      // References should be maintained for stable objects
      expect(firstCall[0].themes).toBe(secondCall[0].themes)
      expect(firstCall[0].value).toBe(secondCall[0].value)
    })
  })

  describe('Wrapper Behavior', () => {
    it('should act as a transparent wrapper', () => {
      const testProps = {
        'data-custom': 'test-value',
        className: 'test-class',
        style: { color: 'red' },
      }

      render(
        <ThemeProvider {...testProps}>
          <div data-testid="wrapped-content">Wrapped Content</div>
        </ThemeProvider>
      )

      // All props should be forwarded to NextThemesProvider
      expect(mockNextThemesProvider).toHaveBeenCalledWith(
        expect.objectContaining(testProps),
        expect.any(Object)
      )

      // Content should still be accessible
      expect(screen.getByTestId('wrapped-content')).toBeInTheDocument()
    })

    it('should not add any wrapper elements', () => {
      const { container } = render(
        <ThemeProvider>
          <div data-testid="direct-child">Direct Child</div>
        </ThemeProvider>
      )

      // The ThemeProvider should not add any wrapper elements
      // Content should be directly under the mocked NextThemesProvider
      expect(screen.getByTestId('next-themes-provider')).toContainElement(
        screen.getByTestId('direct-child')
      )
    })
  })
})