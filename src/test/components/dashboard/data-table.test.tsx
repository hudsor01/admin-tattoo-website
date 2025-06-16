import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable, schema } from '@/components/dashboard/data-table'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    promise: vi.fn()
  }
}))

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false
}))

// Mock DnD Kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: any) => (
    <div data-testid="dnd-context" data-on-drag-end={onDragEnd ? 'true' : 'false'}>
      {children}
    </div>
  ),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  closestCenter: vi.fn()
}))

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToVerticalAxis: vi.fn()
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => children,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false
  }),
  arrayMove: (arr: any[], oldIndex: number, newIndex: number) => {
    const newArr = [...arr]
    const [removed] = newArr.splice(oldIndex, 1)
    newArr.splice(newIndex, 0, removed)
    return newArr
  },
  verticalListSortingStrategy: vi.fn()
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => ''
    }
  }
}))

// Mock data
const mockData = [
  {
    id: 1,
    header: "Executive Summary",
    type: "Executive Summary",
    status: "Done",
    target: "2",
    limit: "3",
    reviewer: "Eddie Lake"
  },
  {
    id: 2,
    header: "Technical Approach", 
    type: "Technical Approach",
    status: "In Progress",
    target: "10",
    limit: "15",
    reviewer: "Assign reviewer"
  },
  {
    id: 3,
    header: "Capabilities Overview",
    type: "Capabilities", 
    status: "Not Started",
    target: "5",
    limit: "8",
    reviewer: "Jamik Tashpulatov"
  },
  {
    id: 4,
    header: "Project Timeline",
    type: "Design",
    status: "In Progress", 
    target: "3",
    limit: "4",
    reviewer: "Eddie Lake"
  }
]

const largeDataSet = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  header: `Section ${i + 1}`,
  type: i % 2 === 0 ? "Executive Summary" : "Technical Approach",
  status: i % 3 === 0 ? "Done" : i % 3 === 1 ? "In Progress" : "Not Started",
  target: `${i + 1}`,
  limit: `${i + 2}`,
  reviewer: i % 2 === 0 ? "Eddie Lake" : "Jamik Tashpulatov"
}))

