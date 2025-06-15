import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Dashboard specific interfaces
interface DashboardFilters {
  timeRange: {
    start: Date | null;
    end: Date | null;
    preset: string | null;
  };
  status: string[];
  tags: string[];
  search: string;
}

interface ChartPreferences {
  showLegend: boolean;
  chartType: 'line' | 'bar' | 'area';
  showDataLabels: boolean;
  colorScheme: 'default' | 'pastel' | 'vibrant';
}

interface TablePreferences {
  pageSize: number;
  columnVisibility: Record<string, boolean>;
  sortBy: string | null;
  sortDirection: 'asc' | 'desc';
}

interface DashboardLayout {
  type: 'grid' | 'list';
  columns: number;
  cardSize: 'small' | 'medium' | 'large';
  showStats: boolean;
  showCharts: boolean;
  showRecentActivity: boolean;
}

// Main dashboard store interface
interface DashboardStore {
  // Current filters
  filters: DashboardFilters;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  clearFilters: () => void;
  
  // Time range helpers
  setTimeRange: (start: Date | null, end: Date | null, preset?: string) => void;
  setTimeRangePreset: (preset: string) => void;
  clearTimeRange: () => void;
  
  // Search
  setSearch: (search: string) => void;
  clearSearch: () => void;
  
  // Status filters
  addStatusFilter: (status: string) => void;
  removeStatusFilter: (status: string) => void;
  toggleStatusFilter: (status: string) => void;
  clearStatusFilters: () => void;
  
  // Tag filters
  addTagFilter: (tag: string) => void;
  removeTagFilter: (tag: string) => void;
  toggleTagFilter: (tag: string) => void;
  clearTagFilters: () => void;
  
  // Chart preferences
  chartPreferences: ChartPreferences;
  setChartPreference: <K extends keyof ChartPreferences>(
    key: K,
    value: ChartPreferences[K]
  ) => void;
  
  // Table preferences
  tablePreferences: TablePreferences;
  setTablePreference: <K extends keyof TablePreferences>(
    key: K,
    value: TablePreferences[K]
  ) => void;
  toggleColumnVisibility: (column: string) => void;
  
  // Layout preferences
  layout: DashboardLayout;
  setLayout: (layout: Partial<DashboardLayout>) => void;
  setLayoutType: (type: 'grid' | 'list') => void;
  
  // Refresh control
  lastRefresh: number;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  updateLastRefresh: () => void;
  
  // View state
  activeView: 'overview' | 'customers' | 'appointments' | 'analytics' | 'media';
  setActiveView: (view: DashboardStore['activeView']) => void;
  
  // Selected items (for bulk operations)
  selectedItems: Set<string>;
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  toggleItemSelection: (id: string) => void;
  selectAllItems: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Quick actions
  recentActions: Array<{
    id: string;
    action: string;
    resource: string;
    timestamp: number;
  }>;
  addRecentAction: (action: string, resource: string) => void;
  clearRecentActions: () => void;
}

// Time range presets
export const TIME_RANGE_PRESETS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  LAST_3_MONTHS: 'last_3_months',
  LAST_6_MONTHS: 'last_6_months',
  LAST_YEAR: 'last_year',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  CUSTOM: 'custom',
} as const;

// Helper function to get date range from preset
function getDateRangeFromPreset(preset: string): { start: Date; end: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case TIME_RANGE_PRESETS.TODAY:
      return { start: today, end: now };
    
    case TIME_RANGE_PRESETS.YESTERDAY:
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    
    case TIME_RANGE_PRESETS.LAST_7_DAYS:
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return { start: lastWeek, end: now };
    
    case TIME_RANGE_PRESETS.LAST_30_DAYS:
      const lastMonth = new Date(today);
      lastMonth.setDate(lastMonth.getDate() - 30);
      return { start: lastMonth, end: now };
    
    case TIME_RANGE_PRESETS.LAST_3_MONTHS:
      const last3Months = new Date(today);
      last3Months.setMonth(last3Months.getMonth() - 3);
      return { start: last3Months, end: now };
    
    case TIME_RANGE_PRESETS.LAST_6_MONTHS:
      const last6Months = new Date(today);
      last6Months.setMonth(last6Months.getMonth() - 6);
      return { start: last6Months, end: now };
    
    case TIME_RANGE_PRESETS.LAST_YEAR:
      const lastYear = new Date(today);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      return { start: lastYear, end: now };
    
    case TIME_RANGE_PRESETS.THIS_MONTH:
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: thisMonthStart, end: now };
    
    case TIME_RANGE_PRESETS.LAST_MONTH:
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: lastMonthStart, end: lastMonthEnd };
    
    default:
      return null;
  }
}

