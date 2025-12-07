import { Router, Request, Response } from "express";
import {
  authenticateToken,
} from "../middleware/auth.js";
import { requireBusinessOwnership } from "../middleware/ownership.js";
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

// Create routes (authentication required + validation)
// Business creation is available to all authenticated users (Google or password)
// Price range (min_price/max_price) is now stored directly on the business table
router.post(
  "/create_business",
  authenticateToken,
  validate(createBusinessSchema),
  create_business
);

// Public read routes
router.get("/fetch_business/:id", business_fetch);
router.get("/fetch_categories/:id", categories_fetch);
router.get("/businesses", get_businesses);
router.get("/categories", getCategories);

// Edit routes (auth + ownership + validation)
router.put(
  "/edit_business/:id",
  authenticateToken,
  requireBusinessOwnership,
  validate(editBusinessSchema),
  edit_business
);

// Get current user's businesses
router.get(
  "/my-businesses",
  authenticateToken,
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

// Delete business (auth + ownership required)
// Price range data is stored directly on business table (no separate table to clean up)
router.delete(
  "/delete_business/:id",
  authenticateToken,
  requireBusinessOwnership,
  async (req: Request, res: Response) => {
    const businessId = parseInt(req.params.id);

    try {
      await prisma.$transaction(async (tx) => {
        // Delete related records (cascade handles most, but explicit for safety)
        await Promise.all([
          tx.businessCategory.deleteMany({
            where: { business_id: businessId },
          }),
          tx.businessHours.deleteMany({ where: { business_id: businessId } }),
          tx.businessReview.deleteMany({ where: { business_id: businessId } }),
          tx.businessFavorite.deleteMany({
            where: { business_id: businessId },
          }),
          tx.menuItem.deleteMany({ where: { business_id: businessId } }),
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

// Menu item routes
router.get("/:id/menu", getMenuItems);
router.post("/:id/menu", authenticateToken, createMenuItem);
router.put("/:id/menu/:itemId", authenticateToken, updateMenuItem);
router.delete("/:id/menu/:itemId", authenticateToken, deleteMenuItem);

interface TravelSpotsQuery {
  search?: string;
  city?: string;
  limit?: string;
  minPrice?: string;
  maxPrice?: string;
}

/**
 * Travel spots endpoints (public for browsing, cached)
 * 
 * Price Filtering Logic (range overlap):
 * A business is included if its price range overlaps with the requested range.
 * - If only minPrice provided: business.max_price >= minPrice OR business.max_price is null
 * - If only maxPrice provided: business.min_price <= maxPrice OR business.min_price is null
 * - If both provided: ranges overlap (business.min <= maxPrice AND business.max >= minPrice)
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
    try {
      const { search, city, limit, minPrice, maxPrice } = req.query;
      const maxLimit = Math.min(parseInt(limit || "50", 10) || 50, 100);
      
      // Parse price filters
      const parsedMinPrice = minPrice ? parseInt(minPrice, 10) : undefined;
      const parsedMaxPrice = maxPrice ? parseInt(maxPrice, 10) : undefined;
      
      // Validate price range
      if (parsedMinPrice !== undefined && parsedMaxPrice !== undefined) {
        if (parsedMinPrice > parsedMaxPrice) {
          return res.status(400).json({ 
            error: 'Invalid price range', 
            details: 'minPrice must be less than or equal to maxPrice' 
          });
        }
      }

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
      
      // Price filtering - use range overlap logic
      // Business included if: business.min_price <= maxPrice AND business.max_price >= minPrice
      // This includes businesses where ranges overlap
      if (parsedMinPrice !== undefined || parsedMaxPrice !== undefined) {
        const priceConditions: unknown[] = [];
        
        if (parsedMinPrice !== undefined) {
          // Business max_price must be >= minPrice (or null, meaning unlimited)
          priceConditions.push({
            OR: [
              { max_price: { gte: parsedMinPrice } },
              { max_price: null, min_price: { lte: parsedMinPrice } }, // Has min but no max
              { max_price: null, min_price: null }, // No price set - include all
            ]
          });
        }
        
        if (parsedMaxPrice !== undefined) {
          // Business min_price must be <= maxPrice (or null, meaning starts from 0)
          priceConditions.push({
            OR: [
              { min_price: { lte: parsedMaxPrice } },
              { min_price: null }, // No min means starts from 0
            ]
          });
        }
        
        if (priceConditions.length > 0) {
          where.AND = priceConditions;
        }
      }

      // Use Redis-backed cache with in-memory fallback
      const {
        data: enriched,
        fromCache,
        cacheBackend,
      } = await cacheResult({
        key: buildCacheKey("business", "travel_spots", {
          search: search || "",
          city: city || "",
          limit: maxLimit,
          minPrice: parsedMinPrice ?? "",
          maxPrice: parsedMaxPrice ?? "",
        }),
        ttl: CACHE_TTL.TRAVEL_SPOTS,
        fetchFn: async () => {
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
                longitude: true,
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

          // Fetch review counts in a single query
          const businessIds = businesses.map((b) => b.business_id);
          let reviewCounts: Record<number, number> = {};
          if (businessIds.length > 0) {
            const counts = await executeWithRetry(() =>
              prisma.businessReview.groupBy({
                by: ["business_id"],
                where: { business_id: { in: businessIds } },
                _count: { review_id: true },
              })
            );
            reviewCounts = counts.reduce((acc, r) => {
              if (r.business_id !== null) {
                acc[r.business_id] = r._count.review_id;
              }
              return acc;
            }, {} as Record<number, number>);
          }

          // Attach reviewCount to each business
          return businesses.map((b) => ({
            ...b,
            reviewCount: reviewCounts[b.business_id] || 0,
          }));
        },
      });

      // Set cache header for debugging
      res.set("X-Cache", fromCache ? `HIT:${cacheBackend}` : "MISS");
      res.json({
        message: "Success",
        data: enriched,
        fromCache,
      });
    } catch (error) {
      businessLogger.error({ err: error }, "Error fetching travel spots");
      return handlePrismaError(error, res, "Fetching travel spots");
    }
  }
);

router.get("/travel_spots/reviews/:id", async (req: Request, res: Response) => {
  const businessId = parseInt(req.params.id);

  try {
    const reviews = await executeWithRetry(() =>
      prisma.businessReview.findMany({
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

export default router;

