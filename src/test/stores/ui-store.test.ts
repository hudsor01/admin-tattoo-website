import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { 
  useUIStore,
  useSidebar,
  useModals,
  useLoading,
  useSearch,
  useTimeRange,
  usePreferences
} from '@/stores/ui-store'

describe('UI Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useUIStore.setState({
      sidebar: {
        open: true,
        collapsed: false,
      },
      modals: {
        mediaUpload: { open: false },
        customerEdit: { open: false },
        appointmentCreate: { open: false },
        appointmentEdit: { open: false },
      },
      loading: {
        global: false,
        page: false,
        component: {},
      },
      search: {
        global: '',
        customers: '',
        appointments: '',
        media: '',
      },
      timeRange: {
        start: null,
        end: null,
        preset: null,
      },
      preferences: {
        theme: 'system',
        density: 'comfortable',
        tablePageSize: 10,
        dashboardLayout: 'grid',
      },
    })
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useUIStore())
      
      expect(result.current.sidebar.open).toBe(true)
      expect(result.current.sidebar.collapsed).toBe(false)
      expect(result.current.modals.mediaUpload.open).toBe(false)
      expect(result.current.loading.global).toBe(false)
      expect(result.current.search.global).toBe('')
      expect(result.current.preferences.theme).toBe('system')
    })
  })

  describe('Sidebar Actions', () => {
    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.sidebar.open).toBe(false)

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.sidebar.open).toBe(true)
    })

    it('should set sidebar open state', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setSidebarOpen(false)
      })

      expect(result.current.sidebar.open).toBe(false)

      act(() => {
        result.current.setSidebarOpen(true)
      })

      expect(result.current.sidebar.open).toBe(true)
    })

    it('should set sidebar collapsed state', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setSidebarCollapsed(true)
      })

      expect(result.current.sidebar.collapsed).toBe(true)

      act(() => {
        result.current.setSidebarCollapsed(false)
      })

      expect(result.current.sidebar.collapsed).toBe(false)
    })
  })

  describe('Modal Actions', () => {
    it('should open modal with data', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.openModal('mediaUpload', { type: 'photo' })
      })

      expect(result.current.modals.mediaUpload.open).toBe(true)
      expect(result.current.modals.mediaUpload.type).toBe('photo')
    })

    it('should open modal without data', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.openModal('customerEdit')
      })

      expect(result.current.modals.customerEdit.open).toBe(true)
    })

    it('should close specific modal', () => {
      const { result } = renderHook(() => useUIStore())
      
      // Open modal first
      act(() => {
        result.current.openModal('mediaUpload', { type: 'video' })
      })

      expect(result.current.modals.mediaUpload.open).toBe(true)

      // Then close it
      act(() => {
        result.current.closeModal('mediaUpload')
      })

      expect(result.current.modals.mediaUpload.open).toBe(false)
      expect(result.current.modals.mediaUpload.type).toBeUndefined()
    })

    it('should close all modals', () => {
      const { result } = renderHook(() => useUIStore())
      
      // Open multiple modals
      act(() => {
        result.current.openModal('mediaUpload', { type: 'photo' })
        result.current.openModal('customerEdit', { customerId: '123' })
      })

      expect(result.current.modals.mediaUpload.open).toBe(true)
      expect(result.current.modals.customerEdit.open).toBe(true)

      // Close all
      act(() => {
        result.current.closeAllModals()
      })

      expect(result.current.modals.mediaUpload.open).toBe(false)
      expect(result.current.modals.customerEdit.open).toBe(false)
    })
  })

  describe('Loading Actions', () => {
    it('should set global loading state', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setGlobalLoading(true)
      })

      expect(result.current.loading.global).toBe(true)

      act(() => {
        result.current.setGlobalLoading(false)
      })

      expect(result.current.loading.global).toBe(false)
    })

    it('should set page loading state', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setPageLoading(true)
      })

      expect(result.current.loading.page).toBe(true)

      act(() => {
        result.current.setPageLoading(false)
      })

      expect(result.current.loading.page).toBe(false)
    })

    it('should set component loading state', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setComponentLoading('customerList', true)
        result.current.setComponentLoading('appointmentForm', true)
      })

      expect(result.current.loading.component.customerList).toBe(true)
      expect(result.current.loading.component.appointmentForm).toBe(true)

      act(() => {
        result.current.setComponentLoading('customerList', false)
      })

      expect(result.current.loading.component.customerList).toBe(false)
      expect(result.current.loading.component.appointmentForm).toBe(true)
    })
  })

  describe('Search Actions', () => {
    it('should set global search', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setGlobalSearch('test query')
      })

      expect(result.current.search.global).toBe('test query')
    })

    it('should set page-specific search', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setPageSearch('customers', 'john doe')
        result.current.setPageSearch('appointments', 'consultation')
      })

      expect(result.current.search.customers).toBe('john doe')
      expect(result.current.search.appointments).toBe('consultation')
    })

    it('should clear specific page search', () => {
      const { result } = renderHook(() => useUIStore())
      
      // Set searches first
      act(() => {
        result.current.setPageSearch('customers', 'john doe')
        result.current.setPageSearch('appointments', 'consultation')
      })

      // Clear specific page
      act(() => {
        result.current.clearSearch('customers')
      })

      expect(result.current.search.customers).toBe('')
      expect(result.current.search.appointments).toBe('consultation')
    })

    it('should clear all searches', () => {
      const { result } = renderHook(() => useUIStore())
      
      // Set searches first
      act(() => {
        result.current.setGlobalSearch('global query')
        result.current.setPageSearch('customers', 'john doe')
        result.current.setPageSearch('appointments', 'consultation')
      })

      // Clear all
      act(() => {
        result.current.clearSearch()
      })

      expect(result.current.search.global).toBe('')
      expect(result.current.search.customers).toBe('')
      expect(result.current.search.appointments).toBe('')
      expect(result.current.search.media).toBe('')
    })
  })

  describe('Time Range Actions', () => {
    it('should set time range', () => {
      const { result } = renderHook(() => useUIStore())
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-31')
      
      act(() => {
        result.current.setTimeRange(start, end, 'custom')
      })

      expect(result.current.timeRange.start).toEqual(start)
      expect(result.current.timeRange.end).toEqual(end)
      expect(result.current.timeRange.preset).toBe('custom')
    })

    it('should set time range without preset', () => {
      const { result } = renderHook(() => useUIStore())
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-31')
      
      act(() => {
        result.current.setTimeRange(start, end)
      })

      expect(result.current.timeRange.start).toEqual(start)
      expect(result.current.timeRange.end).toEqual(end)
      expect(result.current.timeRange.preset).toBeNull()
    })

    it('should clear time range', () => {
      const { result } = renderHook(() => useUIStore())
      
      // Set time range first
      act(() => {
        result.current.setTimeRange(new Date(), new Date(), 'last7days')
      })

      // Then clear it
      act(() => {
        result.current.clearTimeRange()
      })

      expect(result.current.timeRange.start).toBeNull()
      expect(result.current.timeRange.end).toBeNull()
      expect(result.current.timeRange.preset).toBeNull()
    })
  })

  describe('Preference Actions', () => {
    it('should set theme preference', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setPreference('theme', 'dark')
      })

      expect(result.current.preferences.theme).toBe('dark')
    })

    it('should set density preference', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setPreference('density', 'compact')
      })

      expect(result.current.preferences.density).toBe('compact')
    })

    it('should set table page size preference', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setPreference('tablePageSize', 25)
      })

      expect(result.current.preferences.tablePageSize).toBe(25)
    })

    it('should set dashboard layout preference', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setPreference('dashboardLayout', 'list')
      })

      expect(result.current.preferences.dashboardLayout).toBe('list')
    })
  })

  describe('Selector Hooks', () => {
    it('should provide selector hooks for performance', () => {
      const { result: sidebarResult } = renderHook(() => useSidebar())
      const { result: modalsResult } = renderHook(() => useModals())
      const { result: loadingResult } = renderHook(() => useLoading())
      const { result: searchResult } = renderHook(() => useSearch())
      const { result: timeRangeResult } = renderHook(() => useTimeRange())
      const { result: preferencesResult } = renderHook(() => usePreferences())

      expect(sidebarResult.current).toBeDefined()
      expect(sidebarResult.current.open).toBe(true)
      expect(modalsResult.current).toBeDefined()
      expect(loadingResult.current).toBeDefined()
      expect(searchResult.current).toBeDefined()
      expect(timeRangeResult.current).toBeDefined()
      expect(preferencesResult.current).toBeDefined()
    })

    it('should update selector hooks when state changes', () => {
      const { result: storeResult } = renderHook(() => useUIStore())
      const { result: sidebarResult } = renderHook(() => useSidebar())
      
      expect(sidebarResult.current.open).toBe(true)

      act(() => {
        storeResult.current.setSidebarOpen(false)
      })

      expect(sidebarResult.current.open).toBe(false)
    })
  })

  describe('Modal State Management', () => {
    it('should handle appointment create modal with prefill data', () => {
      const { result } = renderHook(() => useUIStore())
      const prefillData = { customerId: '123', type: 'consultation' }
      
      act(() => {
        result.current.openModal('appointmentCreate', { prefillData })
      })

      expect(result.current.modals.appointmentCreate.open).toBe(true)
      expect(result.current.modals.appointmentCreate.prefillData).toEqual(prefillData)
    })

    it('should handle appointment edit modal with ID', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.openModal('appointmentEdit', { appointmentId: 'apt-456' })
      })

      expect(result.current.modals.appointmentEdit.open).toBe(true)
      expect(result.current.modals.appointmentEdit.appointmentId).toBe('apt-456')
    })

    it('should handle customer edit modal with ID', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.openModal('customerEdit', { customerId: 'cust-789' })
      })

      expect(result.current.modals.customerEdit.open).toBe(true)
      expect(result.current.modals.customerEdit.customerId).toBe('cust-789')
    })
  })

  describe('Complex Interactions', () => {
    it('should handle multiple UI state changes', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setSidebarCollapsed(true)
        result.current.setGlobalLoading(true)
        result.current.openModal('mediaUpload', { type: 'video' })
        result.current.setGlobalSearch('complex query')
        result.current.setPreference('theme', 'dark')
      })

      expect(result.current.sidebar.collapsed).toBe(true)
      expect(result.current.loading.global).toBe(true)
      expect(result.current.modals.mediaUpload.open).toBe(true)
      expect(result.current.modals.mediaUpload.type).toBe('video')
      expect(result.current.search.global).toBe('complex query')
      expect(result.current.preferences.theme).toBe('dark')
    })

    it('should maintain independent state for different components', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setComponentLoading('header', true)
        result.current.setComponentLoading('sidebar', false)
        result.current.setComponentLoading('dashboard', true)
      })

      expect(result.current.loading.component.header).toBe(true)
      expect(result.current.loading.component.sidebar).toBe(false)
      expect(result.current.loading.component.dashboard).toBe(true)
      expect(result.current.loading.global).toBe(false)
      expect(result.current.loading.page).toBe(false)
    })
  })
})