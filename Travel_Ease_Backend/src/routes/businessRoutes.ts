import { Router, Request, Response } from "express";
import {
  authenticateToken,
  requireGoogleAuth,
} from "../middleware/auth.js";
import { requireBusinessOwnership } from "../middleware/ownership.js";
import {
  validate,
  createBusinessSchema,
  editBusinessSchema,
  priceRangeSchema,
} from "../schemas/validation.js";
import {
  create_business,
  price_range,
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

// Create routes (Google auth required + validation)
// Business creation requires Google OAuth verification to ensure the user
// is authenticated with the same Google account as their registered email
router.post(
  "/create_business",
  requireGoogleAuth,
  validate(createBusinessSchema),
  create_business
);
router.post(
  "/price_range",
  authenticateToken,
  validate(priceRangeSchema),
  price_range
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
            categories: true,
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
router.delete(
  "/delete_business/:id",
  authenticateToken,
  requireBusinessOwnership,
  async (req: Request, res: Response) => {
    const businessId = parseInt(req.params.id);

    try {
      await prisma.$transaction(async (tx) => {
        // Get category IDs for this business
        const categories = await tx.businessCategory.findMany({
          where: { business_id: businessId },
          select: { category_id: true },
        });

        const categoryIds = categories.map((c) => c.category_id);

        // Delete price ranges
        if (categoryIds.length > 0) {
          await tx.priceRange.deleteMany({
            where: { category_id: { in: categoryIds } },
          });
        }

        // Delete related records
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
  category?: string;
  limit?: string;
}

// Travel spots endpoints (public for browsing, cached)
// Cache key: business:travel_spots:<params>
// TTL: 1 minute
// Clear cache: Use invalidateCachePattern('business:') after business create/update/delete
router.get(
  "/travel_spots",
  async (
    req: Request<object, object, object, TravelSpotsQuery>,
    res: Response
  ) => {
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
        where.categories = {
          some: {
            subcategory: {
              main_category: category as any, // Cast to enum type
            },
          },
        };
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
          category: category || "",
          limit: maxLimit,
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
          longitude: { not: null },
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
          longitude: true,
        },
        orderBy: [{ rating: "desc" }, { business_id: "desc" }],
        take: searchLimit,
      })
    );

    res.json({
      message: "Success",
      data: businesses,
    });
  } catch (error) {
    businessLogger.error({ err: error }, "Error searching businesses");
    return handlePrismaError(error, res, "Searching businesses");
  }
});

export default router;

