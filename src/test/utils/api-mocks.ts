import { vi } from 'vitest'

// Mock API responses
export const createApiMockResponse = <T>(data: T, options: { status?: number; delay?: number } = {}) => {
  const { status = 200, delay = 0 } = options
  
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    json: async () => ({
      success: status >= 200 && status < 300,
      data,
      status,
      timestamp: new Date().toISOString(),
    }),
    text: async () => JSON.stringify({
      success: status >= 200 && status < 300,
      data,
      status,
      timestamp: new Date().toISOString(),
    }),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  } as Response

  if (delay > 0) {
    return new Promise<Response>((resolve) => {
      setTimeout(() => resolve(response), delay)
    })
  }

  return Promise.resolve(response)
}

// Mock fetch globally for tests
export const setupApiMocks = () => {
  global.fetch = vi.fn()
  
  // Default successful response
  ;(global.fetch as any).mockResolvedValue(createApiMockResponse({}))
  
  return global.fetch as any
}

// API endpoint mocks
export const apiMocks = {
  // Auth endpoints
  '/api/auth/session': () => createApiMockResponse(null),
  '/api/auth/signin': () => createApiMockResponse({ user: { id: '1', email: 'test@example.com' } }),
  '/api/auth/signout': () => createApiMockResponse({}),
  
  // Dashboard endpoints
  '/api/admin/dashboard/stats': () => createApiMockResponse({
    totalClients: 150,
    totalAppointments: 89,
    totalArtists: 8,
    revenueThisMonth: 15680,
    appointmentsThisWeek: 12,
    newClientsThisMonth: 23,
  }),
  
  // Appointments endpoints
  '/api/admin/appointments': () => createApiMockResponse([]),
  '/api/admin/appointments/1': () => createApiMockResponse({
    id: '1',
    clientName: 'Test Client',
    date: new Date().toISOString(),
    status: 'scheduled',
  }),
  
  // Clients endpoints
  '/api/admin/clients': () => createApiMockResponse([]),
  '/api/admin/clients/1': () => createApiMockResponse({
    id: '1',
    firstName: 'Test',
    lastName: 'Client',
    email: 'test@client.com',
  }),
  
  // Media endpoints
  '/api/admin/media': () => createApiMockResponse([]),
  '/api/admin/media/1': () => createApiMockResponse({
    id: '1',
    title: 'Test Media',
    type: 'photo',
    url: 'https://example.com/image.jpg',
  }),
}

// Setup mock responses based on URL
export const setupMockResponses = () => {
  const mockFetch = setupApiMocks()
  
  mockFetch.mockImplementation((url: string, options?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    
    // Handle query parameters
    const baseUrl = urlStr.split('?')[0]
    
    // Check for specific endpoint mocks
    if (baseUrl in apiMocks) {
      return (apiMocks as any)[baseUrl]()
    }
    
    // Handle dynamic endpoints (with IDs)
    const dynamicEndpoints = [
      { pattern: /\/api\/admin\/appointments\/\d+/, mock: apiMocks['/api/admin/appointments/1'] },
      { pattern: /\/api\/admin\/clients\/\d+/, mock: apiMocks['/api/admin/clients/1'] },
      { pattern: /\/api\/admin\/media\/\d+/, mock: apiMocks['/api/admin/media/1'] },
    ]
    
    for (const endpoint of dynamicEndpoints) {
      if (endpoint.pattern.test(baseUrl)) {
        return endpoint.mock()
      }
    }
    
    // Default response for unmocked endpoints
    return createApiMockResponse({}, { status: 404 })
  })
  
  return mockFetch
}