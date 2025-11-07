/**
 * Temporary compatibility layer after Prisma removal.
 * This module provides stub implementations that throw clear errors
 * or return minimal in-memory data to keep the app bootable.
 * 
 * TODO: Replace with actual database client in Phase 3
 */

// Blog model type (matching Prisma schema)
export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  isFeatured: boolean;
  readingMinutes: number;
  publishedAt: Date;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

// Minimal in-memory store for basic read operations
const mockBlogs: Blog[] = [];

class PrismaClientStub {
  blog = {
    findMany: async (options?: { where?: any; orderBy?: any; skip?: number; take?: number }): Promise<Blog[]> => {
      console.warn('[DB Stub] findMany called - returning empty array (Prisma removed)');
      return [];
    },

    findUnique: async (options: { where: { slug?: string; id?: string } }): Promise<Blog | null> => {
      console.warn('[DB Stub] findUnique called - returning null (Prisma removed)');
      return null;
    },

    count: async (options?: { where?: any }): Promise<number> => {
      console.warn('[DB Stub] count called - returning 0 (Prisma removed)');
      return 0;
    },

    create: async (options: { data: any }): Promise<Blog> => {
      throw new Error('Not implemented - Prisma removed. Database operations disabled in Phase 1.');
    },

    update: async (options: { where: { id: string }; data: any }): Promise<Blog> => {
      throw new Error('Not implemented - Prisma removed. Database operations disabled in Phase 1.');
    },

    delete: async (options: { where: { id: string } }): Promise<void> => {
      throw new Error('Not implemented - Prisma removed. Database operations disabled in Phase 1.');
    },

    deleteMany: async (): Promise<void> => {
      console.warn('[DB Stub] deleteMany called - no-op (Prisma removed)');
    },
  };

  $disconnect: async (): Promise<void> => {
    console.warn('[DB Stub] $disconnect called - no-op (Prisma removed)');
  };
}

// Singleton instance (matching Prisma pattern)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientStub | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClientStub();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


