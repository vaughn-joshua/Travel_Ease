import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma, executeWithRetry, executeWithTimeout, handlePrismaError, parsePagination, buildPaginationMeta } from '../lib/prismaHelpers.js';
import { authenticateToken } from '../middleware/auth.js';
import { createBlogSchema, updateBlogSchema, blogQuerySchema, isValidBlogStatusTransition } from '../schemas/blogSchemas.js';
import { cacheResult, buildCacheKey, invalidateCachePattern } from '../lib/cache.js';
import RSSParser from 'rss-parser';

export const blogRoutes = Router();

// Cache TTLs (in seconds)
const CACHE_TTL = {
  OVERVIEW: 60,      // 1 minute for blog overview
  FEATURED: 120,     // 2 minutes for featured blogs
  LIST: 30,          // 30 seconds for paginated lists
  RSS: 300,          // 5 minutes for RSS feeds
};

/**
 * Middleware for blog operations
 * All authenticated users (Google or email/password) can create/edit/delete blogs
 */
const requireGoogleAuth = (req: Request, res: Response, next: NextFunction) => {
  // Allow all authenticated users to create/edit blogs
  // Authentication is already verified by authenticateToken middleware
  next();
};

/**
 * GET /api/blogs/rss-feed - CORS-safe RSS proxy (public)
 * 
 * Query params:
 *   url     - The external RSS/Atom feed URL (required, must start with http/https)
 *   limit   - Max number of items to return (optional, default 6, max 20)
 *   keyword - Optional keyword filter: only items whose title/excerpt/sourceName
 *             contain this string (case-insensitive) are returned
 * 
 * Returns: { items: RSSItem[], feedTitle: string, fromCache: boolean }
 * Cache key: rss:<url>:<keyword>   TTL: 5 minutes
 */
