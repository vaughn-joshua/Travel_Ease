import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { parsePagination, buildPaginationMeta } from "../../../lib/prismaHelpers.js";
import { Request, Response } from "express";
import { formatBusinessListItemDetailed } from "../../../services/businessService.js";

interface BusinessWhere {
  status?: boolean;
  OR?: Array<{ name?: { contains: string; mode: string }; description?: { contains: string; mode: string }; city?: { contains: string; mode: string } }>;
  categories?: {
    some: {
      category_name?: string;
    };
  };
  AND?: Array<{
    categories?: {
      some: {
        category_name?: string;
      };
    };
    min_price?: { lte: number };
    max_price?: { gte: number };
  }>;
  min_price?: { lte: number };
  max_price?: { gte: number };
}

/**
 * Get businesses with filters and pagination.
 * Price filtering uses business.min_price and business.max_price directly.
 */
export async function get_businesses(req: Request, res: Response) {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      status,
    } = req.query;

    const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, string>);

    // Build where clause
    const where: BusinessWhere = {};

    // Filter by status (default to active only for public)
    if (status !== undefined) {
      where.status = status === 'true';
    }

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Filter by category
    if (category) {
      where.categories = {
        some: { category_name: category as string }
      };
    }

    // Filter by price range using business fields directly
    // A business matches if its price range overlaps with the filter range
    if (minPrice) {
      // Business max_price must be >= filter minPrice
      where.max_price = { gte: parseInt(minPrice as string, 10) };
    }
    if (maxPrice) {
      // Business min_price must be <= filter maxPrice
      where.min_price = { lte: parseInt(maxPrice as string, 10) };
    }

    const [businesses, total] = await executeWithRetry(() =>
      Promise.all([
        prisma.business.findMany({
          where: where as any,
          include: {
            categories: {
              select: {
                category_id: true,
                category_name: true,
              }
            },
            business_hours: true,
            user: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true
              }
            }
          },
          skip,
          take,
          orderBy: [{ rating: 'desc' }, { name: 'asc' }]
        }),
        prisma.business.count({ where: where as any })
      ])
    );

    // Normalize response using centralized formatter
    // Price range is now read directly from business fields
    const items = businesses.map(b => formatBusinessListItemDetailed(b));

    res.status(200).json({
      items,
      ...buildPaginationMeta(total, page, pageSize)
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return handlePrismaError(error, res, 'Fetching businesses');
  }
}

/**
 * Get distinct categories for filter dropdown
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await executeWithRetry(() =>
      prisma.businessCategory.findMany({
        distinct: ['category_name'],
        select: { category_name: true }
      })
    );

    res.json({
      categories: categories.map(c => c.category_name),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return handlePrismaError(error, res, 'Fetching categories');
  }
}
