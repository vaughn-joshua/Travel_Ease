/**
 * Business Service
 *
 * Business logic for business/establishment operations extracted from controllers.
 * Controllers should use these functions and handle HTTP request/response.
 */

import { prisma, executeWithRetry } from "../lib/prismaHelpers.js";
import { cacheResult, buildCacheKey, invalidateCache } from "../lib/cache.js";
import type { PaginationParams } from "../types/index.js";

// ============================================================================
// Types / DTOs
// ============================================================================

export interface BusinessDTO {
  id: number;
  name: string;
  description: string | null;
  categories: Array<{ id: number; name: string }>;
  hours: Record<string, { open: string | null; close: string | null }>;
  priceRange: { min: number; max: number } | null;
  media: {
    cover: string | null;
    gallery: string[];
  };
  menuItems: Array<{
    id: number;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    category: string | null;
    isAvailable: boolean;
  }>;
  reviews: Array<{
    id: number;
    rating: number | null;
    content: string | null;
    date: Date | null;
    user: { id: number; name: string } | null;
  }>;
  reviewCount: number;
  location: {
    lat: number | null;
    lng: number | null;
    address: string;
    houseNumber: string | null;
    street: string | null;
    brgy: string | null;
    city: string | null;
  };
  rating: number | null;
  status: boolean | null;
  owner: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface BusinessListItemDTO {
  id: number;
  name: string;
  description: string | null;
  rating: number | null;
  status: boolean | null;
  coverImage: string | null;
  categories: string[];
  location: {
    lat: number | null;
    lng: number | null;
    city: string | null;
  };
}

/**
 * Extended list item DTO with hours and price range for detailed listings
 */
export interface BusinessListItemDetailedDTO {
  id: number;
  name: string;
  description: string | null;
  categories: Array<{ id: number; name: string }>;
  hours: Record<string, { open: string | null; close: string | null }>;
  priceRange: { min: number; max: number } | null;
  media: {
    cover: string | null;
    gallery: string[];
  };
  location: {
    lat: number | null;
    lng: number | null;
    address: string;
  };
  rating: number | null;
  status: boolean | null;
  owner: {
    id: number;
    name: string;
  } | null;
}

export interface CreateBusinessInput {
  name: string;
  house_no?: string;
  street?: string;
  brgy?: string;
  city?: string;
  description?: string;
  lat?: number | string | null;
  lng?: number | string | null;
  secure_url?: string;
  category: string[];
  business_hrs?: Array<{ day: string; start?: string; end?: string }>;
  min_price?: number;
  max_price?: number;
}

export interface UpdateBusinessInput {
  name?: string;
  house_no?: string;
  house_number?: string;
  street?: string;
  brgy?: string;
  city?: string;
  description?: string;
  lat?: number | string;
  lng?: number | string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  status?: boolean;
  secure_url?: string;
  picture?: string;
  category?: string[];
  business_hrs?: Array<{ day: string; start?: string; end?: string }>;
  min_price?: number;
  max_price?: number;
}

export interface BusinessFilters {
  category?: string;
  city?: string;
  search?: string;
  status?: boolean;
}

// ============================================================================
// Select Clauses
// ============================================================================

const BUSINESS_LIST_SELECT = {
  business_id: true,
  name: true,
  description: true,
  rating: true,
  status: true,
  picture: true,
  latitude: true,
  longtitude: true, // Note: DB column has typo
  city: true,
  categories: {
    select: {
      category_name: true,
    },
  },
} as const;

const BUSINESS_DETAIL_SELECT = {
  business_id: true,
  name: true,
  description: true,
  house_number: true,
  street: true,
  brgy: true,
  city: true,
  latitude: true,
  longtitude: true, // Note: DB column has typo
  rating: true,
  status: true,
  picture: true,
  user_id: true,
  min_price: true,
  max_price: true,
  categories: {
    select: {
      category_id: true,
      category_name: true,
    },
  },
  business_hours: true,
  menu_items: {
    where: { is_available: true },
    orderBy: [{ category: "asc" as const }, { name: "asc" as const }],
  },
  reviews: {
    take: 5,
    orderBy: { review_date: "desc" as const },
    include: {
      user: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  },
  user: {
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
    },
  },
} as const;

// ============================================================================
// Formatters
// ============================================================================

/**
 * Format time to HH:MM string
 */
function formatTime(time: Date | string): string | null {
  if (!time) return null;
  if (time instanceof Date) {
    return time.toTimeString().slice(0, 5);
  }
  return time.toString().slice(0, 5);
}

/**
 * Parse picture JSON and extract cover/gallery
 */
function parsePicture(picture: string | null): {
  cover: string | null;
  gallery: string[];
} {
  if (!picture) return { cover: null, gallery: [] };

  try {
    const parsed = typeof picture === "string" ? JSON.parse(picture) : picture;
    if (parsed.secure_url) {
      if (Array.isArray(parsed.secure_url)) {
        return {
          cover: parsed.secure_url[0] || null,
          gallery: parsed.secure_url,
        };
      }
      return {
        cover: parsed.secure_url,
        gallery: [parsed.secure_url],
      };
    }
  } catch {
    return { cover: picture, gallery: [] };
  }

  return { cover: null, gallery: [] };
}

/**
 * Extract price range from business object.
 * Price State Machine:
 *   - both null: price not set
 *   - only min_price set: minimum price known
 *   - only max_price set: maximum price known
 *   - both set: min_price <= max_price (enforced by validation)
 */
function extractPriceRange(
  business: { min_price?: number | null; max_price?: number | null }
): { min: number; max: number } | null {
  if (business.min_price != null && business.max_price != null) {
    return { min: business.min_price, max: business.max_price };
  }
  if (business.min_price != null) {
    return { min: business.min_price, max: business.min_price };
  }
  if (business.max_price != null) {
    return { min: business.max_price, max: business.max_price };
  }
  return null;
}

/**
 * Format raw Prisma business to full DTO
 * @param business - Raw Prisma business object
 */
export function formatBusinessToDTO(business: any): BusinessDTO {
  // Read price range directly from business fields
  const priceRange = extractPriceRange(business);

  const media = parsePicture(business.picture);

  // Normalize hours
  const hours: Record<string, { open: string | null; close: string | null }> =
    {};
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
    user: review.user
      ? {
          id: review.user.user_id,
          name: `${review.user.first_name} ${review.user.last_name}`.trim(),
        }
      : null,
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
    priceRange,
    media,
    menuItems,
    reviews,
    reviewCount: business.reviews?.length || 0,
    location: {
      lat: business.latitude,
      lng: business.longitude,
      address: [
        business.house_number,
        business.street,
        business.brgy,
        business.city,
      ]
        .filter(Boolean)
        .join(", "),
      houseNumber: business.house_number,
      street: business.street,
      brgy: business.brgy,
      city: business.city,
    },
    rating: business.rating ? parseFloat(business.rating) : null,
    status: business.status,
    owner: business.user
      ? {
          id: business.user.user_id,
          name: `${business.user.first_name} ${business.user.last_name}`.trim(),
          email: business.user.email,
        }
      : null,
  };
}

