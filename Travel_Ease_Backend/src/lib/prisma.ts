/**
 * Prisma Client singleton instance
 * Configured with connection timeout and slow query logging
 */

import { PrismaClient } from '@prisma/client';
import { dbLogger, logSlowQuery } from './logger.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Slow query threshold in milliseconds
const SLOW_QUERY_THRESHOLD = 100;

// Parse DATABASE_URL to add connection timeout if not present
function getDatabaseUrlWithTimeout(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  
  // Add connection timeout parameters if not already present
  const hasTimeout = url.includes('connect_timeout') || url.includes('pool_timeout');
  if (hasTimeout) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  // 5 second connection timeout, 10 second pool timeout
  return `${url}${separator}connect_timeout=5&pool_timeout=10`;
}

// Determine log configuration based on environment
type LogLevel = 'query' | 'info' | 'warn' | 'error';
type LogDefinition = { emit: 'event' | 'stdout'; level: LogLevel };

const getLogConfig = (): (LogLevel | LogDefinition)[] => {
  if (process.env.NODE_ENV === 'test') {
    return ['error'];
  }
  if (process.env.NODE_ENV === 'development') {
    return [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ];
  }
  // Production: only log errors
  return ['error'];
};

// Create Prisma client with appropriate configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: getLogConfig(),
  datasources: {
    db: {
      url: getDatabaseUrlWithTimeout()
    }
  }
});

// Set up slow query logging in development
if (process.env.NODE_ENV === 'development' && !globalForPrisma.prisma) {
  // Type assertion for event handling
  const client = prisma as PrismaClient & {
    $on: (event: string, callback: (e: any) => void) => void;
  };
  
  client.$on('query', (e: { query: string; duration: number; params: string }) => {
    // Log all queries to debug logger
    dbLogger.debug({
      query: e.query.slice(0, 200),
      duration: e.duration,
    }, 'Query executed');
    
    // Log slow queries as warnings
    if (e.duration > SLOW_QUERY_THRESHOLD) {
      logSlowQuery(e.query, e.duration, SLOW_QUERY_THRESHOLD);
    }
  });
}

// Cache singleton in development/test to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  dbLogger.info('Disconnecting Prisma client');
  await prisma.$disconnect();
});

// Handle connection errors
prisma.$connect()
  .then(() => {
    dbLogger.info('Prisma client connected');
  })
  .catch((error) => {
    dbLogger.error({ err: error }, 'Failed to connect Prisma client');
  });

export default prisma;
