import { Router, Request, Response } from "express";
import {
  authenticateToken,
} from "../middleware/auth.js";
import { requireBusinessOwnership } from "../middleware/ownership.js";
import { requireGoogleAuth } from "../middleware/requireGoogleAuth.js";
import {
  validate,
  createBusinessSchema,
  editBusinessSchema,
} from "../schemas/validation.js";
import {
  create_business,
  business_fetch,
  categories_fetch,
  edit_business,
  get_businesses,
  getCategories,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../modules/business/index.js";
import {
  prisma,
  executeWithRetry,
  handlePrismaError,
} from "../lib/prismaHelpers.js";
import {
  cacheResult,
  buildCacheKey,
  invalidateCachePattern,
} from "../lib/cache.js";
import { businessLogger } from "../lib/logger.js";

const router = Router();

// Cache TTLs (in seconds)
const CACHE_TTL = {
  TRAVEL_SPOTS: 60, // 1 minute for travel spots listing
  CATEGORIES: 300, // 5 minutes for categories (rarely change)
};

// Create routes (authentication required + Google auth + validation)
// Business creation requires Google OAuth authentication
// Price range (min_price/max_price) is now stored directly on the business table
router.post(
  "/create_business",
  authenticateToken,
  requireGoogleAuth,
  validate(createBusinessSchema),
  create_business
);

// Public read routes
router.get("/fetch_business/:id", business_fetch);
router.get("/fetch_categories/:id", categories_fetch);
router.get("/businesses", get_businesses);
router.get("/categories", getCategories);

// Edit routes (auth + Google auth + ownership + validation)
router.put(
  "/edit_business/:id",
  authenticateToken,
  requireGoogleAuth,
  requireBusinessOwnership,
  validate(editBusinessSchema),
  edit_business
);

// Get current user's businesses (requires Google auth)
router.get(
  "/my-businesses",
  authenticateToken,
  requireGoogleAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const businesses = await executeWithRetry(() =>
        prisma.business.findMany({
          where: { user_id: userId },
          include: {
            business_category: true,
            business_hours: true,
          },
          orderBy: { business_id: "desc" },
        })
      );

      res.json({
        message: "Success",
        data: businesses,
        count: businesses.length,
      });
    } catch (error) {
      businessLogger.error({ err: error, userId: req.user?.id }, "Error fetching user's businesses");
      return handlePrismaError(error, res, "Fetching user businesses");
    }
  }
);

// Delete business (auth + Google auth + ownership required)
// Price range data is stored directly on business table (no separate table to clean up)
router.delete(
  "/delete_business/:id",
  authenticateToken,
  requireGoogleAuth,
  requireBusinessOwnership,
  async (req: Request, res: Response) => {
    const businessId = parseInt(req.params.id);

    try {
      await prisma.$transaction(async (tx) => {
        // Delete related records (cascade handles most, but explicit for safety)
        await Promise.all([
          tx.business_category.deleteMany({
            where: { business_id: businessId },
          }),
          tx.business_hours.deleteMany({ where: { business_id: businessId } }),
          tx.business_review.deleteMany({ where: { business_id: businessId } }),
          tx.business_favorite.deleteMany({
            where: { business_id: businessId },
          }),
          tx.menu_item.deleteMany({ where: { business_id: businessId } }),
        ]);

        // Delete the business
        await tx.business.delete({
          where: { business_id: businessId },
        });
      });

      res.json({ message: "Business deleted successfully" });
    } catch (error) {
      businessLogger.error({ err: error, businessId }, "Error deleting business");
      return handlePrismaError(error, res, "Deleting business");
    }
  }
);

// Menu item routes (mutations require Google auth)
router.get("/:id/menu", getMenuItems);
router.post("/:id/menu", authenticateToken, requireGoogleAuth, createMenuItem);
router.put("/:id/menu/:itemId", authenticateToken, requireGoogleAuth, updateMenuItem);
router.delete("/:id/menu/:itemId", authenticateToken, requireGoogleAuth, deleteMenuItem);