/**
 * Format raw Prisma business to list item DTO
 */
export function formatBusinessListItem(business: any): BusinessListItemDTO {
  const media = parsePicture(business.picture);

  return {
    id: business.business_id,
    name: business.name,
    description: business.description,
    rating: business.rating ? parseFloat(business.rating) : null,
    status: business.status,
    coverImage: media.cover,
    categories: (business.categories || []).map((c: any) => c.category_name),
    location: {
      lat: business.latitude,
      lng: business.longitude,
      city: business.city,
    },
  };
}

/**
 * Format raw Prisma business to detailed list item DTO (includes hours and priceRange)
 * Used by listing endpoints that need more details than the basic list item.
 * @param business - Raw Prisma business object
 */
export function formatBusinessListItemDetailed(
  business: any
): BusinessListItemDetailedDTO {
  // Read price range directly from business fields
  const priceRange = extractPriceRange(business);

  const media = parsePicture(business.picture);

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
    priceRange,
    media: {
      cover: media.cover,
      gallery: media.gallery,
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

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get all businesses with filters and pagination
 */
export async function getBusinesses(
  pagination: PaginationParams,
  filters: BusinessFilters = {}
): Promise<{ data: BusinessListItemDTO[]; total: number }> {
  const where: any = {};

  if (filters.category) {
    where.categories = { some: { category_name: filters.category } };
  }
  if (filters.city) {
    where.city = { contains: filters.city, mode: "insensitive" };
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.status !== undefined) {
    where.status = filters.status;
  }

  const [businesses, total] = await executeWithRetry(() =>
    Promise.all([
      prisma.business.findMany({
        where,
        select: BUSINESS_LIST_SELECT,
        orderBy: [{ rating: "desc" }, { business_id: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.business.count({ where }),
    ])
  );

  const data = businesses.map(formatBusinessListItem);
  return { data, total };
}

/**
 * Get a single business by ID with full details (cached)
 */
export async function getBusinessById(
  businessId: number
): Promise<BusinessDTO | null> {
  const cacheKey = buildCacheKey("business", businessId.toString());

  const result = await cacheResult<BusinessDTO | null>({
    key: cacheKey,
    ttl: 600, // 10 minutes
    fetchFn: async () => {
      const business = await executeWithRetry(() =>
        prisma.business.findUnique({
          where: { business_id: businessId },
          include: {
            categories: {
              select: {
                category_id: true,
                category_name: true,
              },
            },
            business_hours: true,
            menu_items: {
              where: { is_available: true },
              orderBy: [{ category: "asc" }, { name: "asc" }],
            },
            reviews: {
              take: 5,
              orderBy: { review_date: "desc" },
              include: {
                user: {
                  select: {
                    user_id: true,
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
            user: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        })
      );

      if (!business) return null;
      return formatBusinessToDTO(business);
    },
  });

  return result.data;
}

/**
 * Get businesses owned by a user
 */
export async function getBusinessesByOwner(
  userId: number,
  pagination: PaginationParams
): Promise<{ data: BusinessListItemDTO[]; total: number }> {
  const where = { user_id: userId };

  const [businesses, total] = await executeWithRetry(() =>
    Promise.all([
      prisma.business.findMany({
        where,
        select: BUSINESS_LIST_SELECT,
        orderBy: [{ business_id: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.business.count({ where }),
    ])
  );

  const data = businesses.map(formatBusinessListItem);
  return { data, total };
}

/**
 * Create a new business
 */
export async function createBusiness(
  userId: number,
  input: CreateBusinessInput
): Promise<BusinessDTO> {
  const lat = input.lat
    ? typeof input.lat === "string"
      ? parseFloat(input.lat)
      : input.lat
    : null;
  const lng = input.lng
    ? typeof input.lng === "string"
      ? parseFloat(input.lng)
      : input.lng
    : null;

  const result = await prisma.$transaction(async (tx) => {
    // Create business with price range directly on the business
    const business = await tx.business.create({
      data: {
        name: input.name,
        user_id: userId,
        house_number: input.house_no,
        street: input.street,
        brgy: input.brgy,
        city: input.city,
        description: input.description,
        latitude: lat,
        longtitude: lng, // Note: DB column has typo
        picture: input.secure_url
          ? JSON.stringify({ secure_url: input.secure_url })
          : null,
        status: false, // Default to not approved
        min_price: input.min_price ?? null,
        max_price: input.max_price ?? null,
      },
    });

    // Add categories
    if (input.category?.length > 0) {
      for (const categoryName of input.category) {
        await tx.businessCategory.create({
          data: {
            business_id: business.business_id,
            category_name: categoryName as any,
          },
        });
      }
    }

    // Add business hours
    if (input.business_hrs?.length) {
      for (const hours of input.business_hrs) {
        await tx.businessHours.create({
          data: {
            business_id: business.business_id,
            day_of_week: hours.day,
            open_time: hours.start
              ? new Date(`1970-01-01T${hours.start}:00`)
              : null,
            close_time: hours.end
              ? new Date(`1970-01-01T${hours.end}:00`)
              : null,
          },
        });
      }
    }

    return business;
  });

  // Fetch full details to return
  const fullBusiness = await getBusinessById(result.business_id);
  return fullBusiness!;
}

/**
 * Update an existing business
 */
export async function updateBusiness(
  businessId: number,
  input: UpdateBusinessInput
): Promise<BusinessDTO> {
  const updateData: any = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.house_no !== undefined || input.house_number !== undefined) {
    updateData.house_number = input.house_no ?? input.house_number;
  }
  if (input.street !== undefined) updateData.street = input.street;
  if (input.brgy !== undefined) updateData.brgy = input.brgy;
  if (input.city !== undefined) updateData.city = input.city;
  if (input.rating !== undefined) updateData.rating = input.rating;
  if (input.status !== undefined) updateData.status = input.status;

  // Handle coordinates
  const lat = input.lat ?? input.latitude;
  const lng = input.lng ?? input.longitude;
  if (lat !== undefined) {
    updateData.latitude = typeof lat === "string" ? parseFloat(lat) : lat;
  }
  if (lng !== undefined) {
    updateData.longitude = typeof lng === "string" ? parseFloat(lng) : lng;
  }

  // Handle picture
  if (input.secure_url !== undefined || input.picture !== undefined) {
    const pictureUrl = input.secure_url ?? input.picture;
    updateData.picture = pictureUrl
      ? JSON.stringify({ secure_url: pictureUrl })
      : null;
  }

  // Handle price range - write directly to business
  if (input.min_price !== undefined) {
    updateData.min_price = input.min_price;
  }
  if (input.max_price !== undefined) {
    updateData.max_price = input.max_price;
  }

  await executeWithRetry(() =>
    prisma.business.update({
      where: { business_id: businessId },
      data: updateData,
    })
  );

  // Invalidate cache
  await invalidateCache(buildCacheKey("business", businessId.toString()));

  // Fetch and return updated business
  const updated = await getBusinessById(businessId);
  return updated!;
}

/**
 * Delete a business
 */
export async function deleteBusiness(businessId: number): Promise<void> {
  await executeWithRetry(() =>
    prisma.business.delete({
      where: { business_id: businessId },
    })
  );

  // Invalidate cache
  await invalidateCache(buildCacheKey("business", businessId.toString()));
}

/**
 * Check if user owns a business
 */
export async function userOwnsBusiness(
  userId: number,
  businessId: number
): Promise<boolean> {
  const business = await executeWithRetry(() =>
    prisma.business.findFirst({
      where: { business_id: businessId, user_id: userId },
      select: { business_id: true },
    })
  );
  return business !== null;
}

/**
 * Get all business categories
 */
export async function getAllCategories(): Promise<string[]> {
  const result = await cacheResult<string[]>({
    key: "business:categories:all",
    ttl: 3600, // 1 hour
    fetchFn: async () => {
      const categories = await executeWithRetry(() =>
        prisma.businessCategory.findMany({
          distinct: ["category_name"],
          select: { category_name: true },
        })
      );
      return categories.map((c) => c.category_name);
    },
  });
  return result.data;
}

export default {
  formatBusinessToDTO,
  formatBusinessListItem,
  formatBusinessListItemDetailed,
  getBusinesses,
  getBusinessById,
  getBusinessesByOwner,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  userOwnsBusiness,
  getAllCategories,
};
