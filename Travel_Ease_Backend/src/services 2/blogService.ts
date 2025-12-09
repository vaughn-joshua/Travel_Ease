/**
 * Blog Service
 * 
 * Business logic for blog operations extracted from routes.
 * Routes should use these functions and handle HTTP request/response.
 */

import { prisma, executeWithRetry, parsePagination, buildPaginationMeta } from '../lib/prismaHelpers.js';
import { cacheResult, buildCacheKey, invalidateCachePattern } from '../lib/cache.js';

// ============================================================================
// Types / DTOs
// ============================================================================

export interface BlogDTO {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImageUrl?: string | null;
  category?: string | null;
  isFeatured: boolean;
  readingMinutes?: number | null;
  author?: string | null;
  user_id?: number | null;
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BlogListItemDTO {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  category: string | null;
  isFeatured: boolean;
  readingMinutes: number | null;
  publishedAt: Date | null;
  author: string | null;
  updatedAt: Date;
}

export interface CreateBlogInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  category?: string;
  isFeatured?: boolean;
  readingMinutes?: number;
  author?: string;
  publishedAt?: string;
}

export interface UpdateBlogInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImageUrl?: string;
  category?: string;
  isFeatured?: boolean;
  readingMinutes?: number;
  author?: string;
  publishedAt?: string;
}

export interface BlogFilters {
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Cache TTLs (in seconds)
const CACHE_TTL = {
  OVERVIEW: 60,      // 1 minute for blog overview
  FEATURED: 120,     // 2 minutes for featured blogs
  LIST: 30,          // 30 seconds for paginated lists
};

// Slim attributes for list views
const listSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  category: true,
  isFeatured: true,
  readingMinutes: true,
  publishedAt: true,
  author: true,
  updatedAt: true
};

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get paginated list of blogs with optional filtering
 */
export async function getBlogs(filters: BlogFilters): Promise<PaginatedResult<BlogListItemDTO>> {
  const { category, q } = filters;
  const { page, pageSize, skip, take } = parsePagination(filters);

  // Build where clause
  const where: Record<string, unknown> = {};
  if (category) {
    where.category = category;
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } }
    ];
  }

  const [blogs, total] = await executeWithRetry(() =>
    Promise.all([
      prisma.blog.findMany({
        where,
        select: listSelect,
        orderBy: { publishedAt: 'desc' },
        skip,
        take
      }),
      prisma.blog.count({ where })
    ])
  );

  return {
    items: blogs as BlogListItemDTO[],
    ...buildPaginationMeta(total, page, pageSize)
  };
}

/**
 * Get featured blogs (cached)
 */
export async function getFeaturedBlogs(): Promise<{ blogs: BlogListItemDTO[]; fromCache: boolean; cacheBackend: string }> {
  const { data: blogs, fromCache, cacheBackend } = await cacheResult({
    key: buildCacheKey('blogs', 'featured'),
    ttl: CACHE_TTL.FEATURED,
    fetchFn: () => executeWithRetry(() =>
      prisma.blog.findMany({
        where: { isFeatured: true },
        select: listSelect,
        orderBy: { publishedAt: 'desc' },
        take: 5
      })
    )
  });

  return { blogs: blogs as BlogListItemDTO[], fromCache, cacheBackend };
}

/**
 * Get blog overview data (cached) - aggregated endpoint for Blogs page
 */
export async function getBlogOverview(): Promise<{
  data: {
    featured: BlogListItemDTO[];
    destinations: BlogListItemDTO[];
    tips: BlogListItemDTO[];
    clientEducation: BlogListItemDTO[];
  };
  fromCache: boolean;
  cacheBackend: string;
}> {
  const { data: payload, fromCache, cacheBackend } = await cacheResult({
    key: buildCacheKey('blogs', 'overview'),
    ttl: CACHE_TTL.OVERVIEW,
    fetchFn: async () => {
      const [featured, destinations, tips, clientEducation] = await executeWithRetry(() =>
        Promise.all([
          prisma.blog.findMany({
            where: { isFeatured: true },
            select: listSelect,
            orderBy: { publishedAt: 'desc' },
            take: 5
          }),
          prisma.blog.findMany({
            where: { category: 'Destinations' },
            select: listSelect,
            orderBy: { publishedAt: 'desc' },
            take: 3
          }),
          prisma.blog.findMany({
            where: { category: 'Tips' },
            select: listSelect,
            orderBy: { publishedAt: 'desc' },
            take: 3
          }),
          prisma.blog.findMany({
            where: { category: 'Client Education' },
            select: listSelect,
            orderBy: { publishedAt: 'desc' },
            take: 3
          })
        ])
      );

      return { featured, destinations, tips, clientEducation };
    }
  });

  return {
    data: payload as {
      featured: BlogListItemDTO[];
      destinations: BlogListItemDTO[];
      tips: BlogListItemDTO[];
      clientEducation: BlogListItemDTO[];
    },
    fromCache,
    cacheBackend
  };
}

/**
 * Get single blog by slug
 */
export async function getBlogBySlug(slug: string): Promise<BlogDTO | null> {
  const blog = await executeWithRetry(() =>
    prisma.blog.findUnique({ where: { slug } })
  );

  return blog as BlogDTO | null;
}

/**
 * Get single blog by ID
 */
export async function getBlogById(id: string): Promise<BlogDTO | null> {
  const blog = await executeWithRetry(() =>
    prisma.blog.findUnique({ where: { id } })
  );

  return blog as BlogDTO | null;
}

/**
 * Create a new blog
 */
export async function createBlog(input: CreateBlogInput, userId: number): Promise<BlogDTO> {
  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date();

  const blog = await executeWithRetry(() =>
    prisma.blog.create({
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt || '',
        content: input.content,
        coverImageUrl: input.coverImageUrl || '',
        category: input.category || 'Uncategorized',
        isFeatured: input.isFeatured ?? false,
        readingMinutes: input.readingMinutes || 5,
        author: input.author || 'Anonymous',
        user_id: userId,
        publishedAt
      }
    })
  );

  // Invalidate blog caches after create
  await invalidateCachePattern('blogs:');

  return blog as BlogDTO;
}

/**
 * Update an existing blog
 */
export async function updateBlog(id: string, input: UpdateBlogInput): Promise<BlogDTO> {
  const updateData: Record<string, unknown> = { ...input };
  if (input.publishedAt) {
    updateData.publishedAt = new Date(input.publishedAt);
  }

  const updatedBlog = await executeWithRetry(() =>
    prisma.blog.update({
      where: { id },
      data: updateData
    })
  );

  // Invalidate blog caches after update
  await invalidateCachePattern('blogs:');

  return updatedBlog as BlogDTO;
}

/**
 * Delete a blog
 */
export async function deleteBlog(id: string): Promise<void> {
  await executeWithRetry(() =>
    prisma.blog.delete({ where: { id } })
  );

  // Invalidate blog caches after delete
  await invalidateCachePattern('blogs:');
}

/**
 * Check if user owns a blog
 */
export async function userOwnsBlog(blogId: string, userId: number): Promise<boolean> {
  const blog = await getBlogById(blogId);
  return blog?.user_id === userId;
}