interface TravelSpotsQuery {
  search?: string;
  city?: string;
  category?: string;
  limit?: string;
}

/**
 * Travel spots endpoints (public for browsing, cached)
 * 
 * Category Filtering Logic:
 * Businesses are filtered by main category via subcategory relation.
 * - category: Main category enum (accommodation, food_drinks, etc.)
 * - Businesses must have a subcategory with matching main_category
 * 
 * Cache key: business:travel_spots:<params>
 * TTL: 1 minute
 * Clear cache: Use invalidateCachePattern('business:') after business create/update/delete
 */
router.get(
  "/travel_spots",
  async (
    req: Request<object, object, object, TravelSpotsQuery>,
    res: Response
  ) => {
    // #region agent log
    const _debugStart = Date.now();
    const _debugRunId = `travel_spots_${Date.now()}`;
    const fs = await import('fs');
    const _debugLog = (msg: string, data: Record<string, unknown>) => {
      try {
        const entry = JSON.stringify({ location: 'businessRoutes.ts:travel_spots', message: msg, data: { ...data, elapsed: Date.now() - _debugStart }, timestamp: Date.now(), sessionId: 'debug-session', runId: _debugRunId }) + '\n';
        fs.appendFileSync('/Users/urielpapa/Documents/GitHub/Travel_Ease/.cursor/debug.log', entry);
      } catch {}
    };
    _debugLog('H1/H2: travel_spots request started', { query: req.query });
    // #endregion
    try {
      const { search, city, category, limit } = req.query;
      const maxLimit = Math.min(parseInt(limit || "50", 10) || 50, 100);

      // Build where clause
      const where: Record<string, unknown> = { status: true };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
      if (city) {
        where.city = { contains: city, mode: "insensitive" };
      }
      // Filter by category - businesses must have a subcategory with this main_category
      if (category) {
        where.business_category = {
          some: {
            subcategory: {
              main_category: category as any, // Cast to enum type
            },
          },
        };
      }

      // #region agent log
      _debugLog('H1: about to call cacheResult', { hypothesisId: 'H1', maxLimit });
      const _cacheStart = Date.now();
      // #endregion
      // Use Redis-backed cache with in-memory fallback
      const {
        data: enriched,
        fromCache,
        cacheBackend,
      } = await cacheResult({
        key: buildCacheKey("business", "travel_spots", {
          search: search || "",
          city: city || "",
          category: category || "",
          limit: maxLimit,
        }),
        ttl: CACHE_TTL.TRAVEL_SPOTS,
        fetchFn: async () => {
          // #region agent log
          _debugLog('H1: cache MISS - fetching from DB', { hypothesisId: 'H1', cacheKey: buildCacheKey("business", "travel_spots", { search: search || "", city: city || "", category: category || "", limit: maxLimit }) });
          const _dbQueryStart = Date.now();
          // #endregion
          const businesses = await executeWithRetry(() =>
            prisma.business.findMany({
              where,
              select: {
                business_id: true,
                user_id: true,
                name: true,
                house_number: true,
                street: true,
                brgy: true,
                city: true,
                latitude: true,
                longtitude: true, // Note: DB column has typo 'longtitude' instead of 'longitude'
                description: true,
                rating: true,
                status: true,
                picture: true,
                min_price: true,
                max_price: true,
              },
              orderBy: [{ rating: "desc" }],
              take: maxLimit,
            })
          );

          // #region agent log
          _debugLog('H2: businesses query complete', { hypothesisId: 'H2', businessCount: businesses.length, queryMs: Date.now() - _dbQueryStart });
          const _reviewCountStart = Date.now();
          // #endregion
          // Fetch review counts in a single query
          const businessIds = businesses.map((b) => b.business_id);
          let reviewCounts: Record<number, number> = {};
          if (businessIds.length > 0) {
            const counts = await executeWithRetry(() =>
              prisma.business_review.groupBy({
                by: ["business_id"],
                where: { business_id: { in: businessIds } },
                _count: { review_id: true },
              })
            );
            // #region agent log
            _debugLog('H5: review counts query complete', { hypothesisId: 'H5', countResults: counts.length, queryMs: Date.now() - _reviewCountStart });
            // #endregion
            reviewCounts = counts.reduce((acc, r) => {
              if (r.business_id !== null) {
                acc[r.business_id] = r._count.review_id;
              }
              return acc;
            }, {} as Record<number, number>);
          }

          // Attach reviewCount and normalize longtitude -> longitude
          return businesses.map((b) => {
            const { longtitude, ...rest } = b;
            return {
              ...rest,
              longitude: longtitude, // Normalize DB typo to correct field name
              reviewCount: reviewCounts[b.business_id] || 0,
            };
          });
        },
      });

      // #region agent log
      _debugLog('H1/H3: cacheResult complete', { hypothesisId: 'H1', fromCache, cacheBackend, cacheMs: Date.now() - _cacheStart, resultCount: enriched.length });
      const _responseSize = JSON.stringify(enriched).length;
      _debugLog('H3: response payload size', { hypothesisId: 'H3', payloadBytes: _responseSize, itemCount: enriched.length });
      // #endregion
      // Set cache header for debugging
      res.set("X-Cache", fromCache ? `HIT:${cacheBackend}` : "MISS");
      res.json({
        message: "Success",
        data: enriched,
        fromCache,
      });
      // #region agent log
      _debugLog('H2: request complete', { totalMs: Date.now() - _debugStart });
      // #endregion
    } catch (error) {
      // #region agent log
      _debugLog('ERROR: travel_spots failed', { error: String(error), totalMs: Date.now() - _debugStart });
      // #endregion
      businessLogger.error({ err: error }, "Error fetching travel spots");
      return handlePrismaError(error, res, "Fetching travel spots");
    }
  }
);

