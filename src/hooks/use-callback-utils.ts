'use client';

import * as React from 'react';
import { useCallback, useRef, useEffect } from 'react';
import { handleCallbackError } from '@/hooks/use-utils';

// Utility type for any function parameters
type AnyParams = unknown[];

export function useDebouncedCallback<T extends (...args: AnyParams) => unknown>(
  callback: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): {
  callback: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
} {
  const {
    leading = false,
    trailing = true,
    maxWait,
  } = options;

  // Store callback in ref to avoid dependency issues
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback]);

  // Track timeouts and last invocation time
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  // Track if we're waiting for trailing edge execution
  const waitingForTrailingRef = useRef(false);

  // Clear all timeouts
  const cancelDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    waitingForTrailingRef.current = false;
  }, []);

  // Flush the debounced function immediately
  const flushDebounce = useCallback(() => {
    cancelDebounce();
    if (lastArgsRef.current) {
      React.startTransition(() => {
        callbackRef.current(...(lastArgsRef.current ?? []));
      });
      lastCallTimeRef.current = Date.now();
      lastArgsRef.current = null;
    }
  }, [cancelDebounce]);

  // Check if debounce is pending
  const isPending = useCallback(() => {
    return timeoutRef.current !== null || maxTimeoutRef.current !== null;
  }, []);

  // The actual debounced function
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    lastArgsRef.current = args;
    const now = Date.now();
    const timeSinceLastCall = lastCallTimeRef.current ? now - lastCallTimeRef.current : Infinity;

    // Handle leading edge execution
    const shouldCallNow = leading && (lastCallTimeRef.current === null || timeSinceLastCall >= delay);

    if (shouldCallNow) {
      // Execute immediately for leading edge
      cancelDebounce();
      lastCallTimeRef.current = now;
      React.startTransition(() => {
        callbackRef.current(...args);
      });
      return;
    }

    // Setup trailing edge execution
    if (trailing) {
      waitingForTrailingRef.current = true;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for trailing edge execution
      timeoutRef.current = setTimeout(() => {
        lastCallTimeRef.current = Date.now();
        timeoutRef.current = null;

        // Only execute if we're waiting for the trailing edge
        if (waitingForTrailingRef.current) {
          React.startTransition(() => {
            callbackRef.current(...args);
          });
          waitingForTrailingRef.current = false;
        }
      }, delay);

      // Set maximum wait timeout if specified
      if (maxWait !== undefined && !maxTimeoutRef.current) {
        const timeWaited = timeSinceLastCall;
        const remainingMaxWait = Math.max(0, maxWait - timeWaited);

        maxTimeoutRef.current = setTimeout(() => {
          maxTimeoutRef.current = null;
          lastCallTimeRef.current = Date.now();

          // Execute if we're still waiting
          if (waitingForTrailingRef.current) {
            React.startTransition(() => {
              callbackRef.current(...args);
            });
            waitingForTrailingRef.current = false;
          }
        }, remainingMaxWait);
      }
    }
  }, [delay, leading, trailing, maxWait, cancelDebounce]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return cancelDebounce;
  }, [cancelDebounce]);

  return {
    callback: debouncedCallback,
    cancel: cancelDebounce,
    flush: flushDebounce,
    pending: isPending
  };
}

