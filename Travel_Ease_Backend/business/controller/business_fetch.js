import { Business, BusinessCategory, BusinessHours, BusinessReview, MenuItem, PriceRange, User } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

export async function business_fetch(req, res) {
  const { id } = req.params;

  try {
    const business = await executeWithRetry(() =>
      Business.findByPk(parseInt(id), {
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
            model: MenuItem,
            as: 'menuItems',
            where: { is_available: true },
            required: false,
            order: [['category', 'ASC'], ['name', 'ASC']]
          },
          {
            model: BusinessReview,
            as: 'reviews',
            limit: 5,
            order: [['review_date', 'DESC']],
            include: [{
              model: User,
              as: 'user',
              attributes: ['user_id', 'first_name', 'last_name']
            }]
          },
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'first_name', 'last_name', 'email']
          }
        ]
      })
    );

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json(normalizeBusiness(business.toJSON()));
  } catch (error) {
    console.error("Error fetching business:", error);
    return handleSequelizeError(error, res, 'Fetching business');
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

  // Normalize menu items
  const menuItems = (business.menuItems || []).map(item => ({
    id: item.menu_item_id,
    name: item.name,
    description: item.description,
    price: parseFloat(item.price),
    imageUrl: item.image_url,
    category: item.category,
    isAvailable: item.is_available,
  }));

  // Normalize reviews
  const reviews = (business.reviews || []).map(review => ({
    id: review.review_id,
    rating: review.rating ? parseFloat(review.rating) : null,
    content: review.content,
    date: review.review_date,
    user: review.user ? {
      id: review.user.user_id,
      name: `${review.user.first_name} ${review.user.last_name}`.trim(),
    } : null,
  }));

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
    menuItems,
    reviews,
    reviewCount: business.reviews?.length || 0,
    location: {
      lat: business.latitude,
      lng: business.longtitude,
      address: [
        business.house_number,
        business.street,
        business.brgy,
        business.city,
      ].filter(Boolean).join(', '),
      houseNumber: business.house_number,
      street: business.street,
      brgy: business.brgy,
      city: business.city,
    },
    rating: business.rating ? parseFloat(business.rating) : null,
    status: business.status,
    owner: business.user ? {
      id: business.user.user_id,
      name: `${business.user.first_name} ${business.user.last_name}`.trim(),
      email: business.user.email,
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
