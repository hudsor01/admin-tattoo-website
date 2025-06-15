import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { 
  useDashboardStore, 
  useDashboardFilters,
  useTimeRange,
  useChartPreferences,
  useTablePreferences,
  useDashboardLayout,
  useSelectedItems,
  useRecentActions,
  useActiveView,
  TIME_RANGE_PRESETS
} from '@/stores/dashboard-store'

describe('Dashboard Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useDashboardStore.setState({
      filters: {
        timeRange: {
          start: null,
          end: null,
          preset: TIME_RANGE_PRESETS.LAST_30_DAYS,
        },
        status: [],
        tags: [],
        search: '',
      },
      chartPreferences: {
        showLegend: true,
        chartType: 'line',
        showDataLabels: false,
        colorScheme: 'default',
      },
      tablePreferences: {
        pageSize: 10,
        columnVisibility: {},
        sortBy: null,
        sortDirection: 'desc',
      },
      layout: {
        type: 'grid',
        columns: 3,
        cardSize: 'medium',
        showStats: true,
        showCharts: true,
        showRecentActivity: true,
      },
      lastRefresh: Date.now(),
      autoRefresh: false,
      refreshInterval: 300,
      activeView: 'overview',
      selectedItems: new Set(),
      recentActions: [],
    })
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      expect(result.current.filters.search).toBe('')
      expect(result.current.filters.status).toEqual([])
      expect(result.current.filters.tags).toEqual([])
      expect(result.current.filters.timeRange.preset).toBe(TIME_RANGE_PRESETS.LAST_30_DAYS)
      expect(result.current.activeView).toBe('overview')
      expect(result.current.autoRefresh).toBe(false)
      expect(result.current.selectedItems).toEqual(new Set())
    })
  })

  describe('Filter Actions', () => {
    it('should set filters correctly', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setFilters({
          search: 'test query',
          status: ['active', 'pending']
        })
      })

      expect(result.current.filters.search).toBe('test query')
      expect(result.current.filters.status).toEqual(['active', 'pending'])
    })

    it('should clear all filters', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      // Set some filters first
      act(() => {
        result.current.setFilters({
          search: 'test',
          status: ['active'],
          tags: ['important']
        })
      })

      // Then clear them
      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.filters.search).toBe('')
      expect(result.current.filters.status).toEqual([])
      expect(result.current.filters.tags).toEqual([])
    })

    it('should set search correctly', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setSearch('customer search')
      })

      expect(result.current.filters.search).toBe('customer search')
    })

    it('should clear search', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setSearch('test')
        result.current.clearSearch()
      })

      expect(result.current.filters.search).toBe('')
    })
  })

  describe('Time Range Actions', () => {
    it('should set custom time range', () => {
      const { result } = renderHook(() => useDashboardStore())
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-31')
      
      act(() => {
        result.current.setTimeRange(start, end)
      })

      expect(result.current.filters.timeRange.start).toEqual(start)
      expect(result.current.filters.timeRange.end).toEqual(end)
      expect(result.current.filters.timeRange.preset).toBe(TIME_RANGE_PRESETS.CUSTOM)
    })

    it('should set time range preset', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setTimeRangePreset(TIME_RANGE_PRESETS.LAST_7_DAYS)
      })

      expect(result.current.filters.timeRange.preset).toBe(TIME_RANGE_PRESETS.LAST_7_DAYS)
      expect(result.current.filters.timeRange.start).toBeInstanceOf(Date)
      expect(result.current.filters.timeRange.end).toBeInstanceOf(Date)
    })

    it('should clear time range', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setTimeRange(new Date(), new Date())
        result.current.clearTimeRange()
      })

      expect(result.current.filters.timeRange.start).toBeNull()
      expect(result.current.filters.timeRange.end).toBeNull()
      expect(result.current.filters.timeRange.preset).toBeNull()
    })
  })

  describe('Status Filter Actions', () => {
    it('should add status filter', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.addStatusFilter('active')
        result.current.addStatusFilter('pending')
      })

      expect(result.current.filters.status).toEqual(['active', 'pending'])
    })

    it('should remove status filter', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.addStatusFilter('active')
        result.current.addStatusFilter('pending')
        result.current.removeStatusFilter('active')
      })

      expect(result.current.filters.status).toEqual(['pending'])
    })

    it('should toggle status filter', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.toggleStatusFilter('active')
      })

      expect(result.current.filters.status).toEqual(['active'])

      act(() => {
        result.current.toggleStatusFilter('active')
      })

      expect(result.current.filters.status).toEqual([])
    })

    it('should clear status filters', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.addStatusFilter('active')
        result.current.addStatusFilter('pending')
        result.current.clearStatusFilters()
      })

      expect(result.current.filters.status).toEqual([])
    })
  })

  describe('Tag Filter Actions', () => {
    it('should add tag filter', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.addTagFilter('urgent')
        result.current.addTagFilter('important')
      })

      expect(result.current.filters.tags).toEqual(['urgent', 'important'])
    })

    it('should remove tag filter', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.addTagFilter('urgent')
        result.current.addTagFilter('important')
        result.current.removeTagFilter('urgent')
      })

      expect(result.current.filters.tags).toEqual(['important'])
    })

    it('should toggle tag filter', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.toggleTagFilter('urgent')
      })

      expect(result.current.filters.tags).toEqual(['urgent'])

      act(() => {
        result.current.toggleTagFilter('urgent')
      })

      expect(result.current.filters.tags).toEqual([])
    })

    it('should clear tag filters', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.addTagFilter('urgent')
        result.current.addTagFilter('important')
        result.current.clearTagFilters()
      })

      expect(result.current.filters.tags).toEqual([])
    })
  })

  describe('Chart Preferences', () => {
    it('should set chart preferences', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setChartPreference('chartType', 'bar')
        result.current.setChartPreference('showLegend', false)
      })

      expect(result.current.chartPreferences.chartType).toBe('bar')
      expect(result.current.chartPreferences.showLegend).toBe(false)
    })
  })

  describe('Table Preferences', () => {
    it('should set table preferences', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setTablePreference('pageSize', 25)
        result.current.setTablePreference('sortBy', 'createdAt')
      })

      expect(result.current.tablePreferences.pageSize).toBe(25)
      expect(result.current.tablePreferences.sortBy).toBe('createdAt')
    })

    it('should toggle column visibility', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.toggleColumnVisibility('email')
      })

      expect(result.current.tablePreferences.columnVisibility.email).toBe(true)

      act(() => {
        result.current.toggleColumnVisibility('email')
      })

      expect(result.current.tablePreferences.columnVisibility.email).toBe(false)
    })
  })

  describe('Layout Actions', () => {
    it('should set layout', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setLayout({
          type: 'list',
          cardSize: 'large'
        })
      })

      expect(result.current.layout.type).toBe('list')
      expect(result.current.layout.cardSize).toBe('large')
    })

    it('should set layout type', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setLayoutType('list')
      })

      expect(result.current.layout.type).toBe('list')
    })
  })

  describe('Refresh Actions', () => {
    it('should set auto refresh', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setAutoRefresh(true)
      })

      expect(result.current.autoRefresh).toBe(true)
    })

    it('should set refresh interval', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setRefreshInterval(600)
      })

      expect(result.current.refreshInterval).toBe(600)
    })

    it('should update last refresh timestamp', async () => {
      const { result } = renderHook(() => useDashboardStore())
      const initialTimestamp = result.current.lastRefresh
      
      // Add a small delay to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 1))
      
      act(() => {
        result.current.updateLastRefresh()
      })

      expect(result.current.lastRefresh).toBeGreaterThan(initialTimestamp)
    })
  })

  describe('View Actions', () => {
    it('should set active view', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.setActiveView('customers')
      })

      expect(result.current.activeView).toBe('customers')
    })
  })

  describe('Selection Actions', () => {
    it('should select and deselect items', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.selectItem('item1')
        result.current.selectItem('item2')
      })

      expect(result.current.selectedItems.has('item1')).toBe(true)
      expect(result.current.selectedItems.has('item2')).toBe(true)
      expect(result.current.selectedItems.size).toBe(2)

      act(() => {
        result.current.deselectItem('item1')
      })

      expect(result.current.selectedItems.has('item1')).toBe(false)
      expect(result.current.selectedItems.has('item2')).toBe(true)
      expect(result.current.selectedItems.size).toBe(1)
    })

    it('should toggle item selection', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.toggleItemSelection('item1')
      })

      expect(result.current.selectedItems.has('item1')).toBe(true)

      act(() => {
        result.current.toggleItemSelection('item1')
      })

      expect(result.current.selectedItems.has('item1')).toBe(false)
    })

    it('should select all items', () => {
      const { result } = renderHook(() => useDashboardStore())
      const ids = ['item1', 'item2', 'item3']
      
      act(() => {
        result.current.selectAllItems(ids)
      })

      expect(result.current.selectedItems.size).toBe(3)
      ids.forEach(id => {
        expect(result.current.selectedItems.has(id)).toBe(true)
      })
    })

    it('should clear selection', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.selectItem('item1')
        result.current.selectItem('item2')
        result.current.clearSelection()
      })

      expect(result.current.selectedItems.size).toBe(0)
    })
  })

  describe('Recent Actions', () => {
    it('should add recent action', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.addRecentAction('create', 'customer')
      })

      expect(result.current.recentActions).toHaveLength(1)
      expect(result.current.recentActions[0].action).toBe('create')
      expect(result.current.recentActions[0].resource).toBe('customer')
      expect(result.current.recentActions[0].timestamp).toBeTypeOf('number')
    })

    it('should maintain maximum 10 recent actions', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        // Add 12 actions
        for (let i = 0; i < 12; i++) {
          result.current.addRecentAction(`action${i}`, 'resource')
        }
      })

      expect(result.current.recentActions).toHaveLength(10)
      expect(result.current.recentActions[0].action).toBe('action11') // Most recent first
    })

    it('should clear recent actions', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.addRecentAction('create', 'customer')
        result.current.addRecentAction('update', 'appointment')
        result.current.clearRecentActions()
      })

      expect(result.current.recentActions).toHaveLength(0)
    })
  })

  describe('Selector Hooks', () => {
    it('should provide selector hooks for performance', () => {
      const { result: filtersResult } = renderHook(() => useDashboardFilters())
      const { result: timeRangeResult } = renderHook(() => useTimeRange())
      const { result: chartResult } = renderHook(() => useChartPreferences())
      const { result: tableResult } = renderHook(() => useTablePreferences())
      const { result: layoutResult } = renderHook(() => useDashboardLayout())
      const { result: selectedResult } = renderHook(() => useSelectedItems())
      const { result: actionsResult } = renderHook(() => useRecentActions())
      const { result: viewResult } = renderHook(() => useActiveView())

      expect(filtersResult.current).toBeDefined()
      expect(timeRangeResult.current).toBeDefined()
      expect(chartResult.current).toBeDefined()
      expect(tableResult.current).toBeDefined()
      expect(layoutResult.current).toBeDefined()
      expect(selectedResult.current).toBeInstanceOf(Set)
      expect(actionsResult.current).toBeInstanceOf(Array)
      expect(viewResult.current).toBe('overview')
    })
  })
})