export function useThrottledCallback<T extends (...args: AnyParams) => unknown>(
  callback: T,
  interval: number,
  options: {
    trailing?: boolean;      // Whether to execute on the trailing edge
    leading?: boolean;       // Whether to execute on the leading edge
    useRAF?: boolean;
  } = {}
): {
  callback: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  const {
    trailing = true,
    leading = true,
    useRAF = false,
  } = options;

  // Store the latest callback in a ref
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback]);

  // Track state for throttling
  const lastCallTimeRef = useRef<number>(0);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | number | null>(null);
  const trailingArgsRef = useRef<Parameters<T> | null>(null);
  const isThrottledRef = useRef<boolean>(false);

  // Cancel any pending invocation
  const cancelThrottle = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      if (useRAF) {
        cancelAnimationFrame(timeoutIdRef.current as number);
      } else {
        clearTimeout(timeoutIdRef.current as ReturnType<typeof setTimeout>);
      }
      timeoutIdRef.current = null;
    }
    trailingArgsRef.current = null;
    isThrottledRef.current = false;
  }, [useRAF]);

  // Force execution of trailing edge
  const flushThrottle = useCallback(() => {
    if (trailingArgsRef.current !== null) {
      cancelThrottle();
      React.startTransition(() => {
        callbackRef.current(...(trailingArgsRef.current ?? []));
      });
      lastCallTimeRef.current = Date.now();
      trailingArgsRef.current = null;
    }
  }, [cancelThrottle]);

  // Schedule execution after the throttle interval
  const scheduleTrailing = useCallback((args: Parameters<T>) => {
    trailingArgsRef.current = args;

    const remainingTime = interval - (Date.now() - lastCallTimeRef.current);
    const delayTime = Math.max(0, remainingTime);

    if (useRAF) {
      timeoutIdRef.current = requestAnimationFrame(() => {
        timeoutIdRef.current = null;
        isThrottledRef.current = false;
        lastCallTimeRef.current = Date.now();

        if (trailingArgsRef.current !== null) {
          React.startTransition(() => {
            callbackRef.current(...(trailingArgsRef.current ?? []));
          });
          trailingArgsRef.current = null;
        }
      });
    } else {
      timeoutIdRef.current = setTimeout(() => {
        timeoutIdRef.current = null;
        isThrottledRef.current = false;
        lastCallTimeRef.current = Date.now();

        if (trailingArgsRef.current !== null) {
          React.startTransition(() => {
            callbackRef.current(...(trailingArgsRef.current ?? []));
          });
          trailingArgsRef.current = null;
        }
      }, delayTime);
    }
  }, [interval, useRAF]);

  // The actual throttled function
  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const isFirstCall = lastCallTimeRef.current === 0;

    // Cancel any scheduled trailing invocation when called again
    if (timeoutIdRef.current !== null) {
      if (trailing) {
        // Update trailing args to the latest call
        trailingArgsRef.current = args;
      } else {
        // If not using trailing edge execution, cancel the timeout
        cancelThrottle();
      }
    }

    // Execute immediately if:
    // 1. This is the first call, and leading execution is enabled
    // 2. Enough time has passed since the last call
    // 3. Leading execution is enabled
    if ((isFirstCall && leading) || (timeSinceLastCall >= interval && !isThrottledRef.current)) {
      lastCallTimeRef.current = now;
      isThrottledRef.current = true;

      // Execute immediately with startTransition
      React.startTransition(() => {
        callbackRef.current(...args);
      });

      // Schedule trailing edge execution if needed
      if (trailing) {
        scheduleTrailing(args);
      } else {
        // Set up a timeout to reset throttled state
        if (useRAF) {
          timeoutIdRef.current = requestAnimationFrame(() => {
            timeoutIdRef.current = null;
            isThrottledRef.current = false;
          });
        } else {
          timeoutIdRef.current = setTimeout(() => {
            timeoutIdRef.current = null;
            isThrottledRef.current = false;
          }, interval);
        }
      }
    } else if (trailing && timeoutIdRef.current === null) {
      // If not executing immediately but using trailing edge, schedule execution
      scheduleTrailing(args);
    }
  }, [interval, leading, trailing, useRAF, cancelThrottle, scheduleTrailing]);

  // Clean up on unmount
  useEffect(() => {
    return cancelThrottle;
  }, [cancelThrottle]);

  return {
    callback: throttledCallback,
    cancel: cancelThrottle,
    flush: flushThrottle
  };
}

export function useSafeCallback<T extends (...args: AnyParams) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  // Track component mount state
  const isMountedRef = useRef(false);

  // Create an AbortController ref for cancelling in-flight operations
  const abortControllerRef = useRef<AbortController | null>(null);

  // Setup mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Cancel any pending operations on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounted');
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Store the latest callback in a ref
  const callbackRef = useRef(callback);

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Create the safe callback with proper error handling
  return useCallback((...args: Parameters<T>) => {
    // Ensure component is still mounted
    if (!isMountedRef.current) {
      return;
    }

    // Cancel any previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Operation superseded');
    }

    // Create a new AbortController for this operation
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      // Execute the callback within a startTransition for concurrency
      React.startTransition(() => {
        // Pass the AbortSignal if the callback accepts it
        const result = callbackRef.current(...args);

        // Handle promise results
        if (result instanceof Promise) {
          result
            .then((value) => {
              // Check if component is still mounted and operation wasn't aborted
              if (isMountedRef.current && !signal.aborted) {
                return value;
              }
              return value; // Add missing return statement
            })
            .catch((error) => {
              // Only handle errors if component is still mounted
              if (isMountedRef.current) {
                handleCallbackError(error, {
                  callback: callbackRef.current,
                  args,
                  context: 'useSafeCallback'
                });
              }
            });
        }
      });
    } catch (error) {
      // Handle synchronous errors
      handleCallbackError(error, {
        callback: callbackRef.current,
        args,
        context: 'useSafeCallback'
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]) as T;
}


