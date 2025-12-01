import { Router } from "express";
import { authenticateToken } from "../src/middleware/auth.js";
import { requireBusinessOwnership } from "../src/middleware/ownership.js";
import { 
  validate, 
  createBusinessSchema, 
  editBusinessSchema,
  priceRangeSchema
} from "../src/schemas/validation.js";
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
} from "../business/index.js";
import { prisma, executeWithRetry, handlePrismaError } from "../src/lib/prismaHelpers.js";
import { getCache, createCacheKey } from "../services/cache.js";

const router = Router();

// Create routes (auth + validation)
router.post("/create_business", authenticateToken, validate(createBusinessSchema), create_business);
router.post("/price_range", authenticateToken, validate(priceRangeSchema), price_range);

// Public read routes
router.get("/fetch_business/:id", business_fetch);
router.get("/fetch_categories/:id", categories_fetch);
router.get("/businesses", get_businesses);
router.get("/categories", getCategories);

// Edit routes (auth + ownership + validation)
router.put("/edit_business/:id", authenticateToken, requireBusinessOwnership, validate(editBusinessSchema), edit_business);

// Get current user's businesses
router.get("/my-businesses", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const businesses = await executeWithRetry(() =>
      prisma.business.findMany({
        where: { user_id: userId },
        include: {
          categories: true,
          business_hours: true
        },
        orderBy: { business_id: 'desc' }
      })
    );
    
    res.json({
      message: "Success",
      data: businesses,
      count: businesses.length
    });
  } catch (error) {
    console.error("Error fetching user's businesses:", error);
    return handlePrismaError(error, res, 'Fetching user businesses');
  }
});

// Delete business (auth + ownership required)
router.delete("/delete_business/:id", authenticateToken, requireBusinessOwnership, async (req, res) => {
  const businessId = parseInt(req.params.id);
  
  try {
    await prisma.$transaction(async (tx) => {
      // Get category IDs for this business
      const categories = await tx.businessCategory.findMany({
        where: { business_id: businessId },
        select: { category_id: true }
      });
      
      const categoryIds = categories.map(c => c.category_id);
      
      // Delete price ranges
      if (categoryIds.length > 0) {
        await tx.priceRange.deleteMany({
          where: { category_id: { in: categoryIds } }
        });
      }
      
      // Delete related records
      await Promise.all([
        tx.businessCategory.deleteMany({ where: { business_id: businessId } }),
        tx.businessHours.deleteMany({ where: { business_id: businessId } }),
        tx.businessReview.deleteMany({ where: { business_id: businessId } }),
        tx.businessFavorite.deleteMany({ where: { business_id: businessId } }),
        tx.menuItem.deleteMany({ where: { business_id: businessId } })
      ]);
      
      // Delete the business
      await tx.business.delete({
        where: { business_id: businessId }
      });
    });
    
    res.json({ message: "Business deleted successfully" });
  } catch (error) {
    console.error("Error deleting business:", error);
    return handlePrismaError(error, res, 'Deleting business');
  }
});

// Menu item routes
router.get("/:id/menu", getMenuItems);
router.post("/:id/menu", authenticateToken, createMenuItem);
router.put("/:id/menu/:itemId", authenticateToken, updateMenuItem);
router.delete("/:id/menu/:itemId", authenticateToken, deleteMenuItem);

// Travel spots cache
const travelSpotsCache = getCache('search');

// Travel spots endpoints (public for browsing)
// Supports optional query params: search, city, limit
router.get("/travel_spots", async (req, res) => {
  try {
    const { search, city, limit } = req.query;
    const maxLimit = Math.min(parseInt(limit, 10) || 50, 100);

    // Build cache key from query params
    const cacheKey = createCacheKey('travel_spots', { search: search || '', city: city || '', limit: maxLimit });
    const cached = travelSpotsCache.get(cacheKey);
    if (cached) {
      return res.json({ message: "Success", data: cached, fromCache: true });
    }

    // Build where clause
    const where = { status: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

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
          longtitude: true,
          description: true,
          rating: true,
          status: true,
          picture: true
        },
        orderBy: [{ rating: { sort: 'desc', nulls: 'last' } }],
        take: maxLimit
      })
    );

    // Fetch review counts in a single query
    const businessIds = businesses.map(b => b.business_id);
    let reviewCounts = {};
    if (businessIds.length > 0) {
      const counts = await executeWithRetry(() =>
        prisma.businessReview.groupBy({
          by: ['business_id'],
          where: { business_id: { in: businessIds } },
          _count: { review_id: true }
        })
      );
      reviewCounts = counts.reduce((acc, r) => {
        acc[r.business_id] = r._count.review_id;
        return acc;
      }, {});
    }

    // Attach reviewCount to each business
    const enriched = businesses.map(b => ({
      ...b,
      reviewCount: reviewCounts[b.business_id] || 0
    }));

    // Cache for 30 seconds
    travelSpotsCache.set(cacheKey, enriched, 30);

    res.json({
      message: "Success",
      data: enriched,
      fromCache: false
    });
  } catch (error) {
    console.error("Error fetching travel spots:", error);
    return handlePrismaError(error, res, 'Fetching travel spots');
  }
});

router.get("/travel_spots/reviews/:id", async (req, res) => {
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
              last_name: true
            }
          }
        },
        orderBy: { review_date: 'desc' }
      })
    );
    
    res.json({
      message: "Success",
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return handlePrismaError(error, res, 'Fetching reviews');
  }
}); 

export default router;
