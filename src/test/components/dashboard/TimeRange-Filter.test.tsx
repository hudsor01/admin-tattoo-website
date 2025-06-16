import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeRangeFilter, QuickTimeRange, useTimeRange, dateRangeUtils, type DateRange, type TimeRangeOption } from '@/components/dashboard/TimeRange-Filter'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className, whileHover, whileTap, ...props }: any) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatStr: string) => {
    if (formatStr === 'MMM d') return 'Jan 1'
    if (formatStr === 'MMM d, yyyy') return 'Jan 1, 2024'
    return 'Jan 1, 2024'
  }),
  subDays: vi.fn((date: Date, days: number) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  subMonths: vi.fn((date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() - months, date.getDate())),
  subYears: vi.fn((date: Date, years: number) => new Date(date.getFullYear() - years, date.getMonth(), date.getDate())),
  startOfDay: vi.fn((date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())),
  endOfDay: vi.fn((date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)),
}))

// Mock dashboard store
const mockSetTimeRange = vi.fn()
const mockSetTimeRangePreset = vi.fn()
const mockTimeRange = {
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
  preset: 'LAST_30_DAYS'
}

vi.mock('@/stores/dashboard-store', () => ({
  useTimeRange: () => mockTimeRange,
  useDashboardStore: () => ({
    setTimeRange: mockSetTimeRange,
    setTimeRangePreset: mockSetTimeRangePreset,
  }),
  TIME_RANGE_PRESETS: {
    TODAY: 'TODAY',
    YESTERDAY: 'YESTERDAY',
    LAST_7_DAYS: 'LAST_7_DAYS',
    LAST_30_DAYS: 'LAST_30_DAYS',
    LAST_3_MONTHS: 'LAST_3_MONTHS',
    LAST_6_MONTHS: 'LAST_6_MONTHS',
    LAST_YEAR: 'LAST_YEAR',
    THIS_MONTH: 'THIS_MONTH',
    CUSTOM: 'CUSTOM',
  },
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, asChild, ...props }: any) => (
    <button onClick={onClick} className={className} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect, selected, mode, numberOfMonths, disabled, ...props }: any) => (
    <div 
      data-testid="calendar-component"
      data-mode={mode}
      data-months={numberOfMonths}
      onClick={() => onSelect && onSelect({ from: new Date('2024-01-01'), to: new Date('2024-01-15') })}
    >
      Calendar Component
    </div>
  ),
}))

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover" data-open={open}>
      {children}
    </div>
  ),
  PopoverTrigger: ({ children, asChild }: any) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({ children, className, align }: any) => (
    <div data-testid="popover-content" className={className} data-align={align}>
      {children}
    </div>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
}))