describe('DataTable Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render with data', () => {
      render(<DataTable data={mockData} />)

      // Check if table is rendered
      expect(screen.getByRole('table')).toBeInTheDocument()

      // Check if data is displayed
      expect(screen.getByText('Executive Summary')).toBeInTheDocument()
      expect(screen.getByText('Technical Approach')).toBeInTheDocument()
      expect(screen.getByText('Capabilities Overview')).toBeInTheDocument()
      expect(screen.getByText('Project Timeline')).toBeInTheDocument()
    })

    it('should render empty state when no data', () => {
      render(<DataTable data={[]} />)

      expect(screen.getByText('No results.')).toBeInTheDocument()
    })

    it('should have correct table structure', () => {
      render(<DataTable data={mockData} />)

      // Check headers
      expect(screen.getByText('Header')).toBeInTheDocument()
      expect(screen.getByText('Section Type')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Target')).toBeInTheDocument()
      expect(screen.getByText('Limit')).toBeInTheDocument()
      expect(screen.getByText('Reviewer')).toBeInTheDocument()

      // Check for drag handle column (should have grip icons)
      const gripIcons = screen.getAllByTestId(/tabler-icon/)
      expect(gripIcons.length).toBeGreaterThan(0)
    })

    it('should have tabs interface', () => {
      render(<DataTable data={mockData} />)

      expect(screen.getByText('Outline')).toBeInTheDocument()
      expect(screen.getByText('Past Performance')).toBeInTheDocument()
      expect(screen.getByText('Key Personnel')).toBeInTheDocument()
      expect(screen.getByText('Focus Documents')).toBeInTheDocument()
    })
  })

  describe('Drag and Drop', () => {
    it('should render drag handles for each row', () => {
      render(<DataTable data={mockData} />)

      // Each row should have a drag handle
      const dragHandles = screen.getAllByText('Drag to reorder')
      expect(dragHandles).toHaveLength(mockData.length)
    })

    it('should have DnD context wrapper', () => {
      render(<DataTable data={mockData} />)

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
      // SortableContext no longer renders a wrapper div
    })

    it('should handle drag end event', () => {
      render(<DataTable data={mockData} />)

      const dndContext = screen.getByTestId('dnd-context')
      expect(dndContext).toHaveAttribute('data-on-drag-end', 'true')
    })
  })

  describe('Row Selection', () => {
    it('should have select all checkbox in header', () => {
      render(<DataTable data={mockData} />)

      const selectAllCheckbox = screen.getByLabelText('Select all')
      expect(selectAllCheckbox).toBeInTheDocument()
      expect(selectAllCheckbox).not.toBeChecked()
    })

    it('should have individual row checkboxes', () => {
      render(<DataTable data={mockData} />)

      const rowCheckboxes = screen.getAllByLabelText('Select row')
      expect(rowCheckboxes).toHaveLength(mockData.length)
    })

    it('should handle individual row selection', async () => {
      render(<DataTable data={mockData} />)

      const firstRowCheckbox = screen.getAllByLabelText('Select row')[0]
      await user.click(firstRowCheckbox)

      expect(firstRowCheckbox).toBeChecked()
    })

    it('should handle select all functionality', async () => {
      render(<DataTable data={mockData} />)

      const selectAllCheckbox = screen.getByLabelText('Select all')
      await user.click(selectAllCheckbox)

      const rowCheckboxes = screen.getAllByLabelText('Select row')
      rowCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked()
      })
    })

    it('should show selection count', async () => {
      render(<DataTable data={mockData} />)

      const firstRowCheckbox = screen.getAllByLabelText('Select row')[0]
      await user.click(firstRowCheckbox)

      expect(screen.getByText('1 of 4 row(s) selected.')).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should show pagination controls', () => {
      render(<DataTable data={largeDataSet} />)

      expect(screen.getByText(/Page \d+ of \d+/)).toBeInTheDocument()
      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument()
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument()
      expect(screen.getByLabelText('Go to first page')).toBeInTheDocument()
      expect(screen.getByLabelText('Go to last page')).toBeInTheDocument()
    })

    it('should handle page navigation', async () => {
      render(<DataTable data={largeDataSet} />)

      const nextButton = screen.getByLabelText('Go to next page')
      await user.click(nextButton)

      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })

    it('should disable navigation buttons appropriately', () => {
      render(<DataTable data={largeDataSet} />)

      // On first page, previous buttons should be disabled
      expect(screen.getByLabelText('Go to previous page')).toBeDisabled()
      expect(screen.getByLabelText('Go to first page')).toBeDisabled()
    })

    it('should handle rows per page selection', async () => {
      render(<DataTable data={largeDataSet} />)

      const rowsPerPageSelect = screen.getByLabelText('Rows per page')
      await user.click(rowsPerPageSelect)

      const option20 = screen.getByText('20')
      await user.click(option20)

      // Should now show page 1 of 2 (25 items / 20 per page)
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    })
  })

  describe('Column Visibility', () => {
    it('should have column visibility dropdown', () => {
      render(<DataTable data={mockData} />)

      expect(screen.getByText('Customize Columns')).toBeInTheDocument()
    })

    it('should show column toggle options', async () => {
      render(<DataTable data={mockData} />)

      const columnButton = screen.getByText('Customize Columns')
      await user.click(columnButton)

      // Should show toggleable columns (excluding non-hideable ones)
      expect(screen.getByText('type')).toBeInTheDocument()
      expect(screen.getByText('status')).toBeInTheDocument()
      expect(screen.getByText('target')).toBeInTheDocument()
      expect(screen.getByText('limit')).toBeInTheDocument()
      expect(screen.getByText('reviewer')).toBeInTheDocument()
    })

    it('should toggle column visibility', async () => {
      render(<DataTable data={mockData} />)

      // Open column menu
      const columnButton = screen.getByText('Customize Columns')
      await user.click(columnButton)

      // Hide the type column
      const typeToggle = screen.getByText('type')
      await user.click(typeToggle)

      // Type column header should disappear
      expect(screen.queryByText('Section Type')).not.toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should show correct status badges', () => {
      render(<DataTable data={mockData} />)

      expect(screen.getByText('Done')).toBeInTheDocument()
      expect(screen.getAllByText('In Progress')).toHaveLength(2)
      expect(screen.getByText('Not Started')).toBeInTheDocument()
    })

    it('should show check icon for done status', () => {
      render(<DataTable data={mockData} />)

      // Should have a check icon for "Done" status
      const doneCell = screen.getByText('Done').closest('td')
      expect(doneCell).not.toBeNull()
    })

    it('should show loader icon for other statuses', () => {
      render(<DataTable data={mockData} />)

      // Non-done statuses should have loader icons
      const inProgressCells = screen.getAllByText('In Progress')
      expect(inProgressCells.length).toBeGreaterThan(0)
    })
  })

  describe('Inline Editing', () => {
    it('should have editable target fields', () => {
      render(<DataTable data={mockData} />)

      const targetInputs = screen.getAllByDisplayValue(/\d+/)
      expect(targetInputs.length).toBeGreaterThan(0)
    })

    it('should handle target field submission', async () => {
      render(<DataTable data={mockData} />)

      const targetInput = screen.getByDisplayValue('2') // First row target
      await user.clear(targetInput)
      await user.type(targetInput, '5')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(toast.promise).toHaveBeenCalled()
      })
    })

    it('should handle limit field submission', async () => {
      render(<DataTable data={mockData} />)

      const limitInput = screen.getByDisplayValue('3') // First row limit
      await user.clear(limitInput)
      await user.type(limitInput, '7')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(toast.promise).toHaveBeenCalled()
      })
    })
  })

  describe('Reviewer Assignment', () => {
    it('should show assigned reviewers', () => {
      render(<DataTable data={mockData} />)

      expect(screen.getByText('Eddie Lake')).toBeInTheDocument()
      expect(screen.getByText('Jamik Tashpulatov')).toBeInTheDocument()
    })

    it('should show reviewer selection for unassigned', () => {
      render(<DataTable data={mockData} />)

      expect(screen.getByText('Assign reviewer')).toBeInTheDocument()
    })

    it('should handle reviewer assignment', async () => {
      render(<DataTable data={mockData} />)

      const assignButton = screen.getByText('Assign reviewer')
      await user.click(assignButton)

      const eddieOption = screen.getByText('Eddie Lake')
      await user.click(eddieOption)

      // After selection, dropdown should close and show selected reviewer
      expect(screen.getAllByText('Eddie Lake')).toHaveLength(2) // Original + newly assigned
    })
  })

  describe('Actions Menu', () => {
    it('should have action menus for each row', () => {
      render(<DataTable data={mockData} />)

      const actionButtons = screen.getAllByLabelText('Open menu')
      expect(actionButtons).toHaveLength(mockData.length)
    })

    it('should show action menu options', async () => {
      render(<DataTable data={mockData} />)

      const firstActionButton = screen.getAllByLabelText('Open menu')[0]
      await user.click(firstActionButton)

      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Make a copy')).toBeInTheDocument()
      expect(screen.getByText('Favorite')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  describe('Tabs Navigation', () => {
    it('should switch between tabs', async () => {
      render(<DataTable data={mockData} />)

      // Default should be outline tab
      expect(screen.getByRole('table')).toBeInTheDocument()

      // Switch to past performance
      const pastPerformanceTab = screen.getByText('Past Performance')
      await user.click(pastPerformanceTab)

      expect(screen.getByText('Past Performance Content')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('should show badge counts on tabs', () => {
      render(<DataTable data={mockData} />)

      // Past Performance and Key Personnel tabs should have badges
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should show placeholder content for non-outline tabs', async () => {
      render(<DataTable data={mockData} />)

      // Key Personnel tab
      const keyPersonnelTab = screen.getByText('Key Personnel')
      await user.click(keyPersonnelTab)
      expect(screen.getByText('Key Personnel Content')).toBeInTheDocument()

      // Focus Documents tab
      const focusDocsTab = screen.getByText('Focus Documents')
      await user.click(focusDocsTab)
      expect(screen.getByText('Focus Documents Content')).toBeInTheDocument()
    })
  })

  describe('Table Cell Viewer (Drawer)', () => {
    it('should open drawer when header is clicked', async () => {
      render(<DataTable data={mockData} />)

      const headerButton = screen.getByText('Executive Summary')
      await user.click(headerButton)

      expect(screen.getByText('Showing total visitors for the last 6 months')).toBeInTheDocument()
    })

    it('should show form fields in drawer', async () => {
      render(<DataTable data={mockData} />)

      const headerButton = screen.getByText('Technical Approach')
      await user.click(headerButton)

      expect(screen.getByLabelText('Header')).toBeInTheDocument()
      expect(screen.getByLabelText('Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Status')).toBeInTheDocument()
      expect(screen.getByLabelText('Target')).toBeInTheDocument()
      expect(screen.getByLabelText('Limit')).toBeInTheDocument()
      expect(screen.getByLabelText('Reviewer')).toBeInTheDocument()
    })

    it('should populate form with current values', async () => {
      render(<DataTable data={mockData} />)

      const headerButton = screen.getByText('Technical Approach')
      await user.click(headerButton)

      expect(screen.getByDisplayValue('Technical Approach')).toBeInTheDocument()
      expect(screen.getByDisplayValue('10')).toBeInTheDocument()
      expect(screen.getByDisplayValue('15')).toBeInTheDocument()
    })

    it('should have submit and done buttons', async () => {
      render(<DataTable data={mockData} />)

      const headerButton = screen.getByText('Executive Summary')
      await user.click(headerButton)

      expect(screen.getByText('Submit')).toBeInTheDocument()
      expect(screen.getByText('Done')).toBeInTheDocument()
    })
  })

  describe('Add Section Button', () => {
    it('should have add section button', () => {
      render(<DataTable data={mockData} />)

      expect(screen.getByText('Add Section')).toBeInTheDocument()
    })

    it('should have correct styling', () => {
      render(<DataTable data={mockData} />)

      const addButton = screen.getByText('Add Section')
      expect(addButton.closest('button')).toHaveClass('bg-brand-gradient-soft')
    })
  })

  describe('Responsive Design', () => {
    it('should show mobile select dropdown on small screens', () => {
      render(<DataTable data={mockData} />)

      // Should have a select for view switching (mobile)
      expect(screen.getByLabelText('View')).toBeInTheDocument()
    })

    it('should hide certain elements on mobile', () => {
      render(<DataTable data={mockData} />)

      // First/last page buttons should be hidden on mobile
      const firstPageButton = screen.getByLabelText('Go to first page')
      const lastPageButton = screen.getByLabelText('Go to last page')

      expect(firstPageButton).toHaveClass('hidden', 'lg:flex')
      expect(lastPageButton).toHaveClass('hidden', 'lg:flex')
    })

    it('should show short text on mobile buttons', () => {
      render(<DataTable data={mockData} />)

      // Add button should show shorter text on mobile
      const addButton = screen.getByText('Add Section')
      expect(addButton.parentElement).toContainHTML('lg:inline')

      // Column button should show "Columns" instead of "Customize Columns"
      expect(screen.getByText('Columns')).toBeInTheDocument()
    })
  })

  describe('Data Validation', () => {
    it('should validate data against schema', () => {
      const validData = mockData[0]
      const result = schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should handle invalid data gracefully', () => {
      const invalidData = { ...mockData[0], id: 'invalid' }
      const result = schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now()
      render(<DataTable data={largeDataSet} />)
      const endTime = performance.now()

      // Should render within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should paginate large datasets', () => {
      render(<DataTable data={largeDataSet} />)

      // Should only show 10 rows per page by default
      const visibleRows = screen.getAllByRole('row')
      // Header row + 10 data rows = 11 total
      expect(visibleRows).toHaveLength(11)
    })

    it('should handle rapid interactions', async () => {
      render(<DataTable data={mockData} />)

      // Rapidly click checkboxes
      const checkboxes = screen.getAllByLabelText('Select row')
      for (const checkbox of checkboxes) {
        await user.click(checkbox)
      }

      // All should be selected
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DataTable data={mockData} />)

      expect(screen.getByLabelText('Select all')).toBeInTheDocument()
      expect(screen.getAllByLabelText('Select row')).toHaveLength(mockData.length)
      expect(screen.getAllByLabelText('Open menu')).toHaveLength(mockData.length)
      expect(screen.getAllByLabelText('Drag to reorder')).toHaveLength(mockData.length)
    })

    it('should have proper keyboard navigation', async () => {
      render(<DataTable data={mockData} />)

      const firstCheckbox = screen.getAllByLabelText('Select row')[0]
      firstCheckbox.focus()

      await user.tab()
      const nextElement = document.activeElement
      expect(nextElement).not.toBe(firstCheckbox)
    })

    it('should have semantic table structure', () => {
      render(<DataTable data={mockData} />)

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()

      const rowHeaders = screen.getAllByRole('columnheader')
      expect(rowHeaders.length).toBeGreaterThan(0)

      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(mockData.length + 1) // Data rows + header
    })

    it('should have proper labels for form inputs', async () => {
      render(<DataTable data={mockData} />)

      const headerButton = screen.getByText('Executive Summary')
      await user.click(headerButton)

      expect(screen.getByLabelText('Header')).toBeInTheDocument()
      expect(screen.getByLabelText('Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Status')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      const dataWithEmpty = [{
        id: 1,
        header: "",
        type: "",
        status: "",
        target: "",
        limit: "",
        reviewer: ""
      }]

      render(<DataTable data={dataWithEmpty} />)

      // Should still render table structure
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle very long text values', () => {
      const dataWithLongText = [{
        id: 1,
        header: "This is a very long header that should wrap or truncate appropriately in the table cell to maintain layout integrity",
        type: "Executive Summary",
        status: "In Progress",
        target: "999999",
        limit: "999999",
        reviewer: "Eddie Lake with a very long name that might cause layout issues"
      }]

      render(<DataTable data={dataWithLongText} />)

      expect(screen.getByText(/This is a very long header/)).toBeInTheDocument()
    })

    it('should handle special characters in data', () => {
      const dataWithSpecialChars = [{
        id: 1,
        header: "Header with émojis 🚀 & special chars <>&\"'",
        type: "Technical Approach",
        status: "Done",
        target: "5",
        limit: "10",
        reviewer: "Eddie Lake"
      }]

      render(<DataTable data={dataWithSpecialChars} />)

      expect(screen.getByText(/Header with émojis 🚀/)).toBeInTheDocument()
    })

    it('should handle sorting with mixed data types', async () => {
      const mixedData = [
        { ...mockData[0], target: "10" },
        { ...mockData[1], target: "2" },
        { ...mockData[2], target: "100" }
      ]

      render(<DataTable data={mixedData} />)

      // Should render without errors
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })
})
