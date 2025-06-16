import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utils - cn Function', () => {
  describe('Basic Functionality', () => {
    it('should combine class names correctly', () => {
      const result = cn('foo', 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle single class name', () => {
      const result = cn('single-class')
      expect(result).toBe('single-class')
    })

    it('should handle no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle empty strings', () => {
      const result = cn('', 'foo', '', 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle undefined values', () => {
      const result = cn(undefined, 'foo', undefined, 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle null values', () => {
      const result = cn(null, 'foo', null, 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle false values', () => {
      const result = cn(false, 'foo', false, 'bar')
      expect(result).toBe('foo bar')
    })
  })

  describe('Conditional Classes', () => {
    it('should handle conditional classes with boolean conditions', () => {
      const isActive = true
      const isDisabled = false
      
      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled'
      )
      
      expect(result).toBe('base-class active')
    })

    it('should handle object-style conditional classes', () => {
      const result = cn({
        'base-class': true,
        'active': true,
        'disabled': false,
        'hidden': false
      })
      
      expect(result).toBe('base-class active')
    })

    it('should handle mixed conditional and string classes', () => {
      const isVisible = true
      const hasError = false
      
      const result = cn(
        'flex items-center',
        isVisible && 'opacity-100',
        hasError && 'text-red-500',
        'transition-all'
      )
      
      expect(result).toBe('flex items-center opacity-100 transition-all')
    })
  })

  describe('Array Inputs', () => {
    it('should handle array of class names', () => {
      const result = cn(['foo', 'bar', 'baz'])
      expect(result).toBe('foo bar baz')
    })

    it('should handle nested arrays', () => {
      const result = cn(['foo', ['bar', 'baz']], 'qux')
      expect(result).toBe('foo bar baz qux')
    })

    it('should handle arrays with conditional classes', () => {
      const result = cn(['foo', false && 'bar', 'baz'])
      expect(result).toBe('foo baz')
    })
  })

  describe('Tailwind CSS Integration', () => {
    it('should merge conflicting Tailwind classes correctly', () => {
      // twMerge should handle conflicting classes by keeping the last one
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toBe('py-1 px-4')
    })

    it('should handle responsive classes', () => {
      const result = cn('text-sm', 'md:text-base', 'lg:text-lg')
      expect(result).toBe('text-sm md:text-base lg:text-lg')
    })

    it('should handle state variants', () => {
      const result = cn('bg-blue-500', 'hover:bg-blue-600', 'focus:bg-blue-700')
      expect(result).toBe('bg-blue-500 hover:bg-blue-600 focus:bg-blue-700')
    })

    it('should merge conflicting margin/padding classes', () => {
      const result = cn('p-2', 'px-4', 'py-6')
      expect(result).toBe('px-4 py-6')
    })

    it('should merge conflicting color classes', () => {
      const result = cn('text-red-500', 'text-blue-500')
      expect(result).toBe('text-blue-500')
    })

    it('should handle complex Tailwind utility combinations', () => {
      const result = cn(
        'flex items-center justify-center',
        'w-full h-full',
        'bg-white border border-gray-200',
        'rounded-lg shadow-sm',
        'hover:shadow-md transition-shadow'
      )
      
      expect(result).toContain('flex')
      expect(result).toContain('items-center')
      expect(result).toContain('justify-center')
      expect(result).toContain('w-full')
      expect(result).toContain('h-full')
      expect(result).toContain('bg-white')
      expect(result).toContain('border')
      expect(result).toContain('border-gray-200')
      expect(result).toContain('rounded-lg')
      expect(result).toContain('shadow-sm')
      expect(result).toContain('hover:shadow-md')
      expect(result).toContain('transition-shadow')
    })
  })

  describe('Real-world Usage Patterns', () => {
    it('should handle button variant patterns', () => {
      const variant = 'primary'
      const size = 'md'
      const disabled = false
      
      const result = cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive'
        },
        {
          'h-10 px-4 py-2': size === 'md',
          'h-9 px-3': size === 'sm',
          'h-11 px-8': size === 'lg'
        },
        disabled && 'pointer-events-none opacity-50'
      )
      
      expect(result).toContain('inline-flex')
      expect(result).toContain('bg-primary')
      expect(result).toContain('h-10')
      expect(result).not.toContain('opacity-50')
    })

    it('should handle card component patterns', () => {
      const isInteractive = true
      const hasBorder = true
      const elevation = 'md'
      
      const result = cn(
        'rounded-lg bg-card text-card-foreground',
        hasBorder && 'border',
        {
          'shadow-sm': elevation === 'sm',
          'shadow-md': elevation === 'md',
          'shadow-lg': elevation === 'lg'
        },
        isInteractive && 'cursor-pointer hover:shadow-lg transition-shadow'
      )
      
      expect(result).toContain('rounded-lg')
      expect(result).toContain('bg-card')
      expect(result).toContain('border')
      expect(result).toContain('shadow-md')
      expect(result).toContain('cursor-pointer')
    })

    it('should handle form input patterns', () => {
      const hasError = false
      const isDisabled = false
      const size = 'default'
      
      const result = cn(
        'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        {
          'h-10': size === 'default',
          'h-9': size === 'sm',
          'h-11': size === 'lg'
        },
        hasError && 'border-destructive',
        isDisabled && 'cursor-not-allowed opacity-50'
      )
      
      expect(result).toContain('flex')
      expect(result).toContain('w-full')
      expect(result).toContain('h-10')
      expect(result).not.toContain('border-destructive')
      expect(result).not.toContain('opacity-50')
    })
  })

  describe('Edge Cases', () => {
    it('should handle deeply nested conditional logic', () => {
      const state = { isActive: true, hasError: false, isLoading: false }
      
      const result = cn(
        'base',
        state.isActive && !state.hasError && 'active-success',
        state.isActive && state.hasError && 'active-error',
        !state.isActive && !state.isLoading && 'inactive',
        state.isLoading && 'loading'
      )
      
      expect(result).toBe('base active-success')
    })

    it('should handle very long class name strings', () => {
      const longClassName = 'very-long-class-name-that-goes-on-and-on-and-should-still-work-correctly'
      const result = cn('base', longClassName, 'end')
      expect(result).toBe(`base ${longClassName} end`)
    })

    it('should handle special characters in class names', () => {
      const result = cn('w-1/2', 'h-[50px]', 'before:content-[""]')
      expect(result).toContain('w-1/2')
      expect(result).toContain('h-[50px]')
      expect(result).toContain('before:content-[""]')
    })

    it('should handle function calls as class values', () => {
      const getClass = (active: boolean) => active ? 'is-active' : 'is-inactive'
      const result = cn('base', getClass(true))
      expect(result).toBe('base is-active')
    })

    it('should handle template literals', () => {
      const variant = 'primary'
      const result = cn('base', `variant-${variant}`)
      expect(result).toBe('base variant-primary')
    })
  })

  describe('Performance Considerations', () => {
    it('should handle many class arguments efficiently', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`)
      const result = cn(...classes)
      
      // Should contain all classes
      classes.forEach(cls => {
        expect(result).toContain(cls)
      })
    })

    it('should handle repeated calls with same arguments', () => {
      const args = ['flex', 'items-center', 'justify-center']
      
      const result1 = cn(...args)
      const result2 = cn(...args)
      
      expect(result1).toBe(result2)
      expect(result1).toBe('flex items-center justify-center')
    })
  })

  describe('TypeScript Integration', () => {
    it('should work with string literals', () => {
      const result = cn('flex' as const, 'items-center' as const)
      expect(result).toBe('flex items-center')
    })

    it('should work with union types', () => {
      type ButtonVariant = 'primary' | 'secondary' | 'outline'
      const variant: ButtonVariant = 'primary'
      
      const result = cn(
        'base-button',
        variant === 'primary' && 'bg-primary',
        variant === 'secondary' && 'bg-secondary',
        variant === 'outline' && 'border'
      )
      
      expect(result).toBe('base-button bg-primary')
    })
  })

  describe('Integration with clsx and twMerge', () => {
    it('should properly integrate clsx functionality', () => {
      // Test clsx-specific behavior
      const result = cn(
        'foo',
        { bar: true, baz: false },
        ['qux', { quux: true }]
      )
      
      expect(result).toContain('foo')
      expect(result).toContain('bar')
      expect(result).not.toContain('baz')
      expect(result).toContain('qux')
      expect(result).toContain('quux')
    })

    it('should properly integrate twMerge functionality', () => {
      // Test twMerge-specific behavior with Tailwind conflicts
      const result = cn(
        'p-4 bg-red-500',
        'p-2',  // Should override p-4
        'bg-blue-500'  // Should override bg-red-500
      )
      
      expect(result).not.toContain('p-4')
      expect(result).toContain('p-2')
      expect(result).not.toContain('bg-red-500')
      expect(result).toContain('bg-blue-500')
    })
  })
})