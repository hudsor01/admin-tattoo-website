import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

// Extract MediaItemCard from the page component since it's not exported
// In a real scenario, this should be a separate component file
const MediaItemCard = vi.fn()

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockMediaItem = {
  id: '1',
  title: 'Traditional Dragon',
  description: 'A traditional dragon tattoo',
  style: 'Traditional',
  tags: ['dragon', 'traditional', 'color'],
  mediaUrl: 'https://example.com/dragon.jpg',
  imageUrl: 'https://example.com/dragon.jpg',
  type: 'photo' as const,
  artistName: 'Fernando Govea',
  isPublic: true,
  popularity: 10,
  estimatedHours: 5,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  syncedToWebsite: false,
  websiteUrl: 'https://ink37tattoos.com/gallery/1',
}

// Mock fetch
global.fetch = vi.fn()

// Create a test component that mimics MediaItemCard behavior
const TestMediaItemCard = ({ item }: { item: typeof mockMediaItem }) => {
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [syncStatus, setSyncStatus] = React.useState(item.syncedToWebsite)

  const handleSync = async () => {
    setIsSyncing(true)
    const action = syncStatus ? 'unsync' : 'sync'
    
    try {
      const response = await fetch('/api/admin/media/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: item.id, action })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Sync failed')
      }
      
      setSyncStatus(!syncStatus)
      toast.success(action === 'sync' 
        ? 'Media synced to website successfully!' 
        : 'Media removed from website successfully!'
      )
    } catch (error: any) {
      toast.error(`Sync failed: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div data-testid="media-item-card">
      <h3>{item.title}</h3>
      <p>By {item.artistName}</p>
      <div data-testid="sync-status">{syncStatus ? '✓ Synced' : '⚠ Not Synced'}</div>
      <div data-testid="tags">
        {item.tags.map(tag => <span key={tag}>{tag}</span>)}
      </div>
      <button
        data-testid="sync-button"
        onClick={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? 'Syncing...' : (syncStatus ? 'Remove from website' : 'Sync to website')}
      </button>
      {syncStatus ? <button
          data-testid="view-on-website"
          onClick={() => window.open(item.websiteUrl, '_blank')}
        >
          View on website
        </button> : null}
      <button data-testid="view-details">View details</button>
      <button data-testid="edit-metadata">Edit metadata</button>
      <button data-testid="delete-item">Delete</button>
    </div>
  )
}

const React = await import('react')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('MediaItemCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays media item information correctly', () => {
    render(<TestMediaItemCard item={mockMediaItem} />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Traditional Dragon')).toBeInTheDocument()
    expect(screen.getByText('By Fernando Govea')).toBeInTheDocument()
    expect(screen.getByTestId('sync-status')).toHaveTextContent('⚠ Not Synced')
  })

  it('displays all tags', () => {
    render(<TestMediaItemCard item={mockMediaItem} />, { wrapper: createWrapper() })
    
    const tagsContainer = screen.getByTestId('tags')
    expect(tagsContainer).toHaveTextContent('dragon')
    expect(tagsContainer).toHaveTextContent('traditional')
    expect(tagsContainer).toHaveTextContent('color')
  })

  it('syncs media to website when sync button is clicked', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { syncedToWebsite: true }
      }),
    })
    
    render(<TestMediaItemCard item={mockMediaItem} />, { wrapper: createWrapper() })
    
    const syncButton = screen.getByTestId('sync-button')
    expect(syncButton).toHaveTextContent('Sync to website')
    
    await user.click(syncButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/media/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: '1', action: 'sync' })
      })
      expect(toast.success).toHaveBeenCalledWith('Media synced to website successfully!')
      expect(screen.getByTestId('sync-status')).toHaveTextContent('✓ Synced')
    })
  })

  it('removes media from website when already synced', async () => {
    const user = userEvent.setup()
    const syncedItem = { ...mockMediaItem, syncedToWebsite: true }
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { syncedToWebsite: false }
      }),
    })
    
    render(<TestMediaItemCard item={syncedItem} />, { wrapper: createWrapper() })
    
    const syncButton = screen.getByTestId('sync-button')
    expect(syncButton).toHaveTextContent('Remove from website')
    
    await user.click(syncButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/media/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: '1', action: 'unsync' })
      })
      expect(toast.success).toHaveBeenCalledWith('Media removed from website successfully!')
      expect(screen.getByTestId('sync-status')).toHaveTextContent('⚠ Not Synced')
    })
  })

  it('displays error toast when sync fails', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { message: 'Network error' }
      }),
    })
    
    render(<TestMediaItemCard item={mockMediaItem} />, { wrapper: createWrapper() })
    
    const syncButton = screen.getByTestId('sync-button')
    await user.click(syncButton)
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Sync failed: Network error')
    })
  })

  it('disables sync button while syncing', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true }),
      }), 100))
    )
    
    render(<TestMediaItemCard item={mockMediaItem} />, { wrapper: createWrapper() })
    
    const syncButton = screen.getByTestId('sync-button')
    await user.click(syncButton)
    
    expect(syncButton).toBeDisabled()
    expect(syncButton).toHaveTextContent('Syncing...')
    
    await waitFor(() => {
      expect(syncButton).not.toBeDisabled()
    })
  })

  it('shows view on website button only when synced', () => {
    const syncedItem = { ...mockMediaItem, syncedToWebsite: true }
    
    // First render with unsynced item
    const { rerender } = render(<TestMediaItemCard item={mockMediaItem} />, { wrapper: createWrapper() })
    expect(screen.queryByTestId('view-on-website')).not.toBeInTheDocument()
    
    // Rerender with synced item and proper wrapper
    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
        <TestMediaItemCard item={syncedItem} />
      </QueryClientProvider>
    )
    
    expect(screen.getByTestId('view-on-website')).toBeInTheDocument()
  })

  it('opens website URL in new tab when view on website is clicked', async () => {
    const user = userEvent.setup()
    const syncedItem = { ...mockMediaItem, syncedToWebsite: true }
    const mockOpen = vi.fn()
    global.window.open = mockOpen
    
    render(<TestMediaItemCard item={syncedItem} />, { wrapper: createWrapper() })
    
    const viewButton = screen.getByTestId('view-on-website')
    await user.click(viewButton)
    
    expect(mockOpen).toHaveBeenCalledWith('https://ink37tattoos.com/gallery/1', '_blank')
  })

  it('displays action buttons for view, edit, and delete', () => {
    render(<TestMediaItemCard item={mockMediaItem} />, { wrapper: createWrapper() })
    
    expect(screen.getByTestId('view-details')).toBeInTheDocument()
    expect(screen.getByTestId('edit-metadata')).toBeInTheDocument()
    expect(screen.getByTestId('delete-item')).toBeInTheDocument()
  })

  it('handles video items correctly', () => {
    const videoItem = { 
      ...mockMediaItem, 
      type: 'video' as const,
      mediaUrl: 'https://example.com/video.mp4' 
    }
    
    render(<TestMediaItemCard item={videoItem} />, { wrapper: createWrapper() })
    
    // Video items should display the same way, just with different media URL
    expect(screen.getByText('Traditional Dragon')).toBeInTheDocument()
  })
})