/**
 * Type declarations for optional dependencies
 * These packages may not be installed, so we provide minimal type definitions
 */

declare module '@sentry/nextjs' {
  export function init(config: Record<string, unknown>): void;
  export function captureException(error: Error, options?: Record<string, unknown>): void;
  export function captureMessage(message: string, options?: Record<string, unknown>): void;
  export function setUser(user: Record<string, unknown>): void;
  export function addBreadcrumb(breadcrumb: Record<string, unknown>): void;
  export function flush(timeout?: number): Promise<void>;
}

declare module '@honeybadger-io/js' {
  interface HoneybadgerClient {
    configure(config: Record<string, unknown>): void;
    notify(error: Error | string, options?: Record<string, unknown>): void;
    setContext(context: Record<string, unknown>): void;
    addBreadcrumb(message: string, options?: Record<string, unknown>): void;
  }
  
  const Honeybadger: HoneybadgerClient;
  export default Honeybadger;
}

declare module 'redis' {
  export interface RedisClientType {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, options?: { EX?: number; PX?: number }): Promise<string | null>;
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<boolean>;
    del(key: string): Promise<number>;
    on(event: string, listener: (err?: unknown) => void): void;
  }

  export interface RedisClientOptions {
    url?: string;
    socket?: {
      host?: string;
      port?: number;
      connectTimeout?: number;
    };
    password?: string;
  }

  export function createClient(options?: RedisClientOptions): RedisClientType;
}