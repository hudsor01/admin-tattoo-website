import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  apiCallDuration: number;
}

export function usePerformanceMonitor(pageName: string) {
  const startTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(Date.now());

  useEffect(() => {
    // Mark render complete
    const renderTime = Date.now() - renderStartTime.current;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${pageName}:`, {
        renderTime: `${renderTime}ms`,
        timestamp: new Date().toISOString()
      });
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production' && renderTime > 1000) {
      // You could send this to analytics/monitoring service
      console.warn(`[Performance Warning] ${pageName} took ${renderTime}ms to render`);
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Performance] ${apiName}: ${duration}ms`);
      }
      
      if (duration > 2000) {
        console.warn(`[Slow API] ${apiName} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[API Error] ${apiName} failed after ${duration}ms:`, error);
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
        const name = entry.name;
        const value = Math.round(entry.startTime + entry.duration);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Web Vitals] ${name}: ${value}ms`);
        }
        
        // Send to analytics in production
        if (process.env.NODE_ENV === 'production') {
          // You could send to Google Analytics, DataDog, etc.
          if (value > 2500) { // LCP threshold
            console.warn(`[Web Vitals Warning] ${name}: ${value}ms`);
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // Fallback for older browsers
      console.log('Performance Observer not supported');
    }
  }
}
