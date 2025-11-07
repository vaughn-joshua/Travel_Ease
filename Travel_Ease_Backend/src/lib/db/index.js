/**
 * Temporary compatibility layer after Prisma removal.
 * This module provides stub implementations that throw clear errors
 * or return minimal in-memory data to keep the app bootable.
 * 
 * TODO: Replace with actual database client in Phase 3
 */

// Blog model type (matching Prisma schema)

// Minimal in-memory store for basic read operations
const mockBlogs = [];
class PrismaClientStub {
  blog = {
    findMany: async options => {
      console.warn('[DB Stub] findMany called - returning empty array (Prisma removed)');
      return [];
    },
    findUnique: async options => {
      console.warn('[DB Stub] findUnique called - returning null (Prisma removed)');
      return null;
    },
    count: async options => {
      console.warn('[DB Stub] count called - returning 0 (Prisma removed)');
      return 0;
    },
    create: async options => {
      throw new Error('Not implemented - Prisma removed. Database operations disabled in Phase 1.');
    },
    update: async options => {
      throw new Error('Not implemented - Prisma removed. Database operations disabled in Phase 1.');
    },
    delete: async options => {
      throw new Error('Not implemented - Prisma removed. Database operations disabled in Phase 1.');
    },
    deleteMany: async () => {
      console.warn('[DB Stub] deleteMany called - no-op (Prisma removed)');
    }
  };
  $disconnect = async () => {
    console.warn('[DB Stub] $disconnect called - no-op (Prisma removed)');
  };
}

// Singleton instance (matching Prisma pattern)
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? new PrismaClientStub();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}