blogRoutes.get('/rss-feed', async (req: Request, res: Response) => {
  try {
    const { url, limit, keyword } = req.query;

    // Validate url param
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Query param "url" is required' });
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Query param "url" must start with http:// or https://' });
    }

    const maxItems = Math.min(Number(limit) || 6, 20);
    const kw = typeof keyword === 'string' && keyword.trim() ? keyword.trim().toLowerCase() : null;

    // Unique cache key per URL + keyword combination
    const cacheKey = buildCacheKey('rss', encodeURIComponent(url), kw ?? 'all');

    const { data: payload, fromCache, cacheBackend } = await cacheResult({
      key: cacheKey,
      ttl: CACHE_TTL.RSS,
      fetchFn: async () => {
        const parser = new RSSParser({
          timeout: 8000,
          headers: { 'User-Agent': 'TravelEase-RSS-Reader/1.0' },
          customFields: {
            item: [
              ['media:content', 'mediaContent'],
              ['media:thumbnail', 'mediaThumbnail'],
              ['enclosure', 'enclosure'],
              ['content:encoded', 'contentEncoded'],
            ],
          },
        });

        const feed = await parser.parseURL(url as string);

        // Fetch more items than needed so filtering doesn't exhaust the list
        const fetchLimit = kw ? Math.min(maxItems * 5, 100) : maxItems;

        // ── Step 1: Extract what we can from the RSS XML itself ───────────────
        const rawItems = (feed.items ?? []).slice(0, fetchLimit).map((item: any) => {
          let imageUrl: string | null = null;

          // Try RSS-embedded image fields first (fastest, no extra request)
          if (item.mediaContent?.$.url)       imageUrl = item.mediaContent.$.url;
          else if (item.mediaThumbnail?.$.url) imageUrl = item.mediaThumbnail.$.url;
          else if (item.enclosure?.url)        imageUrl = item.enclosure.url;
          else {
            // Try sniffing <img> from content:encoded or description HTML
            const htmlContent = item.contentEncoded || item.content || item.summary || '';
            const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch) imageUrl = imgMatch[1];
          }

          // Strip HTML from excerpt
          const rawExcerpt = item.contentSnippet || item.summary || '';
          const excerpt = rawExcerpt.replace(/<[^>]+>/g, '').slice(0, 200).trim();

          return {
            title: item.title ?? 'Untitled',
            link: item.link ?? '',
            pubDate: item.pubDate ?? item.isoDate ?? new Date().toISOString(),
            author: item.creator || item.author || feed.title || 'Unknown',
            excerpt,
            imageUrl,
            sourceName: feed.title ?? new URL(url as string).hostname,
          };
        });

        // ── Step 2: Enrich items that still have no image via og:image ────────
        // Fetch og:image from each article page in parallel (capped concurrency)
        const itemsMissingImage = rawItems.filter((item) => !item.imageUrl && item.link);

        if (itemsMissingImage.length > 0) {
          /**
           * Fetch og:image (or twitter:image) from a single article page.
           * Returns null on any error so the card gracefully falls back to gradient.
           */
          const fetchOgImage = async (articleUrl: string): Promise<string | null> => {
            try {
              const { default: axios } = await import('axios');
              const response = await axios.get(articleUrl, {
                timeout: 5000,
                headers: {
                  'User-Agent': 'TravelEase-RSS-Reader/1.0',
                  'Accept': 'text/html',
                },
                maxRedirects: 3,
                // Only download first 50 KB — enough to parse <head>
                maxContentLength: 50 * 1024,
              });

              const html: string = response.data ?? '';

              // Try og:image first
              const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                           || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
              if (ogMatch?.[1]) return ogMatch[1];

              // Fallback: twitter:image
              const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
                           || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
              if (twMatch?.[1]) return twMatch[1];

              return null;
            } catch {
              return null;
            }
          };

          // Run all og:image fetches in parallel
          const enriched = await Promise.all(
            itemsMissingImage.map((item) => fetchOgImage(item.link))
          );

          // Map results back to the items by link
          const ogImageMap = new Map<string, string | null>();
          itemsMissingImage.forEach((item, i) => ogImageMap.set(item.link, enriched[i]));

          // Apply enriched images
          for (const item of rawItems) {
            if (!item.imageUrl && ogImageMap.has(item.link)) {
              item.imageUrl = ogImageMap.get(item.link) ?? null;
            }
          }
        }

        // ── Step 3: Filter and slice ──────────────────────────────────────────
        const items = kw
          ? rawItems
              .filter(
                (item) =>
                  item.title.toLowerCase().includes(kw) ||
                  item.excerpt.toLowerCase().includes(kw) ||
                  item.sourceName.toLowerCase().includes(kw)
              )
              .slice(0, maxItems)
          : rawItems.slice(0, maxItems);

        return { items, feedTitle: feed.title ?? 'RSS Feed' };
      },
    });


    res.set('X-Cache', fromCache ? `HIT:${cacheBackend}` : 'MISS');
    res.json({ ...payload, fromCache });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[RSS] Failed to fetch/parse RSS feed:', message);

    // Distinguish network/parse errors from unexpected ones
    if (
      message.includes('Invalid') ||
      message.includes('ECONNREFUSED') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('parse')
    ) {
      return res.status(502).json({ error: 'Failed to fetch or parse the RSS feed', details: message });
    }

    return res.status(500).json({ error: 'Internal server error while processing RSS feed' });
  }
});



/**
 * GET /api/blogs - List blogs with pagination, filtering, and search (public)
 * 
 * Blog State Machine Filter:
 * Only Published blogs are shown in public listings.
 * Draft and Archived blogs are hidden from public view.
 */
blogRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const query = blogQuerySchema.parse(req.query);
    const { category, q } = query;
    const { page, pageSize, skip, take } = parsePagination(query);

    // Build where clause - only show Published blogs in public listings
    const where: Record<string, unknown> = {
      status: 'Published'
    };
    if (category) {
      where.category = category;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Execute queries with retry for transient failures
    const [blogs, total] = await executeWithRetry(() => 
      Promise.all([
        prisma.blog.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          skip,
          take
        }),
        prisma.blog.count({ where })
      ])
    );

    res.json({
      items: blogs,
      ...buildPaginationMeta(total, page, pageSize)
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    return handlePrismaError(error, res, 'Fetching blogs');
  }
});

/**
 * GET /api/blogs/featured - Get featured blogs (public, cached)
 * 
 * Blog State Machine Filter:
 * Only Published + Featured blogs are shown.
 * 
 * Cache key: blogs:featured
 * TTL: 2 minutes
 * Clear cache: Use invalidateCachePattern('blogs:') after blog create/update/delete
 */
