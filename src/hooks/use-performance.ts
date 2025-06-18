import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

export function usePerformanceMonitor(pageName: string) {
  const renderStartTime = useRef<number>(Date.now());

  useEffect(() => {
    // Mark render complete
    const renderTime = Date.now() - renderStartTime.current;
    
    // Log performance metrics for monitoring
    if (renderTime > 1000) {
      logger.warn('Slow page render detected', {
        pageName,
        renderTime,
        threshold: 1000,
        category: 'performance'
      });
    } else if (process.env.NODE_ENV === 'development') {
      logger.debug('Page render completed', {
        pageName,
        renderTime,
        category: 'performance'
      });
    }
  }, [pageName]);

  const measureApiCall = async <T>(
    apiCall: () => Promise<T>,
    apiName: string
  ): Promise<T> => {
    const start = Date.now();
    try {
      const result = await apiCall();
      const duration = Date.now() - start;
      
      if (duration > 2000) {
        logger.warn('Slow API call detected', {
          apiName,
          duration,
          threshold: 2000,
          category: 'api-performance'
        });
      } else if (process.env.NODE_ENV === 'development') {
        logger.debug('API call completed', {
          apiName,
          duration,
          category: 'api-performance'
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('API call failed', error, {
        apiName,
        duration,
        category: 'api-error'
      });
      throw error;
    }
  };

  return { measureApiCall };
}

// Web Vitals monitoring
export function reportWebVitals() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const {name} = entry;
        const value = Math.round(entry.startTime + entry.duration);
        
        // Log web vitals metrics
        const webVitalData = {
          metric: name,
          value,
          category: 'web-vitals',
          userAgent: navigator.userAgent,
          url: window.location.pathname
        };
        
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Web Vitals metric recorded', webVitalData);
        }
        
        // Log performance warnings for metrics above thresholds
        const getThreshold = (metricName: string): number | undefined => {
          switch (metricName) {
            case 'largest-contentful-paint': return 2500;
            case 'first-input-delay': return 100;
            case 'cumulative-layout-shift': return 0.1;
            default: return undefined;
          }
        };
        
        const threshold = getThreshold(name);
        if (threshold && value > threshold) {
          logger.warn('Web Vitals threshold exceeded', {
            ...webVitalData,
            threshold,
            exceedsBy: value - threshold
          });
        }
      });
    });

    try {
      observer.observe({ 
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] 
      });
    } catch (error) {
      // Fallback for older browsers
      logger.warn('Performance Observer not supported', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userAgent: navigator.userAgent,
        category: 'web-vitals-fallback'
      });
    }
  }
}
