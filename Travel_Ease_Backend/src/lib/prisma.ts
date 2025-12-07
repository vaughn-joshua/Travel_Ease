/**
 * Prisma Client singleton instance
 * Configured with connection timeout and slow query logging
 */

import { PrismaClient } from '@prisma/client';
import { dbLogger, logSlowQuery } from './logger.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Slow query threshold in milliseconds
const SLOW_QUERY_THRESHOLD = 100;

/**
 * Parse DATABASE_URL to add connection pool parameters if not present
 * 
 * Supabase connection pool recommendations:
 * - Free tier: ~10 connections max
 * - Pro tier: more available
 * 
 * Parameters added:
 * - connect_timeout: Time to wait for connection (5s)
 * - pool_timeout: Time to wait for pool slot (10s)
 * - connection_limit: Max connections in pool (configurable via env)
 * - statement_cache_size: Prepared statement cache (0 = disabled for pgbouncer compatibility)
 */
function getDatabaseUrlWithPoolConfig(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  
  // Check if pool params already present
  const hasPoolConfig = url.includes('connect_timeout') || 
                        url.includes('pool_timeout') ||
                        url.includes('connection_limit');
  if (hasPoolConfig) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  
  // Connection limit from env or default to 5 for safety (Supabase free tier friendly)
  const connectionLimit = process.env.DATABASE_POOL_SIZE || '5';
  
  // pgbouncer compatibility: disable prepared statement cache
  // This is important for Supabase's pgbouncer proxy
  const isPgBouncer = url.includes('pooler.supabase.com');
  const statementCache = isPgBouncer ? '&statement_cache_size=0' : '';
  
  return `${url}${separator}connect_timeout=5&pool_timeout=10&connection_limit=${connectionLimit}${statementCache}`;
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
      url: getDatabaseUrlWithPoolConfig()
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