blogRoutes.get('/featured', async (req: Request, res: Response) => {
  try {
    const { data: blogs, fromCache, cacheBackend } = await cacheResult({
      key: buildCacheKey('blogs', 'featured'),
      ttl: CACHE_TTL.FEATURED,
      fetchFn: () => executeWithRetry(() =>
        prisma.blog.findMany({
          where: { 
            isFeatured: true,
            status: 'Published'  // Only show published featured blogs
          },
          orderBy: { publishedAt: 'desc' },
          take: 5
        })
      )
    });

    // Set cache header for debugging
    res.set('X-Cache', fromCache ? `HIT:${cacheBackend}` : 'MISS');
    res.json(blogs);
  } catch (error) {
    return handlePrismaError(error, res, 'Fetching featured blogs');
  }
});

// GET /api/blogs/overview - Aggregated endpoint for Blogs page (public, cached)
// Cache key: blogs:overview
// TTL: 1 minute
// Clear cache: Use invalidateCachePattern('blogs:') after blog create/update/delete
blogRoutes.get('/overview', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const REQUEST_TIMEOUT = 5000; // 5 second timeout (reduced from 8s)
  
  // Empty fallback data when DB is unavailable
  const emptyPayload = {
    featured: [],
    destinations: [],
    tips: [],
    clientEducation: [],
    fromCache: false,
    dbUnavailable: true
  };
  
  // Set up a response timeout to ensure we always respond
  let responded = false;
  const timeoutId = setTimeout(() => {
    if (!responded) {
      responded = true;
      console.warn(`[TIMEOUT] /blogs/overview timed out after ${REQUEST_TIMEOUT}ms - returning empty data`);
      res.set('X-Cache', 'MISS');
      res.set('X-DB-Status', 'timeout');
      res.json(emptyPayload);
    }
  }, REQUEST_TIMEOUT);
  
  try {
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

    // Use Redis-backed cache with in-memory fallback
    const { data: payload, fromCache, cacheBackend } = await cacheResult({
      key: buildCacheKey('blogs', 'overview'),
      ttl: CACHE_TTL.OVERVIEW,
      fetchFn: async () => {
        // Fetch all data concurrently with retry
        // Use Promise.allSettled to handle partial failures gracefully
        // All queries filter by status: 'Published' (state machine rule)
        const results = await Promise.allSettled([
          executeWithRetry(() =>
            prisma.blog.findMany({
              where: { isFeatured: true, status: 'Published' },
              select: listSelect,
              orderBy: { publishedAt: 'desc' },
              take: 5
            })
          , 1), // Only 1 retry for faster response
          executeWithRetry(() =>
            prisma.blog.findMany({
              where: { category: 'Destinations', status: 'Published' },
              select: listSelect,
              orderBy: { publishedAt: 'desc' },
              take: 3
            })
          , 1),
          executeWithRetry(() =>
            prisma.blog.findMany({
              where: { category: 'Tips', status: 'Published' },
              select: listSelect,
              orderBy: { publishedAt: 'desc' },
              take: 3
            })
          , 1),
          executeWithRetry(() =>
            prisma.blog.findMany({
              where: { category: 'Client Education', status: 'Published' },
              select: listSelect,
              orderBy: { publishedAt: 'desc' },
              take: 3
            })
          , 1)
        ]);

        // Extract results, using empty arrays for failed queries
        const featured = results[0].status === 'fulfilled' ? results[0].value : [];
        const destinations = results[1].status === 'fulfilled' ? results[1].value : [];
        const tips = results[2].status === 'fulfilled' ? results[2].value : [];
        const clientEducation = results[3].status === 'fulfilled' ? results[3].value : [];

        // Log any failures
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          console.warn(`[PARTIAL] /blogs/overview: ${failures.length}/4 queries failed`);
        }

        return { featured, destinations, tips, clientEducation };
      }
    });

    // Check if we already timed out
    if (responded) return;
    
    clearTimeout(timeoutId);
    responded = true;

    // Log slow queries in development
    const duration = Date.now() - startTime;
    if (duration > 1000 && !fromCache) {
      console.warn(`[SLOW] /blogs/overview took ${duration}ms (cache miss)`);
    }

    // Set cache header for debugging
    res.set('X-Cache', fromCache ? `HIT:${cacheBackend}` : 'MISS');
    res.json({ ...payload, fromCache });
  } catch (error) {
    // Check if we already timed out
    if (responded) return;
    
    clearTimeout(timeoutId);
    responded = true;
    
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a database connection error
    const isDbConnectionError = errorMessage.includes("Can't reach database") || 
                                errorMessage.includes('Connection refused') ||
                                errorMessage.includes('ECONNREFUSED');
    
    if (isDbConnectionError) {
      console.warn(`[DB_UNAVAILABLE] /blogs/overview after ${duration}ms - returning empty data`);
      res.set('X-Cache', 'MISS');
      res.set('X-DB-Status', 'unavailable');
      return res.json(emptyPayload);
    }
    
    console.error(`[ERROR] /blogs/overview failed after ${duration}ms:`, errorMessage);
    return handlePrismaError(error, res, 'Fetching blog overview');
  }
});