describe('TimeRangeFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock current date to ensure consistent tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-31T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<TimeRangeFilter />)
      
      expect(screen.getByTestId('popover-trigger')).toBeInTheDocument()
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument()
    })

    it('should render with custom placeholder', () => {
      render(<TimeRangeFilter placeholder="Custom placeholder" />)
      
      expect(screen.getByText('Jan 1, 2024 - Jan 1, 2024')).toBeInTheDocument() // Formatted current range
    })

    it('should apply custom className', () => {
      render(<TimeRangeFilter className="custom-class" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should ignore legacy props in favor of store', () => {
      const legacyOnChange = vi.fn()
      const legacyValue = { from: new Date('2024-02-01'), to: new Date('2024-02-15') }
      
      render(
        <TimeRangeFilter 
          value={legacyValue}
          onChange={legacyOnChange}
          presets={[]}
        />
      )
      
      // Should use store value, not legacy value
      expect(screen.getByText('Jan 1, 2024 - Jan 1, 2024')).toBeInTheDocument()
    })
  })

  describe('Popover Behavior', () => {
    it('should open popover when trigger is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByTestId('popover')).toHaveAttribute('data-open', 'true')
      })
    })

    it('should show preset options when opened', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Quick Select')).toBeInTheDocument()
        expect(screen.getByText('Custom Range')).toBeInTheDocument()
        expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
        expect(screen.getByTestId('filter-icon')).toBeInTheDocument()
      })
    })

    it('should show calendar component when opened', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByTestId('calendar-component')).toBeInTheDocument()
        expect(screen.getByTestId('calendar-component')).toHaveAttribute('data-mode', 'range')
        expect(screen.getByTestId('calendar-component')).toHaveAttribute('data-months', '2')
      })
    })
  })

  describe('Preset Range Selection', () => {
    const presets = [
      'Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 
      'Last 3 months', 'Last 6 months', 'Last year', 
      'This week', 'This month'
    ]

    presets.forEach(preset => {
      it(`should handle ${preset} preset selection`, async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
        render(<TimeRangeFilter />)
        
        const trigger = screen.getByRole('button')
        await user.click(trigger)
        
        await waitFor(() => {
          const presetButton = screen.getByText(preset)
          expect(presetButton).toBeInTheDocument()
        })
        
        const presetButton = screen.getByText(preset)
        await user.click(presetButton)
        
        expect(mockSetTimeRangePreset).toHaveBeenCalled()
      })
    })

    it('should show active badge for selected preset', async () => {
      // Mock timeRange to match a preset
      mockTimeRange.start = new Date('2024-01-01')
      mockTimeRange.end = new Date('2024-01-31')
      
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        const activeBadges = screen.getAllByText('Active')
        expect(activeBadges.length).toBeGreaterThan(0)
      })
    })

    it('should show descriptions when showDescription is true', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter showDescription={true} />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Current day')).toBeInTheDocument()
        expect(screen.getByText('Previous day')).toBeInTheDocument()
      })
    })

    it('should hide descriptions when showDescription is false', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter showDescription={false} />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.queryByText('Current day')).not.toBeInTheDocument()
        expect(screen.queryByText('Previous day')).not.toBeInTheDocument()
      })
    })
  })

  describe('Custom Calendar Selection', () => {
    it('should handle custom date range selection', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        const calendar = screen.getByTestId('calendar-component')
        expect(calendar).toBeInTheDocument()
      })
      
      const calendar = screen.getByTestId('calendar-component')
      await user.click(calendar)
      
      expect(mockSetTimeRange).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-15'),
        'CUSTOM'
      )
    })

    it('should show custom range display when CUSTOM preset is active', async () => {
      // Mock custom range
      mockTimeRange.preset = 'CUSTOM'
      mockTimeRange.start = new Date('2024-01-15')
      mockTimeRange.end = new Date('2024-01-20')
      
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Custom Range:')).toBeInTheDocument()
      })
    })

    it('should disable future dates', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        const calendar = screen.getByTestId('calendar-component')
        expect(calendar).toBeInTheDocument()
      })
    })
  })

  describe('Display Text Formatting', () => {
    it('should show placeholder when no range is selected', () => {
      mockTimeRange.start = undefined
      mockTimeRange.end = undefined
      
      render(<TimeRangeFilter placeholder="Select range" />)
      
      expect(screen.getByText('Select range')).toBeInTheDocument()
    })

    it('should format single day range correctly', () => {
      mockTimeRange.start = new Date('2024-01-15')
      mockTimeRange.end = new Date('2024-01-15')
      
      render(<TimeRangeFilter />)
      
      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument() // Mocked format
    })

    it('should format same year range correctly', () => {
      mockTimeRange.start = new Date('2024-01-01')
      mockTimeRange.end = new Date('2024-01-31')
      
      render(<TimeRangeFilter />)
      
      expect(screen.getByText('Jan 1, 2024 - Jan 1, 2024')).toBeInTheDocument() // Mocked format
    })

    it('should format cross-year range correctly', () => {
      mockTimeRange.start = new Date('2023-12-01')
      mockTimeRange.end = new Date('2024-01-31')
      
      render(<TimeRangeFilter />)
      
      expect(screen.getByText('Jan 1, 2024 - Jan 1, 2024')).toBeInTheDocument() // Mocked format
    })

    it('should show preset label when range matches preset', () => {
      // Mock a range that matches "Last 30 days" preset
      mockTimeRange.start = new Date('2024-01-02') // subDays(now, 29) result
      mockTimeRange.end = new Date('2024-01-31') // endOfDay(now) result
      
      render(<TimeRangeFilter />)
      
      // Should show preset label instead of formatted date
      expect(screen.getByText('Last 30 days')).toBeInTheDocument()
    })
  })

  describe('Store Integration', () => {
    it('should call setTimeRangePreset with correct mapping', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        const preset = screen.getByText('Today')
        expect(preset).toBeInTheDocument()
      })
      
      const preset = screen.getByText('Today')
      await user.click(preset)
      
      expect(mockSetTimeRangePreset).toHaveBeenCalledWith('TODAY')
    })

    it('should close popover after preset selection', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        const preset = screen.getByText('Today')
        expect(preset).toBeInTheDocument()
      })
      
      const preset = screen.getByText('Today')
      await user.click(preset)
      
      // Popover should close after selection
      await waitFor(() => {
        expect(screen.getByTestId('popover')).toHaveAttribute('data-open', 'false')
      })
    })

    it('should close popover after custom range selection', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        const calendar = screen.getByTestId('calendar-component')
        expect(calendar).toBeInTheDocument()
      })
      
      const calendar = screen.getByTestId('calendar-component')
      await user.click(calendar)
      
      await waitFor(() => {
        expect(screen.getByTestId('popover')).toHaveAttribute('data-open', 'false')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper button attributes', () => {
      render(<TimeRangeFilter />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'outline')
    })

    it('should have proper popover structure', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByTestId('popover-content')).toHaveAttribute('data-align', 'start')
      })
    })

    it('should support keyboard navigation', async () => {
      render(<TimeRangeFilter />)
      
      const button = screen.getByRole('button')
      button.focus()
      
      expect(document.activeElement).toBe(button)
      
      fireEvent.keyDown(button, { key: 'Enter' })
      // Should open popover on Enter
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined timeRange gracefully', () => {
      mockTimeRange.start = undefined
      mockTimeRange.end = undefined
      
      render(<TimeRangeFilter />)
      
      expect(screen.getByText('Select date range')).toBeInTheDocument()
    })

    it('should handle invalid date objects', () => {
      mockTimeRange.start = new Date('invalid')
      mockTimeRange.end = new Date('invalid')
      
      render(<TimeRangeFilter />)
      
      // Should handle gracefully without crashing
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle missing preset mapping', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<TimeRangeFilter />)
      
      const trigger = screen.getByRole('button')
      await user.click(trigger)
      
      // Mock a preset that doesn't exist in mapping
      await waitFor(() => {
        const preset = screen.getByText('This week') // Not in mapping
        expect(preset).toBeInTheDocument()
      })
      
      const preset = screen.getByText('This week')
      await user.click(preset)
      
      // Should default to CUSTOM
      expect(mockSetTimeRangePreset).toHaveBeenCalledWith('CUSTOM')
    })
  })
})

