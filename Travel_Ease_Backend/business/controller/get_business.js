import { Op, Sequelize } from "sequelize";
import { Business, BusinessCategory, BusinessHours, PriceRange, User } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError, parsePagination, buildPaginationMeta } from "../../src/lib/queryHelpers.js";

export async function get_businesses(req, res) {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      status,
    } = req.query;

    const { page, pageSize, limit, offset } = parsePagination(req.query);

    // Build where clause
    const where = {};

    // Filter by status (default to active only for public)
    if (status !== undefined) {
      where.status = status === 'true';
    }

    // Search by name or description
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // For category and price filters, we need subqueries
    let categoryFilter = null;
    if (category) {
      // Get business IDs with this category
      const businessesWithCategory = await executeWithRetry(() =>
        BusinessCategory.findAll({
          where: { category_name: category },
          attributes: ['business_id'],
          raw: true
        })
      );
      const businessIds = businessesWithCategory.map(b => b.business_id);
      if (businessIds.length > 0) {
        where.business_id = { [Op.in]: businessIds };
      } else {
        // No businesses with this category
        return res.status(200).json({
          items: [],
          ...buildPaginationMeta(0, page, pageSize)
        });
      }
    }

    // Price range filter is complex - skip for now and filter in JS if needed
    // This is a simplification; a more robust solution would use raw SQL

    const [businesses, total] = await executeWithRetry(() =>
      Promise.all([
        Business.findAll({
          where,
          include: [
            {
              model: BusinessCategory,
              as: 'categories',
              include: [{
                model: PriceRange,
                as: 'priceRanges'
              }]
            },
            {
              model: BusinessHours,
              as: 'businessHours'
            },
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'first_name', 'last_name']
            }
          ],
          limit,
          offset,
          order: [['rating', 'DESC NULLS LAST'], ['name', 'ASC']]
        }),
        Business.count({ where })
      ])
    );

    // Filter by price range in JS if needed
    let filteredBusinesses = businesses;
    if (minPrice || maxPrice) {
      filteredBusinesses = businesses.filter(business => {
        for (const cat of business.categories || []) {
          for (const pr of cat.priceRanges || []) {
            const matchesMin = !minPrice || pr.max_price >= parseInt(minPrice);
            const matchesMax = !maxPrice || pr.min_price <= parseInt(maxPrice);
            if (matchesMin && matchesMax) return true;
          }
        }
        return false;
      });
    }

    // Normalize response
    const items = filteredBusinesses.map(b => normalizeBusiness(b.toJSON()));

    res.status(200).json({
      items,
      ...buildPaginationMeta(total, page, pageSize)
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return handleSequelizeError(error, res, 'Fetching businesses');
  }
}

/**
 * Get distinct categories for filter dropdown
 */
export async function getCategories(req, res) {
  try {
    const categories = await executeWithRetry(() =>
      BusinessCategory.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('category_name')), 'category_name']],
        raw: true
      })
    );

    res.json({
      categories: categories.map(c => c.category_name),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return handleSequelizeError(error, res, 'Fetching categories');
  }
}

/**
 * Normalize business for API response
 */
function normalizeBusiness(business) {
  // Calculate price range across all categories
  let minPrice = null;
  let maxPrice = null;

  for (const cat of business.categories || []) {
    for (const pr of cat.priceRanges || []) {
      if (minPrice === null || pr.min_price < minPrice) minPrice = pr.min_price;
      if (maxPrice === null || pr.max_price > maxPrice) maxPrice = pr.max_price;
    }
  }

  // Parse picture JSON if stored as string
  let coverImage = null;
  let gallery = [];
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
  const hours = {};
  for (const h of business.businessHours || []) {
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
    categories: (business.categories || []).map(c => ({
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
      lng: business.longtitude,
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

function formatTime(time) {
  if (!time) return null;
  if (time instanceof Date) {
    return time.toTimeString().slice(0, 5);
  }
  return time.toString().slice(0, 5);
}
