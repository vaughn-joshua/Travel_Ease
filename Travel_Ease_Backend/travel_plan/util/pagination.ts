/**
 * Common pagination and filtering utilities for travel plan listings
 * Updated for Prisma ORM
 */

interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  limit: number;
  offset: number;
}

interface PlanFilters {
  OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }>;
  location?: { contains: string; mode: 'insensitive' };
  start_date?: { gte?: Date; lte?: Date };
  end_date?: { gte?: Date; lte?: Date };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Parse pagination params from request query
 * @param query - req.query object
 * @returns { page, pageSize, skip, take }
 */
export function parsePagination(query: Record<string, string | undefined>): PaginationParams {
  const page = Math.max(1, parseInt(query.page || '1') || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || '20') || 20));
  const skip = (page - 1) * pageSize;
  return { 
    page, 
    pageSize, 
    skip,
    take: pageSize,
    // Aliases for compatibility
    limit: pageSize,
    offset: skip
  };
}

/**
 * Build common filter conditions for travel plans (Prisma format)
 * @param query - req.query object
 * @returns Prisma where conditions
 */
export function buildPlanFilters(query: Record<string, string | undefined>): PlanFilters {
  const filters: PlanFilters = {};

  // Search by name or description
  if (query.search) {
    filters.OR = [
      { name: { contains: query.search, mode: 'insensitive' as const } },
      { description: { contains: query.search, mode: 'insensitive' as const } }
    ];
  }

  // Filter by location
  if (query.location) {
    filters.location = { contains: query.location, mode: 'insensitive' as const };
  }

  // Date range filters
  if (query.startDateFrom || query.startDateTo) {
    filters.start_date = {};
    if (query.startDateFrom) {
      filters.start_date.gte = new Date(query.startDateFrom);
    }
    if (query.startDateTo) {
      filters.start_date.lte = new Date(query.startDateTo);
    }
  }
  
  if (query.endDateFrom || query.endDateTo) {
    filters.end_date = {};
    if (query.endDateFrom) {
      filters.end_date.gte = new Date(query.endDateFrom);
    }
    if (query.endDateTo) {
      filters.end_date.lte = new Date(query.endDateTo);
    }
  }

  return filters;
}

/**
 * Build response with pagination metadata
 * @param data - Query results
 * @param total - Total count
 * @param pagination - { page, pageSize }
 * @returns Response with data and pagination info
 */
export function paginatedResponse<T>(data: T[], total: number, { page, pageSize }: { page: number; pageSize: number }): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page * pageSize < total,
      hasPrev: page > 1
    }
  };
}