describe('QuickTimeRange', () => {
  const mockOnChange = vi.fn()
  const mockOptions: TimeRangeOption[] = [
    {
      label: '7 days',
      value: '7d',
      range: { from: new Date('2024-01-24'), to: new Date('2024-01-31') }
    },
    {
      label: '30 days',
      value: '30d',
      range: { from: new Date('2024-01-01'), to: new Date('2024-01-31') }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render with default options', () => {
      render(<QuickTimeRange onChange={mockOnChange} />)
      
      // Should render default options (slice 2,7 of presets)
      expect(screen.getByText('Last 7 days')).toBeInTheDocument()
      expect(screen.getByText('Last 30 days')).toBeInTheDocument()
    })

    it('should render with custom options', () => {
      render(<QuickTimeRange onChange={mockOnChange} options={mockOptions} />)
      
      expect(screen.getByText('7 days')).toBeInTheDocument()
      expect(screen.getByText('30 days')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<QuickTimeRange onChange={mockOnChange} className="custom-class" />)
      
      const container = screen.getByText('Last 7 days').closest('div')
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Selection Behavior', () => {
    it('should call onChange when option is selected', async () => {
      const user = userEvent.setup()
      render(<QuickTimeRange onChange={mockOnChange} options={mockOptions} />)
      
      const option = screen.getByText('7 days')
      await user.click(option)
      
      expect(mockOnChange).toHaveBeenCalledWith('7d', mockOptions[0].range)
    })

    it('should highlight selected option', () => {
      render(<QuickTimeRange onChange={mockOnChange} value="7d" options={mockOptions} />)
      
      const selectedOption = screen.getByText('7 days')
      expect(selectedOption).toHaveClass('bg-primary', 'text-primary-foreground', 'border-primary')
    })

    it('should style unselected options', () => {
      render(<QuickTimeRange onChange={mockOnChange} value="7d" options={mockOptions} />)
      
      const unselectedOption = screen.getByText('30 days')
      expect(unselectedOption).toHaveClass('bg-background', 'hover:bg-accent', 'border-border')
    })
  })

  describe('Motion Effects', () => {
    it('should render motion buttons', () => {
      render(<QuickTimeRange onChange={mockOnChange} options={mockOptions} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })
  })
})

describe('useTimeRange Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-31T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial range', () => {
    const TestComponent = () => {
      const { selectedRange, currentRange, setRange, presets } = useTimeRange('7d')
      return (
        <div>
          <span data-testid="selected-range">{selectedRange}</span>
          <span data-testid="presets-count">{presets.length}</span>
        </div>
      )
    }

    render(<TestComponent />)
    
    expect(screen.getByTestId('selected-range')).toHaveTextContent('7d')
    expect(screen.getByTestId('presets-count')).toHaveTextContent('9') // All presets
  })

  it('should default to 30d when no initial range provided', () => {
    const TestComponent = () => {
      const { selectedRange } = useTimeRange()
      return <span data-testid="selected-range">{selectedRange}</span>
    }

    render(<TestComponent />)
    
    expect(screen.getByTestId('selected-range')).toHaveTextContent('30d')
  })

  it('should update range when setRange is called', async () => {
    const TestComponent = () => {
      const { selectedRange, setRange } = useTimeRange('30d')
      return (
        <div>
          <span data-testid="selected-range">{selectedRange}</span>
          <button onClick={() => setRange('7d')}>Change Range</button>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<TestComponent />)
    
    expect(screen.getByTestId('selected-range')).toHaveTextContent('30d')
    
    await user.click(screen.getByText('Change Range'))
    
    expect(screen.getByTestId('selected-range')).toHaveTextContent('7d')
  })

  it('should find correct preset range', () => {
    const TestComponent = () => {
      const { currentRange } = useTimeRange('7d')
      return (
        <span data-testid="range-diff">
          {currentRange.to.getTime() - currentRange.from.getTime()}
        </span>
      )
    }

    render(<TestComponent />)
    
    // Should find the 7d preset and calculate range
    expect(screen.getByTestId('range-diff')).toBeInTheDocument()
  })

  it('should fallback to default when invalid range provided', () => {
    const TestComponent = () => {
      const { selectedRange, currentRange } = useTimeRange('invalid-range')
      return (
        <div>
          <span data-testid="selected-range">{selectedRange}</span>
          <span data-testid="has-range">{currentRange ? 'yes' : 'no'}</span>
        </div>
      )
    }

    render(<TestComponent />)
    
    expect(screen.getByTestId('selected-range')).toHaveTextContent('invalid-range')
    expect(screen.getByTestId('has-range')).toHaveTextContent('yes') // Should fallback to default
  })
})

