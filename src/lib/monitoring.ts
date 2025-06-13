/**
 * External monitoring service integration
 * Supports Sentry and Honeybadger for error tracking and performance monitoring
 */

import { logger } from './secure-logger';
import { env, getLoggingConfig, isProduction } from './env-validation';

export interface MonitoringConfig {
  service: 'sentry' | 'honeybadger';
  dsn?: string;
  apiKey?: string;
  environment: string;
  release?: string;
  beforeSend?: (event: Record<string, unknown>) => Record<string, unknown> | null;
}

export interface ErrorContext {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  request?: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
  };
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
  level?: 'error' | 'warning' | 'info' | 'debug';
}

/**
 * Abstract monitoring client
 */
export abstract class MonitoringClient {
  protected config: MonitoringConfig;
  
  constructor(config: MonitoringConfig) {
    this.config = config;
  }
  
  abstract initialize(): Promise<void>;
  abstract captureError(error: Error, context?: ErrorContext): Promise<void>;
  abstract captureMessage(message: string, context?: ErrorContext): Promise<void>;
  abstract setUser(user: { id: string; email?: string; role?: string }): void;
  abstract addBreadcrumb(message: string, category?: string, level?: string): void;
  abstract flush(timeout?: number): Promise<void>;
}

/**
 * Sentry monitoring client
 */
export class SentryClient extends MonitoringClient {
  private sentry: {
    captureException: (error: Error, options?: Record<string, unknown>) => void;
    captureMessage: (message: string, options?: Record<string, unknown>) => void;
    setUser: (user: Record<string, unknown>) => void;
    addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
    flush: (timeout?: number) => Promise<void>;
  } | null = null;
  
  async initialize(): Promise<void> {
    if (!this.config.dsn) {
      throw new Error('Sentry DSN is required');
    }
    
    try {
      // Dynamic import to avoid requiring Sentry in development
      const sentryModule = await import('@sentry/nextjs').catch(() => {
        logger.warn('Sentry package not available. Install with: npm install @sentry/nextjs');
        return null;
      });
      
      if (!sentryModule) {
        throw new Error('Sentry package not available');
      }
      
      const { init, captureException, captureMessage, setUser, addBreadcrumb, flush } = sentryModule;
      
      init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        tracesSampleRate: isProduction ? 0.1 : 1.0,
        beforeSend: this.config.beforeSend || this.defaultBeforeSend,
        integrations: [
          // Add performance monitoring for API routes
        ],
      });
      
      this.sentry = { captureException, captureMessage, setUser, addBreadcrumb, flush };
      logger.info('Sentry monitoring initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Sentry', { error });
      throw error;
    }
  }
  
  async captureError(error: Error, context?: ErrorContext): Promise<void> {
    if (!this.sentry) return;
    
    try {
      if (context?.user) {
        this.sentry.setUser(context.user);
      }
      
      this.sentry.captureException(error, {
        tags: context?.tags,
        extra: context?.extra,
        level: context?.level || 'error',
        contexts: {
          request: context?.request,
        },
      });
    } catch (err) {
      logger.error('Failed to capture error in Sentry', { error: err });
    }
  }
  
  async captureMessage(message: string, context?: ErrorContext): Promise<void> {
    if (!this.sentry) return;
    
    try {
      if (context?.user) {
        this.sentry.setUser(context.user);
      }
      
      this.sentry.captureMessage(message, {
        tags: context?.tags,
        extra: context?.extra,
        level: context?.level || 'info',
        contexts: {
          request: context?.request,
        },
      });
    } catch (err) {
      logger.error('Failed to capture message in Sentry', { error: err });
    }
  }
  
  setUser(user: { id: string; email?: string; role?: string }): void {
    if (!this.sentry) return;
    
    try {
      this.sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      logger.error('Failed to set user in Sentry', { error: err });
    }
  }
  
  addBreadcrumb(message: string, category = 'custom', level = 'info'): void {
    if (!this.sentry) return;
    
    try {
      this.sentry.addBreadcrumb({
        message,
        category,
        level,
        timestamp: Date.now() / 1000,
      });
    } catch (err) {
      logger.error('Failed to add breadcrumb in Sentry', { error: err });
    }
  }
  
  async flush(_timeout = 5000): Promise<void> {
    if (!this.sentry) return;
    
    try {
      await this.sentry.flush(_timeout);
    } catch (err) {
      logger.error('Failed to flush Sentry', { error: err });
    }
  }
  
  private defaultBeforeSend = (event: Record<string, unknown>) => {
    // Filter out sensitive data
    if (event.exception) {
      const exception = (event.exception as { values?: Array<{ value?: string }> }).values?.[0];
      if (exception?.value?.includes('password') || 
          exception?.value?.includes('token') ||
          exception?.value?.includes('secret')) {
        return null; // Don't send sensitive errors
      }
    }
    
    // Remove sensitive headers
    if (event.request && typeof event.request === 'object') {
      const request = event.request as { headers?: Record<string, unknown> };
      if (request.headers && typeof request.headers === 'object') {
        delete request.headers.authorization;
        delete request.headers.cookie;
        delete request.headers['x-api-key'];
      }
    }
    
    return event;
  };
}

