import { prisma, executeWithRetry, handlePrismaError } from "../../src/lib/prismaHelpers.js";
import { Request, Response } from "express";

export async function business_fetch(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const business = await executeWithRetry(() =>
      prisma.business.findUnique({
        where: { business_id: parseInt(id) },
        include: {
          categories: {
            include: {
              price_ranges: true
            }
          },
          business_hours: true,
          menu_items: {
            where: { is_available: true },
            orderBy: [{ category: 'asc' }, { name: 'asc' }]
          },
          reviews: {
            take: 5,
            orderBy: { review_date: 'desc' },
            include: {
              user: {
                select: {
                  user_id: true,
                  first_name: true,
                  last_name: true
                }
              }
            }
          },
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      })
    );

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json(normalizeBusiness(business));
  } catch (error) {
    console.error("Error fetching business:", error);
    return handlePrismaError(error, res, 'Fetching business');
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

  // Normalize menu items
  const menuItems = (business.menu_items || []).map((item: any) => ({
    id: item.menu_item_id,
    name: item.name,
    description: item.description,
    price: parseFloat(item.price),
    imageUrl: item.image_url,
    category: item.category,
    isAvailable: item.is_available,
  }));

  // Normalize reviews
  const reviews = (business.reviews || []).map((review: any) => ({
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

function formatTime(time: Date | string): string | null {
  if (!time) return null;
  if (time instanceof Date) {
    return time.toTimeString().slice(0, 5);
  }
  return time.toString().slice(0, 5);
}