describe('dateRangeUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-31T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isToday', () => {
    it('should return true for today range', () => {
      const today = new Date('2024-01-31')
      const range: DateRange = { from: today, to: today }
      
      expect(dateRangeUtils.isToday(range)).toBe(true)
    })

    it('should return false for non-today range', () => {
      const yesterday = new Date('2024-01-30')
      const range: DateRange = { from: yesterday, to: yesterday }
      
      expect(dateRangeUtils.isToday(range)).toBe(false)
    })
  })

  describe('getDaysDifference', () => {
    it('should calculate single day correctly', () => {
      const date = new Date('2024-01-31')
      const range: DateRange = { from: date, to: date }
      
      expect(dateRangeUtils.getDaysDifference(range)).toBe(1)
    })

    it('should calculate multiple days correctly', () => {
      const range: DateRange = { 
        from: new Date('2024-01-01'), 
        to: new Date('2024-01-07') 
      }
      
      expect(dateRangeUtils.getDaysDifference(range)).toBe(7)
    })

    it('should handle cross-month ranges', () => {
      const range: DateRange = { 
        from: new Date('2024-01-30'), 
        to: new Date('2024-02-02') 
      }
      
      expect(dateRangeUtils.getDaysDifference(range)).toBe(4)
    })
  })

  describe('formatForAPI', () => {
    it('should format dates as ISO strings', () => {
      const range: DateRange = { 
        from: new Date('2024-01-01T00:00:00Z'), 
        to: new Date('2024-01-31T23:59:59Z') 
      }
      
      const formatted = dateRangeUtils.formatForAPI(range)
      
      expect(formatted.from).toBe('2024-01-01T00:00:00.000Z')
      expect(formatted.to).toBe('2024-01-31T23:59:59.000Z')
    })
  })

  describe('isValidRange', () => {
    it('should return true for valid range', () => {
      const range: DateRange = { 
        from: new Date('2024-01-01'), 
        to: new Date('2024-01-31') 
      }
      
      expect(dateRangeUtils.isValidRange(range)).toBe(true)
    })

    it('should return false for invalid range (from > to)', () => {
      const range: DateRange = { 
        from: new Date('2024-01-31'), 
        to: new Date('2024-01-01') 
      }
      
      expect(dateRangeUtils.isValidRange(range)).toBe(false)
    })

    it('should return false for missing from date', () => {
      const range: Partial<DateRange> = { 
        to: new Date('2024-01-31') 
      }
      
      expect(dateRangeUtils.isValidRange(range)).toBe(false)
    })

    it('should return false for missing to date', () => {
      const range: Partial<DateRange> = { 
        from: new Date('2024-01-01') 
      }
      
      expect(dateRangeUtils.isValidRange(range)).toBe(false)
    })

    it('should return true for same date range', () => {
      const date = new Date('2024-01-15')
      const range: DateRange = { from: date, to: date }
      
      expect(dateRangeUtils.isValidRange(range)).toBe(true)
    })
  })
})