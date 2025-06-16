import '@testing-library/jest-dom'
import { beforeAll, afterEach, vi } from 'vitest'

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

// Mock environment variables
beforeAll(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3001')
})

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
})