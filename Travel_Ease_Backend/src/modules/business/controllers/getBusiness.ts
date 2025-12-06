import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { parsePagination, buildPaginationMeta } from "../../../lib/prismaHelpers.js";
import { Request, Response } from "express";

interface BusinessWhere {
  status?: boolean;
  OR?: Array<{ name?: { contains: string; mode: string }; description?: { contains: string; mode: string }; city?: { contains: string; mode: string } }>;
  business_id?: { in: number[] };
  categories?: {
    some: {
      price_ranges: {
        some: {
          max_price?: { gte: number };
          min_price?: { lte: number };
        };
      };
    };
  };
}

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

    // For category filter, we need a subquery
    if (category) {
      // Get business IDs with this main category via subcategory relation
      const businessesWithCategory = await executeWithRetry(() =>
        prisma.businessCategory.findMany({
          where: {
            subcategory: {
              main_category: category as any, // Cast to enum type
            },
          },
          select: { business_id: true }
        })
      );
      const businessIds = businessesWithCategory.map(b => b.business_id).filter((id): id is number => id !== null);
      if (businessIds.length > 0) {
        where.business_id = { in: businessIds };
      } else {
        // No businesses with this category
        return res.status(200).json({
          items: [],
          ...buildPaginationMeta(0, page, pageSize)
        });
      }
    }

    // Filter by price range at database level (fixes pagination count mismatch)
    if (minPrice || maxPrice) {
      const priceFilter: { max_price?: { gte: number }; min_price?: { lte: number } } = {};
      if (minPrice) {
        priceFilter.max_price = { gte: parseInt(minPrice as string, 10) };
      }
      if (maxPrice) {
        priceFilter.min_price = { lte: parseInt(maxPrice as string, 10) };
      }
      where.categories = {
        some: {
          price_ranges: {
            some: priceFilter
          }
        }
      };
    }

    const [businesses, total] = await executeWithRetry(() =>
      Promise.all([
        prisma.business.findMany({
          where: where as any,
          include: {
            categories: {
              include: {
                price_ranges: true
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

    // Normalize response
    const items = businesses.map(b => normalizeBusiness(b));

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

/**
 * Normalize business for API response
 */
function normalizeBusiness(business: any) {
  // Calculate price range across all categories
  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  for (const cat of business.categories || []) {
    for (const pr of cat.price_ranges || []) {
      if (minPrice === null || pr.min_price < minPrice) minPrice = pr.min_price;
      if (maxPrice === null || pr.max_price > maxPrice) maxPrice = pr.max_price;
    }
  }

  // Parse picture JSON if stored as string
  let coverImage: string | null = null;
  let gallery: string[] = [];
  if (business.picture) {
    try {
      const parsed = typeof business.picture === 'string' 
        ? JSON.parse(business.picture) 
        : business.picture;
      if (parsed.secure_url) {
        if (Array.isArray(parsed.secure_url)) {
          coverImage = parsed.secure_url[0] || null;
          gallery = parsed.secure_url;
        } else {
          coverImage = parsed.secure_url;
          gallery = [parsed.secure_url];
        }
      }
    } catch {
      coverImage = business.picture;
    }
  }

  // Normalize hours
  const hours: Record<string, { open: string | null; close: string | null }> = {};
  for (const h of business.business_hours || []) {
    const day = h.day_of_week?.toLowerCase();
    if (day) {
      hours[day] = {
        open: h.open_time ? formatTime(h.open_time) : null,
        close: h.close_time ? formatTime(h.close_time) : null,
      };
    }
  }

  return {
    id: business.business_id,
    name: business.name,
    description: business.description,
    categories: (business.categories || []).map((c: any) => ({
      id: c.category_id,
      name: c.category_name,
    })),
    hours,
    priceRange: minPrice !== null ? { min: minPrice, max: maxPrice } : null,
    media: {
      cover: coverImage,
      gallery,
    },
    location: {
      lat: business.latitude,
      lng: business.longitude,
      address: [
        business.house_number,
        business.street,
        business.brgy,
        business.city,
      ].filter(Boolean).join(', '),
    },
    rating: business.rating ? parseFloat(business.rating) : null,
    status: business.status,
    owner: business.user ? {
      id: business.user.user_id,
      name: `${business.user.first_name} ${business.user.last_name}`.trim(),
    } : null,
  };
}

function formatTime(time: Date | string): string | null {
  if (!time) return null;
  if (time instanceof Date) {
    return time.toTimeString().slice(0, 5);
  }
  return time.toString().slice(0, 5);
}

