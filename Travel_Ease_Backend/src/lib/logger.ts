/**
 * Structured Logger Module
 * 
 * Provides structured logging using Pino for better observability.
 * 
 * Usage:
 *   import { logger, dbLogger, authLogger } from './lib/logger.js';
 *   
 *   logger.info({ userId: 123 }, 'User logged in');
 *   dbLogger.warn({ query: 'SELECT...', duration: 150 }, 'Slow query detected');
 *   authLogger.error({ email: 'user@example.com' }, 'Authentication failed');
 * 
 * Log Levels (in order of severity):
 *   - fatal: System is unusable
 *   - error: Error conditions
 *   - warn: Warning conditions  
 *   - info: Informational messages
 *   - debug: Debug-level messages
 *   - trace: Very detailed tracing
 */

import pino from 'pino';

// Determine log level from environment
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_TEST = process.env.NODE_ENV === 'test';

// Base logger configuration
const baseConfig: pino.LoggerOptions = {
  level: IS_TEST ? 'silent' : LOG_LEVEL,
  base: {
    service: 'travel-ease-backend',
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
};

// In development, use pino-pretty for human-readable output
// In production, use JSON format for log aggregation tools
const transportConfig = !IS_PRODUCTION && !IS_TEST ? {
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,service,env',
    },
  },
} : {};

// Create the main logger instance
export const logger = pino({
  ...baseConfig,
  ...transportConfig,
});

// ============================================================================
// Child Loggers for Specific Modules
// ============================================================================

/**
 * Database operations logger
 * Use for Prisma queries, connection issues, slow queries
 */
export const dbLogger = logger.child({ module: 'database' });

/**
 * Authentication logger
 * Use for login attempts, token validation, auth errors
 */
export const authLogger = logger.child({ module: 'auth' });

/**
 * Cache operations logger
 * Use for cache hits/misses, Redis operations
 */
export const cacheLogger = logger.child({ module: 'cache' });

/**
 * HTTP request logger
 * Use for incoming requests, responses, middleware
 */
export const httpLogger = logger.child({ module: 'http' });

/**
 * Business logic logger
 * Use for domain-specific operations
 */
export const businessLogger = logger.child({ module: 'business' });

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a request-scoped logger with request ID
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

/**
 * Log error with full stack trace
 */
export function logError(err: Error, context?: Record<string, unknown>) {
  logger.error({
    err: {
      message: err.message,
      name: err.name,
      stack: err.stack,
    },
    ...context,
  }, err.message);
}

/**
 * Log a slow database query
 */
export function logSlowQuery(query: string, duration: number, threshold = 100) {
  if (duration > threshold) {
    dbLogger.warn({
      query: query.slice(0, 500), // Truncate long queries
      duration,
      threshold,
    }, 'Slow query detected');
  }
}

/**
 * Log cache operation
 */
export function logCacheOperation(
  operation: 'hit' | 'miss' | 'set' | 'delete' | 'invalidate',
  key: string,
  backend?: 'redis' | 'memory'
) {
  cacheLogger.debug({
    operation,
    key,
    backend,
  }, `Cache ${operation}`);
}

/**
 * Measure and log execution time of an async function
 */
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
  log: pino.Logger = logger
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    log.debug({ operation: name, duration }, `${name} completed`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    log.error({ operation: name, duration, error }, `${name} failed`);
    throw error;
  }
}

// ============================================================================
// Exports
// ============================================================================

export default logger;