/**
 * GET /api/blogs/:slug - Get single blog by slug (public)
 * 
 * Blog State Machine:
 * Only Published blogs are accessible via this public endpoint.
 * Draft and Archived blogs return 404 to non-authors.
 */
blogRoutes.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const blog = await executeWithRetry(() =>
      prisma.blog.findUnique({ where: { slug } })
    );
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Only Published blogs are accessible publicly
    if (blog.status !== 'Published') {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    res.json(blog);
  } catch (error) {
    return handlePrismaError(error, res, 'Fetching blog');
  }
});

/**
 * POST /api/blogs - Create new blog (auth required)
 * 
 * Blog State Machine:
 * New blogs default to Published status unless explicitly set to Draft.
 */
blogRoutes.post('/', authenticateToken, requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    const data = createBlogSchema.parse(req.body);
    const publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();
    
    // Create blog with authenticated user as author
    const blog = await executeWithRetry(() =>
      prisma.blog.create({
        data: {
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          coverImageUrl: data.coverImageUrl,
          category: data.category,
          isFeatured: data.isFeatured,
          readingMinutes: data.readingMinutes,
          author: data.author,
          user_id: req.user!.id,
          publishedAt,
          status: data.status
        }
      })
    );

    // Invalidate blog caches after create
    await invalidateCachePattern('blogs:');

    res.status(201).json(blog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    return handlePrismaError(error, res, 'Creating blog');
  }
});

/**
 * PUT /api/blogs/:id - Update blog (auth + ownership required)
 * 
 * Blog State Machine Enforcement:
 * - Draft → Published (valid)
 * - Published → Archived (valid)
 * - Draft → Archived (valid)
 * - Archived → any (INVALID - no resurrection)
 */
blogRoutes.put('/:id', authenticateToken, requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const existingBlog = await executeWithRetry(() =>
      prisma.blog.findUnique({ where: { id } })
    );
    
    if (!existingBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (existingBlog.user_id !== req.user!.id) {
      return res.status(403).json({ 
        error: 'Not authorized to edit this blog',
        details: 'Only the author can edit this blog'
      });
    }
    
    const data = updateBlogSchema.parse(req.body);
    
    // Enforce state machine transitions
    if (data.status && !isValidBlogStatusTransition(existingBlog.status, data.status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        details: `Cannot transition from ${existingBlog.status} to ${data.status}. Archived blogs cannot be restored.`,
        currentStatus: existingBlog.status,
        requestedStatus: data.status
      });
    }
    
    const updateData: Record<string, unknown> = { ...data };
    if (data.publishedAt) {
      updateData.publishedAt = new Date(data.publishedAt);
    }
    
    const updatedBlog = await executeWithRetry(() =>
      prisma.blog.update({
        where: { id },
        data: updateData
      })
    );

    // Invalidate blog caches after update
    await invalidateCachePattern('blogs:');

    res.json(updatedBlog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    return handlePrismaError(error, res, 'Updating blog');
  }
});

// DELETE /api/blogs/:id - Delete blog (Google auth + ownership required)
blogRoutes.delete('/:id', authenticateToken, requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const existingBlog = await executeWithRetry(() =>
      prisma.blog.findUnique({ where: { id } })
    );
    
    if (!existingBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (existingBlog.user_id !== req.user!.id) {
      return res.status(403).json({ 
        error: 'Not authorized to delete this blog',
        details: 'Only the author can delete this blog'
      });
    }
    
    await executeWithRetry(() =>
      prisma.blog.delete({ where: { id } })
    );

    // Invalidate blog caches after delete
    await invalidateCachePattern('blogs:');

    res.status(204).send();
  } catch (error) {
    return handlePrismaError(error, res, 'Deleting blog');
  }
});