// Initial state
const initialState = {
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
    chartType: 'line' as const,
    showDataLabels: false,
    colorScheme: 'default' as const,
  },
  tablePreferences: {
    pageSize: 10,
    columnVisibility: {},
    sortBy: null,
    sortDirection: 'desc' as const,
  },
  layout: {
    type: 'grid' as const,
    columns: 3,
    cardSize: 'medium' as const,
    showStats: true,
    showCharts: true,
    showRecentActivity: true,
  },
  lastRefresh: Date.now(),
  autoRefresh: false,
  refreshInterval: 300, // 5 minutes
  activeView: 'overview' as const,
  selectedItems: new Set<string>(),
  recentActions: [],
};

// Create the dashboard store
export const useDashboardStore = create<DashboardStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Filter actions
        setFilters: (newFilters) =>
          set(
            (state) => ({
              filters: { ...state.filters, ...newFilters },
            }),
            false,
            'setFilters'
          ),
        
        clearFilters: () =>
          set(
            { filters: initialState.filters },
            false,
            'clearFilters'
          ),
        
        // Time range actions
        setTimeRange: (start, end, preset = TIME_RANGE_PRESETS.CUSTOM) =>
          set(
            (state) => ({
              filters: {
                ...state.filters,
                timeRange: { start, end, preset },
              },
            }),
            false,
            'setTimeRange'
          ),
        
        setTimeRangePreset: (preset) => {
          const range = getDateRangeFromPreset(preset);
          if (range) {
            get().setTimeRange(range.start, range.end, preset);
          }
        },
        
        clearTimeRange: () =>
          set(
            (state) => ({
              filters: {
                ...state.filters,
                timeRange: { start: null, end: null, preset: null },
              },
            }),
            false,
            'clearTimeRange'
          ),
        
        // Search actions
        setSearch: (search) =>
          set(
            (state) => ({
              filters: { ...state.filters, search },
            }),
            false,
            'setSearch'
          ),
        
        clearSearch: () => get().setSearch(''),
        
        // Status filter actions
        addStatusFilter: (status) =>
          set(
            (state) => ({
              filters: {
                ...state.filters,
                status: [...state.filters.status, status],
              },
            }),
            false,
            'addStatusFilter'
          ),
        
        removeStatusFilter: (status) =>
          set(
            (state) => ({
              filters: {
                ...state.filters,
                status: state.filters.status.filter(s => s !== status),
              },
            }),
            false,
            'removeStatusFilter'
          ),
        
        toggleStatusFilter: (status) => {
          const { filters } = get();
          if (filters.status.includes(status)) {
            get().removeStatusFilter(status);
          } else {
            get().addStatusFilter(status);
          }
        },
        
        clearStatusFilters: () =>
          set(
            (state) => ({
              filters: { ...state.filters, status: [] },
            }),
            false,
            'clearStatusFilters'
          ),
        
        // Tag filter actions (similar to status)
        addTagFilter: (tag) =>
          set(
            (state) => ({
              filters: {
                ...state.filters,
                tags: [...state.filters.tags, tag],
              },
            }),
            false,
            'addTagFilter'
          ),
        
        removeTagFilter: (tag) =>
          set(
            (state) => ({
              filters: {
                ...state.filters,
                tags: state.filters.tags.filter(t => t !== tag),
              },
            }),
            false,
            'removeTagFilter'
          ),
        
        toggleTagFilter: (tag) => {
          const { filters } = get();
          if (filters.tags.includes(tag)) {
            get().removeTagFilter(tag);
          } else {
            get().addTagFilter(tag);
          }
        },
        
        clearTagFilters: () =>
          set(
            (state) => ({
              filters: { ...state.filters, tags: [] },
            }),
            false,
            'clearTagFilters'
          ),
        
        // Chart preference actions
        setChartPreference: (key, value) =>
          set(
            (state) => ({
              chartPreferences: { ...state.chartPreferences, [key]: value },
            }),
            false,
            'setChartPreference'
          ),
        
        // Table preference actions
        setTablePreference: (key, value) =>
          set(
            (state) => ({
              tablePreferences: { ...state.tablePreferences, [key]: value },
            }),
            false,
            'setTablePreference'
          ),
        
        toggleColumnVisibility: (column) =>
          set(
            (state) => ({
              tablePreferences: {
                ...state.tablePreferences,
                columnVisibility: {
                  ...state.tablePreferences.columnVisibility,
                  [column]: !state.tablePreferences.columnVisibility[column],
                },
              },
            }),
            false,
            'toggleColumnVisibility'
          ),
        
        // Layout actions
        setLayout: (newLayout) =>
          set(
            (state) => ({
              layout: { ...state.layout, ...newLayout },
            }),
            false,
            'setLayout'
          ),
        
        setLayoutType: (type) => get().setLayout({ type }),
        
        // Refresh actions
        setAutoRefresh: (autoRefresh) =>
          set({ autoRefresh }, false, 'setAutoRefresh'),
        
        setRefreshInterval: (refreshInterval) =>
          set({ refreshInterval }, false, 'setRefreshInterval'),
        
        updateLastRefresh: () =>
          set({ lastRefresh: Date.now() }, false, 'updateLastRefresh'),
        
        // View actions
        setActiveView: (activeView) =>
          set({ activeView }, false, 'setActiveView'),
        
        // Selection actions
        selectItem: (id) =>
          set(
            (state) => ({
              selectedItems: new Set([...state.selectedItems, id]),
            }),
            false,
            'selectItem'
          ),
        
        deselectItem: (id) =>
          set(
            (state) => {
              const newSelection = new Set(state.selectedItems);
              newSelection.delete(id);
              return { selectedItems: newSelection };
            },
            false,
            'deselectItem'
          ),
        
        toggleItemSelection: (id) => {
          const { selectedItems } = get();
          if (selectedItems.has(id)) {
            get().deselectItem(id);
          } else {
            get().selectItem(id);
          }
        },
        
        selectAllItems: (ids) =>
          set(
            { selectedItems: new Set(ids) },
            false,
            'selectAllItems'
          ),
        
        clearSelection: () =>
          set(
            { selectedItems: new Set() },
            false,
            'clearSelection'
          ),
        
        // Recent actions
        addRecentAction: (action, resource) =>
          set(
            (state) => ({
              recentActions: [
                {
                  id: `${Date.now()}-${Math.random()}`,
                  action,
                  resource,
                  timestamp: Date.now(),
                },
                ...state.recentActions.slice(0, 9), // Keep last 10
              ],
            }),
            false,
            'addRecentAction'
          ),
        
        clearRecentActions: () =>
          set({ recentActions: [] }, false, 'clearRecentActions'),
      }),
      {
        name: 'dashboard-store',
        // Only persist certain parts of the state
        partialize: (state) => ({
          filters: state.filters,
          chartPreferences: state.chartPreferences,
          tablePreferences: state.tablePreferences,
          layout: state.layout,
          autoRefresh: state.autoRefresh,
          refreshInterval: state.refreshInterval,
          activeView: state.activeView,
        }),
      }
    ),
    { name: 'Dashboard Store' }
  )
);

// Selector hooks for better performance
export const useDashboardFilters = () => useDashboardStore((state) => state.filters);
export const useTimeRange = () => useDashboardStore((state) => state.filters.timeRange);
export const useChartPreferences = () => useDashboardStore((state) => state.chartPreferences);
export const useTablePreferences = () => useDashboardStore((state) => state.tablePreferences);
export const useDashboardLayout = () => useDashboardStore((state) => state.layout);
export const useSelectedItems = () => useDashboardStore((state) => state.selectedItems);
export const useRecentActions = () => useDashboardStore((state) => state.recentActions);
export const useActiveView = () => useDashboardStore((state) => state.activeView);