/**
 * Honeybadger monitoring client
 */
export class HoneybadgerClient extends MonitoringClient {
  private honeybadger: {
    notify: (error: Error, options?: Record<string, unknown>) => void;
    setContext: (context: Record<string, unknown>) => void;
    addBreadcrumb: (message: string, options?: Record<string, unknown>) => void;
  } | null = null;
  
  async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Honeybadger API key is required');
    }
    
    try {
      // Dynamic import to avoid requiring Honeybadger in development
      const honeybadgerModule = await import('@honeybadger-io/js').catch(() => {
        logger.warn('Honeybadger package not available. Install with: npm install @honeybadger-io/js');
        return null;
      });
      
      if (!honeybadgerModule) {
        throw new Error('Honeybadger package not available');
      }
      
      const Honeybadger = honeybadgerModule.default;
      
      Honeybadger.configure({
        apiKey: this.config.apiKey,
        environment: this.config.environment,
        revision: this.config.release,
        beforeNotify: this.config.beforeSend || this.defaultBeforeNotify,
      });
      
      this.honeybadger = Honeybadger;
      logger.info('Honeybadger monitoring initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Honeybadger', { error });
      throw error;
    }
  }
  
  async captureError(error: Error, context?: ErrorContext): Promise<void> {
    if (!this.honeybadger) return;
    
    try {
      if (context?.user) {
        this.honeybadger.setContext({
          user: context.user,
        });
      }
      
      this.honeybadger.notify(error, {
        context: {
          ...context?.extra,
          request: context?.request,
        },
        tags: context?.tags && Array.isArray(Object.values(context.tags)) ? Object.values(context.tags).join(',') : undefined,
      });
    } catch (err) {
      logger.error('Failed to capture error in Honeybadger', { error: err });
    }
  }
  
  async captureMessage(message: string, context?: ErrorContext): Promise<void> {
    if (!this.honeybadger) return;
    
    try {
      if (context?.user) {
        this.honeybadger.setContext({
          user: context.user,
        });
      }
      
      this.honeybadger.notify(new Error(message), {
        context: {
          ...context?.extra,
          request: context?.request,
        },
        tags: context?.tags && Array.isArray(Object.values(context.tags)) ? Object.values(context.tags).join(',') : undefined,
      });
    } catch (err) {
      logger.error('Failed to capture message in Honeybadger', { error: err });
    }
  }
  
  setUser(user: { id: string; email?: string; role?: string }): void {
    if (!this.honeybadger) return;
    
    try {
      this.honeybadger.setContext({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      logger.error('Failed to set user in Honeybadger', { error: err });
    }
  }
  
  addBreadcrumb(message: string, category = 'custom', level = 'info'): void {
    if (!this.honeybadger) return;
    
    try {
      this.honeybadger.addBreadcrumb(message, {
        category,
        metadata: {
          level,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      logger.error('Failed to add breadcrumb in Honeybadger', { error: err });
    }
  }
  
  async flush(_timeout = 5000): Promise<void> {
    // Honeybadger doesn't have a flush method, notifications are sent immediately
    return Promise.resolve();
  }
  
  private defaultBeforeNotify = (notice: Record<string, unknown>) => {
    // Filter out sensitive data
    const message = notice.message as string | undefined;
    if (message && typeof message === 'string' && (
        message.includes('password') || 
        message.includes('token') ||
        message.includes('secret'))) {
      return false; // Don't send sensitive errors
    }
    
    // Remove sensitive context
    if (notice.context && typeof notice.context === 'object') {
      const context = notice.context as { request?: { headers?: Record<string, unknown> } };
      if (context.request && context.request.headers && typeof context.request.headers === 'object') {
        delete context.request.headers.authorization;
        delete context.request.headers.cookie;
        delete context.request.headers['x-api-key'];
      }
    }
    
    return true;
  };
}

/**
 * No-op monitoring client for development/testing
 */
export class NoOpMonitoringClient extends MonitoringClient {
  async initialize(): Promise<void> {
    logger.info('Using no-op monitoring client');
  }
  
  async captureError(error: Error, context?: ErrorContext): Promise<void> {
    logger.error('Monitoring (no-op): Error captured', { 
      error: error.message, 
      context: context?.extra 
    });
  }
  
  async captureMessage(message: string, context?: ErrorContext): Promise<void> {
    logger.info('Monitoring (no-op): Message captured', { 
      message, 
      context: context?.extra 
    });
  }
  
  setUser(user: { id: string; email?: string; role?: string }): void {
    logger.debug('Monitoring (no-op): User set', { userId: user.id });
  }
  
  addBreadcrumb(message: string, category = 'custom', level = 'info'): void {
    logger.debug('Monitoring (no-op): Breadcrumb added', { message, category, level });
  }
  
  async flush(_timeout = 5000): Promise<void> {
    return Promise.resolve();
  }
}

// Global monitoring client instance
let monitoringClient: MonitoringClient | null = null;

/**
 * Create monitoring client based on configuration
 */
export async function createMonitoringClient(): Promise<MonitoringClient> {
  if (monitoringClient) return monitoringClient;
  
  const config = getLoggingConfig();
  
  // Use Sentry if configured
  if (config.sentry?.dsn) {
    monitoringClient = new SentryClient({
      service: 'sentry',
      dsn: config.sentry.dsn,
      environment: env.NODE_ENV,
      release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    });
    await monitoringClient.initialize();
    return monitoringClient;
  }
  
  // Use Honeybadger if configured
  if (config.honeybadger?.apiKey) {
    monitoringClient = new HoneybadgerClient({
      service: 'honeybadger',
      apiKey: config.honeybadger.apiKey,
      environment: env.NODE_ENV,
      release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    });
    await monitoringClient.initialize();
    return monitoringClient;
  }
  
  // Fall back to no-op client
  monitoringClient = new NoOpMonitoringClient({
    service: 'sentry', // Doesn't matter for no-op
    environment: env.NODE_ENV,
  });
  await monitoringClient.initialize();
  
  return monitoringClient;
}

/**
 * Get the global monitoring client
 */
export async function getMonitoringClient(): Promise<MonitoringClient> {
  if (!monitoringClient) {
    return await createMonitoringClient();
  }
  return monitoringClient;
}

/**
 * Convenience functions for monitoring
 */
export const monitoring = {
  async captureError(error: Error, context?: ErrorContext): Promise<void> {
    const client = await getMonitoringClient();
    return client.captureError(error, context);
  },
  
  async captureMessage(message: string, context?: ErrorContext): Promise<void> {
    const client = await getMonitoringClient();
    return client.captureMessage(message, context);
  },
  
  async setUser(user: { id: string; email?: string; role?: string }): Promise<void> {
    const client = await getMonitoringClient();
    return client.setUser(user);
  },
  
  async addBreadcrumb(message: string, category?: string, level?: string): Promise<void> {
    const client = await getMonitoringClient();
    return client.addBreadcrumb(message, category, level);
  },
  
  async flush(timeout?: number): Promise<void> {
    const client = await getMonitoringClient();
    return client.flush(timeout);
  },
};

/**
 * Error boundary for catching and reporting unhandled errors
 */
export function setupGlobalErrorHandling(): void {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled promise rejection', { error: error.message, stack: error.stack });
    
    await monitoring.captureError(error, {
      tags: { type: 'unhandledRejection' },
      extra: { promise: promise.toString() },
    });
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error: Error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    
    await monitoring.captureError(error, {
      tags: { type: 'uncaughtException' },
    });
    
    // Flush monitoring and exit gracefully
    await monitoring.flush(2000);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    await monitoring.captureMessage(`Application shutting down: ${signal}`, {
      level: 'info',
      tags: { type: 'shutdown' },
    });
    
    await monitoring.flush(5000);
    process.exit(0);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Initialize global error handling in production
if (isProduction) {
  setupGlobalErrorHandling();
}