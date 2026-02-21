import { Router, Request, Response } from "express";
import {
  authenticateToken,
} from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
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
// Returns both created and claimed businesses
router.get(
  "/my-businesses",
  authenticateToken,
  requireGoogleAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      // Get both created businesses and claimed LGU businesses
      const businesses = await executeWithRetry(() =>
        prisma.business.findMany({
          where: {
            OR: [
              { user_id: userId },           // Businesses created by user
              { claimed_by_user_id: userId } // Businesses claimed by user
            ]
          },
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
    try {
      const { search, city, category, limit } = req.query;
      const maxLimit = Math.min(parseInt(limit || "50", 10) || 50, 100);

      // Build where clause
      const where: Record<string, unknown> = { status: { in: ["APPROVED", "LGU_REGISTERED"] } };
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
          status: { in: ["APPROVED", "LGU_REGISTERED"] },
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
    res.status(500).json({
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    return;
  }
});

// Admin-only endpoint to get pending business registrations
// Restricted to SUPER_ADMIN and LGU_ADMIN roles
router.get(
  "/pending-registrations",
  authenticateToken,
  requireRole("SUPER_ADMIN", "LGU_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { page = "1", pageSize = "20" } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const pageSizeNum = Math.max(1, Math.min(100, parseInt(pageSize as string, 10) || 20));
      const skip = (pageNum - 1) * pageSizeNum;

      // Fetch pending business registrations
      const [registrations, total] = await executeWithRetry(() =>
        Promise.all([
          prisma.business.findMany({
            where: {
              status: "PENDING",
            },
            include: {
              business_category: true,
              business_hours: true,
            },
            orderBy: { business_id: "desc" },
            skip,
            take: pageSizeNum,
          }),
          prisma.business.count({
            where: { status: "PENDING" },
          }),
        ])
      );

      const totalPages = Math.ceil(total / pageSizeNum);

      res.json({
        message: "Success",
        data: registrations,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages,
        },
      });
    } catch (error) {
      businessLogger.error({ err: error }, "Error fetching pending business registrations");
      return handlePrismaError(error, res, "Fetching pending registrations");
    }
  }
);

// Admin-only endpoint to set business status
// Restricted to SUPER_ADMIN and LGU_ADMIN roles
router.patch(
  "/status/:id",
  authenticateToken,
  requireRole("SUPER_ADMIN", "LGU_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const businessId = parseInt(req.params.id, 10);
      const { status, rejection_reason } = req.body;
      const adminUserId = req.user!.id;

      // Validate status is a valid enum value
      const validStatuses = ["LGU_REGISTERED", "PENDING", "APPROVED", "REJECTED"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      // Fetch the business to get owner info for notifications
      const business = await executeWithRetry(() =>
        prisma.business.findUnique({
          where: { business_id: businessId },
          select: { user_id: true, name: true },
        })
      );

      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      // Prepare update data
      const updateData: any = { status };

      if (status === "APPROVED") {
        updateData.approved_by_user_id = adminUserId;
        updateData.approved_at = new Date();
        updateData.rejection_reason = null;
      } else if (status === "REJECTED") {
        updateData.rejection_reason = rejection_reason || "Rejected by admin";
        updateData.approved_by_user_id = null;
        updateData.approved_at = null;
      } else {
        // For other statuses, clear approval data
        updateData.approved_by_user_id = null;
        updateData.approved_at = null;
        updateData.rejection_reason = null;
      }

      // Update the business
      const updatedBusiness = await executeWithRetry(() =>
        prisma.business.update({
          where: { business_id: businessId },
          data: updateData,
        })
      );

      // Create a notification for the business owner
      if (business.user_id) {
        try {
          const notificationTitle =
            status === "APPROVED"
              ? "Business Approved"
              : status === "REJECTED"
                ? "Business Rejected"
                : `Status Changed to ${status}`;

          let notificationMessage = "";
          if (status === "APPROVED") {
            notificationMessage = `Your business "${business.name}" has been approved and is now visible to users.`;
          } else if (status === "REJECTED") {
            notificationMessage = `Your business "${business.name}" was rejected. Reason: ${updateData.rejection_reason}`;
          } else {
            notificationMessage = `Your business "${business.name}" status has been changed to ${status}.`;
          }

          await executeWithRetry(() =>
            prisma.notification.create({
              data: {
                user_id: business.user_id!,
                type: "business_status_change",
                title: notificationTitle,
                message: notificationMessage,
                is_read: false,
              },
            })
          );
        } catch (notificationError) {
          businessLogger.warn(
            { err: notificationError },
            "Failed to create notification for business status change"
          );
          // Don't fail the request if notification creation fails
        }
      }

      // Invalidate relevant caches
      invalidateCachePattern("business:");
      invalidateCachePattern("travel_spots");

      res.json({
        message: `Business status updated to ${status}`,
        data: updatedBusiness,
      });
    } catch (error) {
      businessLogger.error({ err: error }, "Error updating business status");
      return handlePrismaError(error, res, "Updating business status");
    }
  }
);

export default router;

