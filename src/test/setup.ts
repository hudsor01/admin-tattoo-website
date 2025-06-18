import React from 'react'
import '@testing-library/jest-dom'
import { afterEach, beforeAll, beforeEach, vi } from 'vitest'

// Make React available globally for JSX
globalThis.React = React

// Mock browser APIs not available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock crypto for node environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${  Math.random().toString(36).substr(2, 9)}`,
    getRandomValues: (arr) => arr.map(() => Math.floor(Math.random() * 256)),
  },
})

// Mock fetch with proper API responses
global.fetch = vi.fn((url: string | URL, options?: RequestInit) => {
  const urlStr = typeof url === 'string' ? url : url.toString()
  
  // Create standard API response format
  const createResponse = (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    json: () => Promise.resolve({
      success: status >= 200 && status < 300,
      data,
      status,
      timestamp: new Date().toISOString(),
    }),
    text: () => Promise.resolve(JSON.stringify({
      success: status >= 200 && status < 300,
      data,
      status,
      timestamp: new Date().toISOString(),
    })),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  } as Response)
  
  // Handle common API endpoints
  if (urlStr.includes('/api/auth/session')) {
    return Promise.resolve(createResponse(null))
  }
  if (urlStr.includes('/api/admin/dashboard/stats')) {
    return Promise.resolve(createResponse({
      totalClients: 150,
      totalAppointments: 89,
      totalArtists: 8,
      revenueThisMonth: 15680,
    }))
  }
  
  // Default successful response
  return Promise.resolve(createResponse({}))
})

// Mock pointer capture methods for radix-ui
Element.prototype.hasPointerCapture = vi.fn(() => false)
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: vi.fn(() => '/'),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock Tabler icons globally to prevent boolean attribute warnings
vi.mock('@tabler/icons-react', () => {
  const createIconMock = (name: string) => vi.fn((props: any) => {
    return {
      type: 'div',
      props: {
        'data-testid': `icon-${name.toLowerCase()}`,
        'data-fill': props.fill?.toString(),
        'data-priority': props.priority?.toString(),
        ...props
      }
    };
  });
  
  return {
    IconCamera: createIconMock('camera'),
    IconChartBar: createIconMock('chart-bar'),
    IconDashboard: createIconMock('dashboard'),
    IconListDetails: createIconMock('list-details'),
    IconReport: createIconMock('report'),
    IconSettings: createIconMock('settings'),
    IconUsers: createIconMock('users'),
    IconCalendar: createIconMock('calendar'),
    IconUser: createIconMock('user'),
    IconLogout: createIconMock('logout'),
    IconMenu2: createIconMock('menu2'),
    IconX: createIconMock('x'),
    IconLoader2: createIconMock('loader2'),
    IconAlertTriangle: createIconMock('alert-triangle'),
    IconChevronDown: createIconMock('chevron-down'),
    IconChevronRight: createIconMock('chevron-right'),
    IconPlus: createIconMock('plus'),
    IconEdit: createIconMock('edit'),
    IconTrash: createIconMock('trash'),
    IconEye: createIconMock('eye'),
    IconRefresh: createIconMock('refresh'),
    IconMessageCircle: createIconMock('message-circle'),
  };
})

// Mock environment variables
beforeAll(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3001')
  vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test')
  vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret')
  vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3001')
})

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  // Reset fetch mock
  if (global.fetch && typeof global.fetch === 'function' && 'mockClear' in global.fetch) {
    (global.fetch as any).mockClear()
  }
})

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
})