/**
 * Unified Logger
 *
 * This file provides a consistent logging interface that works across
 * both client and server environments.
 */

type LogMessage = string;
type LogData = unknown;

// Define the logger interface to ensure consistent use
interface LoggerInterface {
  error: (message: LogMessage, data?: LogData) => void;
  warn: (message: LogMessage, data?: LogData) => void;
  info: (message: LogMessage, data?: LogData) => void;
  http: (message: LogMessage, data?: LogData) => void;
  debug: (message: LogMessage, data?: LogData) => void;
}

// Shared logger implementation for both client and server
const consoleLogger: LoggerInterface = {
  error: (message: LogMessage, data?: LogData) => {
    if (data !== undefined) {
      console.error(`ERROR: ${message}`, data);
    } else {
      console.error(`ERROR: ${message}`);
    }
  },
  warn: (message: LogMessage, data?: LogData) => {
    if (data !== undefined) {
      console.warn(`WARN: ${message}`, data);
    } else {
      console.warn(`WARN: ${message}`);
    }
  },
  info: (message: LogMessage, data?: LogData) => {
    if (data !== undefined) {
      console.warn(`INFO: ${message}`, data);
    } else {
      console.warn(`INFO: ${message}`);
    }
  },
  http: (message: LogMessage, data?: LogData) => {
    if (data !== undefined) {
      console.warn(`HTTP: ${message}`, data);
    } else {
      console.warn(`HTTP: ${message}`);
    }
  },
  debug: (message: LogMessage, data?: LogData) => {
    // Only log debug messages in development
    if (process.env.NODE_ENV === 'development') {
      if (data !== undefined) {
        console.warn(`DEBUG: ${message}`, data);
      } else {
        console.warn(`DEBUG: ${message}`);
      }
    }
  },
};

/**
 * Enhanced server logger that adds timestamps
 * but still uses console to avoid dependencies
 */
const serverLogger: LoggerInterface = {
  error: (message: LogMessage, data?: LogData) => {
    const timestamp = new Date().toISOString();
    if (data !== undefined) {
      console.error(`[${timestamp}] ERROR: ${message}`, data);
    } else {
      console.error(`[${timestamp}] ERROR: ${message}`);
    }
  },
  warn: (message: LogMessage, data?: LogData) => {
    const timestamp = new Date().toISOString();
    if (data !== undefined) {
      console.warn(`[${timestamp}] WARN: ${message}`, data);
    } else {
      console.warn(`[${timestamp}] WARN: ${message}`);
    }
  },
  info: (message: LogMessage, data?: LogData) => {
    const timestamp = new Date().toISOString();
    if (data !== undefined) {
      console.warn(`[${timestamp}] INFO: ${message}`, data);
    } else {
      console.warn(`[${timestamp}] INFO: ${message}`);
    }
  },
  http: (message: LogMessage, data?: LogData) => {
    const timestamp = new Date().toISOString();
    if (data !== undefined) {
      console.warn(`[${timestamp}] HTTP: ${message}`, data);
    } else {
      console.warn(`[${timestamp}] HTTP: ${message}`);
    }
  },
  debug: (message: LogMessage, data?: LogData) => {
    // Only log debug messages in development
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      if (data !== undefined) {
        console.warn(`[${timestamp}] DEBUG: ${message}`, data);
      } else {
        console.warn(`[${timestamp}] DEBUG: ${message}`);
      }
    }
  },
};

// Create a proxy that will use the appropriate logger based on environment
const logger = new Proxy<LoggerInterface>({} as LoggerInterface, {
  get(_, prop) {
    // Determine if we're in a browser environment
    const isClient = typeof window !== 'undefined';

    // Use the appropriate logger
    const currentLogger = isClient ? consoleLogger : serverLogger;

    // Return the requested method
    return currentLogger[prop as keyof LoggerInterface];
  },
});

export { logger };
