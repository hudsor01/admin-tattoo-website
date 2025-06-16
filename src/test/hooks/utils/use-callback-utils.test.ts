import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useDebouncedCallback,
  useThrottledCallback,
  useSafeCallback,
  useDeferredCallback
} from '@/hooks/use-callback-utils'

describe('Callback Utility Hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('useDebouncedCallback', () => {
    it('should debounce callback execution', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, 100)
      )

      // Multiple rapid calls
      act(() => {
        result.current.callback('test1')
        result.current.callback('test2')
        result.current.callback('test3')
      })

      expect(callback).not.toHaveBeenCalled()

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test3')
    })

    it('should reset debounce timer on new calls', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, 100)
      )

      act(() => {
        result.current('test1')
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      act(() => {
        result.current('test2')
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      // Should not have been called yet
      expect(callback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test2')
    })

    it('should support leading edge execution', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, 100, { leading: true })
      )

      act(() => {
        result.current('test1')
      })

      // Should execute immediately on leading edge
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test1')

      act(() => {
        result.current('test2')
        result.current('test3')
      })

      // Should not execute again until trailing edge
      expect(callback).toHaveBeenCalledTimes(1)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith('test3')
    })

    it('should support trailing edge execution', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, 100, { trailing: true })
      )

      act(() => {
        result.current('test1')
        result.current('test2')
      })

      expect(callback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test2')
    })

    it('should support maxWait option', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, 100, { maxWait: 200 })
      )

      // Keep calling every 50ms to prevent normal debounce
      act(() => {
        result.current('test1')
      })

      act(() => {
        vi.advanceTimersByTime(50)
        result.current('test2')
      })

      act(() => {
        vi.advanceTimersByTime(50)
        result.current('test3')
      })

      act(() => {
        vi.advanceTimersByTime(50)
        result.current('test4')
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      // Should execute due to maxWait even though we kept calling
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test4')
    })

    it('should cancel debounced calls', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, 100)
      )

      act(() => {
        result.current('test1')
      })

      act(() => {
        result.current.cancel()
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(callback).not.toHaveBeenCalled()
    })

    it('should flush pending debounced calls', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, 100)
      )

      act(() => {
        result.current('test1')
      })

      act(() => {
        result.current.flush()
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test1')
    })

    it('should cleanup on unmount', () => {
      const callback = vi.fn()
      const { result, unmount } = renderHook(() => 
        useDebouncedCallback(callback, 100)
      )

      act(() => {
        result.current('test1')
      })

      unmount()

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('useThrottledCallback', () => {
    it('should throttle callback execution', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useThrottledCallback(callback, 100)
      )

      // Multiple rapid calls
      act(() => {
        result.current('test1')
        result.current('test2')
        result.current('test3')
      })

      // Should execute immediately (leading edge)
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test1')

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should execute trailing edge
      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith('test3')
    })

    it('should support leading edge only', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useThrottledCallback(callback, 100, { leading: true, trailing: false })
      )

      act(() => {
        result.current('test1')
        result.current('test2')
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test1')

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should not execute trailing edge
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should support trailing edge only', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useThrottledCallback(callback, 100, { leading: false, trailing: true })
      )

      act(() => {
        result.current('test1')
        result.current('test2')
      })

      // Should not execute immediately
      expect(callback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test2')
    })

    it('should support requestAnimationFrame mode', () => {
      const callback = vi.fn()
      const mockRAF = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        setTimeout(cb, 16) // Simulate 60fps
        return 1
      })

      const { result } = renderHook(() => 
        useThrottledCallback(callback, 0, { useRAF: true })
      )

      act(() => {
        result.current('test1')
        result.current('test2')
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test1')

      act(() => {
        vi.advanceTimersByTime(16)
      })

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith('test2')

      mockRAF.mockRestore()
    })

    it('should cancel throttled calls', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useThrottledCallback(callback, 100)
      )

      act(() => {
        result.current('test1')
      })

      expect(callback).toHaveBeenCalledTimes(1)

      act(() => {
        result.current('test2')
        result.current.cancel()
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should not execute trailing edge after cancel
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should flush pending throttled calls', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useThrottledCallback(callback, 100)
      )

      act(() => {
        result.current('test1')
        result.current('test2')
      })

      expect(callback).toHaveBeenCalledTimes(1)

      act(() => {
        result.current.flush()
      })

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith('test2')
    })
  })

  describe('useSafeCallback', () => {
    it('should execute callback safely', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => useSafeCallback(callback))

      act(() => {
        result.current('test')
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test')
    })

    it('should catch and handle errors', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error')
      })
      const onError = vi.fn()
      
      const { result } = renderHook(() => 
        useSafeCallback(errorCallback, { onError })
      )

      act(() => {
        result.current('test')
      })

      expect(errorCallback).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle abort signals', () => {
      const callback = vi.fn()
      const abortController = new AbortController()
      
      const { result } = renderHook(() => 
        useSafeCallback(callback, { signal: abortController.signal })
      )

      act(() => {
        abortController.abort()
      })

      act(() => {
        result.current('test')
      })

      expect(callback).not.toHaveBeenCalled()
    })

    it('should support retry logic', async () => {
      let callCount = 0
      const retryCallback = vi.fn(() => {
        callCount++
        if (callCount < 3) {
          throw new Error('Retry error')
        }
        return 'success'
      })

      const { result } = renderHook(() => 
        useSafeCallback(retryCallback, { 
          retries: 3,
          retryDelay: 100
        })
      )

      let callbackResult: any
      await act(async () => {
        callbackResult = await result.current('test')
      })

      expect(retryCallback).toHaveBeenCalledTimes(3)
      expect(callbackResult).toBe('success')
    })

    it('should timeout long-running callbacks', async () => {
      const longRunningCallback = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
        return 'completed'
      })

      const onTimeout = vi.fn()
      
      const { result } = renderHook(() => 
        useSafeCallback(longRunningCallback, { 
          timeout: 100,
          onTimeout
        })
      )

      await act(async () => {
        await result.current('test')
      })

      expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    it('should cleanup on unmount', () => {
      const callback = vi.fn()
      const abortController = new AbortController()
      const spyAbort = vi.spyOn(abortController, 'abort')
      
      const { unmount } = renderHook(() => 
        useSafeCallback(callback, { signal: abortController.signal })
      )

      unmount()

      expect(spyAbort).toHaveBeenCalled()
    })
  })

  describe('useDeferredCallback', () => {
    it('should defer callback execution', async () => {
      const callback = vi.fn()
      const { result } = renderHook(() => useDeferredCallback(callback))

      act(() => {
        result.current('test')
      })

      expect(callback).not.toHaveBeenCalled()

      // Wait for next tick
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test')
    })

    it('should support priority scheduling', async () => {
      const lowPriorityCallback = vi.fn()
      const highPriorityCallback = vi.fn()
      
      const { result: lowResult } = renderHook(() => 
        useDeferredCallback(lowPriorityCallback, { priority: 'low' })
      )
      
      const { result: highResult } = renderHook(() => 
        useDeferredCallback(highPriorityCallback, { priority: 'high' })
      )

      act(() => {
        lowResult.current('low')
        highResult.current('high')
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // High priority should execute first
      expect(highPriorityCallback).toHaveBeenCalledBefore(lowPriorityCallback)
    })

    it('should support custom delays', async () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDeferredCallback(callback, { delay: 100 })
      )

      act(() => {
        result.current('test')
      })

      expect(callback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(callback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should queue multiple calls', async () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDeferredCallback(callback, { queueSize: 3 })
      )

      act(() => {
        result.current('test1')
        result.current('test2')
        result.current('test3')
        result.current('test4') // Should be dropped due to queue size
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(callback).toHaveBeenCalledTimes(3)
      expect(callback).toHaveBeenNthCalledWith(1, 'test1')
      expect(callback).toHaveBeenNthCalledWith(2, 'test2')
      expect(callback).toHaveBeenNthCalledWith(3, 'test3')
    })

    it('should support FIFO queue mode', async () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDeferredCallback(callback, { 
          queueSize: 2,
          queueMode: 'fifo'
        })
      )

      act(() => {
        result.current('first')
        result.current('second')
        result.current('third') // Should replace 'first'
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenNthCalledWith(1, 'second')
      expect(callback).toHaveBeenNthCalledWith(2, 'third')
    })

    it('should support LIFO queue mode', async () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDeferredCallback(callback, { 
          queueSize: 2,
          queueMode: 'lifo'
        })
      )

      act(() => {
        result.current('first')
        result.current('second')
        result.current('third') // Should replace 'second'
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenNthCalledWith(1, 'first')
      expect(callback).toHaveBeenNthCalledWith(2, 'third')
    })

    it('should cancel deferred calls', async () => {
      const callback = vi.fn()
      const { result } = renderHook(() => useDeferredCallback(callback))

      act(() => {
        result.current('test')
        result.current.cancel()
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(callback).not.toHaveBeenCalled()
    })

    it('should flush deferred calls immediately', async () => {
      const callback = vi.fn()
      const { result } = renderHook(() => 
        useDeferredCallback(callback, { delay: 100 })
      )

      act(() => {
        result.current('test')
        result.current.flush()
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('test')
    })

    it('should cleanup on unmount', async () => {
      const callback = vi.fn()
      const { result, unmount } = renderHook(() => useDeferredCallback(callback))

      act(() => {
        result.current('test')
      })

      unmount()

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Hook dependencies and re-renders', () => {
    it('should maintain callback identity when options remain the same', () => {
      const callback = vi.fn()
      const options = { leading: true, trailing: false }
      
      const { result, rerender } = renderHook(
        ({ cb, opts }) => useDebouncedCallback(cb, 100, opts),
        { initialProps: { cb: callback, opts: options } }
      )

      const firstResult = result.current

      rerender({ cb: callback, opts: options })

      expect(result.current).toBe(firstResult)
    })

    it('should update callback when function changes', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      const { result, rerender } = renderHook(
        ({ cb }) => useDebouncedCallback(cb, 100),
        { initialProps: { cb: callback1 } }
      )

      act(() => {
        result.current('test1')
      })

      rerender({ cb: callback2 })

      act(() => {
        result.current('test2')
        vi.advanceTimersByTime(100)
      })

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledWith('test2')
    })

    it('should update delay when it changes', () => {
      const callback = vi.fn()
      
      const { result, rerender } = renderHook(
        ({ delay }) => useDebouncedCallback(callback, delay),
        { initialProps: { delay: 100 } }
      )

      act(() => {
        result.current('test1')
      })

      rerender({ delay: 200 })

      act(() => {
        result.current('test2')
        vi.advanceTimersByTime(100)
      })

      expect(callback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(callback).toHaveBeenCalledWith('test2')
    })
  })
})