router.get("/travel_spots/reviews/:id", async (req: Request, res: Response) => {
  const businessId = parseInt(req.params.id);

  try {
    const reviews = await executeWithRetry(() =>
      prisma.business_review.findMany({
        where: { business_id: businessId },
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { review_date: "desc" },
      })
    );

    res.json({
      message: "Success",
      data: reviews,
    });
  } catch (error) {
    businessLogger.error({ err: error, businessId }, "Error fetching reviews");
    return handlePrismaError(error, res, "Fetching reviews");
  }
});

// Business search endpoint for map search functionality
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { query, limit = "10" } = req.query;
    const searchLimit = Math.min(parseInt(limit as string, 10) || 10, 20);

    if (!query || typeof query !== "string" || query.length < 2) {
      return res.json({
        message: "Success",
        data: [],
      });
    }

    const searchQuery = query as string;

    // Search in name, description, city, brgy, street fields
    const businesses = await executeWithRetry(() =>
      prisma.business.findMany({
        where: {
          status: true,
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { description: { contains: searchQuery, mode: "insensitive" } },
            { city: { contains: searchQuery, mode: "insensitive" } },
            { brgy: { contains: searchQuery, mode: "insensitive" } },
            { street: { contains: searchQuery, mode: "insensitive" } },
          ],
          // Only include businesses with valid coordinates
          latitude: { not: null },
          longtitude: { not: null }, // Note: DB column has typo 'longtitude' instead of 'longitude'
        },
        select: {
          business_id: true,
          name: true,
          description: true,
          city: true,
          brgy: true,
          street: true,
          house_number: true,
          latitude: true,
          longtitude: true, // Note: DB column has typo 'longtitude' instead of 'longitude'
        },
        orderBy: [{ rating: "desc" }, { business_id: "desc" }],
        take: searchLimit,
      })
    );

    // Normalize longtitude -> longitude in response
    const normalizedBusinesses = businesses.map((b) => {
      const { longtitude, ...rest } = b;
      return {
        ...rest,
        longitude: longtitude,
      };
    });

    res.json({
      message: "Success",
      data: normalizedBusinesses,
    });
  } catch (error) {
    businessLogger.error({ err: error }, "Error searching businesses");
    return handlePrismaError(error, res, "Searching businesses");
  }
});

export default router;

