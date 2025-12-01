/**
 * Prisma Client singleton instance
 * Configured with connection timeout for better resilience
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

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

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrlWithTimeout()
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