export function useDeferredCallback<T extends (...args: AnyParams) => unknown>(
  callback: T,
  options: {
    priority?: 'default' | 'high' | 'low';
    queueing?: 'replace' | 'append' | 'ignore';
    errorBoundary?: boolean;
  } = {}
): {
  callback: (...args: Parameters<T>) => void;
  cancel: () => void;
  pending: () => boolean;
  prioritize: () => void;
} {
  const {
    priority = 'default',
    queueing = 'replace',
    errorBoundary = true
  } = options;

  // Track component mount state
  const isMountedRef = useRef(false);

  // Store the latest callback to avoid stale closures
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback]);

  // Track pending state
  const isPendingRef = useRef(false);

  // Queue for pending executions (for 'append' mode)
  const queueRef = useRef<Parameters<T>[]>([]);

  // AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Set up mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Cancel any pending operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounted');
        abortControllerRef.current = null;
      }

      // Clear queue
      queueRef.current = [];
    };
  }, []);

  // Cancel any pending execution
  const cancelPending = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Operation cancelled');
      abortControllerRef.current = null;
    }
    isPendingRef.current = false;
    queueRef.current = [];
  }, []);

  // Check if any operation is pending
  const checkPending = useCallback(() => {
    return isPendingRef.current;
  }, []);

  // Elevate priority of pending operation
  const prioritizePending = useCallback(() => {
    // In future React versions, we could implement priority elevation
    // Currently, we'll just create a new high-priority execution
    if (isPendingRef.current && queueRef.current.length > 0) {
      // Cancel current operation
      cancelPending();

      // Execute last queued item with high priority
      const lastArgs = queueRef.current[queueRef.current.length - 1];
      executeDeferred(lastArgs, 'high');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelPending]);

  // Execute the callback with deferred scheduling
  const executeDeferred = useCallback((args: Parameters<T> | undefined, executionPriority: 'default' | 'high' | 'low' = priority) => {
    if (!isMountedRef.current || !args) return;

    isPendingRef.current = true;

    // Create new AbortController for this execution
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Superseded by new execution');
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Execute with startTransition for concurrency
    React.startTransition(() => {
      if (!isMountedRef.current || signal.aborted) return;

      try {
        // Execute the callback, passing the abort signal if possible
        const result = callbackRef.current(...args);

        // Handle promises
        if (result instanceof Promise) {
          // Mark as void to avoid floating promise issues
          void result
            .then((value) => {
              if (!isMountedRef.current || signal.aborted) return value;

              // Process next item in queue if any
              if (queueRef.current.length > 0 && queueRef.current[0]) {
                const nextArgs = queueRef.current.shift() ?? args;
                executeDeferred(nextArgs, executionPriority);
              } else {
                isPendingRef.current = false;
              }

              return value;
            })
            .catch((error) => {
              if (!isMountedRef.current) return;

              isPendingRef.current = false;

              if (errorBoundary) {
                handleCallbackError(error, {
                  callback: callbackRef.current,
                  args,
                  context: 'useDeferredCallback'
                });
              } else {
                throw error; // Let error boundary handle it
              }
            });
        } else {
          // Handle synchronous execution
          if (queueRef.current.length > 0) {
            const nextArgs = queueRef.current.shift();
            if (nextArgs) {
              executeDeferred(nextArgs, executionPriority);
            }
          } else {
            isPendingRef.current = false;
          }
        }
      } catch (error) {
        isPendingRef.current = false;

        if (errorBoundary) {
          handleCallbackError(error, {
            callback: callbackRef.current,
            args,
            context: 'useDeferredCallback'
          });
        } else {
          throw error; // Let error boundary handle it
        }
      }
    });
  }, [priority, errorBoundary]);

  // Create the deferred callback
  const deferredCallback = useCallback((...args: Parameters<T>) => {
    if (!isMountedRef.current) return;

    if (isPendingRef.current) {
      // Handle based on queueing strategy
      switch (queueing) {
        case 'replace':
          // Clear the queue and add this execution
          queueRef.current = [args];
          break;

        case 'append':
          // Add to the queue
          queueRef.current.push(args);
          break;

        case 'ignore':
          // Ignore if already pending
          break;
      }
    } else {
      // Execute immediately if nothing is pending
      executeDeferred(args);
    }
  }, [executeDeferred, queueing]);

  return {
    callback: deferredCallback,
    cancel: cancelPending,
    pending: checkPending,
    prioritize: prioritizePending
  };
}
