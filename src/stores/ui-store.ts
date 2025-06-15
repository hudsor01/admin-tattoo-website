import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// UI state interfaces
interface ModalState {
  mediaUpload: {
    open: boolean;
    type?: 'photo' | 'video';
  };
  customerEdit: {
    open: boolean;
    customerId?: string;
  };
  appointmentCreate: {
    open: boolean;
    prefillData?: Record<string, any>;
  };
  appointmentEdit: {
    open: boolean;
    appointmentId?: string;
  };
}

interface SidebarState {
  open: boolean;
  collapsed: boolean;
}

interface NotificationState {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timestamp: number;
  }>;
}

// Main UI store interface
interface UIStore {
  // Sidebar state
  sidebar: SidebarState;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Modal state
  modals: ModalState;
  openModal: <K extends keyof ModalState>(
    modal: K,
    data?: Partial<ModalState[K]>
  ) => void;
  closeModal: (modal: keyof ModalState) => void;
  closeAllModals: () => void;
  
  // Loading states
  loading: {
    global: boolean;
    page: boolean;
    component: Record<string, boolean>;
  };
  setGlobalLoading: (loading: boolean) => void;
  setPageLoading: (loading: boolean) => void;
  setComponentLoading: (component: string, loading: boolean) => void;
  
  // Search and filters
  search: {
    global: string;
    customers: string;
    appointments: string;
    media: string;
  };
  setGlobalSearch: (query: string) => void;
  setPageSearch: (page: keyof UIStore['search'], query: string) => void;
  clearSearch: (page?: keyof UIStore['search']) => void;
  
  // Time range selection (global)
  timeRange: {
    start: Date | null;
    end: Date | null;
    preset: string | null;
  };
  setTimeRange: (start: Date | null, end: Date | null, preset?: string) => void;
  clearTimeRange: () => void;
  
  // View preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    density: 'comfortable' | 'compact';
    tablePageSize: number;
    dashboardLayout: 'grid' | 'list';
  };
  setPreference: <K extends keyof UIStore['preferences']>(
    key: K,
    value: UIStore['preferences'][K]
  ) => void;
}

// Initial state
const initialState = {
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
    theme: 'system' as const,
    density: 'comfortable' as const,
    tablePageSize: 10,
    dashboardLayout: 'grid' as const,
  },
};

// Create the store
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Sidebar actions
        toggleSidebar: () =>
          set(
            (state) => ({
              sidebar: { ...state.sidebar, open: !state.sidebar.open },
            }),
            false,
            'toggleSidebar'
          ),
        
        setSidebarOpen: (open) =>
          set(
            (state) => ({
              sidebar: { ...state.sidebar, open },
            }),
            false,
            'setSidebarOpen'
          ),
        
        setSidebarCollapsed: (collapsed) =>
          set(
            (state) => ({
              sidebar: { ...state.sidebar, collapsed },
            }),
            false,
            'setSidebarCollapsed'
          ),
        
        // Modal actions
        openModal: (modal, data = {}) =>
          set(
            (state) => ({
              modals: {
                ...state.modals,
                [modal]: { ...state.modals[modal], open: true, ...data },
              },
            }),
            false,
            `openModal-${modal}`
          ),
        
        closeModal: (modal) =>
          set(
            (state) => ({
              modals: {
                ...state.modals,
                [modal]: { ...initialState.modals[modal] },
              },
            }),
            false,
            `closeModal-${modal}`
          ),
        
        closeAllModals: () =>
          set(
            { modals: initialState.modals },
            false,
            'closeAllModals'
          ),
        
        // Loading actions
        setGlobalLoading: (loading) =>
          set(
            (state) => ({
              loading: { ...state.loading, global: loading },
            }),
            false,
            'setGlobalLoading'
          ),
        
        setPageLoading: (loading) =>
          set(
            (state) => ({
              loading: { ...state.loading, page: loading },
            }),
            false,
            'setPageLoading'
          ),
        
        setComponentLoading: (component, loading) =>
          set(
            (state) => ({
              loading: {
                ...state.loading,
                component: {
                  ...state.loading.component,
                  [component]: loading,
                },
              },
            }),
            false,
            'setComponentLoading'
          ),
        
        // Search actions
        setGlobalSearch: (query) =>
          set(
            (state) => ({
              search: { ...state.search, global: query },
            }),
            false,
            'setGlobalSearch'
          ),
        
        setPageSearch: (page, query) =>
          set(
            (state) => ({
              search: { ...state.search, [page]: query },
            }),
            false,
            'setPageSearch'
          ),
        
        clearSearch: (page) =>
          set(
            (state) => ({
              search: page
                ? { ...state.search, [page]: '' }
                : initialState.search,
            }),
            false,
            'clearSearch'
          ),
        
        // Time range actions
        setTimeRange: (start, end, preset = null) =>
          set(
            { timeRange: { start, end, preset } },
            false,
            'setTimeRange'
          ),
        
        clearTimeRange: () =>
          set(
            { timeRange: initialState.timeRange },
            false,
            'clearTimeRange'
          ),
        
        // Preference actions
        setPreference: (key, value) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, [key]: value },
            }),
            false,
            'setPreference'
          ),
      }),
      {
        name: 'ui-store',
        // Only persist certain parts of the state
        partialize: (state) => ({
          sidebar: state.sidebar,
          preferences: state.preferences,
          timeRange: state.timeRange,
        }),
      }
    ),
    { name: 'UI Store' }
  )
);

// Selector hooks for better performance
export const useSidebar = () => useUIStore((state) => state.sidebar);
export const useModals = () => useUIStore((state) => state.modals);
export const useLoading = () => useUIStore((state) => state.loading);
export const useSearch = () => useUIStore((state) => state.search);
export const useTimeRange = () => useUIStore((state) => state.timeRange);
export const usePreferences = () => useUIStore((state) => state.preferences);